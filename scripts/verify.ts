import { DUNGEONS } from '../src/data/dungeons';
import {drawDeck, FLASHCARDS, TOPICS} from '../src/data/flashcards';
import { QUESTS } from '../src/data/quests';
import { runChallenge } from '../src/engine/runner';
import type { Challenge,Lang } from '../src/lib/types';
async function main(){
 let total=0,bad=0;const mix:Record<string,number>={};let mongo=0;
 async function check(label:string,lang:Lang,ch:Challenge){
  total++;const r=await runChallenge(lang,ch.solution.replaceAll('{{name}}','Test'),ch,'Test');
  if(r.status!=='ok'){bad++;console.error(label,r.status,r.message,r.outcomes.filter(o=>!o.pass));}
  if((await runChallenge(lang,ch.starter,ch,'Test')).status==='ok') {bad++;console.error('Starter accepted',label);}
  if(ch.lang==='mongo'&&ch.solution!=='db.reliquias.find({})'&&(await runChallenge(lang,'db.reliquias.find({})',ch,'Test')).status==='ok'){bad++;console.error('Generic query accepted',label);}
 }
 for(const d of DUNGEONS)for(const n of d.nodes)for(const ch of n.rounds){const l=ch.lang??d.lang;await check(n.id+': '+(ch.title??n.concept),l,ch);if(d.campaign===3)mix[l]=(mix[l]??0)+1;if(d.campaign===4&&l==='mongo')mongo++;}
 for(const q of QUESTS)await check(q.id,q.lang,q.ch);
 for(const q of FLASHCARDS)if(new Set(q.choices).size!==3||!q.explanation.trim())bad++;
 for(const topic of ['Mixto',...TOPICS] as const){for(let i=0;i<20;i++){const deck=drawDeck(topic);if(new Set(deck.map(c=>c.card.id)).size!==5||deck.some(c=>c.correct<0||c.answers[c.correct]!==c.card.choices[0]))bad++;}}
 console.log({total,errors:bad,campaignIII:mix,campaignIV:mongo,flashcards:FLASHCARDS.length});if(bad||mongo!==45||Object.values(mix).some(n=>n!==15))process.exitCode=1;
}
main().catch(e=>{console.error(e);process.exitCode=1;});
