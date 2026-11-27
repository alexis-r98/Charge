/* Persistance localStorage — une seule clé versionnée. */
const KEY = 'charge-v1';

const DEFAULTS = () => ({
  version: 1,
  settings: {
    kcalTarget: 3500, excluded: [], theme: 'dark', sound: true,
    place: 'gym', // gym | street | home
    equipment: { street: ['bar', 'dips', 'lowbar', 'bench', 'floor'], home: ['floor', 'bench', 'table', 'door'] },
    goalWeight: null,
    excludedFoods: [], // ids de foods.js
    customFoods: [], // aliments saisis librement
  },
  weights: [], // [{ date: 'YYYY-MM-DD', kg }] triés par date
  customRecipes: [],
  day: null, // { date, picks: {breakfast, lunch, gainer, dinner, snack}, eaten: {}, off: {} }
  recentPicks: [], // ids servis les jours précédents (anti-lassitude)
  activeSession: null,
  sessions: [], // séances terminées, ordre chronologique
});

let state = load();
const listeners = new Set();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULTS();
    const data = JSON.parse(raw);
    const d = DEFAULTS();
    return {
      ...d,
      ...data,
      settings: {
        ...d.settings,
        ...(data.settings || {}),
        equipment: { ...d.settings.equipment, ...(data.settings?.equipment || {}) },
      },
      weights: Array.isArray(data.weights) ? data.weights : [],
      customRecipes: Array.isArray(data.customRecipes) ? data.customRecipes : [],
      sessions: Array.isArray(data.sessions) ? data.sessions : [],
      recentPicks: Array.isArray(data.recentPicks) ? data.recentPicks : [],
    };
  } catch {
    return DEFAULTS();
  }
}

let saveTimer = null;
function persist() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(flush, 120);
}
export function flush() {
  clearTimeout(saveTimer);
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (err) {
    console.warn('Sauvegarde impossible', err);
  }
}
window.addEventListener('pagehide', flush);
document.addEventListener('visibilitychange', () => document.hidden && flush());

export const get = () => state;

/** Mutation : fn reçoit l'état et le modifie en place. */
export function update(fn, { silent = false } = {}) {
  fn(state);
  persist();
  if (!silent) listeners.forEach((l) => l(state));
}

export const subscribe = (fn) => (listeners.add(fn), () => listeners.delete(fn));

export function exportJSON() {
  return JSON.stringify(state, null, 2);
}

export function importJSON(text) {
  const data = JSON.parse(text);
  if (!data || typeof data !== 'object' || !('settings' in data)) throw new Error('Fichier non reconnu');
  localStorage.setItem(KEY, JSON.stringify(data));
  state = load();
  listeners.forEach((l) => l(state));
}

export function reset() {
  state = DEFAULTS();
  flush();
  listeners.forEach((l) => l(state));
}
