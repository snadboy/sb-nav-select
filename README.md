# SB Nav Select — RETIRED (2026-09-23)

**This card is retired and the repository is archived.** Its reason to exist — driving a parameter on a view from a dropdown — lives in [SB Param Card](https://github.com/snadboy/sb-param-card) (*Show a dropdown*). Navigation between views is better served by Home Assistant's own view tabs and `navigate` actions. The last release, v0.7.0, remains installable but is unmaintained.

---

# SB Nav Select

A Home Assistant dashboard card: a dropdown of **destinations**. Everything is
set up in the visual editor — no YAML, no helper entities.

- Items are *label + path*. Dashboard paths navigate in place, query strings
  included — `/dashboard-monitor/metra-tables?seb-line=BNSF` lands on a view
  with an [SB Param Card](https://github.com/snadboy/sb-param-card) preset.
- `http(s)://` destinations open in a new tab.
- The dropdown tracks the current URL: on one of the destinations it shows as
  selected, otherwise the placeholder shows.
- **Merge query parameters** keeps the URL's other parameters and overlays
  only the destination's own (an empty value clears one).

**Driving a parameter on the same view** (the old "filter mode") lives in
SB Param Card since 0.7.0: add one, turn on *Show a dropdown*, and it is the
knob for every card sharing its key. A leftover filter-mode config of this
card renders a notice saying so.

## Installation (HACS)

1. HACS → custom repositories → `snadboy/sb-nav-select`, category **Dashboard**.
2. Install, refresh the browser.
3. Add card → "SB Nav Select". Add destinations in the editor.

## Options

| Option | Meaning |
|---|---|
| `title` | Label to the left of the dropdown |
| `placeholder` | Text shown before a choice (default "Select…") |
| `items` | `label` + `path`, edited visually |
| `merge_query` | Keep the URL's other query parameters |

MIT licensed.
