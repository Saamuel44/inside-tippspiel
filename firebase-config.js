/* =====================================================================
   FIREBASE-KONFIGURATION
   -----------------------------------------------------------------------
   Diese Werte bekommst du beim Einrichten deines (kostenlosen) Firebase-
   Projekts – siehe FIREBASE-SETUP.md für die komplette Anleitung.

   Fundort in der Firebase-Konsole:
   Projekteinstellungen (Zahnrad oben links) → ganz unten "Deine Apps"
   → Web-App hinzufügen (</> Symbol) → der angezeigte Code enthält
   genau diese Werte zum Reinkopieren.

   WICHTIG: Diese Werte sind NICHT geheim. Bei Firebase ist es so
   vorgesehen, dass diese Konfiguration öffentlich im Quellcode steht –
   sie identifiziert nur DEIN Projekt, ist aber kein Passwort. Der
   eigentliche Schutz läuft über die Firestore-Sicherheitsregeln
   (firestore.rules) und deine echte Admin-Anmeldung mit E-Mail +
   Passwort, nicht über Geheimhaltung dieser Datei.
   ===================================================================== */
export const firebaseConfig = {
  apiKey: "AIzaSyAWBcAB3TxCaOA9W53XxuyPh5R6LuuFqng",
  authDomain: "inside-tippspiel.firebaseapp.com",
  projectId: "inside-tippspiel",
  storageBucket: "inside-tippspiel.firebasestorage.app",
  messagingSenderId: "224251213968",
  appId: "1:224251213968:web:64cba9b26111223eb68015",
};
