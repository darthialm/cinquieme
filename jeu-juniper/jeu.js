/* =========================================================
   JUNIPER GREEN · cinquième — chapitre « Divisibilité » (multiples et diviseurs)
   Le jeu classique de Rob Harris. Une grille de nombres de 1 à N. Chacun son tour, on choisit un nombre libre qui est
   un MULTIPLE ou un DIVISEUR du dernier nombre joué ; chaque nombre ne sert qu'une fois. Le premier nombre doit être
   pair. Le joueur qui ne peut plus jouer a perdu.
   La décision est mathématique : trouver les multiples et les diviseurs, et prévoir ce qu'il restera à l'adversaire
   (un grand nombre premier ne se relie qu'à 1 ; jouer 1 ouvre toute la grille…).
   - Solo « Contre le robot » : trois robots (Pousse : au hasard ; Chêne : voit un coup d'avance ; Séquoia : calcule
     loin). 3 cœurs : un nombre qui n'est ni multiple ni diviseur coûte un cœur, avec l'explication (division et reste).
   - Solo « La plus longue chaîne » : enchaîner le plus de nombres possible, départ libre. Le robot a cherché sa
     meilleure chaîne : 3 étoiles si on l'égale.
   - Duel (moteur commun, tour par tour) : grille 1–20, 1–40 ou 1–60 ; Apprenti = 3 cœurs, Expert = une erreur et
     c'est perdu (règle officielle).
   Chaque coup juste s'affiche avec sa justification : « 24 = 8 × 3 ».
   ========================================================= */
