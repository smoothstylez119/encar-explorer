# Encar Explorer

Lokale Web-App fuer den aktiven Encar-Katalog mit:

- serverseitigem Katalog-Sync aus der Encar-API
- lokaler SQLite-Datenbank
- deutscher Aufbereitung und manueller Uebersetzungsschicht
- optionaler Freitext-Uebersetzung ueber OpenAI oder DeepL
- EUR-Umrechnung auf Basis eines kostenlosen Wechselkurs-Feeds
- Detail-Hydration pro Fahrzeug
- Bild-Manifest und lokalem Bild-Cache

Die App ist bewusst so gebaut, dass sie auch dann schnell nutzbar ist, wenn erst ein Teil des Gesamtkatalogs lokal vorliegt.

## Projektpfad

`websites/encar-explorer`

## Ziel des Projekts

Die Originalseite von Encar ist fuer Exploration und eigene Filterlogik zu eingeschraenkt. Dieses Projekt zieht die Daten serverseitig ueber dieselben oeffentlichen APIs, speichert sie lokal und legt eine eigene Such- und Analyseoberflaeche darauf.

Wichtig:

- Die App ist ein lokaler Explorer, kein offizieller Encar-Client.
- Sie zeigt immer nur das, was bereits lokal synchronisiert wurde.
- Der komplette aktive Katalog ist laut API sehr gross und liegt aktuell bei ueber `227.000` Inseraten.

## Reproduzierbarkeit

Jemand anders kann das Projekt in der aktuellen Form reproduzierbar verwenden, wenn er:

1. den gesamten Ordner `websites/encar-explorer` bekommt
2. `npm install` ausfuehrt
3. `npm run dev` startet
4. anschliessend selbst Sync-Jobs startet

Alle produktiven App-Daten liegen lokal in:

- `data/encar-explorer.sqlite`
- `data/images/`

Diese Daten koennen mitgeteilt werden oder bewusst neu aufgebaut werden.

## Schnellstart

```bash
cd websites/encar-explorer
npm install
npm run dev
```

Danach im Browser:

- Dashboard: `http://localhost:3000`
- Fahrzeugliste: `http://localhost:3000/vehicles`

## Architektur in Kurzform

### 1. Encar-Quellen

Verwendete Endpunkte:

- Such-/Listen-API:
  `https://api.encar.com/search/car/list/general?...`
- Detail-API:
  `https://api.encar.com/v1/readside/vehicle/{id}`

Die App verwendet diese Endpunkte serverseitig.

### 2. Lokale Datenhaltung

Die Daten landen in SQLite:

- `vehicles_search`
- `vehicle_details`
- `vehicle_images`
- `exchange_rates`
- `facet_snapshots`
- `sync_runs`
- `settings`

### 3. Frontend

Die UI liest ausschliesslich aus der lokalen DB.

Das heisst:

- die Fahrzeugliste zeigt lokale Daten
- die Detailseite zeigt lokale Daten
- fehlende Detaildaten koennen bei Bedarf on-demand nachgeladen werden

### 4. Sync-Modell

Es gibt drei getrennte Sync-Arten:

- Katalog-Sync
- Detail-Hydration
- Bild-Cache

So muss nicht zuerst alles vollstaendig gespiegelt werden, bevor die App benutzbar ist.

## Ordnerstruktur

```text
websites/encar-explorer/
  data/
    encar-explorer.sqlite
    images/
    exports/
  scripts/
    sync-catalog.ts
    hydrate-details.ts
    cache-images.ts
    stats.ts
  src/
    app/
      api/
      vehicles/
      page.tsx
    components/
    lib/
      encar/
      normalize/
      translate/
      currency.ts
      db.ts
      env.ts
      fs.ts
      http.ts
      sync.ts
```

## Datenfluss

### Katalog-Sync

1. Die App fragt die Such-API seitenweise ab.
2. Suchresultate werden normalisiert.
3. Preise werden in KRW und EUR gespeichert.
4. Daten landen in `vehicles_search`.

### Detail-Hydration

1. Fuer eine Fahrzeug-ID wird die Detail-API abgefragt.
2. Beschreibung, Bilder, Kontakt, VIN usw. werden extrahiert.
3. Daten landen in `vehicle_details` und `vehicle_images`.

### Bild-Cache

1. Bilder liegen zuerst nur als Quell-URLs vor.
2. Der Cache-Job zieht sie lokal nach `data/images/<vehicleId>/`.
3. Die DB markiert den Cache-Pfad.

## Warum die App zuerst nur wenige Fahrzeuge zeigte

Die Liste zeigt nicht automatisch den kompletten Encar-Katalog, sondern nur die lokal synchronisierte Teilmenge.

Am Anfang wurden nur wenige Testseiten gesynct. Deshalb stand dort z. B. nur `20 Treffer in der lokalen DB`, obwohl die API ueber `227.000` aktive Fahrzeuge kennt.

Aktuell wird in der UI explizit angezeigt:

- wie viele Fahrzeuge lokal vorhanden sind
- wie viele Fahrzeuge Encar insgesamt aktiv hat

## Detailseitenproblem: Ursache

Das Problem lag nicht primaer an einem API-Block.

Die eigentliche Ursache war:

- Viele Fahrzeuge hatten nur Suchdaten in `vehicles_search`
- Es gab fuer sie noch keine Eintraege in `vehicle_details` und `vehicle_images`
- Die Detailseite wurde dann zwar aufgerufen, aber Kontakt/Bilder/Beschreibung waren lokal noch leer

Zusatzproblem bei Encar:

