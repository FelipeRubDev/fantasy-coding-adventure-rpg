"use client";
import { useEffect, useRef } from "react";
import { fx } from "@/game/fx";
import { GameProvider, useGame } from "@/game/store";
import Battle from "./Battle";
import DungeonMap from "./DungeonMap";
import Hub from "./Hub";
import Hud from "./Hud";
import Intro from "./Intro";
import { CodexModal, InventoryModal, MenuModal, RankModal, Toasts } from "./Overlays";
import Tavern from "./Tavern";
import TitleScreen from "./TitleScreen";
import RealmNav from "./RealmNav";
import ConceptDuel from "./ConceptDuel";

function Shell() {
  const { view, save, modal, setModal } = useGame();
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvas.current) fx.attach(canvas.current);
    return () => fx.detach();
  }, []);

  const world = ["title","hub","quiz","tavern"].includes(view.name);
  const showHud = !!save && !world && view.name !== "intro";
  useEffect(()=>{fx.setAmbient(!world && !matchMedia("(prefers-reduced-motion: reduce)").matches);},[world]);
  const close = () => setModal(null);

  return (
    <>
      <div id="shake-root">
        <div className="app">
          {world && <RealmNav/>}
          {showHud && <Hud />}
          <main className="main">
            {view.name === "title" && <TitleScreen />}
            {view.name === "intro" && <Intro />}
            {view.name === "hub" && <Hub />}
            {view.name === "dungeon" && <DungeonMap key={view.id} id={view.id} />}
            {view.name === "tavern" && <Tavern />}
            {view.name === "quiz" && <ConceptDuel />}
            {view.name === "battle" && <Battle key={view.ref.kind + view.ref.id} target={view.ref} back={view.back} />}
          </main>
        </div>
        {modal === "inv" && <InventoryModal onClose={close} />}
        {modal === "codex" && <CodexModal onClose={close} />}
        {modal === "rank" && <RankModal onClose={close} />}
        {modal === "menu" && <MenuModal onClose={close} />}
        {!world && <div className="vignette" />}
      </div>
      <div id="fx-flash" />
      <canvas ref={canvas} className="fx-canvas" aria-hidden />
      <Toasts />
    </>
  );
}

export default function Game() {
  return (
    <GameProvider>
      <Shell />
    </GameProvider>
  );
}
