'use strict';
/* =========================================================
   ESPACE PROFESSEUR
   - accès par code (réglages.js) ; c'est la seule porte d'entrée du classeur ;
   - « Ce que voient les élèves » : ouvrir ou fermer les chapitres (ouverture.js).
   Sur l'appareil du professeur (Espace professeur ouvert), tout reste visible.
   ========================================================= */
const CODE_PROF = (window.REGLAGES && window.REGLAGES.codeProf) || 'prof5e';
const PROF_KEY = 'revisions5e-prof';
const profNorm = (s) => String(s || '').trim().toLowerCase();
const profOpen = () => { try { return localStorage.getItem(PROF_KEY) === profNorm(CODE_PROF) + ':ok'; } catch (e) { return false; } };

/* ---------- Ce que voient les élèves ---------- */
const AUTO_PAGES = ['accueil', 'erreurs'];
function ouv(ch) { const o = (window.OUVERTURE || {})[ch]; return o === undefined ? true : o; }
function pageOuverte(ch, p) {
  const o = ouv(ch);
  if (o === true) return true;
  if (!Array.isArray(o) || !o.length) return false;
  return AUTO_PAGES.includes(p) || o.includes(p);
}
/* catalogue des pages (relevé avant de retirer quoi que ce soit) */
const PAGES_CAT = Object.fromEntries(CHAPTERS.map((c) => [c.id, [...document.querySelectorAll(`.page[data-ch="${c.id}"]`)].map((sec) => ({ p: sec.dataset.p, t: sec.dataset.title || sec.dataset.p }))]));
const PROF_AU_CHARGEMENT = profOpen();
(function appliquerOuverture() {
  CHAPTERS.forEach((c) => {
    const secs = [...document.querySelectorAll(`.page[data-ch="${c.id}"]`)];
    const closed = secs.filter((sec) => !pageOuverte(c.id, sec.dataset.p));
    if (!closed.length) return;
    const allClosed = closed.length === secs.length;
    if (PROF_AU_CHARGEMENT) {
      c.hiddenNote = allClosed ? '🔒 Masqué aux élèves' : `🔒 ${closed.length} page${closed.length > 1 ? 's' : ''} masquée${closed.length > 1 ? 's' : ''} aux élèves`;
      closed.forEach((sec) => { sec.dataset.hiddenEleves = '1'; sec.insertAdjacentHTML('afterbegin', '<p class="hidden-banner">🔒 Page masquée aux élèves (tu la vois parce que l\'Espace professeur est ouvert sur cet appareil).</p>'); });
      return;
    }
    const openKeys = new Set(secs.filter((sec) => !closed.includes(sec)).flatMap((sec) => [...sec.querySelectorAll('[data-gen]')].map((e) => e.dataset.gen)));
    closed.forEach((sec) => { sec.querySelectorAll('[data-gen]').forEach((e) => { if (!openKeys.has(e.dataset.gen) && GENS[e.dataset.gen]) GENS[e.dataset.gen].locked = true; }); sec.remove(); });
    if (allClosed) c.locked = true;
  });
}());

