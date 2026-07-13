# Firebase einrichten (einmalig, ca. 10–15 Minuten, kostenlos)

Damit alle Tipper dieselbe Tabelle sehen und nur DU als Admin Ergebnisse
eintragen kannst, braucht die Seite eine kleine, kostenlose Datenbank
(Firebase Firestore von Google). Diese Anleitung führt dich einmal
komplett durch – danach läuft alles automatisch.

## 1. Firebase-Projekt erstellen

1. Gehe zu [console.firebase.google.com](https://console.firebase.google.com)
   und melde dich mit einem Google-Konto an.
2. **Projekt hinzufügen** → Namen eingeben, z. B. `inside1911-tippspiel`.
3. Google Analytics kannst du bei der Abfrage **deaktivieren** (brauchen
   wir nicht) → **Projekt erstellen**.

## 2. Firestore-Datenbank anlegen

1. Im Menü links: **Build → Firestore Database** → **Datenbank erstellen**.
2. Standort wählen: `eur3 (europe-west)` (Frankfurt) ist eine gute Wahl.
3. Modus: **Produktionsmodus** auswählen → **Erstellen**.

## 3. Sicherheitsregeln einfügen

1. In der Firestore-Ansicht oben auf den Tab **Regeln (Rules)**.
2. Den kompletten Inhalt der Datei [`firestore.rules`](firestore.rules)
   aus diesem Ordner hineinkopieren (den bestehenden Text ersetzen).
3. **Veröffentlichen** klicken.

## 4. Admin-Anmeldung aktivieren

1. Im Menü links: **Build → Authentication** → **Los geht's**.
2. Bei den Anbietern **E-Mail/Passwort** auswählen → aktivieren → Speichern.
3. Tab **Users** → **Nutzer hinzufügen**.
4. E-Mail: genau `inside1911@gmx.at` (muss exakt mit `adminEmail` in
   `data.js` übereinstimmen).
5. Passwort: **dein eigenes, sicheres Passwort** – frei wählbar, steht
   nirgends im Code, nur du kennst es.
6. **Nutzer hinzufügen** klicken. Fertig – das ist ab jetzt deine
   Admin-Anmeldung auf der Webseite (Name "Samuel" → Passwort-Feld
   erscheint automatisch).

## 5. Web-App registrieren & Konfiguration holen

1. Zurück zur **Projektübersicht** (Zahnrad oben links → Projekteinstellungen).
2. Ganz unten bei "Deine Apps" auf das Symbol **`</>`** (Web) klicken.
3. Spitzname eingeben (z. B. `tippspiel-web`) → **App registrieren**
   (Firebase Hosting NICHT nötig, das können wir überspringen).
4. Es erscheint ein Code-Block mit `const firebaseConfig = {...}`.
5. Öffne die Datei [`firebase-config.js`](firebase-config.js) in diesem
   Ordner und ersetze die 6 Platzhalter-Werte durch die echten Werte aus
   diesem Code-Block (apiKey, authDomain, projectId, storageBucket,
   messagingSenderId, appId).
6. Speichern.

**Das war's!** Diese Werte sind nicht geheim – sie dürfen so im
öffentlichen Quellcode auf GitHub stehen (siehe Erklärung direkt in der
Datei `firebase-config.js`).

## 6. Testen

1. Öffne die Seite (lokal oder nach dem GitHub-Pages-Deploy).
2. Melde dich mit deinem Namen "Samuel" an → es erscheint das
   Passwort-Feld → gib das Passwort aus Schritt 4 ein.
3. Du solltest eingeloggt sein und den Admin-Bereich sehen.
4. Melde dich ab und probiere eine normale Anmeldung (z. B. mit
   Instagram + Testname + PIN) – auch das sollte funktionieren.

## Kosten

Der kostenlose "Spark"-Plan reicht für dieses Projekt locker aus
(50.000 Lesevorgänge und 20.000 Schreibvorgänge **pro Tag**, gratis,
keine Kreditkarte nötig) – für eine Fangruppe mit ein paar Dutzend oder
auch ein paar hundert Leuten wird das nicht überschritten.

## Bekannte Einschränkung

Der PIN eines normalen Users ist als Hash in der Datenbank gespeichert
und öffentlich lesbar (nötig, damit der Login ohne eigenes Backend
funktioniert). Da PINs nur 4-stellig sind, könnte ein technisch versierter
Mensch theoretisch offline alle 10.000 Kombinationen gegen einen
öffentlichen Hash durchprobieren. Für ein Hobby-Tippspiel unter
Fangruppen-Mitgliedern ist das ein vertretbares Risiko – für "echte"
Konten mit sensiblen Daten wäre das nicht ausreichend. Deine eigene
Admin-Anmeldung ist davon **nicht** betroffen – die läuft über echtes
Firebase-Auth-Passwort, das niemand einsehen oder erraten kann.
