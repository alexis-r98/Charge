/*
 * Figurines d'exercices animées (SVG + SMIL), dessinées en code : aucune image externe,
 * fonctionne hors ligne, suit le thème.
 *
 * Une figure = deux poses (a = départ, b = fin du mouvement). Chaque pose donne
 * la hanche P, l'épaule S et les CIBLES des mains W et des chevilles A ; coudes et
 * genoux sont placés par cinématique inverse (longueurs de segments constantes).
 * Repère : x vers la droite, y vers le bas, sol à y = 108. La figure regarde vers +x
 * (sauf exercices allongés, où la tête est à gauche).
 */
const L = { UA: 16, FA: 15, TH: 21, SH: 21, FOOT: 9, HEAD: 10 };
const GROUND = 108;

const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
const mul = (a, k) => [a[0] * k, a[1] * k];
const len = (a) => Math.hypot(a[0], a[1]);
const rot = (v, deg) => {
  const r = (deg * Math.PI) / 180;
  return [v[0] * Math.cos(r) - v[1] * Math.sin(r), v[0] * Math.sin(r) + v[1] * Math.cos(r)];
};

/** Cinématique inverse 2 segments. s = +1 : articulation tournée dans le sens horaire (à l'écran). */
function ik(root, target, l1, l2, s = 1) {
  const d0 = sub(target, root);
  const dist = len(d0) || 0.001;
  const u = mul(d0, 1 / dist);
  const d = Math.min(Math.max(dist, Math.abs(l1 - l2) + 0.1), l1 + l2 - 0.05);
  const cos = (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d);
  const a = (Math.acos(Math.min(1, Math.max(-1, cos))) * 180) / Math.PI;
  const joint = add(root, mul(rot(u, s * a), l1));
  return [joint, add(root, mul(u, d))];
}

/** Pose → points du squelette. */
function solve(p) {
  if (p.front) return solveFront(p);
  const P = p.P, S = p.S;
  const dir = mul(sub(S, P), 1 / (len(sub(S, P)) || 1));
  const H = add(S, mul(rot(dir, p.hd || 0), L.HEAD));
  const out = { P, S, H };
  [[1, ''], [2, '2']].forEach(([n, k]) => {
    const W = p['W' + k];
    if (W) {
      const [E, Wr] = ik(S, W, L.UA, L.FA, p['eb' + k] ?? p.eb ?? 1);
      out['E' + k] = E; out['W' + k] = Wr;
    }
    const A = p['A' + k];
    if (A) {
      const [K, Ar] = ik(P, A, L.TH, L.SH, p['kb' + k] ?? p.kb ?? -1);
      const ft = ((p['ft' + k] ?? p.ft ?? 90) * Math.PI) / 180;
      out['K' + k] = K; out['A' + k] = Ar;
      out['T' + k] = add(Ar, [Math.sin(ft) * L.FOOT, Math.cos(ft) * L.FOOT]);
    }
  });
  return out;
}

function solveFront(p) {
  const N = p.N || [80, 33], Pv = p.Pv || [80, 63];
  const Sl = [N[0] - 11, N[1] + 2], Sr = [N[0] + 11, N[1] + 2];
  const Hl = [Pv[0] - 6, Pv[1] + 1], Hr = [Pv[0] + 6, Pv[1] + 1];
  const [El, Wl] = ik(Sl, p.Wl, L.UA, L.FA, p.ebl ?? -1);
  const [Er, Wr] = ik(Sr, p.Wr, L.UA, L.FA, p.ebr ?? 1);
  const [Kl, Al] = ik(Hl, p.Al || [76, 105], L.TH, L.SH, 1);
  const [Kr, Ar] = ik(Hr, p.Ar || [84, 105], L.TH, L.SH, -1);
  return { front: true, N, Pv, Sl, Sr, Hl, Hr, El, Wl, Er, Wr, Kl, Al, Kr, Ar, H: [N[0], N[1] - L.HEAD], W: Wr };
}

/* ═════════ Poses ═════════ */
const STAND = { P: [80, 63], S: [80, 33], A: [80, 105], kb: -1, eb: 1 };
const bench = [{ t: 'rect', p: [44, 83, 64, 5] }, { t: 'line', p: [50, 88, 50, GROUND] }, { t: 'line', p: [102, 88, 102, GROUND] }];
const seat = (x, y, back) => [
  { t: 'line', p: [x - 14, y, x + 14, y], w: 5 }, { t: 'line', p: [x, y, x, GROUND] },
  ...(back ? [{ t: 'line', p: back, w: 5 }] : []),
];

