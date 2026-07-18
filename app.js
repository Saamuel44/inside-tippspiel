/* =====================================================================
   INSIDE1911 TIPPSPIEL – LOGIK
   (Spiele/Kader/Gewinne änderst du in data.js – hier musst du nichts anpassen)

   Datenbank: Firebase Firestore (kostenlos, siehe FIREBASE-SETUP.md).
   Alle Tipps/User/Ergebnisse liegen jetzt in einer echten, gemeinsamen
   Datenbank statt im Browser-Speicher – jeder sieht dieselbe Tabelle,
   egal von welchem Gerät aus.
   ===================================================================== */

"use strict";

/* ---------- Firebase (Modul-Importe, keine Installation nötig) ---------- */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore, doc, getDoc, setDoc, updateDoc, deleteDoc, deleteField,
  collection, onSnapshot,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { firebaseConfig } from "./firebase-config.js";

let db = null, auth = null;
try {
  const firebaseApp = initializeApp(firebaseConfig);
  db = getFirestore(firebaseApp);
  auth = getAuth(firebaseApp);
} catch (e) {
  firebaseFehlerAnzeigen("Firebase konnte nicht gestartet werden: " + e.message);
}

function firebaseFehlerAnzeigen(text) {
  console.error(text);
  const el = document.getElementById("authLadenText");
  if (el) {
    el.innerHTML = `⚠️ Verbindung zur Datenbank fehlgeschlagen.<br><br>
      Ist <code>firebase-config.js</code> schon mit deinen echten Werten befüllt?
      Siehe <strong>FIREBASE-SETUP.md</strong>.<br><br><small>${text}</small>`;
  }
  document.getElementById("authLaden")?.classList.remove("versteckt");
}

/* ---------- Kleine Helfer ---------- */
const $  = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

// Einfacher Hash für den PIN (kein Klartext in der Datenbank)
function hashPin(pin) {
  let h = 5381;
  for (const z of String(pin)) h = ((h << 5) + h + z.charCodeAt(0)) | 0;
  return "p" + (h >>> 0).toString(36);
}

function escapeHTML(text) {
  const div = document.createElement("div");
  div.textContent = String(text ?? "");
  return div.innerHTML;
}

/* ---------- Plattform-Icons (inline SVG) ---------- */
const ICONS = {
  name: `<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" fill="#4a2583"/><path d="M4 20c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5" stroke="#4a2583" stroke-width="2.6" stroke-linecap="round"/></svg>`,
  instagram: `<svg viewBox="0 0 24 24" fill="none"><rect x="2.5" y="2.5" width="19" height="19" rx="5.5" stroke="#4a2583" stroke-width="2.2"/><circle cx="12" cy="12" r="4.4" stroke="#4a2583" stroke-width="2.2"/><circle cx="17.4" cy="6.6" r="1.5" fill="#4a2583"/></svg>`,
  facebook: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#4a2583"/><path d="M13.3 20v-6.1h2.1l.4-2.5h-2.5V9.8c0-.73.36-1.3 1.4-1.3h1.2V6.3c-.5-.07-1.2-.13-1.9-.13-2 0-3.3 1.2-3.3 3.4v1.8H8.6v2.5h2.1V20z" fill="#fff"/></svg>`,
  asb: `<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9.2" fill="#fff" stroke="#4a2583" stroke-width="1.8"/><path d="M12 6.6l2.9 2.1-1.1 3.4h-3.6L9.1 8.7z" fill="#4a2583"/><path d="M12 6.6V4M14.9 8.7l2.4-.8M13.8 12.1l1.9 2M10.2 12.1l-1.9 2M9.1 8.7l-2.4-.8" stroke="#4a2583" stroke-width="1.4" stroke-linecap="round"/></svg>`,
  mail: `<svg viewBox="0 0 24 24" fill="none"><rect x="2.5" y="4.5" width="19" height="15" rx="3" stroke="#4a2583" stroke-width="2.2"/><path d="M4 7l8 6 8-6" stroke="#4a2583" stroke-width="2.2" stroke-linecap="round"/></svg>`,
  schloss: `<svg viewBox="0 0 24 24" fill="none"><rect x="5" y="10.5" width="14" height="10" rx="2.5" fill="currentColor"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" stroke="currentColor" stroke-width="2.2" fill="none"/></svg>`,
};
const PLATTFORM_NAMEN = {
  name: "Name", instagram: "Instagram", facebook: "Facebook", asb: "austriansoccer Board",
};

document.querySelectorAll(".plattform-icon[data-icon]").forEach((el) => {
  el.innerHTML = ICONS[el.dataset.icon] || "";
});

/* =====================================================================
   DATENZUGRIFF (Firestore)
   ---------------------------------------------------------------------
   nutzerListe / ERGEBNIS_OVERRIDES / TSK_AKTUELL / BONUS_LOESUNGEN_AKTUELL
   sind "lebende" Kopien der Datenbank – sie werden über Firestore-
   Live-Listener automatisch aktuell gehalten. Der ganze Rest der Seite
   (weiter unten) liest nur aus diesen Variablen, genau wie vorher bei
   localStorage – das Anzeigen/Berechnen musste dafür nicht verändert
   werden.
   ===================================================================== */
let nutzerListe = [];              // alle User-Dokumente (Tabelle, PIN-Check, Admin-Liste)
let ERGEBNIS_OVERRIDES = {};       // { spielId: {heim, gast} }
let TSK_AKTUELL = null;            // tatsächlicher Torschützenkönig der Saison
let BONUS_LOESUNGEN_AKTUELL = {};  // { frageId: richtigeAntwort }

let nutzerBereit = false, zustandBereit = false, introFertig = false;
let sessionId = localStorage.getItem("ts1911_session") || null; // reguläre User-Session (siehe Hinweis unten)
let adminEingeloggt = false; // wird über eine ECHTE Firebase-Anmeldung verifiziert

