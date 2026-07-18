(() => {
  "use strict";

  const STORAGE_KEY = "pf2e-gm-tracker-v1";
  const HOME_BREW_KEY = "pf2e-gm-homebrew-v1";

  const sampleCompendium = [
    {id:"action-demoralize", category:"action", name:"Demoralize", level:0, traits:["auditory","emotion","fear","mental"], description:"Attempt an Intimidation check against a creature's Will DC. On a success, the target becomes frightened 1; on a critical success, frightened 2."},
    {id:"action-trip", category:"action", name:"Trip", level:0, traits:["attack"], description:"Attempt an Athletics check against the target's Reflex DC. On a success, the target falls prone."},
    {id:"spell-fear", category:"spell", name:"Fear", level:1, traits:["emotion","fear","mental"], description:"The target attempts a Will save and may become frightened depending on the degree of success."},
    {id:"condition-frightened", category:"condition", name:"Frightened", level:0, traits:[], description:"Apply a status penalty equal to the frightened value to checks and DCs. The value normally decreases by 1 at the end of the creature's turn."},
    {id:"condition-off-guard", category:"condition", name:"Off-Guard", level:0, traits:[], description:"A creature that is off-guard takes a –2 circumstance penalty to AC."},
    {id:"creature-goblin-warrior", category:"creature", name:"Goblin Warrior (sample)", level:-1, traits:["goblin","humanoid"], description:"Sample creature entry. Use Add to Encounter, then edit statistics as needed.", combatant:{type:"Creature",level:-1,maxHp:6,hp:6,tempHp:0,ac:16,fort:5,ref:8,will:3,perception:5,initiative:5,maxActions:3,attacks:[{name:"Dogslicer",attack:8,damage:"1d6+1",map:"-5/-10"}]}},
    {id:"hazard-pit", category:"hazard", name:"Simple Pit (sample)", level:0, traits:["mechanical","trap"], description:"A concealed pit that opens when stepped on. Replace with properly licensed statistics for your campaign."},
    {id:"rune-potency", category:"rune", name:"Weapon Potency Rune", level:2, traits:["magical"], description:"Increases a weapon's item bonus to attack rolls. Higher grades provide larger bonuses."},
    {id:"loot-healing-potion", category:"loot", name:"Healing Potion (sample)", level:1, traits:["consumable","healing","magical","potion"], description:"A consumable healing item. Enter the appropriate healing dice for the item grade you are using."}
  ];

  const defaultCombatant = (name = "New Combatant") => ({
    id: crypto.randomUUID(),
    name,
    type: "Creature",
    level: 1,
    initiative: 0,
    maxHp: 20,
    hp: 20,
    tempHp: 0,
    ac: 15,
    fort: 5,
    ref: 5,
    will: 5,
    perception: 5,
    maxActions: 3,
    actionsUsed: 0,
    reactionUsed: false,
    spellAttack: 0,
    spellDc: 10,
    resistances: "",
    weaknesses: "",
    immunities: "",
    conditions: "",
    persistent: "",
    attacks: [{name:"Strike", attack:5, damage:"1d6+2", map:"-5/-10"}],
    spells: [],
    slots: Array.from({length: 10}, (_, i) => ({rank:i+1, max:0, used:0})),
    notes: ""
  });

  const defaultEncounter = (name = "New Encounter") => ({
    id: crypto.randomUUID(),
    name,
    round: 1,
    turnIndex: -1,
    combatants: [],
    notes: "",
    loot: []
  });

  let state = loadState();
  let selectedCombatantId = null;
  let homebrew = loadJson(HOME_BREW_KEY, []);

  const $ = id => document.getElementById(id);

  function loadJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function loadState() {
    const loaded = loadJson(STORAGE_KEY, null);
    if (loaded && Array.isArray(loaded.encounters) && loaded.encounters.length) return loaded;
    return { currentEncounterId: null, encounters: [defaultEncounter("First Encounter")] };
  }

  function currentEncounter() {
    let encounter = state.encounters.find(e => e.id === state.currentEncounterId);
    if (!encounter) {
      encounter = state.encounters[0];
      state.currentEncounterId = encounter.id;
    }
    return encounter;
  }

  function saveState(showMessage = false) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    if (showMessage) toast("Saved on this device.");
  }

  function toast(message) {
    const el = $("toast");
    el.textContent = message;
    el.classList.add("show");
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => el.classList.remove("show"), 2200);
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, ch => ({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
    })[ch]);
  }

  function parseDice(expression) {
    const cleaned = String(expression).replace(/\s+/g, "").toLowerCase();
    const match = cleaned.match(/^(\d*)d(\d+)([+-]\d+)?$/);
    if (!match) throw new Error("Use dice format such as 1d20+7.");
    const count = Number(match[1] || 1);
    const sides = Number(match[2]);
    const modifier = Number(match[3] || 0);
    if (count < 1 || count > 100 || sides < 2 || sides > 1000) throw new Error("Dice expression is outside allowed limits.");
    const rolls = Array.from({length: count}, () => Math.floor(Math.random() * sides) + 1);
    return {rolls, modifier, total: rolls.reduce((a,b) => a+b, 0) + modifier};
  }

  function rollText(expression) {
    const result = parseDice(expression);
    const mod = result.modifier ? ` ${result.modifier >= 0 ? "+" : "-"} ${Math.abs(result.modifier)}` : "";
    return `${expression}: [${result.rolls.join(", ")}]${mod} = ${result.total}`;
  }

  function renderAll() {
    renderEncounterSelect();
    renderEncounter();
    renderCombatantPicker();
    renderCombatantEditor();
    renderCompendium();
    renderNotesAndLoot();
    saveState();
  }

  function renderEncounterSelect() {
    const select = $("encounterSelect");
    select.innerHTML = state.encounters.map(e =>
      `<option value="${e.id}" ${e.id === state.currentEncounterId ? "selected" : ""}>${escapeHtml(e.name)}</option>`
    ).join("");
  }

  function renderEncounter() {
    const encounter = currentEncounter();
    $("encounterName").value = encounter.name;
    $("roundValue").textContent = encounter.round;
    const active = encounter.combatants[encounter.turnIndex];
    $("turnLabel").textContent = active ? active.name : "No active combatant";

    const list = $("initiativeList");
    if (!encounter.combatants.length) {
      list.innerHTML = `<div class="card"><p>No combatants yet. Use <strong>Add Combatant</strong> to begin.</p></div>`;
      return;
    }

    list.innerHTML = encounter.combatants.map((c, index) => {
      const hpPercent = c.maxHp > 0 ? Math.max(0, Math.min(100, c.hp / c.maxHp * 100)) : 0;
      const actions = Array.from({length: c.maxActions}, (_, i) =>
        `<button type="button" class="action-dot ${i < c.actionsUsed ? "used" : ""}" data-action-toggle="${c.id}" data-action-index="${i}" title="Toggle action ${i+1}">${i+1}</button>`
      ).join("");
      const attacks = (c.attacks || []).map((a, ai) =>
        `<button type="button" data-roll-attack="${c.id}" data-attack-index="${ai}">${escapeHtml(a.name)} +${Number(a.attack)||0}</button>
         <button type="button" data-roll-damage="${c.id}" data-attack-index="${ai}">${escapeHtml(a.damage)}</button>`
      ).join("");

      return `<article class="combatant-card ${index === encounter.turnIndex ? "active-turn" : ""}" data-id="${c.id}">
        <div class="combatant-top">
          <div>
            <div class="combatant-name">${escapeHtml(c.name)}</div>
            <span class="badge">${escapeHtml(c.type)} · Level ${c.level}</span>
            ${c.conditions ? `<span class="badge">${escapeHtml(c.conditions)}</span>` : ""}
          </div>
          <div><strong>Init ${c.initiative}</strong></div>
          <div><strong>AC ${c.ac}</strong></div>
          <button type="button" data-edit-combatant="${c.id}">Edit</button>
        </div>
        <div class="hp-bar" aria-label="${escapeHtml(c.name)} hit points"><div class="hp-fill" style="width:${hpPercent}%"></div></div>
        <div class="combatant-controls">
          <label>Amount<input type="number" value="1" min="0" data-amount="${c.id}"></label>
          <button type="button" data-damage="${c.id}">Damage</button>
          <button type="button" data-heal="${c.id}">Heal</button>
          <button type="button" data-temp="${c.id}">Temp HP</button>
          <span><strong>HP ${c.hp}/${c.maxHp}</strong>${c.tempHp ? ` +${c.tempHp} temp` : ""}</span>
          <button type="button" data-save="${c.id}" data-save-type="fort">Fort +${c.fort}</button>
          <button type="button" data-save="${c.id}" data-save-type="ref">Ref +${c.ref}</button>
          <button type="button" data-save="${c.id}" data-save-type="will">Will +${c.will}</button>
          <button type="button" data-perception="${c.id}">Perception +${c.perception}</button>
          <button type="button" data-reaction="${c.id}">${c.reactionUsed ? "Reaction Used" : "Reaction Ready"}</button>
          ${c.persistent ? `<button type="button" data-persistent="${c.id}">Persistent Check</button>` : ""}
        </div>
        <div class="action-track">${actions}</div>
        <div class="attack-list">${attacks}</div>
      </article>`;
    }).join("");

    bindEncounterCardEvents();
  }

  function bindEncounterCardEvents() {
    document.querySelectorAll("[data-edit-combatant]").forEach(btn => btn.addEventListener("click", () => {
      selectedCombatantId = btn.dataset.editCombatant;
      switchTab("combatant");
      renderCombatantPicker();
      renderCombatantEditor();
    }));

    document.querySelectorAll("[data-damage]").forEach(btn => btn.addEventListener("click", () => {
      const c = getCombatant(btn.dataset.damage);
      const amount = getAmount(c.id);
      let remaining = amount;
      if (c.tempHp > 0) {
        const absorbed = Math.min(c.tempHp, remaining);
        c.tempHp -= absorbed;
        remaining -= absorbed;
      }
      c.hp = Math.max(0, c.hp - remaining);
      renderAll();
    }));

    document.querySelectorAll("[data-heal]").forEach(btn => btn.addEventListener("click", () => {
      const c = getCombatant(btn.dataset.heal);
      c.hp = Math.min(c.maxHp, c.hp + getAmount(c.id));
      renderAll();
    }));

    document.querySelectorAll("[data-temp]").forEach(btn => btn.addEventListener("click", () => {
      const c = getCombatant(btn.dataset.temp);
      c.tempHp = Math.max(c.tempHp, getAmount(c.id));
      renderAll();
    }));

    document.querySelectorAll("[data-action-toggle]").forEach(btn => btn.addEventListener("click", () => {
      const c = getCombatant(btn.dataset.actionToggle);
      const index = Number(btn.dataset.actionIndex);
      c.actionsUsed = index < c.actionsUsed ? index : index + 1;
      renderAll();
    }));

    document.querySelectorAll("[data-reaction]").forEach(btn => btn.addEventListener("click", () => {
      const c = getCombatant(btn.dataset.reaction);
      c.reactionUsed = !c.reactionUsed;
      renderAll();
    }));

    document.querySelectorAll("[data-save]").forEach(btn => btn.addEventListener("click", () => {
      const c = getCombatant(btn.dataset.save);
      const key = btn.dataset.saveType;
      toast(rollText(`1d20+${Number(c[key]) || 0}`));
    }));

    document.querySelectorAll("[data-perception]").forEach(btn => btn.addEventListener("click", () => {
      const c = getCombatant(btn.dataset.perception);
      toast(rollText(`1d20+${Number(c.perception) || 0}`));
    }));

    document.querySelectorAll("[data-roll-attack]").forEach(btn => btn.addEventListener("click", () => {
      const c = getCombatant(btn.dataset.rollAttack);
      const attack = c.attacks[Number(btn.dataset.attackIndex)];
      toast(`${attack.name}: ${rollText(`1d20+${Number(attack.attack)||0}`)} · MAP ${attack.map || "-5/-10"}`);
    }));

    document.querySelectorAll("[data-roll-damage]").forEach(btn => btn.addEventListener("click", () => {
      const c = getCombatant(btn.dataset.rollDamage);
      const attack = c.attacks[Number(btn.dataset.attackIndex)];
      try { toast(`${attack.name} damage: ${rollText(attack.damage)}`); }
      catch (error) { toast(error.message); }
    }));

    document.querySelectorAll("[data-persistent]").forEach(btn => btn.addEventListener("click", () => {
      const c = getCombatant(btn.dataset.persistent);
      const flat = Math.floor(Math.random() * 20) + 1;
      toast(`${c.name} persistent recovery flat check: ${flat}. Default recovery succeeds on 15+.`);
    }));
  }

  function getAmount(id) {
    const input = document.querySelector(`[data-amount="${id}"]`);
    return Math.max(0, Number(input?.value) || 0);
  }

  function getCombatant(id) {
    return currentEncounter().combatants.find(c => c.id === id);
  }

  function renderCombatantPicker() {
    const encounter = currentEncounter();
    if (!selectedCombatantId && encounter.combatants[0]) selectedCombatantId = encounter.combatants[0].id;
    $("combatantPicker").innerHTML = encounter.combatants.length
      ? encounter.combatants.map(c => `<button type="button" data-pick="${c.id}" class="${c.id === selectedCombatantId ? "selected" : ""}">${escapeHtml(c.name)}</button>`).join("")
      : "<p class='muted'>No combatants.</p>";
    document.querySelectorAll("[data-pick]").forEach(btn => btn.addEventListener("click", () => {
      selectedCombatantId = btn.dataset.pick;
      renderCombatantPicker();
      renderCombatantEditor();
    }));
  }

  function renderCombatantEditor() {
    const c = getCombatant(selectedCombatantId);
    const ids = ["cName","cType","cLevel","cInitiative","cMaxHp","cHp","cTempHp","cAc","cFort","cRef","cWill","cPerception","cMaxActions","cSpellAttack","cSpellDc","cResistances","cWeaknesses","cImmunities","cConditions","cPersistent","cNotes"];
    if (!c) {
      ids.forEach(id => { if ($(id)) $(id).value = ""; });
      $("attackEditor").innerHTML = "";
      $("spellEditor").innerHTML = "";
      $("slotEditor").innerHTML = "";
      return;
    }
    const map = {
      cName:"name",cType:"type",cLevel:"level",cInitiative:"initiative",cMaxHp:"maxHp",cHp:"hp",
      cTempHp:"tempHp",cAc:"ac",cFort:"fort",cRef:"ref",cWill:"will",cPerception:"perception",
      cMaxActions:"maxActions",cSpellAttack:"spellAttack",cSpellDc:"spellDc",cResistances:"resistances",
      cWeaknesses:"weaknesses",cImmunities:"immunities",cConditions:"conditions",cPersistent:"persistent",cNotes:"notes"
    };
    Object.entries(map).forEach(([id,key]) => $(id).value = c[key] ?? "");
    renderAttackEditor(c);
    renderSpellEditor(c);
    renderSlotEditor(c);
  }

  function renderAttackEditor(c) {
    $("attackEditor").innerHTML = (c.attacks || []).map((a, i) => `
      <div class="attack-row">
        <label>Name<input data-attack-field="name" data-index="${i}" value="${escapeHtml(a.name)}"></label>
        <label>Attack bonus<input type="number" data-attack-field="attack" data-index="${i}" value="${Number(a.attack)||0}"></label>
        <label>Damage<input data-attack-field="damage" data-index="${i}" value="${escapeHtml(a.damage)}"></label>
        <label>MAP<input data-attack-field="map" data-index="${i}" value="${escapeHtml(a.map || "-5/-10")}"></label>
        <button type="button" data-remove-attack="${i}">Remove</button>
      </div>`).join("");
    document.querySelectorAll("[data-remove-attack]").forEach(btn => btn.addEventListener("click", () => {
      c.attacks.splice(Number(btn.dataset.removeAttack), 1);
      renderAttackEditor(c);
    }));
  }

  function renderSpellEditor(c) {
    $("spellEditor").innerHTML = (c.spells || []).map((s, i) => `
      <div class="spell-row">
        <label>Name<input data-spell-field="name" data-index="${i}" value="${escapeHtml(s.name)}"></label>
        <label>Rank<input type="number" data-spell-field="rank" data-index="${i}" value="${Number(s.rank)||1}"></label>
        <label>Effect<input data-spell-field="effect" data-index="${i}" value="${escapeHtml(s.effect || "")}"></label>
        <button type="button" data-remove-spell="${i}">Remove</button>
      </div>`).join("");
    document.querySelectorAll("[data-remove-spell]").forEach(btn => btn.addEventListener("click", () => {
      c.spells.splice(Number(btn.dataset.removeSpell), 1);
      renderSpellEditor(c);
    }));
  }

  function renderSlotEditor(c) {
    $("slotEditor").innerHTML = c.slots.map((slot, i) => `
      <div class="slot-item">
        <strong>Rank ${slot.rank}</strong>
        <label>Maximum<input type="number" min="0" data-slot-max="${i}" value="${slot.max}"></label>
        <label>Used<input type="number" min="0" data-slot-used="${i}" value="${slot.used}"></label>
      </div>`).join("");
  }

  function collectCombatantEditor(c) {
    const fields = {
      name:"cName", type:"cType", level:"cLevel", initiative:"cInitiative", maxHp:"cMaxHp", hp:"cHp",
      tempHp:"cTempHp", ac:"cAc", fort:"cFort", ref:"cRef", will:"cWill", perception:"cPerception",
      maxActions:"cMaxActions", spellAttack:"cSpellAttack", spellDc:"cSpellDc", resistances:"cResistances",
      weaknesses:"cWeaknesses", immunities:"cImmunities", conditions:"cConditions", persistent:"cPersistent", notes:"cNotes"
    };
    const numeric = new Set(["level","initiative","maxHp","hp","tempHp","ac","fort","ref","will","perception","maxActions","spellAttack","spellDc"]);
    Object.entries(fields).forEach(([key,id]) => c[key] = numeric.has(key) ? Number($(id).value) || 0 : $(id).value.trim());

    c.attacks = Array.from(document.querySelectorAll("#attackEditor .attack-row")).map((row, i) => ({
      name: row.querySelector(`[data-attack-field="name"]`).value.trim() || "Strike",
      attack: Number(row.querySelector(`[data-attack-field="attack"]`).value) || 0,
      damage: row.querySelector(`[data-attack-field="damage"]`).value.trim() || "1d4",
      map: row.querySelector(`[data-attack-field="map"]`).value.trim() || "-5/-10"
    }));

    c.spells = Array.from(document.querySelectorAll("#spellEditor .spell-row")).map(row => ({
      name: row.querySelector(`[data-spell-field="name"]`).value.trim() || "Spell",
      rank: Number(row.querySelector(`[data-spell-field="rank"]`).value) || 1,
      effect: row.querySelector(`[data-spell-field="effect"]`).value.trim()
    }));

    c.slots = c.slots.map((slot, i) => ({
      rank: slot.rank,
      max: Number(document.querySelector(`[data-slot-max="${i}"]`)?.value) || 0,
      used: Number(document.querySelector(`[data-slot-used="${i}"]`)?.value) || 0
    }));
  }

  function allCompendium() {
    return [...sampleCompendium, ...homebrew];
  }

  function renderCompendium() {
    const query = $("compendiumSearch").value.trim().toLowerCase();
    const category = $("compendiumCategory").value;
    const entries = allCompendium().filter(entry => {
      const categoryMatch = category === "all" || entry.category === category;
      const haystack = `${entry.name} ${entry.description} ${(entry.traits || []).join(" ")}`.toLowerCase();
      return categoryMatch && haystack.includes(query);
    });

    $("compendiumResults").innerHTML = entries.length ? entries.map(entry => `
      <article class="compendium-entry">
        <h3>${escapeHtml(entry.name)}</h3>
        <span class="badge">${escapeHtml(entry.category)}${entry.level !== undefined ? ` · Level ${entry.level}` : ""}</span>
        ${(entry.traits || []).map(t => `<span class="badge">${escapeHtml(t)}</span>`).join(" ")}
        <p>${escapeHtml(entry.description)}</p>
        <div class="entry-actions">
          ${entry.category === "creature" ? `<button type="button" data-add-creature="${entry.id}">Add to Encounter</button>` : ""}
          ${entry.category === "loot" ? `<button type="button" data-add-entry-loot="${entry.id}">Add to Loot</button>` : ""}
          ${entry.category === "action" || entry.category === "spell" || entry.category === "rune" ? `<button type="button" data-copy-entry="${entry.id}">Copy Details</button>` : ""}
        </div>
      </article>`).join("") : "<p>No matching entries.</p>";

    document.querySelectorAll("[data-add-creature]").forEach(btn => btn.addEventListener("click", () => {
      const entry = allCompendium().find(e => e.id === btn.dataset.addCreature);
      const c = {...defaultCombatant(entry.name), ...(entry.combatant || {})};
      c.id = crypto.randomUUID();
      currentEncounter().combatants.push(c);
      selectedCombatantId = c.id;
      renderAll();
      toast(`${c.name} added.`);
    }));

    document.querySelectorAll("[data-add-entry-loot]").forEach(btn => btn.addEventListener("click", () => {
      const entry = allCompendium().find(e => e.id === btn.dataset.addEntryLoot);
      currentEncounter().loot.push({id:crypto.randomUUID(), name:entry.name, quantity:1, notes:entry.description});
      renderAll();
      toast("Loot added.");
    }));

    document.querySelectorAll("[data-copy-entry]").forEach(btn => btn.addEventListener("click", () => {
      const entry = allCompendium().find(e => e.id === btn.dataset.copyEntry);
      toast(`${entry.name}: ${entry.description}`);
    }));
  }

  function renderNotesAndLoot() {
    const encounter = currentEncounter();
    $("encounterNotes").value = encounter.notes || "";
    $("lootList").innerHTML = encounter.loot.length ? encounter.loot.map((item, i) => `
      <div class="loot-row">
        <label>Item<input data-loot-name="${i}" value="${escapeHtml(item.name)}"></label>
        <label>Quantity<input type="number" min="0" data-loot-qty="${i}" value="${Number(item.quantity)||1}"></label>
        <label>Notes<input data-loot-notes="${i}" value="${escapeHtml(item.notes || "")}"></label>
        <span></span>
        <button type="button" data-remove-loot="${i}">Remove</button>
      </div>`).join("") : "<p class='muted'>No treasure added.</p>";

    document.querySelectorAll("[data-remove-loot]").forEach(btn => btn.addEventListener("click", () => {
      encounter.loot.splice(Number(btn.dataset.removeLoot), 1);
      renderAll();
    }));
  }

  function switchTab(name) {
    document.querySelectorAll(".tab").forEach(btn => btn.classList.toggle("active", btn.dataset.tab === name));
    document.querySelectorAll(".tab-panel").forEach(panel => panel.classList.remove("active"));
    $(`${name}Tab`).classList.add("active");
  }

  document.querySelectorAll(".tab").forEach(btn => btn.addEventListener("click", () => switchTab(btn.dataset.tab)));

  $("newEncounterBtn").addEventListener("click", () => {
    const encounter = defaultEncounter(`Encounter ${state.encounters.length + 1}`);
    state.encounters.push(encounter);
    state.currentEncounterId = encounter.id;
    selectedCombatantId = null;
    renderAll();
  });

  $("saveBtn").addEventListener("click", () => {
    const c = getCombatant(selectedCombatantId);
    if (c && $("combatantTab").classList.contains("active")) collectCombatantEditor(c);
    currentEncounter().name = $("encounterName").value.trim() || "Untitled Encounter";
    currentEncounter().notes = $("encounterNotes").value;
    collectLoot();
    saveState(true);
    renderAll();
  });

  $("encounterSelect").addEventListener("change", e => {
    state.currentEncounterId = e.target.value;
    selectedCombatantId = null;
    renderAll();
  });

  $("encounterName").addEventListener("change", e => {
    currentEncounter().name = e.target.value.trim() || "Untitled Encounter";
    renderAll();
  });

  $("duplicateEncounterBtn").addEventListener("click", () => {
    const copy = structuredClone(currentEncounter());
    copy.id = crypto.randomUUID();
    copy.name += " Copy";
    copy.combatants.forEach(c => c.id = crypto.randomUUID());
    copy.loot.forEach(l => l.id = crypto.randomUUID());
    state.encounters.push(copy);
    state.currentEncounterId = copy.id;
    selectedCombatantId = null;
    renderAll();
  });

  $("deleteEncounterBtn").addEventListener("click", () => {
    if (state.encounters.length === 1) {
      toast("At least one encounter must remain.");
      return;
    }
    const id = currentEncounter().id;
    state.encounters = state.encounters.filter(e => e.id !== id);
    state.currentEncounterId = state.encounters[0].id;
    selectedCombatantId = null;
    renderAll();
  });

  $("sortInitiativeBtn").addEventListener("click", () => {
    const encounter = currentEncounter();
    encounter.combatants.sort((a,b) => b.initiative - a.initiative || b.perception - a.perception);
    encounter.turnIndex = encounter.combatants.length ? 0 : -1;
    renderAll();
  });

  $("nextTurnBtn").addEventListener("click", () => {
    const e = currentEncounter();
    if (!e.combatants.length) return;
    if (e.turnIndex >= 0) {
      const old = e.combatants[e.turnIndex];
      old.actionsUsed = 0;
      old.reactionUsed = false;
      if (old.conditions) {
        old.conditions = old.conditions.replace(/frightened\s+(\d+)/i, (_, n) => {
          const next = Math.max(0, Number(n) - 1);
          return next ? `frightened ${next}` : "";
        }).replace(/\s*,\s*,/g, ",").replace(/^,\s*|,\s*$/g, "").trim();
      }
    }
    e.turnIndex++;
    if (e.turnIndex >= e.combatants.length) {
      e.turnIndex = 0;
      e.round++;
    }
    renderAll();
  });

  $("prevTurnBtn").addEventListener("click", () => {
    const e = currentEncounter();
    if (!e.combatants.length) return;
    e.turnIndex--;
    if (e.turnIndex < 0) {
      e.turnIndex = e.combatants.length - 1;
      e.round = Math.max(1, e.round - 1);
    }
    renderAll();
  });

  $("addCombatantBtn").addEventListener("click", () => {
    const c = defaultCombatant();
    currentEncounter().combatants.push(c);
    selectedCombatantId = c.id;
    renderAll();
    switchTab("combatant");
  });

  $("applyCombatantBtn").addEventListener("click", () => {
    const c = getCombatant(selectedCombatantId);
    if (!c) return;
    collectCombatantEditor(c);
    saveState();
    renderAll();
    toast("Combatant updated.");
  });

  $("deleteCombatantBtn").addEventListener("click", () => {
    const e = currentEncounter();
    e.combatants = e.combatants.filter(c => c.id !== selectedCombatantId);
    selectedCombatantId = e.combatants[0]?.id || null;
    e.turnIndex = Math.min(e.turnIndex, e.combatants.length - 1);
    renderAll();
  });

  $("addAttackBtn").addEventListener("click", () => {
    const c = getCombatant(selectedCombatantId);
    if (!c) return;
    collectCombatantEditor(c);
    c.attacks.push({name:"New Attack", attack:0, damage:"1d6", map:"-5/-10"});
    renderCombatantEditor();
  });

  $("addSpellBtn").addEventListener("click", () => {
    const c = getCombatant(selectedCombatantId);
    if (!c) return;
    collectCombatantEditor(c);
    c.spells.push({name:"New Spell", rank:1, effect:""});
    renderCombatantEditor();
  });

  $("quickRollBtn").addEventListener("click", () => {
    try { $("quickRollOutput").textContent = rollText($("quickDice").value); }
    catch (error) { $("quickRollOutput").textContent = error.message; }
  });

  $("quickDice").addEventListener("keydown", e => {
    if (e.key === "Enter") $("quickRollBtn").click();
  });

  $("compendiumSearch").addEventListener("input", renderCompendium);
  $("compendiumCategory").addEventListener("change", renderCompendium);

  $("addHomebrewBtn").addEventListener("click", () => $("homebrewDialog").showModal());
  $("cancelHomebrewBtn").addEventListener("click", () => $("homebrewDialog").close());
  $("saveHomebrewBtn").addEventListener("click", () => {
    const name = $("hbName").value.trim();
    if (!name) return toast("Homebrew name is required.");
    homebrew.push({
      id: crypto.randomUUID(),
      name,
      category: $("hbCategory").value,
      level: Number($("hbLevel").value) || 0,
      traits: $("hbTraits").value.split(",").map(t => t.trim()).filter(Boolean),
      description: $("hbDescription").value.trim(),
      homebrew: true
    });
    localStorage.setItem(HOME_BREW_KEY, JSON.stringify(homebrew));
    $("homebrewDialog").close();
    ["hbName","hbTraits","hbDescription"].forEach(id => $(id).value = "");
    renderCompendium();
    toast("Homebrew entry saved.");
  });

  $("addLootBtn").addEventListener("click", () => {
    collectLoot();
    currentEncounter().loot.push({id:crypto.randomUUID(), name:"New Loot", quantity:1, notes:""});
    renderNotesAndLoot();
  });

  $("encounterNotes").addEventListener("change", e => {
    currentEncounter().notes = e.target.value;
    saveState();
  });

  function collectLoot() {
    const e = currentEncounter();
    e.loot = e.loot.map((item, i) => ({
      ...item,
      name: document.querySelector(`[data-loot-name="${i}"]`)?.value ?? item.name,
      quantity: Number(document.querySelector(`[data-loot-qty="${i}"]`)?.value) || 0,
      notes: document.querySelector(`[data-loot-notes="${i}"]`)?.value ?? item.notes
    }));
  }

  $("exportBtn").addEventListener("click", () => {
    const c = getCombatant(selectedCombatantId);
    if (c && $("combatantTab").classList.contains("active")) collectCombatantEditor(c);
    collectLoot();
    currentEncounter().notes = $("encounterNotes").value;
    saveState();
    const exportData = {version:1, exportedAt:new Date().toISOString(), state, homebrew};
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {type:"application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pf2e-gm-tracker-${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast("Export created.");
  });

  $("importInput").addEventListener("change", async e => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const imported = JSON.parse(await file.text());
      if (!imported.state?.encounters || !Array.isArray(imported.state.encounters)) throw new Error("Invalid tracker file.");
      state = imported.state;
      homebrew = Array.isArray(imported.homebrew) ? imported.homebrew : homebrew;
      localStorage.setItem(HOME_BREW_KEY, JSON.stringify(homebrew));
      selectedCombatantId = null;
      renderAll();
      toast("Import complete.");
    } catch (error) {
      toast(error.message || "Import failed.");
    } finally {
      e.target.value = "";
    }
  });

  window.addEventListener("beforeunload", () => {
    try {
      const c = getCombatant(selectedCombatantId);
      if (c && $("combatantTab").classList.contains("active")) collectCombatantEditor(c);
      collectLoot();
      currentEncounter().notes = $("encounterNotes").value;
      saveState();
    } catch {}
  });

  renderAll();
})();
