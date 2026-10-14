'use strict';

/* =========================================================
   Outils
   ========================================================= */
const rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const pick = (arr) => arr[rand(0, arr.length - 1)];
const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) { [a, b] = [b, a % b]; } return a; };
const shuffle = (arr) => { for (let i = arr.length - 1; i > 0; i--) { const j = rand(0, i); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; };
const eq = (a, b) => Math.abs(a - b) < 1e-9;

/** Écriture décimale à la française : 2.5 -> "2,5", -1 -> "−1" */
function fmt(x) {
  const r = Math.round(x * 1000) / 1000;
  return String(r).replace('.', ',').replace('-', '−');
}

/** Fraction affichée (HTML) */
function F(n, d) {
  if (typeof n === 'number' && n < 0) return '−' + F(-n, d);
  return `<span class="frac"><span>${n}</span><span>${d}</span></span>`;
}

/** Fraction simplifiée (ou entier si le dénominateur devient 1) */
function Fs(n, d) {
  const g = gcd(n, d) || 1;
  const a = n / g, b = d / g;
  return b === 1 ? fmt(a) : F(a, b);
}

/** Chaîne d'égalités : 10/4 = 5/2 = 2,5 */
function chain(n, d) {
  const parts = [F(n, d)];
  const g = gcd(n, d);
  if (g > 1 && d / g !== 1) parts.push(Fs(n, d));
  parts.push(fmt(n / d));
  return parts.join(' = ');
}

/** Lit une réponse : "7/3", "2,5", "-0.75", "4" */
function parse(str) {
  if (str == null) return null;
  const s = String(str).trim().replace(/\s+/g, '').replace(/,/g, '.').replace(/[−–]/g, '-').replace(/[÷:]/g, '/');
  if (!s) return null;
  const m = s.match(/^(-?\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)$/);
  if (m) {
    const n = Number(m[1]), d = Number(m[2]);
    if (d === 0) return null;
    return { value: n / d, n, d, isFrac: true };
  }
  if (/^-?\d+(\.\d+)?$/.test(s)) return { value: Number(s), isFrac: false };
  return null;
}

/** Champ de réponse */
function inp(kind = 'frac', label = 'Réponse') {
  const mode = kind === 'num' ? 'decimal' : 'text';
  return `<input class="ans ${kind}" type="text" inputmode="${mode}" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="${label}">`;
}
const val = (root, i = 0) => parse(root.querySelectorAll('.ans')[i]?.value);
const markInput = (root, i, ok) => root.querySelectorAll('.ans')[i]?.classList.add(ok ? 'right' : 'wrong');

/* =========================================================
   Progression (enregistrée dans le navigateur)
   ========================================================= */
const STORE = 'revisions5e-fractions-v1';
let stats = {};
try { stats = JSON.parse(localStorage.getItem(STORE)) || {}; } catch (e) { stats = {}; }
function persist() { try { localStorage.setItem(STORE, JSON.stringify(stats)); } catch (e) { /* stockage indisponible */ } }
function saveStat(key, ok) {
  const s = stats[key] || (stats[key] = { ok: 0, total: 0 });
  s.total++; if (ok) s.ok++;
  persist();
}

/* =========================================================
   Droite graduée (SVG)
   ========================================================= */
function drawLine({ min, max, den, points = [], clickable = false }) {
  const W = 720, H = 120, m = 34, y = 58;
  const sc = (W - 2 * m) / (max - min);
  const X = (v) => m + (v - min) * sc;
  let s = `<svg class="nl-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Droite graduée de ${fmt(min)} à ${fmt(max)}, unité partagée en ${den}">`;
  s += `<line x1="${m - 18}" y1="${y}" x2="${W - m + 18}" y2="${y}" class="axis"/>`;
  s += `<path d="M${W - m + 22} ${y} l-10 -6 v12 z" class="arrow"/>`;
  for (let i = Math.round(min * den); i <= Math.round(max * den); i++) {
    const v = i / den, x = X(v).toFixed(1), major = i % den === 0;
    s += `<line x1="${x}" y1="${y - (major ? 15 : 9)}" x2="${x}" y2="${y + (major ? 15 : 9)}" class="tk${major ? ' major' : ''}"/>`;
    if (major) s += `<text x="${x}" y="${y + 44}" class="lbl">${fmt(v)}</text>`;
    if (clickable) {
      const w = sc / den;
      s += `<circle cx="${x}" cy="${y}" r="10" class="mark" data-i="${i}"/>`;
      s += `<rect x="${(X(v) - w / 2).toFixed(1)}" y="${y - 40}" width="${w.toFixed(1)}" height="80" class="hit" data-i="${i}"/>`;
    }
  }
  points.forEach((p) => {
    const x = X(p.v).toFixed(1);
    s += `<circle cx="${x}" cy="${y}" r="8" class="pt"/><text x="${x}" y="${y - 24}" class="pt-lbl">${p.label}</text>`;
  });
  return s + '</svg>';
}

const LINES = [
  { min: -2, max: 3, den: 4, w: 6 },  // quarts
  { min: -2, max: 3, den: 2, w: 2 },  // demis
  { min: 0, max: 2, den: 10, w: 2 },  // dixièmes
];
function pickLine() {
  const bag = [];
  LINES.forEach((l) => { for (let k = 0; k < l.w; k++) bag.push(l); });
  const { min, max, den } = pick(bag);
  return { min, max, den };
}
function pickTick(L) {
  let i;
  do { i = rand(L.min * L.den, L.max * L.den); } while (i % L.den === 0 && Math.random() < 0.9);
  return i;
}

/* =========================================================
   Générateurs d'exercices
   Chaque générateur renvoie { q, check(questionEl), mount?(questionEl) }
   check renvoie null (réponse incomplète), {retry, msg} ou {ok, msg}
   ========================================================= */

// 1. Tables
function genTables() {
  const a = rand(2, 10), b = rand(2, 10), t = rand(0, 2);
  let q, ans;
  if (t === 0) { q = `${a} × ${b} = ${inp('num')}`; ans = a * b; }
  else if (t === 1) { q = `${a} × ${inp('num')} = ${a * b}`; ans = b; }
  else { q = `${a * b} ÷ ${a} = ${inp('num')}`; ans = b; }
  return {
    q: `<p class="big">${q}</p>`,
    check(r) {
      const x = val(r); if (!x) return null;
      const ok = eq(x.value, ans);
      markInput(r, 0, ok);
      return { ok, msg: ok ? `${a} × ${b} = ${a * b}.` : `${a} × ${b} = ${a * b}, donc la bonne réponse est <b>${ans}</b>.` };
    },
  };
}

// 2. Fractions usuelles <-> décimaux
const USUELLES = [[1, 2], [1, 4], [3, 4], [3, 2], [4, 2], [5, 2], [1, 10], [100, 100], [7, 1],
  [1, 5], [2, 5], [3, 10], [7, 10], [1, 100], [5, 4], [9, 4], [7, 2], [6, 3], [9, 10]];
function genDecimal() {
  const [n, d] = pick(USUELLES), v = n / d;
  const why = d === 1 ? `Diviser par 1 ne change rien : ${F(n, d)} = ${n}.` : `${F(n, d)} = ${n} ÷ ${d} = ${fmt(v)}.`;
  if (Math.random() < 0.6) {
    return {
      q: `<p class="big">${F(n, d)} = ${inp('num')}</p><p class="hint">Donne l'écriture décimale.</p>`,
      check(r) {
        const x = val(r); if (!x) return null;
        if (x.isFrac) return { retry: true, msg: 'On attend une écriture décimale, par exemple 0,5 ou 2.' };
        const ok = eq(x.value, v); markInput(r, 0, ok);
        return { ok, msg: why };
      },
    };
  }
  return {
    q: `<p class="big">${fmt(v)} = ${inp('frac')}</p><p class="hint">Écris ce nombre sous forme de fraction (exemple : 3/4).</p>`,
    check(r) {
      const x = val(r); if (!x) return null;
      if (!x.isFrac) return { retry: true, msg: 'On attend une fraction, écrite avec une barre : 3/4.' };
      const ok = eq(x.value, v); markInput(r, 0, ok);
      return { ok, msg: `Par exemple : ${fmt(v)} = ${Fs(n, d)}${gcd(n, d) > 1 && d / gcd(n, d) !== 1 ? ` = ${F(n, d)}` : ''}. ${ok ? '' : why}` };
    },
  };
}

// 3. Nombre quotient
function genQuotient() {
  const a = rand(2, 12);
  let b = rand(1, 60);
  if (b % a === 0 && Math.random() < 0.75) b++;
  return {
    q: `<p class="big">${a} × ${inp('frac')} = ${b}</p><p class="hint">Écris le nombre manquant sous forme de fraction.</p>`,
    check(r) {
      const x = val(r); if (!x) return null;
      const ok = eq(x.value, b / a); markInput(r, 0, ok);
      const verif = `Vérification : ${a} × ${F(b, a)} = ${b}.`;
      if (ok && !x.isFrac) return { ok, msg: `C'est juste, mais on attend surtout la fraction ${F(b, a)}. ${verif}` };
      if (ok) return { ok, msg: verif };
      return { ok, msg: `Le nombre qui, multiplié par ${a}, donne ${b}, c'est ${F(b, a)}. ${verif}` };
    },
  };
}

// 4. Lire une abscisse
function genLire() {
  const L = pickLine(), i = pickTick(L), v = i / L.den;
  return {
    q: `<p>Quelle est l'abscisse du point <b>A</b> ? <span class="hint">(fraction ou écriture décimale)</span></p>
        <div class="nl">${drawLine({ ...L, points: [{ v, label: 'A' }] })}</div>
        <p class="big">A ( ${inp('frac')} )</p>`,
    check(r) {
      const x = val(r); if (!x) return null;
      const ok = eq(x.value, v); markInput(r, 0, ok);
      return { ok, msg: `L'unité est partagée en ${L.den} parts égales : chaque graduation vaut ${F(1, L.den)}. A est à ${Math.abs(i)} graduation${Math.abs(i) > 1 ? 's' : ''} ${i < 0 ? 'à gauche' : 'à droite'} de 0, donc A a pour abscisse ${chain(i, L.den)}.` };
    },
  };
}

// 5. Placer un nombre
function genPlacer() {
  const L = pickLine(), i = pickTick(L), v = i / L.den;
  const asFrac = i % L.den !== 0 && Math.random() < (L.den === 10 ? 0.3 : 0.55);
  const disp = asFrac ? Fs(i, L.den) : fmt(v);
  return {
    q: `<p>Place le nombre <b class="big-inline">${disp}</b> : clique sur la bonne graduation.</p>
        <div class="nl">${drawLine({ ...L, clickable: true })}</div>`,
    mount(r) {
      const nl = r.querySelector('.nl');
      nl.querySelectorAll('.hit').forEach((h) => h.addEventListener('click', () => {
        nl.dataset.sel = h.dataset.i;
        nl.querySelectorAll('.mark').forEach((c) => c.classList.toggle('on', c.dataset.i === h.dataset.i));
      }));
    },
    check(r) {
      const nl = r.querySelector('.nl');
      if (nl.dataset.sel === undefined) return null;
      const ok = Number(nl.dataset.sel) === i;
      nl.querySelector(`.mark[data-i="${i}"]`)?.classList.add('good');
      return { ok, msg: `${disp} = ${chain(i, L.den)}. Chaque graduation vaut ${F(1, L.den)}, il faut compter ${Math.abs(i)} graduation${Math.abs(i) > 1 ? 's' : ''} ${i < 0 ? 'vers la gauche' : 'vers la droite'} à partir de 0${ok ? '.' : ' (point vert).'}` };
    },
  };
}

// 6. Fractions égales
function genEgales() {
  let p, q;
  do { p = rand(1, 9); q = rand(2, 9); } while (gcd(p, q) !== 1 || p === q);
  const k = rand(2, 4), n = p * k, d = q * k;
  const key = (a, b) => `${a}/${b}`;
  const good = new Map(), bad = new Map();
  const addG = (a, b) => { if (!(a === n && b === d)) good.set(key(a, b), [a, b]); };
  const addB = (a, b) => {
    if (a > 0 && b > 0 && !eq(a / b, p / q) && !(a === n && b === d)) bad.set(key(a, b), [a, b]);
  };
  const ms = shuffle([2, 3, 5, 10]);
  addG(p, q);
  addG(n * ms[0], d * ms[0]);
  if (Math.random() < 0.5) addG(p * ms[1], q * ms[1]);
  const s = rand(1, 4);
  addB(n + s, d + s);          // piège : ajouter le même nombre
  addB(q, p);                  // fraction inverse
  addB(n * 2, d);              // multiplier seulement en haut
  addB(p + 1, q);
  addB(n * ms[2], d + ms[2]);  // multiplier en haut, ajouter en bas
  addB(n, d * ms[3]);          // multiplier seulement en bas

  const goodArr = [...good.values()];
  const badArr = shuffle([...bad.values()]).slice(0, Math.max(2, 5 - goodArr.length));
  const items = shuffle([...goodArr.map((f) => ({ f, ok: true })), ...badArr.map((f) => ({ f, ok: false }))]);

  const explain = (a, b) => {
    if (a % n === 0 && b % d === 0 && a / n === b / d) return `on multiplie numérateur et dénominateur par ${a / n} : ${F(`${n} × ${a / n}`, `${d} × ${a / n}`)} = ${F(a, b)}`;
    if (n % a === 0 && d % b === 0 && n / a === d / b) return `on divise numérateur et dénominateur par ${n / a} : ${F(`${n} ÷ ${n / a}`, `${d} ÷ ${n / a}`)} = ${F(a, b)}`;
    return `${F(n, d)} et ${F(a, b)} se simplifient toutes les deux en ${F(p, q)}`;
  };

  return {
    q: `<p>Coche <b>toutes</b> les fractions égales à ${F(n, d)} :</p>
        <div class="choices">${items.map((it, j) => `<label class="choice"><input type="checkbox" class="cb" data-j="${j}"> ${F(it.f[0], it.f[1])}</label>`).join('')}</div>`,
    check(r) {
      const cbs = [...r.querySelectorAll('.cb')];
      if (!cbs.some((c) => c.checked)) return null;
      let ok = true, trap = false;
      cbs.forEach((c, j) => {
        const it = items[j];
        if (c.checked !== it.ok) ok = false;
        if (it.ok) c.parentElement.classList.add('is-good');
        else if (c.checked) {
          c.parentElement.classList.add('is-bad');
          if (it.f[0] - n === it.f[1] - d) trap = true;
        }
        c.disabled = true;
      });
      let msg = `Les fractions égales à ${F(n, d)} sont (en vert) :<ul>${goodArr.map(([a, b]) => `<li>${F(a, b)} : ${explain(a, b)}</li>`).join('')}</ul>`;
      if (trap) msg += 'Attention : ajouter le même nombre en haut et en bas ne donne <b>pas</b> une fraction égale.';
      return { ok, msg };
    },
  };
}

// 7. Simplifier
function genSimplifier() {
  let p, q;
  do { p = rand(1, 20); q = rand(2, 12); } while (gcd(p, q) !== 1 || p === q);
  const k = pick([2, 3, 4, 5, 6, 7, 8, 9, 10]);
  const n = p * k, d = q * k;
  return {
    q: `<p class="big">${F(n, d)} = ${inp('frac')}</p><p class="hint">Simplifie au maximum (exemple de saisie : 13/4).</p>`,
    check(r) {
      const x = val(r); if (!x) return null;
      if (!x.isFrac) return { retry: true, msg: 'Écris ta réponse sous forme de fraction, avec une barre : 13/4.' };
      if (!eq(x.value, n / d)) {
        markInput(r, 0, false);
        return { ok: false, msg: `On divise numérateur et dénominateur par ${k} : ${F(`${n} ÷ ${k}`, `${d} ÷ ${k}`)} = ${F(p, q)}.` };
      }
      const g = Number.isInteger(x.n) && Number.isInteger(x.d) ? gcd(x.n, x.d) : 0;
      if (g !== 1) return { retry: true, msg: `C'est bien égal, mais ce n'est pas simplifié au maximum : ${F(x.n, x.d)} peut encore se diviser par ${g || '…'}. Continue !` };
      markInput(r, 0, true);
      return { ok: true, msg: `${F(`${n} ÷ ${k}`, `${d} ÷ ${k}`)} = ${F(p, q)}, et ${F(p, q)} ne se simplifie plus.` };
    },
  };
}

// 8. Formes multiples
function genFormes() {
  const den = pick([2, 4, 5, 10]);
  const E = rand(1, 4), rest = rand(1, den - 1), n = E * den + rest, v = n / den;
  const D = den === 4 ? 100 : 10;
  const decN = Math.round(v * D);
  const g = gcd(n, den), irrN = n / g, irrD = den / g;
  const rg = gcd(rest, den), rN = rest / rg, rD = den / rg;
  return {
    q: `<p>Écris le nombre <b>${fmt(v)}</b> sous trois formes :</p>
      <div class="form-lines">
        <div class="form-line">${fmt(v)} = ${inp('frac', 'Fraction décimale')}<small>fraction de dénominateur 10 ou 100</small></div>
        <div class="form-line">${fmt(v)} = ${inp('frac', 'Fraction irréductible')}<small>fraction simplifiée au maximum</small></div>
        <div class="form-line">${fmt(v)} = ${inp('num', 'Partie entière')} + ${inp('frac', 'Fraction inférieure à 1')}<small>entier + fraction plus petite que 1</small></div>
      </div>`,
    check(r) {
      const a = val(r, 0), b = val(r, 1), e = val(r, 2), f = val(r, 3);
      if (!a || !b || !e || !f) return null;
      const ok1 = a.isFrac && (a.d === 10 || a.d === 100) && eq(a.value, v);
      const ok2 = b.isFrac && eq(b.value, v) && Number.isInteger(b.n) && Number.isInteger(b.d) && gcd(b.n, b.d) === 1;
      const ok3 = eq(e.value, E) && f.isFrac && eq(f.value, rest / den);
      [ok1, ok2, eq(e.value, E), f.isFrac && eq(f.value, rest / den)].forEach((o, i) => markInput(r, i, o));
      const ok = ok1 && ok2 && ok3;
      return { ok, msg: `${fmt(v)} = ${F(decN, D)} = ${F(irrN, irrD)} = ${E} + ${F(rN, rD)}${ok ? '' : `<br>Astuce : ${fmt(v)}, c'est ${E} unité${E > 1 ? 's' : ''} et ${fmt(v - E)}.`}` };
    },
  };
}

const GENS = {
  tables: { f: genTables, label: 'Tables' },
  decimal: { f: genDecimal, label: 'Écritures décimales' },
  quotient: { f: genQuotient, label: 'Nombre quotient' },
  lire: { f: genLire, label: 'Lire sur une droite' },
  placer: { f: genPlacer, label: 'Placer sur une droite' },
  egales: { f: genEgales, label: 'Fractions égales' },
  simplifier: { f: genSimplifier, label: 'Simplifier' },
  formes: { f: genFormes, label: 'Formes multiples' },
};

/* =========================================================
   Moteur d'exercice
   ========================================================= */
function makeExercise(root, gen, opts = {}) {
  const limit = opts.limit || 0;
  const key = root.dataset.key;
  let cur = null, answered = false, count = 0, good = 0, history = [];
  if (opts.makeGen) gen = opts.makeGen();

  root.innerHTML = `
    <div class="ex-bar"><span class="ex-count"></span><span class="ex-score"></span></div>
    <div class="ex-q"></div>
    <div class="ex-fb" aria-live="polite"></div>
    <div class="ex-actions">
      <button type="button" class="btn primary ex-check">Vérifier</button>
      <button type="button" class="btn ex-next">Question suivante →</button>
    </div>`;
  const qEl = root.querySelector('.ex-q');
  const fb = root.querySelector('.ex-fb');
  const bCheck = root.querySelector('.ex-check');
  const bNext = root.querySelector('.ex-next');
  const cEl = root.querySelector('.ex-count');
  const sEl = root.querySelector('.ex-score');

  function bar() {
    sEl.textContent = count ? `Score : ${good} / ${count}` : '';
    cEl.textContent = limit ? `Question ${Math.min(answered ? count : count + 1, limit)} / ${limit}` : '';
  }

  function render(focus) {
    cur = gen();
    answered = false;
    root.classList.remove('done');
    qEl.innerHTML = cur.q;
    fb.className = 'ex-fb'; fb.innerHTML = '';
    bCheck.hidden = false; bCheck.disabled = false;
    bNext.textContent = 'Question suivante →';
    bNext.disabled = !!limit;
    if (cur.mount) cur.mount(qEl);
    bar();
    if (focus) qEl.querySelector('input')?.focus({ preventScroll: true });
  }

  function check() {
    if (answered) return;
    const res = cur.check(qEl);
    if (!res) { fb.className = 'ex-fb warn'; fb.innerHTML = 'Complète ta réponse avant de vérifier.'; return; }
    if (res.retry) { fb.className = 'ex-fb warn'; fb.innerHTML = res.msg; return; }
    answered = true; count++;
    if (res.ok) good++;
    if (key && !limit) saveStat(key, res.ok);
    if (limit) history.push({ label: cur.label, ok: res.ok });
    root.classList.add('done');
    qEl.querySelectorAll('input').forEach((i) => { i.disabled = true; });
    fb.className = 'ex-fb ' + (res.ok ? 'ok' : 'ko');
    fb.innerHTML = (res.ok ? '<strong>✔ Bravo !</strong> ' : '<strong>✘ Pas tout à fait.</strong> ') + res.msg;
    bCheck.disabled = true;
    bNext.disabled = false;
    if (limit && count >= limit) bNext.textContent = 'Voir ma note';
    bar();
    bNext.focus({ preventScroll: true });
  }

  function summary() {
    const note = Math.round((good / limit) * 20 * 2) / 2;
    stats.controle = { last: note, best: Math.max(note, stats.controle?.best ?? 0), n: (stats.controle?.n ?? 0) + 1 };
    persist();
    const advice = note >= 16 ? 'Excellent, tu es prêt(e) pour le devoir !'
      : note >= 12 ? 'Bon travail ! Revois les points en rouge.'
      : 'Reprends la fiche puis entraîne-toi sur les points en rouge.';
    qEl.innerHTML = `<div class="result">
      <p class="note">${fmt(note)} / 20</p>
      <p>${good} bonne${good > 1 ? 's' : ''} réponse${good > 1 ? 's' : ''} sur ${limit}. ${advice}</p>
      <ul>${history.map((h) => `<li class="${h.ok ? 'ok' : 'ko'}">${h.label}</li>`).join('')}</ul></div>`;
    fb.className = 'ex-fb'; fb.innerHTML = '';
    bCheck.hidden = true;
    bNext.textContent = 'Recommencer un contrôle';
    sEl.textContent = ''; cEl.textContent = '';
    bNext.onclick = () => {
      bNext.onclick = null;
      count = 0; good = 0; history = [];
      if (opts.makeGen) gen = opts.makeGen();
      render(true);
    };
  }

  function next() {
    if (bNext.onclick) return; // géré par le bouton « Recommencer »
    if (limit && !answered) return;
    if (limit && count >= limit) { summary(); return; }
    render(true);
  }

  bCheck.addEventListener('click', check);
  bNext.addEventListener('click', next);
  root.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.tagName === 'INPUT' && !answered) { e.preventDefault(); check(); }
  });
  render(false);
}