// Eindeutige, stabile Firestore-Dokument-ID aus Plattform + Name.
// Dadurch braucht es keine Liste/Suche für den Login – ein direkter
// Lookup genügt, und ein Name+Plattform kann nicht doppelt vergeben werden.
// Entfernt kombinierende Akzentzeichen (Unicode U+0300–U+036F) nach NFKD-Normalisierung,
// z. B. macht "Šaljić" -> "Saljic" für eine saubere, ASCII-sichere Dokument-ID.
const KOMBINIERENDE_AKZENTE = new RegExp(String.fromCharCode(91, 92, 117, 48, 51, 48, 48, 45, 92, 117, 48, 51, 54, 102, 93), "g");
function nutzerId(plattform, name) {
  const slug = String(name).trim().toLowerCase()
    .normalize("NFKD").replace(KOMBINIERENDE_AKZENTE, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return `${plattform}_${slug || "user" + Date.now().toString(36)}`;
}

function nutzerRef(id) { return doc(db, "nutzer", id); }
function zustandRef() { return doc(db, "zustand", "oeffentlich"); }

// Feste Dokument-ID deines Admin-Accounts (aus data.js). Wird auch genutzt,
// um alte Admin-Dokumente (z. B. nach einer Namensänderung) aufzuräumen.
const ADMIN_DOC_ID = nutzerId(KONFIG.adminPlattform || "name", KONFIG.adminName);

// Tipps liegen in Firestore als Array aus {heim,gast}-Objekten (Firestore
// mag keine verschachtelten Arrays), intern arbeiten wir weiter mit den
// gewohnten [heim, gast]-Paaren – diese zwei Funktionen wandeln um.
function tippsZuFirestore(tipps) {
  const out = {};
  for (const [spielId, paar] of Object.entries(tipps || {})) {
    out[spielId] = (paar || [null, null]).map((t) => (t ? { heim: t[0], gast: t[1] } : null));
  }
  return out;
}
function tippsVonFirestore(tipps) {
  const out = {};
  for (const [spielId, paar] of Object.entries(tipps || {})) {
    out[spielId] = (paar || [null, null]).map((t) => (t ? [t.heim, t.gast] : null));
  }
  return out;
}

function firestoreZuNutzer(id, data) {
  return {
    id,
    name: data.name,
    plattform: data.plattform,
    pin: data.pin || null,
    istAdmin: !!data.istAdmin,
    torschuetze: data.torschuetze || null,
    tipps: tippsVonFirestore(data.tipps),
    bonus: data.bonus || {},
  };
}

async function nutzerLaden(id) {
  const snap = await getDoc(nutzerRef(id));
  return snap.exists() ? firestoreZuNutzer(id, snap.data()) : null;
}

function nutzerSpeichern() { /* Kompatibilität: Schreiben läuft jetzt gezielt pro Feld, siehe Aufrufstellen */ }

function aktuellerNutzer() {
  if (adminEingeloggt) {
    return nutzerListe.find((n) => n.id === ADMIN_DOC_ID)
        || nutzerListe.find((n) => n.istAdmin) || null;
  }
  return nutzerListe.find((n) => n.id === sessionId) || null;
}

// Räumt alte Admin-Dokumente auf (z. B. den früheren "Samuel"-Account nach
// der Umbenennung). Nur der eingeloggte Admin darf das (Sicherheitsregeln).
async function alteAdminsAufraeumen() {
  if (!adminEingeloggt) return;
  const alte = nutzerListe.filter((n) => n.istAdmin && n.id !== ADMIN_DOC_ID);
  for (const n of alte) {
    try { await deleteDoc(nutzerRef(n.id)); } catch (e) { /* nächster Snapshot versucht es erneut */ }
  }
}

// Prüft, ob ein PIN noch frei ist (jede Zahlenkombi nur einmal, global).
function pinFrei(pin, ausser) {
  const hash = hashPin(pin);
  return !nutzerListe.some((n) => n.id !== ausser && n.pin === hash);
}

/* ---------- Live-Listener: User-Liste ---------- */
function nutzerListeStarten() {
  onSnapshot(
    collection(db, "nutzer"),
    (snap) => {
      nutzerListe = snap.docs.map((d) => firestoreZuNutzer(d.id, d.data()));
      nutzerBereit = true;
      alteAdminsAufraeumen();
      pruefeBereitschaft();
      if (aktuellerNutzer()) allesRendern();
    },
    (err) => firebaseFehlerAnzeigen("Userliste: " + err.message)
  );
}

/* ---------- Live-Listener: gemeinsamer Spielstand ---------- */
function zustandStarten() {
  onSnapshot(
    zustandRef(),
    (snap) => {
      const d = snap.exists() ? snap.data() : {};
      ERGEBNIS_OVERRIDES = d.ergebnisse || {};
      TSK_AKTUELL = d.torschuetzenkoenig || null;
      BONUS_LOESUNGEN_AKTUELL = d.bonusLoesungen || {};
      zustandBereit = true;
      pruefeBereitschaft();
      if (aktuellerNutzer()) allesRendern();
    },
    (err) => firebaseFehlerAnzeigen("Spielstand: " + err.message)
  );
}

nutzerListeStarten();
zustandStarten();

// Sicherheitsnetz: Reagiert Firestore (z. B. wegen Platzhalter-Werten in
// firebase-config.js) gar nicht erst mit einem Fehler, würde die Seite
// sonst endlos bei "Verbinde …" hängen bleiben. Nach 8 Sekunden ohne
// Erfolg zeigen wir stattdessen den Hinweis zur Einrichtung.
setTimeout(() => {
  if (!nutzerBereit || !zustandBereit) {
    firebaseFehlerAnzeigen("Zeitüberschreitung – keine Antwort von Firestore.");
  }
}, 8000);

/* ---------- Spiele inkl. Admin-Ergebnissen ---------- */
function alleSpiele() {
  return SPIELE
    .map((s) => ({ ...s, ergebnis: ERGEBNIS_OVERRIDES[s.id] ?? s.ergebnis }))
    .sort((a, b) => new Date(a.anstoss) - new Date(b.anstoss));
}

function istBeendet(spiel) {
  if (spiel.ergebnis) return true;
  const ende = new Date(spiel.anstoss).getTime() + KONFIG.spielDauerMinuten * 60000;
  return Date.now() > ende;
}

// Das erste noch nicht beendete Spiel = das aktuell offene Spiel.
// Tippbar nur bis zum Anstoß – danach automatisch gesperrt, und sobald
// es beendet ist, rückt automatisch das nächste Spiel nach.
function offenesSpiel(spiele) { return spiele.find((s) => !istBeendet(s)) || null; }
// Gesperrte Spiele (keinTipp, z. B. gegen Red Bull) sind nie tippbar.
function istTippbar(spiel) {
  return !spiel.keinTipp && Date.now() < new Date(spiel.anstoss).getTime();
}

function ersterAnstoss() {
  const spiele = alleSpiele();
  return spiele.length ? new Date(spiele[0].anstoss) : null;
}
function torschuetzeOffen() {
  const erster = ersterAnstoss();
  return erster ? Date.now() < erster.getTime() : true;
}

/* ---------- Punkte ---------- */
function tippRichtig(tipp, ergebnis) {
  return Array.isArray(tipp) && tipp.length === 2 &&
         Number(tipp[0]) === ergebnis.heim && Number(tipp[1]) === ergebnis.gast;
}

function aktuellerTorschuetzenkoenig() { return TSK_AKTUELL; }
function bonusLoesungen() { return BONUS_LOESUNGEN_AKTUELL; }

// 2 Tipps pro Spiel – ist mindestens einer exakt richtig: 1 Punkt.
// Maximal 1 Punkt pro Spiel. Zusätzlich je 3 Punkte für den richtig
// getippten Torschützenkönig und jede richtige Bonus-Antwort
// (sobald der Admin die richtige Lösung festgelegt hat).
function punkteFuerTipps(tipps, torschuetze, bonus) {
  let punkte = 0;
  for (const spiel of alleSpiele()) {
    if (!spiel.ergebnis) continue;
    const eigene = (tipps || {})[spiel.id];
    if (!eigene) continue;
    if (eigene.some((t) => t && tippRichtig(t, spiel.ergebnis))) punkte++;
  }
  const tsk = aktuellerTorschuetzenkoenig();
  if (tsk && torschuetze && torschuetze === tsk) punkte += 3;

  const loesungen = bonusLoesungen();
  for (const frage of BONUS_FRAGEN) {
    const richtig = loesungen[frage.id];
    if (richtig && bonus && bonus[frage.id] === richtig) punkte += frage.punkte || 3;
  }
  return punkte;
}

/* ---------- Formatierung ---------- */
const datumFormat = new Intl.DateTimeFormat("de-AT", {
  weekday: "short", day: "2-digit", month: "2-digit", year: "numeric",
});
const zeitFormat = new Intl.DateTimeFormat("de-AT", { hour: "2-digit", minute: "2-digit" });

function formatAnstoss(iso) {
  const d = new Date(iso);
  return `${datumFormat.format(d)} · ${zeitFormat.format(d)} Uhr`;
}

const datumKurzFormat = new Intl.DateTimeFormat("de-AT", {
  weekday: "short", day: "2-digit", month: "2-digit",
});
function formatDatumKurz(iso) {
  return datumKurzFormat.format(new Date(iso));
}

/* =====================================================================
   INTRO-ANIMATION → sobald Intro fertig UND Datenbank bereit: Anmeldung
   oder App zeigen
   ===================================================================== */
const reduzierteBewegung = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const INTRO_DAUER = reduzierteBewegung ? 150 : 1900;

setTimeout(() => {
  document.body.classList.remove("intro");
  introFertig = true;
  pruefeBereitschaft();
}, INTRO_DAUER);

function pruefeBereitschaft() {
  if (!introFertig) return;
  if (!nutzerBereit || !zustandBereit) {
    $("#authLaden")?.classList.remove("versteckt");
    return;
  }
  $("#authLaden")?.classList.add("versteckt");
  if (aktuellerNutzer()) appAnzeigen(false);
  else if ($("#app").classList.contains("versteckt")) $("#authOverlay").classList.remove("versteckt");
}

$("#heroWeiter").addEventListener("click", () => {
  if (aktuellerNutzer()) $("#hauptnav").scrollIntoView({ behavior: "smooth" });
  else if (nutzerBereit && zustandBereit) $("#authOverlay").classList.remove("versteckt");
});

/* =====================================================================
   FIREBASE AUTH – nur für den Admin-Zugang
   ===================================================================== */
function istAdminIdentitaet(plattform, name) {
  return plattform === (KONFIG.adminPlattform || "name") &&
         name.trim().toLowerCase() === KONFIG.adminName.trim().toLowerCase();
}

// Legt das Admin-Nutzerdokument und den gemeinsamen Zustand-Dokument
// beim allerersten Login an, falls sie noch nicht existieren.
async function adminDokumenteSicherstellen() {
  const id = nutzerId(KONFIG.adminPlattform || "name", KONFIG.adminName);
  const bestehend = await nutzerLaden(id);
  if (!bestehend) {
    await setDoc(nutzerRef(id), {
      name: KONFIG.adminName, plattform: KONFIG.adminPlattform || "name",
      pin: null, istAdmin: true,
      torschuetze: null, tipps: {}, bonus: {},
    });
  }
  await setDoc(zustandRef(), { ergebnisse: {}, torschuetzenkoenig: null, bonusLoesungen: {} }, { merge: true });
}

if (auth) {
  onAuthStateChanged(auth, async (user) => {
    const passt = user && user.email &&
      user.email.toLowerCase() === (KONFIG.adminEmail || "").toLowerCase();
    adminEingeloggt = !!passt;
    if (passt) {
      try { await adminDokumenteSicherstellen(); } catch (e) { firebaseFehlerAnzeigen("Admin-Setup: " + e.message); }
      if (introFertig && nutzerBereit && zustandBereit) {
        $("#authOverlay").classList.add("versteckt");
        appAnzeigen(true);
      }
    }
  });
}

/* =====================================================================
   ANMELDUNG
   ===================================================================== */
let gewaehltePlattform = null;
let wartenderNutzer = null;   // bestehender Nutzer, der seinen PIN eingeben muss
let pinNeuFuer = null;        // bestehender Nutzer, der einen NEUEN PIN setzt (nach Reset)

$$(".plattform-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    $$(".plattform-btn").forEach((b) => b.classList.remove("gewaehlt"));
    btn.classList.add("gewaehlt");
    gewaehltePlattform = btn.dataset.plattform;
    authFehler("");
  });
});

