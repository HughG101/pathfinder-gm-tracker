# Pathfinder 2e GM Combat Tracker

A static, responsive encounter manager intended for GitHub Pages.

## Included in this starter build

- Multiple saved encounters
- Player, creature, NPC, and hazard combatants
- Initiative sorting, rounds, and turns
- Current, maximum, and temporary HP
- AC, saves, Perception, conditions, resistances, weaknesses, and immunities
- Configurable action counts, reactions, and freeform condition tracking
- Attacks, damage dice, attack bonuses, and MAP notes
- Spell attack, spell DC, prepared spells, and spell slots
- Persistent damage notes and flat recovery checks
- Automatic dice roller
- Encounter notes and treasure
- Browser storage
- JSON export/import
- Responsive desktop, tablet, iPhone, and iPad layout
- Searchable sample compendium
- Homebrew compendium entries

## Important scope note

The project includes the application and sample data, but it does not include the complete Pathfinder rules database. Add properly licensed rules data to the `data` folder or expand the built-in sample entries in `js/app.js`.

## Running locally

Open `index.html` directly in a browser, or use a local development server.

## Publishing with GitHub Pages

1. Create a new GitHub repository.
2. Upload all files and folders from this project.
3. Open the repository settings.
4. Select **Pages**.
5. Choose **Deploy from a branch**.
6. Select the `main` branch and `/root`.
7. Save.

## Saving on iPhone and iPad

The tracker saves automatically in browser storage. Use **Export JSON** regularly as a backup. On iOS or iPadOS, the exported file is saved through the browser's normal Files/share workflow. Use **Import JSON** to restore it.

Browser storage may be removed if website data is cleared, so JSON backups are strongly recommended.

## Suggested next development steps

- Replace sample compendium entries with licensed data
- Add complete weak/elite adjustment automation
- Add a creature-building-by-level tool
- Add rune-driven attack and damage calculations
- Add structured condition automation
- Add encounter XP budgeting
- Add optional cloud synchronization
