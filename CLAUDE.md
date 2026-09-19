# sb-nav-select — session notes

Micro HACS dashboard card (born 2026-09-19 from the sb-entity-browser session):
a dropdown of {label, path} destinations; choosing navigates (pushState +
location-changed; http(s) opens new tab). Fully visual editor with repeatable
label/path rows (focus-safe rebuild-on-add/delete pattern, plain <input>s —
same traps as sb-entity-browser: ha-textfield unreliable outside ha-form,
.gz sibling on manual deploys, cards render detached).

| | |
|---|---|
| Repo | github.com/snadboy/sb-nav-select — local `~/projects/git/sb-nav-select` |
| Card | `custom:sb-nav-select` + `sb-nav-select-editor` |
| File | `dist/sb-nav-select.js` — vanilla JS, no build; bump VERSION + tag + release |
| Why | user wanted a Selector card with an internal config list, ZERO YAML (core entities-card navigation rows rejected for being YAML-edited) |

Selection syncs to the current URL (location-changed/popstate). Demo card on
dashboard-monitor/card-lab pointing at the seb-lab-occ URL filters.
