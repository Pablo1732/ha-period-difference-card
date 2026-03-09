const VERSION = "0.2.9";

const LitElement = Object.getPrototypeOf(
  customElements.get('ha-panel-lovelace')
);
const html = LitElement.prototype.html;
const css = LitElement.prototype.css;

/* ── Zeitraum-Parser ─────────────────────────────────────────────── */

const PERIOD_RE = /^(\d+)\s*(min|h|d|w|m|y)$/;
const SEC = { min: 60, h: 3600, d: 86400, w: 604800, m: 2592000, y: 31536000 };

function parsePeriodMs(str) {
  const m = (str || '').trim().toLowerCase().match(PERIOD_RE);
  if (!m) throw new Error(`Ungültiges Zeitformat: "${str}". Nutze z.B. "24h", "2w", "1y", "2m", "30min".`);
  return parseInt(m[1], 10) * SEC[m[2]] * 1000;
}

function periodUnit(str) {
  const m = (str || '').trim().toLowerCase().match(PERIOD_RE);
  return m ? m[2] : 'h';
}

/* ── Cache-TTL pro Periodeneinheit (ms) ──────────────────────────── */

const CACHE_TTL = { min: 30000, h: 60000, d: 300000, w: 600000, m: 900000, y: 900000 };

/* ── Datum formatieren ───────────────────────────────────────────── */