/* ---------- Carte « Ce que voient les élèves » ---------- */
function renderOuvertureCard() {
  const host = document.getElementById('p5-ouverture'); if (!host) return;
  if (host.dataset.ready) return;
  host.dataset.ready = '1';
  const state = {};
  CHAPTERS.forEach((c) => {
    const o = ouv(c.id), pages = PAGES_CAT[c.id].filter((x) => !AUTO_PAGES.includes(x.p));
    state[c.id] = Object.fromEntries(pages.map((x) => [x.p, o === true || (Array.isArray(o) && o.includes(x.p))]));
  });
  const title = (ch, p) => (PAGES_CAT[ch].find((x) => x.p === p) || { t: p }).t;
  const fileText = () => {
    const lines = CHAPTERS.map((c) => {
      const ps = Object.entries(state[c.id]).filter(([, v]) => v).map(([k]) => k);
      const all = ps.length === Object.keys(state[c.id]).length;
      return `  ${JSON.stringify(c.id)}: ${all ? 'true' : JSON.stringify(ps)}`;
    });
    return `/* =========================================================\n   CE QUE VOIENT LES ÉLÈVES\n   Fichier fabriqué par l'Espace professeur (« Ce que voient les élèves »).\n   Pour chaque chapitre :  true = tout est ouvert ;  [] = chapitre fermé ;\n   ["fiche", "tableaux", …] = seulement ces pages.\n   ========================================================= */\nwindow.OUVERTURE = {\n${lines.join(',\n')}\n};\n`;
  };
  let opened = true;
  const closedList = () => CHAPTERS.filter((c) => Object.values(state[c.id]).every((v) => !v));
  const draw = () => {
    host.innerHTML = `<details class="ouv-box card"${opened ? ' open' : ''}><summary><h2>👁 Ce que voient les élèves</h2><span class="small muted">${closedList().map((c) => 'ch. ' + c.num).join(', ') || 'rien'} masqué${closedList().length > 1 ? 's' : ''}</span></summary>
      <p class="small">Coche ce qui a été vu en classe. Une page non cochée est <b>invisible pour les élèves</b> (un chapitre sans aucune page cochée apparaît « 🔒 Bientôt »). Leur progression n'est jamais effacée.</p>
      <div class="ouv-grid">${CHAPTERS.slice().reverse().map((c) => {
        const ps = Object.keys(state[c.id]), n = ps.filter((p) => state[c.id][p]).length;
        return `<fieldset class="ouv-ch"><legend><label><input type="checkbox" data-ouvch="${c.id}" ${n === ps.length ? 'checked' : ''}> <b>Chapitre ${c.num} · ${c.title}</b></label> <span class="small muted">${n === ps.length ? 'tout ouvert' : n ? `${n} / ${ps.length}` : 'fermé'}</span></legend>
          ${ps.map((p) => `<label class="ouv-p"><input type="checkbox" data-ouv="${c.id}|${p}" ${state[c.id][p] ? 'checked' : ''}> ${title(c.id, p)}</label>`).join('')}</fieldset>`;
      }).join('')}</div>
      <p><button type="button" class="btn primary" id="ouv-dl">⬇ Télécharger ouverture.js</button> <button type="button" class="btn" id="ouv-copy">Copier son contenu</button></p>
      <ol class="small steps-form"><li>Télécharge le fichier <b>ouverture.js</b>.</li><li>Sur GitHub, dans ton dépôt : <b>Add file → Upload files</b>, dépose ouverture.js (il remplace l'ancien), puis <b>Commit changes</b>.</li><li>Les élèves voient le changement 1 à 2 minutes plus tard. Sur cet appareil, tu vois tout (avec 🔒 sur ce qui est masqué) ; pour voir comme un élève, ouvre le site dans une fenêtre de navigation privée.</li></ol></details>`;
    host.querySelector('details').addEventListener('toggle', (e) => { opened = e.target.open; });
  };
  draw();
  host.addEventListener('change', (e) => {
    const t = e.target;
    if (t.dataset.ouvch) { const on = t.checked; Object.keys(state[t.dataset.ouvch]).forEach((p) => { state[t.dataset.ouvch][p] = on; }); draw(); }
    else if (t.dataset.ouv) { const [ch, p] = t.dataset.ouv.split('|'); state[ch][p] = t.checked; draw(); }
  });
  host.addEventListener('click', (e) => {
    if (e.target.id === 'ouv-dl') {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([fileText()], { type: 'text/javascript' }));
      a.download = 'ouverture.js'; document.body.appendChild(a); a.click(); a.remove();
    } else if (e.target.id === 'ouv-copy') {
      const b = e.target;
      (navigator.clipboard ? navigator.clipboard.writeText(fileText()) : Promise.reject()).then(() => { b.textContent = '✔ Copié'; setTimeout(() => { b.textContent = 'Copier son contenu'; }, 1500); }).catch(() => { b.textContent = 'Copie impossible : utilise le téléchargement'; });
    }
  });
  host.__fileText = fileText;
}