function authFehler(text) { $("#authFehler").textContent = text; }

function authSchrittZeigen(schritt) {
  $("#authSchritt1").classList.toggle("versteckt", schritt !== 1);
  $("#authSchritt2neu").classList.toggle("versteckt", schritt !== "neu");
  $("#authSchritt2pin").classList.toggle("versteckt", schritt !== "pin");
  $("#authSchrittAdmin").classList.toggle("versteckt", schritt !== "admin");
  authFehler("");
}

$("#authWeiter").addEventListener("click", async () => {
  const name = $("#authName").value.trim();
  if (!gewaehltePlattform) return authFehler("Bitte wähle zuerst eine Option aus.");
  if (name.length < 2)     return authFehler("Bitte gib deinen Namen ein (mind. 2 Zeichen).");

  if (istAdminIdentitaet(gewaehltePlattform, name)) {
    authSchrittZeigen("admin");
    $("#authAdminPasswort").value = "";
    $("#authAdminPasswort").focus();
    return;
  }

  const btn = $("#authWeiter");
  btn.disabled = true;
  try {
    const id = nutzerId(gewaehltePlattform, name);
    const vorhanden = await nutzerLaden(id);

    if (vorhanden) {
      if (vorhanden.pin) {
        wartenderNutzer = vorhanden;
        $("#authBekannterName").textContent = vorhanden.name;
        authSchrittZeigen("pin");
        $("#authPinAbfrage").value = "";
        $("#authPinAbfrage").focus();
      } else {
        pinNeuFuer = vorhanden;
        authSchrittZeigen("neu");
        $("#authPinNeu").value = "";
        $("#authPinNeu").focus();
      }
    } else {
      pinNeuFuer = null;
      authSchrittZeigen("neu");
      $("#authPinNeu").value = "";
      $("#authPinNeu").focus();
    }
  } catch (e) {
    authFehler("Verbindung fehlgeschlagen – bitte versuch es nochmal.");
  } finally {
    btn.disabled = false;
  }
});

$("#authName").addEventListener("keydown", (e) => { if (e.key === "Enter") $("#authWeiter").click(); });

// PIN festlegen: verpflichtend, 4 Ziffern, jede Kombination nur einmal
$("#authStart").addEventListener("click", async () => {
  const pin = $("#authPinNeu").value.trim();
  if (!/^\d{4}$/.test(pin)) return authFehler("Bitte einen 4-stelligen PIN eingeben (nur Ziffern).");

  const eigeneId = pinNeuFuer ? pinNeuFuer.id : null;
  if (!pinFrei(pin, eigeneId))
    return authFehler("Dieser PIN ist schon vergeben – bitte wähle einen anderen.");

  const btn = $("#authStart");
  btn.disabled = true;
  try {
    if (pinNeuFuer) {
      await updateDoc(nutzerRef(pinNeuFuer.id), { pin: hashPin(pin) });
      einloggen(pinNeuFuer.id);
    } else {
      const name = $("#authName").value.trim();
      const id = nutzerId(gewaehltePlattform, name);
      await setDoc(nutzerRef(id), {
        name, plattform: gewaehltePlattform, pin: hashPin(pin),
        istAdmin: false, torschuetze: null, tipps: {}, bonus: {},
      });
      einloggen(id);
    }
  } catch (e) {
    authFehler("Speichern fehlgeschlagen – bitte versuch es nochmal.");
  } finally {
    btn.disabled = false;
  }
});

$("#authZurueckNeu").addEventListener("click", () => { pinNeuFuer = null; authSchrittZeigen(1); });

$("#authPinOk").addEventListener("click", () => {
  const pin = $("#authPinAbfrage").value.trim();
  if (!wartenderNutzer) return authSchrittZeigen(1);
  if (hashPin(pin) !== wartenderNutzer.pin) return authFehler("Falscher PIN – bitte versuch es nochmal.");
  einloggen(wartenderNutzer.id);
});

$("#authAdminOk").addEventListener("click", async () => {
  const pw = $("#authAdminPasswort").value;
  if (!pw) return authFehler("Bitte Passwort eingeben.");
  const btn = $("#authAdminOk");
  btn.disabled = true;
  try {
    await signInWithEmailAndPassword(auth, KONFIG.adminEmail, pw);
    // onAuthStateChanged (oben) übernimmt den Rest der Anmeldung
  } catch (e) {
    authFehler("Falsches Passwort oder Verbindungsfehler.");
  } finally {
    btn.disabled = false;
  }
});

$("#authPinAbfrage").addEventListener("keydown", (e) => { if (e.key === "Enter") $("#authPinOk").click(); });
$("#authPinNeu").addEventListener("keydown", (e) => { if (e.key === "Enter") $("#authStart").click(); });
$("#authAdminPasswort").addEventListener("keydown", (e) => { if (e.key === "Enter") $("#authAdminOk").click(); });

$("#authZurueck").addEventListener("click", () => { wartenderNutzer = null; authSchrittZeigen(1); });
$("#authZurueckAdmin").addEventListener("click", () => authSchrittZeigen(1));

function einloggen(id) {
  sessionId = id;
  localStorage.setItem("ts1911_session", id);
  $("#authOverlay").classList.add("versteckt");
  appAnzeigen(true);
}

$("#userChip").addEventListener("click", async () => {
  if (!confirm("Möchtest du dich abmelden?")) return;
  if (adminEingeloggt && auth) { try { await signOut(auth); } catch (e) { /* egal, wir laden eh neu */ } }
  sessionId = null;
  localStorage.removeItem("ts1911_session");
  location.reload();
});