function fmtDate(date) {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const mon = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${day}.${mon}.${year} ${hh}:${mm}`;
}

/* ── Karte ───────────────────────────────────────────────────────── */

class PeriodDifferenceCard extends LitElement {
  static get properties() {
    return {
      _config: { state: true },
      _hass: { state: true },
      _selectedIndex: { state: true },
      _results: { state: true },
      _dropdownOpen: { state: true },
    };
  }

  static get styles() {
    return css`
      :host {
        container-type: inline-size;
        container-name: card;
        display: block;
        height: 100%;
      }
      ha-card {
        padding: 12px 16px;
        display: flex;
        flex-direction: column;
        border-radius: var(--ha-card-border-radius, 12px);
        box-shadow: var(--ha-card-box-shadow, none);
        height: 100%;
        box-sizing: border-box;
        overflow: visible;
      }
      .header-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        margin-bottom: 6px;
        gap: 4px;
        overflow: visible;
        min-width: 0;
        flex-shrink: 0;
      }
      .card-header {
        font-size: 1.28rem;
        font-weight: 500;
        color: var(--primary-text-color);
        letter-spacing: -0.01em;
        min-width: 0;
        flex: 1 1 0;
        overflow: hidden;
        white-space: nowrap;
        position: relative;
        -webkit-mask-image: linear-gradient(to right, #000 70%, transparent 100%);
        mask-image: linear-gradient(to right, #000 70%, transparent 100%);
      }
      .dropdown-wrapper {
        position: relative;
        flex-shrink: 0;
      }
      .dropdown-trigger {
        display: flex;
        align-items: center;
        gap: 5px;
        border: none;
        background: var(--input-fill-color, rgba(var(--rgb-primary-text-color, 0,0,0), 0.05));
        color: var(--primary-text-color);
        padding: 6px 14px;
        border-radius: 14px;
        font-size: 1.1rem;
        cursor: pointer;
        font-family: inherit;
        white-space: nowrap;
        transition: background 0.2s;
      }
      .dropdown-trigger:hover {
        background: rgba(var(--rgb-primary-color, 66,133,244), 0.15);
        color: var(--primary-color);
      }
      .dropdown-arrow {
        font-size: 0.55rem;
        opacity: 0.6;
        transition: transform 0.2s;
      }
      .dropdown-arrow.open {
        transform: rotate(180deg);
      }
      .dropdown-menu {
        position: absolute;
        top: calc(100% + 4px);
        right: 0;
        background: var(--card-background-color, #fff);
        border-radius: 12px;
        box-shadow: 0 2px 12px rgba(0,0,0,0.12);
        z-index: 10;
        min-width: 140px;
        overflow: hidden;
        border: 1px solid var(--divider-color, rgba(0,0,0,0.06));
      }
      .dropdown-item {
        display: block;
        width: 100%;
        border: none;
        background: none;
        color: var(--primary-text-color);
        padding: 10px 16px;
        font-size: 1.1rem;
        cursor: pointer;
        text-align: left;
        font-family: inherit;
        white-space: nowrap;
        transition: background 0.15s;
      }
      .dropdown-item:hover {
        background: var(--input-fill-color, rgba(var(--rgb-primary-text-color, 0,0,0), 0.05));
      }
      .dropdown-item.active {
        color: var(--primary-color);
        font-weight: 600;
      }
      .value-container {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 5px;
        flex: 1 1 auto;
        min-height: 0;
        max-width: 100%;
        overflow: hidden;
      }
      .value {
        font-size: 2.7rem;
        font-weight: 700;
        color: var(--primary-text-color);
        line-height: 1.1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        min-width: 0;
      }
      .value.positive { color: var(--label-badge-green, #4caf50); }
      .value.negative { color: var(--label-badge-red, #f44336); }
      .value.zero     { color: var(--secondary-text-color); }
      .unit {
        font-size: 1.35rem;
        color: var(--secondary-text-color);
        font-weight: 400;
      }
      .error {
        color: var(--error-color, #db4437);
        font-size: 1.14rem;
        text-align: center;
        flex: 1 1 auto;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .loading {
        color: var(--secondary-text-color);
        font-size: 1.14rem;
        flex: 1 1 auto;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .stale {
        opacity: 0.6;
      }
      .warning {
        font-size: 1.08rem;
        color: var(--warning-color, #ff9800);
        margin-top: auto;
        padding-top: 4px;
        text-align: center;
        max-width: 100%;
        flex-shrink: 0;
        word-break: break-word;
      }
      ha-card.fixed-height .warning {
        overflow: hidden;
        white-space: nowrap;
        -webkit-mask-image: linear-gradient(to right, #000 calc(100% - 20px), transparent 100%);
        mask-image: linear-gradient(to right, #000 calc(100% - 20px), transparent 100%);
      }

      /* ── Responsive: Extra-klein (<120px) ─────────────────────── */
      @container card (max-width: 119px) {
        ha-card {
          padding: 6px 8px;
        }
        .header-row {
          margin-bottom: 2px;
          gap: 2px;
        }
        .card-header {
          font-size: 0.75rem;
        }
        .dropdown-trigger {
          padding: 3px 8px;
          font-size: 0.7rem;
          border-radius: 10px;
          gap: 3px;
        }
        .dropdown-arrow {
          font-size: 0.4rem;
        }
        .dropdown-menu {
          min-width: 90px;
          border-radius: 8px;
        }
        .dropdown-item {
          padding: 6px 10px;
          font-size: 0.75rem;
        }
        .value {
          font-size: 1.3rem;
        }
        .unit {
          font-size: 0.75rem;
        }
        .value-container {
          gap: 3px;
        }
        .error, .loading {
          font-size: 0.75rem;
        }
        .warning {
          font-size: 0.65rem;
          padding-top: 2px;
        }
        ha-card.fixed-height .warning {
          display: none;
        }
      }

      /* ── Responsive: Klein (120px–179px) ──────────────────────── */
      @container card (min-width: 120px) and (max-width: 179px) {
        ha-card {
          padding: 8px 10px;
        }
        .header-row {
          margin-bottom: 3px;
          gap: 3px;
        }
        .card-header {
          font-size: 0.88rem;
        }
        .dropdown-trigger {
          padding: 4px 10px;
          font-size: 0.82rem;
          border-radius: 11px;
          gap: 4px;
        }
        .dropdown-arrow {
          font-size: 0.45rem;
        }
        .dropdown-item {
          padding: 7px 12px;
          font-size: 0.85rem;
        }
        .value {
          font-size: 1.7rem;
        }
        .unit {
          font-size: 0.9rem;
        }
        .value-container {
          gap: 4px;
        }
        .error, .loading {
          font-size: 0.88rem;
        }
        .warning {
          font-size: 0.7rem;
          margin-top: 2px;
          line-height: 1.2;
        }
      }

      /* ── Responsive: Mittel-klein (180px–249px) ───────────────── */
      @container card (min-width: 180px) and (max-width: 249px) {
        ha-card {
          padding: 10px 12px;
        }
        .header-row {
          margin-bottom: 4px;
        }
        .card-header {
          font-size: 1.05rem;
        }
        .dropdown-trigger {
          padding: 5px 12px;
          font-size: 0.95rem;
          border-radius: 12px;
        }
        .dropdown-item {
          padding: 8px 14px;
          font-size: 0.95rem;
        }
        .value {
          font-size: 2.1rem;
        }
        .unit {
          font-size: 1.1rem;
        }
        .error, .loading {
          font-size: 1rem;
        }
        .warning {
          font-size: 0.92rem;
        }
      }

      /* ── Responsive: Standard (250px–399px) — Default-Werte ──── */
      /* Die Standard-Styles oben decken diesen Bereich ab. */

      /* ── Responsive: Groß (400px–549px) ───────────────────────── */
      @container card (min-width: 400px) and (max-width: 549px) {
        ha-card {
          padding: 16px 22px;
        }
        .header-row {
          margin-bottom: 8px;
        }
        .card-header {
          font-size: 1.5rem;
        }
        .dropdown-trigger {
          padding: 7px 18px;
          font-size: 1.2rem;
          border-radius: 16px;
        }
        .dropdown-item {
          padding: 11px 18px;
          font-size: 1.15rem;
        }
        .value {
          font-size: 3.3rem;
        }
        .unit {
          font-size: 1.6rem;
        }
        .value-container {
          gap: 7px;
        }
        .error, .loading {
          font-size: 1.25rem;
        }
        .warning {
          font-size: 1.15rem;
        }
      }

      /* ── Responsive: Extra-groß (≥550px) ──────────────────────── */
      @container card (min-width: 550px) {
        ha-card {
          padding: 20px 28px;
        }
        .header-row {
          margin-bottom: 10px;
        }
        .card-header {
          font-size: 1.7rem;
        }
        .dropdown-trigger {
          padding: 8px 22px;
          font-size: 1.35rem;
          border-radius: 18px;
        }
        .dropdown-menu {
          min-width: 180px;
          border-radius: 14px;
        }
        .dropdown-item {
          padding: 12px 20px;
          font-size: 1.25rem;
        }
        .value {
          font-size: 4rem;
        }
        .unit {
          font-size: 1.85rem;
        }
        .value-container {
          gap: 8px;
        }
        .error, .loading {
          font-size: 1.35rem;
        }
        .warning {
          font-size: 1.25rem;
          margin-top: 6px;
        }
      }
    `;
  }

  constructor() {
    super();
    this._selectedIndex = 0;
    this._results = {};
    this._fetchTimes = {};
    this._pending = {};
    this._debounceTimer = null;
    this._lastEntityState = null;
    this._dropdownOpen = false;
    this._boundCloseDropdown = this._closeDropdown.bind(this);
  }

  /* ── Lifecycle ──────────────────────────────────────────────────── */

  connectedCallback() {
    super.connectedCallback();
    this._fetchTimes = {};
    if (this._config && this._hass) {
      this._scheduleFetch();
    }
    document.addEventListener('click', this._boundCloseDropdown);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._debounceTimer) {
      clearTimeout(this._debounceTimer);
      this._debounceTimer = null;
    }
    this._pending = {};
    document.removeEventListener('click', this._boundCloseDropdown);
  }

  _closeDropdown() {
    if (this._dropdownOpen) this._dropdownOpen = false;
  }

  /* ── Config ─────────────────────────────────────────────────────── */

  setConfig(config) {
    if (!config.entity) throw new Error('Bitte "entity" angeben.');
    if (!config.periods || !Array.isArray(config.periods) || !config.periods.length) {
      throw new Error('Bitte "periods" als Liste angeben, z.B.:\nperiods:\n  - period: "24h"\n    name: "1 Tag"');
    }
    const parsed = config.periods.map((p) => {
      if (!p.period) throw new Error('Jeder Eintrag braucht ein "period"-Feld, z.B. "24h".');
      return { ...p, _ms: parsePeriodMs(p.period), _unit: periodUnit(p.period) };
    });
    this._config = { ...config, periods: parsed };

    // Default-Periode setzen
    let defaultIdx = 0;
    if (config.default_period) {
      const di = parsed.findIndex(
        (p) => p.period.toLowerCase() === config.default_period.toLowerCase()
      );
      if (di >= 0) defaultIdx = di;
    }
    this._selectedIndex = defaultIdx;
    this._results = {};
    this._fetchTimes = {};
    this._pending = {};
  }

  /* ── Hass-Setter (debounced) ────────────────────────────────────── */

  set hass(hass) {
    this._hass = hass;
    if (!this._config) return;

    const obj = hass.states[this._config.entity];
    const newState = obj ? obj.state : null;
    if (newState === this._lastEntityState && this._results[this._selectedIndex]) {
      return;
    }
    this._lastEntityState = newState;

    if (!this._debounceTimer) {
      this._debounceTimer = setTimeout(() => {
        this._debounceTimer = null;
        this._scheduleFetch();
      }, 2000);
    }
  }

  _scheduleFetch() {
    if (!this._config || !this._hass) return;
    const i = this._selectedIndex;
    const p = this._config.periods[i];
    if (!p) return;
    const ttl = CACHE_TTL[p._unit] || 60000;
    const now = Date.now();
    if (now - (this._fetchTimes[i] || 0) > ttl) {
      this._fetchTimes[i] = now;
      this._fetch(i);
    }
  }

  /* ── Fetch mit In-Flight-Tracking ───────────────────────────────── */

  async _fetch(index) {
    if (this._pending[index]) return;
    const promise = this._doFetch(index);
    this._pending[index] = promise;
    try { await promise; } finally { delete this._pending[index]; }
  }

  async _doFetch(index) {
    const p = this._config.periods[index];
    if (!p) return;
    const id = this._config.entity;
    const obj = this._hass.states[id];

    const existing = this._results[index];
    if (!existing || existing.error) {
      this._results = { ...this._results, [index]: { loading: true } };
    }

    if (!obj) {
      this._results = { ...this._results, [index]: { error: `Entität "${id}" nicht gefunden.` } };
      return;
    }
    const cur = parseFloat(obj.state);
    if (isNaN(cur)) {
      this._results = { ...this._results, [index]: { error: 'Wert ist nicht numerisch.' } };
      return;
    }

    if (existing && existing.past != null && !existing.loading) {
      this._results = { ...this._results, [index]: { diff: cur - existing.past, past: existing.past, cur, warning: existing.warning } };
    }

    try {
      const pastResult = await this._pastVal(id, p._ms);
      if (pastResult === null) {
        if (existing && existing.diff != null) {
          this._results = { ...this._results, [index]: { ...existing, stale: true } };
        } else {
          this._results = { ...this._results, [index]: { error: 'Keine Historiendaten verfügbar.' } };
        }
        return;
      }
      const entry = { diff: cur - pastResult.value, past: pastResult.value, cur };
      if (pastResult.warning) entry.warning = pastResult.warning;
      this._results = { ...this._results, [index]: entry };
    } catch (e) {
      if (existing && existing.diff != null) {
        this._results = { ...this._results, [index]: { ...existing, stale: true } };
        console.warn('ha-period-difference-card: Fetch-Fehler, zeige gecachten Wert:', e.message);
      } else {
        this._results = { ...this._results, [index]: { error: e.message } };
      }
    }
  }

  /* ── Wert zum Zielzeitpunkt ermitteln ───────────────────────────── */

  async _pastVal(entityId, periodMs) {
    const targetTime = Date.now() - periodMs;
    const histVal = await this._pastValHistory(entityId, targetTime);
    if (histVal !== null) return { value: histVal };
    const statVal = await this._statValAt(entityId, targetTime);
    if (statVal !== null) return { value: statVal };
    return this._oldestAvailable(entityId, targetTime);
  }

  async _pastValHistory(entityId, targetTime) {
    try {
      const target = new Date(targetTime);
      const end = new Date(targetTime + 1000);
      const url =
        `history/period/${target.toISOString()}` +
        `?filter_entity_id=${entityId}` +
        `&end_time=${end.toISOString()}` +
        `&minimal_response&no_attributes`;
      const h = await this._hass.callApi('GET', url);
      if (!h || !h.length || !h[0].length) return null;
      const val = parseFloat(h[0][0].s ?? h[0][0].state);
      return isNaN(val) ? null : val;
    } catch (_) { return null; }
  }

  async _statValAt(entityId, targetTime) {
    try {
      const result = await this._hass.callWS({
        type: 'recorder/statistics_during_period',
        start_time: new Date(targetTime - 3600000).toISOString(),
        end_time: new Date(targetTime + 3600000).toISOString(),
        statistic_ids: [entityId],
        period: 'hour',
      });
      if (!result || !result[entityId] || !result[entityId].length) return null;
      let best = null, bestDist = Infinity;
      for (const entry of result[entityId]) {
        const ts = new Date(entry.start).getTime();
        const dist = Math.abs(ts - targetTime);
        const val = entry.mean ?? entry.state ?? entry.sum;
        if (val == null || isNaN(parseFloat(val))) continue;
        if (dist < bestDist) { bestDist = dist; best = parseFloat(val); }
      }
      return best;
    } catch (_) { return null; }
  }

  async _oldestAvailable(entityId, targetTime) {
    try {
      const result = await this._hass.callWS({
        type: 'recorder/statistics_during_period',
        start_time: new Date(targetTime).toISOString(),
        end_time: new Date().toISOString(),
        statistic_ids: [entityId],
        period: 'month',
      });
      if (!result || !result[entityId] || !result[entityId].length) return null;
      const oldest = result[entityId][0];
      const val = oldest.mean ?? oldest.state ?? oldest.sum;
      if (val == null || isNaN(parseFloat(val))) return null;
      const oldestDate = new Date(oldest.start);
      const hourResult = await this._hass.callWS({
        type: 'recorder/statistics_during_period',
        start_time: oldestDate.toISOString(),
        end_time: new Date(oldestDate.getTime() + 86400000).toISOString(),
        statistic_ids: [entityId],
        period: 'hour',
      });
      let finalVal = parseFloat(val), finalDate = oldestDate;
      if (hourResult && hourResult[entityId] && hourResult[entityId].length) {
        const first = hourResult[entityId][0];
        const hVal = first.mean ?? first.state ?? first.sum;
        if (hVal != null && !isNaN(parseFloat(hVal))) {
          finalVal = parseFloat(hVal);
          finalDate = new Date(first.start);
        }
      }
      return { value: finalVal, warning: `Daten erst seit ${fmtDate(finalDate)} verfügbar` };
    } catch (_) { return null; }
  }

  /* ── Dropdown ───────────────────────────────────────────────────── */

  _toggleDropdown(e) {
    e.stopPropagation();
    this._dropdownOpen = !this._dropdownOpen;
  }

  _select(i) {
    this._dropdownOpen = false;
    if (i === this._selectedIndex) return;
    this._selectedIndex = i;
    const p = this._config.periods[i];
    if (!p) return;
    const ttl = CACHE_TTL[p._unit] || 60000;
    const now = Date.now();
    if (now - (this._fetchTimes[i] || 0) > ttl || !this._results[i]) {
      this._fetchTimes[i] = now;
      this._fetch(i);
    }
  }

  /* ── Formatierung ───────────────────────────────────────────────── */

  _fmt(diff) {
    const obj = this._hass?.states[this._config.entity];
    if (!obj) return diff.toFixed(2);
    const dot = obj.state.indexOf('.');
    const dec = dot >= 0 ? obj.state.length - dot - 1 : 0;
    return diff.toFixed(dec);
  }

  /* ── Render ─────────────────────────────────────────────────────── */

  render() {
    if (!this._config || !this._hass) {
      return html`<ha-card><div class="error">Konfiguration fehlt.</div></ha-card>`;
    }
    const obj = this._hass.states[this._config.entity];
    const cfgShowUnit = this._config.show_unit;
    const showUnit = cfgShowUnit !== false && cfgShowUnit !== 'false';
    let unit = '';
    if (showUnit) {
      if ('unit' in this._config) {
        unit = this._config.unit ?? '';
      } else {
        unit = obj?.attributes?.unit_of_measurement || '';
      }
    }
    const name = this._config.name || obj?.attributes?.friendly_name || this._config.entity;
    const idx = this._selectedIndex;
    const r = this._results[idx] || { loading: true };
    const currentPeriod = this._config.periods[idx];
    const periodLabel = currentPeriod?.name || currentPeriod?.period || '';
    const fixedHeight = this._config.grid_options?.rows ? 'fixed-height' : '';

    return html`
      <ha-card class="${fixedHeight}">
        <div class="header-row">
          <div class="card-header">${name}</div>
          <div class="dropdown-wrapper">
            <button class="dropdown-trigger" @click=${(e) => this._toggleDropdown(e)}>
              ${periodLabel}
              <span class="dropdown-arrow ${this._dropdownOpen ? 'open' : ''}">▼</span>
            </button>
            ${this._dropdownOpen ? html`
              <div class="dropdown-menu">
                ${this._config.periods.map(
                  (p, i) => html`
                    <button
                      class="dropdown-item ${i === idx ? 'active' : ''}"
                      @click=${(e) => { e.stopPropagation(); this._select(i); }}
                    >${p.name || p.period}</button>`
                )}
              </div>` : ''}
          </div>
        </div>
        ${r.loading
          ? html`<div class="loading">Lade...</div>`
          : r.error
            ? html`<div class="error">${r.error}</div>`
            : html`
                <div class="value-container ${r.stale ? 'stale' : ''}">
                  <span class="value ${r.diff > 0 ? 'positive' : r.diff < 0 ? 'negative' : 'zero'}">
                    ${r.diff > 0 ? '+' : ''}${this._fmt(r.diff)}
                  </span>
                  ${unit ? html`<span class="unit">${unit}</span>` : ''}
                </div>
                ${r.warning ? html`<div class="warning">⚠ ${r.warning}</div>` : ''}`
        }
      </ha-card>
    `;
  }

  getCardSize() {
    return this._config?.grid_options?.rows || 2;
  }

  getLayoutOptions() {
    const go = this._config?.grid_options || {};
    return {
      grid_columns: go.columns || 2,
      grid_rows: go.rows || 2,
      grid_min_columns: go.min_columns || 1,
      grid_min_rows: go.min_rows || 1,
      grid_max_columns: go.max_columns || 6,
      grid_max_rows: go.max_rows || 4,
    };
  }

  static getStubConfig() {
    return {
      entity: '',
      default_period: '24h',
      periods: [
        { period: '1h', name: '1 Stunde' },
        { period: '24h', name: '1 Tag' },
        { period: '1w', name: '1 Woche' },
      ],
    };
  }
}

customElements.define('ha-period-difference-card', PeriodDifferenceCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'ha-period-difference-card',
  name: 'Period Difference Card',
  description: 'Zeigt die Wertänderung eines Sensors über konfigurierbare Zeiträume.',
});

console.info(
  '%c HA-PERIOD-DIFFERENCE-CARD %c v0.2.9 ',
  'background: #4caf50; color: #fff; font-weight: bold',
  'background: #ddd; color: #333'
);
