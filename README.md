# SB Nav Select

A Home Assistant dashboard card: a **dropdown of destinations** — pick one,
go there. Configure the list entirely in the visual editor (display text +
path per row). No YAML, no helper entities.

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
| `title` | Label to the left of the dropdown |
| `placeholder` | Text shown before a choice (default "Select…") |
| `items` | The destinations: `label` + `path` per row, edited visually |

MIT licensed.
