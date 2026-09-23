# SB Filter Select

A Home Assistant dashboard card: a dropdown — **the knob** — that drives one
or more [SB Param Card](https://github.com/snadboy/sb-param-card) sockets on
the same view, or navigates to configured destinations. Everything is set up
in the visual editor. No YAML, no URLs to hand-craft, no helper entities.

## The three SB cards — one wire, three roles

| Card | Role | URL |
|---|---|---|
| **SB Filter Select** (`sb-nav-select`) | the **knob** — the only card that offers a choice; renders nothing else | **writes** `?seb-<target>=value` |
| **SB Param Card** (`sb-param-card`) | the **socket** — the only card that reads a value; wraps any card and substitutes `$parameter$` into it | **reads** `seb-<storage_id>` |
| **SB Entity Browser** (`sb-entity-browser`) | just a card — wrapped in a socket like a map or a markdown card would be | — |

A knob and a socket are wired by sharing a key (`target` on the knob =
`storage_id` on the socket). The socket accepts from the URL only the values
the knob offers, so the knob's list is the single source of truth; a link
carrying anything else falls back to the socket's `default`. One knob can
drive many sockets; two knobs on a view use two keys.

**Filter mode** (default): pick the target socket from a dropdown (the editor
finds the view's Param Cards automatically), then add items as *label +
value*. Choosing an item rewrites only that key's query parameter, so several
selects coexist on one view. The value means whatever the wrapped card makes
of it: an entity id, a template value, or — for a wrapped Entity Browser —
a pattern ("fp300 occupancy", `*` wildcards). An empty value clears it. The
knob publishes its choices on the page (`window.__sbKnobs`), which is how
the sockets know what to accept.

**Navigate mode**: items are *label + path* destinations.

- Paths navigate in place, query strings included — a destination can carry
  `?seb-<key>=value` to land on a view with its sockets preset.
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
| `target` | Filter mode: the target SB Param Card (socket), picked from a dropdown |
| `title` | Label to the left of the dropdown |
| `placeholder` | Text shown before a choice (default "Select…") |
| `items` | `label` + `value` (filter) or `label` + `path` (navigate), edited visually. In filter mode this list is the sockets' allowlist |
| `items_source` | `static` (default) or `entity` — choices from live state |
| `source_entity` / `source_attribute` | Where dynamic choices come from: a dict attribute contributes its keys, a list its entries |
| `source_all_label` | Optional first choice that clears the filter (e.g. "All lines") |
| `merge_query` | Navigate mode: keep the URL's other query parameters |

MIT licensed.
