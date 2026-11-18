/* =========================================================
   CODE ROUGE — jeu du chapitre 1 de 5e (Règles de calcul)
   Le Dr Désordre a piégé le collège : chaque bombe affiche un calcul, chaque opération est un fil.
   On coupe les fils dans l'ordre des règles du cours (1 à 6), on calcule chaque étape ; le dernier
   nombre est le code qui désamorce la bombe. Une erreur coûte 4 secondes ; à zéro, BOUM (un cœur en moins)
   et la correction étape par étape s'affiche.
   7 missions progressives (règles 1-2, 3-4, pièges, parenthèses, imbriquées, vocabulaire, boss),
   puis le mode Survie. Étoiles, records et réglages enregistrés sur l'appareil (localStorage).
   Adresse avec ?tout : toutes les missions sont ouvertes (pour le professeur).
   ========================================================= */
(function () {
  'use strict';

  /* ---------- Outils ---------- */
  const rand = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const app = document.getElementById('app');
  const now = () => performance.now();

  const KEY = 'u5e-code-rouge';
  const save = (() => { try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { return {}; } })();
  save.stars = save.stars || {}; save.best = save.best || {};
  const persist = () => { try { localStorage.setItem(KEY, JSON.stringify(save)); } catch (e) { /* stockage indisponible */ } };
  const ALL_OPEN = /[?&]tout\b/.test(location.search);

  /* ---------- Sons (synthétisés, aucun fichier) ---------- */
  const Snd = {
    ctx: null,
    get on() { return !save.mute; },
    init() { if (!this.ctx) { try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { /* pas de son */ } } if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); },
    tone(f, d, type = 'square', vol = 0.06, f2 = 0, delay = 0) {
      if (!this.on || !this.ctx) return;
      const c = this.ctx, t = c.currentTime + delay, o = c.createOscillator(), g = c.createGain();
      o.type = type; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
      g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(g).connect(c.destination); o.start(t); o.stop(t + d + 0.02);
    },
    noise(d, vol = 0.3, freq = 900) {
      if (!this.on || !this.ctx) return;
      const c = this.ctx, n = Math.floor(c.sampleRate * d), buf = c.createBuffer(1, n, c.sampleRate), data = buf.getChannelData(0);
      for (let i = 0; i < n; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2);
      const s = c.createBufferSource(), fl = c.createBiquadFilter(), g = c.createGain();
      s.buffer = buf; fl.type = 'lowpass'; fl.frequency.value = freq; g.gain.value = vol;
      s.connect(fl).connect(g).connect(c.destination); s.start();
    },
    tick(hurry) { this.tone(hurry ? 1500 : 1100, 0.04, 'square', hurry ? 0.05 : 0.025); },
    snip() { this.noise(0.08, 0.25, 4000); this.tone(1800, 0.08, 'triangle', 0.05, 600); },
    good() { this.tone(660, 0.09, 'triangle', 0.08); this.tone(990, 0.12, 'triangle', 0.08, 0, 0.08); },
    bad() { this.tone(160, 0.28, 'sawtooth', 0.07, 90); },
    zap() { this.noise(0.15, 0.2, 2500); this.tone(220, 0.2, 'sawtooth', 0.06, 70); },
    defuse() { [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.16, 'triangle', 0.08, 0, i * 0.09)); },
    boom() { this.noise(1.4, 0.9, 500); this.tone(90, 0.9, 'sine', 0.35, 30); },
    win() { [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => this.tone(f, 0.2, 'triangle', 0.08, 0, i * 0.11)); },
    lose() { [392, 330, 262, 196].forEach((f, i) => this.tone(f, 0.3, 'sawtooth', 0.05, 0, i * 0.18)); },
  };
  const muteBtn = document.getElementById('mute');
  const syncMute = () => { muteBtn.textContent = save.mute ? '🔇' : '🔊'; muteBtn.setAttribute('aria-label', save.mute ? 'Remettre le son' : 'Couper le son'); };
  muteBtn.addEventListener('click', () => { save.mute = !save.mute; persist(); syncMute(); Snd.init(); });
  syncMute();
  document.addEventListener('pointerdown', () => Snd.init(), { once: true });

  /* =========================================================
     Les calculs (mêmes règles que le cours et les exercices du site)
     ========================================================= */
  const PRIO = { '+': 1, '−': 1, '×': 2, ':': 2 };
  const OPF = { '+': (a, b) => a + b, '−': (a, b) => a - b, '×': (a, b) => a * b, ':': (a, b) => a / b };
  const OPNOM = { '+': 'addition', '−': 'soustraction', '×': 'multiplication', ':': 'division' };
  const sym = (o) => (o === ':' ? '÷' : o);
  const tokTxt = (k) => (k.t === 'n' ? String(k.v) : k.t === 'op' ? sym(k.v) : k.t);

  function parse(str) {
    const out = [], re = /\d+|[+−×:÷()-]/g; let m;
    while ((m = re.exec(str))) {
      const t = m[0];
      if (/\d/.test(t)) out.push({ t: 'n', v: Number(t) });
      else if (t === '(' || t === ')') out.push({ t });
      else out.push({ t: 'op', v: t === '-' ? '−' : t === '÷' ? ':' : t });
    }
    return out;
  }
  function tokHTML(toks, hi = -1) {
    let s = '';
    toks.forEach((k, i) => {
      const p = toks[i - 1];
      if (i > 0 && p.t !== '(' && k.t !== ')') s += ' ';
      if (hi >= 0 && i === hi - 1) s += '<mark>';
      s += tokTxt(k);
      if (hi >= 0 && i === hi + 1) s += '</mark>';
    });
    return s;
  }
  const tokStr = (toks) => tokHTML(toks);

  /** Groupes « les plus intérieurs » : parenthèses sans parenthèse dedans ; sans parenthèses, tout le calcul */
  function groups(toks) {
    const res = [], stack = [];
    toks.forEach((k, i) => {
      if (k.t === '(') stack.push(i);
      else if (k.t === ')') { const o = stack.pop(); if (!toks.slice(o + 1, i).some((x) => x.t === '(')) res.push([o, i]); }
    });
    return res.length ? res : [[-1, toks.length]];
  }
  /** Opérations qu'on a le droit de faire maintenant (il peut y en avoir plusieurs : deux parenthèses, deux produits séparés par +) */
  function validOps(toks) {
    const out = [];
    for (const [o, c] of groups(toks)) {
      const idx = [];
      for (let i = o + 1; i < c; i++) if (toks[i].t === 'op') idx.push(i);
      if (!idx.some((i) => PRIO[toks[i].v] === 2)) { if (idx.length) out.push(idx[0]); continue; }
      let prevHigh = false;
      for (const i of idx) { const h = PRIO[toks[i].v] === 2; if (h && !prevHigh) out.push(i); prevHigh = h; }
    }
    return out;
  }
  const depthAt = (toks, k) => { let d = 0; for (let i = 0; i < k; i++) { if (toks[i].t === '(') d++; if (toks[i].t === ')') d--; } return d; };
  const groupOf = (toks, k) => groups(toks).find(([o, c]) => k > o && k < c);

  /** Effectue l'opération d'indice k ; enlève les parenthèses devenues inutiles */
  function applyAt(toks, k) {
    const a = toks[k - 1].v, b = toks[k + 1].v, op = toks[k].v, res = OPF[op](a, b);
    const nt = [...toks.slice(0, k - 1), { t: 'n', v: res, fresh: true }, ...toks.slice(k + 2)];
    let ri = k - 1;
    if (nt[ri - 1] && nt[ri - 1].t === '(' && nt[ri + 1] && nt[ri + 1].t === ')') { nt.splice(ri + 1, 1); nt.splice(ri - 1, 1); ri--; }
    return { toks: nt, a, b, op, res, ri };
  }
  /** La règle du cours qui justifie de faire l'opération k */
  function ruleFor(toks, k) {
    const d = depthAt(toks, k);
    if (d >= 2) return 'règle 6 : parenthèses intérieures';
    if (d === 1) return 'règle 5 : parenthèses';
    const [o, c] = groupOf(toks, k) || [-1, toks.length];
    const ops = toks.slice(o + 1, c).filter((x) => x.t === 'op');
    const hi = ops.some((x) => PRIO[x.v] === 2), lo = ops.some((x) => PRIO[x.v] === 1), op = toks[k].v;
    if (hi && lo) return op === '×' ? 'règle 3 : × d’abord' : 'règle 4 : ÷ d’abord';
    return PRIO[op] === 1 ? 'règle 1 : de gauche à droite' : 'règle 2 : de gauche à droite';
  }
  /** Pourquoi l'opération k n'est pas la bonne (message court, renvoie à la règle) */
  function whyWrong(toks, k) {
    if (!groupOf(toks, k)) {
      return depthAt(toks, k) === 0
        ? '<b>Règle 5</b> : on commence toujours par le calcul <b>entre parenthèses</b>.'
        : '<b>Règle 6</b> : on commence par les parenthèses <b>les plus intérieures</b>.';
    }
    const [o, c] = groupOf(toks, k), op = toks[k].v;
    const hi = toks.slice(o + 1, c).some((x) => x.t === 'op' && PRIO[x.v] === 2);
    if (PRIO[op] === 1 && hi) return '<b>Règles 3 et 4</b> : la multiplication et la division passent <b>avant</b> l’addition et la soustraction.';
    return '<b>Règles 1 et 2</b> : des opérations de même priorité se font <b>de la gauche vers la droite</b>.';
  }
  /** Toutes les étapes dans l'ordre du cours ; null si une étape sort des entiers positifs (ou dépasse max) */
  function solve(toks, max = 1e9) {
    const steps = []; let cur = toks;
    while (cur.length > 1) {
      const k = validOps(cur)[0], s = applyAt(cur, k);
      if (!Number.isInteger(s.res) || s.res <= 0 || s.res > max) return null;
      steps.push({ before: cur, k, rule: ruleFor(cur, k), ...s });
      cur = s.toks;
    }
    return { steps, value: cur[0].v };
  }
  function stepsHTML(name, toks) {
    const ev = solve(toks);
    let h = '<div class="steps">';
    ev.steps.forEach((s, i) => { h += `<span class="ex">${i ? '=' : name + ' ='} ${tokHTML(s.before, s.k)}</span><span class="why">← ${s.rule}</span>`; });
    return h + `<span class="ex">= <b>${ev.value}</b></span><span></span></div>`;
  }

  /** Calcul aléatoire d'après un modèle ("a + b × c") : toutes les étapes en nombres entiers positifs */
  function buildExpr(tpls, max = 400) {
    for (let tries = 0; tries < 40000; tries++) {
      const toks = pick(tpls).split(' ').map((p) => (/^[a-z]$/.test(p) ? { t: 'n', v: 0, ph: true } : p === '(' || p === ')' ? { t: p } : { t: 'op', v: p }));
      toks.forEach((k, i) => {
        if (!k.ph) return;
        const near = [toks[i - 1], toks[i + 1]].some((x) => x && x.t === 'op' && PRIO[x.v] === 2);
        k.v = near ? rand(2, 10) : rand(2, 30);
      });
      if (toks[0].ph && Math.random() < 0.6) toks[0].v = rand(10, 60);
      toks.forEach((k, i) => {
        if (k.t === 'op' && k.v === ':' && toks[i - 1] && toks[i - 1].ph && toks[i + 1] && toks[i + 1].ph) toks[i - 1].v = toks[i + 1].v * rand(2, 9);
      });
      const clean = toks.map((k) => (k.ph ? { t: 'n', v: k.v } : { ...k }));
      const ev = solve(clean, max);
      if (!ev) continue;
      return clean;
    }
    return parse('5 + 3 × 7');
  }

  /* ---------- Vocabulaire : arbres de calcul et phrases ---------- */
  const NOM = { '+': ['la somme', 'et'], '−': ['la différence', 'et'], '×': ['le produit', 'par'], ':': ['le quotient', 'par'] };
  const TYPE = { '+': 'une somme', '−': 'une différence', '×': 'un produit', ':': 'un quotient' };
  const deX = (x) => (x.startsWith('le ') ? 'du ' + x.slice(3) : 'de ' + x);
  function phrase(t) {
    if (typeof t === 'number') return String(t);
    const [n, link] = NOM[t.op];
    return `${n} ${deX(phrase(t.l))} ${link === 'et' ? 'et ' + deX(phrase(t.r)) : 'par ' + phrase(t.r)}`;
  }
  function treeToks(t, parent, side) {
    if (typeof t === 'number') return [{ t: 'n', v: t }];
    const inner = [...treeToks(t.l, t, 'l'), { t: 'op', v: t.op }, ...treeToks(t.r, t, 'r')];
    const need = parent && (PRIO[t.op] < PRIO[parent.op] || (PRIO[t.op] === PRIO[parent.op] && side === 'r'));
    return need ? [{ t: '(' }, ...inner, { t: ')' }] : inner;
  }
  const tval = (t) => (typeof t === 'number' ? t : OPF[t.op](tval(t.l), tval(t.r)));
  function fixDiv(t) {
    if (typeof t === 'number') return;
    fixDiv(t.l); fixDiv(t.r);
    if (t.op === ':' && typeof t.l === 'number') { const r = tval(t.r); if (Number.isInteger(r) && r > 0 && r <= 12) t.l = r * rand(2, 6); }
  }
  function genTree() {
    const o = () => pick(['+', '−', '×', ':']);
    for (let tries = 0; tries < 6000; tries++) {
      const shape = pick(['R', 'R', 'L', 'L', 'B']);
      let t;
      if (shape === 'R') t = { op: o(), l: rand(10, 60), r: { op: o(), l: rand(2, 12), r: rand(2, 12) } };
      else if (shape === 'L') t = { op: o(), l: { op: o(), l: rand(4, 30), r: rand(2, 12) }, r: rand(2, 9) };
      else t = { op: o(), l: { op: o(), l: rand(4, 30), r: rand(2, 12) }, r: { op: o(), l: rand(2, 12), r: rand(2, 9) } };
      if (t.op === (typeof t.r === 'object' ? t.r.op : '') || (typeof t.l === 'object' && t.l.op === t.op)) continue; // deux fois la même opération : phrase peu parlante
      fixDiv(t);
      const toks = treeToks(t);
      if (!solve(toks, 300)) continue;
      return { tree: t, toks };
    }
    return { tree: { op: '+', l: 25, r: { op: '×', l: 4, r: 3 } }, toks: parse('25 + 4 × 3') };
  }
  const SWAP = { '+': '×', '×': '+', '−': ':', ':': '−' };
  function phraseDistractors(tree) {
    const good = tokStr(treeToks(tree)), seen = new Set([good]), out = [];
    const clone = (t) => JSON.parse(JSON.stringify(t));
    const cands = [];
    // même opérations, structure inversée (où sont les parenthèses ?)
    if (typeof tree.r === 'object' && typeof tree.l === 'number') cands.push({ op: tree.r.op, l: { op: tree.op, l: tree.l, r: tree.r.l }, r: tree.r.r });
    if (typeof tree.l === 'object' && typeof tree.r === 'number') cands.push({ op: tree.op, l: tree.l.l, r: { op: tree.l.op, l: tree.l.r, r: tree.r } });
    if (typeof tree.l === 'object' && typeof tree.r === 'object') cands.push({ op: tree.l.op, l: tree.l.l, r: { op: tree.op, l: tree.l.r, r: tree.r } });
    // les deux opérations échangées
    { const c = clone(tree), sub = typeof c.r === 'object' ? c.r : c.l; [c.op, sub.op] = [sub.op, c.op]; cands.push(c); }
    // une opération confondue (somme ↔ produit, différence ↔ quotient)
    { const c = clone(tree); c.op = SWAP[c.op]; cands.push(c); }
    { const c = clone(tree), sub = typeof c.r === 'object' ? c.r : c.l; sub.op = SWAP[sub.op]; cands.push(c); }
    for (const c of shuffle(cands.slice(0, 2)).concat(shuffle(cands.slice(2)))) {
      const s = tokStr(treeToks(c));
      if (!seen.has(s)) { seen.add(s); out.push(s); }
      if (out.length === 2) break;
    }
    return out;
  }

  /* ---------- Propositions pour le résultat d'une étape (erreurs classiques) ---------- */
  function choicesFor(a, op, b, res, n) {
    const first = { '×': [a + b], '+': [a * b, res + 10], '−': [a + b, res + 10], ':': [a - b, res + 1] }[op];
    const more = shuffle({ '×': [res + a, res - a, res + b, res - b, res + 10, res - 10], '+': [res + 1, res - 1, res - 10, res + 2], '−': [res + 1, res - 1, res - 10, res + 2], ':': [res - 1, res + 2, res * 2, b] }[op]);
    const set = new Set();
    [...first, ...more].forEach((c) => { if (Number.isInteger(c) && c > 0 && c !== res && set.size < n - 1 && c < 2000) set.add(c); });
    for (let d = 1; set.size < n - 1; d++) if (!set.has(res + d)) set.add(res + d);
    return shuffle([res, ...set]);
  }

  /* =========================================================
     Les missions
     ========================================================= */
  const TPL_SANS = ['a + b − c − d', 'a − b + c − d', 'a − b − c + d', 'a + b − c + d', 'a × b : c', 'a : b × c', 'a × b : c × d', 'a : b × c : d'];
  const TPL_PRIO = ['a + b × c', 'a − b × c', 'a + b : c', 'a − b : c', 'a × b + c', 'a × b − c', 'a : b + c', 'a : b − c'];
  const TPL_PIEGE = ['a − b + c × d', 'a + b × c − d', 'a × b − c : d', 'a × b + c × d', 'a − b × c + d', 'a + b : c − d', 'a − b : c + d', 'a × b : c + d', 'a + b × c : d', 'a − b − c × d'];
  const TPL_PAR = ['a − ( b + c ) − d', 'a + b × ( c − d )', '( a + b ) × c', 'a × ( b − c )', '( a − b ) : c', 'a : ( b + c )',
    '( a + b ) × ( c − d )', 'a − ( b − c )', '( a + b ) : ( c − d )', 'a + ( b − c ) × d'];
  const TPL_IMB = ['a − ( b − ( c + d ) )', '( a − ( b + c ) ) × d', 'a × ( b + ( c − d ) )', 'a + ( b × ( c − d ) )',
    '( a − ( b + c ) ) : d', 'a − ( b + ( c − d ) ) × e', '( a + ( b − c ) ) × d'];
  const TPL_BOSS = ['( a + b × c ) − ( d − e )', 'a × ( b + c ) − d : e', '( a − ( b + c ) ) × d + e', 'a + ( b − c ) × ( d + e )',
    'a − b × ( c − ( d + e ) )', '( a + b ) × c − d × e', 'a + b × ( c + ( d − e ) )', '( a × b − c ) : ( d + e )'];

  const ZONES = [
    { id: 'z1', icon: '➡️', name: 'Gauche → droite', tag: 'Règles 1 et 2', tpls: TPL_SANS, n: 5, t0: 12, tOp: 8, nch: 3,
      rules: ['<b>Règle n°1 :</b> lorsqu’il n’y a que des additions et des soustractions, on effectue les calculs <b>de la gauche vers la droite</b>.',
        '<b>Règle n°2 :</b> lorsqu’il n’y a que des multiplications et des divisions, on effectue les calculs <b>de la gauche vers la droite</b>.'],
      demo: ['32 + 8 − 6 − 9', '60 : 6 × 3 : 5'],
      taunt: 'Bwahaha ! Mes bombes, on peut les calculer dans n’importe quel sens… <i>enfin, c’est ce que je veux te faire croire !</i>' },
    { id: 'z2', icon: '✖️', name: '× et ÷ d’abord', tag: 'Règles 3 et 4', tpls: TPL_PRIO, n: 5, t0: 10, tOp: 9, nch: 3,
      rules: ['<b>Règle n°3 :</b> la <b>multiplication</b> est prioritaire devant l’addition et la soustraction.',
        '<b>Règle n°4 :</b> la <b>division</b> est prioritaire devant l’addition et la soustraction.'],
      demo: ['5 + 3 × 7', '4 + 12 : 3'],
      taunt: 'J’ai mis l’addition en premier sur mes bombes. Tout le monde commence par elle… <i>hé hé hé.</i>' },
    { id: 'z3', icon: '🪤', name: 'Les pièges', tag: 'Règles 1 à 4', tpls: TPL_PIEGE, n: 5, t0: 10, tOp: 8, nch: 3,
      rules: ['× et ÷ d’abord (règles 3 et 4), <b>puis</b> + et − <b>de la gauche vers la droite</b> (règle 1).',
        '<b>Piège :</b> dans 50 − 4 + 3 × 6, on calcule d’abord 3 × 6, puis on fait 50 − 4 <b>avant</b> d’ajouter 18.'],
      demo: ['50 − 4 + 3 × 6', '5 × 8 − 12 : 4'],
      taunt: 'Plus de fils, plus de pièges. Une seule hésitation et… <b>BOUM</b> !' },
    { id: 'z4', icon: '🔓', name: 'Parenthèses', tag: 'Règle 5', tpls: TPL_PAR, n: 5, t0: 10, tOp: 9, nch: 3,
      rules: ['<b>Règle n°5 :</b> on commence toujours par effectuer les calculs <b>entre parenthèses</b>.'],
      demo: ['20 − (4 + 7) − 2', '6 + 4 × (12 − 5)'],
      taunt: 'J’ai enfermé des calculs dans des parenthèses. Tu crois qu’elles servent à décorer ?' },
    { id: 'z5', icon: '🪆', name: 'Poupées russes', tag: 'Règle 6', tpls: TPL_IMB, n: 5, t0: 10, tOp: 9, nch: 4,
      rules: ['<b>Règle n°6 :</b> on commence par effectuer les parenthèses <b>les plus intérieures</b>.'],
      demo: ['25 − (15 − (4 + 3))', '(12 − (5 + 2)) × 4'],
      taunt: 'Des parenthèses DANS des parenthèses ! Mes bombes sont des poupées russes…' },
    { id: 'z6', icon: '✉️', name: 'Message codé', tag: 'Vocabulaire', kind: 'voc', n: 6, t0: 20, tOp: 9, nch: 3,
      rules: ['La somme (+), la différence (−), le produit (×), le quotient (÷).',
        '<b>Propriété :</b> c’est la <b>dernière opération effectuée</b> qui dit si un calcul est une somme, une différence, un produit ou un quotient.',
        'D est la différence de 40 et de la somme de 5 et de 8, donc D = 40 − (5 + 8).'],
      demo: ['(5 + 3) × 4'],
      demoText: '(5 + 3) × 4 : la dernière opération est une multiplication. C’est <b>le produit</b> de la somme de 5 et de 3 par 4.',
      taunt: 'Mes bombes sont protégées par un bouclier. Pour l’ouvrir : décode mes messages… <i>en bon français mathématique !</i>' },
    { id: 'z7', icon: '💣', name: 'La Méga-bombe', tag: 'Tout le cours', tpls: TPL_BOSS, n: 3, t0: 10, tOp: 8, nch: 4, boss: true, max: 600,
      rules: ['<b>À retenir — dans un calcul, on effectue dans l’ordre :</b><br>1. les calculs entre parenthèses (les plus intérieures d’abord) ;<br>2. les multiplications et les divisions ;<br>3. les additions et les soustractions.'],
      demo: ['(12 + 3 × 4) − (9 − 5)'],
      taunt: 'Tu as déjoué mes petites bombes ? Voici mes <b>trois méga-bombes</b>. Personne ne les a jamais désamorcées !' },
  ];
  const SURVIE = { id: 'inf', icon: '♾️', name: 'Survie', tag: 'Sans fin', n: Infinity, nch: 3, survie: true,
    taunt: 'Des bombes, encore et encore, de plus en plus vite. Jusqu’où tiendras-tu ?' };

  const unlocked = (i) => ALL_OPEN || i === 0 || (save.stars[ZONES[i - 1].id] || 0) > 0;
  const survieOpen = () => ALL_OPEN || (save.stars.z7 || 0) > 0;
  const starStr = (n) => '★'.repeat(n) + `<i>${'★'.repeat(3 - n)}</i>`;

  /* =========================================================
     Écrans
     ========================================================= */
  let G = null; // la partie en cours
  let raf = 0;
  const stopLoop = () => { cancelAnimationFrame(raf); raf = 0; };

  function home() {
    stopLoop(); G = null;
    const total = ZONES.reduce((s, z) => s + (save.stars[z.id] || 0), 0);
    const nextI = ZONES.findIndex((z, i) => unlocked(i) && !save.stars[z.id]);
    const intro = !save.intro;
    app.innerHTML = `<div class="screen">
      <h1 class="logo">CODE <span>ROUGE</span></h1>
      <p class="tagline">Désamorce les bombes du Dr Désordre en respectant les règles de calcul. · <span class="total">⭐ ${total} / ${ZONES.length * 3}</span></p>
      <div class="villain"><span class="face" aria-hidden="true">🦹</span><div class="bubble">${intro
        ? '<b>ALERTE !</b> Moi, le Dr Désordre, j’ai caché des bombes dans tout le collège. Chaque opération de leurs calculs est un <b>fil</b>. Coupe-les dans le <b>bon ordre</b>, calcule chaque étape… et le dernier nombre sera le code. <i>Mais une erreur, et le compte à rebours s’accélère !</i>'
        : pick(['Tu reviens ? Mes bombes t’attendent… <i>tic, tac, tic, tac.</i>', 'Les priorités, c’est pour les gens ennuyeux. <i>Prouve-moi le contraire !</i>', 'Cette fois, mes fils sont encore plus emmêlés. <i>Hé hé.</i>'])}</div></div>
      <div class="map">
        ${ZONES.map((z, i) => {
          const lock = !unlocked(i), st = save.stars[z.id] || 0;
          return `<button type="button" class="zone${z.boss ? ' boss' : ''}${lock ? ' locked' : ''}${i === nextI ? ' next' : ''}" data-z="${i}" ${lock ? 'disabled' : ''}>
            <span class="num">${i + 1}</span><span class="ico">${lock ? '🔒' : z.icon}</span><span class="nm">${z.name}</span><span class="rl">${z.tag}</span>
            <span class="st">${starStr(st)}</span>${save.best[z.id] ? `<span class="rec">Record : ${save.best[z.id]} pts</span>` : ''}</button>`;
        }).join('')}
        <button type="button" class="zone inf${survieOpen() ? '' : ' locked'}" data-z="inf" ${survieOpen() ? '' : 'disabled'}>
          <span class="ico">${survieOpen() ? SURVIE.icon : '🔒'}</span><span class="nm">Survie</span>
          <span class="rl">${survieOpen() ? 'Des bombes sans fin, toujours plus rapides' : 'S’ouvre après la Méga-bombe'}</span>
          ${save.best.inf ? `<span class="rec">Record : ${save.best.inf} pts · ${save.bestBombs || 0} bombes</span>` : ''}</button>
      </div>
      <p class="foot">Une étoile ouvre la mission suivante. ⭐⭐⭐ = aucune explosion et au plus une erreur. Ta progression reste sur cet appareil.</p>
    </div>`;
    app.querySelectorAll('[data-z]').forEach((b) => b.addEventListener('click', () => {
      Snd.init(); save.intro = true; persist();
      brief(b.dataset.z === 'inf' ? SURVIE : ZONES[Number(b.dataset.z)]);
    }));
    app.scrollTop = 0;
  }

  function demoHTML(expr, name, t0 = 0) {
    const ev = solve(parse(expr));
    let h = '';
    ev.steps.forEach((s, i) => { h += `<div class="ln" style="animation-delay:${(t0 + i * 0.7 + 0.2).toFixed(2)}s"><span class="ex">${i ? '=' : name + ' ='} ${tokHTML(s.before, s.k)}</span><span class="why">← ${s.rule}</span></div>`; });
    return h + `<div class="ln" style="animation-delay:${(t0 + ev.steps.length * 0.7 + 0.2).toFixed(2)}s"><span class="ex">= <b>${ev.value}</b></span><span class="why">✔ code trouvé</span></div>`;
  }
  const demosHTML = (list) => { let t = 0; return list.map((d, i) => { const h = demoHTML(d, 'AB'[i], t); t += (solve(parse(d)).steps.length + 1) * 0.7; return h; }).join('<div class="sep"></div>'); };

  function brief(z) {
    const idx = ZONES.indexOf(z);
    app.innerHTML = `<div class="screen">
      <div class="card">
        <p class="kicker">${z.survie ? 'Mode Survie' : `Mission ${idx + 1} / ${ZONES.length} · ${z.tag}`}</p>
        <h1>${z.icon} ${z.name}</h1>
        <div class="villain"><span class="face" aria-hidden="true">🦹</span><div class="bubble">${z.taunt}</div></div>
        ${z.survie ? `<div class="rule">Toutes les règles du cours. 3 cœurs, et chaque bombe a un peu moins de temps que la précédente. Une bombe désamorcée sans erreur fait grimper ton <b>combo</b>.</div>`
          : `<h2 class="kicker" style="margin-top:14px;color:var(--amber)">Le cours, pour désamorcer</h2>${z.rules.map((r) => `<div class="rule">${r}</div>`).join('')}
        <div class="demo">${z.demoText ? `<div class="ln"><span class="ex" style="white-space:normal">${z.demoText}</span></div>` : demosHTML(z.demo)}</div>`}
        <p class="howto">${z.kind === 'voc'
          ? '🛡️ D’abord, ouvre le bouclier : dis quel type de calcul porte la bombe, ou retrouve le calcul qui correspond au message. Ensuite, désamorce-la comme d’habitude.'
          : '✂️ Clique sur le fil de l’opération à faire <b>en premier</b>, puis choisis son résultat. Recommence jusqu’au code final.'}
          Une erreur = <b>−4 secondes</b>. ${z.survie ? '' : `${z.n} bombes, 3 cœurs.`}</p>
        <div class="row" style="margin-top:12px"><button type="button" class="btn ghost" data-act="back">← QG</button><button type="button" class="btn go" data-act="go">💣 Lancer la mission</button></div>
      </div></div>`;
    app.querySelector('[data-act="back"]').addEventListener('click', home);
    app.querySelector('[data-act="go"]').addEventListener('click', () => start(z));
    app.querySelector('[data-act="go"]').focus();
    app.scrollTop = 0;
  }

  /* =========================================================
     La partie
     ========================================================= */
  function start(z) {
    G = { z, i: 0, hearts: 3, score: 0, combo: 0, errors: 0, booms: 0, res: [], seen: new Set(), bomb: null };
    nextBomb();
  }

  function newBombToks() {
    const z = G.z;
    if (z.survie) {
      const n = G.i;
      const tpls = n < 3 ? pick([TPL_SANS, TPL_PRIO]) : n < 6 ? pick([TPL_PRIO, TPL_PIEGE]) : n < 9 ? pick([TPL_PIEGE, TPL_PAR]) : n < 12 ? pick([TPL_PAR, TPL_IMB]) : pick([TPL_PIEGE, TPL_PAR, TPL_IMB, TPL_BOSS]);
      return buildExpr(tpls, tpls === TPL_BOSS ? 600 : 400);
    }
    return buildExpr(z.tpls, z.max || 400);
  }

  function nextBomb() {
    const z = G.z;
    if (!z.survie && G.i >= z.n) { endMission(false); return; }
    let toks, tree = null, decode = null;
    for (let t = 0; t < 30; t++) {
      if (z.kind === 'voc') { const g = genTree(); tree = g.tree; toks = g.toks; } else toks = newBombToks();
      if (!G.seen.has(tokStr(toks))) break;
    }
    G.seen.add(tokStr(toks));
    if (z.kind === 'voc') decode = G.i % 2 ? 'phrase' : 'type';
    let c = 0;
    toks = toks.map((k) => (k.t === 'op' ? { ...k, c: c++ % 5 } : { ...k }));
    const nOps = c;
    let secs;
    if (z.survie) secs = Math.max(4.5, 9 * Math.max(0.5, 1 - G.i * 0.03)) * nOps + 6;
    else secs = z.t0 + z.tOp * nOps;
    G.bomb = { orig: toks, toks, tree, decode, phase: decode || 'cut', err: 0, total: secs * 1000, deadline: now() + secs * 1000, lastTick: Math.ceil(secs), pending: null };
    renderPlay();
    loop();
  }

  /* ---------- Affichage de la partie ---------- */
  const WIRE = '<svg class="wire" viewBox="0 0 24 70" preserveAspectRatio="none" aria-hidden="true"><path class="w1" d="M12 0 C 3 10, 21 24, 12 35"/><path class="w2" d="M12 35 C 3 46, 21 60, 12 70"/></svg>';

  function hudHTML() {
    const z = G.z;
    const dots = z.survie ? `<span class="zn">💣 × ${G.i}</span>` : `<span class="dots">${Array.from({ length: z.n }, (_, i) => `<i class="${G.res[i] || (i === G.i ? 'cur' : '')}"></i>`).join('')}</span>`;
    const mult = comboMult();
    return `<button type="button" class="quit" data-act="quit" aria-label="Abandonner et revenir au QG">✕</button>
      <span class="zn">${z.icon} ${z.name}</span>${dots}
      <span class="hearts" aria-label="${G.hearts} cœurs">${[0, 1, 2].map((i) => `<span class="${i < G.hearts ? '' : 'lost'}">❤️</span>`).join('')}</span>
      <span class="combo">${mult > 1 ? `🔥 combo ×${String(mult).replace('.', ',')}` : ''}</span>
      <span class="score">${G.score} pts</span>`;
  }
  const comboMult = () => (G.combo >= 2 ? Math.min(3, 1 + (G.combo - 1) * 0.5) : 1);

  function renderPlay() {
    app.innerHTML = `<div class="screen play">
      <div class="hud">${hudHTML()}</div>
      <div class="bomb" id="bomb">
        <div class="bomb-top"><span class="bulb"></span><span class="led" id="led">--.-</span><span class="lbl">Dr&nbsp;Désordre</span></div>
        <div class="board" id="board"><div id="screen"></div><div class="c4bar">C4 · C4 · C4</div></div>
      </div>
      <div id="toast-slot"></div>
      <div class="panel" id="panel"></div>
    </div>`;
    app.querySelector('[data-act="quit"]').addEventListener('click', quit);
    drawScreen();
    drawPanel();
    app.scrollTop = 0;
  }
  function refreshHud() { const h = app.querySelector('.hud'); if (h) { h.innerHTML = hudHTML(); h.querySelector('[data-act="quit"]').addEventListener('click', quit); } }

  function drawScreen(pop = -1) {
    const B = G.bomb, el = document.getElementById('screen');
    if (B.phase === 'phrase') {
      el.innerHTML = `<div class="msg">«&nbsp;${phrase(B.tree).replace(/^./, (c) => c.toUpperCase())}&nbsp;»</div>`;
      return;
    }
    const fz = B.pending ? [B.pending.k - 1, B.pending.k, B.pending.k + 1] : [];
    const canCut = B.phase === 'cut';
    el.innerHTML = `<div class="expr">${B.toks.map((k, i) => {
      const f = fz.includes(i) ? ' fuse' : '';
      if (k.t === 'n') return `<span class="tk num${i === pop ? ' pop' : ''}${f}">${k.v}</span>`;
      if (k.t === 'op') return `<button type="button" class="tk op c${k.c}${f}${B.pending && B.pending.k === i ? ' cut' : ''}" data-i="${i}" ${canCut ? '' : 'disabled'} aria-label="Couper le fil de la ${OPNOM[k.v]}"><span class="sym">${sym(k.v)}</span>${WIRE}</button>`;
      return `<span class="tk par${f}">${k.t}</span>`;
    }).join('')}</div>${B.phase === 'type' ? '<div class="shield"><span>🛡️ BOUCLIER ACTIF</span></div>' : ''}`;
    el.querySelectorAll('.tk.op').forEach((b) => b.addEventListener('click', () => cut(Number(b.dataset.i), b)));
  }

  function choiceButtons(list, cls = '') {
    return `<div class="choices ${cls}">${list.map((c, i) => `<button type="button" class="ch" data-v="${i}"><kbd>${i + 1}</kbd>${c}</button>`).join('')}</div>`;
  }

  function drawPanel() {
    const B = G.bomb, p = document.getElementById('panel');
    if (!p) return;
    if (B.phase === 'type') {
      const opts = ['une somme', 'une différence', 'un produit', 'un quotient'];
      p.innerHTML = `<p class="ask">🛡️ Pour ouvrir le bouclier, réponds :<big>ce calcul est…</big></p>${choiceButtons(opts, 'four')}`;
      p.querySelectorAll('.ch').forEach((b) => b.addEventListener('click', () => answerType(opts[b.dataset.v], b)));
    } else if (B.phase === 'phrase') {
      if (!B.opts) B.opts = shuffle([tokStr(B.toks), ...phraseDistractors(B.tree)]);
      p.innerHTML = `<p class="ask">Quel calcul correspond au message ?</p>${choiceButtons(B.opts, 'wide')}`;
      p.querySelectorAll('.ch').forEach((b) => b.addEventListener('click', () => answerPhrase(B.opts[b.dataset.v], b)));
    } else if (B.phase === 'cut') {
      p.innerHTML = `<p class="ask">✂️ Coupe le fil de l’opération à faire <span class="hl">en premier</span>.</p>`;
    } else if (B.phase === 'pick') {
      const { a, op, b, choices } = B.pending;
      p.innerHTML = `<p class="ask">Calcule vite :<big>${a} ${sym(op)} ${b} = ?</big></p>${choiceButtons(choices)}`;
      p.querySelectorAll('.ch').forEach((bt) => bt.addEventListener('click', () => answerStep(choices[bt.dataset.v], bt)));
    } else p.innerHTML = '';
  }

  function toast(html, good) {
    const s = document.getElementById('toast-slot');
    if (s) s.innerHTML = `<div class="toast${good ? ' good' : ''}">${html}</div>`;
  }
  const clearToast = () => { const s = document.getElementById('toast-slot'); if (s) s.innerHTML = ''; };

  function penalty() {
    const B = G.bomb;
    B.deadline -= 4000; B.err++; G.errors++;
    const led = document.getElementById('led');
    if (led) { led.animate([{ transform: 'scale(1.25)', color: '#fff' }, { transform: 'none' }], { duration: 400 }); }
  }

  /* ---------- Actions du joueur ---------- */
  function cut(k, btn) {
    const B = G.bomb;
    if (B.phase !== 'cut') return;
    if (validOps(B.toks).includes(k)) {
      Snd.snip(); clearToast();
      const s = applyAt(B.toks, k);
      B.pending = { k, ...s, choices: choicesFor(s.a, s.op, s.b, s.res, G.z.nch || 3) };
      B.phase = 'pick';
      drawScreen(); drawPanel();
    } else {
      Snd.zap(); penalty();
      btn.classList.remove('zap'); void btn.offsetWidth; btn.classList.add('zap');
      toast(`<span class="pen">⚡ −4 s</span> ${whyWrong(B.toks, k)}`);
    }
  }

  function answerStep(v, btn) {
    const B = G.bomb;
    if (B.phase !== 'pick') return;
    const P = B.pending;
    if (v === P.res) {
      Snd.good(); clearToast();
      B.toks = P.toks; B.pending = null;
      if (B.toks.length === 1) { drawScreen(0); defuse(); return; }
      B.phase = 'cut';
      drawScreen(P.ri); drawPanel();
    } else {
      Snd.bad(); penalty();
      btn.disabled = true; btn.classList.add('bad');
      toast(`<span class="pen">−4 s</span> Recompte : ${P.a} ${sym(P.op)} ${P.b}.${P.op === '×' && v === P.a + P.b ? ' Attention, c’est une <b>multiplication</b>, pas une addition !' : ''}`);
    }
  }

  function answerType(v, btn) {
    const B = G.bomb;
    if (B.phase !== 'type') return;
    if (v === TYPE[B.tree.op]) {
      Snd.good(); btn.classList.add('good');
      toast(`✅ La dernière opération effectuée est une <b>${OPNOM[B.tree.op]}</b> : c’est ${TYPE[B.tree.op]}. Bouclier ouvert !`, true);
      B.phase = 'cut'; drawScreen(); drawPanel();
    } else {
      Snd.bad(); penalty(); btn.disabled = true; btn.classList.add('bad');
      toast('<span class="pen">−4 s</span> Ce n’est pas la première opération qui compte : cherche la <b>dernière opération effectuée</b>.');
    }
  }

  function answerPhrase(v, btn) {
    const B = G.bomb;
    if (B.phase !== 'phrase') return;
    if (v === tokStr(B.toks)) {
      Snd.good();
      toast(`✅ ${phrase(B.tree).replace(/^./, (c) => c.toUpperCase())} : la dernière opération est une <b>${OPNOM[B.tree.op]}</b>. Le calcul apparaît, désamorce-le !`, true);
      B.phase = 'cut'; drawScreen(); drawPanel();
    } else {
      Snd.bad(); penalty(); btn.disabled = true; btn.classList.add('bad');
      toast(`<span class="pen">−4 s</span> Lis le début du message : « ${NOM[B.tree.op][0]} de… » → la <b>dernière</b> opération est ${sym(B.tree.op)}. Où faut-il des parenthèses ?`);
    }
  }

  /* ---------- Fin d'une bombe ---------- */
  function defuse() {
    const B = G.bomb;
    B.phase = 'done'; stopLoop();
    const left = Math.max(0, (B.deadline - now()) / 1000);
    G.combo = B.err ? 0 : G.combo + 1;
    const mult = comboMult();
    const pts = Math.round((100 + Math.floor(left) * 5) * mult);
    G.score += pts; G.res[G.i] = 'ok'; G.i++;
    Snd.defuse();
    const bomb = document.getElementById('bomb'), board = document.getElementById('board');
    bomb.classList.remove('hurry'); bomb.classList.add('defused');
    document.getElementById('led').textContent = 'OK';
    board.insertAdjacentHTML('beforeend', `<div class="code"><div><small>CODE</small>${B.toks[0].v} ✔</div></div><div class="float">+${pts}${mult > 1 ? ` (combo ×${String(mult).replace('.', ',')})` : ''}</div>`);
    document.getElementById('panel').innerHTML = `<p class="ask">${B.err ? '💪 Désamorcée !' : pick(['😎 Sans aucune erreur !', '🧠 Cerveau en titane !', '🎯 Chirurgical !', '🔥 Trop fort !', '🦾 Mains de démineur !'])}</p>`;
    confetti(B.err ? 24 : 50);
    refreshHud();
    setTimeout(() => { if (G && G.bomb === B) nextBomb(); }, 1700);
  }

  function boom() {
    const B = G.bomb;
    B.phase = 'boom'; stopLoop();
    G.hearts--; G.booms++; G.combo = 0; G.res[G.i] = 'ko'; G.i++;
    Snd.boom(); refreshHud();
    document.body.insertAdjacentHTML('beforeend', '<div class="flash"></div>');
    setTimeout(() => document.querySelector('.flash')?.remove(), 1000);
    app.classList.add('shake-all'); setTimeout(() => app.classList.remove('shake-all'), 600);
    const over = G.hearts <= 0;
    const host = document.createElement('div');
    host.className = 'overlay';
    host.innerHTML = `<div class="card"><p class="boom-word">BOUM !</p>
      <p class="center" style="margin:6px 0 0">${over ? '💔 Plus de cœurs…' : `Il te reste ${'❤️'.repeat(G.hearts)}`}</p>
      ${B.tree ? `<p style="margin:10px 0 0">Le message : « ${phrase(B.tree)} » — c’est ${TYPE[B.tree.op]}.</p>` : ''}
      <p style="margin:10px 0 0;color:var(--dim)">Il fallait couper les fils dans cet ordre :</p>
      ${stepsHTML('Code', B.orig)}
      <div class="row"><button type="button" class="btn go" data-act="next">${over ? 'Voir le bilan' : 'Bombe suivante ▶'}</button></div></div>`;
    document.body.appendChild(host);
    const btn = host.querySelector('[data-act="next"]');
    setTimeout(() => btn.focus(), 50);
    btn.addEventListener('click', () => { host.remove(); if (over) endMission(true); else nextBomb(); });
  }

  /* ---------- Compte à rebours ---------- */
  function loop() {
    stopLoop();
    const step = () => {
      if (!G || !G.bomb) return;
      const B = G.bomb;
      if (B.phase === 'done' || B.phase === 'boom') return;
      const left = B.deadline - now();
      const led = document.getElementById('led');
      if (left <= 0) { if (led) led.textContent = '00.0'; boom(); return; }
      if (led) led.textContent = (left / 1000).toFixed(1).padStart(4, '0').replace('.', ',');
      const s = Math.ceil(left / 1000), hurry = left < 6000;
      if (s < B.lastTick) { B.lastTick = s; Snd.tick(hurry); if (hurry && left < 3000) setTimeout(() => Snd.tick(true), 500); }
      document.getElementById('bomb')?.classList.toggle('hurry', hurry);
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  }
  // pause quand la page est cachée (onglet changé, page du site quittée)
  let hiddenAt = 0;
  document.addEventListener('visibilitychange', () => {
    if (!G || !G.bomb || G.bomb.phase === 'done' || G.bomb.phase === 'boom') return;
    if (document.hidden) { hiddenAt = now(); stopLoop(); }
    else if (hiddenAt) { G.bomb.deadline += now() - hiddenAt; hiddenAt = 0; loop(); }
  });

  function quit() {
    if (!G) return;
    const keep = G.bomb && (G.bomb.phase === 'done' || G.bomb.phase === 'boom');
    if (!keep && !confirm('Abandonner la mission ? Tu reviendras au QG.')) return;
    stopLoop(); home();
  }

  /* ---------- Bilan ---------- */
  function endMission(failed) {
    stopLoop();
    const z = G.z;
    let stars = 0;
    if (!z.survie && !failed) stars = G.booms === 0 && G.errors <= 1 ? 3 : G.booms <= 1 && G.errors <= 4 ? 2 : 1;
    const oldStars = save.stars[z.id] || 0, oldBest = save.best[z.id] || 0;
    const rec = G.score > oldBest && G.score > 0;
    if (!z.survie) save.stars[z.id] = Math.max(oldStars, stars);
    if (rec) save.best[z.id] = G.score;
    const defused = G.res.filter((r) => r === 'ok').length;
    if (z.survie && defused > (save.bestBombs || 0)) save.bestBombs = defused;
    persist();
    const idx = ZONES.indexOf(z), next = ZONES[idx + 1];
    const unlockedNow = !z.survie && stars > 0 && oldStars === 0 && (next || z.boss);
    if (z.survie || stars) { Snd.win(); confetti(90); } else Snd.lose();
    const title = z.survie ? `💣 ${defused} bombe${defused > 1 ? 's' : ''} désamorcée${defused > 1 ? 's' : ''}` : failed ? 'Mission ratée…' : stars === 3 ? 'Mission parfaite !' : 'Mission accomplie !';
    const villain = z.survie ? 'Tu as tenu longtemps… mais mes bombes ne s’arrêtent jamais. <i>Reviens battre ton record !</i>'
      : failed ? 'Bwahaha ! Mes bombes ont gagné cette fois. <i>Relis bien les règles et reviens…</i>'
      : z.boss ? 'NOOON ! Mes méga-bombes ! Tu connais vraiment toutes les règles de calcul… <i>Je me vengerai en mode Survie !</i>'
      : stars === 3 ? 'Impossible… pas une seule erreur ?! <i>Grrr…</i>' : 'Tu t’en es sorti… de justesse. <i>La prochaine sera plus coriace !</i>';
    app.innerHTML = `<div class="screen"><div class="card">
      <p class="kicker">${z.survie ? 'Mode Survie' : `Mission ${idx + 1} · ${z.name}`}</p>
      <h1 class="center">${title}</h1>
      ${z.survie ? '' : `<div class="stars">${[0, 1, 2].map((i) => `<span class="${i < stars ? 'on' : ''}" style="animation-delay:${0.2 + i * 0.25}s">★</span>`).join('')}</div>`}
      <p class="big-score">${G.score} pts</p>
      ${rec ? '<p class="newrec">🏆 NOUVEAU RECORD !</p>' : oldBest ? `<p class="center" style="color:var(--dim);margin:0">Record : ${oldBest} pts</p>` : ''}
      <div class="stats"><div><b>${defused}</b><span>désamorcée${defused > 1 ? 's' : ''}</span></div><div><b>${G.booms}</b><span>explosion${G.booms > 1 ? 's' : ''}</span></div><div><b>${G.errors}</b><span>erreur${G.errors > 1 ? 's' : ''}</span></div></div>
      <div class="villain"><span class="face" aria-hidden="true">🦹</span><div class="bubble">${villain}</div></div>
      ${unlockedNow ? `<p class="center" style="margin:12px 0 0;font-weight:800;color:var(--green)">🔓 ${next ? `Mission débloquée : ${next.icon} ${next.name}` : 'Mode Survie débloqué !'}</p>` : ''}
      ${!z.survie && stars && stars < 3 ? '<p class="center" style="margin:6px 0 0;color:var(--dim);font-size:.9rem">⭐⭐⭐ = aucune explosion et au plus une erreur.</p>' : ''}
      <div class="row" style="margin-top:14px">
        <button type="button" class="btn ghost" data-act="home">← QG</button>
        <button type="button" class="btn${!stars || !next || z.survie ? ' go' : ''}" data-act="again">↻ Rejouer</button>
        ${!z.survie && stars && next ? '<button type="button" class="btn go" data-act="next">Mission suivante ▶</button>' : ''}
        ${!z.survie && stars && !next && survieOpen() ? '<button type="button" class="btn go" data-act="inf">♾️ Mode Survie</button>' : ''}
      </div></div></div>`;
    app.querySelector('[data-act="home"]').addEventListener('click', home);
    app.querySelector('[data-act="again"]').addEventListener('click', () => start(z));
    app.querySelector('[data-act="next"]')?.addEventListener('click', () => brief(next));
    app.querySelector('[data-act="inf"]')?.addEventListener('click', () => brief(SURVIE));
    (app.querySelector('.btn.go') || app.querySelector('.btn')).focus();
    app.scrollTop = 0;
    G = null;
  }

  function confetti(n) {
    const colors = ['#3fe3ff', '#ff5fae', '#ffd23f', '#3ee08f', '#a78bfa', '#ff4d5e'];
    const box = document.createElement('div');
    box.className = 'confetti';
    let h = '';
    for (let i = 0; i < n; i++) h += `<i style="left:${rand(0, 100)}%;background:${colors[i % colors.length]};--dx:${rand(-90, 90)}px;--r:${rand(360, 1080)}deg;animation-delay:${(Math.random() * 0.3).toFixed(2)}s;${i % 3 ? '' : 'border-radius:50%;'}"></i>`;
    box.innerHTML = h;
    document.body.appendChild(box);
    setTimeout(() => box.remove(), 2400);
  }

  /* ---------- Clavier : 1 à 4 pour les réponses ---------- */
  document.addEventListener('keydown', (e) => {
    if (/^[1-4]$/.test(e.key)) {
      const b = app.querySelectorAll('#panel .ch')[Number(e.key) - 1];
      if (b && !b.disabled) { e.preventDefault(); b.click(); }
    }
  });

  home();
})();
