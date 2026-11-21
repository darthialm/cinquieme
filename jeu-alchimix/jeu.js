/* =========================================================
   ALCHIMIX · cinquième — « Le chaudron exact » — chapitre « Fractions (partie 2) » de 5e
   Le joueur doit remplir le chaudron EXACTEMENT jusqu'à la marque (une fraction), avec les fioles de
   l'étagère (½, ⅓, ¼, ⅙…). Il compose sa recette (une ou plusieurs fioles), puis verse :
     - pile sur la marque : potion réussie ;
     - au-dessus : le chaudron déborde (explosion), la recette est annulée ;
     - en dessous : c'est versé, il faut compléter (avec plus de fioles, donc moins d'étoiles).
   La décision est mathématique : additionner, mettre au même dénominateur, comparer avant de verser.
   La LOUPE réécrit toutes les fioles avec le dénominateur que le joueur propose… s'il est un multiple
   commun : chercher ce dénominateur fait partie du jeu. Les étoiles récompensent la recette la plus courte.
   Variantes : le siphon (on retire : soustraction), « tout sauf… » (1 − …), « entre deux entiers » (encadrer).
   Duel « Fraction Jack » (tour par tour, moteur commun) : une réserve commune de fioles ; chacun son tour,
   on en prend une ou on s'arrête. Le plus proche de sa marque sans déborder gagne la manche.
   Adresse avec ?tout : toutes les recettes sont ouvertes (pour le professeur).
   ========================================================= */
