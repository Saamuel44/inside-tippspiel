/* =====================================================================
   INSIDE1911 TIPPSPIEL – DATEN & EINSTELLUNGEN
   ---------------------------------------------------------------------
   In dieser Datei kannst du ALLES anpassen, ohne den restlichen Code
   anzugreifen: Spiele, Kader, Gewinne, Admin-PIN, Demo-Daten.
   ===================================================================== */

const KONFIG = {
  // Admin-Zugang: Dieser Account bekommt automatisch den Admin-Bereich
  // (Ergebnisse eintragen + User-Verwaltung). Nur DU kommst hier rein.
  // Die Anmeldung läuft jetzt über ein ECHTES Firebase-Passwort (siehe
  // FIREBASE-SETUP.md) – das Passwort selbst steht NIRGENDS im Code,
  // du legst es direkt in der Firebase-Konsole fest.
  adminName: "Samuel",             // dein Anzeigename
  adminPlattform: "name",          // mit welcher Option du dich anmeldest
  adminEmail: "inside1911@gmx.at", // deine Admin-Anmeldung (Firebase Auth)

  // true  = Beispiel-Tipper werden in der Tabelle angezeigt (zum Testen)
  // false = nur echte angemeldete Nutzer
  demoDaten: false,

  // Minuten nach Anpfiff, nach denen ein Spiel automatisch als beendet
  // gilt (falls noch kein Ergebnis eingetragen wurde). Danach öffnet
  // automatisch die Tippabgabe für das nächste Spiel.
  spielDauerMinuten: 130,

  // Text, der bei gesperrten Spielen (keinTipp: true) über dem Spiel
  // angezeigt wird – z. B. bei Spielen gegen Salzburg.
  keinTippText: "Bei Spielen gegen Red Bull gibt es kein Tippspiel, der „FC Red Bull Salzburg“ hat keinen Platz in unserem Fussball.",
};

/* ---------------------------------------------------------------------
   WAPPEN – Vereinsname -> Bilddatei (Ordner assets/wappen/)
   ---------------------------------------------------------------------
   Bei den Spielen unten trägst du einfach den Vereinsnamen ein – das
   passende Wappen wird hier automatisch gefunden. Neues Team? Bild in
   assets/wappen/ legen und hier eine Zeile ergänzen.
   Salzburg nutzt bewusst das Red-Bull-Wappen. Fehlt ein Wappen, zeigt
   die Seite automatisch ein Ersatz mit Kürzel.
   ------------------------------------------------------------------ */
const WAPPEN = {
  "Austria Wien":      "assets/wappen/FK Austria Wien.png",
  "Red Bull":          "assets/wappen/red bull.png",
  "Salzburg":          "assets/wappen/red bull.png",
  "Red Bull Salzburg": "assets/wappen/red bull.png",
  "Sturm Graz":        "assets/wappen/Sturm Graz.png",
  "Rapid Wien":        "assets/wappen/Rapid Wien.png",
  "LASK":              "assets/wappen/LASK.png",
  "WAC":               "assets/wappen/WAC.png",
  "Wolfsberger AC":    "assets/wappen/WAC.png",
  "WSG Tirol":         "assets/wappen/WSG Tirol.png",
  "TSV Hartberg":      "assets/wappen/TSV Hartberg.png",
  "Hartberg":          "assets/wappen/TSV Hartberg.png",
  "SCR Altach":        "assets/wappen/Altach.png",
  "Altach":            "assets/wappen/Altach.png",
  "GAK":               "assets/wappen/GAK.png",
  "Grazer AK":         "assets/wappen/GAK.png",
  "SV Ried":           "assets/wappen/Ried.webp",
  "Ried":              "assets/wappen/Ried.webp",
  "Austria Lustenau":  "assets/wappen/Austria Lustenau.png",
  "Wiener Sport-Club":  "assets/wappen/WSC.svg",
  "Wiener Sportclub":   "assets/wappen/WSC.svg",
  "WSC":                "assets/wappen/WSC.svg",
};

