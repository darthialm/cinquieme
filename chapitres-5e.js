/** niveau demandé par une série d'entraînement (1, 2, 3) ou rien (0 : au hasard) */
const LV = (a, b, c) => { const L = typeof GEN_LEVEL === 'number' ? GEN_LEVEL : 0; return L === 1 ? a : L === 2 ? b : L === 3 ? c : null; };
'use strict';
/* =========================================================
   Révisions 5e — chapitres 4 à 7 (suite de l'année)
   4. Proportionnalité (partie 1)   5. Angles   6. Fractions (partie 2)   7. Divisibilité
   Ce fichier s'ajoute à script.js : il déclare les exercices dans GENS et les chapitres dans CHAPTERS.
   Chaque exercice : { q, check, hints, remediate }.  __solve / __wrong ne servent qu'aux tests automatiques.
   ========================================================= */

/* ---------- Outils communs ---------- */
const rnd = (x) => Math.round(x * 1e6) / 1e6;
const near = (a, b) => Math.abs(a - b) < 1e-6;
const big = (x) => { const [a, b] = fmt(x).split(','); const g = a.replace(/\B(?=(\d{3})+(?!\d))/g, ' '); return b ? g + ',' + b : g; };
/** lit un nombre en ignorant une unité tapée (cm, %, €, °, km…) */
function valU(r, i = 0) {
  const s = r.querySelectorAll('.ans')[i]?.value;
  if (s == null) return null;
  return parse(String(s).replace(/[A-Za-zµ€%°²³]+/g, ''));
}
const setAns = (r, i, v) => { const el = r.querySelectorAll('.ans')[i]; if (el) el.value = v; };
const unit = (u) => `<span class="unit">${u}</span>`;
const dec = (x) => fmt(rnd(x));
/** les mcq de ce fichier : bonne réponse = options[correct] */
function solveMcq(o) { o.__solve = (r) => { r.querySelector(`.rb[data-o="${o._correct}"]`).checked = true; }; o.__wrong = (r) => { const w = o._opts.findIndex((_, i) => i !== o._correct); r.querySelector(`.rb[data-o="${w}"]`).checked = true; }; return o; }
function ptab(rows) {
  return `<table class="ptab">${rows.map((r) => `<tr><th>${r[0]}</th>${r.slice(1).map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</table>`;
}
const quo = (a, b) => { const v = a / b, t = Math.round(v * 100) / 100; return { txt: (Math.abs(t - v) < 1e-9 ? '' : '≈ ') + fmt(t), v }; };

/* ---------- Aides visuelles : tableaux fléchés, enchaînements de calculs, calculatrice ---------- */
const fig5v = (x) => (typeof x === 'number' ? big(x) : String(x));
/** Tableau dessiné avec ses flèches.
    rows : [[titre, valeurs…], …] · hl : cases à surligner [ligne, colonne]
    top / bot : flèches entre colonnes, au-dessus / au-dessous { from, to, t } ·
    right / left : flèche descendante à droite / montante à gauche ·
    down : sous le tableau (qui reste entier), le nombre par lequel on multiplie dans chaque colonne { col, t, c: 'ok' | 'ko' } ·
    cap : petite légende au-dessus (« Ton tableau ») */
function tabFig({ rows, hl = [], top = [], bot = [], right, left, down, cap }) {
  const nc = rows[0].length - 1, H = 32, GAP = 0;
  const w = (s, b) => String(fig5v(s)).length * (b ? 9 : 8.4) + 20;
  const W0 = Math.max(down ? 128 : 0, ...rows.map((r) => w(r[0], true)));
  const cw = Array.from({ length: nc }, (_, c) => Math.max(top.length || bot.length ? 52 : 40, ...rows.map((r) => w(r[c + 1]))));
  if (down) down.forEach((d) => { cw[d.col] = Math.max(cw[d.col], String(d.t).length * 8 + 44); });
  const mL = left ? String(left).length * 8 + 34 : 2, mR = right ? String(right).length * 8 + 34 : 2;
  const pT = top.length ? 36 : 3, pB = bot.length || down ? 38 : 3;
  const xs = []; let x = mL + W0; cw.forEach((c) => { xs.push(x); x += c; });
  const TW = x, yRow = (i) => pT + i * (H + GAP), yEnd = yRow(rows.length - 1) + H, cx = (c) => xs[c] + cw[c] / 2;
  const isHl = (i, c) => hl.some(([a, b]) => a === i && b === c);
  let s = '';
  rows.forEach((r, i) => {
    const y = yRow(i);
    s += `<rect class="tf-th" x="${mL}" y="${y}" width="${W0}" height="${H}"/><text class="tf-b" x="${mL + 9}" y="${y + 21}">${r[0]}</text>`;
    r.slice(1).forEach((v, c) => {
      s += `<rect class="${isHl(i, c) ? 'tf-hl' : 'tf-c'}" x="${xs[c]}" y="${y}" width="${cw[c]}" height="${H}"/><text class="${isHl(i, c) ? 'tf-b tf-a' : ''}" x="${cx(c)}" y="${y + 21}" text-anchor="middle">${fig5v(v)}</text>`;
    });
  });
  const arc = (a, up) => {
    const x1 = cx(a.from), x2 = cx(a.to), d = up ? -1 : 1, y0 = up ? pT - 2 : yEnd + 2, ym = y0 + d * 22, sg = x2 > x1 ? 1 : -1;
    return `<path class="tf-ar" d="M${x1} ${y0} C${x1} ${ym} ${x2} ${ym} ${x2} ${y0} m${-sg * 7} ${d * 5} l${sg * 7} ${-d * 5} l${sg * 1} ${d * 8}"/><text class="tf-l" x="${(x1 + x2) / 2}" y="${up ? y0 - 21 : y0 + 31}" text-anchor="middle">${a.t}</text>`;
  };
  top.forEach((a) => { s += arc(a, true); });
  bot.forEach((a) => { s += arc(a, false); });
  const y1 = pT + H / 2, y2 = yEnd - H / 2;
  if (right) s += `<path class="tf-ar" d="M${TW + 3} ${y1} C${TW + 24} ${y1 + 3} ${TW + 24} ${y2 - 3} ${TW + 3} ${y2} m8 -7 l-8 7 l9 3"/><text class="tf-l" x="${TW + 26}" y="${(y1 + y2) / 2 + 5}">${right}</text>`;
  if (left) s += `<path class="tf-ar" d="M${mL - 3} ${y2} C${mL - 24} ${y2 - 3} ${mL - 24} ${y1 + 3} ${mL - 3} ${y1} m-8 7 l8 -7 l-9 -3"/><text class="tf-l" x="${mL - 26}" y="${(y1 + y2) / 2 + 5}" text-anchor="end">${left}</text>`;
  if (down) {
    // une ligne de pastilles sous le tableau : « × 4 ✓ » dans chaque colonne
    const y = yEnd + 6;
    s += `<text class="tf-n" x="${mL + 6}" y="${y + 18}">on a multiplié par</text>`;
    down.forEach((d) => {
      const c = d.c ? ` tf-${d.c}` : '', mark = d.c === 'ok' ? ' ✓' : d.c === 'ko' ? ' ✗' : '', t = d.t + mark, wd = t.length * 8 + 14;
      s += `<rect class="tf-chip${c}" x="${cx(d.col) - wd / 2}" y="${y}" width="${wd}" height="26" rx="13"/><text class="tf-l${c}" x="${cx(d.col)}" y="${y + 18}" text-anchor="middle">${t}</text>`;
    });
  }
  const fw = TW + mR, fh = yEnd + pB;
  return `<div class="pfig">${cap ? `<div class="pcap">${cap}</div>` : ''}<svg class="tabfig" viewBox="0 0 ${fw} ${fh}" width="${fw}" height="${fh}" role="img" aria-label="Tableau de proportionnalité avec des flèches">${s}</svg></div>`;
}
/** Enchaînement de calculs : pasAPas('8 ÷ 25', {a:'='}, '0,32') : un bloc par étape, une flèche étiquetée entre deux */
const pasAPas = (...it) => `<div class="pchain">${it.map((x) => (typeof x === 'object' ? `<span class="ch-a">${x.a === '=' ? '=' : `<small>${x.a}</small>→`}</span>` : `<span class="ch-b">${x}</span>`)).join('')}</div>`;
/** Pourquoi on divise pour trouver le coefficient : la division fait le chemin inverse de la multiplication */
const whyDiv = (a, b) => `<div class="pwhy"><b>Pourquoi une division ?</b> On cherche le nombre caché dans <b>${fmt(a)} × ? = ${fmt(b)}</b>. La division fait le chemin <b>inverse</b> de la multiplication : comme 3 × 4 = 12, on retrouve le 4 en faisant 12 ÷ 3 = 4. Ici, c'est pareil :${pasAPas(fmt(a), { a: '× ?' }, fmt(b))}${pasAPas(fmt(b), { a: `÷ ${fmt(a)}` }, '?')}On retrouve donc le coefficient avec <b>${fmt(b)} ÷ ${fmt(a)}</b> : le nombre du bas divisé par le nombre du haut.</div>`;
/** Calculatrice d'indice : le calcul est déjà écrit, l'élève appuie sur « = » (les nombres se tapent aussi au clavier) */
const CALC_KEYS = ['7', '8', '9', '÷', 'C', '4', '5', '6', '×', '⌫', '1', '2', '3', '−', '(', '0', ',', '=', '+', ')'];
function calcBox(expr = '') {
  const e = String(expr).replace(/\./g, ',');
  return `<div class="calc5"><div class="c5-t">🧮 Calculatrice</div><div class="c5-l"><input class="c5-in" type="text" inputmode="none" autocomplete="off" aria-label="Calcul" value="${e}"><output class="c5-r"></output></div><div class="c5-k">${CALC_KEYS.map((k) => `<button type="button" data-k="${k}"${k === '=' ? ' class="eq"' : ''}>${k}</button>`).join('')}</div></div>`;
}
/** Calcule une expression (+ − × ÷ et parenthèses) ; null si elle est incomplète */
function calcEval(src) {
  const t = String(src).replace(/\s/g, '').replace(/,/g, '.').replace(/[*x]/g, '×').replace(/[/:]/g, '÷').replace(/-/g, '−').match(/\d+\.?\d*|\.\d+|[+−×÷()]|./g) || [];
  let i = 0;
  const atom = () => {
    if (t[i] === '−') { i++; const v = atom(); return v === null ? null : -v; }
    if (t[i] === '(') { i++; const v = sum(); if (t[i++] !== ')') return null; return v; }
    const v = Number(t[i]); if (t[i] === undefined || Number.isNaN(v)) return null; i++; return v;
  };
  const prod = () => { let v = atom(); while (v !== null && (t[i] === '×' || t[i] === '÷')) { const o = t[i++], b = atom(); if (b === null) return null; v = o === '×' ? v * b : v / b; } return v; };
  function sum() { let v = prod(); while (v !== null && (t[i] === '+' || t[i] === '−')) { const o = t[i++], b = prod(); if (b === null) return null; v = o === '+' ? v + b : v - b; } return v; }
  const v = sum();
  return v === null || i < t.length || !Number.isFinite(v) ? null : v;
}
function calcRun(box) {
  const v = calcEval(box.querySelector('.c5-in').value), out = box.querySelector('.c5-r');
  if (v === null) { out.textContent = 'Calcul incomplet'; return; }
  const a = Math.round(v * 1000) / 1000;
  out.textContent = `${Math.abs(a - v) < 1e-9 ? '=' : '≈'} ${big(a)}`;
}
document.addEventListener('click', (e) => {
  const b = e.target.closest?.('.calc5 button'); if (!b) return;
  const box = b.closest('.calc5'), input = box.querySelector('.c5-in'), k = b.dataset.k;
  if (k === '=') { calcRun(box); return; }
  box.querySelector('.c5-r').textContent = '';
  input.value = k === 'C' ? '' : k === '⌫' ? input.value.slice(0, -1) : input.value + k;
});
// Entrée dans la calculatrice : calcule, sans valider l'exercice
document.addEventListener('keydown', (e) => {
  const box = e.key === 'Enter' && e.target.closest?.('.calc5'); if (!box) return;
  e.preventDefault(); e.stopPropagation(); calcRun(box);
}, true);

/* =========================================================
   CHAPITRE 4 — PROPORTIONNALITÉ
   ========================================================= */
// 1. Reconnaître un tableau de proportionnalité
function genReconnaitre() {
  const k = pick([2, 3, 4, 5, 6, 7, 1.5, 2.5, 0.5, 12, 0.25, 1.2, 3.5, 0.4]);
  const n = pick([3, 4]);
  let r1;
  do { r1 = Array.from({ length: n }, () => pick([1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 0.5, 1.5, 2.5, 0.8, 1.2])); } while (new Set(r1).size < n);
  r1.sort((a, b) => a - b);
  let r2 = r1.map((x) => rnd(x * k)), kind = 'prop', bad = -1;
  if (Math.random() < 0.5) {
    if (Math.random() < 0.5) {
      const j = rand(1, n - 1), old = r2[j];
      do { r2[j] = rnd(old + pick([1, 2, -1, 0.5, -0.5, 3])); } while (r2[j] <= 0 || near(r2[j], old));
      kind = 'une'; bad = j;
    } else { const c = pick([2, 3, 4, 5, 6, 10]); r2 = r1.map((x) => rnd(x + c)); kind = 'add'; r2.c = c; }
  }
  const ok = kind === 'prop';
  const qs = r1.map((x, j) => quo(r2[j], x));
  const rows = [['Ligne 1', ...r1], ['Ligne 2', ...r2]];
  const lab = (q) => (q.txt.startsWith('≈') ? `≈ × ${q.txt.slice(2)}` : `× ${q.txt}`);
  const figA = tabFig({ rows, down: qs.map((q, j) => ({ col: j, t: lab(q), c: ok || (kind === 'une' && j !== bad) ? 'ok' : 'ko' })) });
  const list = qs.map((q) => q.txt).join(' ; ');
  let explain = `Dans chaque colonne, on cherche par combien on multiplie le nombre du haut pour obtenir celui du bas. On le trouve avec une division (le chemin inverse) : par exemple ${fmt(r1[0])} × ? = ${fmt(r2[0])}, donc ? = ${fmt(r2[0])} ÷ ${fmt(r1[0])} ${qs[0].txt.startsWith('≈') ? '' : '= '}${qs[0].txt}. Dans les colonnes, on trouve : ${list}.${figA}`;
  explain += ok ? `C'est <b>le même nombre</b> partout : c'est un tableau de proportionnalité, de coefficient ${fmt(k)}.`
    : 'Ce n\'est <b>pas le même nombre</b> partout : ce n\'est pas un tableau de proportionnalité.' + (kind === 'add' ? ` Ici, on passe de la 1<sup>re</sup> à la 2<sup>e</sup> ligne en <b>ajoutant</b> ${r2.c} : l'addition ne donne pas de la proportionnalité.` : '');
  const o = mcq(`<p>Ce tableau est-il un tableau de proportionnalité ?</p>${ptab([['Ligne 1', ...r1.map(fmt)], ['Ligne 2', ...r2.map(fmt)]])}`,
    ['Oui, c\'est un tableau de proportionnalité', 'Non, ce n\'est pas un tableau de proportionnalité'], ok ? 0 : 1, explain, { col: true });
  o.hints = [
    `Dans chaque colonne, par quel nombre multiplie-t-on le nombre du haut pour obtenir celui du bas ? C'est un tableau de proportionnalité seulement si c'est <b>le même nombre dans toutes les colonnes</b>.${tabFig({ rows, cap: 'Ton tableau', down: r1.map((_, j) => ({ col: j, t: '× ?' })) })}`,
    `Exemple : ici, on multiplie par 3 dans toutes les colonnes : c'est un tableau de proportionnalité.${tabFig({ rows: [['Ligne 1', 2, 5, 8], ['Ligne 2', 6, 15, 24]], down: [0, 1, 2].map((col) => ({ col, t: '× 3', c: 'ok' })) })}Là, le nombre change d'une colonne à l'autre : ce n'en est pas un.${tabFig({ rows: [['Ligne 1', 2, 4], ['Ligne 2', 5, 7]], down: [{ col: 0, t: '× 2,5', c: 'ko' }, { col: 1, t: '× 1,75', c: 'ko' }] })}`,
    `Méthode : commence par la première colonne.${whyDiv(r1[0], r2[0])}Fais ensuite la même chose avec les autres colonnes.${calcBox(`${fmt(r2[0])} ÷ ${fmt(r1[0])}`)}`,
  ];
  o.remediate = (r) => {
    const sel = r.querySelector('.rb:checked'); if (!sel) return null;
    if (kind === 'add' && Number(sel.dataset.o) === 0) return `Regarde comment on passe de la 1<sup>re</sup> ligne à la 2<sup>e</sup> : on <b>ajoute</b> le même nombre. En proportionnalité, on doit <b>multiplier</b> par le même nombre.`;
    if (kind === 'une' && Number(sel.dataset.o) === 0) return 'Calcule les quotients colonne par colonne : sont-ils <b>tous</b> égaux ? Un seul quotient différent suffit pour que ce ne soit pas de la proportionnalité.';
    return null;
  };
  return solveMcq(o);
}

// 2. Compléter un tableau de proportionnalité
function genCompleter() {
  const k = pick([2, 3, 4, 5, 6, 8, 10, 1.5, 2.5, 0.5, 1.2, 0.25, 3.5, 0.4]);
  const n = pick([3, 4]);
  let r1;
  do { r1 = Array.from({ length: n }, () => pick([1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 25, 30, 40, 50])); } while (new Set(r1).size < n);
  r1.sort((a, b) => a - b);
  const r2 = r1.map((x) => rnd(x * k));
  const j = rand(1, n - 1), row = rand(0, 1);          // la colonne 0 reste complète
  const hidden = row === 0 ? r1[j] : r2[j];
  const cell = (rw, c) => (rw === row && c === j ? inp('num') : fmt(rw === 0 ? r1[c] : r2[c]));
  const given = row === 0 ? r2[j] : r1[j];
  const rows = [['Ligne 1', ...r1.map((_, c) => cell(0, c))], ['Ligne 2', ...r2.map((_, c) => cell(1, c))]];
  const kTxt = `${fmt(r2[0])} ÷ ${fmt(r1[0])} = ${fmt(k)}`;
  const figRows = (v) => [['Ligne 1', ...r1.map((x, c) => (row === 0 && c === j ? v : x))], ['Ligne 2', ...r2.map((x, c) => (row === 1 && c === j ? v : x))]];
  const sideArrow = (t) => (row === 1 ? { right: `× ${t}` } : { left: `÷ ${t}` });
  return {
    hints: [
      `Cherche d'abord le <b>coefficient</b> : le nombre par lequel on multiplie en haut pour obtenir le nombre du bas. Utilise la colonne colorée, qui est complète.${tabFig({ rows: figRows('?'), cap: 'Ton tableau', hl: [[0, 0], [1, 0]], right: '× ?' })}${whyDiv(r1[0], r2[0])}`,
      `Exemple : pour <b>descendre</b>, on multiplie par le coefficient.${tabFig({ rows: [['Ligne 1', 3, 4], ['Ligne 2', 4.5, 6]], hl: [[1, 1]], right: '× 1,5' })}Pour <b>remonter</b>, on divise par le coefficient.${tabFig({ rows: [['Ligne 1', 15, 20], ['Ligne 2', 18, 24]], hl: [[0, 1]], left: '÷ 1,2' })}`,
      `Méthode : le coefficient est ${kTxt}. ${row === 1 ? 'Le nombre manquant est en bas : tu descends, donc tu <b>multiplies</b>.' : 'Le nombre manquant est en haut : tu remontes, donc tu <b>divises</b>.'}${tabFig({ rows: figRows('?'), cap: 'Ton tableau', hl: [[row, j]], ...sideArrow(fmt(k)) })}${calcBox(`${fmt(given)} ${row === 1 ? '×' : '÷'} ${fmt(k)}`)}`,
    ],
    remediate(r) {
      const x = valU(r); if (!x || near(x.value, hidden)) return null;
      const dAdd = r2[0] - r1[0];
      if (near(x.value, row === 1 ? given + dAdd : given - dAdd)) return `Tu as <b>ajouté</b> ${fmt(dAdd)} (l'écart de la première colonne). En proportionnalité, on ne passe pas d'une ligne à l'autre en ajoutant, mais en <b>multipliant</b> par le coefficient.`;
      if (row === 1 && near(x.value, given / k)) return 'Tu as <b>divisé</b> par le coefficient. Pour aller de la 1<sup>re</sup> ligne vers la 2<sup>e</sup>, on <b>multiplie</b>.';
      if (row === 0 && near(x.value, given * k)) return 'Tu as <b>multiplié</b> par le coefficient. Pour revenir de la 2<sup>e</sup> ligne vers la 1<sup>re</sup>, on <b>divise</b>.';
      return null;
    },
    q: `<p>Complète ce tableau de proportionnalité.</p>${ptab(rows)}`,
    check(r) {
      const x = valU(r); if (!x) return null;
      const expl = `Le coefficient se calcule dans la colonne complète : ${fmt(r1[0])} × ? = ${fmt(r2[0])}, et on le retrouve avec la division (le chemin inverse) : ${kTxt}.${tabFig({ rows: figRows(hidden), hl: [[row, j]], ...sideArrow(fmt(k)) })}${row === 1 ? `Le nombre manquant est en bas : on descend en <b>multipliant</b> : ${fmt(given)} × ${fmt(k)} = <b>${fmt(hidden)}</b>.` : `Le nombre manquant est en haut : on remonte en <b>divisant</b> : ${fmt(given)} ÷ ${fmt(k)} = <b>${fmt(hidden)}</b>. Vérification : ${fmt(hidden)} × ${fmt(k)} = ${fmt(given)}.`}`;
      if (!near(x.value, hidden)) { markInput(r, 0, false); return { ok: false, msg: expl }; }
      markInput(r, 0, true);
      return { ok: true, msg: expl };
    },
    __solve: (r) => setAns(r, 0, fmt(hidden)),
    __wrong: (r) => setAns(r, 0, fmt(hidden + 7)),
  };
}

// 3. Trouver le coefficient
function genCoef() {
  const k = pick([2, 3, 4, 5, 6, 7, 8, 9, 1.5, 2.5, 0.5, 12, 0.25, 1.2, 3.5, 0.4, 0.2, 15]);
  const n = 3;
  let r1;
  do { r1 = Array.from({ length: n }, () => pick([1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 25])); } while (new Set(r1).size < n);
  r1.sort((a, b) => a - b);
  const r2 = r1.map((x) => rnd(x * k));
  const ctx = pick([['Quantité', 'Prix (€)'], ['Durée (min)', 'Distance (m)'], ['Nombre de pains', 'Farine (g)']]);
  // la colonne la plus simple pour chercher : celle du 1, du 10, du 2… sinon la première
  const ib = Math.max(0, [1, 10, 2, 5].map((x) => r1.indexOf(x)).find((i) => i >= 0) ?? 0);
  const rows = [[ctx[0], ...r1], [ctx[1], ...r2]], a = r1[ib], b = r2[ib], other = ib === 0 ? 1 : 0;
  return {
    hints: [
      `<b>Méthode.</b> Le coefficient est le nombre par lequel on multiplie le nombre du haut pour obtenir celui du bas. Choisis la colonne la plus simple (ici, la colonne colorée) et demande-toi : <b>${fmt(a)} × ? = ${fmt(b)}</b>.${tabFig({ rows, cap: 'Ton tableau', hl: [[0, ib], [1, ib]], right: '× ?' })}`,
      `Exemple : on cherche 4 × ? = 10. On ne le voit pas de tête, alors on fait la <b>division</b> 10 ÷ 4 = 2,5. On vérifie avec l'autre colonne : 6 × 2,5 = 15.${tabFig({ rows: [['Ligne 1', 4, 6], ['Ligne 2', 10, 15]], hl: [[0, 0], [1, 0]], right: '× 2,5' })}`,
      `${whyDiv(a, b)}Vérifie ensuite avec une autre colonne.${a === 1 ? ' Astuce : sous le nombre 1, on lit directement le coefficient, car 1 × ? = ?.' : ''}${calcBox(`${fmt(b)} ÷ ${fmt(a)}`)}`,
    ],
    remediate(r) {
      const x = valU(r); if (!x || near(x.value, k)) return null;
      if (near(x.value, 1 / k)) return 'Tu as divisé la 1<sup>re</sup> ligne par la 2<sup>e</sup> : c\'est le coefficient « dans l\'autre sens ». On demande le coefficient pour aller de la 1<sup>re</sup> ligne à la 2<sup>e</sup> : 2<sup>e</sup> ligne ÷ 1<sup>re</sup> ligne.';
      if (near(x.value, r2[0] - r1[0])) return 'Tu as calculé une <b>différence</b>. Le coefficient est un nombre par lequel on multiplie : il s\'obtient avec une division.';
      return null;
    },
    q: `<p>Ce tableau est un tableau de proportionnalité. Quel est le coefficient de proportionnalité (de la 1<sup>re</sup> ligne vers la 2<sup>e</sup>) ?</p>${ptab([[ctx[0], ...r1.map(fmt)], [ctx[1], ...r2.map(fmt)]])}<p class="big">Coefficient : ${inp('num')}</p>`,
    check(r) {
      const x = valU(r); if (!x) return null;
      const ok = near(x.value, k);
      markInput(r, 0, ok);
      return { ok, msg: `On cherche ${fmt(a)} × ? = ${fmt(b)}. La division fait le chemin inverse : ? = ${fmt(b)} ÷ ${fmt(a)} = <b>${fmt(k)}</b>.${tabFig({ rows, hl: [[0, ib], [1, ib]], right: `× ${fmt(k)}` })}Vérification avec une autre colonne : ${fmt(r1[other])} × ${fmt(k)} = ${fmt(r2[other])}.` };
    },
    __solve: (r) => setAns(r, 0, fmt(k)),
    __wrong: (r) => setAns(r, 0, fmt(k + 1)),
  };
}

// 4. Problèmes de proportionnalité
const PB = [
  { l: ['Cahiers', 'Prix (€)'], u: [0.8, 1.2, 1.5, 2, 2.5, 3, 4, 0.5], what: 'des cahiers', sing: 'un cahier', cost: true, ctx: (n, P) => `${n} cahiers coûtent ${fmt(P)} €.`, ask: (m) => `Combien coûtent ${m} cahiers ?`, un: '€' },
  { l: ['Pommes (kg)', 'Prix (€)'], u: [1.5, 2, 2.5, 3, 4, 1.2, 0.6], what: 'des kilogrammes de pommes', sing: 'un kilogramme', ctx: (n, P) => `${n} kg de pommes coûtent ${fmt(P)} €.`, ask: (m) => `Combien coûtent ${m} kg de pommes ?`, un: '€' },
  { l: ['Personnes', 'Farine (g)'], u: [50, 60, 75, 80, 100, 125, 200], what: 'de la farine', sing: 'une personne', ctx: (n, P) => `Pour ${n} personnes, une recette demande ${fmt(P)} g de farine.`, ask: (m) => `Quelle masse de farine faut-il pour ${m} personnes ?`, un: 'g' },
  { l: ['Distance (km)', 'Essence (L)'], u: [0.6, 0.7, 0.8, 0.9, 1, 1.2], what: 'des litres', sing: 'un kilomètre', ctx: (n, P) => `Une voiture consomme ${fmt(P)} L d'essence pour ${n}0 km.`, ask: (m) => `Quelle quantité d'essence faut-il pour ${m}0 km ?`, un: 'L', fix: true },
  { l: ['Ruban (m)', 'Prix (€)'], u: [2, 3, 4, 5, 6, 8, 12], what: 'des mètres de ruban', sing: 'un mètre', ctx: (n, P) => `${n} m de ruban coûtent ${fmt(P)} €.`, ask: (m) => `Combien coûtent ${m} m de ruban ?`, un: '€' },
];
function genProbleme() {
  const T = pick(PB);
  const u = pick(T.u);
  const n1 = rand(2, 9);
  let n2; do { n2 = rand(2, 18); } while (n2 === n1 || n2 === 2 * n1);
  const P1 = rnd(n1 * u);
  const ans = rnd(n2 * u);
  const additive = rnd(P1 + (n2 - n1));
  const stem = T.ctx(n1, P1);
  const ask = T.ask(n2);
  const one = T.fix ? '10 km' : T.sing, q = (x) => (T.fix ? x * 10 : x), mid = T.fix ? 10 : 1;
  const unitFig = (uv, av) => tabFig({ rows: [[T.l[0], q(n1), mid, q(n2)], [T.l[1], P1, uv, av]], hl: [[1, 2]], top: [{ from: 0, to: 1, t: `÷ ${n1}` }, { from: 1, to: 2, t: `× ${n2}` }], bot: [{ from: 0, to: 1, t: `÷ ${n1}` }, { from: 1, to: 2, t: `× ${n2}` }] });
  const steps = `Passage à l'unité : on cherche d'abord la valeur pour ${one} : ${fmt(P1)} ÷ ${n1} = ${fmt(u)} ${T.un}. Puis on multiplie par ${n2} : ${n2} × ${fmt(u)} = <b>${fmt(ans)} ${T.un}</b>.${unitFig(u, ans)}`
    + (n2 % n1 === 0 ? `Autre méthode : ${n2} = ${n1} × ${n2 / n1}, donc ${fmt(P1)} × ${n2 / n1} = ${fmt(ans)} ${T.un}.` : '');
  return {
    hints: [
      `Range les nombres de l'énoncé dans un tableau de proportionnalité. Quelle méthode choisis-tu : coefficient, multiplication, addition ou passage à l'unité ?${tabFig({ rows: [[T.l[0], q(n1), q(n2)], [T.l[1], P1, '?']], cap: 'Ton tableau', hl: [[1, 1]] })}`,
      `Exemple : 4 places coûtent 36 €, combien coûtent 6 places ? Passage à l'unité : on redescend à 1 place, puis on remonte à 6 places.${tabFig({ rows: [['Places', 4, 1, 6], ['Prix (€)', 36, 9, 54]], hl: [[1, 2]], top: [{ from: 0, to: 1, t: '÷ 4' }, { from: 1, to: 2, t: '× 6' }], bot: [{ from: 0, to: 1, t: '÷ 4' }, { from: 1, to: 2, t: '× 6' }] })}`,
      `Méthode (passage à l'unité) : on avance dans la ligne, en deux flèches : d'abord on recule jusqu'à <b>${one}</b>, puis on avance jusqu'à la valeur demandée.${unitFig('?', '?').replace('<div class="pfig">', '<div class="pfig"><div class="pcap">Ton tableau</div>')}${calcBox(`${fmt(P1)} ÷ ${n1}`)}`,
    ],
    remediate(r) {
      const x = valU(r); if (!x || near(x.value, ans)) return null;
      if (near(x.value, additive)) return `Tu as <b>ajouté</b> ${n2 - n1} à ${fmt(P1)}. Mais quand le nombre double, la valeur double : ce n'est pas la même chose que d'ajouter. En proportionnalité, on <b>multiplie</b> (ou on passe à l'unité).`;
      if (near(x.value, u)) return 'Tu as trouvé la valeur pour <b>une</b> unité. Il reste à calculer la valeur demandée dans la question.';
      return null;
    },
    q: `<p>${stem} C'est une situation de proportionnalité.</p><p><b>${ask}</b></p><p class="big">${inp('num')} ${unit(T.un)}</p>`,
    check(r) {
      const x = valU(r); if (!x) return null;
      const ok = near(x.value, ans);
      markInput(r, 0, ok);
      return { ok, msg: steps };
    },
    __solve: (r) => setAns(r, 0, fmt(ans)),
    __wrong: (r) => setAns(r, 0, fmt(ans + 3)),
  };
}

// 5. Appliquer un pourcentage
const SUJ = [
  (p, N) => `Dans un collège de ${N} élèves, ${p} % sont demi-pensionnaires. Combien d'élèves sont demi-pensionnaires ?`,
  (p, N) => `Sur ${N} billets de concert mis en vente, ${p} % ont été vendus le premier jour. Combien de billets ont été vendus ?`,
  (p, N) => `Calculer ${p} % de ${N}.`,
];
function genPctAppliquer() {
  const p = pick([5, 10, 15, 20, 25, 30, 35, 40, 50, 60, 70, 75, 80, 90, 12, 45]);
  const N = pick([40, 60, 80, 120, 150, 200, 240, 300, 360, 400, 500, 600, 800, 1000, 1200, 2000, 9000]);
  const sujet = pick(SUJ);
  if (sujet !== SUJ[2] && !Number.isInteger((p * N) / 100)) return genPctAppliquer();
  const ans = rnd((p * N) / 100);
  const ex = pick([[35, 60, 21], [8, 250, 20], [65, 40, 26]]);
  const coefP = `× ${dec(p / 100)}`;
  const pctFig = (t, v, cap) => tabFig({ rows: [['Pourcentage', 100, p], ['Quantité', N, v]], cap, hl: [[1, 1]], bot: [{ from: 0, to: 1, t }] });
  return {
    hints: [
      `Un pourcentage est une fraction de dénominateur 100 : ${p} % = ${F(p, 100)} = ${dec(p / 100)}. Prendre ${p} % d'une quantité, c'est la multiplier par ce nombre.${pctFig('× ?', '?', 'Ton tableau')}`,
      `Exemple : ${ex[0]} % de ${ex[1]}.${pasAPas(String(ex[1]), { a: `× ${dec(ex[0] / 100)}` }, String(ex[2]))}`,
      `Méthode de calcul mental : 50 % = la moitié (÷ 2) ; 25 % = le quart (÷ 4) ; 10 % = ÷ 10 ; 1 % = ÷ 100. On peut combiner : 30 % = 3 × 10 %. Sinon, utilise la calculatrice.${calcBox(`${dec(p / 100)} × ${N}`)}`,
    ],
    remediate(r) {
      const x = valU(r); if (!x || near(x.value, ans)) return null;
      if (near(x.value, p / 100)) return `Tu as seulement calculé ${p} % = ${dec(p / 100)}. Il faut ensuite prendre ce pourcentage <b>de ${N}</b> : multiplier par ${N}.`;
      if (near(x.value, p * N)) return `Tu as multiplié ${p} par ${N}, mais il faut aussi <b>diviser par 100</b> (un pourcentage est une fraction sur 100).`;
      if (near(x.value, N - ans)) return `Tu as calculé ce qui <b>reste</b> (${N} − ${fmt(ans)}). On demande ${p} % <b>de</b> ${N}.`;
      return null;
    },
    q: `<p>${sujet(p, N)}</p><p class="big">${inp('num')}</p>`,
    check(r) {
      const x = valU(r); if (!x) return null;
      const ok = near(x.value, ans);
      markInput(r, 0, ok);
      return { ok, msg: `${p} % de ${N} = ${F(p, 100)} × ${N} = ${dec(p / 100)} × ${N} = <b>${fmt(ans)}</b>.${pctFig(coefP, ans)}` };
    },
    __solve: (r) => setAns(r, 0, fmt(ans)),
    __wrong: (r) => setAns(r, 0, fmt(ans + 1)),
  };
}

// 6. Calculer un pourcentage
function genPctCalculer() {
  const p = pick([5, 10, 12, 15, 20, 24, 25, 30, 35, 40, 45, 48, 60, 64, 72, 75, 80, 85, 90]);
  const N = pick([20, 25, 40, 50, 60, 80, 100, 120, 150, 200, 250, 400, 500, 650]);
  const k = (p * N) / 100;
  if (!Number.isInteger(k)) return genPctCalculer();
  const sujet = pick([
    `Dans un collège de ${N} élèves, ${k} sont demi-pensionnaires. Quel pourcentage des élèves est demi-pensionnaire ?`,
    `Sur ${N} questions, un élève en réussit ${k}. Quel est son pourcentage de réussite ?`,
    `Sur ${N} places de cinéma, ${k} sont occupées. Quel pourcentage de la salle est occupé ?`,
  ]);
  const coefQ = dec(k / N);
  return {
    hints: [
      `On compare <b>la partie</b> (${k}) <b>au total</b> (${N}) : on divise, puis on écrit le résultat sur 100.${pasAPas(`${k} ÷ ${N}`, { a: '=' }, '?', { a: '=' }, F('?', 100), { a: '=' }, '? %')}`,
      `Exemple : 18 élèves sur 50.${pasAPas('18 ÷ 50', { a: '=' }, '0,36', { a: '=' }, F(36, 100), { a: '=' }, '36 %')}`,
      `Méthode : le résultat de la division se lit en centièmes : 0,54 = 54 centièmes = 54 %.${calcBox(`${k} ÷ ${N}`)}`,
    ],
    remediate(r) {
      const x = valU(r); if (!x || near(x.value, p)) return null;
      if (near(x.value, p / 100)) return `${dec(p / 100)} est le bon calcul, mais on demande un <b>pourcentage</b> : ${dec(p / 100)} = ${F(p, 100)} = ${p} %. Écris-le en pourcentage.`;
      if (near(x.value, N - k)) return 'Tu as calculé le nombre qui <b>reste</b>. Il faut comparer le nombre demandé au total : division, puis pourcentage.';
      if (near(x.value, k)) return `${k} est le nombre d'élèves, pas le pourcentage. Calcule ${k} ÷ ${N}, puis transforme en pourcentage.`;
      return null;
    },
    q: `<p>${sujet}</p><p class="big">${inp('num')} ${unit('%')}</p>`,
    check(r) {
      const x = valU(r); if (!x) return null;
      const ok = near(x.value, p);
      markInput(r, 0, ok);
      return { ok, msg: `On divise la partie par le total, puis on écrit le résultat sur 100.${pasAPas(`${k} ÷ ${N}`, { a: '=' }, coefQ, { a: '=' }, F(p, 100), { a: '=' }, `<b>${p} %</b>`)}` };
    },
    __solve: (r) => setAns(r, 0, String(p)),
    __wrong: (r) => setAns(r, 0, String(p + 5)),
  };
}

// 7. Prix après réduction
function genSolde() {
  const rr = pick([10, 20, 25, 30, 40, 50, 15]);
  const P = pick([40, 60, 80, 100, 120, 150, 200, 240]);
  const red = rnd((rr * P) / 100), fin = rnd(P - red);
  const art = pick(['un casque', 'une paire de baskets', 'un jeu vidéo', 'un sac', 'un sweat']);
  const pron = art.startsWith('une') ? 'elle' : 'il';
  const twoSteps = (a, b, c, d, e) => pasAPas(`${a} €`, { a: b }, `${c} € de réduction`) + pasAPas(`${a} €`, { a: d }, e);
  return {
    hints: [
      `Il y a deux étapes : d'abord la réduction en euros (${rr} % du prix), puis on la soustrait au prix de départ.${twoSteps(P, `× ${dec(rr / 100)}`, '?', '− la réduction', 'nouveau prix')}`,
      `Exemple : un article à 80 € avec 30 % de réduction.${twoSteps(80, '× 0,3', 24, '− 24', '56 €')}`,
      `Méthode : calcule la réduction, puis soustrais-la à ${P} €.${calcBox(`${dec(rr / 100)} × ${P}`)}`,
    ],
    remediate(r) {
      const x = valU(r); if (!x || near(x.value, fin)) return null;
      if (near(x.value, red)) return `${fmt(red)} € est le montant de la <b>réduction</b>. On demande le <b>nouveau prix</b> : il faut le soustraire à ${P} €.`;
      if (near(x.value, P - rr)) return `Tu as soustrait ${rr} € (le nombre du pourcentage). Mais ${rr} % de ${P} ne fait pas ${rr} €.`;
      return null;
    },
    q: `<p>${cap(art)} coûte ${P} €. Pendant les soldes, ${pron} bénéficie de ${rr} % de réduction. Quel est son nouveau prix ?</p><p class="big">${inp('num')} ${unit('€')}</p>`,
    check(r) {
      const x = valU(r); if (!x) return null;
      const ok = near(x.value, fin);
      markInput(r, 0, ok);
      return { ok, msg: `Réduction : ${rr} % de ${P} = ${dec(rr / 100)} × ${P} = ${fmt(red)} €. Nouveau prix : ${P} − ${fmt(red)} = <b>${fmt(fin)} €</b>.${twoSteps(P, `× ${dec(rr / 100)}`, fmt(red), `− ${fmt(red)}`, `<b>${fmt(fin)} €</b>`)}` };
    },
    __solve: (r) => setAns(r, 0, fmt(fin)),
    __wrong: (r) => setAns(r, 0, fmt(fin + 2)),
  };
}

// 8. Appliquer une échelle
function genEchelleAppliquer() {
  const N = pick([50, 100, 200, 500, 1000, 2000, 10000, 25000, 50000, 100000]);
  const sens = Math.random() < 0.75 ? 'plan→réel' : 'réel→plan';
  const vu = N >= 10000 ? 'km' : N >= 500 ? 'm' : 'cm';
  const toCm = { cm: 1, m: 100, km: 100000 }[vu];
  if (sens === 'plan→réel') {
    const l = pick([2, 3, 4, 5, 6, 7, 8, 8.3, 4.5, 2.5, 12, 9.5]);
    const realCm = rnd(l * N), ans = rnd(realCm / toCm);
    const conv = vu === 'cm' ? '' : pasAPas(`${big(realCm)} cm`, { a: `÷ ${big(toCm)}` }, `<b>${big(ans)} ${vu}</b>`);
    const carte = (t, v, cap) => tabFig({ rows: [['Carte (cm)', 1, l], ['Réalité (cm)', N, v]], cap, hl: [[1, 1]], right: t });
    return {
      hints: [
        `Une échelle ${F(1, big(N))} signifie que 1 cm sur la carte représente ${big(N)} cm dans la réalité. Range les nombres dans un tableau.${carte('× ?', '?', 'Ton tableau')}`,
        `Exemple : échelle ${F(1, 1000)}, 6 cm sur la carte.${tabFig({ rows: [['Carte (cm)', 1, 6], ['Réalité (cm)', 1000, 6000]], hl: [[1, 1]], right: '× 1 000' })}${pasAPas('6 000 cm', { a: '÷ 100' }, '60 m')}`,
        `Méthode : multiplie pour obtenir des centimètres, puis convertis : 1 m = 100 cm ; 1 km = 100 000 cm.${calcBox(`${fmt(l)} × ${N}`)}`,
      ],
      remediate(r) {
        const x = valU(r); if (!x || near(x.value, ans)) return null;
        if (near(x.value, realCm) && vu !== 'cm') return `${big(realCm)} est bien la longueur en <b>centimètres</b>, mais la réponse est demandée en ${vu}. Convertis.`;
        if (near(x.value, rnd(l / N))) return `Tu as divisé par ${big(N)}. Sur le plan la longueur est <b>réduite</b> ; dans la réalité elle est ${big(N)} fois plus grande : on multiplie.`;
        return null;
      },
      q: `<p>Sur une carte à l'échelle ${F(1, big(N))}, une longueur mesure ${fmt(l)} cm. Quelle est la longueur réelle, en <b>${vu}</b> ?</p><p class="big">${inp('num')} ${unit(vu)}</p>`,
      check(r) {
        const x = valU(r); if (!x) return null;
        const ok = near(x.value, ans);
        markInput(r, 0, ok);
        return { ok, msg: `${fmt(l)} × ${big(N)} = ${big(realCm)} cm${vu === 'cm' ? `. La longueur réelle est <b>${big(ans)} cm</b>.` : ` = <b>${big(ans)} ${vu}</b>.`}${carte(`× ${big(N)}`, realCm)}${conv}` };
      },
      __solve: (r) => setAns(r, 0, fmt(ans)),
      __wrong: (r) => setAns(r, 0, fmt(ans + 1)),
    };
  }
  // réel -> plan
  const NN = pick([50, 100, 200, 500, 1000]);
  const lcm = pick([2, 4, 5, 8, 10, 12, 6, 2.5, 7.5]);
  const realCm = rnd(lcm * NN), realM = rnd(realCm / 100);
  const plan = (t, v, cap) => tabFig({ rows: [['Plan (cm)', 1, v], ['Réalité (cm)', NN, realCm]], cap, hl: [[0, 1]], left: t });
  return {
    hints: [
      `L'échelle ${F(1, NN)} signifie que 1 cm sur le plan représente ${NN} cm dans la réalité. Mets d'abord la longueur réelle en centimètres : tu pourras remonter du bas vers le haut du tableau.${plan('÷ ?', '?', 'Ton tableau')}`,
      `Exemple : échelle ${F(1, 50)}, une table de 120 cm.${tabFig({ rows: [['Plan (cm)', 1, 2.4], ['Réalité (cm)', 50, 120]], hl: [[0, 1]], left: '÷ 50' })}`,
      `Méthode : ${fmt(realM)} m = ${big(realCm)} cm. Pour remonter, on divise.${calcBox(`${realCm} ÷ ${NN}`)}`,
    ],
    remediate(r) {
      const x = valU(r); if (!x || near(x.value, lcm)) return null;
      if (near(x.value, rnd(realM / NN))) return `Tu as divisé ${fmt(realM)} (en mètres) par ${NN}. Il faut d'abord convertir ${fmt(realM)} m en centimètres.`;
      if (near(x.value, realCm)) return `Tu as donné la longueur réelle. Sur le plan, la longueur est <b>${NN} fois plus petite</b> : on divise.`;
      return null;
    },
    q: `<p>Un objet mesure ${fmt(realM)} m dans la réalité. On le dessine sur un plan à l'échelle ${F(1, NN)}. Quelle est sa longueur sur le plan, en <b>cm</b> ?</p><p class="big">${inp('num')} ${unit('cm')}</p>`,
    check(r) {
      const x = valU(r); if (!x) return null;
      const ok = near(x.value, lcm);
      markInput(r, 0, ok);
      return { ok, msg: `${fmt(realM)} m = ${big(realCm)} cm. Sur le plan : ${big(realCm)} ÷ ${NN} = <b>${fmt(lcm)} cm</b>.${plan(`÷ ${NN}`, lcm)}` };
    },
    __solve: (r) => setAns(r, 0, fmt(lcm)),
    __wrong: (r) => setAns(r, 0, fmt(lcm + 1)),
  };
}

// 9. Calculer une échelle
function genEchelleCalculer() {
  const N = pick([20, 25, 40, 50, 100, 200, 250, 500, 1000]);
  const l = pick([2, 4, 5, 8, 10, 12, 20]);
  const realCm = l * N, realM = rnd(realCm / 100);
  const inM = realCm >= 200;
  const realTxt = inM ? `${fmt(realM)} m` : `${fmt(realCm)} cm`;
  const obj = pick(['Un bateau', 'Un immeuble', 'Un avion', 'Un camion']);
  const mod = (t, v, cap) => tabFig({ rows: [['Modèle (cm)', l, 1], ['Réalité (cm)', realCm, v]], cap, hl: [[1, 1]], top: [{ from: 0, to: 1, t }], bot: [{ from: 0, to: 1, t }] });
  return {
    hints: [
      `Pour trouver l'échelle, on cherche : « 1 cm sur le modèle représente combien de centimètres dans la réalité ? ». Commence par mettre les deux longueurs dans la <b>même unité</b>.${mod('÷ ?', '?', 'Ton tableau')}`,
      `Exemple : un bateau de 25 m (= 2 500 cm) est représenté par 10 cm. L'échelle est ${F(1, 250)}.${tabFig({ rows: [['Modèle (cm)', 10, 1], ['Réalité (cm)', 2500, 250]], hl: [[1, 1]], top: [{ from: 0, to: 1, t: '÷ 10' }], bot: [{ from: 0, to: 1, t: '÷ 10' }] })}`,
      `Méthode : ${realTxt} = ${big(realCm)} cm. Pour passer de ${l} cm à 1 cm, on divise par ${l} : on fait pareil sur la ligne du bas.${calcBox(`${realCm} ÷ ${l}`)}`,
    ],
    remediate(r) {
      const x = valU(r); if (!x || near(x.value, N)) return null;
      if (inM && near(x.value, rnd(realM / l))) return `Tu as utilisé ${fmt(realM)} (des mètres) avec ${l} (des centimètres). Il faut convertir ${fmt(realM)} m en centimètres d'abord.`;
      if (near(x.value, realCm)) return `${big(realCm)} cm est la longueur réelle <b>totale</b>. L'échelle dit à quoi correspond <b>1 cm</b> du modèle : il faut diviser par ${l}.`;
      return null;
    },
    q: `<p>${obj} de ${realTxt} est représenté par un modèle réduit de ${l} cm. Quelle est l'échelle du modèle ?</p><p class="big">Échelle : ${F(1, inp('num'))}</p>`,
    check(r) {
      const x = valU(r); if (!x) return null;
      const ok = near(x.value, N);
      markInput(r, 0, ok);
      return { ok, msg: `${realTxt} = ${big(realCm)} cm. 1 cm sur le modèle représente ${big(realCm)} ÷ ${l} = ${big(N)} cm. L'échelle est <b>${F(1, big(N))}</b>.${mod(`÷ ${l}`, N)}` };
    },
    __solve: (r) => setAns(r, 0, String(N)),
    __wrong: (r) => setAns(r, 0, String(N + 10)),
  };
}

// 10. Durées et vitesse
function genVitesse() {
  const exact = (x) => Math.abs(x * 10 - Math.round(x * 10)) < 1e-9;
  let v, t, d, T, ans;
  do {
    v = pick([12, 15, 18, 20, 24, 30, 36, 40, 48, 60]);
    t = pick([15, 20, 30, 45]);
    T = pick([60, 90, 120, 75, 10, 5, 40, 15, 30, 45, 20]);
    d = (v * t) / 60; ans = (v * T) / 60;
  } while (T === t || !exact(d) || !exact(ans));
  const Ttxt = T === 60 ? '1 heure' : T === 90 ? '1 h 30 min' : T === 120 ? '2 heures' : T === 75 ? '1 h 15 min' : `${T} minutes`;
  const who = pick(['Un cycliste roule', 'Un coureur court', 'Un train roule', 'Une voiture roule']);
  const g = gcd(t, T), dg = (d * g) / t;
  const coef = rnd(t / d);
  // le tableau : on passe par une durée « commune » quand elle donne des nombres simples
  const simple = exact(dg), direct = g === t || g === T;
  const enMin = T === 60 || T === 90 || T === 120 || T === 75 ? `${Ttxt} = ${T} min. ` : '';
  const vFig = (midV, endV) => {
    if (!simple) return tabFig({ rows: [['Temps (min)', t, T], ['Distance (km)', d, endV]], hl: [[1, 1]] });
    if (direct) { const lb = T > t ? `× ${T / t}` : `÷ ${t / T}`; return tabFig({ rows: [['Temps (min)', t, T], ['Distance (km)', d, endV]], hl: [[1, 1]], top: [{ from: 0, to: 1, t: lb }], bot: [{ from: 0, to: 1, t: lb }] }); }
    const A = { from: 0, to: 1, t: `÷ ${t / g}` }, B = { from: 1, to: 2, t: `× ${T / g}` };
    return tabFig({ rows: [['Temps (min)', t, g, T], ['Distance (km)', d, midV, endV]], hl: [[1, 2]], top: [A, B], bot: [A, B] });
  };
  return {
    hints: [
      `Écris les durées dans la <b>même unité</b> (des minutes). ${enMin}Puis range les nombres dans un tableau.${tabFig({ rows: [['Temps (min)', t, T], ['Distance (km)', d, '?']], cap: 'Ton tableau', hl: [[1, 1]] })}`,
      `Exemple : un athlète court 12 km en 45 min. Combien en 1 h, soit 60 min ? On passe par 15 min, qui est dans les deux durées.${tabFig({ rows: [['Temps (min)', 45, 15, 60], ['Distance (km)', 12, 4, 16]], hl: [[1, 2]], top: [{ from: 0, to: 1, t: '÷ 3' }, { from: 1, to: 2, t: '× 4' }], bot: [{ from: 0, to: 1, t: '÷ 3' }, { from: 1, to: 2, t: '× 4' }] })}`,
      `Méthode : suis les flèches, en faisant la même opération en haut et en bas.${vFig('?', '?')}${calcBox(simple ? `${fmt(d)} ${direct ? (T > t ? `× ${T / t}` : `÷ ${t / T}`) : `÷ ${t / g}`}` : `${fmt(d)} ÷ ${t} × ${T}`)}`,
    ],
    remediate(r) {
      const x = valU(r); if (!x || near(x.value, ans)) return null;
      if (near(x.value, rnd(d + (T - t)))) return `Tu as ajouté ${T - t} (des minutes) à des kilomètres. On ne peut pas ajouter des minutes et des kilomètres : utilise un tableau de proportionnalité.`;
      if (T === 90 && near(x.value, rnd(d * 1.3))) return '1 h 30 min ne s\'écrit pas 1,30 h : 1 h 30 min = 90 min.';
      if (T === 75 && near(x.value, rnd(d * 1.15))) return '1 h 15 min ne s\'écrit pas 1,15 h : 1 h 15 min = 75 min.';
      return null;
    },
    q: `<p>${who} à vitesse constante : ${who.startsWith('Une') ? 'elle' : 'il'} parcourt ${fmt(d)} km en ${t} minutes. Quelle distance parcourt-${who.startsWith('Une') ? 'elle' : 'il'} en ${Ttxt} ?</p><p class="big">${inp('num')} ${unit('km')}</p>`,
    check(r) {
      const x = valU(r); if (!x) return null;
      const ok = near(x.value, ans);
      markInput(r, 0, ok);
      const m = !simple
        ? `${enMin}En 1 min, on parcourt ${fmt(d)} ÷ ${t} km ; en ${T} min : ${fmt(d)} ÷ ${t} × ${T} = <b>${fmt(ans)} km</b>.`
        : direct
          ? `${enMin}Le temps est ${T > t ? `multiplié par ${T / t}` : `divisé par ${t / T}`}, donc la distance aussi : ${fmt(d)} ${T > t ? `× ${T / t}` : `÷ ${t / T}`} = <b>${fmt(ans)} km</b>.`
          : `${enMin}On passe par ${g} min : ${fmt(d)} ÷ ${t / g} = ${fmt(dg)} km. Puis ${fmt(dg)} × ${T / g} = <b>${fmt(ans)} km</b>.`;
      return { ok, msg: m + vFig(dg, ans) + `Vitesse moyenne : ${fmt(v)} km en 1 h, soit ${fmt(v)} km/h.` };
    },
    __solve: (r) => setAns(r, 0, fmt(ans)),
    __wrong: (r) => setAns(r, 0, fmt(ans + 2)),
  };
}

// 11. Conversions de durées
function genDuree() {
  const kind = pick(['dec', 'frac', 'hm']);
  let h, ask, ans, msg;
  let tool = '';
  if (kind === 'dec') { h = pick([0.5, 0.25, 0.75, 1.5, 2.5, 1.25, 0.2, 0.1, 3.5]); ans = rnd(h * 60); ask = `Convertis ${fmt(h)} h en minutes.`; tool = `${fmt(h)} × 60`; msg = pasAPas(`${fmt(h)} h`, { a: '× 60' }, `<b>${fmt(ans)} min</b>`); }
  else if (kind === 'frac') { const [a, b] = pick([[1, 4], [3, 4], [1, 2], [1, 3], [2, 3], [1, 6], [1, 5]]); ans = (60 * a) / b; ask = `Convertis ${F(a, b)} d'heure en minutes.`; tool = `60 ÷ ${b} × ${a}`; msg = `${F(a, b)} h = ${F(a, b)} × 60 = ${F(`${a} × 60`, b)} = <b>${fmt(ans)} min</b>.`; }
  else { const hh = rand(1, 3), mm = pick([10, 15, 20, 30, 40, 45, 50]); ans = hh * 60 + mm; ask = `Convertis ${hh} h ${mm} min en minutes.`; tool = `${hh} × 60 + ${mm}`; msg = pasAPas(`${hh} h`, { a: '× 60' }, `${hh * 60} min`, { a: `+ ${mm} min` }, `<b>${ans} min</b>`); }
  return {
    hints: [
      `Une heure contient 60 minutes. Pour passer des heures aux minutes, on multiplie par 60.${pasAPas('1 h', { a: '× 60' }, '60 min')}`,
      `Exemple :${pasAPas('0,5 h', { a: '× 60' }, '30 min')}${pasAPas('2 h', { a: '× 60' }, '120 min', { a: '+ 20 min' }, '140 min')}`,
      `${kind === 'hm' ? 'Méthode : convertis les heures seules en minutes, puis ajoute les minutes.' : `À connaître :${tabFig({ rows: [['Durée', '1 h', '½ h', '¼ h', '¾ h'], ['Minutes', 60, 30, 15, 45]] })}`}${calcBox(tool)}`,
    ],
    remediate(r) {
      const x = valU(r); if (!x || near(x.value, ans)) return null;
      if (kind === 'hm') { const mm = ans % 60, hh = Math.floor(ans / 60); if (near(x.value, hh * 100 + mm)) return 'Une heure vaut 60 minutes et non 100 minutes.'; }
      if (kind === 'dec' && near(x.value, rnd(h * 100))) return 'Une heure vaut 60 minutes, pas 100 : 0,5 h ne fait pas 50 min.';
      return null;
    },
    q: `<p>${ask}</p><p class="big">${inp('num')} ${unit('min')}</p>`,
    check(r) {
      const x = valU(r); if (!x) return null;
      const ok = near(x.value, ans);
      markInput(r, 0, ok);
      return { ok, msg };
    },
    __solve: (r) => setAns(r, 0, fmt(ans)),
    __wrong: (r) => setAns(r, 0, fmt(ans + 5)),
  };
}

// les exemples fléchés de la fiche de révision
const FICHE_FIGS = {
  why: () => whyDiv(4, 10),
  unite: () => `<p class="tip"><b>Coefficient ou passage à l'unité ?</b> Les deux commencent par le même calcul (36 ÷ 4 = 9), mais pas par le même chemin. Avec le <b>coefficient</b>, on descend d'une ligne à l'autre : on multiplie les places par 9.${tabFig({ rows: [['Places', 4, 6], ['Prix (€)', 36, 54]], hl: [[1, 1]], right: '× 9' })}Avec le <b>passage à l'unité</b>, on reste dans les lignes : on recule de 4 places à 1 place, puis on avance jusqu'à 6 places.${tabFig({ rows: [['Places', 4, 1, 6], ['Prix (€)', 36, 9, 54]], hl: [[1, 2]], top: [{ from: 0, to: 1, t: '÷ 4' }, { from: 1, to: 2, t: '× 6' }], bot: [{ from: 0, to: 1, t: '÷ 4' }, { from: 1, to: 2, t: '× 6' }] })}</p>`,
  reco: () => `Le même nombre partout : oui, le coefficient est 7.${tabFig({ rows: [['Ligne 1', 3.2, 1.3, 5.4], ['Ligne 2', 22.4, 9.1, 37.8]], down: [0, 1, 2].map((col) => ({ col, t: '× 7', c: 'ok' })) })}Un nombre différent : non, ce n'est pas un tableau de proportionnalité.${tabFig({ rows: [['Ligne 1', 0.8, 1.5, 1.25], ['Ligne 2', 2.4, 4.5, 3.9]], down: [{ col: 0, t: '× 3', c: 'ok' }, { col: 1, t: '× 3', c: 'ok' }, { col: 2, t: '× 3,12', c: 'ko' }] })}`,
  comp: () => `Le coefficient est 4,5 ÷ 3 = 1,5. Pour descendre, on <b>multiplie</b> : 4 × 1,5 = 6.${tabFig({ rows: [['Ligne 1', 3, 4], ['Ligne 2', 4.5, 6]], hl: [[1, 1]], right: '× 1,5' })}Le coefficient est 18 ÷ 15 = 1,2. Pour remonter, on <b>divise</b> : 24 ÷ 1,2 = 20.${tabFig({ rows: [['Ligne 1', 15, 20], ['Ligne 2', 18, 24]], hl: [[0, 1]], left: '÷ 1,2' })}`,
  duree: () => `Un athlète parcourt 12 km en trois quarts d'heure (45 min). Combien en 1 h (60 min) ? On passe par 15 min.${tabFig({ rows: [['Temps (min)', 45, 15, 60], ['Distance (km)', 12, 4, 16]], hl: [[1, 2]], top: [{ from: 0, to: 1, t: '÷ 3' }, { from: 1, to: 2, t: '× 4' }], bot: [{ from: 0, to: 1, t: '÷ 3' }, { from: 1, to: 2, t: '× 4' }] })}`,
};
document.querySelectorAll('[data-pfig]').forEach((el) => { el.innerHTML = FICHE_FIGS[el.dataset.pfig](); });

CHAPTERS.push(
  { id: 'proportionnalite', num: 4, title: 'Proportionnalité', symbol: '%', desc: 'Tableaux, coefficient, pourcentages, échelles, vitesses et durées.' },
  { id: 'angles', num: 5, title: 'Angles et parallèles', symbol: '∠', desc: 'Somme des angles d\'un triangle, angles et droites parallèles, angles alternes-internes et correspondants.' },
  { id: 'fractions2', num: 6, title: 'Fractions (partie 2)', symbol: '⅔', desc: 'Même dénominateur, comparer, encadrer, additionner et soustraire des fractions.' },
  { id: 'divisibilite', num: 7, title: 'Divisibilité', symbol: '÷', desc: 'Division euclidienne, multiples et diviseurs, critères de divisibilité, nombres premiers.' },
);

Object.assign(GENS, {
  'p-reconnaitre': { ch: 'proportionnalite', f: genReconnaitre, label: 'Reconnaître un tableau de proportionnalité' },
  'p-coef': { ch: 'proportionnalite', f: genCoef, label: 'Coefficient de proportionnalité' },
  'p-completer': { ch: 'proportionnalite', f: genCompleter, label: 'Compléter un tableau' },
  'p-probleme': { ch: 'proportionnalite', f: genProbleme, label: 'Problème de proportionnalité' },
  'p-pct-appliquer': { ch: 'proportionnalite', f: genPctAppliquer, label: 'Appliquer un pourcentage' },
  'p-pct-calculer': { ch: 'proportionnalite', f: genPctCalculer, label: 'Calculer un pourcentage' },
  'p-solde': { ch: 'proportionnalite', f: genSolde, label: 'Prix après réduction' },
  'p-echelle-app': { ch: 'proportionnalite', f: genEchelleAppliquer, label: 'Appliquer une échelle' },
  'p-echelle-calc': { ch: 'proportionnalite', f: genEchelleCalculer, label: 'Calculer une échelle' },
  'p-vitesse': { ch: 'proportionnalite', f: genVitesse, label: 'Durées et distances' },
  'p-duree': { ch: 'proportionnalite', f: genDuree, label: 'Convertir une durée' },
});

/* =========================================================
   CHAPITRE 5 — ANGLES ET PARALLÈLES
   ========================================================= */
const deg = (x) => `${fmt(x)}°`;
const ASK_DEG = (t) => `<p class="big">${t} ${inp('num', 'Mesure en degrés')} ${unit('°')}</p>`;

/** Triangle (figure non à l'échelle). kind : 'gen' | 'rect' | 'iso'.  txt = {A,B,C} textes d'angles. */
function figTri(kind, txt) {
  const P = kind === 'rect' ? { A: [50, 140], B: [290, 140], C: [50, 30] } : kind === 'iso' ? { A: [50, 140], B: [290, 140], C: [170, 28] } : { A: [40, 140], B: [300, 140], C: [215, 28] };
  const lab = { A: [-8, 14, 'end'], B: [8, 14, 'start'], C: [0, -10, 'middle'] };
  if (kind === 'rect') lab.C = [10, -4, 'start'];
  let s = `<svg viewBox="0 0 340 175" role="img" aria-label="Triangle ABC, figure non à l'échelle">`;
  s += `<polygon class="ln" points="${P.A} ${P.B} ${P.C}"/>`;
  if (kind === 'rect') s += `<path class="ln" d="M50 122 h18 v18"/>` .replace('M50 122 h18 v18', 'M50 122 h18 M68 122 v18');
  if (kind === 'iso') {
    const mid = (a, b) => [(P[a][0] + P[b][0]) / 2, (P[a][1] + P[b][1]) / 2];
    const m1 = mid('C', 'A'), m2 = mid('C', 'B');
    s += `<line class="ln" x1="${m1[0] - 6}" y1="${m1[1] - 6}" x2="${m1[0] + 2}" y2="${m1[1] + 6}"/><line class="ln" x1="${m2[0] - 2}" y1="${m2[1] + 6}" x2="${m2[0] + 6}" y2="${m2[1] - 6}"/>`;
  }
  for (const v of ['A', 'B', 'C']) {
    const [dx, dy, anc] = lab[v];
    s += `<text x="${P[v][0] + dx}" y="${P[v][1] + dy}" text-anchor="${anc}" font-size="17" font-weight="700">${v}</text>`;
  }
  // textes d'angles, à l'intérieur
  const inn = { A: [P.A[0] + 50, P.A[1] - 9], B: [P.B[0] - 44, P.B[1] - 9], C: [P.C[0] + (kind === 'rect' ? 14 : 0), P.C[1] + 40] };
  if (kind === 'rect') { inn.A = [P.A[0] + 11, P.A[1] - 24]; inn.B = [P.B[0] - 44, P.B[1] - 8]; inn.C = [P.C[0] + 10, P.C[1] + 40]; }
  for (const v of ['A', 'B', 'C']) if (txt[v]) s += `<text x="${inn[v][0]}" y="${inn[v][1]}" text-anchor="${kind === 'rect' && v === 'A' ? 'start' : 'middle'}" font-size="15" class="angtxt">${txt[v]}</text>`;
  return `<div class="fig5">${s}</svg><div class="figcap small muted">Figure non à l'échelle</div></div>`;
}

// 1. Somme des angles d'un triangle
function genAngle180() {
  let a, b, c;
  const st = LV(10, 5, 1) || 1;
  do { a = st * Math.round(rand(25, 100) / st); b = st * Math.round(rand(20, 100) / st); c = 180 - a - b; } while (c < 15 || a === b || a === c || b === c || a === 90 || b === 90 || c === 90);
  const V = shuffle(['A', 'B', 'C']); const hid = V[0], g1 = V[1], g2 = V[2];
  const val = { A: a, B: b, C: c }; const txt = {};
  txt[g1] = deg(val[g1]); txt[g2] = deg(val[g2]); txt[hid] = '?';
  const ans = val[hid];
  const sum = val[g1] + val[g2];
  return {
    hints: [
      'Dans un triangle, la somme des trois angles vaut toujours la même chose. Quelle est cette valeur ? Comment trouver le troisième angle quand tu connais les deux autres ?',
      'Exemple : un triangle a des angles de 50° et 70°. 50 + 70 = 120, puis 180 − 120 = 60° pour le troisième.',
      `Outil : ajoute d'abord les deux angles connus : ${val[g1]} + ${val[g2]}. Ensuite, retire ce total à 180.`,
    ],
    remediate(r) {
      const x = valU(r); if (!x || near(x.value, ans)) return null;
      if (near(x.value, sum)) return `${fmt(sum)}° est la somme des deux angles connus. Il reste à la retrancher à 180°.`;
      if (near(x.value, 360 - sum)) return 'La somme des angles d\'un triangle est 180° (et non 360°).';
      if (near(x.value, 90 - sum) || sum > 90 && x.value < 0) return 'La somme des trois angles est 180°, pas 90°.';
      return null;
    },
    q: `<p>Dans le triangle ABC, on connaît deux angles. Calcule l'angle marqué « ? ».</p>${figTri('gen', txt)}${ASK_DEG(`Angle en ${hid} =`)}`,
    check(r) {
      const x = valU(r); if (!x) return null;
      const ok = near(x.value, ans); markInput(r, 0, ok);
      return { ok, msg: `La somme des angles d'un triangle vaut 180°. ${val[g1]} + ${val[g2]} = ${sum}, puis 180 − ${sum} = <b>${ans}°</b>.` };
    },
    __solve: (r) => setAns(r, 0, String(ans)), __wrong: (r) => setAns(r, 0, String(ans + 10)),
  };
}

// 2. Triangle rectangle
function genAngleRect() {
  const st = LV(10, 5, 1) || 1, b = st * Math.round(rand(15, 75) / st), ans = 90 - b;
  const V = pick([['B', 'C'], ['C', 'B']]);
  const txt = { A: '', B: '', C: '' }; txt[V[0]] = deg(b); txt[V[1]] = '?';
  return {
    hints: [
      'Le triangle a un angle droit. Combien mesure un angle droit ? Quelle est la somme des deux autres angles ?',
      'Exemple : triangle rectangle avec un angle de 35°. Les deux angles aigus font ensemble 90°, donc l\'autre mesure 90 − 35 = 55°.',
      `Outil : somme des 3 angles = 180°, angle droit = 90°, donc ${V[0] === 'B' ? 'B' : 'C'} + ${V[1]} = 180 − 90 = 90°. Retire ${b}° à 90°.`,
    ],
    remediate(r) {
      const x = valU(r); if (!x || near(x.value, ans)) return null;
      if (near(x.value, 180 - b)) return `Tu as calculé 180 − ${b}. Mais l'angle droit prend déjà 90° : il reste 90° à partager entre les deux angles aigus.`;
      if (near(x.value, 90 + b)) return 'Il faut retrancher et non ajouter : les deux angles aigus d\'un triangle rectangle ont pour somme 90°.';
      return null;
    },
    q: `<p>ABC est un triangle rectangle en A. Calcule l'angle marqué « ? ».</p>${figTri('rect', txt)}${ASK_DEG(`Angle en ${V[1]} =`)}`,
    check(r) {
      const x = valU(r); if (!x) return null;
      const ok = near(x.value, ans); markInput(r, 0, ok);
      return { ok, msg: `Dans un triangle rectangle, les deux angles aigus ont pour somme 90° (car 180 − 90 = 90). Donc l'angle vaut 90 − ${b} = <b>${ans}°</b>.` };
    },
    __solve: (r) => setAns(r, 0, String(ans)), __wrong: (r) => setAns(r, 0, String(180 - b)),
  };
}

// 3. Triangle isocèle
function genAngleIso() {
  const L = LV(1, 2, 3);
  const apex = L === 1 ? true : L === 2 ? false : Math.random() < 0.5;
  let top, base;
  if (L === 3 && apex) { do { top = 2 * rand(10, 69) + 1; base = (180 - top) / 2; } while (base === 60); }
  else do { base = L === 1 ? 5 * rand(5, 16) : rand(25, 80); top = 180 - 2 * base; } while (top < 20 || base === 60 || top === base);
  const txt = {}; let ans, ask, msg, rem;
  if (apex) { txt.C = deg(top); txt.A = '?'; ans = base; ask = 'Angle en A ='; msg = `ABC est isocèle en C : ses deux angles à la base sont égaux. Leur somme vaut 180 − ${top} = ${180 - top}, donc chacun vaut ${180 - top} : 2 = <b>${base}°</b>.`;
    rem = (x) => near(x, 180 - top) ? `${fmt(180 - top)}° est la somme des deux angles à la base. Ils sont égaux : il faut encore diviser par 2.` : near(x, top) ? 'L\'angle donné est celui du sommet C ; on te demande un angle à la base.' : null; }
  else { txt.A = deg(base); txt.C = '?'; ans = top; ask = 'Angle en C ='; msg = `ABC est isocèle en C : les angles en A et en B sont égaux et valent ${base}°. Donc C = 180 − ${base} − ${base} = 180 − ${2 * base} = <b>${top}°</b>.`;
    rem = (x) => near(x, 180 - base) ? 'Tu as oublié que l\'angle en B vaut aussi ' + base + '° : il y a deux angles égaux à la base.' : near(x, base) ? 'Les deux angles à la base sont égaux, mais on te demande l\'angle au sommet C.' : null; }
  return {
    hints: [
      'Dans un triangle isocèle, deux angles sont égaux. Lesquels (regarde les traits qui codent les côtés égaux) ? Que vaut la somme des trois angles ?',
      'Exemple : triangle isocèle en S avec un angle au sommet de 40°. Les deux angles à la base sont égaux et la somme est 180° : (180 − 40) : 2 = 70° chacun.',
      apex ? `Outil : retire ${top}° à 180°, puis partage en deux angles égaux.` : `Outil : les deux angles à la base valent ${base}° chacun. Retire-les à 180°.`,
    ],
    remediate(r) { const x = valU(r); if (!x || near(x.value, ans)) return null; return rem(x.value); },
    q: `<p>Le triangle ABC est isocèle en C. Calcule l'angle marqué « ? ».</p>${figTri('iso', txt)}${ASK_DEG(ask)}`,
    check(r) { const x = valU(r); if (!x) return null; const ok = near(x.value, ans); markInput(r, 0, ok); return { ok, msg }; },
    __solve: (r) => setAns(r, 0, String(ans)), __wrong: (r) => setAns(r, 0, String(ans + 5)),
  };
}

// 4. Nature d'un triangle à partir de deux angles
function genAngleNature() {
  const T = pick([[60, 60, 60], [45, 45, 90], [30, 60, 90], [35, 55, 90], [50, 50, 80], [70, 70, 40], [40, 70, 70], [25, 65, 90], [40, 60, 80], [50, 60, 70], [30, 50, 100], [20, 80, 80], [55, 55, 70]]);
  const idx = shuffle([0, 1, 2]); const g1 = T[idx[0]], g2 = T[idx[1]], c = T[idx[2]];
  const [x, y, z] = T;
  const rect = T.includes(90), iso = x === y || y === z || x === z, equi = x === y && y === z;
  const opts = ['quelconque', 'isocèle (non rectangle)', 'rectangle (non isocèle)', 'rectangle et isocèle', 'équilatéral'];
  const ci = equi ? 4 : rect && iso ? 3 : rect ? 2 : iso ? 1 : 0;
  const explain = `Troisième angle : 180 − ${g1} − ${g2} = ${c}°. Les angles sont ${g1}°, ${g2}° et ${c}°. ` + (equi ? 'Trois angles égaux : le triangle est <b>équilatéral</b>.' : rect && iso ? 'Un angle droit et deux angles égaux : <b>rectangle et isocèle</b>.' : rect ? 'Il y a un angle droit et aucun angle égal à un autre : <b>rectangle</b>.' : iso ? 'Deux angles sont égaux : le triangle est <b>isocèle</b>.' : 'Aucun angle droit, aucun angle égal : <b>quelconque</b>.');
  const o = mcq(`<p>Un triangle a deux angles de <b>${g1}°</b> et <b>${g2}°</b>. Quelle est sa nature ?</p>`, opts, ci, explain, { col: true });
  o.hints = [
    'Commence par calculer le troisième angle. Ensuite : y a-t-il un angle de 90° ? Y a-t-il deux angles égaux ? Trois angles égaux ?',
    'Exemple : angles de 40° et 70°. Le troisième : 180 − 110 = 70°. Deux angles égaux (70° et 70°) : isocèle.',
    `Outil : le troisième angle mesure 180 − ${g1} − ${g2} = ${c}°. Compare maintenant les trois angles ${g1}°, ${g2}° et ${c}°.`,
  ];
  o.remediate = () => equi ? 'Un triangle avec trois angles égaux à 60° est équilatéral.' : null;
  return solveMcq(o);
}

/* ----- Angles et droites parallèles ----- */
const SECT = ['UR', 'UL', 'LL', 'LR'];
const acuteSect = (s) => s === 'UR' || s === 'LL';
/** deux droites parallèles coupées par une sécante. locs : [{v:'P'|'Q', s:'UR'..., t:'texte'}] */
function figPar(theta, locs) {
  const P = [250, 60], Q = [250 - 80 / Math.tan(theta * Math.PI / 180), 140];
  let s = `<svg viewBox="0 0 400 200" role="img" aria-label="Deux droites parallèles coupées par une sécante">`;
  s += `<line class="ln" x1="10" y1="60" x2="390" y2="60"/><line class="ln" x1="10" y1="140" x2="390" y2="140"/>`;
  const dx = Math.cos(theta * Math.PI / 180), dy = Math.sin(theta * Math.PI / 180);
  s += `<line class="ln" x1="${Q[0] - dx * 60}" y1="${Q[1] + dy * 60}" x2="${P[0] + dx * 60}" y2="${P[1] - dy * 60}"/>`;
  s += `<text x="394" y="53" text-anchor="end" font-size="15">(d₁)</text><text x="394" y="133" text-anchor="end" font-size="15">(d₂)</text>`;
  const bis = { UR: theta / 2, UL: (theta + 180) / 2, LL: 180 + theta / 2, LR: 270 + theta / 2 };
  for (const L of locs) {
    const O = L.v === 'P' ? P : Q, a = bis[L.s] * Math.PI / 180, rr = L.r || 34;
    s += `<text x="${(O[0] + rr * Math.cos(a)).toFixed(1)}" y="${(O[1] - rr * Math.sin(a) + 5).toFixed(1)}" text-anchor="middle" font-size="16" font-weight="700" class="angtxt">${L.t}</text>`;
    const a0 = { UR: 0, UL: theta, LL: 180, LR: 180 + theta }[L.s], a1 = a0 + (acuteSect(L.s) ? theta : 180 - theta);
    const ar = 17, pt = (ang) => [(O[0] + ar * Math.cos(ang * Math.PI / 180)).toFixed(1), (O[1] - ar * Math.sin(ang * Math.PI / 180)).toFixed(1)];
    const p0 = pt(a0), p1 = pt(a1);
    s += `<path class="arc" d="M${p0[0]} ${p0[1]} A${ar} ${ar} 0 ${a1 - a0 > 180 ? 1 : 0} 0 ${p1[0]} ${p1[1]}"/>`;
  }
  return `<div class="fig5">${s}</svg></div>`;
}
const relOf = (A, B) => {
  if (A.v === B.v) return A.s === B.s ? 'same' : (acuteSect(A.s) === acuteSect(B.s) ? 'opp' : 'supp');
  if (A.s === B.s) return 'cor';
  if ((A.s === 'LR' && B.s === 'UL') || (A.s === 'UL' && B.s === 'LR') || (A.s === 'LL' && B.s === 'UR') || (A.s === 'UR' && B.s === 'LL')) {
    // P_LR↔Q_UL et P_LL↔Q_UR sont alternes-internes ; P_UR↔Q_LL et P_UL↔Q_LR sont alternes-externes
    const p = A.v === 'P' ? A : B, q = A.v === 'P' ? B : A;
    return ((p.s === 'LR' && q.s === 'UL') || (p.s === 'LL' && q.s === 'UR')) ? 'alt' : 'ext';
  }
  return 'other';
};
function pickPair(rels) {
  for (let i = 0; i < 400; i++) {
    const A = { v: pick(['P', 'Q']), s: pick(SECT) }, B = { v: pick(['P', 'Q']), s: pick(SECT) };
    const r = relOf(A, B);
    if (rels.includes(r)) return { A, B, r };
  }
}
const REL_NAME = { cor: 'correspondants', alt: 'alternes-internes', opp: 'opposés par le sommet', supp: 'adjacents et supplémentaires' };

function genAnglePar() {
  const theta = rand(35, 75);
  const { A, B, r } = pickPair(['cor', 'alt', 'opp', 'supp', 'cor', 'alt']);
  const va = acuteSect(A.s) ? theta : 180 - theta, vb = acuteSect(B.s) ? theta : 180 - theta;
  const swap = Math.random() < 0.5;
  const why = { cor: `Les angles a et b sont <b>correspondants</b> : les droites (d₁) et (d₂) sont parallèles, donc ils sont égaux.`, alt: `Les angles a et b sont <b>alternes-internes</b> : (d₁) et (d₂) sont parallèles, donc ils sont égaux.`, opp: 'Les angles a et b sont <b>opposés par le sommet</b> : ils sont égaux.', supp: 'Les angles a et b sont <b>adjacents</b> et leurs côtés extérieurs forment un angle plat : leur somme vaut 180°.' }[r];
  const eqq = near(va, vb);
  return {
    hints: [
      'Regarde la position des angles a et b : sont-ils au même sommet ou à deux sommets différents ? Du même côté de la sécante ? Entre les deux parallèles ?',
      'Rappels : angles opposés par le sommet, correspondants et alternes-internes (avec des parallèles) sont <b>égaux</b>. Deux angles adjacents sur une droite ont pour somme 180°.',
      `Outil : les angles ${eqq ? 'sont égaux' : 'ont pour somme 180°'}. Écris : b = ${eqq ? va : '180 − ' + va}.`,
    ],
    remediate(rr) {
      const x = valU(rr); if (!x || near(x.value, vb)) return null;
      if (eqq && near(x.value, 180 - va)) return 'Ici les deux angles sont égaux (ils ne sont pas supplémentaires).';
      if (!eqq && near(x.value, va)) return 'Ces deux angles ne sont pas égaux : ils sont adjacents sur une droite, leur somme est 180°.';
      return null;
    },
    q: `<p>Les droites (d₁) et (d₂) sont <b>parallèles</b>. Sur la figure, a = ${deg(va)}. Calcule b.</p>${figPar(theta, [{ ...A, t: 'a' }, { ...B, t: 'b' }])}${ASK_DEG('b =')}`,
    check(rr) {
      const x = valU(rr); if (!x) return null;
      const ok = near(x.value, vb); markInput(rr, 0, ok);
      return { ok, msg: `${why} Donc b = ${eqq ? va + '°' : '180 − ' + va + ' = ' + vb + '°'}. Réponse : <b>${vb}°</b>.` };
    },
    __solve: (rr) => setAns(rr, 0, String(vb)), __wrong: (rr) => setAns(rr, 0, String(vb + 10)),
  };
}

function genAngleVocab() {
  const theta = rand(40, 70);
  const { A, B, r } = pickPair(['cor', 'alt', 'opp', 'supp']);
  const opts = ['alternes-internes', 'correspondants', 'opposés par le sommet', 'adjacents et supplémentaires'];
  const ci = { alt: 0, cor: 1, opp: 2, supp: 3 }[r];
  const expl = { alt: 'Ils sont entre les deux droites, de part et d\'autre de la sécante, à deux sommets différents : <b>alternes-internes</b>.', cor: 'Ils sont du même côté de la sécante et du même côté des deux droites, à deux sommets différents : <b>correspondants</b>.', opp: 'Ils ont le même sommet et sont « face à face » : <b>opposés par le sommet</b>.', supp: 'Ils ont le même sommet, un côté commun et forment un angle plat ensemble : <b>adjacents et supplémentaires</b>.' }[r];
  const o = mcq(`<p>Sur la figure, les angles <b>a</b> et <b>b</b> sont :</p>${figPar(theta, [{ ...A, t: 'a' }, { ...B, t: 'b' }])}`, opts, ci, expl, { col: true });
  o.hints = [
    'Regarde d\'abord les sommets : a et b sont-ils au même sommet ou en deux sommets différents ?',
    'Même sommet : opposés par le sommet (face à face) ou adjacents (côte à côte). Deux sommets : correspondants (même position, de chaque côté) ou alternes-internes (entre les droites, en « Z »).',
    A.v === B.v ? 'Outil : a et b sont au même sommet.' : 'Outil : a et b sont en deux sommets différents.',
  ];
  o.remediate = () => null;
  return solveMcq(o);
}

function genAngleParallele() {
  const theta = rand(40, 70);
  const rel = pick(['cor', 'alt']);
  const { A, B } = pickPair([rel]);
  const va = acuteSect(A.s) ? theta : 180 - theta;
  const par = Math.random() < 0.5;
  const vb = par ? va : va + pick([-12, -8, -6, 6, 8, 12]);
  const o = mcq(`<p>Sur la figure (non à l'échelle), les angles a et b sont ${REL_NAME[rel]}.</p>${figPar(theta, [{ ...A, t: deg(va) + ' (a)', r: 44 }, { ...B, t: deg(vb) + ' (b)', r: 44 }])}<p>Les droites (d₁) et (d₂) sont-elles parallèles ?</p>`,
    ['Oui, elles sont parallèles', 'Non, elles ne sont pas parallèles'], par ? 0 : 1,
    par ? `Deux angles ${REL_NAME[rel]} sont égaux (${va}° = ${vb}°) : les droites sont <b>parallèles</b>.` : `Des angles ${REL_NAME[rel]} de deux droites parallèles seraient égaux. Ici ${va}° ≠ ${vb}° : les droites <b>ne sont pas parallèles</b>.`, { col: true });
  o.hints = [
    'Si deux droites sont parallèles, des angles correspondants (ou alternes-internes) sont égaux. Et dans l\'autre sens ?',
    'Si deux angles correspondants (ou alternes-internes) sont égaux, alors les droites sont parallèles. S\'ils sont différents, elles ne le sont pas.',
    `Outil : compare ${va}° et ${vb}°. Sont-ils égaux ?`,
  ];
  o.remediate = () => null;
  return solveMcq(o);
}

/* =========================================================
   CHAPITRE 6 — FRACTIONS (partie 2)
   ========================================================= */
const fr = (x) => parse(x);
const okFrac = (r, i, target) => { const x = val(r, i); if (!x) return null; const ok = eq(x.value, target); markInput(r, i, ok); return ok; };
const sfrac = (n, d) => Fs(n, d);

// 1. Écrire avec un autre dénominateur
function genMeme() {
  const b = pick([2, 3, 4, 5, 6, 7, 8, 10]), k = rand(2, 6), d = b * k;
  const a = rand(1, b * 2 - 1);
  return {
    hints: [
      'Pour obtenir une fraction égale, on multiplie le numérateur <b>et</b> le dénominateur par le même nombre. Par quel nombre faut-il multiplier le dénominateur ' + b + ' pour obtenir ' + d + ' ?',
      'Exemple : [[2|3]] = [[?|12]]. Le dénominateur est multiplié par 4 (3 × 4 = 12), donc le numérateur aussi : 2 × 4 = 8. [[2|3]] = [[8|12]].',
      `Outil : ${b} × ? = ${d}. Multiplie ensuite ${a} par ce même nombre.`,
    ],
    remediate(r) { const x = valU(r); if (!x || near(x.value, a * k)) return null; if (near(x.value, a + k)) return `Tu as ajouté ${k} au numérateur. Il faut le <b>multiplier</b> par ${k} (comme le dénominateur).`; return null; },
    q: `<p>Complète l'égalité de fractions.</p><p class="big">${F(a, b)} = <span class="frac"><span>${inp('num', 'Numérateur')}</span><span>${d}</span></span></p>`,
    check(r) { const x = valU(r); if (!x) return null; const ok = near(x.value, a * k); markInput(r, 0, ok); return { ok, msg: `${d} = ${b} × ${k}. On multiplie aussi le numérateur par ${k} : ${a} × ${k} = <b>${a * k}</b>. ${F(a, b)} = ${F(a * k, d)}.` }; },
    __solve: (r) => setAns(r, 0, String(a * k)), __wrong: (r) => setAns(r, 0, String(a * k + 1)),
  };
}

// 2. Réduire deux fractions au même dénominateur
function genCouple() {
  const kind = pick(['mult', 'mult', 'copr']);
  let b, d, D;
  if (kind === 'mult') { b = pick([2, 3, 4, 5, 6]); d = b * rand(2, 4); D = d; }
  else { [b, d] = pick([[2, 3], [3, 4], [2, 5], [3, 5], [4, 5], [3, 7], [2, 7], [5, 6]]); D = b * d; }
  const a = rand(1, b - 1 || 1), c = rand(1, d - 1);
  const na = a * (D / b), nc = c * (D / d);
  return {
    hints: [
      `Pour mettre deux fractions au même dénominateur, on cherche un multiple commun des deux dénominateurs. Ici l'énoncé te donne déjà ${D}. Par quel nombre multiplier chaque dénominateur pour obtenir ${D} ?`,
      'Exemple : [[1|2]] et [[2|3]] au dénominateur 6. 2 × 3 = 6, donc [[1|2]] = [[3|6]] ; 3 × 2 = 6, donc [[2|3]] = [[4|6]].',
      `Outil : ${b} × ${D / b} = ${D} et ${d} × ${D / d} = ${D}. Multiplie chaque numérateur par le bon nombre.`,
    ],
    remediate(r) { const x = valU(r, 0), y = valU(r, 1); if (x && y && near(x.value, a) && near(y.value, c)) return 'Tu as recopié les numérateurs : en changeant le dénominateur, il faut aussi changer le numérateur.'; return null; },
    q: `<p>Écris ces deux fractions avec le dénominateur <b>${D}</b>.</p><p class="big">${F(a, b)} = <span class="frac"><span>${inp('num', 'Numérateur 1')}</span><span>${D}</span></span> &nbsp; et &nbsp; ${F(c, d)} = <span class="frac"><span>${inp('num', 'Numérateur 2')}</span><span>${D}</span></span></p>`,
    check(r) { const x = valU(r, 0), y = valU(r, 1); if (!x || !y) return null; const o1 = near(x.value, na), o2 = near(y.value, nc); markInput(r, 0, o1); markInput(r, 1, o2); return { ok: o1 && o2, msg: `${b} × ${D / b} = ${D}, donc on multiplie aussi le numérateur par ${D / b} : ${F(a, b)} = ${F(a + ' × ' + D / b, b + ' × ' + D / b)} = ${F(na, D)}. ` + (D === d ? `${F(c, d)} a déjà le dénominateur ${D} : on la garde.` : `${d} × ${D / d} = ${D} : ${F(c, d)} = ${F(c + ' × ' + D / d, d + ' × ' + D / d)} = ${F(nc, D)}.`) }; },
    __solve: (r) => { setAns(r, 0, String(na)); setAns(r, 1, String(nc)); }, __wrong: (r) => { setAns(r, 0, String(na + 1)); setAns(r, 1, String(nc)); },
  };
}

// 3. Comparer deux fractions
function genComparer() {
  const kind = pick(['same', 'mult', 'mult', 'one', 'eq']);
  let n1, d1, n2, d2;
  if (kind === 'same') { d1 = d2 = rand(3, 12); do { n1 = rand(1, 2 * d1); n2 = rand(1, 2 * d1); } while (n1 === n2); }
  else if (kind === 'mult') { d1 = pick([2, 3, 4, 5, 6]); const k = rand(2, 4); d2 = d1 * k; n1 = rand(1, 2 * d1 - 1); do { n2 = rand(1, 2 * d2 - 1); } while (n2 === n1 * k); }
  else if (kind === 'one') { d1 = rand(3, 9); n1 = d1 + rand(1, 4); d2 = rand(3, 9); n2 = d2 - rand(1, 2); if (n2 < 1) n2 = 1; }
  else { d1 = pick([2, 3, 4, 5]); const k = rand(2, 5); n1 = rand(1, d1 * 2 - 1); d2 = d1 * k; n2 = n1 * k; }
  const v1 = n1 / d1, v2 = n2 / d2;
  const ci = near(v1, v2) ? 1 : v1 < v2 ? 0 : 2;
  const k2 = d2 % d1 === 0 ? d2 / d1 : 1;
  let how;
  if (kind === 'same') how = `Même dénominateur (${d1}) : on compare les numérateurs ${n1} et ${n2}.`;
  else if (kind === 'one') how = `${F(n1, d1)} est ${n1 > d1 ? 'plus grand' : n1 === d1 ? 'égal' : 'plus petit'} que 1 (${n1} ${n1 > d1 ? '>' : '<'} ${d1}) et ${F(n2, d2)} est plus petit que 1 (${n2} < ${d2}).`;
  else how = `On met au même dénominateur ${d2} : ${F(n1, d1)} = ${F(n1 * k2, d2)}. On compare ${n1 * k2} et ${n2}.`;
  const sign = ['<', '=', '>'];
  const o = mcq(`<p>Compare ces deux fractions.</p><p class="big">${F(n1, d1)} &nbsp;…&nbsp; ${F(n2, d2)}</p>`, ['est plus petite que (&lt;)', 'est égale à (=)', 'est plus grande que (&gt;)'], ci,
    `${how} Donc ${F(n1, d1)} ${sign[ci]} ${F(n2, d2)}.`, {});
  o.hints = [
    'Pour comparer deux fractions, le plus simple est qu\'elles aient le même dénominateur. Ont-elles le même dénominateur ? L\'un est-il un multiple de l\'autre ? Sinon, compare chaque fraction à 1.',
    'Exemple : [[3|4]] et [[5|8]]. [[3|4]] = [[6|8]], et 6 > 5, donc [[3|4]] > [[5|8]]. Autre exemple : [[7|5]] > 1 et [[3|4]] < 1, donc [[7|5]] > [[3|4]].',
    kind === 'same' ? 'Outil : le dénominateur est le même, compare seulement les numérateurs.' : kind === 'one' ? 'Outil : compare chaque numérateur à son dénominateur (plus grand ou plus petit que 1).' : `Outil : mets ${F(n1, d1)} au dénominateur ${d2}.`,
  ];
  o.remediate = () => kind !== 'same' && n1 > n2 && ci === 0 ? 'Compare ce qui est comparable : avec des dénominateurs différents, un plus grand numérateur ne veut pas dire une plus grande fraction.' : null;
  return solveMcq(o);
}

// 4. Encadrer une fraction par deux entiers consécutifs
function genEncadrer() {
  const d = rand(2, 9); let n; do { n = rand(d + 1, 6 * d); } while (n % d === 0);
  const lo = Math.floor(n / d);
  return {
    hints: [
      'Une fraction est un quotient. Divise le numérateur par le dénominateur : le quotient entier te donne le premier nombre de l\'encadrement.',
      'Exemple : [[17|5]]. 5 × 3 = 15 et 5 × 4 = 20. Donc 15 < 17 < 20, soit 3 < [[17|5]] < 4.',
      `Outil : cherche les multiples de ${d} qui encadrent ${n}. Par exemple ${d} × ${lo} = ${d * lo}.`,
    ],
    remediate(r) { const x = valU(r, 0), y = valU(r, 1); if (x && y && near(x.value, lo + 1) && near(y.value, lo + 2)) return `Tu as décalé l'encadrement. Vérifie : ${d} × ${lo + 1} = ${d * (lo + 1)} est-il plus petit que ${n} ?`; return null; },
    q: `<p>Encadre la fraction par deux entiers consécutifs.</p><p class="big">${inp('num', 'Entier inférieur')} &lt; ${F(n, d)} &lt; ${inp('num', 'Entier supérieur')}</p>`,
    check(r) { const x = valU(r, 0), y = valU(r, 1); if (!x || !y) return null; const o1 = near(x.value, lo), o2 = near(y.value, lo + 1); markInput(r, 0, o1); markInput(r, 1, o2); return { ok: o1 && o2, msg: `${d} × ${lo} = ${d * lo} et ${d} × ${lo + 1} = ${d * (lo + 1)}. Comme ${d * lo} &lt; ${n} &lt; ${d * (lo + 1)}, on a <b>${lo} &lt; ${F(n, d)} &lt; ${lo + 1}</b>.` }; },
    __solve: (r) => { setAns(r, 0, String(lo)); setAns(r, 1, String(lo + 1)); }, __wrong: (r) => { setAns(r, 0, String(lo + 1)); setAns(r, 1, String(lo + 2)); },
  };
}

// Additions/soustractions
function fracAnswer(r, n, d) { const x = val(r); if (!x) return null; return x; }
function mkAddSub(kind) {
  let a, b, c, e, op, D;
  if (kind === 'same') { D = rand(3, 12); op = Math.random() < 0.5 ? '+' : '−'; if (op === '+') { a = rand(1, D - 1); c = rand(1, D); e = D; b = D; } else { a = rand(2, D + 3); c = rand(1, a - 1); b = e = D; } }
  else if (kind === 'mult') { b = pick([2, 3, 4, 5, 6]); e = b * rand(2, 4); op = Math.random() < 0.5 ? '+' : '−'; a = rand(1, b + 2); c = rand(1, e); if (op === '−') { while (a / b <= c / e) { a++; } } }
  else { [b, e] = pick(LV([[2, 3], [2, 5], [3, 4], [3, 2]], [[2, 3], [3, 4], [2, 5], [3, 5], [4, 5], [3, 7], [5, 6], [4, 3], [5, 2]], [[4, 6], [6, 8], [6, 9], [4, 10], [10, 15], [6, 4], [9, 6]]) || [[2, 3], [3, 4], [2, 5], [3, 5], [4, 5], [3, 7], [5, 6], [4, 3], [5, 2]]); op = Math.random() < 0.5 ? '+' : '−'; a = rand(1, b + 1); c = rand(1, e + 1); if (op === '−') { while (a / b <= c / e) a++; } }
  if (kind === 'same') { b = e = D; }
  else { if (a % b === 0) a++; if (c % e === 0) c = Math.max(1, c - 1); if (op === '−') { while (a / b <= c / e || a % b === 0) a++; } }
  const L = (() => { const x = b, y = e; return x * y / gcd(x, y); })();
  const na = a * (L / b), nc = c * (L / e);
  const resN = op === '+' ? na + nc : na - nc;
  const target = resN / L;
  const why = kind === 'same' ? `Même dénominateur : on ${op === '+' ? 'additionne' : 'soustrait'} les numérateurs et on garde le dénominateur ${b}. ` : kind === 'mult' ? `${L} est un multiple de ${Math.min(b, e)} : on écrit ${b < e ? F(a, b) : F(c, e)} avec le dénominateur ${L}, puis on calcule les numérateurs. ` : `Dénominateur commun : ${L}, un multiple de ${b} et de ${e}. On transforme les deux fractions, puis on calcule les numérateurs. `;
  const stepTxt = why + (kind === 'same' ? `${F(a, b)} ${op} ${F(c, e)} = ${F(a + ' ' + op + ' ' + c, b)} = ${F(resN, L)}` : `${F(a, b)} ${op} ${F(c, e)} = ${F(na, L)} ${op} ${F(nc, L)} = ${F(resN, L)}`);
  return {
    hints: [
      kind === 'same' ? 'Les deux fractions ont le même dénominateur. On additionne (ou soustrait) les numérateurs et on garde le dénominateur.' : 'On ne peut additionner (ou soustraire) que des fractions qui ont le même dénominateur. Commence par les mettre au même dénominateur.',
      'Exemple : [[2|5]] + [[1|5]] = [[3|5]] (on garde 5). Et [[1|2]] + [[1|4]] = [[2|4]] + [[1|4]] = [[3|4]].',
      kind === 'same' ? `Outil : ${a} ${op} ${c} = ? et le dénominateur reste ${b}.` : `Outil : dénominateur commun ${L}. ${F(a, b)} = ${F(na, L)} et ${F(c, e)} = ${F(nc, L)}.`,
    ],
    remediate(r) {
      const x = val(r); if (!x || eq(x.value, target)) return null;
      if (x.isFrac && x.n === (op === '+' ? a + c : a - c) && x.d === (op === '+' ? b + e : b - e) && b !== e || x.isFrac && x.d === b + e && x.n === (op === '+' ? a + c : a - c)) return 'Les dénominateurs ne s\'additionnent pas ! On les met au même dénominateur, puis on calcule uniquement avec les numérateurs.';
      if (x.isFrac && x.d === b && b === e && x.n === (op === '+' ? a + c : a - c) && false) return null;
      return null;
    },
    q: `<p>Calcule et donne le résultat sous forme d'une fraction (simplifiée si possible).</p><p class="big">${F(a, b)} ${op} ${F(c, e)} = ${inp('frac', 'Résultat')}</p>`,
    check(r) { const x = val(r); if (!x) return null; const ok = eq(x.value, target); markInput(r, 0, ok); return { ok, msg: `${stepTxt}${resN / L === Math.round(resN / L) ? '' : gcd(resN, L) > 1 ? ' = ' + Fs(resN, L) : ''}. Résultat : <b>${Fs(resN, L)}</b>.` }; },
    __solve: (r) => setAns(r, 0, `${resN}/${L}`), __wrong: (r) => setAns(r, 0, `${resN + 1}/${L}`),
  };
}
const genAddMeme = () => mkAddSub('same');
const genAddMult = () => mkAddSub('mult');
const genAddAutre = () => mkAddSub('other');

// Problèmes avec fractions
function genFracProbleme() {
  const T = pick([
    () => { const [b, e] = pick([[4, 8], [3, 6], [5, 10], [2, 4], [3, 12], [4, 12]]); const a = 1, c = rand(1, e / 2), A = a * e / b; return { t: `Lina mange ${F(a, b)} d'une tarte et Hugo en mange ${F(c, e)}. Quelle fraction de la tarte ont-ils mangée à eux deux ?`, v: a / b + c / e, expl: `À eux deux : on <b>additionne</b> les deux parts, après avoir mis ${F(a, b)} au dénominateur ${e} : ${F(a, b)} + ${F(c, e)} = ${F(A, e)} + ${F(c, e)} = ${F(A + c, e)}.` }; },
    () => { const [b, e] = pick([[4, 8], [3, 6], [2, 4], [5, 10], [3, 9]]); const a = 1, c = rand(1, e / 2), A = a * e / b; return { t: `Dans un sac de billes, ${F(a, b)} des billes sont rouges et ${F(c, e)} sont bleues. Les autres sont vertes. Quelle fraction du sac représentent les billes vertes ?`, v: 1 - (a / b + c / e), expl: `Rouges et bleues ensemble : ${F(a, b)} + ${F(c, e)} = ${F(A, e)} + ${F(c, e)} = ${F(A + c, e)}. Le sac entier, c'est ${F(e, e)} = 1, donc les vertes représentent ${F(e, e)} − ${F(A + c, e)} = ${F(e - A - c, e)}.` }; },
    () => { const b = pick([3, 4, 5, 6]), e = b * pick([2, 3]); const c = rand(1, e - 1); let a = rand(1, b - 1); if (a / b <= c / e) a = b - 1 || 1; const A = a * e / b; if (A - c <= 0) return null; return { t: `Un jardin est occupé aux ${F(a, b)} par des légumes. Les tomates occupent ${F(c, e)} du jardin et font partie des légumes. Quelle fraction du jardin occupent les autres légumes ?`, v: a / b - c / e, expl: `Les autres légumes, ce sont tous les légumes <b>moins</b> les tomates : ${F(a, b)} − ${F(c, e)} = ${F(A, e)} − ${F(c, e)} = ${F(A - c, e)}.` }; },
  ]);
  let g; do { g = T(); } while (!g || g.v <= 0 || g.v >= 1);
  let n = Math.round(g.v * 120), d = 120; const gg = gcd(n, d); n /= gg; d /= gg;
  if (Math.abs(n / d - g.v) > 1e-9) { n = Math.round(g.v * 360); d = 360; const g2 = gcd(n, d); n /= g2; d /= g2; }
  return {
    hints: [
      'Traduis l\'énoncé par un calcul avec des fractions : faut-il additionner, soustraire, ou calculer « ce qui reste » (1 moins ce qui est déjà pris) ?',
      'Exemple : 1 tout entier = [[8|8]]. Si on prend déjà [[3|8]], il reste [[8|8]] − [[3|8]] = [[5|8]].',
      'Outil : mets les fractions au même dénominateur avant de calculer.',
    ],
    remediate: () => null,
    q: `<p>${g.t}</p><p class="big">${inp('frac', 'Fraction')}</p><p class="small muted">Écris ta réponse sous la forme 3/8.</p>`,
    check(r) { const x = val(r); if (!x) return null; const ok = eq(x.value, g.v); markInput(r, 0, ok); return { ok, msg: g.expl + ` Résultat : <b>${Fs(n, d)}</b>.` }; },
    __solve: (r) => setAns(r, 0, `${n}/${d}`), __wrong: (r) => setAns(r, 0, `${n + 1}/${d}`),
  };
}

/* =========================================================
   CHAPITRE 7 — DIVISIBILITÉ
   ========================================================= */
function genEuclide() {
  const L = LV(1, 2, 3);
  const b = L === 1 ? rand(3, 6) : L === 2 ? rand(6, 9) : rand(3, 12); let a; do { a = L === 1 ? rand(25, 90) : L === 2 ? rand(80, 200) : rand(120, 300); if (L === 3) { const bb = rand(10, 15); a = rand(150, 400); return mkEuclid(bb, a); } } while (a % b === 0);
  return mkEuclid(b, a);
}
function mkEuclid(b, a) {
  if (a % b === 0) a++;
  const q = Math.floor(a / b), rest = a % b;
  return {
    hints: [
      'Dans la division euclidienne de a par b, on cherche le plus grand multiple de b qui ne dépasse pas a. Ce multiple est b × q, et ce qui reste est le reste r. Le reste est toujours plus petit que le diviseur.',
      'Exemple : 47 = 5 × 9 + 2. Quotient 9, reste 2. 5 × 9 = 45 ≤ 47 mais 5 × 10 = 50 > 47.',
      `Outil : calcule des multiples de ${b} proches de ${a}, par exemple ${b} × ${Math.max(q - 1, 1)} = ${b * Math.max(q - 1, 1)}.`,
    ],
    remediate(r) {
      const x = valU(r, 0), y = valU(r, 1); if (!x || !y) return null;
      if (near(y.value, rest + b) && near(x.value, q - 1)) return `Ton reste ${fmt(y.value)} est plus grand que le diviseur ${b} : le quotient pouvait encore augmenter.`;
      if (y.value >= b) return 'Le reste doit être strictement plus petit que le diviseur.';
      return null;
    },
    q: `<p>Effectue la division euclidienne de <b>${a}</b> par <b>${b}</b>.</p><p class="big">Quotient ${inp('num', 'Quotient')} &nbsp; Reste ${inp('num', 'Reste')}</p>`,
    check(r) { const x = valU(r, 0), y = valU(r, 1); if (!x || !y) return null; const o1 = near(x.value, q), o2 = near(y.value, rest); markInput(r, 0, o1); markInput(r, 1, o2); return { ok: o1 && o2, msg: `${b} × ${q} = ${b * q} et ${a} − ${b * q} = ${rest}. Donc ${a} = ${b} × ${q} + ${rest}, avec ${rest} &lt; ${b}. Quotient <b>${q}</b>, reste <b>${rest}</b>.` }; },
    __solve: (r) => { setAns(r, 0, String(q)); setAns(r, 1, String(rest)); }, __wrong: (r) => { setAns(r, 0, String(q - 1)); setAns(r, 1, String(rest + b)); },
  };
}

function genEgalite() {
  const b = rand(3, 12); let a; do { a = rand(30, 200); } while (a % b === 0);
  const q = Math.floor(a / b), rest = a % b;
  const opts = [`${a} = ${b} × ${q} + ${rest}`, `${a} = ${b} × ${q - 1} + ${rest + b}`, `${a} = ${b} × ${q} + ${rest + 1}`, `${a} = ${b} × ${q + 1} − ${b - rest}`];
  const o = mcq(`<p>Quelle égalité traduit la division euclidienne de <b>${a}</b> par <b>${b}</b> ?</p>`, opts, 0,
    `La division euclidienne s'écrit a = b × q + r avec r &lt; b. Ici ${b} × ${q} + ${rest} = ${a} et ${rest} &lt; ${b} : <b>${opts[0]}</b>. « ${opts[1]} » : le calcul est juste, mais le reste ${rest + b} est plus grand que le diviseur ${b} (on pouvait mettre ${b} une fois de plus). « ${opts[2]} » : le calcul est faux (${b} × ${q} + ${rest + 1} = ${a + 1}). « ${opts[3]} » : on y soustrait, ce n'est pas la forme « diviseur × quotient + reste ».`, { col: true });
  o.hints = [
    'L\'égalité de la division euclidienne est a = b × q + r avec un reste r plus petit que b. Vérifie chaque proposition : le calcul est-il exact ? Le reste est-il plus petit que le diviseur ?',
    'Exemple : 47 = 5 × 8 + 7 est un calcul exact mais ce n\'est pas la division euclidienne car 7 > 5.',
    `Outil : calcule ${b} × ${q} + ${rest} et vérifie que le résultat est ${a}.`,
  ];
  o.remediate = () => null;
  return solveMcq(o);
}

function genDecimal() {
  const b = pick([2, 4, 5, 8, 10, 20, 25]); let a; do { a = rand(3, 120); } while (a % b === 0);
  const ans = a / b; const q = Math.floor(a / b), rest = a % b;
  return {
    hints: [
      'Pour continuer la division après la virgule, on ajoute un 0 au reste et on met une virgule au quotient. Tu peux aussi écrire le quotient sous forme de fraction.',
      'Exemple : 7 ÷ 4. Division euclidienne : 7 = 4 × 1 + 3. Reste 3 : on continue, 30 ÷ 4 = 7 reste 2, puis 20 ÷ 4 = 5. Donc 7 ÷ 4 = 1,75.',
      `Outil : ${a} = ${b} × ${q} + ${rest}. Il reste ${rest} : continue la division avec ${rest}0.`,
    ],
    remediate(r) { const x = valU(r); if (!x || near(x.value, ans)) return null; if (near(x.value, q)) return 'Tu t\'es arrêté au quotient entier. Il reste un reste : on continue la division après la virgule.'; if (near(x.value, q + rest / 10)) return `Le reste ${rest} n'est pas un chiffre après la virgule. Poursuis la division : ${rest}0 ÷ ${b}...`; return null; },
    q: `<p>Calcule le quotient exact (écriture décimale).</p><p class="big">${a} ÷ ${b} = ${inp('num', 'Quotient décimal')}</p>`,
    check(r) { const x = valU(r); if (!x) return null; const ok = near(x.value, ans); markInput(r, 0, ok); return { ok, msg: `${a} ÷ ${b} = ${F(a, b)} = <b>${fmt(ans)}</b> (division euclidienne : ${a} = ${b} × ${q} + ${rest}, puis on poursuit après la virgule).` }; },
    __solve: (r) => setAns(r, 0, fmt(ans)), __wrong: (r) => setAns(r, 0, String(q)),
  };
}

function genDVocab() {
  const b = pick([3, 4, 5, 6, 7, 8, 9]), k = rand(3, 9), a = b * k;
  const T = pick([
    () => mcq(`<p>On a <b>${a} = ${b} × ${k}</b>. Parmi ces affirmations, laquelle est vraie ?</p>`, [`${a} est un multiple de ${b}`, `${a} est un diviseur de ${b}`, `${b} est un multiple de ${a}`, `${k} est un multiple de ${a}`], 0, `Si a = b × k avec k entier, alors <b>a est un multiple de b</b> et b est un diviseur de a. Ici ${a} est un multiple de ${b} (et de ${k}), et ${b} (comme ${k}) est un diviseur de ${a}.`, { col: true }),
    () => mcq(`<p><b>${b}</b> est un diviseur de <b>${a}</b>. Cela signifie que :</p>`, [`la division de ${a} par ${b} a pour reste 0`, `la division de ${b} par ${a} a pour reste 0`, `${b} est plus grand que ${a}`, `${a} est un diviseur de ${b}`], 0, `${b} divise ${a} : ${a} est <b>divisible par ${b}</b>, c'est-à-dire que le reste de la division euclidienne de ${a} par ${b} est 0.`, { col: true }),
    () => mcq(`<p>Quel nombre est un <b>multiple de ${b}</b> ?</p>`, shuffle([b * rand(2, 9), b * rand(2, 9) + 1, b * rand(2, 9) - 1, b + 1 + b]).map((x, i, arr) => x), 0, '', { col: true }),
  ]);
  let o = T();
  if (o._opts.length && o.q.includes('Quel nombre')) {
    const ok = a, w = [a + 1, a - 1, a + 2].map((x) => x === a ? x + 3 : x);
    o = mcq(`<p>Quel nombre est un <b>multiple de ${b}</b> ?</p>`, [String(ok), String(w[0]), String(w[1]), String(w[2])].map((x) => x), 0, `${a} = ${b} × ${k} : c'est le seul multiple de ${b} de la liste. Les autres donnent un reste non nul.`, { col: true });
  }
  o.hints = [
    'a est un multiple de b s\'il existe un entier k tel que a = b × k. Dans ce cas b est un diviseur de a, et a est divisible par b.',
    'Exemple : 24 = 6 × 4. Donc 24 est un multiple de 6 et de 4, et 6 et 4 sont des diviseurs de 24.',
    `Outil : ${b} × ${k} = ${a}.`,
  ];
  o.remediate = () => null;
  return solveMcq(o);
}

function genMultiples() {
  const kind = pick(['next', 'prev', 'nth']);
  const n = pick([3, 4, 6, 7, 8, 9, 12, 15]);
  let ans, ask, hint2;
  if (kind === 'next') { const m = rand(30, 150); ans = Math.ceil((m + 1) / n) * n; ask = `Quel est le plus petit multiple de <b>${n}</b> strictement supérieur à <b>${m}</b> ?`; hint2 = `Divise ${m} par ${n} : le quotient te donne le multiple juste en dessous.`; }
  else if (kind === 'prev') { const m = rand(30, 150); ans = Math.floor((m - 1) / n) * n; ask = `Quel est le plus grand multiple de <b>${n}</b> strictement inférieur à <b>${m}</b> ?`; hint2 = `Divise ${m} par ${n} : le quotient te donne le multiple juste en dessous.`; }
  else { const k = rand(8, 15); ans = n * k; ask = `Quel est le <b>${k}<sup>e</sup></b> multiple non nul de <b>${n}</b> ?`; hint2 = `Le 1<sup>er</sup> multiple non nul est ${n}, le 2<sup>e</sup> est 2 × ${n}...`; }
  return {
    hints: [
      'Les multiples de n sont les résultats de la table de n : n, 2n, 3n, 4n... (et 0). Pour trouver le multiple le plus proche d\'un nombre, divise ce nombre par n.',
      'Exemple : multiples de 7 : 7, 14, 21, 28, 35... Le plus petit multiple de 7 supérieur à 30 est 35 (7 × 5).',
      'Outil : ' + hint2,
    ],
    remediate: () => null,
    q: `<p>${ask}</p><p class="big">${inp('num', 'Réponse')}</p>`,
    check(r) { const x = valU(r); if (!x) return null; const ok = near(x.value, ans); markInput(r, 0, ok); return { ok, msg: `${ans} = ${n} × ${ans / n}. Réponse : <b>${ans}</b>.` }; },
    __solve: (r) => setAns(r, 0, String(ans)), __wrong: (r) => setAns(r, 0, String(ans + 1)),
  };
}

const divisors = (n) => { const d = []; for (let i = 1; i <= n; i++) if (n % i === 0) d.push(i); return d; };
function genDiviseurs() {
  const n = pick(LV([12, 15, 18, 20, 21], [24, 28, 30, 32, 36, 40, 42, 45], [48, 50, 54, 56, 60, 72, 84, 90]) || [12, 18, 20, 24, 28, 30, 32, 36, 40, 42, 45, 48, 50, 54, 56, 60]);
  const D = divisors(n);
  const pairs = D.filter((x) => x * x <= n).map((x) => `${x} × ${n / x}`).join(' ; ');
  return {
    hints: [
      'Un diviseur de n est un nombre qui « tombe juste » dans n (reste 0). Teste les entiers 1, 2, 3, 4... un par un, et pense que les diviseurs vont par paires : si a × b = n, alors a et b sont deux diviseurs.',
      'Exemple : diviseurs de 12. 12 = 1 × 12 = 2 × 6 = 3 × 4. Les diviseurs de 12 sont 1, 2, 3, 4, 6 et 12.',
      `Outil : cherche des produits égaux à ${n}. Commence par 1 × ${n}, puis teste 2, 3, 4...`,
    ],
    remediate(r) {
      const s = parseList(r.querySelector('.ans')?.value); if (!s) return null;
      if (!s.includes(1) || !s.includes(n)) return 'N\'oublie pas les deux diviseurs évidents : 1 et le nombre lui-même.';
      if (s.some((x) => n % x !== 0)) return 'Un des nombres de ta liste n\'est pas un diviseur : vérifie que la division tombe juste.';
      return 'Il en manque : utilise les paires (a × b = ' + n + ') pour n\'en oublier aucun.';
    },
    q: `<p>Donne tous les diviseurs de <b>${n}</b>, séparés par des espaces ou des virgules.</p><p class="big">${inp('list', 'Liste des diviseurs')}</p>`,
    check(r) { const s = parseList(r.querySelector('.ans')?.value); if (!s || !s.length) return null; const ok = s.length === D.length && D.every((x) => s.includes(x)); markInput(r, 0, ok); return { ok, msg: `${n} = ${pairs}. Les diviseurs de ${n} sont : <b>${D.join(', ')}</b>.` }; },
    __solve: (r) => setAns(r, 0, D.join(' ')), __wrong: (r) => setAns(r, 0, D.slice(0, -1).join(' ')),
  };
}
function parseList(s) { if (s == null) return null; const t = String(s).split(/[^0-9]+/).filter(Boolean).map(Number); return t.length ? [...new Set(t)] : null; }

const digSum = (n) => String(n).split('').reduce((a, c) => a + Number(c), 0);
const divBy = { 2: (n) => n % 2 === 0, 3: (n) => n % 3 === 0, 4: (n) => n % 4 === 0, 5: (n) => n % 5 === 0, 9: (n) => n % 9 === 0, 10: (n) => n % 10 === 0 };
const CRIT = {
  2: 'Un nombre est divisible par 2 si son chiffre des unités est 0, 2, 4, 6 ou 8.',
  3: 'Un nombre est divisible par 3 si la somme de ses chiffres est divisible par 3.',
  4: 'Un nombre est divisible par 4 si le nombre formé par ses deux derniers chiffres est divisible par 4.',
  5: 'Un nombre est divisible par 5 si son chiffre des unités est 0 ou 5.',
  9: 'Un nombre est divisible par 9 si la somme de ses chiffres est divisible par 9.',
  10: 'Un nombre est divisible par 10 si son chiffre des unités est 0.',
};
function explainCrit(n, k) {
  const ds = digSum(n);
  const yes = divBy[k](n);
  const how = { 2: `Chiffre des unités : ${n % 10}.`, 3: `Somme des chiffres : ${String(n).split('').join(' + ')} = ${ds}, ${yes ? '' : 'non '}divisible par 3.`, 9: `Somme des chiffres : ${String(n).split('').join(' + ')} = ${ds}, ${yes ? '' : 'non '}divisible par 9.`, 4: `Deux derniers chiffres : ${n % 100}, ${yes ? '' : 'non '}divisible par 4.`, 5: `Chiffre des unités : ${n % 10}.`, 10: `Chiffre des unités : ${n % 10}.` }[k];
  return `${CRIT[k]} ${how} Donc ${fmtN(n)} ${yes ? 'est' : 'n\'est pas'} divisible par ${k}.`;
}
const fmtN = (n) => big(n);
function genCriteres() {
  const k = pick([2, 3, 5, 9, 10]); const want = Math.random() < 0.5;
  let n, tries = 0;
  do { n = rand(120, 9999); tries++; } while (divBy[k](n) !== want && tries < 2000);
  const o = mcq(`<p>Le nombre <b>${fmtN(n)}</b> est-il divisible par <b>${k}</b> ?</p>`, ['Oui', 'Non'], divBy[k](n) ? 0 : 1, explainCrit(n, k), {});
  o.hints = [
    `Il existe un critère de divisibilité par ${k}. Tu peux le retrouver dans la fiche. Tu peux aussi poser la division, mais le critère est bien plus rapide.`,
    'Exemple : 5 418 par 3 ? 5 + 4 + 1 + 8 = 18 et 18 est dans la table de 3 : oui. Par 5 ? 5 418 se termine par 8 (ni 0 ni 5) : non.',
    `Outil : ${CRIT[k]}`,
  ];
  o.remediate = () => null;
  return solveMcq(o);
}

function genCritereChiffre() {
  const k = pick([2, 3, 5, 9, 10]);
  const len = rand(3, 4); const pos = k === 2 || k === 5 || k === 10 ? len - 1 : rand(0, len - 1);
  const digs = Array.from({ length: len }, () => rand(1, 9));
  const make = (d) => { const t = digs.slice(); t[pos] = d; return Number(t.join('')); };
  const shown = digs.map((x, i) => (i === pos ? '<span class="blank">?</span>' : String(x))).join('');
  const valid = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].filter((d) => divBy[k](make(d)));
  if (!valid.length) return genCritereChiffre();
  const bad = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].find((d) => !valid.includes(d));
  return {
    hints: [
      `Utilise le critère de divisibilité par ${k} : ${CRIT[k]}`,
      k === 3 || k === 9 ? 'Exemple : 4 ? 5 divisible par 3. 4 + 5 = 9 ; il faut une somme dans la table de 3 : ? peut valoir 0, 3, 6 ou 9.' : 'Exemple : 3 4 ? divisible par 5 : le dernier chiffre doit valoir 0 ou 5.',
      k === 3 || k === 9 ? `Outil : somme des chiffres connus = ${digs.reduce((a, c, i) => a + (i === pos ? 0 : c), 0)}. Quel chiffre ajouter pour obtenir un multiple de ${k} ?` : 'Outil : regarde uniquement le chiffre des unités.',
    ],
    remediate: () => null,
    q: `<p>Par quel chiffre peut-on remplacer le <span class="blank">?</span> pour que le nombre soit <b>divisible par ${k}</b> ?</p><p class="big nombre">${shown}</p><p class="big">Un chiffre possible : ${inp('num', 'Chiffre')}</p>`,
    check(r) { const x = valU(r); if (!x) return null; const ok = Number.isInteger(x.value) && x.value >= 0 && x.value <= 9 && divBy[k](make(x.value)); markInput(r, 0, ok); return { ok, msg: `${CRIT[k]} Les chiffres possibles sont : <b>${valid.join(', ')}</b>.` }; },
    __solve: (r) => setAns(r, 0, String(valid[0])), __wrong: (r) => setAns(r, 0, String(bad)),
  };
}

