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

## v0.6.0 — the knob (2026-09-23)

The three cards were confusing the user ("don't Filter Select and Param Card
do the same thing?"). They did not, but Param Card carried a labelled choice
list it never displayed, and Entity Browser read the URL on its own — two
exceptions to a model that is otherwise one wire and three roles:

- **knob** = this card: the only one that offers a choice, writes the URL.
- **socket** = SB Param Card: the only one that reads the URL.
- **everything else is just a card**, Entity Browser included (wrapped).

What changed here: a filter-mode select **publishes its resolved choices**
under its key in `window.__sbKnobs` (`_publish()`, on render/connect; deleted
on disconnect) and fires `sb-knob-changed` on `window`. Sockets sharing the
key allowlist exactly those values. Page-global on purpose: cards cannot see
each other and the URL is global too. Target discovery (`findTargets`) now
recognises only `_sbFilterTarget` — Entity Browser is no longer a target.
Editor wording follows.

## One name: SB Filter Select (v0.6.1, 2026-09-23)

The user spotted the card answering to two names — HACS/`hacs.json` said
"SB Nav Select", the picker and every README said "SB Filter Select". Now
"SB Filter Select" everywhere user-facing; the repo slug, HACS repository
path and element tag stay `sb-nav-select` (renaming those breaks the
install and every dashboard). `sb-nav-select` is a historical name from
when navigate mode was the only mode.
