# Pathfinder 2e GM Tracker v2

This version removes the compendium and replaces it with a complete manual combatant builder.

## Major changes

- No built-in compendium.
- Manually create players, creatures, NPCs, and hazards.
- Full fields for senses, languages, speed, ability modifiers, saves, skills, defenses, conditions, items, attacks, actions, reactions, abilities, spells, and focus points.
- Every attack name is editable, including homebrew attack names.
- Attacks support action cost, traits, attack modifier, damage dice, type, range, reload, ammunition, and special effects.
- Actions support configurable action costs.
- Includes the supplied Red Sun illusionist stat block as a removable/editable sample combatant.
- Browser save, JSON import/export, initiative, HP, action tracking, reactions, and dice rolling remain included.

## Updating GitHub Pages

Upload and replace:

- `index.html`
- `styles/main.css`
- `js/app.js`
- `README.md`

Keep the folder structure exactly as shown.


## Version 5 optional GM tools

- Creature builder by level using selected GM Core reference values
- Rune-driven attack and damage calculation
- Structured conditions with frightened, slowed, stunned, dying, wounded, and other common conditions
- Turn-start/end automation for frightened, slowed, stunned, and quickened
- Dying recovery checks
- Encounter XP budget calculator adjusted for party size
- Optional WebDAV cloud upload/download

The creature builder produces suggested, editable statistics. It is not a substitute for reviewing the complete creature-building guidance.

Cloud synchronization requires a private WebDAV-compatible provider that allows CORS requests from your GitHub Pages domain. Credentials are held only in the current page session and are not written into the tracker save.


## Version 6 stat block importer
Paste a PF2e-style stat block, preview recognized fields, and add it to the current encounter. The original text is preserved in combatant notes for manual correction.


## Version 7 editable stat-block preview
Edit recognized values, reorder or remove sections, and add/delete attacks, actions, reactions, abilities, spells, skills, and items before importing.


## Version 8 spell-slot tracking

- Add spell-slot ranks in the Combatant Builder.
- Set maximum and used slots.
- Encounter cards show remaining slots by rank.
- Use, restore, or click individual slot markers directly on the encounter page.
- Focus points can be tracked with a rank named `Focus`.
- The editable stat-block preview also supports spell-slot rows.


## Version 9 hazards and encounter notes

- Hazard importer support for XP, Stealth/Detection, Disable, Trigger, Effect, and Reset.
- Editable hazard section in the stat-block preview.
- Dedicated hazard fields in the Combatant Builder.
- Compact hazard details on encounter cards.
- Collapsible small-text combatant notes on the encounter page.
