"use client";
import { useEffect, useState } from "react";
import { ACHS } from "@/data/achievements";
import { DUNGEONS } from "@/data/dungeons";
import { ITEMS, ITEM_BY_ID, RARITY, SLOT_LABEL, fxText } from "@/data/items";
import { sfx } from "@/game/audio";
import { onToast, type ToastData } from "@/game/bus";
import { fxSum } from "@/game/rewards";
import { useGame } from "@/game/store";
import type { Item, Slot } from "@/lib/types";
import { Modal } from "./ui";

export function Toasts() {
  const [list, setList] = useState<ToastData[]>([]);
  useEffect(
    () =>
      onToast((t) => {
        setList((l) => [...l.slice(-3), t]);
        setTimeout(() => setList((l) => l.filter((x) => x.id !== t.id)), 4600);
      }),
    [],
  );
  return (
    <div className="toasts" aria-live="polite">
      {list.map((t) => (
        <div key={t.id} className={`toast toast-${t.kind}`} style={t.color ? { ["--tc" as string]: t.color } : undefined}>
          <span className="toast-ico">{t.icon ?? "✦"}</span>
          <div>
            <b className="font-display">{t.title}</b>
            {t.text && <small>{t.text}</small>}
          </div>
        </div>
      ))}
    </div>
  );
}

export function ItemCard({ item, equipped, onClick, big }: { item: Item; equipped?: boolean; onClick?: () => void; big?: boolean }) {
  const r = RARITY[item.rarity];
  return (
    <button className={`item ${big ? "item-big" : ""} ${equipped ? "equipped" : ""}`} style={{ ["--rc" as string]: r.color }} onClick={onClick} disabled={!onClick}>
      <span className="item-ico">{item.icon}</span>
      <span className="item-txt">
        <b>{item.name}</b>
        <small style={{ color: r.color }}>
          {r.label} · {SLOT_LABEL[item.slot]}
          {equipped ? " · equipado" : ""}
        </small>
        <small>{fxText(item.fx)}</small>
        {big && <em>{item.desc}</em>}
      </span>
    </button>
  );
}

export function InventoryModal({ onClose }: { onClose: () => void }) {
  const { save, update } = useGame();
  if (!save) return null;
  const fx = fxSum(save);
  const owned = ITEMS.filter((i) => save.items.includes(i.id)).sort((a, b) => RARITY[b.rarity].weight - RARITY[a.rarity].weight);
  const missing = ITEMS.length - owned.length;
  const equip = (slot: Slot, id: string) => {
    sfx.click();
    update((d) => void (d.equip[slot] = d.equip[slot] === id ? undefined : id));
  };
  return (
    <Modal title="🎒 Inventario" onClose={onClose} wide>
      <div className="inv-slots">
        {(["pluma", "armadura", "reliquia"] as Slot[]).map((s) => {
          const it = save.equip[s] ? ITEM_BY_ID[save.equip[s]!] : null;
          return (
            <div key={s} className="inv-slot">
              <small className="font-display">{SLOT_LABEL[s]}</small>
              {it ? <ItemCard item={it} equipped onClick={() => equip(s, it.id)} /> : <div className="item item-empty">Vacío</div>}
            </div>
          );
        })}
      </div>
      <p className="inv-total">{fxText(fx) || "Sin bonificaciones: equipa objetos para mejorar tus recompensas."}</p>
      <div className="inv-cons">
        <span>🧪 Pociones: {save.potions}</span>
        <span>📜 Pergaminos: {save.scrolls}</span>
        <span>🍯 Hidromiel: {save.buff}</span>
      </div>
      <h3 className="font-display sec">
        Colección · {owned.length}/{ITEMS.length}
      </h3>
      <div className="inv-grid">
        {owned.map((it) => (
          <ItemCard key={it.id} item={it} equipped={save.equip[it.slot] === it.id} onClick={() => equip(it.slot, it.id)} />
        ))}
        {Array.from({ length: Math.min(missing, 4) }, (_, i) => (
          <div key={i} className="item item-empty">
            ❔ Por descubrir
          </div>
        ))}
      </div>
      <p className="muted small">Los jefes de mazmorra siempre sueltan un tesoro único. Los encargos y el cofre del buhonero también esconden botín.</p>
    </Modal>
  );
}

