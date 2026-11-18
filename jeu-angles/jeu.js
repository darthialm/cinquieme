/* =========================================================
   Z OU F ? — jeu du chapitre Angles de 5e : reconnaître les angles alternes-internes (le Z)
   et les angles correspondants (le F), puis s'en servir avec des parallèles.
   Les figures sont tirées au hasard : deux droites (d) et (d'), une sécante, parfois tournées, presque
   parallèles, ou cachées parmi d'autres droites. À chaque bonne réponse, le Z ou le F se dessine.
   À chaque erreur : un cœur en moins et l'explication avec les critères du cours (intérieur / extérieur
   de la bande, même côté / de part et d'autre de la sécante, sommets différents), la bande colorée.
   7 missions progressives puis le mode Survie. Étoiles et records sur l'appareil (localStorage).
   Adresse avec ?tout : toutes les missions sont ouvertes (pour le professeur).
   ========================================================= */
(function () {
  'use strict';

  const rand = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const app = document.getElementById('app');
  const now = () => performance.now();

  const KEY = 'u5e-z-ou-f';
  const save = (() => { try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { return {}; } })();
  save.stars = save.stars || {}; save.best = save.best || {};
  const persist = () => { try { localStorage.setItem(KEY, JSON.stringify(save)); } catch (e) { /* stockage indisponible */ } };
  const ALL_OPEN = /[?&]tout\b/.test(location.search);

  /* ---------- Sons synthétisés ---------- */
  const Snd = {
    ctx: null,
    get on() { return !save.mute; },
    init() { if (!this.ctx) { try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { /* pas de son */ } } if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); },
    tone(f, d, type = 'triangle', vol = 0.07, f2 = 0, delay = 0) {
      if (!this.on || !this.ctx) return;
      const c = this.ctx, t = c.currentTime + delay, o = c.createOscillator(), g = c.createGain();
      o.type = type; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
      g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(g).connect(c.destination); o.start(t); o.stop(t + d + 0.02);
    },
    tick() { this.tone(1200, 0.03, 'square', 0.025); },
    sel() { this.tone(880, 0.05, 'triangle', 0.05); },
    good(combo = 0) { const b = 520 * Math.pow(1.06, Math.min(combo, 10)); [1, 1.26, 1.5].forEach((k, i) => this.tone(b * k, 0.12, 'triangle', 0.08, 0, i * 0.07)); this.tone(b * 4, 0.35, 'sine', 0.03, b * 2, 0.05); },
    bad() { this.tone(180, 0.3, 'sawtooth', 0.07, 90); },
    win() { [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => this.tone(f, 0.2, 'triangle', 0.08, 0, i * 0.11)); },
    lose() { [392, 330, 262, 196].forEach((f, i) => this.tone(f, 0.3, 'sawtooth', 0.05, 0, i * 0.18)); },
  };
  const muteBtn = document.getElementById('mute');
  const syncMute = () => { muteBtn.textContent = save.mute ? '🔇' : '🔊'; muteBtn.setAttribute('aria-label', save.mute ? 'Remettre le son' : 'Couper le son'); };
  muteBtn.addEventListener('click', () => { save.mute = !save.mute; persist(); syncMute(); Snd.init(); });
  syncMute();
  document.addEventListener('pointerdown', () => Snd.init(), { once: true });

  /* =========================================================
     Géométrie : deux droites (d), (d') coupées par une sécante
     Repère de l'écran 600 × 400, angles en degrés comptés dans le sens inverse des aiguilles d'une montre.
     ========================================================= */
  const D2R = Math.PI / 180, W = 600, H = 400;
  const dir = (a) => ({ x: Math.cos(a * D2R), y: -Math.sin(a * D2R) });
  const add = (P, v, k) => ({ x: P.x + v.x * k, y: P.y + v.y * k });
  const norm = (a) => ((a % 360) + 360) % 360;
  const same = (a, b) => Math.abs((((a - b) % 360) + 540) % 360 - 180) < 0.5;
  const fx = (n) => n.toFixed(1);
  const inView = (p, m = 12) => p.x > m && p.x < W - m && p.y > m && p.y < H - m;
  const distLine = (X, V, a) => { const u = dir(a); return Math.abs(u.x * (X.y - V.y) - u.y * (X.x - V.x)); };
  function inter(P1, a1, P2, a2) {
    const u = dir(a1), v = dir(a2), den = u.x * v.y - u.y * v.x;
    if (Math.abs(den) < 1e-6) return null;
    const t = ((P2.x - P1.x) * v.y - (P2.y - P1.y) * v.x) / den;
    return add(P1, u, t);
  }

  /** Les 4 angles autour du sommet vi (0 : sur (d), 1 : sur (d')) */
  function sectors(F, vi) {
    const V = F.V[vi], a = F.a[vi], th = F.th;
    const rays = [{ a: norm(a), k: 'd' }, { a: norm(a + 180), k: 'd' }, { a: norm(th), k: 's' }, { a: norm(th + 180), k: 's' }].sort((x, y) => x.a - y.a);
    const toward = norm(vi === 0 ? th : th + 180);
    return rays.map((r, i) => {
      const n = rays[(i + 1) % 4], a0 = r.a;
      let a1 = n.a; if (a1 <= a0) a1 += 360;
      const dR = r.k === 'd' ? r.a : n.a, sR = r.k === 's' ? r.a : n.a;
      return { id: vi * 4 + i, v: vi, V, a0, a1, mid: (a0 + a1) / 2, span: Math.round(a1 - a0), dR, sR, inside: same(sR, toward), side: Math.sin((dR - th) * D2R) > 0 ? 1 : -1 };
    });
  }

  /** Figure au hasard. o = { rot, tilt, nonPar, delta, extra, showSec } */
  function makeFig(o = {}) {
    for (let t = 0; t < 400; t++) {
      const a1 = o.rot ? rand(0, 179) : o.tilt ? rand(-25, 25) : 0;
      const m = rand(40, 140); if (Math.abs(m - 90) < 12) continue;
      const th = a1 + m;
      const dl = o.delta !== undefined ? o.delta : o.nonPar ? pick([-1, 1]) * rand(7, 14) : 0;
      const a2 = a1 + dl, m2 = m - dl; if (m2 < 30 || m2 > 150) continue;
      const dist = rand(130, 160), C = { x: 300 + rand(-30, 30), y: 200 + rand(-10, 10) }, u = dir(th);
      const F = { a: [a1, a2], th, V: [add(C, u, -dist / 2), add(C, u, dist / 2)], dist, showSec: !!o.showSec, extra: [] };
      F.sec = [...sectors(F, 0), ...sectors(F, 1)];
      if (o.extra && !addExtra(F, o.extra)) continue;
      return F;
    }
    return makeFig({});
  }
  /** Droites en plus (figures pièges) : « tri » = un triangle avec la sécante, « cross » = une deuxième sécante */
  function addExtra(F, kind) {
    const kinds = kind === 'both' ? ['tri', 'cross'] : [kind];
    for (const k of kinds) {
      let ok = false;
      for (let t = 0; t < 60 && !ok; t++) {
        let V, a;
        if (k === 'tri') {
          const vi = rand(0, 1), A = add(F.V[vi], dir(vi === 0 ? F.th + 180 : F.th), rand(80, 125));
          if (!inView(A, 30)) continue;
          V = A; a = F.th + pick([-1, 1]) * rand(28, 60);
        } else {
          const R = add(F.V[0], dir(F.a[0]), pick([-1, 1]) * rand(130, 210)), S = add(F.V[1], dir(F.a[1]), pick([-1, 1]) * rand(60, 230));
          if (!inView(R, 25) || !inView(S, 25) || Math.hypot(R.x - S.x, R.y - S.y) < 70) continue;
          V = R; a = Math.atan2(-(S.y - R.y), S.x - R.x) / D2R;
          if (Math.abs(Math.sin((a - F.th) * D2R)) < 0.3) continue;
        }
        const I0 = inter(V, a, F.V[0], F.a[0]), I1 = inter(V, a, F.V[1], F.a[1]);
        if (!I0 || !I1 || !inView(I0, 15) || !inView(I1, 15)) continue;
        if (F.V.some((P) => distLine(P, V, a) < 45)) continue;
        if (Math.hypot(I0.x - I1.x, I0.y - I1.y) < 50) continue;
        F.extra.push({ V, a }); ok = true;
      }
      if (!ok) return false;
    }
    return true;
  }

  /* ---------- Classer deux angles (critères du cours) ---------- */
  function cat(A, B) {
    if (A.v === B.v) return 'meme';
    if (A.inside && B.inside) return A.side !== B.side ? 'ai' : 'in-same';
    if (A.side === B.side) return A.inside !== B.inside ? 'co' : 'out-same';
    return A.inside !== B.inside ? 'mixed-opp' : 'out-opp';
  }
  const WHY = {
    ai: 'tous les deux à l’<b>intérieur</b> de la bande, <b>de part et d’autre</b> de la sécante, sans sommet commun : ils sont <b>alternes-internes</b> (le Z).',
    co: 'du <b>même côté</b> de la sécante, l’un à l’<b>intérieur</b> et l’autre à l’<b>extérieur</b> de la bande, sans sommet commun : ils sont <b>correspondants</b> (le F).',
    'in-same': 'tous les deux à l’intérieur de la bande, mais du <b>même côté</b> de la sécante : pas alternes-internes (il en faut un de chaque côté), ni correspondants (il en faudrait un à l’extérieur).',
    'out-same': 'du même côté de la sécante, mais tous les deux à l’<b>extérieur</b> de la bande : pour être correspondants, il en faut un à l’intérieur.',
    'out-opp': 'tous les deux à l’<b>extérieur</b> de la bande, de part et d’autre de la sécante : ni alternes-internes (il faut être à l’intérieur), ni correspondants (il faut être du même côté).',
    'mixed-opp': 'de part et d’autre de la sécante, avec un seul angle à l’intérieur de la bande : ni alternes-internes (il faut les deux à l’intérieur), ni correspondants (il faut le même côté).',
  };
  function why(A, B) {
    const c = cat(A, B);
    if (c === 'meme') return `Ces deux angles ont le <b>même sommet</b> (ils sont ${same(A.mid, B.mid + 180) ? 'opposés par le sommet' : 'adjacents'}) : ni alternes-internes, ni correspondants.`;
    return 'Ces deux angles sont ' + WHY[c];
  }
  const NAME = { ai: 'alternes-internes', co: 'correspondants' };
  const allPairs = (F) => { const out = []; for (let i = 0; i < 8; i++) for (let j = i + 1; j < 8; j++) out.push([F.sec[i], F.sec[j]]); return out; };
  function pickPair(F, cats) {
    const c = allPairs(F).filter(([A, B]) => cats.includes(cat(A, B)));
    const p = pick(c);
    return Math.random() < 0.5 ? p : [p[1], p[0]];
  }

  /* ---------- Dessin ---------- */
  function wedge(S, r) {
    const p0 = add(S.V, dir(S.a0), r), p1 = add(S.V, dir(S.a1), r);
    return `M${fx(S.V.x)} ${fx(S.V.y)} L${fx(p0.x)} ${fx(p0.y)} A${r} ${r} 0 0 0 ${fx(p1.x)} ${fx(p1.y)} Z`;
  }
  function lineEl(V, a, cls) {
    const p = add(V, dir(a), -900), q = add(V, dir(a), 900);
    const c = `x1="${fx(p.x)}" y1="${fx(p.y)}" x2="${fx(q.x)}" y2="${fx(q.y)}"`;
    return `<line ${c} class="ln halo ${cls}"/><line ${c} class="ln ${cls}"/>`;
  }
  function labelAt(V, a, txt, cls = '') {
    for (let k = 270; k >= 60; k -= 10) for (const s of [1, -1]) {
      const p = add(add(V, dir(a), s * k), dir(a + 90), 16);
      if (p.x > 34 && p.x < W - 34 && p.y > 22 && p.y < H - 12) return `<text x="${fx(p.x)}" y="${fx(p.y)}" text-anchor="middle" class="lbl ${cls}">${txt}</text>`;
    }
    return '';
  }
  function shapePath(A, B) {
    const c = cat(A, B), L = 120, P = (p) => `${fx(p.x)} ${fx(p.y)}`;
    if (c === 'ai') return `M${P(add(A.V, dir(A.dR), L))} L${P(A.V)} L${P(B.V)} L${P(add(B.V, dir(B.dR), L))}`;
    if (c === 'co') {
      const out = A.inside ? B : A, inn = A.inside ? A : B;
      return `M${P(add(out.V, dir(out.sR), 75))} L${P(add(inn.V, dir(inn.sR + 180), 25))} M${P(out.V)} L${P(add(out.V, dir(out.dR), L))} M${P(inn.V)} L${P(add(inn.V, dir(inn.dR), L))}`;
    }
    return '';
  }
  /** o = { marks:[{s,cls}], meas:[{s,txt,cls}], shapes:[{A,B,cls,anim}], band, hits } */
  function figSVG(F, o = {}) {
    let h = `<svg class="fig" viewBox="0 0 ${W} ${H}" role="img" aria-label="Deux droites coupées par une sécante">`;
    if (o.band) {
      const [P, Q] = F.V, pts = [add(P, dir(F.a[0]), -700), add(P, dir(F.a[0]), 700), add(Q, dir(F.a[1]), 700), add(Q, dir(F.a[1]), -700)];
      h += `<polygon class="band" points="${pts.map((p) => `${fx(p.x)},${fx(p.y)}`).join(' ')}"/>`;
    }
    F.extra.forEach((e) => { h += lineEl(e.V, e.a, F.showSec ? 'ex' : 'neutral'); });
    h += lineEl(F.V[0], F.a[0], F.showSec ? '' : 'neutral') + lineEl(F.V[1], F.a[1], F.showSec ? '' : 'neutral');
    h += lineEl(F.V[0], F.th, F.showSec ? 's' : 'neutral');
    h += labelAt(F.V[0], F.a[0], '(d)') + labelAt(F.V[1], F.a[1], '(d’)') + (F.showSec ? labelAt(F.V[0], F.th, 'sécante', 's') : '');
    (o.marks || []).forEach((m) => { h += `<path d="${wedge(m.s, 38)}" class="mk ${m.cls}"/>`; });
    (o.shapes || []).forEach((s) => { h += `<path d="${shapePath(s.A, s.B)}" class="shape ${s.cls}${s.anim ? ' anim' : ''}" pathLength="1"/>`; });
    F.V.forEach((V) => { h += `<circle cx="${fx(V.x)}" cy="${fx(V.y)}" r="4" class="dot"/>`; });
    (o.meas || []).forEach((m) => { const p = add(m.s.V, dir(m.s.mid), 56); h += `<text x="${fx(p.x)}" y="${fx(p.y)}" text-anchor="middle" dominant-baseline="middle" class="meas ${m.cls}">${m.txt}</text>`; });
    if (o.hits) { const r = Math.min(62, F.dist * 0.44); F.sec.forEach((s) => { if (!o.hits.has || o.hits.has(s.id)) h += `<path d="${wedge(s, r)}" class="hit" data-id="${s.id}"><title>Angle</title></path>`; }); }
    return h + '</svg>';
  }

  /* =========================================================
     Les manches
     ========================================================= */
  const OTHERS = ['in-same', 'out-opp', 'out-same', 'mixed-opp', 'meme'];
  const focusCat = (fallback) => { if (G && G.focusN > 0 && Math.random() < 0.6) { G.focusN--; return G.focus; } return fallback; };

  function mkYN(target, o) {
    const F = makeFig(o);
    const miss = target === 'ai' ? ['co', 'in-same', 'out-opp', 'mixed-opp', 'meme'] : ['ai', 'out-same', 'in-same', 'mixed-opp', 'meme'];
    let c = focusCat(Math.random() < 0.5 ? target : pick(miss));
    const [A, B] = pickPair(F, [c]);
    c = cat(A, B);
    return { F, mode: 'choice', A, B, cat: c, options: ['Oui', 'Non'], answer: c === target ? 'Oui' : 'Non',
      prompt: `Les angles <span class="a">orange</span> et <span class="b">vert</span> sont-ils <span class="hl">${NAME[target]}</span> ?` };
  }
  function mkChoice(o) {
    const F = makeFig(o);
    const r = Math.random();
    const [A, B] = pickPair(F, [focusCat(r < 0.37 ? 'ai' : r < 0.75 ? 'co' : pick(OTHERS))]);
    const c = cat(A, B);
    return { F, mode: 'choice', A, B, cat: c, options: ['Alternes-internes', 'Correspondants', 'Ni l’un ni l’autre'],
      answer: c === 'ai' ? 'Alternes-internes' : c === 'co' ? 'Correspondants' : 'Ni l’un ni l’autre',
      prompt: 'Les angles <span class="a">orange</span> et <span class="b">vert</span> sont…' };
  }
  function mkClick(o) {
    const F = makeFig(o), target = Math.random() < 0.5 ? 'ai' : 'co';
    const A = pick(F.sec.filter((s) => target === 'co' || s.inside));
    const B = F.sec.find((s) => cat(A, s) === target);
    return { F, mode: 'click', A, B, cat: target, prompt: `Touche l’angle <span class="hl">${target === 'ai' ? 'alterne-interne' : 'correspondant'}</span> à l’angle <span class="a">orange</span>.` };
  }
  function mkPairs(target, o) {
    const F = makeFig(o);
    return { F, mode: 'pairs', cat: target, need: target === 'ai' ? 2 : 4, found: [], sel: null, time: target === 'ai' ? 24 : 40,
      prompt: `Trouve les <span class="hl">${target === 'ai' ? '2 couples d’angles alternes-internes' : '4 couples d’angles correspondants'}</span> : touche les deux angles de chaque couple.` };
  }
  function mkJuge(o = {}) {
    const target = Math.random() < 0.5 ? 'ai' : 'co';
    if (Math.random() < 0.55) {
      const equal = Math.random() < 0.55;
      const F = makeFig({ rot: true, delta: equal ? 0 : pick([-1, 1]) * rand(2, 5), extra: o.extra });
      const [A, B] = pickPair(F, [target]);
      return { F, mode: 'choice', A, B, cat: target, juge: 'par', meas: true,
        options: ['Oui : alternes-internes égaux', 'Oui : correspondants égaux', 'Non : les angles ne sont pas égaux'],
        answer: !equal ? 'Non : les angles ne sont pas égaux' : target === 'ai' ? 'Oui : alternes-internes égaux' : 'Oui : correspondants égaux',
        prompt: 'Les droites (d) et (d’) sont-elles <span class="hl">parallèles</span> ?' };
    }
    const F = makeFig({ rot: true, extra: o.extra });
    const [A, B] = pickPair(F, [target]);
    const m = A.span, alt = new Set([m, 180 - m]);
    while (alt.size < 3) { const x = m + pick([-20, -10, 10, 20]); if (x > 0 && x < 180) alt.add(x); }
    return { F, mode: 'choice', A, B, cat: target, juge: 'calc', meas: true, options: shuffle([...alt].map((x) => x + '°')), answer: m + '°', m,
      prompt: '(d) et (d’) sont <span class="hl">parallèles</span>. Combien mesure l’angle <span class="b">vert</span> ?' };
  }

  /* =========================================================
     Les missions (elles suivent le cours)
     ========================================================= */
  const R_AI = '<b>Alternes-internes</b> : deux angles<ul><li>à l’<b>intérieur</b> de la bande formée par (d) et (d’) ;</li><li>de part et d’autre de la <b>sécante</b> ;</li><li>sans sommet commun.</li></ul>';
  const R_CO = '<b>Correspondants</b> : deux angles<ul><li>du <b>même côté</b> de la sécante ;</li><li>l’un à l’<b>intérieur</b>, l’autre à l’<b>extérieur</b> de la bande ;</li><li>sans sommet commun.</li></ul>';
  const R_NB = 'Deux droites et une sécante forment <b>2</b> couples d’angles alternes-internes et <b>4</b> couples d’angles correspondants.';
  const R_P1 = '<b>Propriété 1 :</b> si deux droites sont <b>parallèles</b>, alors elles forment des angles alternes-internes <b>égaux</b> et des angles correspondants <b>égaux</b>.';
  const R_P2 = '<b>Propriété 2 (réciproque) :</b> si deux droites forment deux angles alternes-internes <b>égaux</b> (ou deux angles correspondants égaux), alors elles sont <b>parallèles</b>. Si les angles ne sont pas égaux, les droites ne sont pas parallèles.';

  const MISSIONS = [
    { id: 'm1', icon: '⚡', name: 'Le Z', tag: 'Alternes-internes', n: 8, time: 11, rules: [R_AI], ex: ['ai'], exOpts: { showSec: true },
      tip: 'Repère la <b>bande</b> entre (d) et (d’). Deux angles alternes-internes sont <b>dedans</b>, un de chaque côté de la sécante : ils dessinent un <b>Z</b> (parfois un Z à l’envers, comme un S ou un N).',
      gen: () => mkYN('ai', { showSec: true }) },
    { id: 'm2', icon: '🚩', name: 'Le F', tag: 'Correspondants', n: 8, time: 11, rules: [R_CO], ex: ['co'], exOpts: { showSec: true },
      tip: 'Deux angles correspondants sont à la <b>même place</b> à chaque croisement : même côté de la sécante, l’un dans la bande, l’autre dehors. Ils dessinent un <b>F</b> (parfois retourné).',
      gen: () => mkYN('co', { showSec: true }) },
    { id: 'm3', icon: '🔀', name: 'Z ou F ?', tag: 'Les deux à la fois', n: 10, time: 11, rules: [R_AI, R_CO], ex: ['ai', 'co'], exOpts: { showSec: true, tilt: true },
      tip: 'Pose-toi deux questions : <b>dedans ou dehors</b> de la bande ? <b>Même côté</b> de la sécante ou pas ? Et attention : deux angles au même sommet ne sont ni l’un ni l’autre !',
      gen: () => mkChoice({ showSec: true, tilt: true }) },
    { id: 'm4', icon: '🎯', name: 'Le jumeau', tag: 'Touche le bon angle', n: 10, time: 12, rules: [R_AI, R_CO], ex: ['co'], exOpts: { rot: true, showSec: true },
      tip: 'Les figures tournent dans tous les sens, et la sécante n’est bientôt plus en rose : <b>la sécante est la droite qui passe par les deux sommets</b>. Les droites n’ont pas besoin d’être parallèles pour parler d’alternes-internes ou de correspondants.',
      gen: (i) => mkClick({ rot: true, showSec: i < 4, nonPar: i >= 6 && Math.random() < 0.5 }) },
    { id: 'm5', icon: '🧩', name: 'Toutes les paires', tag: '2 couples Z, 4 couples F', n: 4, rules: [R_NB, R_AI, R_CO], ex: ['ai', 'co'], exOpts: { rot: true, showSec: true },
      tip: 'Chaque angle a <b>un seul</b> correspondant. Seuls les 4 angles de la bande ont un alterne-interne.',
      gen: (i) => mkPairs(i % 2 ? 'co' : 'ai', { rot: true, showSec: i < 2 }) },
    { id: 'm6', icon: '🕸️', name: 'Figures pièges', tag: 'Trouve la sécante', n: 10, time: 13, rules: [R_AI, R_CO], ex: ['co'], exOpts: { rot: true, extra: 'tri' },
      tip: 'D’autres droites s’invitent : triangles, deuxième sécante… Pour deux angles, <b>la sécante est la droite qui relie leurs deux sommets</b>, et les deux autres droites sont celles qui partent de ces sommets. Les autres droites ne comptent pas.',
      gen: () => mkChoice({ rot: true, nonPar: Math.random() < 0.4, extra: pick(['tri', 'cross', 'both']) }) },
    { id: 'm7', icon: '⚖️', name: 'Le Juge', tag: 'Propriétés 1 et 2', n: 8, time: 16, boss: true, rules: [R_P1, R_P2], ex: ['ai'], exOpts: { rot: true }, exMeas: true,
      tip: 'D’abord <b>reconnaître</b> (Z ou F ?), ensuite seulement utiliser la propriété. Méfie-toi des droites qui ont l’air parallèles : seuls les nombres comptent !',
      gen: (i) => mkJuge({ extra: i >= 4 && Math.random() < 0.5 ? 'cross' : undefined }) },
  ];
  const SURVIE = { id: 'inf', icon: '♾️', name: 'Survie', tag: 'Sans fin', n: Infinity, survie: true,
    gen: (i) => { const r = Math.random(); return r < 0.35 ? mkChoice({ rot: true, nonPar: Math.random() < 0.4, extra: i > 6 && Math.random() < 0.5 ? pick(['tri', 'cross']) : undefined })
      : r < 0.7 ? mkClick({ rot: true, nonPar: Math.random() < 0.4 }) : r < 0.85 ? mkYN(pick(['ai', 'co']), { rot: true }) : mkJuge(); } };
  const roundTime = (R) => {
    const M = G.M;
    if (R.time) return M.survie ? R.time * 0.8 : R.time;
    if (M.survie) return Math.max(5, 12 * (1 - G.i * 0.025)) + (R.juge ? 4 : 0);
    return M.time;
  };

  const unlocked = (i) => ALL_OPEN || i === 0 || (save.stars[MISSIONS[i - 1].id] || 0) > 0;
  const survieOpen = () => ALL_OPEN || (save.stars.m7 || 0) > 0;
  const starStr = (n) => '★'.repeat(n) + `<i>${'★'.repeat(3 - n)}</i>`;

  /* =========================================================
     Écrans
     ========================================================= */
  let G = null, raf = 0, nextT = 0;
  const stopLoop = () => { cancelAnimationFrame(raf); raf = 0; clearTimeout(nextT); };

  function home() {
    stopLoop(); G = null;
    const total = MISSIONS.reduce((s, z) => s + (save.stars[z.id] || 0), 0);
    const nextI = MISSIONS.findIndex((z, i) => unlocked(i) && !save.stars[z.id]);
    app.innerHTML = `<div class="screen">
      <h1 class="logo"><span class="z">Z</span><span class="o">ou</span><span class="f">F</span> ?</h1>
      <p class="tagline">Alternes-internes ou correspondants : deviens incollable. · <span class="total">⭐ ${total} / ${MISSIONS.length * 3}</span></p>
      <div class="mascot"><span class="face" aria-hidden="true">🦉</span><div class="bubble">${!save.intro
        ? 'Salut, moi c’est <b>Zéphyr</b> ! Quand une sécante coupe deux droites, elle fabrique 8 angles. Certains vont par deux : les <b>alternes-internes</b> dessinent un <b>Z</b>, les <b>correspondants</b> dessinent un <b>F</b>. Ton but : les reconnaître du premier coup d’œil, même quand je fais tourner les figures !'
        : pick(['Un Z, un F… ou rien du tout ? À toi de voir !', 'Astuce : cherche d’abord la <b>bande</b> entre les deux droites.', 'Le jumeau d’un angle, c’est son <b>correspondant</b> : même place, autre sommet.'])}</div></div>
      <div class="map">
        ${MISSIONS.map((z, i) => {
          const lock = !unlocked(i), st = save.stars[z.id] || 0;
          return `<button type="button" class="zone${z.boss ? ' boss' : ''}${lock ? ' locked' : ''}${i === nextI ? ' next' : ''}" data-z="${i}" ${lock ? 'disabled' : ''}>
            <span class="num">${i + 1}</span><span class="ico">${lock ? '🔒' : z.icon}</span><span class="nm">${z.name}</span><span class="rl">${z.tag}</span>
            <span class="st">${starStr(st)}</span>${save.best[z.id] ? `<span class="rec">Record : ${save.best[z.id]} pts</span>` : ''}</button>`;
        }).join('')}
        <button type="button" class="zone inf${survieOpen() ? '' : ' locked'}" data-z="inf" ${survieOpen() ? '' : 'disabled'}>
          <span class="ico">${survieOpen() ? SURVIE.icon : '🔒'}</span><span class="nm">Survie</span>
          <span class="rl">${survieOpen() ? 'Toutes les questions, de plus en plus vite' : 'S’ouvre après Le Juge'}</span>
          ${save.best.inf ? `<span class="rec">Record : ${save.best.inf} pts · ${save.bestN || 0} bonnes réponses</span>` : ''}</button>
      </div>
      <p class="foot">Une étoile ouvre la mission suivante. ⭐⭐⭐ = aucune erreur. Ta progression reste sur cet appareil.</p>
    </div>`;
    app.querySelectorAll('[data-z]').forEach((b) => b.addEventListener('click', () => {
      Snd.init(); save.intro = true; persist();
      brief(b.dataset.z === 'inf' ? SURVIE : MISSIONS[Number(b.dataset.z)]);
    }));
    app.scrollTop = 0;
  }

  function exampleFig(c, o, meas) {
    const F = makeFig(o), [A, B] = pickPair(F, [c]);
    return `<figure><figcaption>${c === 'ai' ? 'Alternes-internes : le <span style="color:var(--yellow)">Z</span>' : 'Correspondants : le <span style="color:var(--cyan)">F</span>'}</figcaption>
      ${figSVG(F, { band: true, marks: [{ s: A, cls: 'mkA' }, { s: B, cls: 'mkB' }], shapes: [{ A, B, cls: c === 'ai' ? 'shZ' : 'shF', anim: true }], meas: meas ? [{ s: A, txt: A.span + '°', cls: 'measA' }, { s: B, txt: B.span + '°', cls: 'measB' }] : [] })}</figure>`;
  }

  function brief(M) {
    const idx = MISSIONS.indexOf(M);
    app.innerHTML = `<div class="screen"><div class="card">
      <p class="kicker">${M.survie ? 'Mode Survie' : `Mission ${idx + 1} / ${MISSIONS.length} · ${M.tag}`}</p>
      <h1>${M.icon} ${M.name}</h1>
      ${M.survie ? '<div class="rule">Toutes les sortes de questions, mélangées. 3 cœurs, et le temps raccourcit à chaque question. Enchaîne les bonnes réponses pour faire monter ton <b>combo</b> !</div>'
        : `${M.rules.map((r) => `<div class="rule">${r}</div>`).join('')}
        <div class="figs">${M.ex.map((c) => exampleFig(c, M.exOpts, M.exMeas)).join('')}</div>`}
      <div class="mascot"><span class="face" aria-hidden="true">🦉</span><div class="bubble">${M.survie ? 'Jusqu’où iras-tu ? Mon record à moi, c’est… un secret.' : M.tip}</div></div>
      <p class="howto">${M.n === Infinity ? '' : M.id === 'm5' ? `${M.n} figures` : `${M.n} questions`}${M.survie ? '' : ', 3 cœurs.'} Une erreur ou un temps écoulé = un cœur en moins, et l’explication s’affiche. La partie <span style="color:rgba(63,227,255,.9)">bleutée</span> est la bande entre (d) et (d’).</p>
      <div class="row" style="margin-top:12px"><button type="button" class="btn ghost" data-act="back">← Carte</button><button type="button" class="btn go" data-act="go">▶ C’est parti</button></div>
    </div></div>`;
    app.querySelector('[data-act="back"]').addEventListener('click', home);
    app.querySelector('[data-act="go"]').addEventListener('click', () => start(M));
    app.querySelector('[data-act="go"]').focus();
    app.scrollTop = 0;
  }

  /* =========================================================
     La partie
     ========================================================= */
  function start(M) {
    G = { M, i: 0, hearts: 3, score: 0, combo: 0, errors: 0, res: [], focus: null, focusN: 0, R: null };
    nextRound();
  }
  const comboMult = () => (G.combo >= 3 ? Math.min(3, 1 + Math.floor(G.combo / 3) * 0.5) : 1);
  function hudHTML() {
    const M = G.M, mult = comboMult();
    const dots = M.survie ? `<span class="zn">✔ ${G.res.filter((r) => r === 'ok').length}</span>` : `<span class="dots">${Array.from({ length: M.n }, (_, i) => `<i class="${G.res[i] || (i === G.i ? 'cur' : '')}"></i>`).join('')}</span>`;
    return `<button type="button" class="quit" data-act="quit" aria-label="Abandonner et revenir à la carte">✕</button>
      <span class="zn">${M.icon} ${M.name}</span>${dots}
      <span class="hearts" aria-label="${G.hearts} cœurs">${[0, 1, 2].map((i) => `<span class="${i < G.hearts ? '' : 'lost'}">❤️</span>`).join('')}</span>
      <span class="combo">${mult > 1 ? `🔥 ×${String(mult).replace('.', ',')}` : G.combo >= 2 ? `🔥 ${G.combo}` : ''}</span>
      <span class="score">${G.score} pts</span>`;
  }
  function refreshHud() { const h = app.querySelector('.hud'); if (h) { h.innerHTML = hudHTML(); h.querySelector('[data-act="quit"]').addEventListener('click', quit); } }

  function nextRound() {
    const M = G.M;
    if (!M.survie && G.i >= M.n) { end(false); return; }
    const R = M.gen(G.i);
    R.view = { marks: [], shapes: [], meas: [], band: false };
    if (R.mode !== 'pairs') R.view.marks.push({ s: R.A, cls: 'mkA' });
    if (R.mode === 'choice') R.view.marks.push({ s: R.B, cls: 'mkB' });
    if (R.meas) R.view.meas = [{ s: R.A, txt: R.A.span + '°', cls: 'measA' }, { s: R.B, txt: R.juge === 'calc' ? '?' : R.B.span + '°', cls: 'measB' }];
    R.total = roundTime(R) * 1000; R.deadline = now() + R.total; R.lastTick = 99; R.phase = 'ask';
    G.R = R;
    app.innerHTML = `<div class="screen play">
      <div class="hud">${hudHTML()}</div>
      <div class="timer" id="timer"><i></i></div>
      <div class="stage" id="stage"></div>
      <div class="panel" id="panel"></div></div>`;
    app.querySelector('[data-act="quit"]').addEventListener('click', quit);
    drawStage(); drawPanel(); loop();
    app.scrollTop = 0;
  }

  function drawStage(extraHTML = '') {
    const R = G.R, st = document.getElementById('stage');
    const hits = R.phase === 'ask' && (R.mode === 'click' ? new Set(R.F.sec.filter((s) => s.id !== R.A.id).map((s) => s.id)) : R.mode === 'pairs' ? new Set(R.F.sec.map((s) => s.id)) : null);
    st.innerHTML = figSVG(R.F, { ...R.view, hits }) + extraHTML;
    st.querySelectorAll('.hit').forEach((p) => p.addEventListener('click', () => tapSector(R.F.sec[Number(p.dataset.id)])));
  }
  function drawPanel() {
    const R = G.R, p = document.getElementById('panel');
    if (R.mode === 'choice') {
      p.innerHTML = `<p class="ask">${R.prompt}</p><div class="choices">${R.options.map((o, i) => `<button type="button" class="ch" data-i="${i}"><kbd>${i + 1}</kbd>${o}</button>`).join('')}</div>`;
      p.querySelectorAll('.ch').forEach((b) => b.addEventListener('click', () => answer(R.options[b.dataset.i], b)));
    } else if (R.mode === 'click') {
      p.innerHTML = `<p class="ask">${R.prompt}</p>`;
    } else {
      p.innerHTML = `<p class="ask">${R.prompt}</p><p class="found">Trouvés : ${R.found.length} / ${R.need}</p><div id="pmsg"></div>`;
    }
  }

  /* ---------- Réponses ---------- */
  function answer(opt, btn) {
    const R = G.R;
    if (R.phase !== 'ask') return;
    if (opt === R.answer) { btn.classList.add('good'); success(); return; }
    btn.classList.add('bad');
    const ok = [...document.querySelectorAll('#panel .ch')].find((b) => R.options[b.dataset.i] === R.answer);
    if (ok) ok.classList.add('good');
    fail(explainChoice(R));
  }
  function explainChoice(R) {
    if (R.juge === 'par') {
      const eq = R.A.span === R.B.span;
      return eq ? `Les angles marqués sont <b>${NAME[R.cat]}</b> (le ${R.cat === 'ai' ? 'Z' : 'F'}) et égaux (${R.A.span}°).<br><b>Or</b> si deux angles ${NAME[R.cat]} sont égaux, alors les droites sont parallèles. <b>Donc</b> (d) // (d’).`
        : `Les angles sont ${NAME[R.cat]}, mais ${R.A.span}° ≠ ${R.B.span}° : ils ne sont <b>pas égaux</b>, donc (d) et (d’) ne sont <b>pas parallèles</b>… même si elles en ont l’air !`;
    }
    if (R.juge === 'calc') return `Les angles marqués sont <b>${NAME[R.cat]}</b> (le ${R.cat === 'ai' ? 'Z' : 'F'}) et (d) // (d’).<br><b>Or</b> si deux droites sont parallèles, alors les angles ${NAME[R.cat]} sont égaux. <b>Donc</b> l’angle vert mesure <b>${R.m}°</b>.`;
    return `<span class="t">C’était : ${R.answer === 'Oui' ? 'oui' : R.answer === 'Non' ? 'non' : R.answer.toLowerCase()}.</span> ${why(R.A, R.B)}`;
  }

  function tapSector(s) {
    const R = G.R;
    if (R.phase !== 'ask') return;
    if (R.mode === 'click') {
      if (s.id === R.B.id) { R.view.marks.push({ s, cls: 'mkB' }); success(); return; }
      R.view.marks.push({ s: R.B, cls: 'mkG' }, { s, cls: 'mkR' });
      fail(`<span class="t">Pas celui-là !</span> L’angle rouge et l’angle orange : ${why(R.A, s).replace(/^Ces deux angles sont /, '')}<br>Le bon angle (en vert) est ${WHY[R.cat]}`);
      return;
    }
    // chasse aux paires
    if (R.found.some(([a, b]) => a.id === s.id || b.id === s.id)) { Snd.sel(); return; } // angle déjà dans un couple trouvé
    if (!R.sel) { R.sel = s; Snd.sel(); paintPairs(); return; }
    if (R.sel.id === s.id) { R.sel = null; paintPairs(); return; }
    const A = R.sel, c = cat(A, s);
    R.sel = null;
    if (c === R.cat && !R.found.some(([a, b]) => (a.id === A.id && b.id === s.id) || (a.id === s.id && b.id === A.id))) {
      R.found.push([A, s]); G.combo++;
      Snd.good(G.combo);
      paintPairs(true);
      if (R.found.length === R.need) success();
      else document.getElementById('pmsg').innerHTML = `<div class="explain good">✅ ${R.cat === 'ai' ? 'Un Z' : 'Un F'} ! Encore ${R.need - R.found.length}.</div>`;
      return;
    }
    // erreur : un cœur en moins, mais on continue la même figure
    Snd.bad(); G.errors++; G.hearts--; G.combo = 0; refreshHud();
    const st = document.getElementById('stage'); st.classList.remove('ko'); void st.offsetWidth; st.classList.add('ko');
    const msg = c === R.cat ? 'Ce couple est déjà trouvé.' : `${why(A, s)}<br>${R.cat === 'ai' ? 'Il faut deux angles <b>dans la bande</b>, <b>de part et d’autre</b> de la sécante.' : 'Il faut deux angles du <b>même côté</b> de la sécante, <b>un dedans</b> et <b>un dehors</b> de la bande.'}`;
    R.view.band = true; // après une erreur, la bande reste colorée
    paintPairs();
    if (G.hearts <= 0) { R.phase = 'explain'; stopLoop(); G.res[G.i] = 'ko'; G.i++; showContinue(`<span class="t">Raté…</span> ${msg}`, true); return; }
    document.getElementById('pmsg').innerHTML = `<div class="explain"><span class="t">💔 Non :</span> ${msg}</div>`;
  }
  function paintPairs(animLast) {
    const R = G.R;
    R.view.marks = []; R.view.shapes = [];
    R.found.forEach(([A, B], k) => {
      R.view.marks.push({ s: A, cls: 'mkP' + k }, { s: B, cls: 'mkP' + k });
      R.view.shapes.push({ A, B, cls: 'shP' + k, anim: animLast && k === R.found.length - 1 });
    });
    if (R.sel) R.view.marks.push({ s: R.sel, cls: 'mkSel' });
    drawStage();
    const f = document.querySelector('#panel .found'); if (f) f.textContent = `Trouvés : ${R.found.length} / ${R.need}`;
  }

  /* ---------- Fin d'une question ---------- */
  function success() {
    const R = G.R;
    R.phase = 'done'; stopLoop();
    const left = Math.max(0, (R.deadline - now()) / 1000);
    if (R.mode !== 'pairs') G.combo++;
    const mult = comboMult(), pts = Math.round((100 + Math.floor(left) * 10) * mult) * (R.mode === 'pairs' ? 2 : 1);
    G.score += pts; G.res[G.i] = 'ok'; G.i++;
    if (R.mode !== 'pairs') Snd.good(G.combo);
    let badge = '';
    if (R.mode !== 'pairs' && (R.cat === 'ai' || R.cat === 'co')) {
      R.view.shapes.push({ A: R.A, B: R.B, cls: R.cat === 'ai' ? 'shZ' : 'shF', anim: true });
      badge = `<div class="badge ${R.cat === 'ai' ? 'Z' : 'F'}">${R.cat === 'ai' ? 'Z' : 'F'}</div>`;
    }
    drawStage(badge + `<div class="float">+${pts}${mult > 1 ? ` ×${String(mult).replace('.', ',')}` : ''}</div>`);
    document.getElementById('stage').classList.add('ok');
    if (R.mode === 'pairs') document.getElementById('pmsg').innerHTML = `<div class="explain good">✅ Les ${R.need} couples sont trouvés ! ${R.cat === 'ai' ? 'Seuls les 4 angles de la bande ont un alterne-interne.' : 'Chaque angle a exactement un correspondant.'}</div>`;
    else if (R.cat === 'ai' || R.cat === 'co') document.getElementById('panel').insertAdjacentHTML('beforeend', `<p class="ask" style="color:var(--${R.cat === 'ai' ? 'yellow' : 'cyan'})">${R.cat === 'ai' ? 'Le Z : alternes-internes' : 'Le F : correspondants'}</p>`);
    refreshHud();
    if (G.combo > 0 && G.combo % 5 === 0) confetti(40);
    nextT = setTimeout(() => { if (G && G.R === R) nextRound(); }, R.mode === 'pairs' ? 1900 : 1400);
  }

  function fail(html, timeout) {
    const R = G.R;
    R.phase = 'explain'; stopLoop();
    Snd.bad(); G.errors++; G.hearts--; G.combo = 0; G.res[G.i] = 'ko'; G.i++;
    if (R.mode === 'choice' && !R.juge) { G.focus = R.cat; G.focusN = 2; }
    R.view.band = true;
    if (R.mode !== 'pairs' && (R.cat === 'ai' || R.cat === 'co')) R.view.shapes.push({ A: R.A, B: R.B, cls: R.cat === 'ai' ? 'shZ' : 'shF', anim: true });
    drawStage();
    const st = document.getElementById('stage'); st.classList.add('ko');
    refreshHud();
    showContinue((timeout ? '<span class="t">⏱️ Trop tard !</span> ' : '') + html, G.hearts <= 0);
  }
  function showContinue(html, over) {
    const p = document.getElementById('panel');
    p.innerHTML = `<div class="explain">${html}</div><button type="button" class="btn go" data-act="next">${over ? 'Voir le bilan' : 'Compris ! ▶'}</button>`;
    const b = p.querySelector('[data-act="next"]');
    b.focus();
    b.addEventListener('click', () => { if (over) end(true); else nextRound(); });
  }
  function timeUp() {
    const R = G.R;
    if (R.mode === 'choice') {
      const ok = [...document.querySelectorAll('#panel .ch')].find((b) => R.options[b.dataset.i] === R.answer); if (ok) ok.classList.add('good');
      fail(explainChoice(R), true);
    } else if (R.mode === 'click') { R.view.marks.push({ s: R.B, cls: 'mkG' }); fail(`Le bon angle (en vert) est ${WHY[R.cat]}`, true); }
    else {
      const missing = allPairs(R.F).filter(([a, b]) => cat(a, b) === R.cat && !R.found.some(([x, y]) => (x.id === a.id && y.id === b.id) || (x.id === b.id && y.id === a.id)));
      missing.forEach(([a, b]) => R.found.push([a, b]));
      R.sel = null; paintPairs(true);
      fail(`Voici tous les couples. ${R.cat === 'ai' ? 'Les alternes-internes sont les 4 angles <b>dans la bande</b>, associés en Z.' : 'Chaque angle a <b>un</b> correspondant : la même place à l’autre sommet.'}`, true);
    }
  }

  /* ---------- Chronomètre ---------- */
  function loop() {
    cancelAnimationFrame(raf);
    const step = () => {
      if (!G || !G.R || G.R.phase !== 'ask') return;
      const R = G.R, left = R.deadline - now(), bar = document.getElementById('timer');
      if (left <= 0) { timeUp(); return; }
      if (bar) { bar.firstElementChild.style.transform = `scaleX(${(left / R.total).toFixed(4)})`; bar.classList.toggle('hurry', left < 3500); }
      const s = Math.ceil(left / 1000); if (s <= 3 && s < R.lastTick) { R.lastTick = s; Snd.tick(); }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  }
  let hiddenAt = 0;
  document.addEventListener('visibilitychange', () => {
    if (!G || !G.R || G.R.phase !== 'ask') return;
    if (document.hidden) { hiddenAt = now(); cancelAnimationFrame(raf); }
    else if (hiddenAt) { G.R.deadline += now() - hiddenAt; hiddenAt = 0; loop(); }
  });
  function quit() {
    if (!G) return;
    if (G.R && G.R.phase === 'ask' && !confirm('Abandonner la mission ? Tu reviendras à la carte.')) return;
    home();
  }

  /* ---------- Bilan ---------- */
  function end(failed) {
    stopLoop();
    const M = G.M, idx = MISSIONS.indexOf(M), next = MISSIONS[idx + 1];
    const stars = M.survie || failed ? 0 : G.errors === 0 ? 3 : G.errors === 1 ? 2 : 1;
    const oldStars = save.stars[M.id] || 0, oldBest = save.best[M.id] || 0, rec = G.score > oldBest && G.score > 0;
    const good = G.res.filter((r) => r === 'ok').length;
    if (!M.survie) save.stars[M.id] = Math.max(oldStars, stars);
    if (rec) save.best[M.id] = G.score;
    if (M.survie && good > (save.bestN || 0)) save.bestN = good;
    persist();
    const unlockedNow = !M.survie && stars > 0 && oldStars === 0;
    if (M.survie || stars) { Snd.win(); confetti(90); } else Snd.lose();
    const title = M.survie ? `${good} bonne${good > 1 ? 's' : ''} réponse${good > 1 ? 's' : ''}` : failed ? 'Plus de cœurs…' : stars === 3 ? 'Parfait, aucune erreur !' : 'Mission réussie !';
    const owl = M.survie ? 'Impressionnant ! Reviens battre ton record.' : failed ? 'Pas grave ! Relis les critères (dedans/dehors, même côté ou pas) et retente ta chance.'
      : M.boss ? 'Bravo ! Tu sais <b>reconnaître</b> les angles et t’en servir pour prouver ou calculer. Le mode Survie t’attend !'
      : stars === 3 ? 'Un sans-faute ! Les Z et les F n’ont plus de secret pour toi.' : 'Bien joué ! Vise les 3 étoiles : zéro erreur.';
    app.innerHTML = `<div class="screen"><div class="card">
      <p class="kicker">${M.survie ? 'Mode Survie' : `Mission ${idx + 1} · ${M.name}`}</p>
      <h1 class="center">${title}</h1>
      ${M.survie ? '' : `<div class="stars">${[0, 1, 2].map((i) => `<span class="${i < stars ? 'on' : ''}" style="animation-delay:${0.2 + i * 0.25}s">★</span>`).join('')}</div>`}
      <p class="big-score">${G.score} pts</p>
      ${rec ? '<p class="newrec">🏆 NOUVEAU RECORD !</p>' : oldBest ? `<p class="center" style="color:var(--dim);margin:0">Record : ${oldBest} pts</p>` : ''}
      <div class="stats"><div><b>${good}</b><span>réussie${good > 1 ? 's' : ''}</span></div><div><b>${G.errors}</b><span>erreur${G.errors > 1 ? 's' : ''}</span></div><div><b>${G.hearts}</b><span>cœur${G.hearts > 1 ? 's' : ''} restant${G.hearts > 1 ? 's' : ''}</span></div></div>
      <div class="mascot"><span class="face" aria-hidden="true">🦉</span><div class="bubble">${owl}</div></div>
      ${unlockedNow ? `<p class="center" style="margin:12px 0 0;font-weight:800;color:var(--green)">🔓 ${next ? `Mission débloquée : ${next.icon} ${next.name}` : 'Mode Survie débloqué !'}</p>` : ''}
      <div class="row" style="margin-top:14px">
        <button type="button" class="btn ghost" data-act="home">← Carte</button>
        <button type="button" class="btn${!stars || !next || M.survie ? ' go' : ''}" data-act="again">↻ Rejouer</button>
        ${!M.survie && stars && next ? '<button type="button" class="btn go" data-act="next">Mission suivante ▶</button>' : ''}
        ${!M.survie && stars && !next && survieOpen() ? '<button type="button" class="btn go" data-act="inf">♾️ Mode Survie</button>' : ''}
      </div></div></div>`;
    app.querySelector('[data-act="home"]').addEventListener('click', home);
    app.querySelector('[data-act="again"]').addEventListener('click', () => start(M));
    app.querySelector('[data-act="next"]')?.addEventListener('click', () => brief(next));
    app.querySelector('[data-act="inf"]')?.addEventListener('click', () => brief(SURVIE));
    (app.querySelector('.btn.go') || app.querySelector('.btn')).focus();
    app.scrollTop = 0;
    G = null;
  }

  function confetti(n) {
    const colors = ['#3fe3ff', '#ff5fae', '#ffd23f', '#3ee08f', '#a78bfa', '#ff9a3c'];
    const box = document.createElement('div');
    box.className = 'confetti';
    let h = '';
    for (let i = 0; i < n; i++) h += `<i style="left:${rand(0, 100)}%;background:${colors[i % colors.length]};--dx:${rand(-90, 90)}px;--r:${rand(360, 1080)}deg;animation-delay:${(Math.random() * 0.3).toFixed(2)}s;${i % 3 ? '' : 'border-radius:50%;'}"></i>`;
    box.innerHTML = h;
    document.body.appendChild(box);
    setTimeout(() => box.remove(), 2400);
  }

  document.addEventListener('keydown', (e) => {
    if (/^[1-4]$/.test(e.key)) {
      const b = app.querySelectorAll('#panel .ch')[Number(e.key) - 1];
      if (b && !b.disabled) { e.preventDefault(); b.click(); }
    }
  });

  // pour les tests automatiques (aucun effet sur le jeu)
  window.__zf = { makeFig, cat, sectors, allPairs, MISSIONS, SURVIE };

  home();
})();
