# [English](#english) | [Deutsch](#deutsch)

---
#### English

# Period Difference Card for Home Assistant

A compact Lovelace card that shows the **difference** between a sensor's current value and its value from a configurable time period ago. Supports multiple selectable periods via dropdown.

> **Note:** This project was entirely vibe-coded (AI-programmed). Concept, design and project management by me.

![Home Assistant](https://img.shields.io/badge/Home%20Assistant-Lovelace-blue)
![HACS](https://img.shields.io/badge/HACS-Custom-orange)
![Version](https://img.shields.io/badge/version-0.2.8-green)

## Features
- **Multiple time periods** – selectable via dropdown
- Supports: minutes (`min`), hours (`h`), days (`d`), weeks (`w`), months (`m`), years (`y`)
- **Default period** configurable
- Color-coded: **green** for positive, **red** for negative changes
- Automatically uses **Long-Term Statistics** for periods beyond the purge window
- Shows a warning when data is only available from a later date
- **Custom unit** – override or hide the unit of measurement
- **Sections Dashboard support** – fully responsive with `grid_options` (columns/rows)
- Scales smoothly from tiny (1×1) to large (6×4) grid sizes via CSS Container Queries
- Mushroom-style design, adapts to any Home Assistant theme
- No build required – single JS file

## Installation

### HACS (recommended)
1. Add the repository (https://github.com/Pablo1732/ha-period-difference-card) to HACS [(guide)](https://hacs.xyz/docs/faq/custom_repositories/)
2. Choose category: **Dashboard**
3. Install the Period Difference Card via HACS
4. Restart Home Assistant

### Manual
1. Download `ha-period-difference-card.js` from the [latest release](https://github.com/Pablo1732/ha-period-difference-card/releases)
2. Copy the file to `/config/www/ha-period-difference-card.js`
3. Add the resource:
   - **Settings** → **Dashboards** → **Resources** → **Add Resource**
   - URL: `/local/ha-period-difference-card.js`
   - Type: **JavaScript Module**

## Configuration

```yaml
type: custom:ha-period-difference-card
entity: sensor.energy_meter
name: "Energy Usage"            # optional
default_period: "24h"           # optional
unit: "kWh"                     # optional – override unit
show_unit: true                 # optional – set to false to hide unit
periods:
  - period: "1h"
    name: "1 Hour"
  - period: "24h"
    name: "1 Day"
  - period: "1w"
    name: "1 Week"
  - period: "1m"
    name: "1 Month"
  - period: "1y"
    name: "1 Year"
```

### Grid options (Sections Dashboard)

When using the **Sections Dashboard**, you can set the card size via the UI or YAML. The card automatically adapts its layout and font sizes to the available space.

```yaml
type: custom:ha-period-difference-card
entity: sensor.energy_meter
periods:
  - period: "24h"
    name: "1 Day"
grid_options:
  columns: 4
  rows: 2
```

If no `rows` are set, the card can grow vertically to fit its content (e.g. the "data available since" warning will wrap to multiple lines instead of being truncated).

### Options

| Option           | Type    | Required | Default                    | Description                                      |
|------------------|---------|----------|----------------------------|--------------------------------------------------|
| `entity`         | string  | ✅       | –                          | Entity ID of the sensor                          |
| `periods`        | list    | ✅       | –                          | List of time periods (see below)                 |
| `name`           | string  | ❌       | Friendly name of entity    | Display name of the card                         |
| `default_period` | string  | ❌       | First entry                | Default selected period, e.g. `24h`              |
| `unit`           | string  | ❌       | Unit from entity           | Override the displayed unit of measurement       |
| `show_unit`      | boolean | ❌       | `true`                     | Set to `false` to completely hide the unit        |
| `grid_options`   | object  | ❌       | –                          | Grid sizing for Sections Dashboard (see below)   |

### Grid options

| Field          | Type   | Default | Description                         |
|----------------|--------|---------|-------------------------------------|
| `columns`      | number | `2`     | Default number of grid columns      |
| `rows`         | number | `2`     | Default number of grid rows         |
| `min_columns`  | number | `1`     | Minimum columns                     |
| `min_rows`     | number | `1`     | Minimum rows                        |
| `max_columns`  | number | `6`     | Maximum columns                     |
| `max_rows`     | number | `4`     | Maximum rows                        |

### Period entries

| Field    | Type   | Required | Default          | Description                              |
|----------|--------|----------|------------------|------------------------------------------|
| `period` | string | ✅       | –                | Time period, e.g. `24h`, `2w`, `1y`, `30min` |
| `name`   | string | ❌       | Value of `period`| Label for the dropdown entry             |

### Time period formats

| Format  | Meaning    |
|---------|------------|
| `30min` | 30 Minutes |
| `24h`   | 24 Hours   |
| `7d`    | 7 Days     |
| `2w`    | 2 Weeks    |
| `1m`    | 1 Month    |
| `1y`    | 1 Year     |

### Examples

**Minimal:**
```yaml
type: custom:ha-period-difference-card
entity: sensor.energy_meter
periods:
  - period: "24h"
    name: "1 Day"
```

**Custom unit:**
```yaml
type: custom:ha-period-difference-card
entity: sensor.energy_meter
unit: "W"
periods:
  - period: "1h"
    name: "1 Hour"
```

**Hide unit:**
```yaml
type: custom:ha-period-difference-card
entity: sensor.temperature
show_unit: false
periods:
  - period: "24h"
    name: "1 Day"
```

**Small card (Sections Dashboard):**
```yaml
type: custom:ha-period-difference-card
entity: sensor.energy_meter
periods:
  - period: "24h"
    name: "1 Day"
grid_options:
  columns: 2
  rows: 1
```

## Tips if something fails
- **"Keine Historiendaten"**: The sensor has no history data for the selected period. Check if the recorder integration is configured.
- **Warning "Daten erst seit ..."**: The sensor hasn't existed long enough for the requested period. The oldest available value is used instead.

---
#### Deutsch

# Period Difference Card für Home Assistant

Eine kompakte Lovelace-Karte, die die **Differenz** zwischen dem aktuellen Wert eines Sensors und dem Wert vor einem konfigurierbaren Zeitraum anzeigt. Mehrere Zeiträume sind per Dropdown auswählbar.

> **Hinweis:** Dieses Projekt wurde komplett vibe-coded (KI-programmiert). Konzept, Design und Projektmanagement von mir.

![Home Assistant](https://img.shields.io/badge/Home%20Assistant-Lovelace-blue)
![HACS](https://img.shields.io/badge/HACS-Custom-orange)
![Version](https://img.shields.io/badge/version-0.2.8-green)

## Features
- **Mehrere Zeiträume** – per Dropdown auswählbar
- Unterstützt: Minuten (`min`), Stunden (`h`), Tage (`d`), Wochen (`w`), Monate (`m`), Jahre (`y`)
- **Standard-Zeitraum** konfigurierbar
- Farbcodierung: **grün** für positive, **rot** für negative Änderungen
- Nutzt automatisch **Long-Term Statistics** für Zeiträume jenseits des Purge-Fensters
- Zeigt eine Warnung, wenn Daten erst ab einem späteren Zeitpunkt verfügbar sind
- **Eigene Einheit** – Einheit überschreiben oder ausblenden
- **Abschnitte-Dashboard Support** – voll responsiv mit `grid_options` (Spalten/Zeilen)
- Skaliert smooth von klein (1×1) bis groß (6×4) per CSS Container Queries
- Mushroom-artiges Design, passt sich jedem Home Assistant Theme an
- Kein Build nötig – eine einzige JS-Datei

## Installation

### HACS (empfohlen)
1. Repository (https://github.com/Pablo1732/ha-period-difference-card) zu HACS hinzufügen [(Anleitung)](https://hacs.xyz/docs/faq/custom_repositories/)
2. Kategorie wählen: **Dashboard**
3. Period Difference Card über HACS installieren
4. Home Assistant neu starten

### Manuell
1. Lade `ha-period-difference-card.js` aus dem [neuesten Release](https://github.com/Pablo1732/ha-period-difference-card/releases) herunter
2. Kopiere die Datei nach `/config/www/ha-period-difference-card.js`
3. Füge die Ressource hinzu:
   - **Einstellungen** → **Dashboards** → **Ressourcen** → **Ressource hinzufügen**
   - URL: `/local/ha-period-difference-card.js`
   - Typ: **JavaScript-Modul**

## Konfiguration

```yaml
type: custom:ha-period-difference-card
entity: sensor.stromzaehler_total
name: "Stromverbrauch"          # optional
default_period: "24h"           # optional
unit: "kWh"                     # optional – Einheit überschreiben
show_unit: true                 # optional – auf false setzen um Einheit auszublenden
periods:
  - period: "1h"
    name: "1 Stunde"
  - period: "24h"
    name: "1 Tag"
  - period: "1w"
    name: "1 Woche"
  - period: "1m"
    name: "1 Monat"
  - period: "1y"
    name: "1 Jahr"
```

### Grid-Optionen (Abschnitte-Dashboard)

Beim **Abschnitte-Dashboard** kannst du die Kartengröße über die UI oder YAML einstellen. Die Karte passt Layout und Schriftgrößen automatisch an den verfügbaren Platz an.

```yaml
type: custom:ha-period-difference-card
entity: sensor.stromzaehler_total
periods:
  - period: "24h"
    name: "1 Tag"
grid_options:
  columns: 4
  rows: 2
```

Wenn keine `rows` gesetzt sind, kann die Karte vertikal wachsen, um den Inhalt anzuzeigen (z.B. wird die „Daten erst seit …"-Warnung mehrzeilig statt abgeschnitten).

### Optionen

| Option           | Typ     | Pflicht | Standard                  | Beschreibung                                          |
|------------------|---------|---------|---------------------------|-------------------------------------------------------|
| `entity`         | string  | ✅      | –                         | Die Entitäts-ID des Sensors                           |
| `periods`        | list    | ✅      | –                         | Liste der Zeiträume (siehe unten)                     |
| `name`           | string  | ❌      | Friendly Name der Entität | Anzeigename der Karte                                 |
| `default_period` | string  | ❌      | Erster Eintrag            | Standard-Zeitraum, z.B. `24h`                        |
| `unit`           | string  | ❌      | Einheit der Entität       | Angezeigte Einheit überschreiben                      |
| `show_unit`      | boolean | ❌      | `true`                    | Auf `false` setzen um die Einheit komplett auszublenden|
| `grid_options`   | object  | ❌      | –                         | Grid-Größe für Abschnitte-Dashboard (siehe unten)     |

### Grid-Optionen

| Feld           | Typ    | Standard | Beschreibung                          |
|----------------|--------|----------|---------------------------------------|
| `columns`      | number | `2`      | Standard-Anzahl Grid-Spalten          |
| `rows`         | number | `2`      | Standard-Anzahl Grid-Zeilen           |
| `min_columns`  | number | `1`      | Minimale Spalten                      |
| `min_rows`     | number | `1`      | Minimale Zeilen                       |
| `max_columns`  | number | `6`      | Maximale Spalten                      |
| `max_rows`     | number | `4`      | Maximale Zeilen                       |

### Period-Einträge

| Feld     | Typ    | Pflicht | Standard          | Beschreibung                             |
|----------|--------|---------|-------------------|------------------------------------------|
| `period` | string | ✅      | –                 | Zeitraum, z.B. `24h`, `2w`, `1y`, `30min` |
| `name`   | string | ❌      | Wert von `period` | Label für den Dropdown-Eintrag           |

### Zeitraum-Formate

| Format  | Bedeutung  |
|---------|------------|
| `30min` | 30 Minuten |
| `24h`   | 24 Stunden |
| `7d`    | 7 Tage     |
| `2w`    | 2 Wochen   |
| `1m`    | 1 Monat    |
| `1y`    | 1 Jahr     |

### Beispiele

**Minimal:**
```yaml
type: custom:ha-period-difference-card
entity: sensor.stromzaehler_total
periods:
  - period: "24h"
    name: "1 Tag"
```

**Eigene Einheit:**
```yaml
type: custom:ha-period-difference-card
entity: sensor.stromzaehler_total
unit: "W"
periods:
  - period: "1h"
    name: "1 Stunde"
```

**Einheit ausblenden:**
```yaml
type: custom:ha-period-difference-card
entity: sensor.temperatur
show_unit: false
periods:
  - period: "24h"
    name: "1 Tag"
```

**Kleine Karte (Abschnitte-Dashboard):**
```yaml
type: custom:ha-period-difference-card
entity: sensor.stromzaehler_total
periods:
  - period: "24h"
    name: "1 Tag"
grid_options:
  columns: 2
  rows: 1
```

## Tipps bei Problemen
- **„Keine Historiendaten"**: Der Sensor hat keine Verlaufsdaten für den gewählten Zeitraum. Prüfe, ob die Recorder-Integration konfiguriert ist.
- **Warnung „Daten erst seit …"**: Der Sensor existiert noch nicht lange genug für den gewählten Zeitraum. Es wird der älteste verfügbare Wert verwendet.

## Lizenz

MIT