const PUSHUP_A = { S: [50, 74], P: [77.6, 85.7], W: [50, 105], eb: -1, A: [116, 102], kb: 1, ft: 20 };
const PUSHUP_B = { S: [38, 96], P: [67.9, 98.3], W: [50, 105], eb: -1, A: [116, 102], kb: 1, ft: 20 };

/** Fait pivoter une pose entière autour d'un point (variantes inclinées / déclinées). */
const turn = (pose, c, deg) => {
  const o = { ...pose };
  for (const k of ['P', 'S', 'W', 'A', 'W2', 'A2']) if (pose[k]) o[k] = add(c, rot(sub(pose[k], c), deg));
  return o;
};

export const PATTERNS = {
  bench: { load: 'plate', props: [...bench], a: { P: [96, 80], S: [66, 80], W: [76, 70], eb: 1, A: [122, 105], kb: -1 }, b: { W: [68, 49] } },
  incline: {
    load: 'db', props: [{ t: 'line', p: [72, 69, 98, 87], w: 5 }, { t: 'line', p: [96, 87, 110, 87], w: 5 }, { t: 'line', p: [100, 87, 100, GROUND] }],
    a: { P: [94, 82], S: [70, 64], W: [80, 58], eb: 1, A: [118, 105], kb: -1 }, b: { W: [73, 35] },
  },
  seatpress: { load: 'handle', props: seat(70, 87, [60, 84, 56, 48]), a: { P: [70, 84], S: [66, 54], W: [71, 58], eb: 1, A: [92, 105], kb: -1 }, b: { W: [96, 56] } },
  seatpull: { load: 'handle', props: seat(70, 87, null).concat([{ t: 'line', p: [92, 62, 96, 82], w: 5 }]), a: { P: [70, 84], S: [72, 54], W: [97, 58], eb: 1, A: [92, 105], kb: -1 }, b: { S: [67, 54], W: [74, 60] } },
  seatedpress: { load: 'db', props: seat(72, 87, [62, 84, 60, 46]), a: { P: [72, 84], S: [70, 54], W: [77, 46], eb: 1, A: [94, 105], kb: -1 }, b: { W: [72, 23] } },
  cablerow: {
    load: 'handle', cable: [124, 92], props: [{ t: 'rect', p: [48, 100, 40, 4] }, { t: 'line', p: [112, 86, 115, 104], w: 4 }],
    a: { P: [66, 98], S: [70, 68], W: [106, 72], eb: 1, A: [110, 96], kb: -1, ft: 160 }, b: { S: [62, 68], W: [72, 74] },
  },
  pulldown: {
    load: 'handle', cable: [82, -14], props: [...seat(76, 89, null), { t: 'rect', p: [90, 74, 12, 5] }],
    a: { P: [76, 86], S: [76, 56], W: [81, 26], eb: 1, A: [100, 105], kb: -1 }, b: { W: [86, 58] },
  },
  pullup: {
    load: 'none', props: [{ t: 'bar', p: [84, -6] }],
    a: { P: [79, 54], S: [80, 24], W: [84, -6], eb: 1, A: [70, 94], kb: -1, ft: 20 }, b: { P: [79, 34], S: [80, 4], A: [70, 74] },
  },
  inverted: {
    load: 'none', props: [{ t: 'bar', p: [60, 64] }, { t: 'line', p: [50, 60, 50, GROUND], w: 2 }],
    a: { S: [60, 95], P: [89.7, 99.5], W: [60, 64], eb: 1, A: [126, 105], kb: -1, ft: 10 }, b: { S: [54, 71], P: [81, 84] },
  },
  bentrow: { load: 'plate', a: { P: [72, 60], S: [100, 50], W: [100, 81], eb: 1, A: [80, 105], kb: -1 }, b: { W: [88, 66] } },
  facepull: {
    load: 'handle', cable: [138, 30],
    a: { ...STAND, P: [78, 63], S: [78, 33], W: [108, 36], A: [80, 105], A2: [70, 105] }, b: { W: [90, 27] },
  },
  shrug: { load: 'db', a: { ...STAND, W: [82, 64] }, b: { S: [80, 27], W: [82, 58] } },
  curl: { load: 'db', a: { ...STAND, W: [83, 64] }, b: { W: [93, 40] } },
  pushdown: { load: 'handle', cable: [100, -14], a: { ...STAND, P: [78, 63], S: [81, 33], W: [93, 46], A: [78, 105] }, b: { W: [86, 63] } },
  skull: { load: 'db', props: [...bench], a: { P: [96, 80], S: [66, 80], W: [56, 66], eb: 1, A: [122, 105], kb: -1 }, b: { W: [68, 49] } },
  overheadext: { load: 'db', a: { ...STAND, W: [72, 24] }, b: { W: [82, 2] } },
  ohp: { load: 'plate', a: { ...STAND, W: [86, 32] }, b: { W: [81, 2] } },
  pullover: { load: 'handle', cable: [132, -14], a: { ...STAND, P: [78, 63], S: [86, 34], W: [110, 9], A: [78, 105] }, b: { W: [95, 62] } },
  dips: {
    load: 'none', props: [{ t: 'line', p: [52, 63, 112, 63], w: 3 }, { t: 'line', p: [56, 63, 56, GROUND], w: 2 }, { t: 'line', p: [108, 63, 108, GROUND], w: 2 }],
    a: { S: [80, 31], P: [70.7, 59.5], W: [80, 62], eb: 1, A: [52, 82], kb: -1, ft: -30 }, b: { S: [95, 45], P: [78, 70], A: [60, 92] },
  },
  benchdips: {
    load: 'none', props: [{ t: 'rect', p: [30, 80, 30, 5] }, { t: 'rect', p: [94, 82, 30, 5] }, { t: 'line', p: [36, 85, 36, GROUND] }, { t: 'line', p: [118, 87, 118, GROUND] }],
    a: { S: [58, 47], P: [60, 77], W: [56, 79], eb: 1, A: [102, 80], kb: -1, ft: 170 }, b: { S: [67, 61], P: [68, 91] },
  },
  pushup: { load: 'none', a: PUSHUP_A, b: PUSHUP_B },
  pushupIncline: { load: 'none', props: [{ t: 'benchAt', at: 'W' }], a: turn(PUSHUP_A, [116, 102], 16), b: turn(PUSHUP_B, [116, 102], 16) },
  pushupDecline: { load: 'none', props: [{ t: 'benchAt', at: 'A' }], a: turn(PUSHUP_A, [50, 105], -12), b: turn(PUSHUP_B, [50, 105], -12) },
  pike: { load: 'none', a: { S: [66, 82], P: [86, 60], W: [54, 105], eb: 1, A: [106, 103], kb: 1, ft: 30 }, b: { S: [64, 96], P: [86, 74] } },
  handstand: {
    load: 'none', props: [{ t: 'line', p: [92, -14, 92, GROUND], w: 3 }],
    a: { S: [76, 74], P: [78, 44], W: [76, 105], eb: 1, A: [82, 2], kb: 1, ft: 180 }, b: { S: [72, 93], P: [77, 63], A: [82, 21] },
  },
  planche: { load: 'none', a: { ...PUSHUP_A, S: [60, 74], P: [87, 87], W: [60, 105], A: [124, 102] }, b: { S: [46, 77], P: [73, 89], W: [60, 105], A: [110, 102] } },
  fly: { load: 'handle', front: true, a: { front: true, Wl: [40, 30], Wr: [120, 30], ebl: 1, ebr: -1 }, b: { front: true, Wl: [86, 52], Wr: [74, 52], ebl: 1, ebr: -1 } },
  latraise: { load: 'db', front: true, a: { front: true, Wl: [65, 64], Wr: [95, 64] }, b: { front: true, Wl: [42, 36], Wr: [118, 36] } },
  abductor: { load: 'none', front: true, a: { front: true, Wl: [66, 66], Wr: [94, 66], Al: [76, 105], Ar: [84, 105] }, b: { front: true, Wl: [66, 66], Wr: [94, 66], Al: [60, 102], Ar: [100, 102] } },
  squat: { load: 'back', a: { ...STAND, W: [74, 34], A: [82, 105] }, b: { P: [64, 86], S: [83, 63], W: [77, 64], A: [82, 105] } },
  goblet: { load: 'db', a: { ...STAND, W: [90, 44], A: [82, 105] }, b: { P: [64, 88], S: [80, 63], W: [93, 70], A: [82, 105] } },
  legpress: {
    load: 'none', props: [{ t: 'line', p: [30, 64, 54, 92], w: 5 }, { t: 'line', p: [52, 92, 66, 92], w: 5 }, { t: 'line', p: [72, 104, 124, 44], w: 2 }, { t: 'platform', at: 'A' }],
    a: { P: [58, 86], S: [36, 66], W: [62, 88], eb: 1, A: [91, 58], kb: -1, ft: 160 }, b: { A: [76, 67] },
  },
  lunge: { load: 'db', a: { P: [80, 62], S: [80, 32], W: [81, 63], eb: 1, A: [100, 105], kb: -1, A2: [56, 100], kb2: -1, ft2: 60 }, b: { P: [80, 80], S: [81, 50], W: [82, 81] } },
  bulgarian: {
    load: 'db', props: [{ t: 'rect', p: [28, 84, 32, 5] }, { t: 'line', p: [34, 89, 34, GROUND] }],
    a: { P: [80, 62], S: [80, 32], W: [81, 63], eb: 1, A: [96, 105], kb: -1, A2: [50, 82], kb2: -1, ft2: -90 }, b: { P: [76, 80], S: [80, 50], W: [82, 81] },
  },
  stepup: {
    load: 'none', props: [{ t: 'rect', p: [88, 86, 32, 22] }],
    a: { P: [80, 62], S: [82, 32], W: [82, 63], eb: 1, A: [100, 85], kb: -1, A2: [74, 105], kb2: -1 }, b: { P: [96, 44], S: [97, 14], W: [97, 45], A: [100, 85], A2: [92, 70] },
  },
  pistol: {
    load: 'none', a: { ...STAND, W: [86, 64], A2: [90, 102], kb2: -1 }, b: { P: [66, 88], S: [88, 66], W: [112, 62], A: [80, 105], A2: [110, 84], kb2: 1 },
  },
  sissy: { load: 'none', a: { ...STAND, W: [96, 40], ft: 60 }, b: { P: [92, 80], S: [76, 52], W: [98, 52], A: [80, 100], ft: 40 } },
  hinge: { load: 'plate', a: { ...STAND, W: [82, 64], A: [79, 105] }, b: { P: [68, 61], S: [97, 53], W: [98, 84], A: [79, 105] } },
  slrdl: { load: 'db', a: { ...STAND, W: [82, 64], A2: [80, 105] }, b: { P: [72, 62], S: [101, 54], W: [102, 85], A2: [34, 58], kb2: 1, ft2: 0 } },
  hipthrust: {
    load: 'hip', props: [{ t: 'rect', p: [34, 83, 26, 5] }, { t: 'line', p: [40, 88, 40, GROUND] }],
    a: { S: [54, 80], P: [72, 99], W: [76, 96], eb: 1, A: [104, 105], kb: -1 }, b: { S: [54, 79], P: [82, 80], W: [82, 77] },
  },
  bridge: { load: 'none', a: { S: [48, 101], P: [76, 104], W: [62, 105], eb: -1, A: [102, 105], kb: -1 }, b: { P: [77, 88] } },
  legext: { load: 'pad', props: seat(70, 85, [60, 82, 64, 48]), a: { P: [72, 82], S: [68, 52], W: [74, 84], eb: 1, A: [93, 103], kb: -1 }, b: { A: [112, 80] } },
  legcurl: { load: 'pad', props: seat(70, 85, [60, 82, 64, 48]), a: { P: [72, 82], S: [68, 52], W: [74, 84], eb: 1, A: [112, 82], kb: -1 }, b: { A: [86, 102] } },
  legcurlProne: {
    load: 'pad', props: [{ t: 'rect', p: [34, 85, 72, 5] }, { t: 'line', p: [44, 90, 44, GROUND] }, { t: 'line', p: [98, 90, 98, GROUND] }],
    a: { S: [46, 80], P: [76, 81], W: [36, 92], eb: -1, A: [118, 81], kb: 1, ft: 180 }, b: { A: [92, 60] },
  },
  nordic: { load: 'none', props: [{ t: 'rect', p: [56, 100, 18, 6] }], a: { P: [90, 82], S: [90, 52], W: [96, 72], eb: 1, A: [66, 104], kb: -1, ft: -90 }, b: { P: [106, 93], S: [132, 80], W: [140, 98] } },
  revnordic: { load: 'none', a: { P: [80, 82], S: [80, 52], W: [86, 64], eb: 1, A: [58, 104], kb: -1, ft: -90 }, b: { P: [68, 86], S: [50, 62], W: [62, 70] } },
  calf: { load: 'db', props: [{ t: 'rect', p: [76, 101, 28, 7] }], a: { P: [80, 58], S: [80, 28], W: [82, 59], eb: 1, A: [80, 100], kb: -1, ft: 100 }, b: { P: [80, 51], S: [80, 21], W: [82, 52], A: [80, 93], ft: 25 } },
  legraise: { load: 'none', props: [{ t: 'bar', p: [84, -6] }], a: { P: [80, 55], S: [80, 25], W: [84, -6], eb: 1, A: [80, 97], kb: -1, ft: 20 }, b: { A: [122, 52], ft: 90 } },
  kneeraise: { load: 'none', props: [{ t: 'bar', p: [84, -6] }], a: { P: [80, 55], S: [80, 25], W: [84, -6], eb: 1, A: [80, 97], kb: -1, ft: 20 }, b: { A: [100, 72], ft: 40 } },
  lsit: { load: 'none', props: [{ t: 'line', p: [60, 72, 104, 72], w: 3 }, { t: 'line', p: [64, 72, 64, GROUND], w: 2 }], a: { P: [80, 70], S: [80, 40], W: [82, 72], eb: 1, A: [122, 70], kb: -1, ft: 170 }, b: { P: [80, 68], S: [80, 38], A: [122, 66] } },
  crunch: { load: 'handle', cable: [90, -14], a: { P: [80, 82], S: [82, 52], W: [88, 47], eb: 1, A: [58, 104], kb: -1, ft: -90 }, b: { P: [78, 84], S: [104, 72], W: [108, 63] } },
  plank: { load: 'none', a: { S: [50, 91], P: [80, 96], W: [66, 105], eb: 1, A: [118, 104], kb: 1, ft: 20 }, b: { S: [50, 90], P: [80, 94] } },
  hollow: { load: 'none', a: { S: [60, 99], P: [88, 104], W: [32, 94], eb: -1, A: [128, 96], kb: 1, ft: 120 }, b: { S: [60, 96], W: [33, 89], A: [128, 92] } },
  wallsit: { load: 'none', props: [{ t: 'line', p: [54, 20, 54, GROUND], w: 3 }], a: { P: [60, 80], S: [60, 50], W: [76, 77], eb: 1, A: [82, 105], kb: -1 }, b: { P: [60, 81], S: [60, 51] } },
  hang: { load: 'none', props: [{ t: 'bar', p: [84, -6] }], a: { P: [80, 55], S: [80, 25], W: [84, -6], eb: 1, A: [79, 97], kb: -1, ft: 20 }, b: { P: [80, 50], S: [80, 20], A: [79, 92] } },
  prone: { load: 'none', a: { S: [56, 100], P: [86, 102], W: [30, 103], eb: 1, A: [126, 104], kb: 1, ft: 170 }, b: { S: [56, 97], W: [34, 90], A: [126, 99] } },
};