/* =========================================================
   Accueil : tuiles de progression
   ========================================================= */
const SECTIONS = [
  { id: 'fiche', title: 'Fiche de cours', desc: 'Tout ce qu\'il faut savoir, avec exemples.' },
  { id: 'automatismes', title: 'Automatismes', desc: 'Tables et écritures décimales.', keys: ['tables', 'decimal'] },
  { id: 'quotient', title: 'Nombre quotient', desc: 'Multiplications à trou : 3 × … = 7.', keys: ['quotient'] },
  { id: 'droite', title: 'Droite graduée', desc: 'Lire et placer des nombres.', keys: ['lire', 'placer'] },
  { id: 'egales', title: 'Fractions égales', desc: 'Reconnaître des fractions égales.', keys: ['egales'] },
  { id: 'simplifier', title: 'Simplifier', desc: 'Réduire une fraction au maximum.', keys: ['simplifier'] },
  { id: 'formes', title: 'Formes multiples', desc: 'Décimal, fraction, entier + fraction.', keys: ['formes'] },
  { id: 'controle', title: 'Contrôle blanc', desc: '10 questions, note sur 20.' },
];

function renderHome() {
  const html = SECTIONS.map((s) => {
    let pct = null, stat = '';
    if (s.keys) {
      let ok = 0, total = 0;
      s.keys.forEach((k) => { ok += stats[k]?.ok || 0; total += stats[k]?.total || 0; });
      pct = total ? Math.round((ok / total) * 100) : 0;
      stat = total ? `${ok} / ${total} réussies (${pct} %)` : 'Pas encore commencé';
    } else if (s.id === 'controle') {
      const c = stats.controle;
      pct = c ? Math.round((c.best / 20) * 100) : 0;
      stat = c ? `Meilleure note : ${fmt(c.best)} / 20` : 'Pas encore fait';
    }
    return `<a class="tile" href="#${s.id}"><h3>${s.title}</h3><p>${s.desc}</p>
      ${pct !== null ? `<div class="bar"><span style="width:${pct}%"></span></div><div class="stat">${stat}</div>` : '<div class="stat">À relire avant chaque séance →</div>'}</a>`;
  }).join('');
  document.getElementById('cards').innerHTML = html;
}

