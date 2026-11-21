import JSON5 from "json5";
import { find, aggregate, Query, updateOne, updateMany } from "mingo";
import { relics } from "@/data/archive-fixtures";
import type { TestCase, TestOutcome } from "@/lib/types";
import { judge } from "./common";

type Doc = Record<string, unknown>;
type Part = { method: string; args: unknown[] };
const opts = { scriptEnabled: false };
const doc = (x: unknown): Doc => {
  if (x === null || typeof x !== "object" || Array.isArray(x)) throw Error("Se esperaba un documento entre llaves { }.");
  return x as Doc;
};
const permitted = new Set("$eq $ne $gt $gte $lt $lte $in $nin $and $or $nor $not $exists $all $size $elemMatch $type $match $project $sort $skip $limit $group $count $unwind $addFields $set $unset $inc $push $pull $addToSet $sum $avg $min $max $multiply $subtract $add $divide $cond $first $last $sortByCount $expr $concat $setUnion $toUpper $ifNull $map $filter".split(" "));
function inspect(v:unknown, depth=0) {
  if (depth>15) throw Error("El documento contiene demasiados niveles.");
  if (typeof v === "number" && !Number.isFinite(v)) throw Error("Usa números finitos.");
  if (!v || typeof v !== "object") return;
  for (const [k,x] of Object.entries(v)) {
    if (k.split('.').some(p=>["__proto__","constructor","prototype"].includes(p))) throw Error("Nombre de campo no admitido.");
    if (k.startsWith('$') && !permitted.has(k)) throw Error(`El operador ${k} no forma parte de este archivo de práctica.`);
    inspect(x,depth+1);
  }
}
function parse(src:string): Part[] {
  if (src.length>12000) throw Error("El pergamino es demasiado largo.");
  let s = src.replace(/^\s*\/\/[^\n]*\n/gm,"").trim().replace(/;\s*$/,"").trim();
  const prefix = /^db\s*\.\s*reliquias\b/.exec(s);
  if (!prefix) throw Error("Empieza con db.reliquias y un método, por ejemplo db.reliquias.find({}).");
  s=s.slice(prefix[0].length); const parts:Part[]=[];
  while (s.trim()) {
    const m=/^\s*\.\s*([A-Za-z]+)\s*\(/.exec(s);
    if (!m) throw Error("Escribe un solo comando. Revisa los puntos y los paréntesis.");
    let end=m[0].length, quote="", escaped=false;
    for (;end<s.length;end++) {
      const c=s[end];
      if (quote) { if (escaped) escaped=false; else if(c==="\\") escaped=true; else if(c===quote) quote=""; }
      else if(c==='"'||c==="'") quote=c;
      else if(c===')') break;
      else if(c==='(') throw Error("Los argumentos deben ser datos, no llamadas a funciones.");
    }
    if(end===s.length) throw Error("Falta cerrar el paréntesis del método.");
    let args:unknown[];
    try { args=JSON5.parse('['+s.slice(m[0].length,end)+']'); } catch { throw Error("Revisa las comas, las llaves y las comillas de los argumentos."); }
    inspect(args); parts.push({method:m[1],args}); s=s.slice(end+1);
    if(parts.length>8) throw Error("Demasiados métodos encadenados.");
  }
  if (!parts.length) throw Error("Falta el método de la colección.");
  return parts;
}
const arity=(p:Part,min:number,max=min)=>{if(p.args.length<min||p.args.length>max) throw Error(`Revisa el número de argumentos de ${p.method}().`);};
function execute(parts:Part[], fixture:number, afterWrite:boolean) {
  const docs:Doc[]=structuredClone(relics(fixture));
  const [p,...chain]=parts; const a=p.args;
  if(p.method!=="find" && chain.length) throw Error("Solo find() admite métodos de cursor en este laboratorio.");
  const filter=()=>doc(a[0]??{});
  switch (p.method) {
    case "find": {arity(p,0,2); const cursor=find(docs,filter(),doc(a[1]??{}),opts);
      for(const part of chain){const n=part.args[0];
        if(part.method==="toArray"){arity(part,0);continue;}
        arity(part,1);
        if(part.method==="sort") cursor.sort(doc(n));
        else if (["limit","skip"].includes(part.method) && typeof n==="number" && Number.isInteger(n) && n>=0 && n<10000) { if(part.method==="skip") cursor.skip(n); else if(n>0) cursor.limit(n); }
        else throw Error("Usa sort(documento), skip(entero) o limit(entero). ");
      }
      if(afterWrite) throw Error("Esta prueba comprueba una modificación, no una lectura.");
      return cursor.all();}
    case "findOne": arity(p,0,2); if(afterWrite)throw Error("Falta modificar el archivo."); return find(docs, filter(),doc(a[1]??{}),opts).limit(1).all()[0]??null;
    case "countDocuments": arity(p,0,1);return find(docs,filter(),{},opts).all().length;
    case "distinct": {arity(p,1,2);if(typeof a[0]!=="string") throw Error("distinct espera el nombre de un campo entre comillas."); const field=a[0];return [...new Set(find<Doc>(docs,doc(a[1]??{}),{},opts).all().flatMap(d=>d[field]??[]))];}
    case "aggregate": {arity(p,1); if(!Array.isArray(a[0])||a[0].length>20) throw Error("aggregate espera un arreglo de etapas (máximo 20). "); if(afterWrite)throw Error("Falta modificar el archivo."); return aggregate(docs,a[0].map(doc),opts);}
    case "updateOne": case "updateMany": {arity(p,2);const change=doc(a[1]); if(!Object.keys(change).every(k=>["$set","$unset","$inc","$push","$addToSet","$pull"].includes(k)))throw Error("Usa un operador de actualización admitido.");
      (p.method==="updateOne"?updateOne:updateMany)(docs,filter(),change,{},opts);break;}
    case "insertMany": case "insertOne": {arity(p,1); if(p.method==="insertMany"&&!Array.isArray(a[0]))throw Error("insertMany recibe un arreglo de documentos.");
      const list=(p.method==="insertOne"?[a[0]]:a[0] as unknown[]).map(doc);for(const record of list){if(record._id===undefined||docs.some(x=>x._id===record._id))throw Error("Cada reliquia nueva necesita un _id único, como indica la misión.");docs.push(record);}break;}
    case "deleteMany": case "deleteOne": {arity(p,1);const q=new Query(filter(),opts);const hits=docs.filter(d=>q.test(d));for(const d of (p.method==="deleteOne"?hits.slice(0,1):hits))docs.splice(docs.indexOf(d),1);break;}
    default: throw Error(`El método ${p.method} no está disponible en este laboratorio.`);
  }
  if(!afterWrite)throw Error("Esta misión pide una consulta de lectura. La colección original no ha cambiado.");
  return docs;
}
function canonical(v:unknown):string {
  if (v && typeof v==='object' && !Array.isArray(v)) return '{'+Object.entries(v).sort(([a],[b])=>a.localeCompare(b)).map(([k,x])=>JSON.stringify(k)+':'+canonical(x)).join(',')+'}';
  return JSON.stringify(v);
}
function ordered(v:unknown){return Array.isArray(v)?v.slice().sort((a,b)=>canonical(a).localeCompare(canonical(b))):v;}
export function mongoRun(code:string,tests:TestCase[]):{syntax?:string;outcomes:TestOutcome[]} {
  try {
    const parts=parse(code);
    return {outcomes:tests.map(t=>{const value=execute(parts,t.fixture??0,!!t.afterWrite);return judge({...t,expect:t.unordered?ordered(t.expect):t.expect},{value:t.unordered?ordered(value):value,out:""});})};
  } catch(e) {return {syntax:`MongoDB · ${e instanceof Error?e.message:"Consulta no válida"}`,outcomes:[]};}
}
