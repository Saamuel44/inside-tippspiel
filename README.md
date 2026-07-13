# INSIDE1911 Tippspiel – Austria Wien

Tippspiel-Webseite für die INSIDE1911-Fangruppe. Reines HTML/CSS/JS,
kein Build-Prozess nötig – kann direkt als statische Seite gehostet werden.

## Veröffentlichen mit GitHub Pages

1. In GitHub Desktop: neues Repository aus diesem Ordner erstellen
   (**File → Add local repository** → diesen `tippspiel`-Ordner auswählen)
   und auf GitHub veröffentlichen ("Publish repository").
2. Auf GitHub.com im Repo zu **Settings → Pages**.
3. Bei **Source**: `Deploy from a branch` → Branch `main`, Ordner `/ (root)` → Save.
4. Nach 1–2 Minuten ist die Seite live unter
   `https://<dein-github-name>.github.io/<repo-name>/`.

Alle Pfade in der Seite sind relativ – sie funktioniert also egal ob im
Root eines Repos oder in einem Unterordner.

## Lokal testen (vor der Veröffentlichung)

**Wichtig:** `index.html` NICHT per Doppelklick öffnen – seit der
Firebase-Anbindung nutzt die Seite "Module", die Browser bei lokal
geöffneten Dateien (`file://…`) aus Sicherheitsgründen blockieren
(die Seite bleibt dann nach der Startanimation leer/unbedienbar).

Stattdessen **`Server-Starten.bat`** doppelklicken: Startet einen
kleinen lokalen Server und öffnet die Seite automatisch korrekt unter
`http://localhost:5510/`. Zum Beenden einfach das schwarze
Konsolenfenster schließen.

## ⚠️ Wichtig vor der Veröffentlichung

**Zuerst Firebase einrichten:** Die Seite braucht eine kostenlose Firebase-
Datenbank, damit alle Tipper dieselbe Tabelle sehen und nur du als Admin
Ergebnisse eintragen kannst. Folge dazu **[FIREBASE-SETUP.md](FIREBASE-SETUP.md)**
(einmalig, ca. 10–15 Minuten) – ohne diesen Schritt zeigt die Seite nur
einen Hinweis statt der App.

Damit ist gelöst, was vorher noch offen war:
- Dein Admin-Zugang läuft jetzt über ein **echtes Firebase-Passwort**, das
  du selbst in der Firebase-Konsole festlegst – es steht **nirgends** im
  Quellcode, niemand kann es im "Seitenquelltext anzeigen" finden.
- Tabelle, Tipps und angemeldete User liegen jetzt in einer **echten,
  gemeinsamen Datenbank** – alle sehen dieselbe Tabelle, egal von welchem
  Gerät aus.

Eine kleine, bewusst in Kauf genommene Einschränkung bleibt (normale PINs
sind 4-stellig und ihr Hash ist technisch einsehbar) – Details dazu ganz
unten in FIREBASE-SETUP.md.

## Ordnerstruktur

```
index.html            Hauptseite
style.css              Design
app.js                  Logik (Anmeldung, Tipps, Tabelle, Admin, Firebase-Anbindung)
data.js                 Spiele, Kader, Gewinne, Einstellungen – hier trägst du
                         Ergebnisse/Termine ein, wenn sie feststehen
firebase-config.js      Deine Firebase-Projekt-Zugangsdaten (siehe FIREBASE-SETUP.md)
firestore.rules         Sicherheitsregeln zum Einfügen in die Firebase-Konsole
FIREBASE-SETUP.md       Einmalige Einrichtungsanleitung
assets/
  logo.png, pokal.png, hintergrund.jpg, streifen.png   Marken-Grafiken
  wappen/            Vereinswappen (Dateiname → in data.js verknüpft)
  gewinne/           Fotos der Gewinne
  sponsoren/         Sponsorenlogos
  original/          Unkomprimierte Original-Dateien als Sicherung
                       (wird NICHT mit hochgeladen, siehe .gitignore)
```

## Noch offen (Stand siehe `data.js`)

- Conference-League-Quali-Gegner (Auslosung) + genaue Anstoßzeiten
- Einige Bundesliga-Anstoßzeiten (Datum steht, Uhrzeit ist Platzhalter)
- Gewinn-Fotos, Sponsorenlogos, Sponsor-Details