/* =====================================================================
   APP ANZEIGEN & TABS
   ===================================================================== */
function appAnzeigen(hinscrollen) {
  const nutzer = aktuellerNutzer();
  if (!nutzer) return;

  $("#hauptnav").classList.remove("versteckt");
  $("#app").classList.remove("versteckt");
  $("#seitenfuss").classList.remove("versteckt");
  $(".nav-tab-admin").classList.toggle("versteckt", !nutzer.istAdmin);

  $("#userChipIcon").innerHTML = ICONS[nutzer.plattform] || ICONS.name;
  $("#userChipName").textContent = nutzer.name;

  allesRendern();

  if (hinscrollen) $("#hauptnav").scrollIntoView({ behavior: "smooth" });
}

$$(".nav-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    $$(".nav-tab").forEach((t) => t.classList.remove("aktiv"));
    tab.classList.add("aktiv");
    $$(".panel").forEach((p) => p.classList.remove("aktiv"));
    $("#panel-" + tab.dataset.panel).classList.add("aktiv");
    if (tab.dataset.panel === "tipps") zumAktuellenSpielScrollen();
  });
});

$$(".untertab").forEach((tab) => {
  tab.addEventListener("click", () => {
    $$(".untertab").forEach((t) => t.classList.remove("aktiv"));
    tab.classList.add("aktiv");
    $$(".untertab-panel").forEach((p) => p.classList.remove("aktiv"));
    $("#untertab-" + tab.dataset.untertab).classList.add("aktiv");
    if (tab.dataset.untertab === "spiele") zumAktuellenSpielScrollen();
  });
});

/* =====================================================================
   RENDER: SPIELE
   ===================================================================== */
// Team = Vereinsname (String). Wappen wird über die WAPPEN-Liste (data.js)
// gefunden. Austria bekommt eine Sonderklasse, damit nur der runde Teil
// des Wappens so groß ist wie die Gegner-Wappen (Sterne ragen darüber).
function teamWappen(name) { return WAPPEN[name] || null; }
function istAustria(name) { return name === "Austria Wien"; }
function teamKuerzel(name) {
  if (!name || name === "Gegner offen") return "?";
  return name.split(/[\s-]+/).filter(Boolean).map((w) => w[0]).join("").slice(0, 3).toUpperCase();
}

function wappenHTML(name, istHeim) {
  const austria = istAustria(name);
  const datei = teamWappen(name);
  const ersatz = `<div class="wappen-ersatz ${istHeim ? "" : "gast"}">${escapeHTML(teamKuerzel(name))}</div>`;
  const inneres = datei
    ? `<img class="wappen" src="${escapeHTML(datei)}" alt="${escapeHTML(name)}"
         onerror="this.outerHTML='${ersatz.replace(/'/g, "&#39;").replace(/"/g, "&quot;")}'">`
    : ersatz;
  return `<div class="wappen-box${austria ? " austria" : ""}">${inneres}</div>`;
}

function tippAnzeige(tipp) {
  return tipp && tipp.length === 2 ? `${tipp[0]}:${tipp[1]}` : "–";
}

// Kleines Wappen für die kompakten Listen-Zeilen (ohne Austria-Sonderlogik)
function miniWappenHTML(name) {
  const datei = teamWappen(name);
  const ersatz = `<span class="mm-ersatz">${escapeHTML(teamKuerzel(name))}</span>`;
  if (!datei) return ersatz;
  return `<img class="mm-crest" src="${escapeHTML(datei)}" alt="${escapeHTML(name)}"
            onerror="this.outerHTML='${ersatz.replace(/'/g, "&#39;").replace(/"/g, "&quot;")}'">`;
}

/* ---------- Große Tipp-Karte (mehrere Spiele können offen sein) ----------
   id-sicher: Statt fester IDs (#tippSpeichern etc.) werden Klassen mit
   data-spiel verwendet, damit mehrere Karten gleichzeitig funktionieren. */
function matchKarteHTML(spiel, opts = {}) {
  const nutzer = aktuellerNutzer();
  const eigene = (nutzer && nutzer.tipps ? nutzer.tipps[spiel.id] : null) || [null, null];
  const tippbar = istTippbar(spiel);

  const kopf = `
    <div class="match-kopf">
      <span class="bewerb-pill">${escapeHTML(spiel.bewerb)}</span>
      <span class="runde-text">${escapeHTML(spiel.runde)}</span>
    </div>`;

  const teams = `
    <div class="match-teams">
      <div class="mt-col">${wappenHTML(spiel.heim, true)}<span class="mt-name">${escapeHTML(spiel.heim)}</span></div>
      <div class="mt-mid">${spiel.ergebnis
        ? `<span class="mt-score">${spiel.ergebnis.heim}:${spiel.ergebnis.gast}</span>`
        : `<span class="mt-vs">:</span>`}</div>
      <div class="mt-col">${wappenHTML(spiel.gast, false)}<span class="mt-name">${escapeHTML(spiel.gast)}</span></div>
    </div>`;

  const meta = `<p class="match-meta">${escapeHTML(spiel.ort)} · ${formatAnstoss(spiel.anstoss)}</p>`;

  let unten;
  if (tippbar) {
    unten = `
      <div class="tipp-eingabe" data-spiel="${spiel.id}">
        <p class="tipp-caption">Deine 2 Tipps</p>
        <div class="tipp-grid">
          ${[0, 1].map((i) => `
            <input class="tipp-zahl" type="number" min="0" max="20" inputmode="numeric" data-spiel="${spiel.id}"
                   id="tipp-${spiel.id}-${i}-heim" value="${eigene[i] ? eigene[i][0] : ""}" aria-label="Tipp ${i + 1} Heim">
            <span class="tipp-colon">:</span>
            <input class="tipp-zahl" type="number" min="0" max="20" inputmode="numeric" data-spiel="${spiel.id}"
                   id="tipp-${spiel.id}-${i}-gast" value="${eigene[i] ? eigene[i][1] : ""}" aria-label="Tipp ${i + 1} Gast">`).join("")}
        </div>
        <button class="btn btn-primaer tipp-speichern-btn" data-spiel="${spiel.id}">Speichern</button>
        <p class="status-text tipp-status" data-spiel="${spiel.id}"></p>
        <p class="countdown tipp-countdown" data-spiel="${spiel.id}" data-anstoss="${spiel.anstoss}"></p>
      </div>`;
  } else if (spiel.ergebnis) {
    const richtig = eigene.some((t) => t && tippRichtig(t, spiel.ergebnis));
    unten = `
      <div class="tipp-gesperrt">
        <p class="tipp-gespeichert">Deine Tipps: <strong>${tippAnzeige(eigene[0])}</strong> · <strong>${tippAnzeige(eigene[1])}</strong></p>
        <p class="mm-badge ${richtig ? "ja" : "nein"}">${richtig ? "✓ 1 Punkt" : "0 Punkte"}</p>
      </div>`;
  } else {
    unten = `
      <div class="tipp-gesperrt">
        <div class="schloss-banner">${ICONS.schloss} Tippabgabe geschlossen – das Spiel läuft.</div>
        <p class="tipp-gespeichert">Deine Tipps: <strong>${tippAnzeige(eigene[0])}</strong> · <strong>${tippAnzeige(eigene[1])}</strong></p>
      </div>`;
  }

  return `
    <article class="match-aktuell${opts.klein ? " klein" : ""}"${opts.scrollId ? ' id="aktuellesSpiel"' : ""} data-spiel="${spiel.id}">
      ${kopf}${teams}${meta}${unten}
    </article>`;
}