const PRIMES = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97];
const isPrime = (n) => n > 1 && PRIMES.concat([101, 103, 107, 109, 113]).includes(n);
function genPremier() {
  const L = LV(1, 2, 3); const t = Math.random(); let n;
  if (L === 1) n = pick([2, 3, 5, 7, 11, 13, 4, 6, 9, 10, 15, 14, 21, 17, 19]);
  else if (L === 3) n = pick([91, 87, 57, 51, 119, 77, 97, 89, 83, 111, 69, 93]);
  else if (t < 0.45) n = pick(PRIMES.filter((x) => x > 10));
  else if (t < 0.75) n = pick([49, 51, 57, 65, 77, 85, 87, 91, 93, 95, 119, 111, 69, 39, 33, 55, 35, 25, 21, 91]);
  else n = pick([27, 45, 63, 72, 81, 99, 100, 56, 48, 64, 84, 90, 75, 54]);
  const p = isPrime(n);
  const small = [2, 3, 5, 7, 11].find((x) => x < n && n % x === 0);
  const tested = [2, 3, 5, 7].filter((x) => x * x <= n);
  const o = mcq(`<p>Le nombre <b>${n}</b> est-il un nombre premier ?</p>`, ['Oui, il est premier', 'Non, il n\'est pas premier'], p ? 0 : 1,
    p ? `${n} n'est divisible par aucun des nombres premiers ${tested.join(', ')} (ceux dont le carré ne dépasse pas ${n}) : il n'a que deux diviseurs, 1 et ${n}. C'est un <b>nombre premier</b>.` : `${n} = ${small} × ${n / small} : il est divisible par ${small}, donc il a un diviseur autre que 1 et lui-même. Ce n'est <b>pas</b> un nombre premier.`, {});
  o.hints = [
    'Un nombre premier a exactement deux diviseurs : 1 et lui-même. Pour savoir si un nombre est premier, cherche un diviseur autre que 1 et lui-même.',
    'Teste les nombres premiers dans l\'ordre : 2, 3, 5, 7... avec les critères de divisibilité (et 7 par division). Exemple : 91 n\'est divisible ni par 2, 3, 5 mais 91 = 7 × 13 : pas premier.',
    `Outil : ${n} est-il divisible par 2 ? par 3 (somme des chiffres ${digSum(n)}) ? par 5 ? par 7 ?`,
  ];
  o.remediate = () => !p && n % 2 === 1 ? 'Un nombre impair n\'est pas toujours premier : teste aussi 3, 5 et 7.' : null;
  return solveMcq(o);
}