/* Exercice → [motif, charge]. Charge : plate (barre), db (haltère), handle (poignée / câble), back (barre sur le dos), hip, pad, none. */
const MAP = {
  'bench-bb': ['bench', 'plate'], 'smith-bench': ['bench', 'plate'], 'bench-db': ['bench', 'db'], 'incline-db': ['incline', 'db'], 'mx-incline': ['incline', 'handle'],
  'mx-chest': ['seatpress'], 'dips-chest': ['dips'], 'dips-neg': ['dips'], 'dips-weighted': ['dips'], 'bar-dips': ['dips'], 'dips-tri': ['dips'], 'mx-dip': ['dips'],
  'mx-fly': ['fly', 'handle'], 'cable-cross': ['fly', 'handle'], 'incline-fly': ['fly', 'db'], 'trx-fly': ['fly', 'none'],
  pushups: ['pushupDecline'], 'pu-incline': ['pushupIncline'], 'pu-standard': ['pushup'], 'pu-decline': ['pushupDecline'], 'pu-archer': ['pushup'],
  'pu-pseudo': ['pushup'], 'pu-wide': ['pushup'], 'pu-deficit': ['pushup'], 'pu-clap': ['pushup'], 'pu-diamond': ['pushup'], 'pu-sphinx': ['plank'],
  'bar-tri-ext': ['pushupIncline'],
  ohp: ['ohp', 'plate'], 'db-shoulder': ['seatedpress', 'db'], 'mx-shoulder': ['seatedpress', 'handle'],
  pike: ['pike'], 'pike-elev': ['pike'], 'pike-iso': ['pike'], 'hspu-neg': ['handstand'], 'hspu-wall': ['handstand'], 'wall-hs': ['handstand', 'none', true],
  'planche-lean': ['planche'],
  'lat-db': ['latraise', 'db'], 'lat-cable': ['latraise', 'handle'], 'mx-lat': ['latraise', 'none'], 'band-lat': ['latraise', 'none'],
  'tri-rope': ['pushdown'], 'tri-bar': ['pushdown'], 'band-pushdown': ['pushdown', 'none'], skull: ['skull'], 'tri-overhead': ['overheadext'], 'bench-dips': ['benchdips'],
  pullup: ['pullup'], chinup: ['pullup'], 'neutral-pullup': ['pullup'], 'mx-assist': ['pullup'], 'pu-scap': ['hang'], 'pullup-neg': ['pullup'],
  'pullup-weighted': ['pullup'], 'pullup-archer': ['pullup'], 'pullup-wide': ['pullup'], 'pullup-commando': ['pullup'], 'chinup-close': ['pullup'],
  'mx-pulldown': ['pulldown'], 'pulldown-close': ['pulldown'], 'pullover-cable': ['pullover'], 'door-row': ['inverted'], 'floor-lat': ['prone'],
  'row-bb': ['bentrow', 'plate'], 'tbar': ['bentrow', 'plate'], 'row-db': ['bentrow', 'db'], 'mx-row': ['seatpull'], 'cable-row': ['cablerow'],
  inverted: ['inverted'], 'row-vertical': ['inverted'], 'row-elevated': ['inverted'], 'row-archer': ['inverted'], 'table-row': ['inverted'], 'door-row-uni': ['inverted'],
  'fl-tuck': ['kneeraise'],
  facepull: ['facepull'], 'mx-reverse-fly': ['facepull'], 'db-reverse-fly': ['bentrow', 'db'], shrugs: ['shrug'], 'row-wide-rear': ['inverted'],
  'bw-facepull': ['inverted'], ytw: ['prone'], 'band-facepull': ['facepull', 'none'], 'door-reverse-fly': ['facepull', 'none'],
  'curl-ez': ['curl', 'plate'], 'curl-incline': ['curl', 'db'], hammer: ['curl', 'db'], 'mx-curl': ['curl', 'handle'], 'curl-cable': ['curl', 'handle'],
  'bw-curl': ['inverted'], 'towel-curl': ['curl', 'none'], 'band-curl': ['curl', 'none'], 'table-curl': ['inverted'],
  hang: ['hang'], 'dead-hang': ['hang', 'none', true],
  squat: ['squat'], 'smith-squat': ['squat'], hack: ['squat'], 'jump-squat': ['squat', 'none'], goblet: ['goblet'],
  'leg-press-45': ['legpress'], 'mx-leg-press': ['legpress'], bulgarian: ['bulgarian'], 'bulgarian-bw': ['bulgarian', 'none'],
  lunges: ['lunge'], 'lunge-walk': ['lunge', 'none'], 'split-squat': ['lunge', 'none'], cossack: ['lunge', 'none'], 'step-up': ['stepup'],
  pistol: ['pistol'], 'pistol-box': ['pistol'], 'pistol-full': ['pistol'], 'pistol-weighted': ['pistol'], shrimp: ['pistol'],
  'sissy-bw': ['sissy'], 'reverse-nordic': ['revnordic'], 'wall-sit': ['wallsit', 'none', true], 'mx-leg-ext': ['legext'],
  rdl: ['hinge'], 'sl-rdl': ['slrdl', 'none'], 'hip-thrust': ['hipthrust'], 'sl-hip-thrust': ['hipthrust', 'none'], 'sl-bridge': ['bridge'],
  'slide-curl': ['bridge'], 'bar-leg-curl': ['bridge'], 'mx-abductor': ['abductor'], 'mx-seated-curl': ['legcurl'], 'mx-prone-curl': ['legcurlProne'],
  nordic: ['nordic'], 'nordic-full': ['nordic'],
  'calf-smith': ['calf', 'none'], 'calf-press': ['calf', 'none'], 'mx-calf-seated': ['calf', 'none'], 'calf-single': ['calf', 'none'], 'calf-bw': ['calf', 'none'],
  'hanging-raise': ['legraise'], 'toes-to-bar': ['legraise'], 'knee-raise': ['kneeraise'], captain: ['kneeraise'], 'cable-crunch': ['crunch'], 'mx-ab': ['crunch', 'none'],
  'l-sit': ['lsit', 'none', true], hollow: ['hollow', 'none', true], 'dragon-flag': ['hollow'], plank: ['plank', 'none', true],
};
const GROUP_DEFAULT = {
  chestC: 'bench', chestI: 'fly', shoulderC: 'seatedpress', shoulderI: 'latraise', triceps: 'pushdown', backV: 'pulldown', backH: 'bentrow',
  rear: 'facepull', biceps: 'curl', grip: 'hang', quadC: 'squat', quadI: 'legext', hinge: 'hinge', hamI: 'legcurl', glute: 'hipthrust', calves: 'calf', abs: 'crunch',
};