- Die Detail-API liefert bei manchen Such-IDs intern eine andere `vehicleId` als in der Suchliste
- Encar hat also teils abweichende oder duplizierte IDs zwischen Suchliste und Detailendpunkt

## Aktueller Fix fuer die Detailseiten

Die App macht jetzt on-demand Detail-Hydration.

Das bedeutet:

- wenn eine Detailseite aufgerufen wird und noch keine vollstaendigen lokalen Detaildaten vorliegen
- wird die Encar-Detail-API fuer diese ID automatisch nachgezogen
- danach wird die Seite erneut aus der lokalen DB gelesen

Damit erscheinen Kontaktinformationen, Bilder und Beschreibung auch fuer Fahrzeuge, die vorher nur als Suchtreffer lokal vorlagen.

## Wird Encar uns geblockt?

Stand jetzt: kein harter Hinweis auf eine komplette Sperre.

Was wir beobachtet haben:

- einzelne Detail-Requests liefern intern andere IDs zurueck
- einzelne Responses koennen unvollstaendig sein
- parallele lokale Schreibzugriffe auf SQLite koennen Probleme verursachen

Was wir nicht beobachtet haben:

- flaechige 403/429-Fehler als klarer API-Block

Trotzdem ist vorsichtiges Syncen sinnvoll:

- nicht unnoetig extrem parallel
- Katalog, Details und Bilder besser sequentiell oder moderat batchweise

## Wichtige Kommandos

Katalog batchweise synchronisieren:

```bash
npm run sync:catalog -- --startPage=1 --maxPages=10 --pageSize=100
```

Beispiel fuer groesseren Batch:

```bash
npm run sync:catalog -- --startPage=51 --maxPages=100 --pageSize=100
```

Detaildaten nachziehen:

```bash
npm run sync:details -- --limit=50
```

Bilder lokal cachen:

```bash
npm run sync:images -- --limit=200
```

Statistik ansehen:

```bash
npm run stats
```

Produktionsbuild:

```bash
npm run build
```

## APIs der App

- `GET /api/stats`
- `GET /api/vehicles`
- `GET /api/vehicles/[id]`
- `POST /api/sync/catalog`
- `POST /api/sync/details`
- `POST /api/sync/images`
- `GET /api/images/[vehicleId]/[file]`

## Uebersetzung

### Ohne externe Keys

Es gibt bereits lokale Dictionaries fuer:

- Hersteller
- Regionen
- Kraftstoff
- Getriebe
- Farben
- Karosserie
- Verkaufsart
- Trust-/Service-Marken
- haeufige Modell-/Trim-Begriffe

### Mit externen Keys

Optional unterstuetzt:

- `OPENAI_API_KEY`
- `DEEPL_API_KEY`

Wenn vorhanden, versucht die App fuer Freitexte eine bessere deutsche Uebersetzung.

## EUR-Preise

Die App holt KRW -> EUR ueber `api.frankfurter.app` und speichert den Wechselkurs lokal.

## Besonderheit bei Encar-IDs

Encar verwendet in Suchliste und Detail-API teilweise unterschiedliche oder duplizierte IDs.

Deshalb gilt im Explorer aktuell:

- Suchdaten werden mit der Such-ID gespeichert
- Detaildaten werden an die lokal angefragte Such-ID gehaengt
- Encar kann intern trotzdem auf ein anderes Fahrzeugobjekt zeigen

Das ist fuer den MVP bewusst pragmatisch.

Ein sinnvoller naechster Ausbauschritt waere:

- Deduplizierung ueber VIN
- Deduplizierung ueber `vehicleNo`
- Verknuepfung interner Detail-ID mit Such-ID

## Hinweise fuer andere Entwickler und KI-Agenten

### Wenn du an diesem Projekt weiterarbeitest

Lies zuerst:

- diese `README.md`
- `AGENTS.md`
- `ARCHITECTURE.md`
- `CHANGELOG.md`
- `src/lib/db.ts`
- `src/lib/sync.ts`
- `src/lib/encar/client.ts`

### Wichtige Regeln fuer Folgearbeit

- Die UI liest aus der lokalen DB, nicht direkt aus Encar.
- Neue Filter sollten in `queryVehicles()` und `getFilterOptions()` eingebaut werden.
- Neue Datenfelder zuerst im Normalizer, dann im DB-Schema und dann in der UI verdrahten.
- Detailseiten koennen fehlende Daten on-demand hydrieren.
- Bei groesseren Sync-Laeufen lieber mehrere Batches statt extremer Parallelisierung.

### Wo neue Features reinpassen

Neue API-/Sync-Logik:

- `src/lib/encar/`
- `src/lib/sync.ts`

Neue Uebersetzungen:

- `src/lib/translate/dictionaries.ts`
- `src/lib/translate/text.ts`

Neue Datenbankfelder/Abfragen:

- `src/lib/db.ts`

Neue UI:

- `src/components/`
- `src/app/`

CLI-/Worker-Skripte:

- `scripts/`

## Stand des MVP

Funktioniert bereits:

- separater Projektordner
- Next.js Web-App
- lokale SQLite DB
- Katalog-Sync
- Detail-Hydration
- on-demand Detail-Hydration auf der Detailseite
- Bild-Cache
- Dashboard
- Filterbare Fahrzeugliste
- Detailseite
- deutsche Aufbereitung
- EUR-Umrechnung

Noch bewusst einfach gehalten:

- keine Hintergrundqueue
- keine Vollbildspiegelung des kompletten Katalogs per Default
- keine vollstaendige Optionscode-Uebersetzung
- noch keine explizite Export-UI fuer CSV/JSON
- noch keine saubere Deduplizierungslogik fuer Encar-Such-/Detail-IDs