/* ---------- Verrou de l'Espace professeur ---------- */
function renderProfLock() {
  const lock = document.getElementById('prof-lock'), content = document.getElementById('prof-content');
  if (!lock || !content) return;
  const open = profOpen();
  lock.hidden = open; content.hidden = !open;
  if (open) { try { renderOuvertureCard(); profSyncStart(); } catch (e) { content.insertAdjacentHTML('afterbegin', `<p class="ex-fb ko">⚠ Problème dans l'Espace professeur : ${e.message}. Recharge la page avec Ctrl+F5.</p>`); } return; }
  if (lock.dataset.ready) return;
  lock.dataset.ready = '1';
  const inpC = lock.querySelector('#prof-code'), msg = lock.querySelector('.lock-msg');
  const tryCode = async () => {
    if (profNorm(inpC.value) && profNorm(inpC.value) === profNorm(CODE_PROF)) {
      try { localStorage.setItem(PROF_KEY, profNorm(CODE_PROF) + ':ok'); } catch (e) { /* rien */ }
      location.reload();
      return;
    }
    // Code d'accès (le même que sur le site de 6e) : ouvre l'espace et règle la sauvegarde en ligne sur cet appareil
    msg.textContent = 'Vérification…';
    if (inpC.value.trim().length >= 12 && await accesOuvrir(inpC.value)) {
      try { localStorage.setItem(PROF_KEY, profNorm(CODE_PROF) + ':ok'); } catch (e) { /* rien */ }
      location.reload();
    } else { msg.textContent = 'Code incorrect.'; inpC.classList.add('wrong'); inpC.select(); }
  };
  lock.querySelector('#prof-unlock').addEventListener('click', tryCode);
  inpC.addEventListener('keydown', (e) => { if (e.key === 'Enter') tryCode(); });
  inpC.addEventListener('input', () => inpC.classList.remove('wrong'));
}
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('prof-relock')?.addEventListener('click', () => { try { localStorage.removeItem(PROF_KEY); } catch (e) { /* rien */ } location.reload(); });
});

/* =========================================================
   ACCÈS PARTOUT AVEC UN CODE, ET SAUVEGARDE EN LIGNE (comme sur le site de 6e)
   - acces.json (public) contient, chiffrés avec une clé tirée du CODE D'ACCÈS (PBKDF2), le dépôt GitHub privé,
     le jeton et la clé de synchronisation. C'est le même fichier, et donc le même code, que sur le site de 6e.
   - L'Espace professeur est enregistré, chiffré (AES-GCM), dans le fichier prof-5e.json de ce dépôt privé, à côté
     de classeur.json et prof.json (6e). Il contient les contrôles (avec leurs résultats), les listes d'élèves, les
     classes, les élèves en version aménagée, et pour chaque contrôle le fichier pour la correction assistée.
   - Réglages : ceux de la sauvegarde du site de 6e s'ils existent sur cet appareil (les deux sites sont à la même
     adresse darthialm.github.io, donc ils partagent le navigateur), sinon ceux donnés par le code d'accès.
   ========================================================= */