/* ---------- Red-Bull-Wochenende: gesperrtes Spiel + Frauen-Ersatzspiel ---------- */
function redBullBlockHTML(spiel, istAktuell, nutzer) {
  const ersatz = spiel.ersatzId ? SPIELE.find((s) => s.id === spiel.ersatzId) : null;
  if (!ersatz) return keinTippKarteHTML(spiel, istAktuell);
  const ersatzMit = { ...ersatz, ergebnis: ERGEBNIS_OVERRIDES[ersatz.id] ?? ersatz.ergebnis };
  return `
    <div class="ersatz-paar"${istAktuell ? ' id="aktuellesSpiel"' : ""}>
      <div class="ep-links">${keinTippKarteHTML(spiel, false)}</div>
      <div class="ep-rechts">${matchKarteHTML(ersatzMit, { klein: true })}</div>
    </div>`;
}

/* ---------- Gesperrtes Spiel (z. B. gegen Red Bull): Schloss + Text ---------- */
function keinTippKarteHTML(spiel, istAktuell) {
  return `
    <article class="match-gesperrt${istAktuell ? "" : " klein"}" ${istAktuell ? 'id="aktuellesSpiel"' : ""} data-spiel="${spiel.id}">
      <div class="match-kopf">
        <span class="bewerb-pill">${escapeHTML(spiel.bewerb)}</span>
        <span class="runde-text">${escapeHTML(spiel.runde)}</span>
      </div>
      <div class="mg-teams">
        ${miniWappenHTML(spiel.heim)}
        <span class="mm-name">${escapeHTML(spiel.heim)}</span>
        <span class="mm-mid"><span class="mm-vs">:</span></span>
        <span class="mm-name r">${escapeHTML(spiel.gast)}</span>
        ${miniWappenHTML(spiel.gast)}
      </div>
      <div class="mg-sperre">
        <span class="mg-schloss">${ICONS.schloss}</span>
        <p class="mg-text">${escapeHTML(KONFIG.keinTippText || "Für dieses Spiel gibt es kein Tippspiel.")}</p>
      </div>
      <p class="match-meta">${escapeHTML(spiel.ort)} · ${formatDatumKurz(spiel.anstoss)}</p>
    </article>`;
}

/* ---------- Vergangene / kommende Spiele: kompakte Zeile ---------- */
function miniZeileHTML(spiel, status, nutzer) {
  const eigene = (nutzer.tipps || {})[spiel.id] || [null, null];
  let mitte, badge;

  if (status === "vergangen") {
    if (spiel.ergebnis) {
      mitte = `<span class="mm-score">${spiel.ergebnis.heim}:${spiel.ergebnis.gast}</span>`;
      const richtig = eigene.some((t) => t && tippRichtig(t, spiel.ergebnis));
      badge = richtig
        ? `<span class="mm-badge ja">✓ 1 Punkt</span>`
        : `<span class="mm-badge nein">0 Punkte</span>`;
    } else {
      mitte = `<span class="mm-vs">–</span>`;
      badge = `<span class="mm-badge">Ergebnis folgt</span>`;
    }
  } else {
    mitte = `<span class="mm-vs">:</span>`;
    const eigenerTipp = eigene[0] || eigene[1]
      ? `<span class="mm-badge tipp">Getippt: ${tippAnzeige(eigene[0])}${eigene[1] ? " · " + tippAnzeige(eigene[1]) : ""}</span>`
      : `<span class="mm-badge locked">${ICONS.schloss} gesperrt</span>`;
    badge = eigenerTipp;
  }

  return `
    <article class="match-mini ${status}" data-spiel="${spiel.id}">
      <div class="mm-teams">
        ${miniWappenHTML(spiel.heim)}
        <span class="mm-name">${escapeHTML(spiel.heim)}</span>
        <span class="mm-mid">${mitte}</span>
        <span class="mm-name r">${escapeHTML(spiel.gast)}</span>
        ${miniWappenHTML(spiel.gast)}
      </div>
      <div class="mm-foot">
        <span class="mm-meta">${escapeHTML(spiel.bewerb)} · ${escapeHTML(spiel.runde)} · ${formatDatumKurz(spiel.anstoss)}</span>
        ${badge}
      </div>
    </article>`;
}

// Spiele für die Liste (ohne Frauen-Ersatzspiele – die werden neben dem
// gesperrten Red-Bull-Spiel gezeigt).
function spieleFuerListe() { return alleSpiele().filter((s) => !s.istErsatz); }

// Ist ein Spiel gerade aktiv tippbar (große Karte)? Das offene Spiel und
// alle mit "tippOffen: true" (früh freigeschaltete) – bis zum Anpfiff.
function istAktivTippbar(spiel, offen) {
  if (spiel.keinTipp || !istTippbar(spiel)) return false;
  return spiel.tippOffen === true || (offen && spiel.id === offen.id);
}

function spieleRendern() {
  const nutzer = aktuellerNutzer();
  if (!nutzer) return;
  const spiele = spieleFuerListe();
  const offen = offenesSpiel(spiele);
  const vergangene = spiele.filter((s) => istBeendet(s));
  const rest = spiele.filter((s) => !istBeendet(s));

  let html = "";
  if (vergangene.length) {
    html += `<div class="mini-label">Bisher</div>`;
    html += vergangene.map((s) => s.keinTipp
      ? redBullBlockHTML(s, false, nutzer)
      : miniZeileHTML(s, "vergangen", nutzer)).join("");
  }

  let erste = true, kommendeLabel = false;
  const kommendeLabelEinmal = () => {
    if (!kommendeLabel) { html += `<div class="mini-label">Kommende Spiele</div>`; kommendeLabel = true; }
  };
  for (const s of rest) {
    const istOffenSlot = offen && s.id === offen.id;
    if (s.keinTipp) {
      if (!istOffenSlot) kommendeLabelEinmal();
      html += redBullBlockHTML(s, istOffenSlot, nutzer);
    } else if (istAktivTippbar(s, offen)) {
      html += matchKarteHTML(s, { scrollId: erste });
      erste = false;
    } else {
      kommendeLabelEinmal();
      html += miniZeileHTML(s, "gesperrt", nutzer);
    }
  }

  $("#spieleListe").innerHTML = html || `<p class="leere-liste">Noch keine Spiele eingetragen.</p>`;

  // Tipp wird per Speichern-Button abgegeben (alle offenen Karten)
  $$(".tipp-speichern-btn").forEach((btn) => {
    btn.addEventListener("click", () => tippsSichern(Number(btn.dataset.spiel)));
  });

  countdownAktualisieren();
}

function zumAktuellenSpielScrollen() {
  requestAnimationFrame(() => {
    const container = $("#spieleListe");
    const karte = $("#aktuellesSpiel");
    if (container && karte) {
      container.scrollTop = karte.offsetTop - container.offsetTop - 40;
    }
  });
}

/* Tipp speichern per Button. Zeigt kurz "Gespeichert ✓". */
let tippStatusTimer = null;

async function tippsSichern(spielId) {
  const nutzer = aktuellerNutzer();
  const spiel = alleSpiele().find((s) => s.id === spielId);
  if (!nutzer || !spiel) return;

  const status = $(`.tipp-status[data-spiel="${spielId}"]`);
  if (!istTippbar(spiel)) {
    if (status) status.textContent = "Die Tippabgabe ist bereits geschlossen.";
    spieleRendern();
    return;
  }

  const lies = (i, seite) => {
    const feld = $(`#tipp-${spielId}-${i}-${seite}`);
    if (!feld) return null;
    const wert = feld.value.trim();
    return wert === "" ? null : Math.max(0, Math.min(20, Number(wert)));
  };

  const tipps = [0, 1].map((i) => {
    const heim = lies(i, "heim"), gast = lies(i, "gast");
    return heim !== null && gast !== null ? [heim, gast] : null;
  });

  if (!tipps[0] && !tipps[1]) {
    if (status) status.textContent = "Bitte gib mindestens einen vollständigen Tipp ein.";
    return;
  }

  const neueTipps = { ...(nutzer.tipps || {}), [spielId]: tipps };
  if (status) status.textContent = "Speichert …";
  try {
    await updateDoc(nutzerRef(nutzer.id), { tipps: tippsZuFirestore(neueTipps) });
    if (status) {
      status.textContent = "Gespeichert ✓";
      clearTimeout(tippStatusTimer);
      tippStatusTimer = setTimeout(() => { status.textContent = ""; }, 2500);
    }
  } catch (e) {
    if (status) status.textContent = "Speichern fehlgeschlagen – bitte nochmal versuchen.";
  }
}

