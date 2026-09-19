# SB Filter Select

A Home Assistant dashboard card: a dropdown that **filters an
[SB Entity Browser](https://github.com/snadboy/sb-entity-browser) card on the
same view** — or navigates to configured destinations. Everything is set up
in the visual editor. No YAML, no URLs to hand-craft, no helper entities.

**Filter mode** (default): pick the target browser card from a dropdown (the
editor finds the view's cards automatically), then add items as *label +
pattern* — the same plain syntax as the browser card's own pattern field
("fp300 occupancy"). Choosing an item rewrites only that card's query
parameter, so several selects coexist on one view. An empty pattern means
"show everything".

**Navigate mode**: items are *label + path* destinations.

- Paths navigate in place, query strings included — pairs perfectly with
  [SB Entity Browser](https://github.com/snadboy/sb-entity-browser)'s
  `?seb-<storage_id>=<pattern>` URL filters.
- `http(s)://` destinations open in a new tab.
- The dropdown tracks the current URL: when you're on one of the configured
  destinations, it shows as selected; otherwise the placeholder shows.

## Installation (HACS)

1. HACS → custom repositories → `snadboy/sb-nav-select`, category **Dashboard**.
2. Install, refresh the browser.
3. Add card → "SB Nav Select". Add destinations in the editor.

## Options

| Option | Meaning |
|---|---|
| `mode` | `filter` (default) or `navigate` |
| `target` | Filter mode: the target browser card, picked from a dropdown |
| `title` | Label to the left of the dropdown |
| `placeholder` | Text shown before a choice (default "Select…") |
| `items` | `label` + `value` (filter) or `label` + `path` (navigate), edited visually |
| `items_source` | `static` (default) or `entity` — choices from live state |
| `source_entity` / `source_attribute` | Where dynamic choices come from: a dict attribute contributes its keys, a list its entries |
| `source_all_label` | Optional first choice that clears the filter (e.g. "All lines") |
| `merge_query` | Navigate mode: keep the URL's other query parameters |

MIT licensed.