/* ---------------------------------------------------------------------
   SPIELE
   ---------------------------------------------------------------------
   "heim" / "gast": einfach der Vereinsname (das Wappen wird automatisch
   über die WAPPEN-Liste oben gefunden). "Austria Wien" bitte genau so
   schreiben, damit das eigene Wappen erkannt wird.

   "anstoss": "2026-07-23T20:00:00"  (Jahr-Monat-Tag T Stunde:Minute).
   Die Tippabgabe schließt AUTOMATISCH mit dem Anstoß – danach öffnet
   das nächste Spiel von selbst.

   "ergebnis": bei kommenden Spielen null lassen. Trägst du nach Abpfiff
   am einfachsten im Admin-Bereich auf der Webseite ein.

   Der Plan startet – wie gewünscht – mit dem Conference-League-Quali-
   Spiel am 23.07.2026 (Testspiele davor weggelassen) und enthält die
   komplette Saison 2026/27 (Grunddurchgang, Stand fk-austria.at).

   NOCH OFFEN / bei Bekanntgabe bitte ergänzen:
   • CL-Quali-Gegner (Auslosung) + genaue CL-Anstoßzeiten (PLATZHALTER 20:00)
   • Bundesliga-Anstoßzeiten ab Runde 6 (Datum steht, Uhrzeit ist
     PLATZHALTER 17:00 – auf fk-austria.at noch nicht terminiert)
   • Meister-/Qualifikationsgruppe (Runde 23–32) und weitere Cup-/
     Europacup-Runden folgen, sobald sie feststehen.

   Uhrzeit ändern: einfach den Text bei "anstoss" anpassen. Die
   Tippabgabe schließt automatisch mit dem Anstoß.
   ------------------------------------------------------------------ */
const SPIELE = [
  // ---- Europacup-Quali & ÖFB-Cup ----
  { id: 101, heim: "Gegner offen",     gast: "Austria Wien",     bewerb: "Conference League", runde: "Quali · Hinspiel",  ort: "noch offen",                  anstoss: "2026-07-23T20:00:00", ergebnis: null }, // Zeit offen
  { id: 102, heim: "Wiener Sport-Club", gast: "Austria Wien",     bewerb: "ÖFB-Cup",           runde: "1. Runde",          ort: "Wiener Sport-Club-Platz, Wien", anstoss: "2026-07-26T18:00:00", ergebnis: null },
  { id: 103, heim: "Austria Wien",     gast: "Gegner offen",     bewerb: "Conference League", runde: "Quali · Rückspiel", ort: "Generali-Arena, Wien",        anstoss: "2026-07-30T20:00:00", ergebnis: null }, // Zeit offen

  // ---- Bundesliga Grunddurchgang ----
  { id: 104, heim: "WAC",              gast: "Austria Wien",     bewerb: "Bundesliga", runde: "Runde 1",  ort: "Auswärts",             anstoss: "2026-08-02T17:00:00", ergebnis: null },
  { id: 105, heim: "Austria Wien",     gast: "LASK",             bewerb: "Bundesliga", runde: "Runde 2",  ort: "Generali-Arena, Wien", anstoss: "2026-08-09T19:00:00", ergebnis: null },
  { id: 106, heim: "TSV Hartberg",     gast: "Austria Wien",     bewerb: "Bundesliga", runde: "Runde 3",  ort: "Auswärts",             anstoss: "2026-08-16T17:00:00", ergebnis: null },
  { id: 107, heim: "Austria Wien",     gast: "WSG Tirol",        bewerb: "Bundesliga", runde: "Runde 4",  ort: "Generali-Arena, Wien", anstoss: "2026-08-23T17:00:00", ergebnis: null },
  { id: 108, heim: "Red Bull",         gast: "Austria Wien",     bewerb: "Bundesliga", runde: "Runde 5",  ort: "Auswärts",             anstoss: "2026-08-30T19:00:00", ergebnis: null, keinTipp: true }, // gegen Red Bull kein Tippspiel
  { id: 109, heim: "Austria Wien",     gast: "Austria Lustenau", bewerb: "Bundesliga", runde: "Runde 6",  ort: "Generali-Arena, Wien", anstoss: "2026-09-11T17:00:00", ergebnis: null }, // Zeit offen
  { id: 110, heim: "GAK",              gast: "Austria Wien",     bewerb: "Bundesliga", runde: "Runde 7",  ort: "Auswärts",             anstoss: "2026-09-18T17:00:00", ergebnis: null }, // Zeit offen
  { id: 111, heim: "Austria Wien",     gast: "Sturm Graz",       bewerb: "Bundesliga", runde: "Runde 8",  ort: "Generali-Arena, Wien", anstoss: "2026-10-10T17:00:00", ergebnis: null }, // Zeit offen
  { id: 112, heim: "SV Ried",          gast: "Austria Wien",     bewerb: "Bundesliga", runde: "Runde 9",  ort: "Auswärts",             anstoss: "2026-10-16T17:00:00", ergebnis: null }, // Zeit offen
  { id: 113, heim: "Altach",           gast: "Austria Wien",     bewerb: "Bundesliga", runde: "Runde 10", ort: "Auswärts",             anstoss: "2026-10-23T17:00:00", ergebnis: null }, // Zeit offen
  { id: 114, heim: "Austria Wien",     gast: "Rapid Wien",       bewerb: "Bundesliga", runde: "Runde 11", ort: "Generali-Arena, Wien", anstoss: "2026-10-30T17:00:00", ergebnis: null }, // Zeit offen
  { id: 115, heim: "WSG Tirol",        gast: "Austria Wien",     bewerb: "Bundesliga", runde: "Runde 12", ort: "Auswärts",             anstoss: "2026-11-06T17:00:00", ergebnis: null }, // Zeit offen
  { id: 116, heim: "Austria Wien",     gast: "Red Bull",         bewerb: "Bundesliga", runde: "Runde 13", ort: "Generali-Arena, Wien", anstoss: "2026-11-21T17:00:00", ergebnis: null, keinTipp: true }, // gegen Red Bull kein Tippspiel, Zeit offen
  { id: 117, heim: "Austria Wien",     gast: "WAC",              bewerb: "Bundesliga", runde: "Runde 14", ort: "Generali-Arena, Wien", anstoss: "2026-11-27T17:00:00", ergebnis: null }, // Zeit offen
  { id: 118, heim: "Sturm Graz",       gast: "Austria Wien",     bewerb: "Bundesliga", runde: "Runde 15", ort: "Auswärts",             anstoss: "2026-12-04T17:00:00", ergebnis: null }, // Zeit offen
  { id: 119, heim: "LASK",             gast: "Austria Wien",     bewerb: "Bundesliga", runde: "Runde 16", ort: "Auswärts",             anstoss: "2026-12-11T17:00:00", ergebnis: null }, // Zeit offen
  { id: 120, heim: "Austria Wien",     gast: "GAK",              bewerb: "Bundesliga", runde: "Runde 17", ort: "Generali-Arena, Wien", anstoss: "2027-01-22T17:00:00", ergebnis: null }, // Zeit offen
  { id: 121, heim: "Rapid Wien",       gast: "Austria Wien",     bewerb: "Bundesliga", runde: "Runde 18", ort: "Auswärts",             anstoss: "2027-01-29T17:00:00", ergebnis: null }, // Zeit offen
  { id: 122, heim: "Austria Wien",     gast: "Altach",           bewerb: "Bundesliga", runde: "Runde 19", ort: "Generali-Arena, Wien", anstoss: "2027-02-05T17:00:00", ergebnis: null }, // Zeit offen
  { id: 123, heim: "Austria Wien",     gast: "TSV Hartberg",     bewerb: "Bundesliga", runde: "Runde 20", ort: "Generali-Arena, Wien", anstoss: "2027-02-12T17:00:00", ergebnis: null }, // Zeit offen
  { id: 124, heim: "Austria Lustenau", gast: "Austria Wien",     bewerb: "Bundesliga", runde: "Runde 21", ort: "Auswärts",             anstoss: "2027-02-20T17:00:00", ergebnis: null }, // Zeit offen
  { id: 125, heim: "Austria Wien",     gast: "SV Ried",          bewerb: "Bundesliga", runde: "Runde 22", ort: "Generali-Arena, Wien", anstoss: "2027-02-27T17:00:00", ergebnis: null }, // Zeit offen
];

