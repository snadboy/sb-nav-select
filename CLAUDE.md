# sb-nav-select — session notes

Micro HACS dashboard card "SB Filter Select" (born 2026-09-19 from the
sb-entity-browser session). v0.3.0 has two modes:
- FILTER (default): editor auto-discovers sb-entity-browser cards on the view
  (DOM scan for _config.storage_id/title) → target dropdown; items are
  {label, value} where value is a plain pattern in the target card's syntax.
  Selection rewrites only ?seb-<target>= in place (merge by construction);
  since browser card v0.9.0 the URL filter NARROWS the card's base config
  (two-tier model), it does not replace it. Empty value clears.
- NAVIGATE: {label, path} destinations, optional merge_query (keep other
  params; empty param value clears one). Pre-mode configs load as navigate.
Fully visual editor with repeatable rows (focus-safe rebuild-on-add/delete,
plain <input>s — same traps as sb-entity-browser: ha-textfield unreliable
outside ha-form, .gz sibling on manual deploys, cards render detached,
native-select popup needs option colors + color-scheme for dark themes).

| | |
|---|---|
| Repo | github.com/snadboy/sb-nav-select — local `~/projects/git/sb-nav-select` |
| Card | `custom:sb-nav-select` + `sb-nav-select-editor` |
| File | `dist/sb-nav-select.js` — vanilla JS, no build; bump VERSION + tag + release |
| Why | user wanted a Selector card with an internal config list, ZERO YAML (core entities-card navigation rows rejected for being YAML-edited) |

Selection syncs to the current URL (location-changed/popstate). Three demo
filter-mode cards on dashboard-monitor/card-lab (occ/switches/batteries —
the Batteries one is USER-built via GUI; view is GUI-owned, edit surgically).
