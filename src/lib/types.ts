export type Lang = "pseudo" | "js" | "java" | "mongo";
export type CampaignId = 1 | 2 | 3 | 4;
export type Tier = "normal" | "elite" | "miniboss" | "boss";

export interface TestCase {
  fixture?: number;
  afterWrite?: boolean;
  unordered?: boolean;
  /** Expresión a evaluar tras definir el código del jugador (funciones). */
  call?: string;
  /** Resultado esperado de `call`. */
  expect?: unknown;
  /** Entradas para `Leer` (pseudocódigo). */
  input?: (string | number)[];
  /** Salida esperada (líneas) */
  out?: string;
  hidden?: boolean;
}

export interface Req {
  re: string;
  flags?: string;
  msg: string;
  not?: boolean;
}

export interface Challenge {
  lang?: Lang;
  title?: string;
  story: string;
  prompt: string;
  starter: string;
  solution: string;
  tests: TestCase[];
  hints: string[];
  must?: Req[];
}

export interface Monster {
  name: string;
  icon: string;
  hp: number;
  color: string;
  taunt: string;
  defeat: string;
}

export interface MapNode {
  id: string;
  concept: string;
  tier: Tier;
  monster: Monster;
  lore: string;
  rounds: Challenge[];
}

export interface Dungeon {
  id: string;
  n: number;
  campaign: CampaignId;
  lang: Lang;
  name: string;
  subtitle: string;
  blurb: string;
  intro: string;
  outro: string;
  img: string;
  sigItem: string;
  nodes: MapNode[];
}

export interface Quest {
  id: string;
  lang: Lang;
  title: string;
  giver: string;
  flavor: string;
  icon: string;
  name: string;
  gold: number;
  xp: number;
  ch: Challenge;
}

export type Slot = "pluma" | "armadura" | "reliquia";
export type Rarity = "comun" | "poco" | "raro" | "epico" | "legendario";
export interface ItemFx {
  score?: number;
  xp?: number;
  gold?: number;
  guard?: number;
  hp?: number;
  heal?: number;
}
export interface Item {
  id: string;
  name: string;
  icon: string;
  slot: Slot;
  rarity: Rarity;
  fx: ItemFx;
  desc: string;
}

export interface Save {
  v: 1;
  name: string;
  xp: number;
  level: number;
  gold: number;
  hp: number;
  score: number;
  potions: number;
  scrolls: number;
  buff: number;
  cleared: Record<string, { score: number; firstTry: boolean }>;
  prog: Record<string, number>;
  used: Record<string, string[]>;
  codex: Record<string, string[]>;
  items: string[];
  equip: Partial<Record<Slot, string>>;
  ach: string[];
  streak: number;
  bestStreak: number;
  quests: { slot: number; done: string[] };
  quiz: { games: number; correct: number; best: number; perfect: number };
  stats: {
    rounds: number;
    monsters: number;
    firstTry: number;
    hints: number;
    deaths: number;
    questsDone: number;
    fails: number;
  };
  daily: { day: string; streak: number };
  activeCampaign?: CampaignId;
  introSeen: boolean;
  sfx: boolean;
  music: boolean;
}

export interface TestOutcome {
  pass: boolean;
  label: string;
  got?: string;
  want?: string;
  err?: string;
  hidden?: boolean;
}

export interface RunOutcome {
  status: "empty" | "syntax" | "req" | "wrong" | "ok";
  message?: string;
  outcomes: TestOutcome[];
  passed: number;
  total: number;
}