/* ---------------------------------------------------------------------
   KADER für den Torschützenkönig-Tipp
   (Feldspieler der Kampfmannschaft, Stand 05.07.2026, fk-austria.at)
   ---------------------------------------------------------------------
   Bei Zu-/Abgängen im Transferfenster einfach hier anpassen.
   Format: { nr, name }. Tormänner sind bewusst nicht in der Liste.
   ------------------------------------------------------------------ */
const KADER = [
  // Abwehr
  { nr: 4,  name: "Jonas Feddersen" },
  { nr: 15, name: "Aleksandar Dragović" },
  { nr: 28, name: "Philipp Wiesinger" },
  { nr: 44, name: "Valentin Toifl" },
  { nr: 46, name: "Johannes Handl" },
  { nr: 60, name: "Dejan Radonjić" },
  // Mittelfeld
  { nr: 6,  name: "Philipp Maybach" },
  { nr: 7,  name: "Vasilije Marković" },
  { nr: 10, name: "Sanel Šaljić" },
  { nr: 16, name: "Kang Hee Lee" },
  { nr: 17, name: "Taeseok Lee" },
  { nr: 21, name: "Matteo Schablas" },
  { nr: 22, name: "Florian Wustinger" },
  { nr: 26, name: "Reinhold Ranftl" },
  { nr: 30, name: "Manfred Fischer" },
  { nr: 33, name: "Marijan Österreicher" },
  { nr: 37, name: "Moritz Wels" },
  { nr: 40, name: "Daniel Nnodim" },
  { nr: 70, name: "Dominik Nisandzic" },
  // Angriff
  { nr: 9,  name: "Noah Botić" },
  { nr: 11, name: "Manprit Sarkaria" },
  { nr: 14, name: "Kelvin Boateng" },
  { nr: 19, name: "Johannes Eggestein" },
  { nr: 20, name: "Julian Hettwer" },
  { nr: 47, name: "Abdoulaye Kanté" },
  { nr: 74, name: "Hasan Deshishku" },
];