const PSYNC_FILE = 'prof-5e.json', PSYNC_STATE = 'revisions5e-prof-sync', PSYNC_OWN = 'revisions5e-sync', PSYNC_6E = 'revisions6e-classeur-sync';
const ACCES_FILES = ['acces.json', '../sixieme/acces.json'];
const PSYNC_FIXED = ['revisions5e-controles', 'revisions5e-amenages', 'revisions5e-classes'];
const psSynced = (k) => PSYNC_FIXED.includes(k) || k.startsWith('revisions5e-liste-');
let psBusy = false, psTimer = null, psSoon = null;
const psRead = (k) => { try { const s = JSON.parse(localStorage.getItem(k) || 'null'); return s && s.repo && s.token && s.key ? { repo: s.repo, token: s.token, salt: s.salt, key: s.key } : null; } catch (e) { return null; } };
function psCfg() { return psRead(PSYNC_OWN) || psRead(PSYNC_6E); }
const psState = () => { try { return JSON.parse(localStorage.getItem(PSYNC_STATE) || '{}'); } catch (e) { return {}; } };
const psSetState = (s) => { try { localStorage.setItem(PSYNC_STATE, JSON.stringify(s)); } catch (e) { /* rien */ } };
const psB64 = (u) => { let s = ''; for (let i = 0; i < u.length; i += 32768) s += String.fromCharCode.apply(null, u.subarray(i, i + 32768)); return btoa(s); };
const psU8 = (b) => Uint8Array.from(atob(b), (c) => c.charCodeAt(0));
function psSnapshot() {
  const keys = {};
  for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (psSynced(k)) keys[k] = localStorage.getItem(k); }
  return keys;
}
async function psHash(obj) {
  const keys = Object.keys(obj).sort(), txt = JSON.stringify(keys.map((k) => [k, obj[k]]));
  return psB64(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(txt))));
}
function psAiFiles() {
  const out = {};
  if (typeof ctlAll === 'function' && typeof aiText === 'function') ctlAll().forEach((c) => { try { out[c.id] = aiText(c); } catch (e) { /* contrôle illisible : ignoré */ } });
  return out;
}
async function psFetch(cfg, path, opt = {}) {
  return fetch('https://api.github.com/repos/' + cfg.repo + path, { method: opt.method || 'GET', body: opt.body, cache: 'no-store',
    headers: { Authorization: 'Bearer ' + cfg.token, Accept: 'application/vnd.github+json', ...(opt.headers || {}) } });
}
async function psGet(cfg) {
  const r = await psFetch(cfg, '/contents/' + PSYNC_FILE);
  if (r.status === 404) return null;
  if (!r.ok) throw new Error('GitHub ' + r.status);
  const j = await r.json(); let b64 = j.content;
  if (!b64 || j.encoding !== 'base64') { const r2 = await psFetch(cfg, '/git/blobs/' + j.sha); if (!r2.ok) throw new Error('GitHub ' + r2.status); b64 = (await r2.json()).content; }
  return { sha: j.sha, file: JSON.parse(decodeURIComponent(escape(atob(String(b64).replace(/\s/g, ''))))) };
}
/** Code d'accès : déchiffre acces.json (celui de ce site, sinon celui du site de 6e) et règle la sauvegarde en ligne. */
async function accesOuvrir(code) {
  if (!window.crypto || !crypto.subtle) return false;
  for (const f of ACCES_FILES) {
    let a = null;
    try { const r = await fetch(f, { cache: 'no-store' }); if (r.ok) a = await r.json(); } catch (e) { a = null; }
    if (!a || !a.data) continue;
    try {
      const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(code.trim()), 'PBKDF2', false, ['deriveKey']);
      const k = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt: psU8(a.salt), iterations: a.iter, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
      const u = psU8(a.data);
      const d = JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: u.slice(0, 12) }, k, u.slice(12))));
      localStorage.setItem(PSYNC_OWN, JSON.stringify({ repo: d.repo, token: d.token, salt: d.salt, key: d.key }));
      return true;
    } catch (e) { /* pas le bon code pour ce fichier : on essaie le suivant */ }
  }
  return false;
}
function psStatus(t) { const el = document.getElementById('prof-sync'); if (el) el.textContent = t; }
/** Synchronise l'Espace professeur ; renvoie true si des données en ligne ont été appliquées (il faut recharger). */
async function profSync() {
  const cfg = psCfg();
  if (!cfg) { psStatus('Sauvegarde en ligne : pas encore réglée sur cet appareil. Verrouille l\'espace, puis rouvre-le avec ton code d\'accès (le même que sur le site de 6e).'); return false; }
  if (!window.crypto || !crypto.subtle || psBusy) return false;
  psBusy = true;
  try {
    const key = await crypto.subtle.importKey('raw', psU8(cfg.key), { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
    const st = psState(), local = psSnapshot(), hLocal = await psHash(local);
    const remote = await psGet(cfg);
    const localChanged = hLocal !== st.hash, remoteChanged = !!remote && remote.sha !== st.sha;
    let takeRemote = false;
    if (remoteChanged) {
      if (!localChanged || (!st.sha && !Object.keys(local).length)) takeRemote = true;
      else takeRemote = !confirm('L\'Espace professeur (5e) a été modifié sur un autre appareil ET sur celui-ci.\n\nOK : garder la version de CET appareil (elle remplacera celle en ligne).\nAnnuler : prendre la version en ligne.');
    }
    if (takeRemote) {
      const u = psU8(remote.file.data);
      const d = JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: u.slice(0, 12) }, key, u.slice(12))));
      if (localChanged && Object.keys(local).length) { try { localStorage.setItem('revisions5e-prof-ecarte', JSON.stringify({ date: new Date().toISOString(), keys: local })); } catch (e) { /* rien */ } }
      Object.keys(local).forEach((k) => { if (!(k in d.keys)) localStorage.removeItem(k); });
      Object.entries(d.keys).forEach(([k, v]) => { if (psSynced(k)) localStorage.setItem(k, v); });
      psSetState({ sha: remote.sha, hash: await psHash(psSnapshot()), last: Date.now() });
      psStatus('Sauvegarde en ligne : version la plus récente récupérée (' + new Date(remote.file.date).toLocaleString('fr-FR') + ').');
      return true;
    }
    if (localChanged || !remote) {
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(JSON.stringify({ keys: local, ai: psAiFiles() }))));
      const u = new Uint8Array(12 + ct.length); u.set(iv); u.set(ct, 12);
      const file = { type: 'prof-5e-sync', v: 1, salt: cfg.salt, date: new Date().toISOString(), data: psB64(u) };
      const body = { message: 'Espace professeur 5e : enregistrement du ' + new Date().toLocaleString('fr-FR'), content: btoa(unescape(encodeURIComponent(JSON.stringify(file)))) };
      if (remote) body.sha = remote.sha;
      const r = await psFetch(cfg, '/contents/' + PSYNC_FILE, { method: 'PUT', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } });
      if (!r.ok) throw new Error(r.status === 409 || r.status === 422 ? 'conflit, nouvel essai bientôt' : 'GitHub ' + r.status);
      psSetState({ sha: (await r.json()).content.sha, hash: hLocal, last: Date.now() });
    }
    psStatus('☁️ Sauvegardé en ligne (dépôt privé, chiffré) · ' + new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }));
    return false;
  } catch (e) {
    psStatus('Sauvegarde en ligne impossible pour l\'instant (' + e.message + '). Nouvel essai automatique.');
    return false;
  } finally { psBusy = false; }
}
/** À l'ouverture de l'Espace professeur, toutes les 30 s tant qu'il est affiché, après une modification, et quand on quitte la page */
function profSyncStart() {
  if (psTimer) return;
  const tick = async () => { if (location.hash.startsWith('#/prof') && profOpen() && await profSync()) location.reload(); };
  tick();
  psTimer = setInterval(() => { if (document.visibilityState === 'visible') tick(); }, 30000);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden' && profOpen()) profSync(); });
}
function profSyncSoon() { clearTimeout(psSoon); psSoon = setTimeout(async () => { if (profOpen() && await profSync() && location.hash.startsWith('#/prof')) location.reload(); }, 2500); }
