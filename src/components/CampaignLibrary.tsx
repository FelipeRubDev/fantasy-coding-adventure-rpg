"use client";
import {useState,type CSSProperties} from 'react';
import {ArrowLeft,ArrowRight,BookOpen,Check,ChevronDown,ChevronRight,CircleDot,Code2,Compass,Flag,Layers3,Leaf,LockKeyhole,Map as MapIcon,ScrollText,Sparkles,Swords,Timer,Wine,Zap} from 'lucide-react';
import {CAMPAIGNS,LANG_LABEL,ROMAN,type Campaign} from '@/data/dungeons';
import {dungeonProgress,dungeonUnlocked} from '@/game/progress';
import {useGame} from '@/game/store';
import {sfx} from '@/game/audio';
import type {CampaignId} from '@/lib/types';
import {FrameCorners,TagLang,RuneCards} from './Artifacts';
import {Modal} from './ui';

export function TavernInvite({inside=false}:{inside?:boolean}){const {visit}=useGame();return <section className={'tavern-invite '+(inside?'inside':'')}><div className="invite-bg"/><FrameCorners/><div className="invite-illustration"><RuneCards small/></div><div className="invite-copy"><span className="eyebrow"><Wine size={12}/> {inside?'LA MESA DE CORVO':'EN LA TABERNA'} <i className="tiny-badge">NUEVO</i></span><h3>Duelo de conceptos</h3><p>Cinco cartas, tres opciones y quince segundos. ¿Qué tan rápida es tu mente?</p></div><button className="outline-action" onClick={()=>{sfx.click();visit({name:'quiz'});}}><Zap size={15}/> Jugar un duelo <ArrowRight size={15}/></button></section>}
function Dossier({c,close}:{c:Campaign;close:()=>void}){
 const {save,visit}=useGame();
 const first=c.chapters.findIndex(d=>(save?dungeonUnlocked(save,d):d===c.chapters[0]&&c.n!==2)&&(!save||dungeonProgress(save,d)<d.nodes.length));
 const [sel,setSel]=useState(Math.max(0,first));const [lessons,setLessons]=useState(false);const d=c.chapters[sel];const open=save?dungeonUnlocked(save,d):c.n!==2&&sel===0;
 const count=c.chapters.flatMap(d=>d.nodes).reduce((s,n)=>s+(save?.cleared[n.id]?n.rounds.length:save?.prog[n.id]??0),0);
 return <Modal title={`Crónica de la campaña ${ROMAN[c.n-1]}`} onClose={close} wide><article className="book-dossier" style={{'--accent':c.tint} as CSSProperties}><div className="dossier-art" style={{backgroundImage:`url(${c.art})`}}><div/><span className="chapter-medallion">{ROMAN[c.n-1]}</span><span className="dossier-type">{c.tag}</span></div>
 <div className="dossier-intro"><span className="eyebrow">{c.n===4?'EXPEDICIÓN OPCIONAL':'HISTORIA PRINCIPAL'} · CAMPAÑA {ROMAN[c.n-1]}</span><h2>{c.name}</h2><div className="lang-tags">{c.langs.map(l=><TagLang key={l} lang={l}/>)}</div><p>{c.blurb}</p></div>
 <div className="dossier-progress"><span><Flag size={14}/>{count} / {c.count} ejercicios</span><div><i style={{width:count/c.count*100+'%'}}/></div></div>
 <div className="chapter-index"><h3>Capítulos de la campaña</h3>{c.chapters.map((chapter,i)=>{const done=save&&dungeonProgress(save,chapter)===chapter.nodes.length;const unlocked=save?dungeonUnlocked(save,chapter):c.n!==2&&i===0;return <button key={chapter.id} onClick={()=>{setSel(i);setLessons(false);}} className={sel===i?'selected':''} aria-pressed={sel===i}><small>{String(i+1).padStart(2,'0')}</small><span>{chapter.name}<em>{chapter.subtitle}</em></span>{done?<Check size={15}/>:unlocked?<ChevronRight size={15}/>:<LockKeyhole size={13}/>}</button>;})}</div>
 <button className="lesson-list-toggle" onClick={()=>setLessons(!lessons)} aria-expanded={lessons}><ScrollText size={14}/> {lessons?'Ocultar':'Ver'} ejercicios de este capítulo <ChevronDown size={14}/></button>
 {lessons&&<ol className="dossier-lessons">{d.nodes.flatMap(n=>n.rounds.map((ch,i)=><li key={n.id+i}><span>{LANG_LABEL[ch.lang??d.lang]}</span>{ch.title??n.concept+(n.rounds.length>1?` · ${i+1}`:'')}</li>))}</ol>}
 <div className="dossier-foot"><button className="gold-action" disabled={!open} onClick={()=>{sfx.chest();close();visit({name:'dungeon',id:d.id});}}>{open?<MapIcon size={16}/>:<LockKeyhole size={15}/>} {open?'Entrar en la mazmorra':'Capítulo sellado'} {open&&<ArrowRight size={16}/>}</button><p>{!open?(c.n===2&&sel===0?'Completa Las cenizas de Valdrath para desbloquear esta campaña.':'Derrota al jefe de la mazmorra anterior para abrir este capítulo.'):c.n===4?'Ruta independiente. Tu progreso principal se conserva.':c.n===3?'Reto avanzado. Puedes jugarlo sin terminar las campañas anteriores.':'El progreso se guarda al completar cada hechizo.'}</p></div>
 </article></Modal>;
}
export default function CampaignLibrary({atlas=false,initial}:{atlas?:boolean;initial?:CampaignId}){
 const [filter,setFilter]=useState<'Todas'|'Principales'|'Opcional'>('Todas');const [sel,setSel]=useState<CampaignId|null>(initial??null);const {save}=useGame();
 return <section className={'library Section '+(atlas?'atlas-library':'')} id="campanas"><div className="realm-width"><div className="library-heading"><div><p className="eyebrow"><span className="tiny-diamond"/> ATLAS DE AVENTURAS</p><h2>{atlas?'Las campañas del reino':'Elige tu campaña'}</h2></div><div className="library-filters" aria-label="Filtrar campañas">{(['Todas','Principales','Opcional'] as const).map(f=><button key={f} className={filter===f?'active':''} aria-pressed={filter===f} onClick={()=>{sfx.click();setFilter(f);}}>{f}</button>)}</div></div>
 <div className="book-grid">{CAMPAIGNS.filter(c=>filter==='Todas'||(filter==='Opcional'?c.n===4:c.n!==4)).map(c=>{
 const count=c.chapters.flatMap(d=>d.nodes).reduce((s,n)=>s+(save?.cleared[n.id]?n.rounds.length:save?.prog[n.id]??0),0);
 return <button className={'campaign-book book-'+c.n} key={c.n} onClick={()=>{sfx.click();setSel(c.n);}} style={{'--accent':c.tint} as CSSProperties} aria-label={`Explorar campaña ${ROMAN[c.n-1]}: ${c.name}`}>
 <div className="book-cover"><img src={c.art} alt="" decoding="async"/><div className="cover-shade"/><div className="cover-badges"><span className="chapter-medallion">{ROMAN[c.n-1]}</span>{c.n>=3&&<span className={'book-badge '+(c.n===4?'optional':'new')}>{c.n===4?<Leaf size={10}/>:<Sparkles size={10}/>} {c.n===4?'OPCIONAL':'NUEVA'}</span>}</div><div className="cover-line"/></div>
 <div className="book-info"><div className="book-kicker"><span/> CAMPAÑA {ROMAN[c.n-1]}</div><h3>{c.name}</h3><div className="book-lang">{c.n===3?<Layers3/>:c.n===4?<Leaf/>:c.n===1?<ScrollText/>:<Code2/>}<span>{c.n===3?'Pseudocódigo · JS · Java':c.n===1?'Pseudocódigo · JavaScript':c.sub}</span></div><div className="book-foot"><span><BookOpen size={13}/> {c.count} ejercicios</span><span className="book-arrow"><ArrowRight size={15}/></span></div>{count>0&&<span className="book-progress" style={{width:count/c.count*100+'%'}}/>}</div></button>;})}</div>
 {filter!=='Todas'&&<p className="filter-note">{filter==='Opcional'?'Una expedición independiente que puedes explorar en cualquier momento.':'Las tres crónicas de la historia de Valdrath.'}</p>}
 {atlas&&<div className="atlas-note"><Compass size={17}/><span>Explora una campaña para ver sus mazmorras, los conceptos de cada encuentro y tu progreso.</span></div>}
 <TavernInvite/>
 <div className="realm-footer"><span><span className="tiny-diamond"/> CRÓNICAS DEL ESCRIBA</span><i/><small>El reino recuerda cada línea.</small></div>
 </div>{sel&&<Dossier key={sel} c={CAMPAIGNS[sel-1]} close={()=>setSel(null)}/>}</section>;
}