/* ---------- Countdown bis zum Anstoß (pro offener Karte) ---------- */
function countdownAktualisieren() {
  const els = $$(".tipp-countdown");
  if (!els.length) return;
  let abgelaufen = false;
  for (const el of els) {
    let rest = new Date(el.dataset.anstoss).getTime() - Date.now();
    if (rest <= 0) { abgelaufen = true; continue; }
    const t = Math.floor(rest / 86400000); rest %= 86400000;
    const h = Math.floor(rest / 3600000);  rest %= 3600000;
    const m = Math.floor(rest / 60000);    rest %= 60000;
    const s = Math.floor(rest / 1000);
    const teile = [];
    if (t > 0) teile.push(`${t} T`);
    teile.push(`${String(h).padStart(2, "0")} Std`, `${String(m).padStart(2, "0")} Min`, `${String(s).padStart(2, "0")} Sek`);
    el.textContent = `Tippabgabe endet in ${teile.join(" ")}`;
  }
  if (abgelaufen) spieleRendern(); // ein Spiel hat begonnen -> neu aufbauen
}

/* =====================================================================
   RENDER: BONUS-TIPPS (inkl. Torschützenkönig, je eigene Deadline)
   ===================================================================== */
// Ist eine Bonus-Frage noch tippbar? Eigene "frist" pro Frage, sonst
// bis zum ersten Spiel (wie der Torschützenkönig).
function bonusFrageOffen(frage) {
  if (frage.frist) return Date.now() < new Date(frage.frist).getTime();
  return torschuetzeOffen();
}
function fristText(offen, iso) {
  return offen ? `Tippbar bis: ${formatAnstoss(iso)}`
               : `Die Tippabgabe ist geschlossen (Deadline war am ${formatAnstoss(iso)}).`;
}

function bonusRendern() {
  const nutzer = aktuellerNutzer();
  if (!nutzer) return;
  const bonus = nutzer.bonus || {};

  // --- Torschützenkönig (Deadline: bis zum ersten Spiel) ---
  const tskOffen = torschuetzeOffen();
  const erster = ersterAnstoss();
  const tskBlock = `
    <div class="bonus-frage" data-tsk="1">
      <p class="bonus-text">Wer wird Torschützenkönig? Wer erzielt in der Saison 2026/27
         die meisten Tore für die Austria (Bundesliga, Cup, Conference League)?</p>
      <p class="deadline-text">${erster ? fristText(tskOffen, erster.toISOString()) : ""}</p>
      <select class="bonus-select" id="torschuetzeSelect" ${tskOffen ? "" : "disabled"}>
        <option value="">– Bitte Spieler wählen –</option>
        ${KADER.map((sp) => `<option value="${escapeHTML(sp.name)}" ${nutzer.torschuetze === sp.name ? "selected" : ""}>Nr. ${sp.nr} · ${escapeHTML(sp.name)}</option>`).join("")}
      </select>
      <p class="status-text" id="torschuetzeStatus">${nutzer.torschuetze ? "Dein Tipp: " + escapeHTML(nutzer.torschuetze) : ""}</p>
    </div>`;

  // --- Bonus-Fragen (je eigene Deadline) ---
  const fragenBlock = BONUS_FRAGEN.map((f) => {
    const gewaehlt = bonus[f.id] || "";
    const offen = bonusFrageOffen(f);
    return `
      <div class="bonus-frage">
        <p class="bonus-text">${escapeHTML(f.frage)}</p>
        <p class="deadline-text">${f.frist ? fristText(offen, f.frist) : ""}</p>
        <select class="bonus-select" data-frage="${escapeHTML(f.id)}" ${offen ? "" : "disabled"}>
          <option value="">– Bitte wählen –</option>
          ${f.optionen.map((o) => `<option value="${escapeHTML(o)}" ${gewaehlt === o ? "selected" : ""}>${escapeHTML(o)}</option>`).join("")}
        </select>
        <p class="status-text bonus-status" data-frage="${escapeHTML(f.id)}">${gewaehlt ? "Dein Tipp: " + escapeHTML(gewaehlt) : ""}</p>
      </div>`;
  }).join("");

  $("#bonusListe").innerHTML = tskBlock + fragenBlock;

  // Torschützenkönig speichern
  const tskSel = $("#torschuetzeSelect");
  if (tskSel) tskSel.addEventListener("change", () => torschuetzeSpeichern(tskSel.value));
  // Bonus-Fragen speichern
  $$("#bonusListe .bonus-select[data-frage]").forEach((sel) => {
    sel.addEventListener("change", () => bonusSpeichern(sel.dataset.frage, sel.value));
  });
}

let torschuetzeStatusTimer = null;
async function torschuetzeSpeichern(wahl) {
  const nutzer = aktuellerNutzer();
  if (!nutzer || !torschuetzeOffen()) { bonusRendern(); return; }
  if (!wahl) return;
  const status = $("#torschuetzeStatus");
  if (status) status.textContent = "Speichert …";
  try {
    await updateDoc(nutzerRef(nutzer.id), { torschuetze: wahl });
    if (status) {
      status.textContent = `Gespeichert ✓ – dein Tipp: ${wahl}`;
      clearTimeout(torschuetzeStatusTimer);
      torschuetzeStatusTimer = setTimeout(() => { status.textContent = `Dein Tipp: ${wahl}`; }, 2500);
    }
  } catch (e) {
    if (status) status.textContent = "Speichern fehlgeschlagen – bitte nochmal versuchen.";
  }
}

const bonusStatusTimer = {};
async function bonusSpeichern(frageId, wert) {
  const nutzer = aktuellerNutzer();
  const frage = BONUS_FRAGEN.find((f) => f.id === frageId);
  if (!nutzer || (frage && !bonusFrageOffen(frage))) { bonusRendern(); return; }
  if (!wert) return;
  const status = $(`#bonusListe .bonus-status[data-frage="${frageId}"]`);
  if (status) status.textContent = "Speichert …";
  try {
    const neuerBonus = { ...(nutzer.bonus || {}), [frageId]: wert };
    await updateDoc(nutzerRef(nutzer.id), { bonus: neuerBonus });
    if (status) {
      status.textContent = `Gespeichert ✓ – dein Tipp: ${wert}`;
      clearTimeout(bonusStatusTimer[frageId]);
      bonusStatusTimer[frageId] = setTimeout(() => { status.textContent = `Dein Tipp: ${wert}`; }, 2500);
    }
  } catch (e) {
    if (status) status.textContent = "Speichern fehlgeschlagen – bitte nochmal versuchen.";
  }
}

/* =====================================================================
   RENDER: TABELLE
   ===================================================================== */
function tabellenDaten() {
  // Alle echten Nutzer inkl. Admin (Samuel spielt selbst mit)
  const echte = nutzerListe
    .map((n) => ({ name: n.name, plattform: n.plattform, torschuetze: n.torschuetze,
                   punkte: punkteFuerTipps(n.tipps, n.torschuetze, n.bonus), id: n.id }));

  const demos = (KONFIG.demoDaten ? DEMO_TIPPER : [])
    .map((d) => ({ name: d.name, plattform: d.plattform, torschuetze: d.torschuetze,
                   punkte: punkteFuerTipps(d.tipps, d.torschuetze, d.bonus), id: null }));

  const alle = [...echte, ...demos].sort(
    (a, b) => b.punkte - a.punkte || a.name.localeCompare(b.name, "de")
  );

  // Gleiche Punkte = gleicher Platz
  let letztePunkte = null, letzterPlatz = 0;
  alle.forEach((eintrag, i) => {
    if (eintrag.punkte !== letztePunkte) { letzterPlatz = i + 1; letztePunkte = eintrag.punkte; }
    eintrag.platz = letzterPlatz;
  });
  return alle;
}