/* ---------------------------------------------------------------------
   BONUS-TIPPS
   ---------------------------------------------------------------------
   Saison-Fragen. Pro richtige Antwort gibt es 3 Punkte. Tippbar bis zum
   ersten Spiel (wie der Torschützenkönig). Am Saisonende trägst du die
   richtige Antwort im Admin-Bereich ein.

   Neue Frage? Einfach einen Eintrag ergänzen: eindeutige "id", die
   "frage" und die Auswahlmöglichkeiten "optionen" (Dropdown).
   ------------------------------------------------------------------ */
const BONUS_FRAGEN = [
  {
    id: "platzierung",
    frage: "Welchen Platz belegt die Austria am Ende der Bundesliga-Saison 2026/27?",
    optionen: ["1. Platz", "2. Platz", "3. Platz", "4. Platz", "5. Platz", "6. Platz",
               "7. Platz", "8. Platz", "9. Platz", "10. Platz", "11. Platz", "12. Platz"],
  },
  // Weitere Fragen folgen – hier einfach ergänzen.
];

/* ---------------------------------------------------------------------
   GEWINNE
   ---------------------------------------------------------------------
   bild:         Foto vom Gewinn        -> Ordner assets/gewinne/
   sponsorLogo:  Logo des Sponsors      -> Ordner assets/sponsoren/
   Fehlende Bilder werden automatisch durch eine schöne
   Platzhalter-Grafik ersetzt.
   ------------------------------------------------------------------ */
const GEWINNE = [
  {
    platz: 1,
    titel: "ballesterer Jahresabo",
    beschreibung: "Details zum Gewinn folgen in Kürze.",
    bild: "assets/gewinne/platz1.jpg",
    sponsorName: "",
    sponsorLogo: "assets/sponsoren/sponsor1.png",
    sponsorLink: "",
  },
  {
    platz: 2,
    titel: "Austria Wien Heimtrikot 2026/27",
    beschreibung: "Details zum Gewinn folgen in Kürze.",
    bild: "assets/gewinne/platz2.jpg",
    sponsorName: "",
    sponsorLogo: "assets/sponsoren/sponsor2.png",
    sponsorLink: "",
  },
  {
    platz: 3,
    titel: "Dritter Platz",
    beschreibung: "Details zum Gewinn folgen in Kürze.",
    bild: "assets/gewinne/platz3.jpg",
    sponsorName: "",
    sponsorLogo: "assets/sponsoren/sponsor3.png",
    sponsorLink: "",
  },
];

/* ---------------------------------------------------------------------
   DEMO-TIPPER (nur sichtbar, solange KONFIG.demoDaten = true)
   ------------------------------------------------------------------ */
const DEMO_TIPPER = [
  { name: "ViolaFan1911",   plattform: "instagram", torschuetze: "Johannes Eggestein", tipps: { 1: [[0, 2], [1, 2]], 2: [[0, 3], [1, 4]] } },
  { name: "Veilchen_Wien",  plattform: "asb",       torschuetze: "Noah Botić",         tipps: { 1: [[1, 2], [0, 1]], 2: [[0, 2], [1, 3]] } },
  { name: "Max Mustermann", plattform: "name",      torschuetze: "Manprit Sarkaria",   tipps: { 1: [[0, 1], [1, 1]], 2: [[1, 2], [0, 2]] } },
  { name: "FAK.Forever",    plattform: "facebook",  torschuetze: "Johannes Eggestein", tipps: { 1: [[0, 2], [1, 3]], 2: [[0, 4], [1, 2]] } },
  { name: "Osttribuene",    plattform: "instagram", torschuetze: "Julian Hettwer",     tipps: { 1: [[1, 1], [0, 2]], 2: [[0, 2], [2, 2]] } },
  { name: "Violetter1911",  plattform: "asb",       torschuetze: "Vasilije Marković",  tipps: { 1: [[0, 1], [2, 2]], 2: [[1, 3], [0, 3]] } },
  { name: "Anna Beispiel",  plattform: "name",      torschuetze: "Kelvin Boateng",     tipps: { 1: [[1, 2], [0, 3]], 2: [[1, 2], [0, 1]] } },
  { name: "Favoritner_82",  plattform: "facebook",  torschuetze: "Noah Botić",         tipps: { 1: [[0, 2], [1, 1]], 2: [[0, 1], [2, 2]] } },
];