Object.assign(GENS, {
  'a-180': { ch: 'angles', f: genAngle180, label: 'Somme des angles d\'un triangle' },
  'a-rect': { ch: 'angles', f: genAngleRect, label: 'Triangle rectangle' },
  'a-iso': { ch: 'angles', f: genAngleIso, label: 'Triangle isocèle' },
  'a-nature': { ch: 'angles', f: genAngleNature, label: 'Nature d\'un triangle' },
  'a-vocab': { ch: 'angles', f: genAngleVocab, label: 'Vocabulaire des angles' },
  'a-par-calc': { ch: 'angles', f: genAnglePar, label: 'Angles et droites parallèles' },
  'a-prouver': { ch: 'angles', f: genAngleParallele, label: 'Montrer que des droites sont parallèles' },
  'f-meme': { ch: 'fractions2', f: genMeme, label: 'Fractions égales (autre dénominateur)' },
  'f-couple': { ch: 'fractions2', f: genCouple, label: 'Même dénominateur pour deux fractions' },
  'f-comparer': { ch: 'fractions2', f: genComparer, label: 'Comparer des fractions' },
  'f-encadrer': { ch: 'fractions2', f: genEncadrer, label: 'Encadrer une fraction' },
  'f-add-meme': { ch: 'fractions2', f: genAddMeme, label: 'Additionner (même dénominateur)' },
  'f-add-1': { ch: 'fractions2', f: genAddMult, label: 'Additionner (un dénominateur multiple de l\'autre)' },
  'f-add-2': { ch: 'fractions2', f: genAddAutre, label: 'Additionner (autres dénominateurs)' },
  'f-probleme': { ch: 'fractions2', f: genFracProbleme, label: 'Problèmes avec des fractions' },
  'd-euclid': { ch: 'divisibilite', f: genEuclide, label: 'Division euclidienne' },
  'd-egalite': { ch: 'divisibilite', f: genEgalite, label: 'Égalité de la division euclidienne' },
  'd-decimal': { ch: 'divisibilite', f: genDecimal, label: 'Division décimale' },
  'd-vocab': { ch: 'divisibilite', f: genDVocab, label: 'Multiples et diviseurs : vocabulaire' },
  'd-multiples': { ch: 'divisibilite', f: genMultiples, label: 'Chercher des multiples' },
  'd-diviseurs': { ch: 'divisibilite', f: genDiviseurs, label: 'Chercher tous les diviseurs' },
  'd-criteres': { ch: 'divisibilite', f: genCriteres, label: 'Critères de divisibilité' },
  'd-critere-nb': { ch: 'divisibilite', f: genCritereChiffre, label: 'Chiffre manquant' },
  'd-premier': { ch: 'divisibilite', f: genPremier, label: 'Nombres premiers' },
});