function tabelleRendern() {
  const suche = ($("#tabelleSuche").value || "").toLowerCase().trim();
  const daten = tabellenDaten().filter((e) => !suche || e.name.toLowerCase().includes(suche));
  const ich = aktuellerNutzer();

  $("#tabelleSpielerAnzahl").textContent = nutzerListe.length + " Spieler";

  $("#tabelleListe").innerHTML = daten.map((e) => `
    <li class="tab-zeile ${e.platz <= 3 ? "platz-" + e.platz : ""} ${ich && e.id === ich.id ? "ich" : ""}">
      <span class="tab-rang">${e.platz}</span>
      <span class="plattform-icon" title="${PLATTFORM_NAMEN[e.plattform] || ""}">${ICONS[e.plattform] || ICONS.name}</span>
      <span class="tab-info">
        <span class="tab-name">${escapeHTML(e.name)}${ich && e.id === ich.id ? '<span class="tab-du">Du</span>' : ""}</span>
        ${e.torschuetze ? `<span class="tab-tsk">👑 ${escapeHTML(e.torschuetze)}</span>` : ""}
      </span>
      <span class="tab-punkte">${e.punkte}<small>P</small></span>
    </li>`).join("") || `<p class="leere-liste">Niemanden mit diesem Namen gefunden.</p>`;
}

$("#tabelleSuche").addEventListener("input", tabelleRendern);
$("#userSuche").addEventListener("input", userVerwaltungRendern);

/* =====================================================================
   RENDER: GEWINNE
   ===================================================================== */
function gewinneRendern() {
  $("#gewinneListe").innerHTML = GEWINNE.map((g) => {
    // Sponsor-Zeile nur zeigen, wenn ein Sponsor eingetragen ist
    const sponsor = (g.sponsorName && g.sponsorName.trim())
      ? `<div class="sponsor-zeile">
          <img src="${escapeHTML(g.sponsorLogo)}" alt="${escapeHTML(g.sponsorName)}"
               onerror="this.outerHTML='<span class=&quot;sponsor-logo-ersatz&quot;>★</span>'">
          <span>Mit freundlicher Unterstützung von<br>
            ${g.sponsorLink
              ? `<a href="${escapeHTML(g.sponsorLink)}" target="_blank" rel="noopener">${escapeHTML(g.sponsorName)}</a>`
              : `<strong>${escapeHTML(g.sponsorName)}</strong>`}
          </span>
        </div>`
      : "";
    const link = (g.link && g.link.trim())
      ? `<a class="gewinn-link" href="${escapeHTML(g.link)}" target="_blank" rel="noopener">${escapeHTML(g.linkText || g.link)}</a>`
      : "";
    return `
    <article class="gewinn-karte platz-${g.platz}">
      <div class="gewinn-bild-wrap">
        <span class="gewinn-band">PLATZ ${g.platz}</span>
        <span class="gewinn-platzhalter">${g.platz === 1 ? "🏆" : g.platz === 2 ? "🥈" : g.platz === 3 ? "🥉" : "🎁"}</span>
        <img src="${escapeHTML(g.bild)}" alt="${escapeHTML(g.titel)}" onerror="this.remove()">
      </div>
      <div class="gewinn-text">
        <h3>${escapeHTML(g.titel)}</h3>
        ${g.beschreibung ? `<p>${escapeHTML(g.beschreibung)}</p>` : ""}
        ${link}
        ${sponsor}
      </div>
    </article>`;
  }).join("");
}

/* =====================================================================
   RENDER: ADMIN
   ===================================================================== */
function adminRendern() {
  const nutzer = aktuellerNutzer();
  if (!nutzer || !nutzer.istAdmin) return;

  $("#adminListe").innerHTML = alleSpiele().map((s) => `
    <div class="admin-zeile">
      <span class="admin-spielname">${escapeHTML(s.heim)} – ${escapeHTML(s.gast)}</span>
      <input class="tipp-zahl" type="number" min="0" max="20" data-spiel="${s.id}" id="admin-${s.id}-heim"
             value="${s.ergebnis ? s.ergebnis.heim : ""}" aria-label="Tore Heim">
      <span class="tipp-doppelpunkt">:</span>
      <input class="tipp-zahl" type="number" min="0" max="20" data-spiel="${s.id}" id="admin-${s.id}-gast"
             value="${s.ergebnis ? s.ergebnis.gast : ""}" aria-label="Tore Gast">
      <span class="admin-status" id="admin-status-${s.id}"></span>
      <span class="admin-datum">${escapeHTML(s.bewerb)} · ${escapeHTML(s.runde)} · ${formatAnstoss(s.anstoss)}</span>
    </div>`).join("");

  // Ergebnisse speichern automatisch beim Eintippen
  $$("#adminListe .tipp-zahl").forEach((feld) => {
    feld.addEventListener("input", () => adminAutoSpeichern(Number(feld.dataset.spiel)));
  });

  adminTorschuetzenkoenigRendern();
  adminTippsRendern();
  adminBonusRendern();
  userVerwaltungRendern();
}

/* ---------- Admin: Tipps aller User je Spiel einsehen ---------- */
function adminTippsRendern() {
  const select = $("#adminSpielSelect");
  if (!select) return;

  const spiele = alleSpiele();
  const vorherAusgewaehlt = select.value;
  select.innerHTML = spiele.map((s) =>
    `<option value="${s.id}">${escapeHTML(s.heim)} – ${escapeHTML(s.gast)} · ${formatAnstoss(s.anstoss)}</option>`
  ).join("") || `<option value="">– keine Spiele –</option>`;
  if (spiele.some((s) => String(s.id) === vorherAusgewaehlt)) select.value = vorherAusgewaehlt;

  adminTippsListeRendern();
}

function adminTippsListeRendern() {
  const container = $("#adminTippsListe");
  const select = $("#adminSpielSelect");
  if (!container || !select) return;

  const spielId = Number(select.value);
  const spiel = alleSpiele().find((s) => s.id === spielId);
  if (!spiel) {
    container.innerHTML = `<p class="leere-liste">Kein Spiel ausgewählt.</p>`;
    return;
  }

  const user = nutzerListe
    .filter((n) => !n.istAdmin)
    .sort((a, b) => a.name.localeCompare(b.name, "de"));

  container.innerHTML = user.map((u) => {
    const tipps = (u.tipps || {})[spiel.id] || [null, null];
    const formatTipp = (t) => (t && t[0] !== "" && t[0] != null ? `${t[0]}:${t[1]}` : "–");
    const richtig = spiel.ergebnis
      ? tipps.some((t) => t && tippRichtig(t, spiel.ergebnis))
      : false;
    return `
      <div class="admin-tipp-zeile${richtig ? " admin-tipp-richtig" : ""}">
        <span class="admin-tipp-name">${escapeHTML(u.name)}</span>
        <span class="admin-tipp-werte">${formatTipp(tipps[0])} &nbsp;/&nbsp; ${formatTipp(tipps[1])}</span>
      </div>`;
  }).join("") || `<p class="leere-liste">Noch keine angemeldeten User.</p>`;
}

$("#adminSpielSelect").addEventListener("change", adminTippsListeRendern);

/* ---------- Admin: tatsächlichen Torschützenkönig festlegen (3P) ---------- */
function adminTorschuetzenkoenigRendern() {
  const select = $("#adminTskSelect");
  if (!select) return;
  const aktuell = aktuellerTorschuetzenkoenig();
  select.innerHTML =
    `<option value="">– noch offen –</option>` +
    KADER.map((sp) => `<option value="${escapeHTML(sp.name)}" ${aktuell === sp.name ? "selected" : ""}>
       Nr. ${sp.nr} · ${escapeHTML(sp.name)}</option>`).join("");
}