export function CodexModal({ onClose }: { onClose: () => void }) {
  const { save } = useGame();
  const [tab, setTab] = useState<"book" | "ach">("book");
  if (!save) return null;
  return (
    <Modal title="📖 Grimorio" onClose={onClose} wide>
      <div className="tabs">
        <button className={tab === "book" ? "on" : ""} onClick={() => setTab("book")}>
          Hechizos aprendidos
        </button>
        <button className={tab === "ach" ? "on" : ""} onClick={() => setTab("ach")}>
          Logros {save.ach.length}/{ACHS.length}
        </button>
      </div>
      {tab === "book" && (
        <div className="codex">
          {DUNGEONS.map((d) => {
            const nodes = d.nodes.filter((n) => save.codex[n.id]?.length);
            if (!nodes.length) return null;
            return (
              <div key={d.id}>
                <h3 className="font-display sec">{d.name}</h3>
                {nodes.map((n) => (
                  <details key={n.id} className="spell">
                    <summary>
                      {save.cleared[n.id] ? "✔" : "◐"} {n.concept}
                    </summary>
                    {save.codex[n.id].map((code, i) => (code ? <pre key={i} className="codeblock">{code}</pre> : null))}
                  </details>
                ))}
              </div>
            );
          })}
          {!Object.keys(save.codex).length && <p className="muted">Aún no has escrito ningún hechizo. Cada código que escribas a mano quedará aquí como recuerdo.</p>}
        </div>
      )}
      {tab === "ach" && (
        <div className="ach-grid">
          {ACHS.map((a) => {
            const on = save.ach.includes(a.id);
            return (
              <div key={a.id} className={`ach ${on ? "on" : ""}`}>
                <span>{on ? a.icon : "🔒"}</span>
                <div>
                  <b>{a.name}</b>
                  <small>{a.desc}</small>
                  <small className="gold">+{a.gold} oro</small>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Modal>
  );
}

export function RankModal({ onClose }: { onClose: () => void }) {
  const { save } = useGame();
  const [rows, setRows] = useState<{ name: string; score: number; level: number }[] | null>(null);
  useEffect(() => {
    fetch("/api/leaderboard", { cache: "no-store" })
      .then((r) => r.json())
      .then((j: { rows: { name: string; score: number; level: number }[] }) => setRows(j.rows))
      .catch(() => setRows([]));
  }, []);
  return (
    <Modal title="🏆 Salón de la Fama" onClose={onClose}>
      {!rows && <p className="muted">Consultando las crónicas…</p>}
      {rows && !rows.length && <p className="muted">Nadie ha dejado su huella todavía. ¡Sé el primero!</p>}
      <ol className="rank">
        {rows?.map((r, i) => (
          <li key={i} className={save && r.name === save.name && r.score === save.score ? "me" : ""}>
            <span className="rk">{["🥇", "🥈", "🥉"][i] ?? i + 1}</span>
            <b>{r.name}</b>
            <small>Nv {r.level}</small>
            <span className="sc">★ {r.score.toLocaleString("es")}</span>
          </li>
        ))}
      </ol>
    </Modal>
  );
}

export function MenuModal({ onClose }: { onClose: () => void }) {
  const { save, toggleSfx, toggleMusic, go } = useGame();
  return (
    <Modal title="☰ Menú" onClose={onClose}>
      <div className="menu-col">
        <button className="btn btn-ghost" onClick={toggleSfx}>
          {save?.sfx === false ? "🔇 Efectos de sonido: no" : "🔊 Efectos de sonido: sí"}
        </button>
        <button className="btn btn-ghost" onClick={toggleMusic}>
          {save?.music ? "🎼 Música ambiente: sí" : "🎼 Música ambiente: no"}
        </button>
        <button
          className="btn btn-ghost"
          onClick={() => {
            onClose();
            go({ name: "hub" });
          }}
        >
          🏕️ Ir al campamento
        </button>
        <button
          className="btn btn-ghost"
          onClick={() => {
            onClose();
            go({ name: "title" });
          }}
        >
          🚪 Pantalla de título (se guarda solo)
        </button>
      </div>
      <p className="muted small">Todo lo que escribes aquí es a mano: el editor rechaza copiar y pegar. Atajos: Ctrl+Enter lanzar · Esc pausa · Alt+1 pista · Alt+2 poción.</p>
    </Modal>
  );
}
