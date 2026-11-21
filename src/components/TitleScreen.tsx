"use client";
import {useRef,useState,useEffect} from 'react';
import {ArrowRight,BookOpen,Braces,Compass,Feather,MapPin,ScrollText,Sparkles,Swords} from 'lucide-react';
import {useGame} from '@/game/store';
import {sfx} from '@/game/audio';
import {TOTAL_ROUNDS} from '@/data/dungeons';
import {Modal} from './ui';
import CampaignLibrary from './CampaignLibrary';
import {FieldGuide} from './RealmNav';
import {CodexSeal} from './Artifacts';
export default function TitleScreen(){const {save,newGame,continueGame,modal}=useGame();const [form,setForm]=useState(false);const [guide,setGuide]=useState(false);const [name,setName]=useState('Escriba');const input=useRef<HTMLInputElement>(null);const valid=/^[A-Za-zÀ-ÿ0-9 '-]{1,18}$/.test(name.trim());
 const play=()=>{sfx.click();if(!save)setForm(true);else continueGame();};
 useEffect(()=>{if(form){input.current?.focus();input.current?.select();}},[form]);
 useEffect(()=>{const handle=(e:KeyboardEvent)=>{if(e.key==='Enter'&&!form&&!guide&&!modal&&!document.querySelector('[role="dialog"]')&&(e.target===document.body||e.target===document.documentElement)){e.preventDefault();play();}};window.addEventListener('keydown',handle);return()=>window.removeEventListener('keydown',handle);});
 return <div className="screen portal-home"><section className="realm-hero" aria-labelledby="realm-title"><img className="realm-hero-art" src="/img/valdrath-banner.jpg" alt="Un escriba encapuchado contempla la ciudadela de Valdrath entre las montañas." fetchPriority="high"/><div className="hero-veil"/><div className="hero-bottom-veil"/>
 <div className="realm-width hero-inner"><div className="hero-story"><span className="hero-eyebrow"><span className="eyeline"/><Sparkles size={13}/> RPG DE PROGRAMACIÓN</span><h1 id="realm-title">El Códice<br/><em>Borrado</em></h1><p>Un reino por salvar. Una historia por reescribir.<br/>Convierte tus líneas de código en hechizos.</p><div className="hero-actions"><button className="gold-action" onClick={play}><Swords size={17}/>{save?'Continuar aventura':'Comenzar aventura'}<ArrowRight size={16}/></button><button className="outline-action" onClick={()=>{sfx.click();setGuide(true);}}><BookOpen size={16}/> Cómo jugar</button></div><div className="hero-metrics"><span><Compass/>4 campañas</span><i/><span><ScrollText/>{TOTAL_ROUNDS} ejercicios</span><i/><span><Braces/>4 lenguajes</span></div></div>
 <div className="world-location"><MapPin size={12}/><span>REINO DE VALDRATH</span><i/></div></div><div className="hero-seam"><i/><b>◆</b><i/></div></section>
 <CampaignLibrary/>
 {guide&&<FieldGuide close={()=>setGuide(false)}/>}
 {form&&<Modal title="Una nueva crónica" onClose={()=>setForm(false)}><div className="origin-card"><CodexSeal size={58}/><span className="eyebrow">EL PRIMER CAPÍTULO</span><h2>¿Cuál es tu nombre, escriba?</h2><p>El Silencio lo ha borrado de todas las páginas. Escríbelo una vez más para comenzar.</p></div><form className="name-form" onSubmit={e=>{e.preventDefault();if(valid){sfx.chest();newGame(name.trim());}}}><label htmlFor="hero-name">NOMBRE DEL PERSONAJE</label><input id="hero-name" ref={input} value={name} maxLength={18} autoComplete="off" onChange={e=>setName(e.target.value)}/>{!valid&&<small>Usa de 1 a 18 letras, números, espacios o guiones.</small>}<button className="gold-action" disabled={!valid}><Feather size={16}/> Escribir mi historia <ArrowRight size={15}/></button></form></Modal>}
 </div>;
}
