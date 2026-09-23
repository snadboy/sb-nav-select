/* SB Nav Select — a dropdown of destinations.
 *
 * Items are label + path. Paths navigate in place (query strings included);
 * http(s) URLs open in a new tab. The dropdown tracks the current URL: when
 * you are on one of the destinations it shows as selected, otherwise the
 * placeholder shows.
 *
 * Filter mode (driving a parameter on this view) moved to SB Param Card in
 * 0.7.0 — turn on "Show a dropdown" there. A leftover filter-mode config
 * renders a notice saying so rather than a broken select.
 */

const CARD = "sb-nav-select";
const VERSION = "0.7.0";

const fire = (node, type, detail) =>
  node.dispatchEvent(new CustomEvent(type, { detail, bubbles: true, composed: true }));

const esc = (v) =>
  String(v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

class SbNavSelect extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  static getConfigElement() {
    return document.createElement("sb-nav-select-editor");
  }

  static getStubConfig() {
    return {
      title: "Go to",
      items: [{ label: "Overview", path: "/lovelace/0" }],
    };
  }

  setConfig(config) {
    if (!config) throw new Error("Invalid configuration");
    this._legacyFilter = config.mode === "filter" || (config.items || []).some((i) => i && i.value != null && i.path == null);
    if (!this._legacyFilter && !(config.items || []).length) throw new Error("Add at least one destination");
    this._config = config;
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._rendered) this._render();
  }

  getCardSize() {
    return 1;
  }

  connectedCallback() {
    this._onNav = () => this._syncSelection();
    window.addEventListener("location-changed", this._onNav);
    window.addEventListener("popstate", this._onNav);
  }

  disconnectedCallback() {
    window.removeEventListener("location-changed", this._onNav);
    window.removeEventListener("popstate", this._onNav);
  }

  _items() {
    return (this._config.items || []).filter((i) => i && (i.label || i.path));
  }

  _parse(path) {
    const [p, q] = String(path || "").split("?");
    return { pathname: p, params: new URLSearchParams(q || "") };
  }

  _currentIndex() {
    const items = this._items();
    if (this._config.merge_query) {
      // Merge mode: an item is "current" when its pathname matches and every
      // param it sets (or clears) matches the live URL.
      const liveParams = new URLSearchParams(location.search);
      return items.findIndex((i) => {
        const { pathname, params } = this._parse(i.path);
        if (pathname !== location.pathname) return false;
        for (const [k, v] of params.entries())
          if ((liveParams.get(k) || "") !== v) return false;
        return true;
      });
    }
    const here = location.pathname + location.search;
    return items.findIndex((i) => i.path === here);
  }

  _syncSelection() {
    const sel = this.shadowRoot.querySelector("select");
    if (sel) sel.value = String(this._currentIndex());
  }

  _go(item) {
    if (!item.path) return;
    if (/^https?:\/\//.test(item.path)) {
      window.open(item.path, "_blank");
      this._syncSelection();
      return;
    }
    let target = item.path;
    if (this._config.merge_query) {
      // Keep everyone else's query params; overlay ours (empty value clears).
      const { pathname, params } = this._parse(item.path);
      const merged = new URLSearchParams(location.search);
      for (const [k, v] of params.entries()) v === "" ? merged.delete(k) : merged.set(k, v);
      const q = merged.toString();
      target = pathname + (q ? "?" + q : "");
    }
    history.pushState(null, "", target);
    fire(this, "location-changed", {});
  }

  _render() {
    if (!this._config) return;
    this._rendered = true;
    const items = this._items();
    const cur = this._currentIndex();
    this.shadowRoot.innerHTML = `
      <style>
        ha-card { padding: 12px 16px; display: flex; align-items: center; gap: 12px; }
        .title { font-weight: 500; color: var(--primary-text-color); white-space: nowrap; }
        .warn { color: var(--warning-color, orange); font-size: .85em; }
        select { flex: 1; min-width: 0; font: inherit; color: var(--primary-text-color);
                 background: var(--mdc-text-field-fill-color, rgba(127,127,127,.12));
                 border: none; border-bottom: 1px solid var(--divider-color);
                 border-radius: 4px 4px 0 0; padding: 10px 12px; cursor: pointer;
                 outline-color: var(--primary-color); color-scheme: light dark; }
        /* The native popup ignores the page theme: without explicit option
           colors, dark themes get light-gray text on a white popup. */
        option { background: var(--card-background-color, Canvas);
                 color: var(--primary-text-color, CanvasText); }
      </style>
      <ha-card>
        ${this._config.title ? `<div class="title">${esc(this._config.title)}</div>` : ""}
        ${this._legacyFilter
          ? `<div class="warn">Filter mode moved to SB Param Card — add one, turn on “Show a dropdown”, and delete this card.</div>`
          : `<select>
               <option value="-1" ${cur === -1 ? "selected" : ""} disabled hidden>${esc(this._config.placeholder || "Select…")}</option>
               ${items.map((i, n) => `<option value="${n}" ${n === cur ? "selected" : ""}>${esc(i.label || i.path)}</option>`).join("")}
             </select>`}
      </ha-card>`;
    this.shadowRoot.querySelector("select")?.addEventListener("change", (e) => {
      const item = items[Number(e.target.value)];
      if (item) this._go(item);
    });
  }
}