(function () {
  'use strict';
  const { U } = window.Moteur;
  const { rand, pick, shuffle, gcd } = U;
  const app = document.getElementById('app');
  const S = U.store('u5e-alchimix2');
  S.d.stars = S.d.stars || {};
  const ALL_OPEN = /[?&]tout\b/.test(location.search);
  const Snd = window.Moteur.makeSound(() => !!S.d.mute);
  Snd.pour = function () { for (let i = 0; i < 6; i++) this.tone(300 + Math.random() * 500, 0.06, 'sine', 0.04, 0, i * 0.05); };
  Snd.boom = function () { this.noise(0.5, 0.35, 500); this.tone(90, 0.4, 'sawtooth', 0.06, 40); };
  Snd.brew = function () { [392, 523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.25, 'sine', 0.06, 0, i * 0.08)); };
  const muteBtn = document.getElementById('mute');
  const syncMute = () => { muteBtn.textContent = S.d.mute ? '🔇' : '🔊'; };
  muteBtn.addEventListener('click', () => { S.d.mute = !S.d.mute; S.save(); syncMute(); Snd.init(); });
  syncMute();

  /* ---------- Fractions ---------- */
  const lcm = (a, b) => (a * b) / gcd(a, b);
  const red = ([n, d]) => { const g = gcd(n, d) || 1; return [n / g, d / g]; };
  const addF = (a, b) => red([a[0] * b[1] + b[0] * a[1], a[1] * b[1]]);
  const subF = (a, b) => red([a[0] * b[1] - b[0] * a[1], a[1] * b[1]]);
  const cmpF = (a, b) => a[0] * b[1] - b[0] * a[1];
  const sumF = (list) => list.reduce((s, x) => addF(s, x), [0, 1]);
  const val = (a) => a[0] / a[1];
  const FR = (a) => (a[1] === 1 ? `${a[0]}` : U.fr(a[0], a[1]));
  const lcmAll = (list) => list.reduce((m, x) => lcm(m, x[1]), 1);
  /** « 1/2 + 1/3 = 3/6 + 2/6 = 5/6 » */
  function sumText(list) {
    if (!list.length) return '0';
    if (list.length === 1) return FR(list[0]);
    const L = lcmAll(list), nums = list.map((x) => (x[0] * L) / x[1]), tot = [nums.reduce((a, b) => a + b, 0), L], r = red(tot);
    const same = list.every((x) => x[1] === L);
    return `${list.map(FR).join(' + ')}${same ? '' : ` = ${nums.map((n) => FR([n, L])).join(' + ')}`} = ${FR(tot)}${r[1] !== L ? ` = ${FR(r)}` : ''}`;
  }
  const COLORS = ['#7CFC9A', '#ff6bd6', '#6bc8ff', '#ffd36b', '#c08bff', '#ff8a5c', '#5cffe1'];

  /* =========================================================
     Les énigmes. p = { mode: 'fill'|'siphon'|'zone', start, target, zone:[a,b], shelf:[{f:[n,d], n:stock, siphon}], cap,
                        exactly (nombre de fioles imposé), best (recette la plus courte), txt, title }
     ========================================================= */
  /** meilleure recette (nombre minimal de fioles) pour aller de start à target ; null si impossible */
  function bestRecipe(shelf, start, target, sign) {
    let best = null;
    const rec = (i, cur, used) => {
      if (best !== null && used >= best) return;
      const c = cmpF(cur, target);
      if (c === 0) { best = used; return; }
      if (i >= shelf.length) return;
      if (sign > 0 ? c > 0 : c < 0) return;
      for (let k = Math.min(shelf[i].n, 4); k >= 0; k--) {
        let nc = cur;
        for (let j = 0; j < k; j++) nc = sign > 0 ? addF(nc, shelf[i].f) : subF(nc, shelf[i].f);
        rec(i + 1, nc, used + k);
      }
    };
    rec(0, start, 0);
    return best;
  }
  const FAM = { six: [6], douze: [2, 3, 4, 6, 12], huit: [2, 4, 8], dix: [2, 5, 10], trois: [3, 6, 9], mix: [2, 3, 4, 5, 6, 8, 10, 12] };
  function shelfFrom(dens, nTypes, maxNum) {
    const set = new Map();
    for (let t = 0; t < 200 && set.size < nTypes; t++) {
      const d = pick(dens), n = rand(1, Math.max(1, Math.min(maxNum, d - 1)));
      const r = red([n, d]); set.set(r.join('/'), r);
    }
    return [...set.values()].sort((a, b) => cmpF(b, a)).map((f) => ({ f, n: rand(1, 3) }));
  }
  /** cible = somme d'une recette cachée de 2 à 4 fioles prises dans l'étagère */
  function puzzleFill(dens, o = {}) {
    for (let t = 0; t < 200; t++) {
      const shelf = shelfFrom(dens, o.types || 5, o.maxNum || 3);
      const k = rand(o.min || 2, o.max || 3), pickList = [];
      const stock = shelf.map((s) => s.n);
      for (let j = 0; j < k; j++) { const i = rand(0, shelf.length - 1); if (stock[i] > 0) { stock[i]--; pickList.push(shelf[i].f); } }
      if (pickList.length < 2) continue;
      const target = sumF(pickList);
      if (val(target) > (o.capMax || 1) || target[0] === 0) continue;
      if (o.hideDen && target[1] === Math.max(...pickList.map((x) => x[1]))) { /* rien */ }
      const best = bestRecipe(shelf, [0, 1], target, 1);
      if (best === null || best < 2) continue;
      return { mode: 'fill', start: [0, 1], target, shelf, cap: Math.max(1.2, val(target) * 1.25), best };
    }
    return puzzleFill([6]);
  }
  function puzzleSiphon(dens) {
    for (let t = 0; t < 200; t++) {
      const shelf = shelfFrom(dens, 4, 3).map((s) => ({ ...s, siphon: true }));
      const L = lcmAll(shelf.map((s) => s.f)), st = red([rand(Math.ceil(L * 0.6), L), L]);
      const k = rand(1, 2), list = [];
      for (let j = 0; j < k; j++) list.push(pick(shelf).f);
      const target = subF(st, sumF(list));
      if (target[0] <= 0) continue;
      const best = bestRecipe(shelf, st, target, -1);
      if (best === null || best < 1) continue;
      return { mode: 'siphon', start: st, target, shelf, cap: 1.2, best };
    }
    return puzzleSiphon([6]);
  }
  function puzzleReste(dens) { const p = puzzleFill(dens); const r = subF([1, 1], p.target); if (r[0] <= 0) return puzzleReste(dens); p.reste = r; return p; }
  function puzzleZone() {
    for (let t = 0; t < 200; t++) {
      const a = rand(1, 3), shelf = [];
      const seen = new Set();
      while (shelf.length < 6) { const d = pick([2, 3, 4, 5, 6]), n = rand(d + 1, 3 * d); const r = red([n, d]); if (r[1] === 1 || seen.has(r.join('/'))) continue; seen.add(r.join('/')); shelf.push({ f: r, n: 1 }); }
      // existe-t-il un couple dont la somme est strictement entre a et a + 1 ?
      let ok = 0;
      for (let i = 0; i < 6; i++) for (let j = i + 1; j < 6; j++) { const s = val(addF(shelf[i].f, shelf[j].f)); if (s > a && s < a + 1) ok++; }
      if (ok < 1 || ok > 4) continue;
      if (shelf.some((s) => val(s.f) >= a + 1)) { /* une fiole seule peut déjà dépasser : c'est un piège utile */ }
      return { mode: 'zone', start: [0, 1], zone: [a, a + 1], shelf: shelf.sort((x, y) => cmpF(y.f, x.f)), cap: a + 2, exactly: 2, best: 2 };
    }
    return puzzleZone();
  }

  const RECETTES = [
    { id: 'r1', icon: '🫗', name: 'Même graduation', tag: 'Additionner (même dénominateur)', n: 5, gen: () => puzzleFill(pick([[6], [8], [10], [12]]), { maxNum: 5, types: 4 }),
      rule: 'Même dénominateur : on additionne les numérateurs et on <b>garde</b> le dénominateur. ' + FR([2, 7]) + ' + ' + FR([3, 7]) + ' = ' + FR([5, 7]) + '.' },
    { id: 'r2', icon: '⚖️', name: 'Moitiés et quarts', tag: 'Un dénominateur multiple de l’autre', n: 5, gen: () => puzzleFill(pick([FAM.huit, FAM.trois, [2, 4], [3, 6], [5, 10]])),
      rule: 'Si un dénominateur est un multiple de l’autre, on convertit la fraction qui a le plus petit : ' + FR([1, 2]) + ' = ' + FR([2, 4]) + '. Utilise la <b>loupe</b> !' },
    { id: 'r3', icon: '🌀', name: 'Grands mélanges', tag: 'Dénominateurs quelconques', n: 5, gen: () => puzzleFill(pick([FAM.douze, FAM.dix, [3, 4, 12], [2, 3, 6]]), { types: 5 }),
      rule: 'Dénominateurs différents : on cherche un <b>multiple commun</b> (souvent leur produit). ' + FR([1, 3]) + ' + ' + FR([1, 4]) + ' = ' + FR([4, 12]) + ' + ' + FR([3, 12]) + ' = ' + FR([7, 12]) + '.' },
    { id: 'r4', icon: '🧪', name: 'Le siphon', tag: 'Soustraire', n: 5, gen: () => puzzleSiphon(pick([FAM.douze, [2, 4, 8], [3, 6, 12]])),
      rule: 'Le chaudron est trop plein ! Les siphons <b>retirent</b> une quantité. Retire exactement ce qu’il faut pour tomber sur la marque.' },
    { id: 'r5', icon: '🕳️', name: 'Tout sauf…', tag: 'Ce qui reste (1 − …)', n: 5, gen: () => puzzleReste(pick([FAM.douze, FAM.huit, [3, 6, 12]])),
      rule: `Un chaudron plein = 1 = ${FR([6, 6])} = ${FR([12, 12])}… Remplir « tout sauf ${FR([1, 6])} », c’est remplir 1 − ${FR([1, 6])} = ${FR([5, 6])}.` },
    { id: 'r6', icon: '📚', name: 'Entre deux', tag: 'Encadrer, comparer à des entiers', n: 5, gen: () => puzzleZone(),
      rule: 'Encadrer : ' + FR([17, 5]) + ' est entre 3 et 4 car 15 < 17 < 20. Il faut <b>exactement 2 fioles</b> pour finir strictement entre les deux entiers.' },
    { id: 'r7', icon: '🐉', name: 'Le Grand Œuvre', tag: 'Tout le chapitre', n: 6, boss: true, gen: (i) => [() => puzzleFill(FAM.mix, { types: 6, max: 4 }), () => puzzleSiphon(FAM.douze), () => puzzleReste(FAM.dix), () => puzzleZone(), () => puzzleFill(FAM.douze, { max: 4 }), () => puzzleFill([3, 4, 5, 6, 10, 12, 15], { types: 6 })][i](),
      rule: 'Toutes les recettes, avec les fioles les plus difficiles. La plus courte recette donne 3 étoiles !' },
  ];
  const unlocked = (i) => ALL_OPEN || i === 0 || (S.d.stars[RECETTES[i - 1].id] || 0) > 0;
  const starStr = (n) => '★'.repeat(n) + `<i>${'★'.repeat(3 - n)}</i>`;

  /* ---------- Dessins ---------- */
  function cauldronSVG(level, cap, marks, color, zone) {
    const H = 150, top = 40, y = (x) => top + H - (Math.min(x, cap * 1.08) / cap) * H;
    let h = `<svg viewBox="0 0 200 240" class="cauldron" aria-hidden="true"><defs><clipPath id="cc"><path d="M28 ${top} Q22 ${top + H + 8} 100 ${top + H + 12} Q178 ${top + H + 8} 172 ${top} Z"/></clipPath></defs>
      <g class="fire"><path d="M60 238 Q70 200 82 224 Q92 188 100 220 Q110 182 120 224 Q130 198 140 238 Z" fill="#ff7a1a"/><path d="M78 238 Q88 214 100 232 Q112 210 122 238 Z" fill="#ffd23f"/></g>
      <g clip-path="url(#cc)"><rect x="0" y="${y(level).toFixed(1)}" width="200" height="240" fill="${color}" class="brew"/>${[0, 1, 2, 3].map((k) => `<circle cx="${55 + k * 30}" cy="${(y(level) + 8).toFixed(1)}" r="${4 + (k % 2) * 3}" fill="${color}" class="bub" style="animation-delay:${k * 0.4}s"/>`).join('')}</g>`;
    if (zone) h += `<rect x="20" y="${y(zone[1]).toFixed(1)}" width="160" height="${(y(zone[0]) - y(zone[1])).toFixed(1)}" class="zone"/>`;
    (marks || []).forEach((m) => { h += `<line x1="14" x2="186" y1="${y(m.v).toFixed(1)}" y2="${y(m.v).toFixed(1)}" class="mark ${m.cls || ''}"/><text x="192" y="${(y(m.v) + 4).toFixed(1)}" class="mtxt">${m.t || ''}</text>`; });
    return h + `<path d="M28 ${top} Q22 ${top + H + 8} 100 ${top + H + 12} Q178 ${top + H + 8} 172 ${top}" class="pot"/><rect x="18" y="${top - 10}" width="164" height="14" rx="7" class="rim"/></svg>`;
  }
  const flaskBtn = (s, i, o = {}) => `<button type="button" class="flask${s.siphon ? ' siphon' : ''}${s.n <= 0 ? ' empty' : ''}" data-i="${i}" ${s.n <= 0 || o.off ? 'disabled' : ''} style="--c:${COLORS[i % COLORS.length]}">
    <span class="bottle"><i></i></span><span class="flab">${s.siphon ? '−' : ''}${FR(s.f)}</span>${o.loupe ? `<span class="loupe-lab">= ${FR(o.loupe)}</span>` : ''}${s.n !== undefined && !o.noCount ? `<span class="stock">×${s.n}</span>` : ''}</button>`;

  /* =========================================================
     Écrans (solo)
     ========================================================= */
  let G = null;
  const witch = (html) => `<div class="witch"><span class="face" aria-hidden="true">🧙‍♀️</span><div class="scroll">${html}</div></div>`;
  function home() {
    G = null;
    const total = RECETTES.reduce((s, z) => s + (S.d.stars[z.id] || 0), 0);
    const nextI = RECETTES.findIndex((z, i) => unlocked(i) && !S.d.stars[z.id]);
    app.innerHTML = `<div class="screen">
      <header class="brand"><h1>Alchimix</h1><span class="lvl">cinquième</span></header>
      <p class="tag">Le chaudron exact · <b>⭐ ${total} / ${RECETTES.length * 3}</b></p>
      ${witch(!S.d.intro ? 'Bienvenue dans mon laboratoire, je suis <b>Mélusine</b>. Mes potions ne pardonnent rien : le chaudron doit être rempli <b>exactement</b> jusqu’à la marque. Choisis tes fioles, calcule… puis verse. Si ça dépasse, <i>boum</i> ! Et la meilleure alchimiste utilise le <b>moins de fioles possible</b>.'
        : pick(['La <b>loupe</b> réécrit les fioles avec ton dénominateur… s’il est bien choisi !', 'Avant de verser, calcule : ça dépasse ou pas ?', 'On n’additionne <b>jamais</b> les dénominateurs.', 'Défie un ami à <b>Fraction Jack</b> !']))}
      <button type="button" class="duel-btn" data-act="duel">🃏 <b>Fraction Jack</b> <small>duel à deux, chacun son tour : approche ta marque sans déborder</small></button>
      <div class="book">${RECETTES.map((z, i) => { const lock = !unlocked(i), st = S.d.stars[z.id] || 0; return `<button type="button" class="page${z.boss ? ' boss' : ''}${lock ? ' locked' : ''}${i === nextI ? ' next' : ''}" data-z="${i}" ${lock ? 'disabled' : ''}>
        <span class="num">Recette ${i + 1}</span><span class="ico">${lock ? '🔒' : z.icon}</span><span class="nm">${z.name}</span><span class="rl">${z.tag}</span><span class="st">${starStr(st)}</span></button>`; }).join('')}</div>
      <p class="foot">⭐⭐⭐ = la recette la plus courte, sans explosion. Ta progression reste sur cet appareil.</p></div>`;
    app.querySelectorAll('[data-z]').forEach((b) => b.addEventListener('click', () => { Snd.init(); S.d.intro = true; S.save(); brief(RECETTES[Number(b.dataset.z)]); }));
    app.querySelector('[data-act="duel"]').addEventListener('click', () => { Snd.init(); duel(); });
  }
  function brief(M) {
    const idx = RECETTES.indexOf(M);
    app.innerHTML = `<div class="screen"><div class="card"><p class="kicker">Recette ${idx + 1} / ${RECETTES.length} · ${M.tag}</p><h1>${M.icon} ${M.name}</h1>
      <div class="rule">${M.rule}</div>
      ${witch('Touche les fioles pour composer ta recette, puis <b>Verser</b>. Pas assez ? Tu peux compléter (mais ça coûte une étoile). Trop ? <b>Boum</b>, et on recommence la recette.')}
      <div class="row"><button type="button" class="btn ghost" data-act="back">← Grimoire</button><button type="button" class="btn go" data-act="go">▶ Allumer le feu</button></div></div></div>`;
    app.querySelector('[data-act="back"]').addEventListener('click', home);
    app.querySelector('[data-act="go"]').addEventListener('click', () => { G = { M, i: 0, stars: [] }; nextPuzzle(); });
    app.querySelector('[data-act="go"]').focus();
  }
  function nextPuzzle() {
    const M = G.M;
    if (G.i >= M.n) { end(); return; }
    const p = M.gen(G.i);
    G.p = p; G.cur = p.start; G.poured = []; G.tray = []; G.boom = 0; G.used = 0; G.loupe = null; G.color = pick(COLORS); G.phase = 'play';
    G.stock = p.shelf.map((s) => s.n);
    render();
  }
  function goalText(p) {
    if (p.mode === 'zone') return `Finis <b>strictement entre ${p.zone[0]} et ${p.zone[1]}</b> chaudrons, avec exactement 2 fioles.`;
    if (p.mode === 'siphon') return `Le chaudron contient ${FR(p.start)}. Retire ce qu’il faut pour tomber pile sur <b>${FR(p.target)}</b>.`;
    if (p.reste) return `Remplis le chaudron <b>entièrement, sauf ${FR(p.reste)}</b>.`;
    return `Remplis le chaudron jusqu’à <b>${FR(p.target)}</b> exactement.`;
  }
  function render(msg = '') {
    const p = G.p, M = G.M;
    const marks = p.mode === 'zone' ? [] : [{ v: val(p.target), cls: 'goal', t: '' }];
    app.innerHTML = `<div class="screen play"><div class="hud"><button type="button" class="quit" data-act="quit" aria-label="Arrêter">✕</button><span class="zn">${M.icon} ${M.name}</span>
      <span class="dots">${Array.from({ length: M.n }, (_, i) => `<i class="${G.stars[i] === 3 ? 'ok' : G.stars[i] ? 'mid' : i === G.i ? 'cur' : ''}"></i>`).join('')}</span><span class="zn right">💥 ${G.boom}</span></div>
      <div class="lab2">
        <div class="potcol">${cauldronSVG(val(G.cur), p.cap, marks, G.color, p.mode === 'zone' ? p.zone : null)}
          <div class="poured">${p.mode === 'siphon' ? `Au départ : ${FR(p.start)}<br>` : ''}${G.poured.length ? `${p.mode === 'siphon' ? 'Retiré' : 'Déjà versé'} : ${G.poured.map(FR).join(' + ')}` : p.mode === 'siphon' ? '' : 'Chaudron vide'}</div></div>
        <div class="desk2"><p class="goal">${goalText(p)}</p>
          <div class="shelf">${p.shelf.map((s, i) => flaskBtn({ ...s, n: G.stock[i] }, i, { loupe: G.loupe ? [s.f[0] * G.loupe / s.f[1], G.loupe] : null })).join('')}</div>
          <div class="tray"><span class="tl">Ta recette :</span>${G.tray.length ? G.tray.map((i, k) => `<button type="button" class="tchip" data-k="${k}" style="--c:${COLORS[i % COLORS.length]}">${p.shelf[i].siphon ? '−' : ''}${FR(p.shelf[i].f)} ✕</button>`).join('<span class="plus">+</span>') : '<i>touche des fioles</i>'}</div>
          <div class="row"><button type="button" class="btn go" data-act="pour" ${G.tray.length ? '' : 'disabled'}>${p.mode === 'siphon' ? '🧪 Siphonner' : '🫗 Verser'}</button><button type="button" class="btn ghost" data-act="loupe">🔍 Loupe${G.loupe ? ` (en ${G.loupe}<sup>es</sup>)` : ''}</button></div>
          <div id="loupebox"></div><div class="msg" id="msg">${msg}</div></div></div></div>`;
    app.querySelector('[data-act="quit"]').addEventListener('click', () => { if (confirm('Éteindre le feu et revenir au grimoire ?')) home(); });
    app.querySelectorAll('.flask').forEach((b) => U.tap(b, () => { if (G.phase !== 'play') return; const i = Number(b.dataset.i); if (G.stock[i] <= 0) return; if (p.exactly && G.tray.length >= p.exactly) return; G.stock[i]--; G.tray.push(i); Snd.key(); render(); }));
    app.querySelectorAll('.tchip').forEach((b) => U.tap(b, () => { if (G.phase !== 'play') return; const k = Number(b.dataset.k); G.stock[G.tray[k]]++; G.tray.splice(k, 1); render(); }));
    app.querySelector('[data-act="pour"]').addEventListener('click', pour);
    app.querySelector('[data-act="loupe"]').addEventListener('click', openLoupe);
  }
  function openLoupe() {
    const box = document.getElementById('loupebox');
    box.innerHTML = `<div class="loupe"><p>Avec quel <b>dénominateur commun</b> réécrire toutes les fioles${G.p.mode === 'zone' ? '' : ' et la marque'} ?</p><div id="lpad"></div></div>`;
    window.Moteur.pad(document.getElementById('lpad'), { ok: '🔍 Réécrire', keyboard: true, sound: Snd, onSubmit: (D) => {
      const p = G.p, all = [...p.shelf.map((s) => s.f), ...(p.mode === 'zone' ? [] : [p.target]), ...(p.mode === 'siphon' ? [p.start] : [])];
      const bad = all.find((f) => D % f[1] !== 0);
      if (!D || bad) { document.getElementById('msg').innerHTML = `<div class="explain">${FR(bad || [1, 1])} ne peut pas s’écrire avec le dénominateur ${D} : ${D} n’est pas un multiple de ${bad ? bad[1] : '…'}. Cherche un nombre qui est dans la table de <b>tous</b> les dénominateurs.</div>`; return; }
      G.loupe = D;
      render(`<div class="explain good">🔍 Tout est réécrit en ${D}<sup>es</sup>${p.mode === 'zone' ? '' : ` : la marque est à ${FR([p.target[0] * D / p.target[1], D])}`}${p.mode === 'siphon' ? `, le chaudron contient ${FR([p.start[0] * D / p.start[1], D])}` : ''}.</div>`);
    } });
  }
  function pour() {
    if (!G || G.phase !== 'play' || !G.tray.length) return;
    const p = G.p, fl = G.tray.map((i) => p.shelf[i].f), amount = sumF(fl);
    if (p.exactly && G.tray.length !== p.exactly) { document.getElementById('msg').innerHTML = `<div class="explain">Cette recette se fait avec exactement ${p.exactly} fioles.</div>`; return; }
    const next = p.mode === 'siphon' ? subF(G.cur, amount) : addF(G.cur, amount);
    let fail = '';
    if (p.mode === 'zone') { const v = val(next); if (v >= p.zone[1]) fail = `${sumText(fl)} : c’est ${v === p.zone[1] ? 'pile' : 'plus que'} ${p.zone[1]}, ça déborde de la zone !`; else if (v <= p.zone[0]) fail = `${sumText(fl)} : ${v === p.zone[0] ? 'pile' : 'moins que'} ${p.zone[0]}, pas assez pour entrer dans la zone.`; }
    else if (p.mode === 'siphon' ? cmpF(next, p.target) < 0 : cmpF(next, p.target) > 0) fail = p.mode === 'siphon' ? `Tu as retiré trop : il resterait moins que ${FR(p.target)}.` : `Ça dépasse la marque ${FR(p.target)} !`;
    if (fail) {
      G.boom++; Snd.boom();
      G.tray.forEach((i) => { G.stock[i]++; }); G.tray = [];
      render(`<div class="explain">💥 <b>Boum !</b> ${fail} La recette est annulée : recalcule avant de verser.</div>`);
      const lab = app.querySelector('.lab2'); lab.classList.add('boom');
      return;
    }
    Snd.pour();
    G.used += G.tray.length; G.poured.push(...fl); G.tray = []; G.cur = next;
    const done = p.mode === 'zone' || cmpF(next, p.target) === 0;
    if (!done) { render(`<div class="explain warn">Versé ! Mais ce n’est pas encore exact : ${p.mode === 'siphon' ? 'il faut encore retirer un peu' : 'il manque encore un peu'}. Combien ?</div>`); return; }
    G.phase = 'done';
    const stars = G.boom === 0 && G.used <= p.best ? 3 : G.boom === 0 ? 2 : 1;
    G.stars[G.i] = stars; G.i++;
    Snd.brew(); U.confetti(stars * 15 + 10, [G.color, '#ffd36b', '#fff']);
    const detail = p.mode === 'zone' ? `${sumText(G.poured)}, et ${p.zone[0]} < ${FR(sumF(G.poured))} < ${p.zone[1]}.` : p.mode === 'siphon' ? `${FR(p.start)} − ${G.poured.map(FR).join(' − ')} = ${FR(p.target)}.` : `${sumText(G.poured)}${p.reste ? ` = 1 − ${FR(p.reste)}` : ''}.`;
    render(`<div class="explain good"><b>✨ Potion parfaite !</b> ${detail}<br>${'⭐'.repeat(stars)} ${stars === 3 ? 'Recette la plus courte !' : G.used > p.best ? `On pouvait le faire avec ${p.best} fiole${p.best > 1 ? 's' : ''}.` : 'Sans explosion la prochaine fois !'}</div><button type="button" class="btn go" data-act="next">Potion suivante ▶</button>`);
    app.querySelector('[data-act="next"]').addEventListener('click', nextPuzzle);
    app.querySelector('[data-act="next"]').focus();
  }
  function end() {
    const M = G.M, idx = RECETTES.indexOf(M), next = RECETTES[idx + 1];
    const avg = G.stars.reduce((a, b) => a + b, 0) / G.stars.length, stars = avg >= 2.75 ? 3 : avg >= 1.9 ? 2 : 1;
    const old = S.d.stars[M.id] || 0; S.d.stars[M.id] = Math.max(old, stars); S.save();
    Snd.win(); U.confetti(stars * 30);
    app.innerHTML = `<div class="screen"><div class="card"><p class="kicker">Recette ${idx + 1} · ${M.name}</p><h1 class="center">${stars === 3 ? 'Maîtresse alchimiste !' : 'Recette apprise'}</h1>
      <div class="stars">${[0, 1, 2].map((i) => `<span class="${i < stars ? 'on' : ''}" style="animation-delay:${0.2 + i * 0.25}s">★</span>`).join('')}</div>
      <p class="center dim">Potions : ${G.stars.map((s) => '⭐'.repeat(s)).join(' · ')}</p>
      ${witch(stars === 3 ? 'Chaque potion avec la recette la plus courte : tu calcules avant de verser, bravo !' : 'Pour 3 étoiles : pas d’explosion, et la recette la plus courte. Calcule avant de verser !')}
      ${!old && next ? `<p class="center unlock">🔓 Recette débloquée : ${next.icon} ${next.name}</p>` : ''}
      <div class="row"><button type="button" class="btn ghost" data-act="home">← Grimoire</button><button type="button" class="btn${next ? '' : ' go'}" data-act="again">↻ Recommencer</button>${next ? '<button type="button" class="btn go" data-act="next">Recette suivante ▶</button>' : ''}</div></div></div>`;
    app.querySelector('[data-act="home"]').addEventListener('click', home);
    app.querySelector('[data-act="again"]').addEventListener('click', () => brief(M));
    app.querySelector('[data-act="next"]')?.addEventListener('click', () => brief(next));
  }

  /* =========================================================
     DUEL « FRACTION JACK » (tour par tour)
     Chacun a sa marque. Une réserve commune de 5 fioles visibles. À son tour : prendre une fioles (elle est
     versée dans SON chaudron) ou s'arrêter. Dépasser = déborder (manche perdue). Quand les deux se sont
     arrêtés, le plus proche de sa marque gagne la manche. Deux manches gagnées = victoire.
     Le niveau de chaque joueur règle l'aide : « Apprenti » voit le total de son chaudron ; les autres non.
     ========================================================= */
  const DLV = [{ id: '1', nom: 'Apprenti', desc: 'Je vois le total de mon chaudron' }, { id: '2', nom: 'Alchimiste', desc: 'Je calcule mon total moi-même' }];
  const DMODES = [
    { id: 'un', nom: 'Marque 1', desc: 'Demis, tiers, quarts, sixièmes, douzièmes', dens: [2, 3, 4, 6, 12], target: () => [1, 1] },
    { id: 'var', nom: 'Marques variées', desc: 'La marque change : ¾, ⁵⁄₆, 1 ½…', dens: [2, 3, 4, 6, 12], target: () => pick([[3, 4], [5, 6], [7, 6], [3, 2], [5, 4], [11, 12]]) },
    { id: 'exp', nom: 'Expert', desc: 'Avec des cinquièmes et des dixièmes', dens: [2, 3, 4, 5, 6, 10], target: () => pick([[1, 1], [9, 10], [6, 5], [4, 3]]) },
  ];
  function duel() {
    window.Moteur.match({ jeu: 'fraction-jack-5e', titre: 'Fraction Jack', niveauScolaire: 'cinquième', theme: 'alchimix', icone: '🃏', sound: Snd, niveaux: DLV, modes: DMODES, quitter: home,
      start: (ctx) => jack(ctx) });
  }
  function jack(ctx) {
    const MODE = DMODES.find((m) => m.id === ctx.mode) || DMODES[0];
    const wins = [0, 0];
    let J;
    const draw = () => { const d = pick(MODE.dens), n = rand(1, d === 2 ? 1 : d <= 4 ? d - 1 : Math.ceil(d / 2)); return red([n, d]); };
    function round(first) {
      J = { turn: first, market: Array.from({ length: 5 }, draw), pl: [0, 1].map(() => ({ list: [], tot: [0, 1], stop: false, bust: false, target: MODE.target() })), first, log: '' };
      J.pl[1].target = MODE.id === 'un' ? [1, 1] : J.pl[0].target; // même marque pour les deux, pour être juste
      ctx.P.forEach((p) => {
        p.el.innerHTML = `<div class="jz"><div class="jhead"><span>${p.k === 0 ? '🟢' : '🟣'} ${U.esc(p.nom)}</span><span class="jw"></span></div>
          <div class="jmine"><div class="jpot"></div><div class="jinfo"></div></div>
          <p class="m-turnmsg"></p><div class="jmarket"></div>
          <div class="m-row"><button type="button" class="m-btn m-ghost jstop">✋ Je m’arrête</button></div>
          <div class="jopp"></div><div class="jlog"></div></div>`;
        U.tap(p.el.querySelector('.jstop'), () => stop(p.k));
      });
      show();
    }
    function show() {
      ctx.turn(J.turn);
      ctx.P.forEach((p) => {
        const me = J.pl[p.k], op = J.pl[1 - p.k], lv = p.niveau;
        p.el.querySelector('.jw').textContent = `Manches : ${'🏆'.repeat(wins[p.k])}${wins[p.k] ? '' : '—'}`;
        p.el.querySelector('.jpot').innerHTML = cauldronSVG(val(me.tot), Math.max(1.25, val(me.target) * 1.25), [{ v: val(me.target), cls: 'goal' }], p.k === 0 ? '#7CFC9A' : '#c08bff');
        p.el.querySelector('.jinfo').innerHTML = `<p>Ma marque : <b>${FR(me.target)}</b></p><p>Dans mon chaudron : ${me.list.length ? me.list.map(FR).join(' + ') : '<i>rien</i>'}</p>${lv === '1' && me.list.length ? `<p class="jtot">Total : ${FR(me.tot)}</p>` : ''}${me.bust ? '<p class="jbust">💥 Débordé !</p>' : me.stop ? '<p class="jstopped">✋ Arrêté</p>' : ''}`;
        const myTurn = J.turn === p.k && !me.stop && !me.bust;
        p.el.querySelector('.m-turnmsg').textContent = myTurn ? 'À toi : prends une fiole… ou arrête-toi.' : me.stop || me.bust ? 'Tu as fini cette manche.' : `Au tour de ${ctx.P[1 - p.k].nom}…`;
        p.el.querySelector('.jmarket').innerHTML = J.market.map((f, i) => flaskBtn({ f }, i, { noCount: true, off: !myTurn })).join('');
        p.el.querySelectorAll('.jmarket .flask').forEach((b) => U.tap(b, () => take(p.k, Number(b.dataset.i))));
        p.el.querySelector('.jstop').disabled = !myTurn;
        p.el.querySelector('.jopp').innerHTML = `${U.esc(ctx.P[1 - p.k].nom)} vise ${FR(op.target)} et a pris : ${op.list.length ? op.list.map(FR).join(' + ') : '<i>rien</i>'}${op.bust ? ' 💥' : op.stop ? ' ✋' : ''}`;
        p.el.querySelector('.jlog').innerHTML = J.log;
      });
    }
    function nextTurn() {
      const o = 1 - J.turn;
      if (!J.pl[o].stop && !J.pl[o].bust) J.turn = o;
      else if (J.pl[J.turn].stop || J.pl[J.turn].bust) { endRound(); return; }
      show();
    }
    function take(k, i) {
      if (J.turn !== k) return;
      const me = J.pl[k], f = J.market[i];
      me.list.push(f); me.tot = addF(me.tot, f);
      J.market[i] = draw();
      Snd.pour();
      J.log = `${U.esc(ctx.P[k].nom)} prend ${FR(f)}.`;
      const c = cmpF(me.tot, me.target);
      if (c > 0) { me.bust = true; Snd.boom(); J.log += ' 💥 Ça déborde !'; }
      else if (c === 0) { me.stop = true; Snd.brew(); J.log += ' ✨ Pile sur la marque !'; }
      nextTurn();
    }
    function stop(k) { if (J.turn !== k) return; J.pl[k].stop = true; J.log = `${U.esc(ctx.P[k].nom)} s’arrête.`; nextTurn(); }
    function endRound() {
      const gaps = J.pl.map((p) => (p.bust ? null : subF(p.target, p.tot)));
      let w = null;
      if (gaps[0] && gaps[1]) { const c = cmpF(gaps[0], gaps[1]); w = c < 0 ? 0 : c > 0 ? 1 : null; }
      else if (gaps[0]) w = 0; else if (gaps[1]) w = 1;
      if (w !== null) wins[w]++;
      const detail = J.pl.map((p, k) => `<div class="jres"><b>${U.esc(ctx.P[k].nom)}</b> : ${p.list.length ? sumText(p.list) : '0'}${p.bust ? ` > ${FR(p.target)} : débordé 💥` : ` ; il manque ${FR(p.target)} − ${FR(p.tot)} = <b>${FR(gaps[k])}</b>`}</div>`).join('');
      const cmpTxt = gaps[0] && gaps[1] && w !== null ? `<p class="m-dim">On compare ce qui manque : ${FR(gaps[w])} < ${FR(gaps[1 - w])}.</p>` : '';
      if (wins[0] >= 2 || wins[1] >= 2) {
        const W = wins[0] >= 2 ? 0 : 1;
        ctx.end({ winner: W, score: [0, 1].map((k) => `${wins[k]} manche${wins[k] > 1 ? 's' : ''} gagnée${wins[k] > 1 ? 's' : ''}`), stats: [0, 1].map((k) => ({ manches: wins[k] })), text: [0, 1].map(() => `<p class="m-kick">Dernière manche</p>${detail}${cmpTxt}<p class="m-dim">Manches : ${U.esc(ctx.P[0].nom)} ${wins[0]} – ${wins[1]} ${U.esc(ctx.P[1].nom)}</p>`) });
        return;
      }
      ctx.turn(null);
      ctx.P.forEach((p) => {
        p.el.innerHTML = `<div class="m-end"><p class="m-big">${w === null ? 'Manche nulle' : w === p.k ? 'Manche gagnée !' : 'Manche perdue'}</p><div class="m-miss">${detail}${cmpTxt}</div>
          <p class="m-dim">Manches : ${U.esc(ctx.P[0].nom)} ${wins[0]} – ${wins[1]} ${U.esc(ctx.P[1].nom)}</p><div class="m-row"><button type="button" class="m-btn m-go" data-a="go">Manche suivante ▶</button></div></div>`;
        U.tap(p.el.querySelector('[data-a="go"]'), () => round(1 - J.first));
      });
    }
    round(Math.random() < 0.5 ? 0 : 1);
  }

  window.__alchimix = { puzzleFill, puzzleSiphon, puzzleReste, puzzleZone, bestRecipe, sumText, RECETTES };
  home();
})();
