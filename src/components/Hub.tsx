"use client";
import CampaignLibrary from './CampaignLibrary';
import {useGame} from '@/game/store';
export default function Hub(){const {view}=useGame();return <div className="screen atlas-screen"><CampaignLibrary atlas initial={view.name==='hub'?view.campaign:undefined}/></div>;}
