/* SB Filter Select — a dropdown that filters or navigates.
 *
 * Filter mode (default): target an SB Entity Browser card ON THIS VIEW —
 * picked from a dropdown in the editor, no URLs involved — and each item is
 * a label + a plain pattern (same syntax as the browser card's own pattern
 * field). Choosing an item rewrites only that card's query parameter in
 * place, so several selects coexist on one view.
 *
 * Navigate mode: a configured list of {label, path} destinations; choosing
 * one navigates there (optionally merging query params).
 *
 * Fully visual editor, no YAML, no helper entities.
 */

const CARD = "sb-nav-select";
const VERSION = "0.4.0";

const fire = (node, type, detail) =>
  node.dispatchEvent(new CustomEvent(type, { detail, bubbles: true, composed: true }));

const esc = (v) =>
  String(v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// Find the filter targets currently in the document (shadow roots included)
// — how the editor offers targets without anyone typing an id. Any card can
// opt in by setting `_sbFilterTarget = {id, title}` (SB Param Card does);
// SB Entity Browser is recognised by its config for older versions.
const findBrowserCards = () => {
  const out = [];
  const add = (id, title) => {
    if (id && !out.some((o) => o.id === id)) out.push({ id, title: title || id });
  };
  const walk = (root) => {
    for (const el of root.querySelectorAll("*")) {
      if (el._sbFilterTarget) add(el._sbFilterTarget.id, el._sbFilterTarget.title);
      else if (el.tagName === "SB-ENTITY-BROWSER" && el._config?.storage_id)
        add(el._config.storage_id, el._config.title);
      if (el.shadowRoot) walk(el.shadowRoot);
    }
  };
  walk(document);
  return out;
};

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
      mode: "filter",
      title: "Filter",
      items: [{ label: "Everything", value: "" }],
    };
  }

  setConfig(config) {
    if (!config || !(config.items || []).length) {
      throw new Error("Add at least one item");
    }
    // Back-compat: configs from before modes existed are navigate configs.
    this._mode = config.mode || ((config.items || []).some((i) => i?.path != null) ? "navigate" : "filter");
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
    return (this._config.items || []).filter((i) => i && (i.label || i.path || i.value));
  }

  _paramKey() {
    return `seb-${this._config.target || ""}`;
  }

  _parse(path) {
    const [p, q] = String(path || "").split("?");
    return { pathname: p, params: new URLSearchParams(q || "") };
  }

  _currentIndex() {
    const items = this._items();
    if (this._mode === "filter") {
      const live = (new URLSearchParams(location.search).get(this._paramKey()) || "").trim();
      return items.findIndex((i) => (i.value || "").trim() === live);
    }
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
    if (this._mode === "filter") {
      const params = new URLSearchParams(location.search);
      const v = (item.value || "").trim();
      v ? params.set(this._paramKey(), v) : params.delete(this._paramKey());
      const q = params.toString();
      history.pushState(null, "", location.pathname + (q ? "?" + q : "") + location.hash);
      fire(this, "location-changed", {});
      return;
    }
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
    const unconfigured = this._mode === "filter" && !this._config.target;
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
        ${unconfigured
          ? `<div class="warn">Pick a target card in the editor</div>`
          : `<select>
               <option value="-1" ${cur === -1 ? "selected" : ""} disabled hidden>${esc(this._config.placeholder || "Select…")}</option>
               ${items.map((i, n) => `<option value="${n}" ${n === cur ? "selected" : ""}>${esc(i.label || i.value || i.path)}</option>`).join("")}
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
    const prevMode = this._mode;
    this._config = { items: [], ...config };
    this._mode = this._config.mode || ((this._config.items || []).some((i) => i?.path != null) ? "navigate" : "filter");
    if (prevMode && prevMode !== this._mode) this._rows = null; // row placeholders change
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

  // Rebuild rows only on add/delete or mode switch; typing edits in place.
  _renderItems() {
    const items = this._config.items || [];
    if (this._rows && this._rows.length === items.length) return;
    const filter = this._mode === "filter";
    const key = filter ? "value" : "path";
    this._wrap.innerHTML = "";
    this._rows = [];
    items.forEach((item, i) => {
      const row = document.createElement("div");
      row.style.cssText = "display:flex; align-items:center; gap:6px; margin-bottom:8px;";
      const label = this._input(item.label, "Display text", "1", () => {
        this._config.items[i] = { ...this._config.items[i], label: label.value };
        this._emit();
      });
      const val = this._input(
        item[key],
        filter ? "Pattern or parameter value — e.g. fp300 occupancy" : "/dashboard/view or https://…",
        "1.6",
        () => {
          this._config.items[i] = { ...this._config.items[i], [key]: val.value };
          this._emit();
        }
      );
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
    add.innerHTML = `<ha-icon icon="mdi:plus"></ha-icon>Add item`;
    add.addEventListener("click", () => {
      this._config.items = [...(this._config.items || []), { label: "" }];
      this._rows = null;
      this._renderItems();
      this._emit();
      this._wrap.querySelector("div:nth-last-child(2) input")?.focus();
    });
    this._wrap.appendChild(add);
    this._hint.textContent = filter
      ? "Patterns use the target card's own syntax: words match ids AND friendly names in any order (“fp300 occupancy”); * wildcards work. An empty pattern shows everything."
      : "Paths navigate in place; http(s) URLs open in a new tab. “Merge query parameters” keeps other cards' filters intact.";
  }

  _render() {
    if (!this._form) {
      this._form = document.createElement("ha-form");
      this._form.computeLabel = (s) =>
        ({ mode: "Mode", target: "Target card (on this view)", title: "Title",
           placeholder: "Placeholder (shown before a choice)", merge_query: "Merge query parameters" }[s.name] || s.name);
      this._form.computeHelper = (s) =>
        ({ target: "The SB Entity Browser card this dropdown filters. Cards are found automatically on the current view.",
           merge_query: "Keep the URL's other parameters and only overlay each destination's own." }[s.name]);
      this._form.addEventListener("value-changed", (e) => {
        const modeChanged = e.detail.value.mode && e.detail.value.mode !== this._mode;
        this._config = { ...this._config, ...e.detail.value };
        if (modeChanged) {
          this._mode = this._config.mode;
          this._rows = null;
        }
        this._emit();
        this._render();
      });
      this.appendChild(this._form);
      const lbl = document.createElement("div");
      lbl.textContent = "Items";
      lbl.style.cssText = "padding:16px 0 8px; color:var(--primary-text-color);";
      this.appendChild(lbl);
      this._wrap = document.createElement("div");
      this.appendChild(this._wrap);
      this._hint = document.createElement("div");
      this._hint.style.cssText = "color:var(--secondary-text-color); font-size:.8em; padding:2px 4px;";
      this.appendChild(this._hint);
    }
    const filter = this._mode === "filter";
    const targets = filter ? findBrowserCards() : [];
    this._form.schema = [
      {
        name: "mode",
        selector: {
          select: {
            mode: "dropdown",
            options: [
              { value: "filter", label: "Filter a card on this view" },
              { value: "navigate", label: "Navigate to a URL" },
            ],
          },
        },
      },
      ...(filter
        ? [{
            name: "target",
            selector: {
              select: {
                mode: "dropdown",
                options: targets.length
                  ? targets.map((t) => ({ value: t.id, label: t.title }))
                  : [{ value: this._config.target || "", label: "(no browser cards found on this view)" }],
              },
            },
          }]
        : [{ name: "merge_query", selector: { boolean: {} } }]),
      { name: "title", selector: { text: {} } },
      { name: "placeholder", selector: { text: {} } },
    ];
    this._form.hass = this._hass;
    this._form.data = { mode: this._mode, ...this._config };
    this._renderItems();
  }
}

customElements.define(CARD, SbNavSelect);
customElements.define("sb-nav-select-editor", SbNavSelectEditor);
window.customCards = window.customCards || [];
window.customCards.push({
  type: CARD,
  name: "SB Filter Select",
  description: "A dropdown that filters an SB Entity Browser card on the view (picked visually — no URLs), or navigates to configured destinations.",
  preview: true,
  documentationURL: "https://github.com/snadboy/sb-nav-select",
});
console.info(`%c SB-NAV-SELECT %c v${VERSION} `, "background:#455a64;color:#fff", "background:#90a4ae;color:#000");