(function () {
  'use strict';
  const { U } = window.Moteur;
  const { pick, esc } = U;
  const app = document.getElementById('app');
  const S = U.store('u5e-juniper');
  S.d.rec = S.d.rec || {};   // plus longue chaîne : meilleur score par grille
  S.d.wins = S.d.wins || {}; // victoires contre le robot, par « grille-robot »
  S.d.bot = S.d.bot || {};   // record du robot (chaîne), calculé une fois par grille
  const Snd = window.Moteur.makeSound(() => !!S.d.mute);
  Snd.leaf = function () { this.tone(660, 0.09, 'sine', 0.05, 990); };
  const muteBtn = document.getElementById('mute');
  const syncMute = () => { muteBtn.textContent = S.d.mute ? '🔇' : '🔊'; };
  muteBtn.addEventListener('click', () => { S.d.mute = !S.d.mute; S.save(); syncMute(); Snd.init(); });
  syncMute();

  /* =========================================================
     Arithmétique
     ========================================================= */
  const linked = (a, b) => a !== b && (a % b === 0 || b % a === 0);
  const ADJ = {};
  /** adj(N)[x] = nombres de 1 à N reliés à x */
  function adj(N) {
    if (ADJ[N]) return ADJ[N];
    const A = [[]];
    for (let x = 1; x <= N; x++) { A[x] = []; for (let y = 1; y <= N; y++) if (linked(x, y)) A[x].push(y); }
    return (ADJ[N] = A);
  }
  /** coups possibles après « last » (null = premier coup : un nombre pair, sauf si freeStart) */
  function moves(last, used, N, freeStart) {
    const r = [];
    if (last === null) { for (let x = 1; x <= N; x++) if (!used[x] && (freeStart || x % 2 === 0)) r.push(x); return r; }
    for (const y of adj(N)[last]) if (!used[y]) r.push(y);
    return r;
  }
  const countMoves = (last, used, N) => { let c = 0; for (const y of adj(N)[last]) if (!used[y]) c++; return c; };
  /** « 24 est un multiple de 8 : 24 = 8 × 3 » */
  function relText(prev, x) {
    if (x % prev === 0) return `<b>${x}</b> est un multiple de ${prev} : ${x} = ${prev} × ${x / prev}`;
    return `<b>${x}</b> est un diviseur de ${prev} : ${prev} = ${x} × ${prev / x}`;
  }
  /** « 6, un diviseur de 12 (12 = 6 × 2) » : après « Chêne joue… » */
  function relShort(prev, x) {
    if (x % prev === 0) return `<b>${x}</b>, un multiple de ${prev} (${x} = ${prev} × ${x / prev})`;
    return `<b>${x}</b>, un diviseur de ${prev} (${prev} = ${x} × ${prev / x})`;
  }
  const relTag =(prev, x) => (x % prev === 0 ? `×${x / prev}` : `÷${prev / x}`);
  function whyNot(prev, x) {
    const big = Math.max(prev, x), small = Math.min(prev, x), q = Math.floor(big / small), r = big % small;
    return `${x} n’est ni un multiple ni un diviseur de ${prev} : ${big} = ${small} × ${q} + ${r}, le reste n’est pas 0.`;
  }
  const ODD_MSG = 'Le <b>premier nombre doit être pair</b>. (Sinon, le premier joueur gagnerait trop facilement avec un grand nombre premier !)';
  /** pourquoi on est bloqué après « last » */
  function deadText(last, N) {
    const divs = [], mults = [];
    for (let d = 1; d < last; d++) if (last % d === 0) divs.push(d);
    for (let m = last * 2; m <= N; m += last) mults.push(m);
    return `Diviseurs de ${last} : ${divs.length ? divs.join(', ') : 'aucun autre que lui-même'}. Multiples de ${last} jusqu’à ${N} : ${mults.length ? mults.join(', ') : 'aucun autre que lui-même'}. ${divs.length + mults.length ? 'Ils sont <b>tous déjà pris</b>.' : ''}`;
  }
  const cols = (N) => (N <= 20 ? 5 : N <= 30 ? 6 : N <= 40 ? 8 : 10);

  /* =========================================================
     Les robots
     ========================================================= */
  const BOTS = [
    { id: 0, nom: 'Pousse', ico: '🌱', desc: 'Joue un peu au hasard' },
    { id: 1, nom: 'Chêne', ico: '🌳', desc: 'Voit un coup d’avance' },
    { id: 2, nom: 'Séquoia', ico: '🌲', desc: 'Calcule loin : très fort' },
  ];
  function aiMove(last, used, N, lvl) {
    const ms = moves(last, used, N);
    if (!ms.length) return null;
    if (lvl === 0) {
      // Pousse : au hasard, mais prend un coup gagnant une fois sur deux
      const win = ms.filter((m) => { used[m] = 1; const z = countMoves(m, used, N) === 0; used[m] = 0; return z; });
      return win.length && Math.random() < 0.5 ? pick(win) : pick(ms);
    }
    const win = ms.filter((m) => { used[m] = 1; const z = countMoves(m, used, N) === 0; used[m] = 0; return z; });
    if (win.length) return pick(win);
    if (lvl === 1) {
      // Chêne : évite de laisser un coup gagnant à l'adversaire
      const safe = ms.filter((m) => {
        used[m] = 1;
        const bad = moves(m, used, N).some((o) => { used[o] = 1; const z = countMoves(o, used, N) === 0; used[o] = 0; return z; });
        used[m] = 0; return !bad;
      });
      return pick(safe.length ? safe : ms);
    }
    return negamax(ms, used, N);
  }
  /** Séquoia : recherche alpha-bêta à profondeur croissante, dans une limite de calcul */
  function negamax(ms, used, N) {
    let nodes = 0, abort = false;
    const LIMIT = 60000;
    function neg(l, depth, a, b, ply) {
      if (++nodes > LIMIT) { abort = true; return 0; }
      const list = moves(l, used, N);
      if (!list.length) return -1000 + ply;
      if (depth === 0) return list.length;
      const ord = depth > 1 ? list.map((m) => { used[m] = 1; const c = countMoves(m, used, N); used[m] = 0; return [c, m]; }).sort((x, y) => x[0] - y[0]).map((x) => x[1]) : list;
      let best = -Infinity;
      for (const m of ord) {
        used[m] = 1; const v = -neg(m, depth - 1, -b, -a, ply + 1); used[m] = 0;
        if (abort) return 0;
        if (v > best) best = v;
        if (v > a) a = v;
        if (a >= b) break;
      }
      return best;
    }
    let bestMove = pick(ms);
    for (let d = 1; d <= 40; d++) {
      let bm = null, bv = -Infinity;
      for (const m of [bestMove, ...ms.filter((x) => x !== bestMove)]) {
        used[m] = 1; const v = -neg(m, d - 1, -Infinity, -bv, 1); used[m] = 0;
        if (abort) break;
        if (v > bv) { bv = v; bm = m; }
      }
      if (abort) break;
      bestMove = bm;
      if (Math.abs(bv) >= 900) break; // partie résolue
    }
    return bestMove;
  }
  /** la plus longue chaîne trouvée par le robot (recherche en profondeur, limitée) */
  function botChain(N) {
    if (S.d.bot[N]) return S.d.bot[N];
    const A = adj(N), used = new Uint8Array(N + 1), path = [];
    let best = [], nodes = 0;
    const BUDGET = 300000, per = Math.floor(BUDGET / N);
    function dfs(x, lim) {
      if (++nodes > lim) return;
      path.push(x); used[x] = 1;
      if (path.length > best.length) best = path.slice();
      const nb = A[x].filter((y) => !used[y]).map((y) => [countMoves(y, used, N), y]).sort((p, q) => p[0] - q[0]);
      for (const [, y] of nb) { dfs(y, lim); if (nodes > lim) break; }
      used[x] = 0; path.pop();
    }
    for (let s = 1; s <= N; s++) { const lim = nodes + per; dfs(s, lim); nodes = lim; }
    S.d.bot[N] = best; S.save();
    return best;
  }

  /* =========================================================
     Accueil
     ========================================================= */
  const guide = (html) => `<div class="guide"><span class="face" aria-hidden="true">🦉</span><div class="scroll">${html}</div></div>`;
  const starStr = (n) => '★'.repeat(n) + `<i>${'★'.repeat(3 - n)}</i>`;
  const CHAINS = [20, 30, 40];
  const chainStars = (N) => { const r = S.d.rec[N] || 0, b = (S.d.bot[N] || []).length; if (!r) return 0; if (!b) return 1; return r >= b ? 3 : r >= Math.ceil(b * 0.8) ? 2 : 1; };
  let G = null;
  function home() {
    G = null;
    const grid = S.d.grid || 40;
    app.innerHTML = `<div class="screen">
      <header class="brand"><h1>Juniper Green</h1><span class="lvl">cinquième</span></header>
      <p class="tag">Multiples et diviseurs : le dernier qui peut jouer a gagné</p>
      ${guide(!S.d.intro ? 'Bienvenue dans mon jardin, je suis <b>Hulotte</b>. Chacun son tour, on choisit un nombre qui est un <b>multiple</b> ou un <b>diviseur</b> du dernier nombre joué. Chaque nombre ne sert qu’une fois, et le premier doit être pair. Celui qui ne peut plus jouer a <b>perdu</b> !'
        : pick(['Un grand nombre premier comme 37 ne se relie qu’à <b>1</b>… et à lui-même. Piège à adversaire !', 'Le nombre <b>1</b> est un diviseur de tous les nombres : après lui, tout est permis.', 'Avant de jouer, demande-toi : qu’est-ce que je laisse à mon adversaire ?', 'Défie un camarade en <b>duel</b> sur la même tablette !']))}
      <button type="button" class="duel-btn" data-act="duel">⚔️ <b>Duel</b> <small>à deux sur la même tablette, chacun son tour</small></button>
      <section class="part"><div class="part-head"><h2>🤖 Contre le robot</h2>
        <div class="chips">${[20, 40, 60].map((n) => `<button type="button" class="chip${n === grid ? ' on' : ''}" data-grid="${n}">1 – ${n}</button>`).join('')}</div></div>
        <div class="book">${BOTS.map((b) => { const w = S.d.wins[`${grid}-${b.id}`] || 0; return `<button type="button" class="page" data-bot="${b.id}"><span class="ico">${b.ico}</span><span class="nm">${b.nom}</span><span class="rl">${b.desc}</span><span class="st">${w ? `🏆 ${w} victoire${w > 1 ? 's' : ''}` : 'Pas encore battu'}</span></button>`; }).join('')}</div></section>
      <section class="part"><div class="part-head"><h2>🌿 La plus longue chaîne</h2></div>
        <div class="book">${CHAINS.map((n) => `<button type="button" class="page" data-chain="${n}"><span class="ico">🔗</span><span class="nm">Grille 1 – ${n}</span><span class="rl">${S.d.rec[n] ? `Ton record : <b>${S.d.rec[n]}</b> nombres${S.d.bot[n] ? ` · robot : ${S.d.bot[n].length}` : ''}` : 'Enchaîne le plus de nombres possible'}</span><span class="st">${starStr(chainStars(n))}</span></button>`).join('')}</div></section>
      <details class="rules"><summary>📜 Les règles</summary>
        <ul><li>Les nombres de 1 à N sont dans la grille. Chacun son tour, on touche un nombre <b>libre</b>.</li>
        <li>Il doit être un <b>multiple</b> ou un <b>diviseur</b> du dernier nombre joué : après 12, on peut jouer 6 (12 = 6 × 2) ou 36 (36 = 12 × 3), mais pas 8.</li>
        <li>Le <b>premier nombre doit être pair</b>. Un nombre déjà joué ne revient jamais.</li>
        <li>Le joueur qui ne peut plus jouer a <b>perdu</b>.</li>
        <li>Un nombre interdit coûte un cœur ❤️ (3 cœurs).</li></ul></details>
      <p class="foot">Ta progression reste sur cet appareil.</p></div>`;
    app.querySelectorAll('[data-grid]').forEach((b) => b.addEventListener('click', () => { S.d.grid = Number(b.dataset.grid); S.save(); home(); }));
    app.querySelectorAll('[data-bot]').forEach((b) => b.addEventListener('click', () => { Snd.init(); S.d.intro = true; S.save(); startRobot(grid, Number(b.dataset.bot), true); }));
    app.querySelectorAll('[data-chain]').forEach((b) => b.addEventListener('click', () => { Snd.init(); S.d.intro = true; S.save(); startChain(Number(b.dataset.chain)); }));
    app.querySelector('[data-act="duel"]').addEventListener('click', () => { Snd.init(); duel(); });
  }

  /* =========================================================
     Solo : partie (robot ou chaîne)
     ========================================================= */
  function newGame(kind, N, o = {}) {
    return { kind, N, bot: o.bot, used: new Uint8Array(N + 1), chain: [], last: null, hearts: 3, turn: 'me', over: false, msg: o.msg || '', meFirst: o.meFirst };
  }
  function startRobot(N, bot, meFirst) {
    const b = BOTS[bot];
    G = newGame('robot', N, { bot, meFirst, msg: meFirst ? 'À toi de commencer : choisis un nombre <b>pair</b>.' : `${b.nom} commence…` });
    G.turn = meFirst ? 'me' : 'bot';
    render();
    if (!meFirst) setTimeout(botPlay, 800);
  }
  function startChain(N) {
    G = newGame('chain', N, { msg: 'Choisis ton premier nombre (n’importe lequel), puis enchaîne le plus de nombres possible.' });
    render();
    setTimeout(() => { if (G && G.kind === 'chain') botChain(N); }, 50); // calcule le record du robot pendant que l'élève réfléchit
  }
  function chainHtml() {
    if (!G.chain.length) return '<i class="dim">Aucun nombre pour l’instant.</i>';
    return G.chain.map((c, i) => `${i ? `<span class="lk">${relTag(G.chain[i - 1].n, c.n)}</span>` : ''}<span class="nb ${c.who}">${c.n}</span>`).join('');
  }
  function render() {
    const g = G, b = g.kind === 'robot' ? BOTS[g.bot] : null;
    const myTurn = g.turn === 'me' && !g.over;
    const cells = Array.from({ length: g.N }, (_, i) => {
      const n = i + 1, u = g.used[n], who = u ? (g.chain.find((c) => c.n === n) || {}).who : '';
      return `<button type="button" class="cell${u ? ` used ${who}` : ''}${n === g.last ? ' last' : ''}" data-n="${n}" ${u || !myTurn ? 'disabled' : ''}>${n}</button>`;
    }).join('');
    const turnTxt = g.over ? 'Partie terminée' : g.kind === 'chain' ? (g.last === null ? 'Premier nombre : au choix' : 'Un multiple ou un diviseur de…') : myTurn ? (g.last === null ? 'À toi : un nombre pair' : 'À toi : un multiple ou un diviseur de…') : `${b.ico} ${b.nom} réfléchit…`;
    app.innerHTML = `<div class="screen play">
      <div class="hud"><button type="button" class="quit" data-act="quit" aria-label="Arrêter">✕</button>
        <span class="zn">${b ? `${b.ico} Contre ${b.nom}` : '🔗 La plus longue chaîne'} · 1 – ${g.N}</span>
        <span class="hearts" aria-label="${g.hearts} cœurs">${'❤️'.repeat(g.hearts)}${'🤍'.repeat(3 - g.hearts)}</span></div>
      <div class="board">
        <div class="main">
          <div class="lastrow"><div class="lastbox"><span class="lbl">Dernier nombre</span><span class="big">${g.last ?? '—'}</span></div>
            <div class="turn${myTurn ? '' : ' wait'}">${turnTxt}${g.kind === 'chain' ? `<span class="count">Chaîne : <b>${g.chain.length}</b>${S.d.rec[g.N] ? ` · record ${S.d.rec[g.N]}` : ''}</span>` : ''}</div></div>
          <div class="grid" style="--cols:${cols(g.N)}">${cells}</div>
        </div>
        <div class="side"><div class="msg">${g.msg}</div>
          <div class="chainbox"><p class="kicker">La chaîne</p><div class="chain">${chainHtml()}</div></div>
          ${g.kind === 'chain' && !g.over && g.chain.length ? '<button type="button" class="btn ghost" data-act="stop">✋ Je m’arrête là</button>' : ''}
          <div class="endbox"></div></div>
      </div></div>`;
    app.querySelector('[data-act="quit"]').addEventListener('click', () => { if (g.over || !g.chain.length || confirm('Arrêter la partie et revenir au jardin ?')) home(); });
    app.querySelectorAll('.cell').forEach((c) => U.tap(c, () => { if (!c.disabled) tapMe(Number(c.dataset.n)); }));
    const st = app.querySelector('[data-act="stop"]'); if (st) st.addEventListener('click', () => endChain('Tu t’es arrêté.'));
    const ch = app.querySelector('.chain'); if (ch) ch.scrollTop = ch.scrollHeight;
    if (g.over) app.querySelector('.endbox').innerHTML = g.endHtml || '';
    bindEnd();
  }
  function play(n, who) {
    G.used[n] = 1; G.chain.push({ n, who }); G.last = n;
  }
  function tapMe(n) {
    const g = G;
    if (!g || g.over || g.turn !== 'me' || g.used[n]) return;
    const free = g.kind === 'chain';
    if (g.last === null && !free && n % 2) { Snd.bad(); g.msg = `<div class="explain">${ODD_MSG}</div>`; render(); return; }
    if (g.last !== null && !linked(n, g.last)) {
      g.hearts--; Snd.bad();
      g.msg = `<div class="explain">💔 ${whyNot(g.last, n)}</div>`;
      if (g.hearts <= 0) { if (g.kind === 'robot') endRobot(false, 'Plus de cœurs : trois nombres interdits.'); else endChain('Plus de cœurs.'); return; }
      render();
      app.querySelector('.board').classList.add('shake');
      return;
    }
    const prev = g.last;
    play(n, 'me'); Snd.good(Math.min(g.chain.length, 10));
    g.msg = `<div class="explain good">✔ ${prev === null ? `Premier nombre : <b>${n}</b>.` : `${relText(prev, n)}.`}</div>`;
    if (g.kind === 'chain') {
      if (!moves(n, g.used, g.N).length) { endChain(`Plus aucun coup après ${n}. ${deadText(n, g.N)}`); return; }
      render(); return;
    }
    if (!moves(n, g.used, g.N).length) { endRobot(true, `${BOTS[g.bot].nom} est bloqué après ${n}. ${deadText(n, g.N)}`); return; }
    g.turn = 'bot'; render();
    setTimeout(botPlay, 700 + Math.random() * 500);
  }
  function botPlay() {
    const g = G;
    if (!g || g !== G || g.over || g.kind !== 'robot') return;
    const prev = g.last, m = aiMove(prev, g.used, g.N, g.bot), b = BOTS[g.bot];
    if (m === null) { endRobot(true, `${b.nom} ne peut plus jouer.`); return; }
    play(m, 'bot'); Snd.leaf();
    const said = `<div class="explain bot">${b.ico} ${b.nom} joue ${prev === null ? `<b>${m}</b>.` : `${relShort(prev, m)}.`}</div>`;
    if (!moves(m, g.used, g.N).length) { g.msg = said; endRobot(false, `Plus aucun coup après ${m}. ${deadText(m, g.N)}`); return; }
    g.turn = 'me'; g.msg = said; render();
  }
  function endRobot(won, why) {
    const g = G, b = BOTS[g.bot];
    g.over = true; g.turn = null;
    if (won) { const k = `${g.N}-${g.bot}`; S.d.wins[k] = (S.d.wins[k] || 0) + 1; S.save(); Snd.win(); U.confetti(80, ['#6ee7a0', '#f5c542', '#fff', '#9be15d']); }
    else Snd.lose();
    g.endHtml = `<div class="endcard ${won ? 'won' : 'lost'}"><p class="big2">${won ? `🏆 Tu as battu ${b.nom} !` : `${b.ico} ${b.nom} a gagné`}</p><p>${why}</p>
      <div class="row"><button type="button" class="btn go" data-end="again">↻ Revanche${g.meFirst ? ` (${b.nom} commence)` : ' (tu commences)'}</button><button type="button" class="btn ghost" data-end="home">← Jardin</button></div></div>`;
    render();
  }
  function endChain(why) {
    const g = G, len = g.chain.length, N = g.N;
    g.over = true; g.turn = null;
    const old = S.d.rec[N] || 0;
    if (len > old) { S.d.rec[N] = len; S.save(); }
    const bot = botChain(N), now =len >= bot.length ? 3 : len >= Math.ceil(bot.length * 0.8) ? 2 : len ? 1 : 0;
    Snd.win(); if (now >= 2) U.confetti(now * 25, ['#6ee7a0', '#f5c542', '#fff']);
    g.endHtml = `<div class="endcard ${now === 3 ? 'won' : ''}"><p class="big2">Chaîne de ${len} nombre${len > 1 ? 's' : ''}</p>
      <div class="stars">${[0, 1, 2].map((i) => `<span class="${i < now ? 'on' : ''}" style="animation-delay:${0.2 + i * 0.2}s">★</span>`).join('')}</div>
      <p>${why}</p>${len > old && old ? `<p class="newrec">Nouveau record ! (avant : ${old})</p>` : ''}
      <p class="dim">Meilleure chaîne trouvée par le robot (${bot.length}) : ${bot.join(' → ')}${len > bot.length ? '<br><b>Tu as battu le robot !</b>' : ''}</p>
      <p class="dim small">Astuce : les grands nombres premiers ne se relient qu’à 1, et 1 ne sert qu’une fois. Combien peut-il y en avoir dans une chaîne ?</p>
      <div class="row"><button type="button" class="btn go" data-end="chain">↻ Rejouer</button><button type="button" class="btn ghost" data-end="home">← Jardin</button></div></div>`;
    render();
  }
  function bindEnd() {
    if (!G || !G.over) return;
    const g = G;
    app.querySelectorAll('[data-end]').forEach((x) => x.addEventListener('click', () => {
      const a = x.dataset.end;
      if (a === 'home') home();
      else if (a === 'again') startRobot(g.N, g.bot, !g.meFirst);
      else if (a === 'chain') startChain(g.N);
    }));
  }

  /* =========================================================
     DUEL (tour par tour, moteur commun)
     ========================================================= */
  const DLV = [{ id: 'a', nom: 'Apprenti', desc: '3 cœurs : 3 erreurs permises' }, { id: 'e', nom: 'Expert', desc: 'Une erreur et c’est perdu (règle officielle)' }];
  const DMODES = [
    { id: '20', nom: 'Jardin 1 – 20', desc: 'Pour découvrir' },
    { id: '40', nom: 'Forêt 1 – 40', desc: 'La partie classique' },
    { id: '60', nom: 'Jungle 1 – 60', desc: 'Pour les experts' },
  ];
  function duel() {
    window.Moteur.match({ jeu: 'juniper-5e', titre: 'Juniper Green', niveauScolaire: 'cinquième', theme: 'juniper', icone: '🌲', sound: Snd, niveaux: DLV, modes: DMODES, quitter: home,
      start: (ctx) => duelGame(ctx) });
  }
  function duelGame(ctx) {
    const N = Number(ctx.mode) || 40, used = new Uint8Array(N + 1), chain = [];
    const hearts = ctx.P.map((p) => (p.niveau === 'e' ? 1 : 3)), max = hearts.slice(), errs = [0, 0];
    let last = null, turn = Math.random() < 0.5 ? 0 : 1, log = `${esc(ctx.P[turn].nom)} commence : un nombre <b>pair</b>.`, done = false;
    ctx.P.forEach((p) => {
      p.el.innerHTML = `<div class="jz"><div class="jhead"><span class="pn">${p.k === 0 ? '🟢' : '🟣'} ${esc(p.nom)}</span><span class="hearts"></span></div>
        <div class="jtop"><div class="lastbox"><span class="lbl">Dernier</span><span class="big"></span></div><p class="m-turnmsg"></p></div>
        <div class="grid" style="--cols:${cols(N)}"></div><div class="jlog"></div></div>`;
    });
    function show() {
      ctx.turn(turn);
      ctx.P.forEach((p) => {
        const mine = turn === p.k && !done;
        p.el.querySelector('.hearts').textContent = '❤️'.repeat(hearts[p.k]) + '🤍'.repeat(max[p.k] - hearts[p.k]);
        p.el.querySelector('.big').textContent = last ?? '—';
        p.el.querySelector('.m-turnmsg').textContent = mine ? (last === null ? 'À toi : un nombre pair' : `À toi : multiple ou diviseur de ${last}`) : `Au tour de ${ctx.P[1 - p.k].nom}…`;
        const gr = p.el.querySelector('.grid');
        gr.innerHTML = Array.from({ length: N }, (_, i) => {
          const n = i + 1, c = chain.find((x) => x.n === n);
          return `<button type="button" class="cell${c ? ` used p${c.k}` : ''}${n === last ? ' last' : ''}" data-n="${n}" ${c || !mine ? 'disabled' : ''}>${n}</button>`;
        }).join('');
        gr.querySelectorAll('.cell').forEach((c) => U.tap(c, () => { if (!c.disabled) tap(p.k, Number(c.dataset.n)); }));
        p.el.querySelector('.jlog').innerHTML = log;
      });
    }
    function tap(k, n) {
      if (done || turn !== k || used[n]) return;
      const nm = esc(ctx.P[k].nom);
      if (last === null && n % 2) { Snd.bad(); log = ODD_MSG; show(); return; }
      if (last !== null && !linked(n, last)) {
        hearts[k]--; errs[k]++; Snd.bad();
        log = `💔 ${nm} : ${whyNot(last, n)}`;
        if (hearts[k] <= 0) { finish(1 - k, `${nm} n’a plus de cœur : ${whyNot(last, n)}`); return; }
        show(); return;
      }
      const prev = last;
      used[n] = 1; chain.push({ n, k }); last = n; Snd.good(Math.min(chain.length, 10));
      log = `${nm} joue ${prev === null ? `<b>${n}</b>.` : `${relShort(prev, n)}.`}`;
      if (!moves(n, used, N).length) { finish(k, `${esc(ctx.P[1 - k].nom)} est bloqué après ${n}. ${deadText(n, N)}`); return; }
      turn = 1 - k; show();
    }
    function finish(w, why) {
      done = true;
      const coups = [0, 1].map((k) => chain.filter((c) => c.k === k).length);
      const path = chain.map((c, i) => `${i ? `<span class="lk">${relTag(chain[i - 1].n, c.n)}</span>` : ''}<span class="nb p${c.k}">${c.n}</span>`).join('');
      ctx.end({ winner: w,
        score: [0, 1].map((k) => `${k === w ? 'gagné' : 'perdu'} (${coups[k]} coups, ${errs[k]} erreur${errs[k] > 1 ? 's' : ''})`),
        stats: [0, 1].map((k) => ({ grille: N, coups: coups[k], erreurs: errs[k] })),
        text: [0, 1].map(() => `<p>${why}</p><p class="m-kick">La chaîne (${chain.length} nombres)</p><div class="chain">${path}</div>`) });
    }
    show();
  }

  window.__juniper = { linked, moves, aiMove, botChain, relText, whyNot, deadText };
  home();
})();
