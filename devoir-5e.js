/* =========================================================
   Révisions 5e — mode devoir (repris du site de 6e, 17/11/2026)
   Lien : #/devoir/clé1,clé2/nombre[/c=Classe][/g=1][/u]
   - clés : exercices de 5e uniquement (objet GENS de script.js et chapitres-5e.js)
   - /c=…  : classe de l'élève (plusieurs séparées par des virgules : l'élève choisit)
   - /g=1  : envoi du résultat au formulaire Grist du professeur (le même document que la 6e)
   - /u    : seul le premier essai est envoyé
   Chargé après controles-5e.js (qui définit esc, normName, B32 et siteURL).
   ========================================================= */

/** Nom du devoir tel qu'il arrive dans la colonne « Devoir » */
const devoirLabel = (keys, rem = false) => (rem ? 'Remédiation — ' : '') + (keys.length === 1 ? GENS[keys[0]].label : `Révisions ciblées : ${keys.map((k) => GENS[k].label).join(', ')}`);

/* ---------- Grist ----------
   Même formulaire que GRIST_SITE dans le script.js de 6e : les lignes de 5e se distinguent par la colonne Classe (« 5e … »).
   Un formulaire publié accepte l'ajout de lignes sans clé secrète (pas de lecture possible). */
const GRIST_SITE = { a: 'https://grist.numerique.gouv.fr/o/docs', k: '1CSVewczBDMwLGG3cFYgyA', v: '5', t: 'Table1', c: ['Prenom', 'Code', 'Classe', 'Devoir', 'Score', 'Detail'] };
const b64d = (str) => decodeURIComponent(escape(atob(str.replace(/-/g, '+').replace(/_/g, '/'))));
function segToGrist(seg) {
  if (seg === '1') return { ...GRIST_SITE };
  try { const g = JSON.parse(b64d(seg)); return g && /^https:\/\//.test(g.a) && /^[A-Za-z0-9]+$/.test(g.k) && g.t && Array.isArray(g.c) ? g : null; } catch (e) { return null; }
}
async function gristSend(g, values) {
  const fields = {};
  g.c.forEach((c, i) => { if (c) fields[c] = values[i] ?? ''; });
  const r = await fetch(`${g.a}/api/s/${g.k}/tables/${encodeURIComponent(g.t)}/records`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ records: [{ fields }] }),
  });
  if (!r.ok) { let t = ''; try { t = (await r.text()).slice(0, 160); } catch (e) { /* rien */ } throw new Error(`refus de Grist (${r.status}) ${t}`); }
  return r;
}
const nowStr = (d = new Date()) => `le ${d.toLocaleDateString('fr-FR')} à ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;

/* ---------- Code de résultat (14 caractères) ----------
   Exactement le même format que le site de 6e (même clé de contrôle « v6e: ») : le widget « Mes devoirs » de Grist
   et le bilan de l'Espace professeur de 6e reconnaissent ainsi les résultats de 5e comme des codes vérifiés. */
const DV_EPOCH = Date.UTC(2026, 0, 1);
function h8(s) { let h = 2166136261; for (const c of String(s)) { h ^= c.codePointAt(0); h = Math.imul(h, 16777619); } return ((h >>> 0) ^ (h >>> 8) ^ (h >>> 16) ^ (h >>> 24)) & 255; }
function makeCode({ good, n, helped, attempt, time, spec, name }) {
  const mins = clamp(Math.floor((time - DV_EPOCH) / 60000), 0, 2 ** 21 - 1);
  let v = 0n;
  const push = (x, b) => { v = (v << BigInt(b)) | BigInt(x & (2 ** b - 1)); };
  push(good, 6); push(n, 6); push(helped, 6); push(Math.min(attempt, 31), 5); push(mins, 21); push(h8(spec), 8); push(h8(normName(name)), 8);
  push(h8('v6e:' + v.toString(36)), 8);
  let s = '';
  for (let i = 0; i < 14; i++) { s = B32[Number(v & 31n)] + s; v >>= 5n; }
  return `${s.slice(0, 4)}-${s.slice(4, 9)}-${s.slice(9)}`;
}

/* ---------- Devoir : prénom, série, carte de résultat ---------- */
let devoirSpec = null;
function routeDevoir(spec) {
  const [ks, nS, ...more] = spec.split('/');
  const keys = [...new Set((ks || '').split(',').filter((k) => GENS[k]))];
  const n = clamp(parseInt(nS, 10) || 10, 1, 40);
  let classe = '', form = null;
  const once = more.includes('u'), rem = more.includes('r');
  more.forEach((seg) => {
    if (seg.startsWith('c=')) { try { classe = decodeURIComponent(seg.slice(2)).slice(0, 80); } catch (e) { classe = ''; } }
    if (seg.startsWith('g=')) { const g = segToGrist(seg.slice(2)); if (g) form = g; }
  });
  const classes = [...new Set(classe.split(',').map((x) => x.trim()).filter(Boolean))];
  classe = classes.length === 1 ? classes[0] : '';
  const page = document.querySelector('.page[data-p="devoir"]');
  const head = page.querySelector('.devoir-head'), ex = page.querySelector('.devoir-ex'), start = page.querySelector('.devoir-start');
  if (!keys.length) {
    head.innerHTML = '<h1>Devoir introuvable</h1><p class="lead">Ce lien ne correspond à aucun exercice. Vérifie que tu as copié le lien en entier, ou demande-le à nouveau à ton professeur.</p><p><a class="btn" href="#/">Retour à l\'accueil</a></p>';
    ex.hidden = true; start.hidden = true; devoirSpec = null;
    return { ch: '' };
  }
  const chs = [...new Set(keys.map((k) => GENS[k].ch))];
  const canon = `${keys.join(',')}/${n}`;
  if (spec === devoirSpec) return { ch: chs[0] };
  devoirSpec = spec;
  const title = keys.length === 1 ? GENS[keys[0]].label : 'Révisions ciblées', dLabel = devoirLabel(keys, rem);
  // la fiche n'est proposée que si le chapitre est ouvert aux élèves
  const fiches = chs.map((c) => CHAPTERS.find((x) => x.id === c)).filter((c) => c && !c.locked && document.querySelector(`.page[data-ch="${c.id}"][data-p="fiche"]`));
  head.innerHTML = `<p class="kicker">Devoir</p><h1>${title}</h1>
    <p class="lead">${n} question${n > 1 ? 's' : ''} sur : ${keys.map((k) => `<b>${GENS[k].label}</b>`).join(', ')}. Tu as droit aux indices et à un deuxième essai.${once ? ' <b>Seul ton premier essai compte</b> : tu pourras ensuite refaire le devoir pour t\'entraîner.' : ''} ${form ? 'À la fin, ton résultat sera <b>envoyé automatiquement</b> à ton professeur.' : 'À la fin, tu obtiendras ton résultat et un code pour ton professeur.'}</p>${classe ? `<p class="small">Classe : <b>${esc(classe)}</b></p>` : ''}
    ${fiches.length ? `<p class="small">Besoin de revoir le cours ? ${fiches.map((c) => `<a href="#/${c.id}/fiche">Fiche « ${c.title} »</a>`).join(' · ')}</p>` : ''}`;
  ex.hidden = true; ex.innerHTML = '';
  start.hidden = false;
  start.innerHTML = `<label for="dv-name"><b>Écris ton prénom${classes.length > 1 ? ' et choisis ta classe' : ''} pour commencer :</b></label>
    <div class="prof-row"><input type="text" id="dv-name" autocomplete="given-name" maxlength="30" value="${esc(stats._name || '')}" aria-label="Ton prénom">
    ${classes.length > 1 ? `<select id="dv-classe" aria-label="Ta classe"><option value="">Ta classe…</option>${classes.map((c) => `<option${c === stats._classe ? ' selected' : ''}>${esc(c)}</option>`).join('')}</select>` : ''}
    <button type="button" class="btn primary" id="dv-go">Commencer le devoir →</button></div>
    <p><button type="button" class="linkbtn" id="dv-paper">📝 Je préfère faire ce devoir sur papier</button></p>
    <p class="small muted">${form ? 'Ton prénom et ton résultat seront transmis à ton professeur, et à personne d\'autre.' : 'Ton prénom reste sur cet appareil : il s\'affiche seulement sur ta carte de résultat.'}</p>`;
  const askName = () => {
    const inp = start.querySelector('#dv-name'), name = inp.value.trim();
    if (!normName(name)) { inp.classList.add('wrong'); inp.focus(); return null; }
    if (classes.length > 1) {
      const sel = start.querySelector('#dv-classe');
      if (!sel.value) { sel.classList.add('wrong'); sel.focus(); return null; }
      classe = sel.value; stats._classe = classe;
    }
    stats._name = name; persist();
    return name;
  };
  const go = (name) => {
    const rec = stats['devoir:' + canon] || (stats['devoir:' + canon] = { tries: 0 });
    rec.tries = (rec.tries || 0) + 1; persist();
    start.hidden = true; ex.hidden = false; ex.classList.remove('done');
    makeExercise(ex, null, {
      limit: n, ch: chs[0], help: true,
      restartLabel: 'Recommencer le devoir',
      onRestart() { rec.tries++; persist(); },
      summary({ good, limit, helpedCount }) {
        const d = new Date();
        const code = makeCode({ good, n: limit, helped: helpedCount, attempt: rec.tries, time: d.getTime(), spec: canon, name });
        rec.best = Math.max(rec.best || 0, good); rec.last = good; rec.at = d.getTime(); persist();
        const training = once && rec.tries > 1;
        if (form && !training) {
          const values = [name, code, classe, dLabel, `${good}/${limit}`, `${helpedCount} avec aide · essai ${rec.tries} · terminé ${nowStr(d)}`];
          const doSend = () => {
            const el = document.getElementById('rc-send'); if (!el) return;
            el.className = 'rc-send'; el.textContent = '📨 Envoi du résultat à ton professeur…';
            gristSend(form, values)
              .then(() => { el.className = 'rc-send ok'; el.textContent = '✔ Résultat envoyé à ton professeur.'; })
              .catch((e) => {
                el.className = 'rc-send ko'; el.innerHTML = `⚠ Envoi impossible <span class="small muted">(${esc(e instanceof TypeError ? 'pas de connexion ou réponse de Grist illisible' : e.message)})</span>. <button type="button" class="mini">Réessayer</button> Si ça ne marche toujours pas, préviens ton professeur.`;
                el.querySelector('button').addEventListener('click', doSend);
              });
          };
          setTimeout(doSend, 0);
        }
        return `<div class="result-card" id="result-card">
          <p class="rc-kicker">Révisions 5<sup>e</sup> · ${training ? 'Entraînement' : 'Devoir'}</p>
          <p class="rc-name">${esc(name)}${classe ? ` <span class="rc-cl">${esc(classe)}</span>` : ''}</p>
          <p class="rc-title">${title}</p>
          <p class="note">${good} / ${limit}</p>
          <p>${good} réussite${good > 1 ? 's' : ''} sur ${limit} question${limit > 1 ? 's' : ''}${helpedCount ? `, dont ${helpedCount} avec de l'aide` : ', sans aide'}.</p>
          <p class="rc-meta">Terminé ${nowStr(d)} · essai n° ${rec.tries}</p>
          ${form ? '' : `<p class="rc-code">Code : <b>${code}</b></p>`}
          ${training ? '<p class="rc-send todo">🏋️ Essai d\'entraînement : seul ton premier essai compte, il a déjà été transmis.</p>' : form ? '<p class="rc-send" id="rc-send"></p>' : ''}
          {{LIST}}
        </div>
        ${form ? '' : '<p class="small center">📸 Fais une <b>capture d\'écran</b> de ce cadre, ou recopie le <b>code</b> pour ton professeur.</p>'}`;
      },
      makeGen() {
        let bag = [], last = null;
        return () => {
          if (!bag.length) bag = shuffle([...keys]);
          let k = bag.shift();
          if (k === last && keys.length > 1 && bag.length) { bag.push(k); k = bag.shift(); }
          last = k;
          return wrapGen(k);
        };
      },
    });
    ex.scrollIntoView({ block: 'start', behavior: 'smooth' });
  };
  start.querySelector('#dv-go').addEventListener('click', () => { const name = askName(); if (name) go(name); });

  // ---------- Version papier : feuille à imprimer + ligne « sur papier, à vérifier » pour le professeur ----------
  start.querySelector('#dv-paper').addEventListener('click', () => {
    const name = askName(); if (!name) return;
    let bag = [];
    const qs = [];
    for (let i = 0; i < n; i++) { if (!bag.length) bag = shuffle([...keys]); const k = bag.shift(); qs.push({ k, o: GENS[k].f() }); }
    const paperize = (html) => {
      const d = document.createElement('div'); d.innerHTML = html;
      d.querySelectorAll('input.ans, input[type=text], input[type=number]').forEach((i) => { const sp = document.createElement('span'); sp.className = 'blank'; sp.textContent = ' '; i.replaceWith(sp); });
      d.querySelectorAll('input[type=radio], input[type=checkbox]').forEach((i) => { const sp = document.createElement('span'); sp.className = 'box'; sp.textContent = '☐'; i.replaceWith(sp); });
      d.querySelectorAll('select').forEach((s) => { const sp = document.createElement('span'); sp.className = 'blank'; sp.textContent = ' '; s.replaceWith(sp); });
      d.querySelectorAll('button').forEach((b) => { const sp = document.createElement('span'); sp.className = b.className + ' as-text'; sp.textContent = b.textContent; b.replaceWith(sp); });
      return d.innerHTML.replace(/Clique sur/g, 'Entoure').replace(/clique sur/g, 'entoure');
    };
    const d = new Date();
    start.hidden = true; ex.hidden = false; ex.classList.remove('done');
    ex.innerHTML = `<div class="no-print paper-bar">
        <p class="paper-st" id="paper-st"></p>
        <p><button type="button" class="btn primary" id="paper-print">🖨️ Imprimer la feuille</button> <button type="button" class="btn" id="paper-back">Finalement, je le fais en ligne</button></p>
        <p class="small muted">Pas d'imprimante ? Recopie les questions sur ta feuille. Quand une question dit « clique », entoure ou écris ta réponse sur la feuille.</p>
      </div>
      <div class="paper-sheet">
        <div class="paper-head"><b>${esc(name)}</b>${classe ? ` — ${esc(classe)}` : ''}<span>Devoir : ${esc(title)} · ${n} questions · ${d.toLocaleDateString('fr-FR')}</span></div>
        ${qs.map((x, i) => `<section class="pq" data-i="${i}"><h3>Question ${i + 1}${keys.length > 1 ? ` <span class="small muted">— ${GENS[x.k].label}</span>` : ''}</h3>${x.o.q.includes('class="board"') ? '<div class="pq-body"></div>' : paperize(x.o.q)}</section>`).join('')}
      </div>`;
    // Constructions : figure de départ en vraie grandeur, sans les instruments
    ex.querySelectorAll('.pq').forEach((sec) => {
      const x = qs[Number(sec.dataset.i)], body = sec.querySelector('.pq-body'); if (!body) return;
      body.innerHTML = x.o.q;
      try { if (x.o.mount) x.o.mount(body); } catch (e) { /* rien */ }
      const svg = body.querySelector('.geo-svg'), board = body.querySelector('.board');
      const fig = svg ? svg.cloneNode(true) : null;
      if (fig) { fig.querySelector('.g-prev')?.remove(); fig.classList.add('paper-geo'); fig.removeAttribute('style'); }
      if (board) {
        board.innerHTML = '';
        if (fig) board.appendChild(fig);
        board.insertAdjacentHTML('beforeend', '<p class="small muted">Fais la construction sur ta feuille, avec tes instruments.</p>');
      }
      body.innerHTML = paperize(body.innerHTML);
    });
    const st = ex.querySelector('#paper-st');
    if (form) {
      const values = [name, `PAPIER-${n}`, classe, dLabel, 'sur papier', `déclaré ${nowStr(d)} · à vérifier sur la feuille`];
      st.className = 'paper-st'; st.textContent = '📨 J\'informe ton professeur que tu fais ce devoir sur papier…';
      gristSend(form, values)
        .then(() => { st.className = 'paper-st ok-t'; st.textContent = '✔ Ton professeur sait que tu fais ce devoir sur papier. N\'oublie pas de lui rendre ta feuille !'; })
        .catch((e) => { st.className = 'paper-st warn-t'; st.innerHTML = `⚠ Je n'ai pas pu prévenir ton professeur. Dis-lui toi-même que tu as fait ce devoir sur papier.<br><span class="small muted">Détail : ${esc(e instanceof TypeError ? 'réponse de Grist illisible ou pas de connexion' : e.message)}</span>`; });
    } else st.textContent = '📝 Fais ce devoir sur ta feuille et rends-la à ton professeur.';
    ex.querySelector('#paper-print').addEventListener('click', () => window.print());
    ex.querySelector('#paper-back').addEventListener('click', () => { ex.innerHTML = ''; go(name); });
    ex.scrollIntoView({ block: 'start', behavior: 'smooth' });
  });
  start.querySelector('#dv-name').addEventListener('keydown', (e) => { if (e.key === 'Enter') { const name = askName(); if (name) go(name); } });
  start.querySelector('#dv-name').addEventListener('input', (e) => e.target.classList.remove('wrong'));
  start.querySelector('#dv-classe')?.addEventListener('change', (e) => e.target.classList.remove('wrong'));
  return { ch: chs[0] };
}