export const figureOf = (ex) => {
  const m = MAP[ex.id];
  return { name: m?.[0] || GROUP_DEFAULT[ex.g] || 'curl', load: m?.[1], still: !!m?.[2] };
};

/* ═════════ Rendu SVG ═════════ */
const f1 = (n) => Math.round(n * 10) / 10;
const pts = (list) => list.map((p) => `${f1(p[0])},${f1(p[1])}`).join(' ');
const reduceMotion = () => {
  try {
    if (/[?&]motion=on/.test(location.search)) return false;
    return matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch { return false; }
};

/** Chaînes de segments d'une pose résolue. */
function chains(s) {
  if (s.front) {
    return {
      torso: [s.Sl, s.N, s.Sr, s.N, s.Pv, s.Hl, s.Pv, s.Hr],
      arm: [s.Sr, s.Er, s.Wr], arm2: [s.Sl, s.El, s.Wl],
      leg: [s.Hr, s.Kr, s.Ar], leg2: [s.Hl, s.Kl, s.Al],
    };
  }
  return {
    torso: [s.P, s.S],
    arm: s.W ? [s.S, s.E, s.W] : null, arm2: s.W2 ? [s.S, s.E2, s.W2] : null,
    leg: s.A ? [s.P, s.K, s.A, s.T] : null, leg2: s.A2 ? [s.P, s.K2, s.A2, s.T2] : null,
  };
}

const SPLINE = 'calcMode="spline" keyTimes="0;0.5;1" keySplines=".45 0 .55 1;.45 0 .55 1"';
const anim = (attr, a, b, dur) => (a === b ? '' : `<animate attributeName="${attr}" values="${a};${b};${a}" dur="${dur}s" repeatCount="indefinite" ${SPLINE}/>`);

/**
 * SVG d'un exercice. opts.size : 'sm' (vignette) | 'lg'.
 * Sans animation (reduced-motion ou figure statique) : pose finale pleine + pose de départ en filigrane.
 */
/** Cadre serré autour du mouvement (vignettes), carré, sans sortir de la scène. */
function cropBox(ca, cb, A, B, pat, ratio = 1) {
  const all = [];
  for (const c of [ca, cb]) for (const k of Object.keys(c)) if (c[k]) all.push(...c[k]);
  for (const s of [A, B]) all.push([s.H[0] - 7, s.H[1] - 7], [s.H[0] + 7, s.H[1] + 7]);
  for (const p of pat.props || []) if (p.t === 'bar') all.push([p.p[0] - 6, p.p[1] - 4], [p.p[0] + 6, p.p[1] + 4]);
  let x0 = Math.min(...all.map((p) => p[0])) - 9, x1 = Math.max(...all.map((p) => p[0])) + 9;
  let y0 = Math.min(...all.map((p) => p[1])) - 9, y1 = Math.min(GROUND + 3, Math.max(...all.map((p) => p[1])) + 9);
  let w = x1 - x0, h = y1 - y0;
  if (w / h < ratio) { const nw = h * ratio; x0 -= (nw - w) / 2; w = nw; } else { const nh = w / ratio; y0 -= (nh - h) / 2; h = nh; }
  return `${f1(x0)} ${f1(y0)} ${f1(w)} ${f1(h)}`;
}

export function figureSVG(ex, { label = true, crop = false } = {}) {
  const { name, load: loadOverride, still } = figureOf(ex);
  const pat = PATTERNS[name];
  if (!pat) return '';
  const load = loadOverride ?? pat.load;
  const A = solve(pat.a);
  const B = solve({ ...pat.a, ...pat.b });
  const ca = chains(A), cb = chains(B);
  const dur = 2.8;
  const moving = !still && !reduceMotion();

  const poly = (key, cls) => {
    if (!ca[key]) return '';
    const pa = pts(ca[key]), pb = pts(cb[key]);
    if (moving) return `<polyline class="${cls}" points="${pa}">${anim('points', pa, pb, dur)}</polyline>`;
    return `${pa !== pb ? `<polyline class="${cls} ghost" points="${pa}"/>` : ''}<polyline class="${cls}" points="${pb}"/>`;
  };
  const dot = (key, r, cls, offset = [0, 0]) => {
    const a = add(A[key], offset), b = add(B[key], offset);
    if (moving) return `<circle class="${cls}" r="${r}" cx="${f1(a[0])}" cy="${f1(a[1])}">${anim('cx', f1(a[0]), f1(b[0]), dur)}${anim('cy', f1(a[1]), f1(b[1]), dur)}</circle>`;
    return `<circle class="${cls}" r="${r}" cx="${f1(b[0])}" cy="${f1(b[1])}"/>`;
  };
  const seg = (from, key, cls) => {
    const b = B[key], a = A[key];
    if (moving) return `<line class="${cls}" x1="${from[0]}" y1="${from[1]}" x2="${f1(a[0])}" y2="${f1(a[1])}">${anim('x2', f1(a[0]), f1(b[0]), dur)}${anim('y2', f1(a[1]), f1(b[1]), dur)}</line>`;
    return `<line class="${cls}" x1="${from[0]}" y1="${from[1]}" x2="${f1(b[0])}" y2="${f1(b[1])}"/>`;
  };

  const props = (pat.props || []).map((p) => {
    if (p.t === 'line') return `<line class="prop" x1="${p.p[0]}" y1="${p.p[1]}" x2="${p.p[2]}" y2="${p.p[3]}" stroke-width="${p.w || 2.5}"/>`;
    if (p.t === 'rect') return `<rect class="prop-fill" x="${p.p[0]}" y="${p.p[1]}" width="${p.p[2]}" height="${p.p[3]}" rx="1.5"/>`;
    if (p.t === 'bar') return '';
    if (p.t === 'benchAt') {
      const at = A[p.at];
      return `<rect class="prop-fill" x="${f1(at[0] - 14)}" y="${f1(at[1] + 2)}" width="28" height="5" rx="1.5"/>
        <line class="prop" x1="${f1(at[0])}" y1="${f1(at[1] + 7)}" x2="${f1(at[0])}" y2="${GROUND}" stroke-width="2.5"/>`;
    }
    if (p.t === 'platform') {
      const a = A[p.at], b = B[p.at];
      const mk = (q) => [f1(q[0] - 7), f1(q[1] - 7), f1(q[0] + 7), f1(q[1] + 7)];
      const [ax1, ay1, ax2, ay2] = mk(a), [bx1, by1, bx2, by2] = mk(b);
      if (!moving) return `<line class="prop" x1="${bx1}" y1="${by1}" x2="${bx2}" y2="${by2}" stroke-width="4"/>`;
      return `<line class="prop" x1="${ax1}" y1="${ay1}" x2="${ax2}" y2="${ay2}" stroke-width="4">${anim('x1', ax1, bx1, dur)}${anim('y1', ay1, by1, dur)}${anim('x2', ax2, bx2, dur)}${anim('y2', ay2, by2, dur)}</line>`;
    }
    return '';
  }).join('');

  const bars = (pat.props || []).filter((p) => p.t === 'bar').map((p) =>
    `<line class="bar" x1="${p.p[0] - 18}" y1="${p.p[1]}" x2="${p.p[0] + 18}" y2="${p.p[1]}"/><circle class="bar-end" cx="${p.p[0]}" cy="${p.p[1]}" r="2.4"/>`).join('');
  let loadSvg = '';
  if (pat.cable && load !== 'none') loadSvg += seg(pat.cable, 'W', 'cable');
  if (pat.front && load !== 'none') {
    loadSvg += ['Wl', 'Wr'].map((k) => {
      const a = A[k], b = B[k];
      const r = load === 'db' ? 3.6 : 2.6;
      if (moving) return `<circle class="load" r="${r}" cx="${f1(a[0])}" cy="${f1(a[1])}">${anim('cx', f1(a[0]), f1(b[0]), dur)}${anim('cy', f1(a[1]), f1(b[1]), dur)}</circle>`;
      return `<circle class="load" r="${r}" cx="${f1(b[0])}" cy="${f1(b[1])}"/>`;
    }).join('');
  } else if (load === 'plate') loadSvg += dot('W', 7, 'load plate');
  else if (load === 'db') loadSvg += dot('W', 3.8, 'load');
  else if (load === 'handle') loadSvg += dot('W', 2.6, 'load');
  else if (load === 'back') loadSvg += dot('S', 7, 'load plate', [-3, 6]);
  else if (load === 'hip') loadSvg += dot('P', 7, 'load plate', [0, -6]);
  else if (load === 'pad') loadSvg += dot('A', 3.6, 'prop-fill pad', [0, -1]);

  const head = moving
    ? `<circle class="head" r="6.2" cx="${f1(A.H[0])}" cy="${f1(A.H[1])}">${anim('cx', f1(A.H[0]), f1(B.H[0]), dur)}${anim('cy', f1(A.H[1]), f1(B.H[1]), dur)}</circle>`
    : `${(A.H[0] !== B.H[0] || A.H[1] !== B.H[1]) ? `<circle class="head ghost" r="6.2" cx="${f1(A.H[0])}" cy="${f1(A.H[1])}"/>` : ''}<circle class="head" r="6.2" cx="${f1(B.H[0])}" cy="${f1(B.H[1])}"/>`;

  const vb = crop ? cropBox(ca, cb, A, B, pat, crop === true ? 1 : crop) : '0 -16 160 128';
  return `<svg class="fig" viewBox="${vb}" ${label ? `role="img" aria-label="Schéma animé : ${ex.n.replace(/"/g, '')}"` : 'aria-hidden="true"'}>
    <line class="ground" x1="4" y1="${GROUND}" x2="156" y2="${GROUND}"/>
    ${props}
    ${poly('leg2', pat.front ? 'limb' : 'limb far')}${poly('arm2', pat.front ? 'limb' : 'limb far')}
    ${poly('leg', 'limb')}${poly('torso', 'limb')}${head}${poly('arm', 'limb')}
    ${loadSvg}
    ${bars}
  </svg>`;
}

/** Lien de démonstration vidéo (recherche YouTube, ouverte dans un nouvel onglet). */
export const videoURL = (ex) => `https://www.youtube.com/results?search_query=${encodeURIComponent(`${ex.n} exercice technique`)}`;
