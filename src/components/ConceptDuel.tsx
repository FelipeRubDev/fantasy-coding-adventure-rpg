"use client";
import {useCallback,useEffect,useRef,useState} from 'react';
import { ArrowLeft,ArrowRight,BookOpen,Brain,Check,ChevronRight,Clock3,Coins,Layers3,RotateCcw,ShieldCheck,Sparkles,Trophy,X,Zap } from 'lucide-react';
import {drawDeck,TOPICS,type Topic,type DrawnCard,type Flashcard} from '@/data/flashcards';
import {useGame} from '@/game/store';
import {addXp} from '@/game/rewards';
import {sfx} from '@/game/audio';
import {fx} from '@/game/fx';
import {FrameCorners,RuneCards} from './Artifacts';
import {Modal} from './ui';

type Mark={card:Flashcard;choice:string|null;right:boolean;points:number;time:number};
type Stage='lobby'|'play'|'feedback'|'finish';
const LIMIT=15000;
export default function ConceptDuel(){
 const {save,go,update,modal}=useGame();
 const [topic,setTopic]=useState<Topic|'Mixto'>('Mixto');const [stage,setStage]=useState<Stage>('lobby');
 const [deck,setDeck]=useState<DrawnCard[]>([]);const [index,setIndex]=useState(0);const [marks,setMarks]=useState<Mark[]>([]);
 const [left,setLeft]=useState(LIMIT);const [practice,setPractice]=useState(false);const [askExit,setAskExit]=useState(false);
 const end=useRef(0),locked=useRef(false),paid=useRef(false),advancing=useRef(false);const marksRef=useRef<Mark[]>([]);
 const card=deck[index];const last=marks[marks.length-1];const points=marks.reduce((v,m)=>v+m.points,0);const hits=marks.filter(m=>m.right).length;const misses=marks.filter(m=>!m.right);
 const start=(errors?:Flashcard[])=>{const group=drawDeck(topic,errors);setDeck(group);setIndex(0);setPractice(!!errors);marksRef.current=[];setMarks([]);setLeft(LIMIT);locked.current=false;paid.current=false;advancing.current=false;end.current=performance.now()+LIMIT;setStage('play');sfx.chest();};
 const answer=useCallback((i:number|null)=>{
  if(stage!=='play'||locked.current||!card)return;
  const remaining=Math.max(0,end.current-performance.now());const chosen=remaining>0?i:null;locked.current=true;
  const right=chosen!==null&&chosen===card.correct;const point=right?100+Math.ceil(remaining/1000)*5:0;
  const m:Mark={card:card.card,choice:chosen===null?null:card.answers[chosen],right,points:point,time:LIMIT-remaining};
  marksRef.current=[...marksRef.current,m];setMarks(marksRef.current);setLeft(remaining);setStage('feedback');
  if(right){sfx.hit();const box=document.querySelector('.duel-book')?.getBoundingClientRect();if(box)fx.burst(box.right-50,box.top+45,'#d5b879',16,120,120);}else sfx.fizzle();
 },[stage,card]);
 useEffect(()=>{if(stage!=='play')return;const tick=()=>{const n=Math.max(0,end.current-performance.now());setLeft(n);if(n<=0)answer(null);};tick();const id=setInterval(tick,100);document.addEventListener('visibilitychange',tick);return()=>{clearInterval(id);document.removeEventListener('visibilitychange',tick);};},[stage,index,answer]);
 const next=useCallback(()=>{
  if(stage!=='feedback'||advancing.current)return;advancing.current=true;
  if(index===deck.length-1){
   if(!paid.current&&!practice){paid.current=true;const list=marksRef.current;const n=list.filter(m=>m.right).length;const score=list.reduce((s,m)=>s+m.points,0);
    update(d=>{d.quiz.games++;d.quiz.correct+=n;d.quiz.best=Math.max(d.quiz.best,score);if(n===5)d.quiz.perfect++; d.score+=score;d.gold+=n*4;addXp(d,n*8);});
   }setStage('finish');sfx.win();if(hits===deck.length)fx.confetti(40);return;
  }
  setIndex(index+1);locked.current=false;advancing.current=false;end.current=performance.now()+LIMIT;setLeft(LIMIT);setStage('play');
 },[stage,index,deck.length,practice,update,hits]);
 useEffect(()=>{if(stage!=='feedback'||askExit||modal)return;const id=setTimeout(next,6500);return()=>clearTimeout(id);},[stage,next,askExit,modal]);
 const leave=()=>{if(stage==='play'||stage==='feedback')setAskExit(true);else go({name:'tavern'});};
 useEffect(()=>{const key=(e:KeyboardEvent)=>{if(e.repeat||askExit||modal||document.querySelector('[role="dialog"]')||e.ctrlKey||e.metaKey||e.altKey)return;if(stage==='play'&&['1','2','3'].includes(e.key)){e.preventDefault();answer(+e.key-1);}if(stage==='feedback'&&e.key==='Enter'){e.preventDefault();next();}if(e.key==='Escape'){e.preventDefault();leave();}};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);});
 return <div className="screen duel-screen"><div className="duel-room"/><div className="duel-page"><button className="text-action" onClick={leave}><ArrowLeft size={15}/> Volver a la taberna</button>
 <div className="duel-mast"><span className="eyebrow"><span className="eyeline"/> JUEGOS DE TABERNA</span><h1>Duelo de conceptos</h1><p>La pluma descansa. Esta vez, tu memoria lanza el hechizo.</p></div>
 {stage==='lobby'&&<section className="duel-book lobby-book"><FrameCorners/><RuneCards/><div className="duel-rules"><span><Layers3/>5 cartas</span><span><Clock3/>15 s por carta</span><span><Brain/>3 opciones</span></div>
 <h2>El desafío de Corvo</h2><p>Lee la descripción o el fragmento de código y reconoce el concepto. Cada acierto da puntos; responder antes aumenta la puntuación.</p>
 <fieldset className="topic-select"><legend>ESCOGE TU MAZO</legend>{(['Mixto',...TOPICS] as const).map(t=><button key={t} className={topic===t?'active':''} onClick={()=>setTopic(t)} aria-pressed={t===topic}>{t}</button>)}</fieldset>
 <button className="gold-action" onClick={()=>start()}><Zap size={16}/> Empezar duelo <ArrowRight size={16}/></button><small className="quiz-best"><Trophy size={14}/> Récord personal: {save?.quiz.best??0} puntos</small></section>}
 {(stage==='play'||stage==='feedback')&&card&&<section className="duel-book active-book" key={card.card.id}><FrameCorners/>
 <div className="quiz-status"><span><Layers3 size={16}/> CARTA {String(index+1).padStart(2,'0')} / {String(deck.length).padStart(2,'0')}</span><b><Sparkles size={14}/>{points} pts</b></div>
 <div className={'quiz-timer '+(left<=5000?'urgent':'')}><div><i style={{transform:`scaleX(${left/LIMIT})`}}/></div><span><Clock3 size={14}/>{Math.ceil(left/1000)} s</span></div>
 <p className="quiz-topic">{practice?'REPASO · ':''}{card.card.topic}</p><h2>{card.card.question}</h2>{card.card.code&&<pre className="question-code">{card.card.code}</pre>}
 <div className="answer-options">{card.answers.map((a,i)=>{const shown=stage==='feedback';const correct=shown&&i===card.correct;const wrong=shown&&last?.choice===a&&!correct;return <button key={a} disabled={shown||askExit} className={correct?'right':wrong?'wrong':''} onClick={()=>answer(i)}><span>{i+1}</span>{a}{correct?<Check/>:wrong?<X/>:<ChevronRight/>}</button>;})}</div>
 {stage==='play'?<small className="quiz-best">Toca una respuesta o pulsa 1, 2 o 3.</small>:<div className={'answer-why '+(last?.right?'right':'wrong')} aria-live="polite"><b>{last?.right?`¡Correcto! +${last.points} puntos`:last?.choice===null?'Tiempo agotado':'No era esa runa'}</b><p>{card.card.explanation}</p><button className="text-action" onClick={next}>{index===deck.length-1?'Ver resultado':'Siguiente carta'} <ArrowRight size={14}/></button></div>}
 </section>}
 {stage==='finish'&&<section className="duel-book duel-finish"><FrameCorners/><div className="trophy-seal"><Trophy size={36}/></div><span className="eyebrow">{practice?'REPASO COMPLETADO':'DUELO COMPLETADO'}</span><h2>{hits===deck.length?'Memoria de leyenda':hits>0?'El saber deja huella':'Cada error es una lección'}</h2><div className="quiz-summary"><div><b>{hits}/{deck.length}</b><span>Aciertos</span></div><div><b>{points}</b><span>Puntos {practice?'de práctica':''}</span></div><div><b>{Math.round(100*hits/deck.length)}%</b><span>Precisión</span></div></div>
 <p className="quiz-payout">{practice?<><BookOpen size={16}/> Repaso sin recompensas adicionales</>:<><Coins size={16}/> +{hits*4} oro <i/> <Sparkles size={16}/> +{hits*8} XP <i/><ShieldCheck size={16}/> Guardado</>}</p>
 {!!misses.length&&<details className="quiz-review"><summary>Repasar {misses.length} {misses.length===1?'concepto':'conceptos'}</summary>{misses.map(m=><div key={m.card.id}><b>{m.card.question}</b><p><Check size={14}/> {m.card.choices[0]}</p><small>{m.card.explanation}</small></div>)}</details>}
 <div className="quiz-end-actions"><button className="gold-action" onClick={()=>start()}><RotateCcw size={15}/> Otro duelo</button>{!!misses.length&&<button className="outline-action" onClick={()=>start(misses.map(m=>m.card))}>Practicar fallos</button>}<button className="text-action" onClick={()=>setStage('lobby')}>Cambiar mazo</button></div></section>}
 {askExit&&<Modal title="¿Abandonar el duelo?" onClose={()=>setAskExit(false)}><p>Las recompensas se guardan al completar el mazo. El reloj sigue corriendo.</p><div className="quiz-end-actions"><button className="gold-action" onClick={()=>setAskExit(false)}>Seguir jugando</button><button className="outline-action" onClick={()=>go({name:'tavern'})}>Salir a la taberna</button></div></Modal>}
 <div className="duel-signoff"><span/>✧<span/></div></div></div>;
}