let adminTskStatusTimer = null;
$("#adminTskSelect").addEventListener("change", async () => {
  const wahl = $("#adminTskSelect").value;
  const status = $("#adminTskStatus");
  status.textContent = "Speichert …";
  try {
    await updateDoc(zustandRef(), { torschuetzenkoenig: wahl || null });
    status.textContent = wahl ? `Gespeichert ✓ – ${wahl} (3 Punkte für richtige Tipps)` : "Zurückgesetzt ✓";
  } catch (e) {
    status.textContent = "Speichern fehlgeschlagen.";
  }
  clearTimeout(adminTskStatusTimer);
  adminTskStatusTimer = setTimeout(() => { status.textContent = ""; }, 2800);
});

/* ---------- Admin: richtige Bonus-Antworten festlegen (Punkte je Frage) ---------- */
function adminBonusRendern() {
  const container = $("#adminBonusListe");
  if (!container) return;
  const loesungen = bonusLoesungen();

  container.innerHTML = BONUS_FRAGEN.map((f) => {
    const richtig = loesungen[f.id] || "";
    return `
      <div class="bonus-frage">
        <p class="bonus-text">${escapeHTML(f.frage)}</p>
        <select class="bonus-select admin-bonus-select" data-frage="${escapeHTML(f.id)}">
          <option value="">– noch offen –</option>
          ${f.optionen.map((o) => `<option value="${escapeHTML(o)}" ${richtig === o ? "selected" : ""}>${escapeHTML(o)}</option>`).join("")}
        </select>
        <p class="status-text admin-bonus-status" data-frage="${escapeHTML(f.id)}"></p>
      </div>`;
  }).join("") || `<p class="leere-liste">Aktuell keine Bonus-Fragen.</p>`;

  $$("#adminBonusListe .admin-bonus-select").forEach((sel) => {
    sel.addEventListener("change", async () => {
      const status = $(`#adminBonusListe .admin-bonus-status[data-frage="${sel.dataset.frage}"]`);
      if (status) status.textContent = "Speichert …";
      try {
        const pfad = `bonusLoesungen.${sel.dataset.frage}`;
        await updateDoc(zustandRef(), { [pfad]: sel.value ? sel.value : deleteField() });
        if (status) status.textContent = sel.value ? `Gespeichert ✓ – ${sel.value} (3 Punkte für richtige Tipps)` : "Zurückgesetzt ✓";
      } catch (e) {
        if (status) status.textContent = "Speichern fehlgeschlagen.";
      }
      if (status) setTimeout(() => { status.textContent = ""; }, 2800);
    });
  });
}

/* ---------- Admin: Liste aller angemeldeten User + PIN-Reset ---------- */
function userVerwaltungRendern() {
  const nutzer = aktuellerNutzer();
  if (!nutzer || !nutzer.istAdmin) return;

  const suche = ($("#userSuche")?.value || "").toLowerCase().trim();
  // Alle echten User außer dem Admin selbst
  const user = nutzerListe
    .filter((n) => !n.istAdmin)
    .filter((n) => !suche || n.name.toLowerCase().includes(suche))
    .sort((a, b) => a.name.localeCompare(b.name, "de"));

  const gesamt = nutzerListe.filter((n) => !n.istAdmin).length;
  $("#userAnzahl").textContent = gesamt === 1 ? "1 User" : `${gesamt} User`;

  $("#userVerwaltung").innerHTML = user.map((u) => `
    <div class="user-zeile">
      <span class="plattform-icon" title="${PLATTFORM_NAMEN[u.plattform] || ""}">${ICONS[u.plattform] || ICONS.name}</span>
      <span class="user-zeile-name">${escapeHTML(u.name)}
        <small>${PLATTFORM_NAMEN[u.plattform] || ""}</small></span>
      <span class="user-pin-status ${u.pin ? "" : "offen"}">${u.pin ? "PIN gesetzt" : "PIN offen"}</span>
      <div class="user-aktionen">
        <button class="btn-reset" data-user="${u.id}">PIN zurücksetzen</button>
        <button class="btn-loeschen" data-user="${u.id}">Löschen</button>
      </div>
    </div>`).join("") ||
    `<p class="leere-liste">${gesamt === 0 ? "Noch keine angemeldeten User." : "Niemanden mit diesem Namen gefunden."}</p>`;

  $$("#userVerwaltung .btn-reset").forEach((btn) => {
    btn.addEventListener("click", () => pinZuruecksetzen(btn.dataset.user));
  });
  $$("#userVerwaltung .btn-loeschen").forEach((btn) => {
    btn.addEventListener("click", () => userLoeschen(btn.dataset.user));
  });
}

// User (z. B. Test-Account) endgültig löschen
async function userLoeschen(userId) {
  const u = nutzerListe.find((n) => n.id === userId);
  if (!u || u.istAdmin) return;
  if (!confirm(`"${u.name}" wirklich löschen? Alle Tipps dieses Users gehen verloren.`)) return;
  try {
    await deleteDoc(nutzerRef(userId));
  } catch (e) {
    alert("Löschen fehlgeschlagen: " + e.message);
  }
}

// PIN eines Users zurücksetzen: neuen PIN vergeben (oder leer = User legt beim
// nächsten Login selbst einen neuen fest). Jede Zahlenkombi bleibt eindeutig.
async function pinZuruecksetzen(userId) {
  const u = nutzerListe.find((n) => n.id === userId);
  if (!u) return;

  const eingabe = prompt(
    `Neuen 4-stelligen PIN für "${u.name}" festlegen.\n\n` +
    `• 4 Ziffern eingeben = neuer PIN (bitte dem User mitteilen)\n` +
    `• Leer lassen = PIN wird gelöscht, der User legt beim nächsten\n` +
    `  Login selbst einen neuen fest.`,
    ""
  );
  if (eingabe === null) return; // abgebrochen

  const pin = eingabe.trim();
  try {
    if (pin === "") {
      await updateDoc(nutzerRef(userId), { pin: null });
      alert(`Der PIN von "${u.name}" wurde gelöscht. Beim nächsten Login legt der User selbst einen neuen fest.`);
      return;
    }
    if (!/^\d{4}$/.test(pin)) return alert("Bitte genau 4 Ziffern eingeben.");
    if (!pinFrei(pin, u.id)) return alert("Dieser PIN ist schon vergeben – bitte einen anderen wählen.");

    await updateDoc(nutzerRef(userId), { pin: hashPin(pin) });
    alert(`Neuer PIN für "${u.name}": ${pin}\n\nBitte teile ihn dem User mit.`);
  } catch (e) {
    alert("Fehler beim Speichern: " + e.message);
  }
}

let adminSpeicherTimer = null;
function adminAutoSpeichern(spielId) {
  clearTimeout(adminSpeicherTimer);
  adminSpeicherTimer = setTimeout(async () => {
    const heim = $(`#admin-${spielId}-heim`).value.trim();
    const gast = $(`#admin-${spielId}-gast`).value.trim();
    const status = $(`#admin-status-${spielId}`);
    const pfad = `ergebnisse.${spielId}`;

    try {
      if (heim === "" && gast === "") {
        await updateDoc(zustandRef(), { [pfad]: deleteField() });
        status.textContent = "Entfernt ✓";
      } else if (heim !== "" && gast !== "") {
        await updateDoc(zustandRef(), { [pfad]: { heim: Number(heim), gast: Number(gast) } });
        status.textContent = "Gespeichert ✓";
      } else {
        status.textContent = "…"; // noch unvollständig
        return;
      }
    } catch (e) {
      status.textContent = "Speichern fehlgeschlagen.";
      return;
    }
    setTimeout(() => { if (status.textContent.includes("✓")) status.textContent = ""; }, 2500);
  }, 800);
}

/* =====================================================================
   ALLES RENDERN
   ===================================================================== */
function allesRendern() {
  spieleRendern();
  bonusRendern();
  tabelleRendern();
  gewinneRendern();
  adminRendern();
  zumAktuellenSpielScrollen();
}

setInterval(countdownAktualisieren, 1000); // Countdown im Sekundentakt
