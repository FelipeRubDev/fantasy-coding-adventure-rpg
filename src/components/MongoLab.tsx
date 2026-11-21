"use client";
import { Database, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { relics } from '@/data/archive-fixtures';
const docs=relics(0);
export default function MongoLab({expected,write}:{expected:unknown;write?:boolean}){
 const [open,setOpen]=useState(false);
 return <div className="mongo-lab"><div className="lab-caption"><Database size={15}/><b>db.reliquias</b><span>Laboratorio local</span></div>
 <p>Cada prueba comienza con una copia nueva. Escribe un comando de MongoDB; no necesitas una conexión externa.</p>
 <details><summary>Ver colección de ejemplo · {docs.length} documentos</summary><pre className="codeblock">{docs.map(d=>JSON.stringify(d,null,1)).join('\n')}</pre></details>
 <button type="button" className="lab-result" onClick={()=>setOpen(!open)} aria-expanded={open}>{write?'Estado esperado después del cambio':'Resultado esperado'}<ChevronDown size={14}/></button>
 {open&&<pre className="codeblock">{JSON.stringify(expected,null,2)}</pre>}
 <small>Se validan también dos colecciones ocultas con otros valores.</small></div>;
}