/* =========================================================
   Navigation
   ========================================================= */
function show(id) {
  const target = document.getElementById(id);
  if (!target || !target.classList.contains('page')) id = 'accueil';
  document.querySelectorAll('.page').forEach((p) => p.classList.toggle('active', p.id === id));
  document.querySelectorAll('#nav a').forEach((a) => {
    if (a.getAttribute('href') === '#' + id) {
      a.setAttribute('aria-current', 'page');
      a.scrollIntoView({ block: 'nearest', inline: 'center' });
    } else a.removeAttribute('aria-current');
  });
  if (id === 'accueil') renderHome();
  window.scrollTo(0, 0);
}

/* =========================================================
   Démarrage
   ========================================================= */
document.addEventListener('DOMContentLoaded', () => {
  // Transforme [[a|b]] en fractions dans les textes de cours
  document.querySelectorAll('#fiche, .lead').forEach((el) => {
    el.innerHTML = el.innerHTML.replace(/\[\[(.+?)\|(.+?)\]\]/g, (m, a, b) => F(a, b));
  });

  // Droite graduée de la fiche (exemple du cours)
  const ex = [['9', '4', 9 / 4], ['0,25', null, 0.25], ['−0,75', null, -0.75], ['5', '4', 5 / 4],
    ['2,75', null, 2.75], ['5', '2', 5 / 2], ['−1,25', null, -1.25]];
  const letters = 'ABCDEFG';
  document.getElementById('fiche-droite').innerHTML =
    drawLine({ min: -2, max: 3, den: 4, points: ex.map((e, i) => ({ v: e[2], label: letters[i] })) });
  document.getElementById('fiche-legende').innerHTML =
    ex.map((e, i) => `<span><b>${letters[i]}</b> : ${e[1] ? F(e[0], e[1]) + ' = ' + fmt(e[2]) : e[0]}</span>`).join('');

  // Exercices d'entraînement
  document.querySelectorAll('.exercise[data-gen]').forEach((el) => makeExercise(el, GENS[el.dataset.gen].f));

  // Contrôle blanc : chaque compétence au moins une fois + 2 au hasard
  makeExercise(document.getElementById('exam'), null, {
    limit: 10,
    makeGen() {
      const keys = Object.keys(GENS);
      const queue = shuffle([...keys, pick(keys), pick(keys)]);
      return () => {
        const k = queue.shift() || pick(keys);
        const o = GENS[k].f();
        o.label = GENS[k].label;
        o.q = `<p class="tag">${GENS[k].label}</p>` + o.q;
        return o;
      };
    },
  });

  document.getElementById('reset').addEventListener('click', () => {
    if (confirm('Effacer toute ta progression ?')) { stats = {}; persist(); renderHome(); }
  });

  window.addEventListener('hashchange', () => show(location.hash.slice(1)));
  show(location.hash.slice(1) || 'accueil');
});
