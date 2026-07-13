# =====================================================================
# Lokaler Test-Server fuer das Tippspiel (kein Node/Python noetig)
# -----------------------------------------------------------------------
# Warum das noetig ist: Seit der Firebase-Anbindung nutzt die Webseite
# "Module" (fuer den Datenbank-Zugriff). Browser blockieren Module aus
# Sicherheitsgruenden, wenn man eine Datei per Doppelklick oeffnet
# (Adresse beginnt dann mit "file://"). Dieses Skript startet stattdessen
# einen winzigen lokalen Server (Adresse "http://localhost:5510/") -
# dort funktioniert alles normal.
#
# Bedienung: Einfach "Server-Starten.bat" doppelklicken (nicht diese
# .ps1-Datei direkt). Der Browser oeffnet sich automatisch. Zum Beenden
# einfach das schwarze Konsolenfenster schliessen.
# =====================================================================
$Port = 5510
$wurzel = $PSScriptRoot

$mime = @{
  ".html"="text/html; charset=utf-8"; ".css"="text/css; charset=utf-8";
  ".js"="application/javascript; charset=utf-8"; ".json"="application/json";
  ".png"="image/png"; ".jpg"="image/jpeg"; ".jpeg"="image/jpeg";
  ".svg"="image/svg+xml"; ".webp"="image/webp"; ".ico"="image/x-icon";
  ".txt"="text/plain; charset=utf-8"; ".woff"="font/woff"; ".woff2"="font/woff2";
  ".md"="text/markdown; charset=utf-8"
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
try {
  $listener.Start()
} catch {
  Write-Host "Konnte den Server nicht starten (Port $Port evtl. schon belegt)." -ForegroundColor Red
  Write-Host "Fehler: $($_.Exception.Message)"
  Read-Host "Enter druecken zum Beenden"
  exit
}

Write-Host "================================================================"
Write-Host " Tippspiel-Testserver laeuft!"
Write-Host " Adresse: http://localhost:$Port/"
Write-Host " Zum Beenden: dieses Fenster einfach schliessen."
Write-Host "================================================================"

Start-Process "http://localhost:$Port/"

while ($listener.IsListening) {
  try {
    $ctx = $listener.GetContext()
    $pfad = [System.Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath)
    if ($pfad.EndsWith("/")) { $pfad += "index.html" }
    $datei = Join-Path $wurzel ($pfad.TrimStart("/") -replace "/", "\")

    if ((Test-Path $datei -PathType Container)) { $datei = Join-Path $datei "index.html" }

    $voll = [System.IO.Path]::GetFullPath($datei)
    if (-not $voll.StartsWith($wurzel, [System.StringComparison]::OrdinalIgnoreCase)) {
      $ctx.Response.StatusCode = 403; $ctx.Response.Close(); continue
    }

    if (Test-Path $voll -PathType Leaf) {
      $bytes = [System.IO.File]::ReadAllBytes($voll)
      $erw = [System.IO.Path]::GetExtension($voll).ToLower()
      $ctx.Response.ContentType = if ($mime.ContainsKey($erw)) { $mime[$erw] } else { "application/octet-stream" }
      $ctx.Response.ContentLength64 = $bytes.Length
      $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
    } else {
      $ctx.Response.StatusCode = 404
      $fehler = [System.Text.Encoding]::UTF8.GetBytes("404 - nicht gefunden: $pfad")
      $ctx.Response.OutputStream.Write($fehler, 0, $fehler.Length)
    }
    $ctx.Response.Close()
  } catch { }
}