class SbNavSelectEditor extends HTMLElement {
  setConfig(config) {
    this._config = { items: [], ...config };
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    if (this._form) this._form.hass = hass;
  }

  _emit() {
    fire(this, "config-changed", { config: this._config });
  }

  _input(value, placeholder, flex, onInput) {
    const el = document.createElement("input");
    el.type = "text";
    el.value = value || "";
    el.placeholder = placeholder;
    el.autocomplete = "off";
    el.style.cssText =
      `flex:${flex}; min-width:0; box-sizing:border-box; font:inherit; color:var(--primary-text-color);` +
      "background:var(--mdc-text-field-fill-color, rgba(127,127,127,.12));" +
      "border:none; border-bottom:1px solid var(--divider-color);" +
      "border-radius:4px 4px 0 0; padding:12px 10px; outline-color:var(--primary-color);";
    el.addEventListener("input", onInput);
    return el;
  }

  // Rebuild rows only on add/delete; typing edits in place so focus survives.
  _renderItems() {
    const items = this._config.items || [];
    if (this._rows && this._rows.length === items.length) return;
    this._wrap.innerHTML = "";
    this._rows = [];
    items.forEach((item, i) => {
      const row = document.createElement("div");
      row.style.cssText = "display:flex; align-items:center; gap:6px; margin-bottom:8px;";
      const label = this._input(item.label, "Display text", "1", () => {
        this._config.items[i] = { ...this._config.items[i], label: label.value };
        this._emit();
      });
      const val = this._input(item.path, "/dashboard/view or https://…", "1.6", () => {
        this._config.items[i] = { ...this._config.items[i], path: val.value };
        this._emit();
      });
      const del = document.createElement("ha-icon");
      del.icon = "mdi:delete-outline";
      del.title = "Remove";
      del.style.cssText = "cursor:pointer; color:var(--secondary-text-color); padding:6px;";
      del.addEventListener("click", () => {
        this._config.items = items.filter((_, n) => n !== i);
        this._rows = null;
        this._renderItems();
        this._emit();
      });
      row.append(label, val, del);
      this._wrap.appendChild(row);
      this._rows.push(row);
    });
    const add = document.createElement("div");
    add.style.cssText =
      "display:inline-flex; align-items:center; gap:4px; cursor:pointer; color:var(--primary-color); padding:2px 4px 10px;";
    add.innerHTML = `<ha-icon icon="mdi:plus"></ha-icon>Add destination`;
    add.addEventListener("click", () => {
      this._config.items = [...(this._config.items || []), { label: "", path: "" }];
      this._rows = null;
      this._renderItems();
      this._emit();
      this._wrap.querySelector("div:nth-last-child(2) input")?.focus();
    });
    this._wrap.appendChild(add);
  }

  _render() {
    if (!this._form) {
      this._form = document.createElement("ha-form");
      this._form.computeLabel = (s) =>
        ({ title: "Title", placeholder: "Placeholder (shown before a choice)",
           merge_query: "Merge query parameters" }[s.name] || s.name);
      this._form.computeHelper = (s) =>
        ({ merge_query: "Keep the URL's other parameters and only overlay each destination's own — e.g. a destination of ?seb-line=BNSF presets an SB Param Card without disturbing the rest." }[s.name]);
      this._form.addEventListener("value-changed", (e) => {
        this._config = { ...this._config, ...e.detail.value };
        this._emit();
      });
      this.appendChild(this._form);
      const lbl = document.createElement("div");
      lbl.textContent = "Destinations";
      lbl.style.cssText = "padding:16px 0 8px; color:var(--primary-text-color);";
      this.appendChild(lbl);
      this._wrap = document.createElement("div");
      this.appendChild(this._wrap);
      const hint = document.createElement("div");
      hint.textContent = "Paths navigate in place; http(s) URLs open in a new tab. To drive a parameter on THIS view, use an SB Param Card with “Show a dropdown” instead.";
      hint.style.cssText = "color:var(--secondary-text-color); font-size:.8em; padding:2px 4px;";
      this.appendChild(hint);
    }
    this._form.hass = this._hass;
    this._form.schema = [
      { name: "title", selector: { text: {} } },
      { name: "placeholder", selector: { text: {} } },
      { name: "merge_query", selector: { boolean: {} } },
    ];
    this._form.data = this._config;
    this._renderItems();
  }
}

customElements.define(CARD, SbNavSelect);
customElements.define("sb-nav-select-editor", SbNavSelectEditor);
window.customCards = window.customCards || [];
window.customCards.push({
  type: CARD,
  name: "SB Nav Select",
  description: "A dropdown of destinations: dashboard paths navigate in place, URLs open in a new tab.",
  preview: false,
  documentationURL: "https://github.com/snadboy/sb-nav-select",
});
console.info(`%c SB-NAV-SELECT %c v${VERSION} `, "background:#455a64;color:#fff", "background:#90a4ae;color:#000");
