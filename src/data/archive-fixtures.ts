export interface Relic {
  [key: string]: unknown;
  _id: number; nombre: string; tipo: string; precio: number; stock: number;
  activa: boolean; origen: { zona: string }; runas: string[]; nota?: string;
}
const row = (_id:number, nombre:string, tipo:string, precio:number, stock:number, activa:boolean, zona:string, runas:string[], nota?:string):Relic => ({_id,nombre,tipo,precio,stock,activa,origen:{zona},runas,...(nota ? {nota} : {})});
/** Each trial starts from a fresh copy, including writes and failed attempts. */
export function relics(set=0): Relic[] {
  const a = [
    row(1,"Alba","gema",30,3,true,"Norte",["luz","aire"]),
    row(2,"Umbral","libro",60,2,false,"Sur",["sombra"],"sellado"),
    row(3,"Ascua","gema",15,0,true,"Sur",["fuego","luz"]),
    row(4,"Bruma","sello",40,5,true,"Norte",["aire","luz"],"frágil"),
    row(5,"Marea","libro",25,1,false,"Este",[]),
    row(6,"Vigía","sello",50,4,true,"Oeste",["tierra"]),
  ];
  if (set===1) {
    a[0].precio=12; a[0].activa=false; a[1].stock=0; a[3].runas=["luz","archivo"];
    a[2].precio=50; a[4].tipo="mapa"; a[5].precio=30;
    a.push(row(7,"Nimbo","gema",80,2,true,"Norte",["luz","aire","archivo"],"hallado"));
    return a.reverse();
  }
  if (set===2) {
    a[0].runas=["archivo"]; delete a[1].nota; a[1].precio=30; a[3].precio=50; a[4].activa=true;
    a.push(row(8,"Ámbar","gema",25,0,false,"Sur",["luz","aire"]),row(9,"Sauce","mapa",40,1,false,"Oeste",[]));
    return [a[2],a[4],a[0],a[7],a[5],a[1],a[3],a[6]];
  }
  return a;
}
