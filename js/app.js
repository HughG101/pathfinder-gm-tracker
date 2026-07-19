(() => {
"use strict";
const KEY="pf2e-gm-tracker-v2";
const $=id=>document.getElementById(id);
const uid=()=>crypto.randomUUID();
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));

function defaultCombatant(name="New Combatant"){
 return {id:uid(),name,type:"Creature",level:1,initiative:0,maxHp:20,hp:20,tempHp:0,ac:15,speed:"25 ft.",perception:0,
 maxActions:3,actionsUsed:0,reactionUsed:false,focusPoints:0,senses:"",languages:"",fort:0,ref:0,will:0,
 resistances:"",weaknesses:"",immunities:"",conditions:"",persistent:"",
 abilities:{str:0,dex:0,con:0,int:0,wis:0,cha:0},skills:[],items:[],attacks:[],actions:[],reactions:[],specialAbilities:[],
 spellAttack:0,spellDc:10,spells:[],structuredConditions:[],notes:""};
}
function redSunSample(){
 const c=defaultCombatant("Red Sun Illusionist");
 Object.assign(c,{type:"NPC",level:4,initiative:12,maxHp:78,hp:78,ac:21,speed:"30 ft.",perception:10,focusPoints:1,
 senses:"low-light vision, scent (imprecise 30 ft.)",languages:"Common, Sylvan, Thieves’ Cant, Kitsune",
 fort:8,ref:11,will:9,resistances:"precision 5, mental 5",immunities:"controlled (under Mirror Trick)",
 abilities:{str:1,dex:4,con:2,int:1,wis:2,cha:4},spellAttack:9,spellDc:19});
 c.skills=[["Acrobatics",10],["Deception",12],["Stealth",10],["Intimidation",9],["Thievery",10],["Society",7]].map(([name,modifier])=>({id:uid(),name,modifier}));
 c.items=["Flintlock pistol (6 rounds)","2 alchemical shots (blinding/concussive)","Dagger (concealed)","Smokestick","Minor healing potion","Red Sun pendant (25 gp)"].map(name=>({id:uid(),name,quantity:1,notes:""}));
 c.attacks=[
 {id:uid(),name:"Dagger",actionCost:1,attack:11,traits:"agile, finesse, deadly d6",damage:"1d4+4",damageType:"piercing",range:"melee",reload:"",ammo:"",special:"1d6 precision vs off-guard; 1d6 persistent bleed from poisoned blade once per turn"},
 {id:uid(),name:"Flintlock Pistol",actionCost:1,attack:12,traits:"fatal d10",damage:"1d6+4",damageType:"piercing",range:"60 ft.",reload:"1",ammo:"6 rounds; 2 alchemical shots",special:"Blinding Shot: DC 18 Fortitude. Concussive Shot: dazzled and –1 attack."}
 ];
 c.actions=[
 {id:uid(),name:"Misdirecting Strike",cost:1,traits:"",trigger:"If the last attack hit",effect:"Roll Deception vs. Perception DC. On success, the target is off-guard to allies."},
 {id:uid(),name:"Vanish in Smoke",cost:2,traits:"illusion",trigger:"1/encounter",effect:"Use a smokestick and cast Invisibility."},
 {id:uid(),name:"Mirror Trick",cost:1,traits:"illusion",trigger:"Active at encounter start",effect:"DC 19 flat check to hit the real body. Ends on a critical hit or successful Seek against DC 21."}
 ];
 c.reactions=[{id:uid(),name:"Smoke-Step Feint",trigger:"When targeted",effect:"Roll Deception vs. Perception DC. On success, the attack misses, the target is off-guard, and this creature can Step."}];
 c.specialAbilities=[
 {id:uid(),name:"Illusory Instinct",category:"Interaction",effect:"+2 to Initiative and Stealth while illusion spells are active."},
 {id:uid(),name:"Surprise Attack",category:"Interaction",effect:"Enemies are off-guard in the first round if they have not acted."}
 ];
 c.spells=[
 {id:uid(),name:"Mirror Image",rank:"2",type:"Innate Arcane",actionCost:"2",effect:""},
 {id:uid(),name:"Invisibility",rank:"2",type:"Innate Arcane",actionCost:"2",effect:""},
 {id:uid(),name:"Illusory Disguise",rank:"1",type:"Innate Arcane",actionCost:"2",effect:""},
 {id:uid(),name:"Color Spray",rank:"1",type:"Innate Arcane",actionCost:"2",effect:""},
 {id:uid(),name:"Daze",rank:"Cantrip",type:"Innate Arcane",actionCost:"2",effect:""},
 {id:uid(),name:"Ghost Sound",rank:"Cantrip",type:"Innate Arcane",actionCost:"2",effect:""},
 {id:uid(),name:"Shield",rank:"Cantrip",type:"Innate Arcane",actionCost:"1",effect:""},
 {id:uid(),name:"Prestidigitation",rank:"Cantrip",type:"Innate Arcane",actionCost:"2",effect:""},
 {id:uid(),name:"Foxfire",rank:"Focus 1",type:"Focus",actionCost:"1",effect:"1d6 fire; +1 to the next Deception or Stealth check."}
 ];
 return c;
}
function defaultEncounter(name="New Encounter"){return{id:uid(),name,round:1,turnIndex:-1,combatants:[redSunSample()],notes:"",loot:[]}}
let state=load(),selectedId=null;
let simpleInitiative=loadSimpleInitiative();

function loadSimpleInitiative(){
  try{
    const saved=JSON.parse(localStorage.getItem("pf2e-simple-initiative-v1"));
    if(saved&&Array.isArray(saved.entries))return saved;
  }catch{}
  return{round:1,turnIndex:-1,entries:[]};
}
function saveSimpleInitiative(){
  localStorage.setItem("pf2e-simple-initiative-v1",JSON.stringify(simpleInitiative));
}
function renderSimpleInitiative(){
  $("simpleRoundValue").textContent=simpleInitiative.round;
  const active=simpleInitiative.entries[simpleInitiative.turnIndex];
  $("simpleTurnLabel").textContent=active?active.name:"No active entry";

  $("simpleInitiativeList").innerHTML=simpleInitiative.entries.length
    ? simpleInitiative.entries.map((entry,index)=>`
      <article class="simple-init-row ${index===simpleInitiative.turnIndex?"active-turn":""}">
        <div>
          <strong>${esc(entry.name)}</strong>
          <span class="badge">Initiative ${entry.initiative}</span>
          <span class="badge">Perception ${entry.perception}</span>
        </div>
        <div class="simple-init-row-actions">
          <button type="button" data-simple-copy="${entry.id}">Duplicate</button>
          <button type="button" data-simple-up="${entry.id}">Up</button>
          <button type="button" data-simple-down="${entry.id}">Down</button>
          <button type="button" data-simple-remove="${entry.id}" class="danger">Remove</button>
        </div>
      </article>`).join("")
    : `<p class="muted">No initiative entries yet.</p>`;

  document.querySelectorAll("[data-simple-copy]").forEach(button=>button.onclick=()=>{
    const source=simpleInitiative.entries.find(entry=>entry.id===button.dataset.simpleCopy);
    if(!source)return;
    simpleInitiative.entries.push({...source,id:uid(),name:`${source.name} Copy`});
    renderSimpleInitiative();
  });
  document.querySelectorAll("[data-simple-remove]").forEach(button=>button.onclick=()=>{
    simpleInitiative.entries=simpleInitiative.entries.filter(entry=>entry.id!==button.dataset.simpleRemove);
    simpleInitiative.turnIndex=Math.min(simpleInitiative.turnIndex,simpleInitiative.entries.length-1);
    renderSimpleInitiative();
  });
  document.querySelectorAll("[data-simple-up]").forEach(button=>button.onclick=()=>{
    const index=simpleInitiative.entries.findIndex(entry=>entry.id===button.dataset.simpleUp);
    if(index<=0)return;
    [simpleInitiative.entries[index-1],simpleInitiative.entries[index]]=[simpleInitiative.entries[index],simpleInitiative.entries[index-1]];
    if(simpleInitiative.turnIndex===index)simpleInitiative.turnIndex=index-1;
    else if(simpleInitiative.turnIndex===index-1)simpleInitiative.turnIndex=index;
    renderSimpleInitiative();
  });
  document.querySelectorAll("[data-simple-down]").forEach(button=>button.onclick=()=>{
    const index=simpleInitiative.entries.findIndex(entry=>entry.id===button.dataset.simpleDown);
    if(index<0||index>=simpleInitiative.entries.length-1)return;
    [simpleInitiative.entries[index+1],simpleInitiative.entries[index]]=[simpleInitiative.entries[index],simpleInitiative.entries[index+1]];
    if(simpleInitiative.turnIndex===index)simpleInitiative.turnIndex=index+1;
    else if(simpleInitiative.turnIndex===index+1)simpleInitiative.turnIndex=index;
    renderSimpleInitiative();
  });

  saveSimpleInitiative();
}

function load(){try{const x=JSON.parse(localStorage.getItem(KEY));if(x?.encounters?.length)return x}catch{} const e=defaultEncounter("Sample Encounter");return{currentEncounterId:e.id,encounters:[e]}}
function encounter(){let e=state.encounters.find(x=>x.id===state.currentEncounterId);if(!e){e=state.encounters[0];state.currentEncounterId=e.id}return e}
function combatant(){return encounter().combatants.find(c=>c.id===selectedId)}

function normalizeState(){
  for(const e of state.encounters||[]){
    for(const c of e.combatants||[]){
      if(!Array.isArray(c.structuredConditions))c.structuredConditions=[];
      if(!Array.isArray(c.attacks))c.attacks=[];
      if(!Array.isArray(c.actions))c.actions=[];
      if(!Array.isArray(c.reactions))c.reactions=[];
      if(!Array.isArray(c.specialAbilities))c.specialAbilities=[];
      if(!Array.isArray(c.spells))c.spells=[];
    }
  }
}

function save(msg=false){localStorage.setItem(KEY,JSON.stringify(state));if(msg)toast("Saved on this device.")}
function toast(t){$("toast").textContent=t;$("toast").classList.add("show");clearTimeout(toast.t);toast.t=setTimeout(()=>$("toast").classList.remove("show"),2200)}
function shortDescription(text,max=150){const value=String(text??"").trim();return value.length>max?value.slice(0,max-1).trimEnd()+"…":value}
function roll(expr){const m=String(expr).replace(/\s/g,"").match(/^(\d*)d(\d+)([+-]\d+)?$/i);if(!m)throw Error("Use a format such as 1d20+7.");const n=+m[1]||1,s=+m[2],mod=+m[3]||0;if(n<1||n>100||s<2)throw Error("Invalid dice.");const rs=Array.from({length:n},()=>Math.floor(Math.random()*s)+1);return`${expr}: [${rs.join(", ")}]${mod?` ${mod>=0?"+":"-"} ${Math.abs(mod)}`:""} = ${rs.reduce((a,b)=>a+b,0)+mod}`}
function render(){normalizeState();renderSelect();renderEncounter();renderPicker();renderBuilder();renderNotes();renderSimpleInitiative();renderConditionTools();save()}
function renderSelect(){$("encounterSelect").innerHTML=state.encounters.map(e=>`<option value="${e.id}" ${e.id===state.currentEncounterId?"selected":""}>${esc(e.name)}</option>`).join("")}
function renderEncounter(){
 const e=encounter();$("encounterName").value=e.name;$("roundValue").textContent=e.round;$("turnLabel").textContent=e.combatants[e.turnIndex]?.name||"No active combatant";
 $("initiativeList").innerHTML=e.combatants.length?e.combatants.map((c,i)=>{
 const hpPct=c.maxHp?Math.max(0,Math.min(100,c.hp/c.maxHp*100)):0;
 const structuredBadges=(c.structuredConditions||[]).map(condition=>`<span class="badge condition-badge">${esc(condition.name)}${condition.value?` ${condition.value}`:""}</span>`).join("");
 const dots=Array.from({length:c.maxActions},(_,j)=>`<button class="action-dot ${j<c.actionsUsed?"used":""}" data-action="${c.id}" data-i="${j}" type="button">${j+1}</button>`).join("");
 const attacks=c.attacks.map((a,j)=>`<button type="button" data-atk="${c.id}" data-ai="${j}">${esc(a.name)} +${a.attack}</button><button type="button" data-dmg="${c.id}" data-ai="${j}">${esc(a.damage)}</button>`).join("");
 const actionList=(c.actions||[]).map(a=>`<div class="ability-summary"><strong>${esc(a.name)}</strong><span class="badge">${Number(a.cost)||0} action${Number(a.cost)===1?"":"s"}</span><p>${esc(shortDescription(a.effect||a.trigger||"No description."))}</p></div>`).join("");
 const reactionList=(c.reactions||[]).map(r=>`<div class="ability-summary"><strong>${esc(r.name)}</strong><span class="badge">Reaction</span><p>${esc(shortDescription(r.effect||r.trigger||"No description."))}</p></div>`).join("");
 const specialList=(c.specialAbilities||[]).map(a=>`<div class="ability-summary"><strong>${esc(a.name)}</strong>${a.category?`<span class="badge">${esc(a.category)}</span>`:""}<p>${esc(shortDescription(a.effect||a.trigger||"No description."))}</p></div>`).join("");
 const spellList=(c.spells||[]).map(s=>`<div class="ability-summary spell-summary">
   <strong>${esc(s.name)}</strong>
   ${s.rank?`<span class="badge">${esc(s.rank)}</span>`:""}
   ${s.type?`<span class="badge">${esc(s.type)}</span>`:""}
   ${s.actionCost?`<span class="badge">${esc(s.actionCost)} action${String(s.actionCost)==="1"?"":"s"}</span>`:""}
   ${String(s.effect||"").trim()?`<p>${esc(shortDescription(s.effect))}</p>`:""}
 </div>`).join("");
 return`<article class="combatant-card ${i===e.turnIndex?"active-turn":""}">
 <div class="combatant-top"><div><div class="combatant-name">${esc(c.name)}</div><span class="badge">${esc(c.type)} · Level ${c.level}</span>${structuredBadges}</div><strong>Init ${c.initiative}</strong><strong>AC ${c.ac}</strong><div class="card-actions"><button data-copy="${c.id}" type="button">Duplicate</button><button data-edit="${c.id}" type="button">Edit</button></div></div>
 <div class="hp-bar"><div class="hp-fill" style="width:${hpPct}%"></div></div>
 <div class="combatant-controls"><label>Amount<input data-amount="${c.id}" type="number" value="1" min="0"></label><button data-hurt="${c.id}">Damage</button><button data-heal="${c.id}">Heal</button><button data-temp="${c.id}">Temp HP</button><strong>HP ${c.hp}/${c.maxHp}${c.tempHp?` +${c.tempHp} temp`:""}</strong><button data-save="${c.id}" data-kind="fort">Fort +${c.fort}</button><button data-save="${c.id}" data-kind="ref">Ref +${c.ref}</button><button data-save="${c.id}" data-kind="will">Will +${c.will}</button><button data-per="${c.id}">Perception +${c.perception}</button><button data-react="${c.id}">${c.reactionUsed?"Reaction Used":"Reaction Ready"}</button></div>
 <div class="detail-line">${esc(c.senses)}${c.languages?` · Languages: ${esc(c.languages)}`:""}</div>
 <div class="action-track">${dots}</div>
 <div class="attack-buttons">${attacks}</div>
 ${(actionList||reactionList||specialList||spellList)?`<div class="encounter-ability-grid">
   ${actionList?`<section><h4>Actions</h4>${actionList}</section>`:""}
   ${reactionList?`<section><h4>Reactions</h4>${reactionList}</section>`:""}
   ${specialList?`<section><h4>Abilities</h4>${specialList}</section>`:""}
   ${spellList?`<section><h4>Spells</h4>${spellList}</section>`:""}
 </div>`:""}
 </article>`}).join(""):`<div class="card">No combatants yet.</div>`;
 bindCards()
}
function bindCards(){
 document.querySelectorAll("[data-edit]").forEach(b=>b.onclick=()=>{selectedId=b.dataset.edit;tab("builder");renderPicker();renderBuilder()});
 document.querySelectorAll("[data-copy]").forEach(b=>b.onclick=()=>{
   const original=find(b.dataset.copy);
   if(!original)return;
   const copy=structuredClone(original);
   copy.id=uid();
   copy.name=`${original.name} Copy`;
   copy.actionsUsed=0;
   copy.reactionUsed=false;
   for(const collection of ["skills","items","attacks","actions","reactions","specialAbilities","spells"]){
     if(Array.isArray(copy[collection]))copy[collection].forEach(entry=>entry.id=uid());
   }
   encounter().combatants.push(copy);
   selectedId=copy.id;
   render();
   toast(`${copy.name} added.`);
 });
 document.querySelectorAll("[data-hurt]").forEach(b=>b.onclick=()=>{const c=find(b.dataset.hurt),n=amount(c.id);let r=n;if(c.tempHp){const a=Math.min(c.tempHp,r);c.tempHp-=a;r-=a}c.hp=Math.max(0,c.hp-r);render()});
 document.querySelectorAll("[data-heal]").forEach(b=>b.onclick=()=>{const c=find(b.dataset.heal);c.hp=Math.min(c.maxHp,c.hp+amount(c.id));render()});
 document.querySelectorAll("[data-temp]").forEach(b=>b.onclick=()=>{const c=find(b.dataset.temp);c.tempHp=Math.max(c.tempHp,amount(c.id));render()});
 document.querySelectorAll("[data-action]").forEach(b=>b.onclick=()=>{const c=find(b.dataset.action),i=+b.dataset.i;c.actionsUsed=i<c.actionsUsed?i:i+1;render()});
 document.querySelectorAll("[data-react]").forEach(b=>b.onclick=()=>{const c=find(b.dataset.react);c.reactionUsed=!c.reactionUsed;render()});
 document.querySelectorAll("[data-save]").forEach(b=>b.onclick=()=>{const c=find(b.dataset.save);toast(roll(`1d20+${c[b.dataset.kind]}`))});
 document.querySelectorAll("[data-per]").forEach(b=>b.onclick=()=>toast(roll(`1d20+${find(b.dataset.per).perception}`)));
 document.querySelectorAll("[data-atk]").forEach(b=>b.onclick=()=>{const a=find(b.dataset.atk).attacks[+b.dataset.ai];toast(`${a.name}: ${roll(`1d20+${a.attack}`)}`)});
 document.querySelectorAll("[data-dmg]").forEach(b=>b.onclick=()=>{const a=find(b.dataset.dmg).attacks[+b.dataset.ai];try{toast(`${a.name}: ${roll(a.damage)}`)}catch(e){toast(e.message)}})
}
const find=id=>encounter().combatants.find(c=>c.id===id);
const amount=id=>Math.max(0,+document.querySelector(`[data-amount="${id}"]`)?.value||0);
function renderPicker(){const e=encounter();if(!selectedId&&e.combatants[0])selectedId=e.combatants[0].id;$("combatantPicker").innerHTML=e.combatants.map(c=>`<button data-pick="${c.id}" class="${c.id===selectedId?"selected":""}">${esc(c.name)}</button>`).join("")||"<p>No combatants.</p>";document.querySelectorAll("[data-pick]").forEach(b=>b.onclick=()=>{selectedId=b.dataset.pick;renderPicker();renderBuilder()})}
const scalarMap={cName:"name",cType:"type",cLevel:"level",cInitiative:"initiative",cMaxHp:"maxHp",cHp:"hp",cTempHp:"tempHp",cAc:"ac",cSpeed:"speed",cPerception:"perception",cMaxActions:"maxActions",cFocusPoints:"focusPoints",cSenses:"senses",cLanguages:"languages",cFort:"fort",cRef:"ref",cWill:"will",cResistances:"resistances",cWeaknesses:"weaknesses",cImmunities:"immunities",cConditions:"conditions",cPersistent:"persistent",cSpellAttack:"spellAttack",cSpellDc:"spellDc",cNotes:"notes"};
const nums=new Set(["level","initiative","maxHp","hp","tempHp","ac","perception","maxActions","focusPoints","fort","ref","will","spellAttack","spellDc"]);
function renderBuilder(){const c=combatant();if(!c)return;Object.entries(scalarMap).forEach(([id,k])=>$(id).value=c[k]??"");["str","dex","con","int","wis","cha"].forEach(k=>$("c"+k[0].toUpperCase()+k.slice(1)).value=c.abilities[k]??0);
 renderSkills(c);renderItems(c);renderAttacks(c);renderGeneric("actionsEditor",c.actions,"action");renderGeneric("reactionsEditor",c.reactions,"reaction");renderGeneric("abilitiesEditor",c.specialAbilities,"ability");renderSpells(c)}
function removeButton(type,i){return`<button type="button" data-remove="${type}" data-index="${i}">Remove</button>`}
function bindRemoves(c){document.querySelectorAll("[data-remove]").forEach(b=>b.onclick=()=>{const key={skill:"skills",item:"items",attack:"attacks",action:"actions",reaction:"reactions",ability:"specialAbilities",spell:"spells"}[b.dataset.remove];c[key].splice(+b.dataset.index,1);renderBuilder()})}
function renderSkills(c){$("skillsEditor").innerHTML=c.skills.map((s,i)=>`<div class="editor-row wide"><label>Name<input data-skill-name="${i}" value="${esc(s.name)}"></label><label>Modifier<input type="number" data-skill-mod="${i}" value="${s.modifier}"></label>${removeButton("skill",i)}</div>`).join("");bindRemoves(c)}
function renderItems(c){$("itemsEditor").innerHTML=c.items.map((x,i)=>`<div class="editor-row"><label>Name<input data-item-name="${i}" value="${esc(x.name)}"></label><label>Quantity<input type="number" data-item-qty="${i}" value="${x.quantity}"></label><label class="full">Notes<input data-item-notes="${i}" value="${esc(x.notes)}"></label>${removeButton("item",i)}</div>`).join("");bindRemoves(c)}
function renderAttacks(c){$("attacksEditor").innerHTML=c.attacks.map((a,i)=>`<div class="editor-row">
<label>Name / homebrew name<input data-at-name="${i}" value="${esc(a.name)}"></label><label>Action cost<input type="number" min="0" data-at-cost="${i}" value="${a.actionCost}"></label><label>Attack bonus<input type="number" data-at-bonus="${i}" value="${a.attack}"></label><label>Traits<input data-at-traits="${i}" value="${esc(a.traits)}"></label>
<label>Damage dice<input data-at-damage="${i}" value="${esc(a.damage)}"></label><label>Damage type<input data-at-type="${i}" value="${esc(a.damageType)}"></label><label>Range<input data-at-range="${i}" value="${esc(a.range)}"></label><label>Reload<input data-at-reload="${i}" value="${esc(a.reload)}"></label>
<label>Ammunition<input data-at-ammo="${i}" value="${esc(a.ammo)}"></label><label class="full">Special effects<input data-at-special="${i}" value="${esc(a.special)}"></label>${removeButton("attack",i)}</div>`).join("");bindRemoves(c)}
function renderGeneric(id,list,type){$(id).innerHTML=list.map((x,i)=>`<div class="editor-row"><label>Name<input data-${type}-name="${i}" value="${esc(x.name)}"></label>${type==="action"?`<label>Action cost<input type="number" min="0" data-action-cost="${i}" value="${x.cost}"></label><label>Traits<input data-action-traits="${i}" value="${esc(x.traits)}"></label>`:""}${type==="ability"?`<label>Category<input data-ability-category="${i}" value="${esc(x.category)}"></label>`:""}<label>Trigger / usage<input data-${type}-trigger="${i}" value="${esc(x.trigger||"")}"></label><label class="full">Effect<input data-${type}-effect="${i}" value="${esc(x.effect)}"></label>${removeButton(type,i)}</div>`).join("");bindRemoves(combatant())}
function renderSpells(c){$("spellsEditor").innerHTML=c.spells.map((s,i)=>`<div class="editor-row"><label>Name<input data-sp-name="${i}" value="${esc(s.name)}"></label><label>Rank<input data-sp-rank="${i}" value="${esc(s.rank)}"></label><label>Type<input data-sp-type="${i}" value="${esc(s.type)}"></label><label>Action cost<input data-sp-cost="${i}" value="${esc(s.actionCost)}"></label><label class="full">Effect<input data-sp-effect="${i}" value="${esc(s.effect)}"></label>${removeButton("spell",i)}</div>`).join("");bindRemoves(c)}
function collect(){
 const c=combatant();if(!c)return;Object.entries(scalarMap).forEach(([id,k])=>c[k]=nums.has(k)?+$ (id).value||0:$(id).value.trim());["str","dex","con","int","wis","cha"].forEach(k=>c.abilities[k]=+$("c"+k[0].toUpperCase()+k.slice(1)).value||0);
 c.skills=c.skills.map((s,i)=>({...s,name:document.querySelector(`[data-skill-name="${i}"]`)?.value||s.name,modifier:+document.querySelector(`[data-skill-mod="${i}"]`)?.value||0}));
 c.items=c.items.map((x,i)=>({...x,name:val(`item-name`,i,x.name),quantity:+val(`item-qty`,i,x.quantity)||0,notes:val(`item-notes`,i,x.notes)}));
 c.attacks=c.attacks.map((a,i)=>({...a,name:val("at-name",i,a.name),actionCost:+val("at-cost",i,a.actionCost)||0,attack:+val("at-bonus",i,a.attack)||0,traits:val("at-traits",i,a.traits),damage:val("at-damage",i,a.damage),damageType:val("at-type",i,a.damageType),range:val("at-range",i,a.range),reload:val("at-reload",i,a.reload),ammo:val("at-ammo",i,a.ammo),special:val("at-special",i,a.special)}));
 c.actions=c.actions.map((x,i)=>({...x,name:val("action-name",i,x.name),cost:+val("action-cost",i,x.cost)||0,traits:val("action-traits",i,x.traits),trigger:val("action-trigger",i,x.trigger),effect:val("action-effect",i,x.effect)}));
 c.reactions=c.reactions.map((x,i)=>({...x,name:val("reaction-name",i,x.name),trigger:val("reaction-trigger",i,x.trigger),effect:val("reaction-effect",i,x.effect)}));
 c.specialAbilities=c.specialAbilities.map((x,i)=>({...x,name:val("ability-name",i,x.name),category:val("ability-category",i,x.category),trigger:val("ability-trigger",i,x.trigger),effect:val("ability-effect",i,x.effect)}));
 c.spells=c.spells.map((x,i)=>({...x,name:val("sp-name",i,x.name),rank:val("sp-rank",i,x.rank),type:val("sp-type",i,x.type),actionCost:val("sp-cost",i,x.actionCost),effect:val("sp-effect",i,x.effect)}))
}
function val(key,i,fallback=""){return document.querySelector(`[data-${key}="${i}"]`)?.value??fallback}
function tab(name){document.querySelectorAll(".tab").forEach(b=>b.classList.toggle("active",b.dataset.tab===name));document.querySelectorAll(".tab-panel").forEach(p=>p.classList.remove("active"));$(name+"Tab").classList.add("active")}
document.querySelectorAll(".tab").forEach(b=>b.onclick=()=>tab(b.dataset.tab));
function addC(){const c=defaultCombatant();encounter().combatants.push(c);selectedId=c.id;render();tab("builder")}
$("addCombatantBtn").onclick=addC;$("addCombatantSideBtn").onclick=addC;
$("applyCombatantBtn").onclick=()=>{collect();render();toast("Combatant updated.")};
$("deleteCombatantBtn").onclick=()=>{const e=encounter();e.combatants=e.combatants.filter(c=>c.id!==selectedId);selectedId=e.combatants[0]?.id||null;e.turnIndex=Math.min(e.turnIndex,e.combatants.length-1);render()};
$("addSkillBtn").onclick=()=>{collect();combatant().skills.push({id:uid(),name:"New Skill",modifier:0});renderBuilder()};
$("addItemBtn").onclick=()=>{collect();combatant().items.push({id:uid(),name:"New Item",quantity:1,notes:""});renderBuilder()};
$("addAttackBtn").onclick=()=>{collect();combatant().attacks.push({id:uid(),name:"Homebrew Attack",actionCost:1,attack:0,traits:"",damage:"1d6",damageType:"",range:"",reload:"",ammo:"",special:""});renderBuilder()};
$("addActionBtn").onclick=()=>{collect();combatant().actions.push({id:uid(),name:"New Action",cost:1,traits:"",trigger:"",effect:""});renderBuilder()};
$("addReactionBtn").onclick=()=>{collect();combatant().reactions.push({id:uid(),name:"New Reaction",trigger:"",effect:""});renderBuilder()};
$("addAbilityBtn").onclick=()=>{collect();combatant().specialAbilities.push({id:uid(),name:"New Ability",category:"Automatic",trigger:"",effect:""});renderBuilder()};
$("addSpellBtn").onclick=()=>{collect();combatant().spells.push({id:uid(),name:"New Spell",rank:"1",type:"Prepared",actionCost:"2",effect:""});renderBuilder()};
$("newEncounterBtn").onclick=()=>{const e=defaultEncounter(`Encounter ${state.encounters.length+1}`);state.encounters.push(e);state.currentEncounterId=e.id;selectedId=null;render()};
$("encounterSelect").onchange=e=>{state.currentEncounterId=e.target.value;selectedId=null;render()};
$("encounterName").onchange=e=>{encounter().name=e.target.value.trim()||"Untitled Encounter";render()};
$("duplicateEncounterBtn").onclick=()=>{const e=structuredClone(encounter());e.id=uid();e.name+=" Copy";e.combatants.forEach(c=>c.id=uid());state.encounters.push(e);state.currentEncounterId=e.id;selectedId=null;render()};
$("deleteEncounterBtn").onclick=()=>{if(state.encounters.length===1)return toast("At least one encounter must remain.");state.encounters=state.encounters.filter(e=>e.id!==encounter().id);state.currentEncounterId=state.encounters[0].id;selectedId=null;render()};
$("sortInitiativeBtn").onclick=()=>{const e=encounter();e.combatants.sort((a,b)=>b.initiative-a.initiative||b.perception-a.perception);e.turnIndex=e.combatants.length?0:-1;render()};
$("nextTurnBtn").onclick=()=>{
 const e=encounter();if(!e.combatants.length)return;
 if(e.turnIndex>=0){
   const old=e.combatants[e.turnIndex];
   const frightened=(old.structuredConditions||[]).find(x=>x.name==="frightened");
   if(frightened){frightened.value=Math.max(0,(frightened.value||0)-1);if(!frightened.value)old.structuredConditions=old.structuredConditions.filter(x=>x!==frightened)}
   old.actionsUsed=0;old.reactionUsed=false;
 }
 e.turnIndex++;if(e.turnIndex>=e.combatants.length){e.turnIndex=0;e.round++}
 const current=e.combatants[e.turnIndex];
 if(current){
   const slowed=(current.structuredConditions||[]).find(x=>x.name==="slowed")?.value||0;
   const stunned=(current.structuredConditions||[]).find(x=>x.name==="stunned");
   const quickened=(current.structuredConditions||[]).find(x=>x.name==="quickened")?.value?1:0;
   let lost=slowed;
   if(stunned){
     const stunnedLost=Math.min(current.maxActions+quickened,stunned.value||0);
     lost=Math.max(lost,stunnedLost);
     stunned.value=Math.max(0,(stunned.value||0)-stunnedLost);
     if(!stunned.value)current.structuredConditions=current.structuredConditions.filter(x=>x!==stunned);
   }
   current.actionsUsed=Math.min(current.maxActions+quickened,lost);
 }
 render()
};
$("prevTurnBtn").onclick=()=>{const e=encounter();if(!e.combatants.length)return;e.turnIndex--;if(e.turnIndex<0){e.turnIndex=e.combatants.length-1;e.round=Math.max(1,e.round-1)}render()};
$("quickRollBtn").onclick=()=>{try{$("quickRollOutput").textContent=roll($("quickDice").value)}catch(e){$("quickRollOutput").textContent=e.message}};
$("quickDice").onkeydown=e=>{if(e.key==="Enter")$("quickRollBtn").click()};
function renderNotes(){const e=encounter();$("encounterNotes").value=e.notes;$("lootList").innerHTML=e.loot.map((x,i)=>`<div class="loot-row"><label>Item<input data-loot-name="${i}" value="${esc(x.name)}"></label><label>Quantity<input type="number" data-loot-qty="${i}" value="${x.quantity}"></label><label>Notes<input data-loot-notes="${i}" value="${esc(x.notes)}"></label><button data-loot-remove="${i}">Remove</button></div>`).join("")||"<p>No loot yet.</p>";document.querySelectorAll("[data-loot-remove]").forEach(b=>b.onclick=()=>{e.loot.splice(+b.dataset.lootRemove,1);render()})}
function collectNotes(){const e=encounter();e.notes=$("encounterNotes").value;e.loot=e.loot.map((x,i)=>({...x,name:document.querySelector(`[data-loot-name="${i}"]`)?.value??x.name,quantity:+document.querySelector(`[data-loot-qty="${i}"]`)?.value||0,notes:document.querySelector(`[data-loot-notes="${i}"]`)?.value??x.notes}))}
$("addLootBtn").onclick=()=>{collectNotes();encounter().loot.push({id:uid(),name:"New Loot",quantity:1,notes:""});renderNotes()};
$("saveBtn").onclick=()=>{collect();collectNotes();encounter().name=$("encounterName").value.trim()||"Untitled Encounter";save(true);render()};
$("exportBtn").onclick=()=>{collect();collectNotes();save();const blob=new Blob([JSON.stringify({version:2,state},null,2)],{type:"application/json"});const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=`pf2e-tracker-${new Date().toISOString().slice(0,10)}.json`;a.click();URL.revokeObjectURL(url)};
$("importInput").onchange=async e=>{const f=e.target.files?.[0];if(!f)return;try{const x=JSON.parse(await f.text());if(!x.state?.encounters)throw Error("Invalid tracker file.");state=x.state;selectedId=null;render();toast("Import complete.")}catch(err){toast(err.message)}e.target.value=""};

$("addSimpleInitiativeBtn").onclick=()=>{
  const name=$("simpleInitName").value.trim();
  if(!name)return toast("Enter a name first.");
  simpleInitiative.entries.push({
    id:uid(),
    name,
    initiative:+$("simpleInitValue").value||0,
    perception:+$("simpleInitPerception").value||0
  });
  $("simpleInitName").value="";
  $("simpleInitValue").value="0";
  $("simpleInitPerception").value="0";
  renderSimpleInitiative();
};
$("simpleInitName").onkeydown=event=>{
  if(event.key==="Enter")$("addSimpleInitiativeBtn").click();
};
$("sortSimpleInitiativeBtn").onclick=()=>{
  simpleInitiative.entries.sort((a,b)=>b.initiative-a.initiative||b.perception-a.perception||a.name.localeCompare(b.name));
  simpleInitiative.turnIndex=simpleInitiative.entries.length?0:-1;
  renderSimpleInitiative();
};
$("nextSimpleTurnBtn").onclick=()=>{
  if(!simpleInitiative.entries.length)return;
  simpleInitiative.turnIndex++;
  if(simpleInitiative.turnIndex>=simpleInitiative.entries.length){
    simpleInitiative.turnIndex=0;
    simpleInitiative.round++;
  }
  renderSimpleInitiative();
};
$("prevSimpleTurnBtn").onclick=()=>{
  if(!simpleInitiative.entries.length)return;
  simpleInitiative.turnIndex--;
  if(simpleInitiative.turnIndex<0){
    simpleInitiative.turnIndex=simpleInitiative.entries.length-1;
    simpleInitiative.round=Math.max(1,simpleInitiative.round-1);
  }
  renderSimpleInitiative();
};
$("resetSimpleInitiativeBtn").onclick=()=>{
  simpleInitiative={round:1,turnIndex:-1,entries:[]};
  renderSimpleInitiative();
};


const CREATURE_TABLES={
 levels:Array.from({length:26},(_,i)=>i-1),
 ac:{
  extreme:[18,19,19,21,22,24,25,27,28,30,31,33,34,36,37,39,40,42,43,45,46,48,49,51,52,54],
  high:[15,16,16,18,19,21,22,24,25,27,28,30,31,33,34,36,37,39,40,42,43,45,46,48,49,51],
  moderate:[14,15,15,17,18,20,21,23,24,26,27,29,30,32,33,35,36,38,39,41,42,44,45,47,48,50],
  low:[12,13,13,15,16,18,19,21,22,24,25,27,28,30,31,33,34,36,37,39,40,42,43,45,46,48]
 },
 attack:{
  extreme:[10,10,11,13,14,16,17,19,20,22,23,25,27,28,29,31,32,34,35,37,38,40,41,43,44,46],
  high:[8,8,9,11,12,14,15,17,18,20,21,23,24,26,27,29,30,32,33,35,36,38,39,41,42,44],
  moderate:[6,6,7,9,10,12,13,15,16,18,19,21,22,24,25,27,28,30,31,33,34,36,37,39,40,42],
  low:[4,4,5,7,8,9,11,12,13,15,16,17,19,20,21,23,24,25,27,28,29,31,32,33,35,36]
 },
 damage:{
  extreme:["1d6+1","1d6+3","1d8+4","1d12+4","1d12+8","2d10+7","2d12+7","2d12+10","2d12+12","2d12+15","2d12+17","2d12+20","2d12+22","3d12+19","3d12+21","3d12+24","3d12+26","3d12+29","3d12+31","3d12+34","4d12+29","4d12+32","4d12+34","4d12+37","4d12+39","4d12+42"],
  high:["1d4+1","1d6+2","1d6+3","1d10+4","1d10+6","2d8+5","2d8+7","2d8+9","2d10+9","2d10+11","2d10+13","2d12+13","2d12+15","3d10+14","3d10+16","3d10+18","3d12+17","3d12+18","3d12+19","3d12+20","4d10+20","4d10+22","4d10+24","4d10+26","4d12+24","4d12+26"],
  moderate:["1d4","1d4+2","1d6+2","1d8+4","1d8+6","2d6+5","2d6+6","2d6+8","2d8+8","2d8+9","2d8+11","2d10+11","2d10+12","3d8+12","3d8+14","3d8+15","3d10+14","3d10+15","3d10+16","3d10+17","4d8+17","4d8+19","4d8+20","4d8+22","4d10+20","4d10+22"],
  low:["1d4","1d4+1","1d4+2","1d6+3","1d6+5","2d4+4","2d4+6","2d4+7","2d6+6","2d6+8","2d6+9","2d6+10","2d8+10","3d6+10","3d6+11","3d6+13","3d6+14","3d6+15","3d6+16","3d6+17","4d6+14","4d6+15","4d6+17","4d6+18","4d6+19","4d6+21"]
 },
 hpModerate:[8,15,20,30,45,60,75,95,115,135,155,175,195,215,235,255,275,295,315,335,355,375,400,430,460,500],
 hpHigh:[9,18,25,38,56,75,94,119,144,169,194,219,244,269,294,319,344,369,394,419,444,469,500,538,575,625],
 hpLow:[6,12,15,23,34,45,56,71,86,101,116,131,146,161,176,191,206,221,236,251,266,281,300,323,345,375]
};
function creatureIndex(level){return Math.max(0,Math.min(25,Number(level)+1))}
function creatureSuggestion(level,profile){
 const i=creatureIndex(level);
 const profiles={
  soldier:{ac:"high",attack:"high",damage:"high",hp:"moderate",fort:2,ref:0,will:-1},
  brute:{ac:"moderate",attack:"moderate",damage:"extreme",hp:"high",fort:2,ref:-1,will:-1},
  skirmisher:{ac:"high",attack:"high",damage:"moderate",hp:"low",fort:0,ref:2,will:0},
  spellcaster:{ac:"low",attack:"low",damage:"low",hp:"low",fort:-1,ref:0,will:2},
  balanced:{ac:"moderate",attack:"moderate",damage:"moderate",hp:"moderate",fort:1,ref:1,will:1}
 };
 const p=profiles[profile]||profiles.balanced;
 const moderateSave=Number(level)+7;
 const hp={high:CREATURE_TABLES.hpHigh,moderate:CREATURE_TABLES.hpModerate,low:CREATURE_TABLES.hpLow}[p.hp][i];
 return{level:Number(level),ac:CREATURE_TABLES.ac[p.ac][i],attack:CREATURE_TABLES.attack[p.attack][i],damage:CREATURE_TABLES.damage[p.damage][i],hp,
  perception:Number(level)+7,fort:moderateSave+p.fort,ref:moderateSave+p.ref,will:moderateSave+p.will,
  spellDc:Number(level)+17,spellAttack:Number(level)+9,profile};
}
function previewCreature(){
 const s=creatureSuggestion($("builderCreatureLevel").value,$("builderProfile").value);
 $("creatureBuilderPreview").innerHTML=`<strong>Level ${s.level} ${esc(s.profile)}</strong><br>
 AC ${s.ac} · HP ${s.hp} · Perception +${s.perception}<br>
 Fort +${s.fort} · Ref +${s.ref} · Will +${s.will}<br>
 Strike +${s.attack} · Damage ${esc(s.damage)} · Spell DC ${s.spellDc} / attack +${s.spellAttack}`;
 return s;
}
$("previewCreatureBtn").onclick=previewCreature;
$("createCreatureBtn").onclick=()=>{
 const s=previewCreature(),c=defaultCombatant($("builderCreatureName").value.trim()||"Generated Creature");
 Object.assign(c,{level:s.level,initiative:s.perception,maxHp:s.hp,hp:s.hp,ac:s.ac,perception:s.perception,fort:s.fort,ref:s.ref,will:s.will,spellDc:s.spellDc,spellAttack:s.spellAttack});
 c.attacks=[{id:uid(),name:"Primary Strike",actionCost:1,attack:s.attack,traits:"",damage:s.damage,damageType:$("builderDamageType").value.trim(),range:"melee",reload:"",ammo:"",special:"Generated by level; edit as needed."}];
 c.notes=`Generated with the ${s.profile} profile. Review strengths, weaknesses, and special abilities before play.`;
 encounter().combatants.push(c);selectedId=c.id;render();toast(`${c.name} added.`);
};

function runeCalculation(){
 const base=$("runeBaseDamage").value.trim(),match=base.match(/^(\d+)d(\d+)([+-]\d+)?$/i);
 if(!match)throw Error("Base damage must look like 1d8+4.");
 const baseDice=Number(match[1]),sides=Number(match[2]),flat=Number(match[3]||0);
 const potency=Number($("runePotency").value),striking=Number($("runeStriking").value);
 const dice=baseDice+striking;
 const attack=Number($("runeBaseAttack").value||0)+potency;
 const expression=`${dice}d${sides}${flat===0?"":flat>0?`+${flat}`:flat}`;
 const property=$("runePropertyDamage").value.trim();
 return{name:$("runeWeaponName").value.trim()||"Runed Weapon",attack,damage:expression,property,potency,striking};
}
$("calculateRunesBtn").onclick=()=>{try{const r=runeCalculation();$("runeResult").innerHTML=`<strong>${esc(r.name)}</strong><br>Attack +${r.attack} · Damage ${esc(r.damage)}${r.property?` + ${esc(r.property)}`:""}`;}catch(error){$("runeResult").textContent=error.message}};
$("addRuneAttackBtn").onclick=()=>{
 try{
  const r=runeCalculation(),c=combatant();
  if(!c)throw Error("Select a combatant in the Combatant Builder first.");
  c.attacks.push({id:uid(),name:r.name,actionCost:1,attack:r.attack,traits:`magical${r.potency?`, +${r.potency} potency`:""}`,damage:r.damage,damageType:"",range:"",reload:"",ammo:"",special:r.property?`Property rune damage: ${r.property}`:""});
  render();toast("Runed attack added.");
 }catch(error){toast(error.message)}
};

function renderConditionTools(){
 const e=encounter();
 $("conditionCombatantSelect").innerHTML=e.combatants.map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join("");
 if(selectedId&&e.combatants.some(c=>c.id===selectedId))$("conditionCombatantSelect").value=selectedId;
 const c=e.combatants.find(x=>x.id===$("conditionCombatantSelect").value)||e.combatants[0];
 $("structuredConditionList").innerHTML=c?.structuredConditions?.length?c.structuredConditions.map((condition,index)=>`
  <div class="condition-row"><div><strong>${esc(condition.name)}${condition.value?` ${condition.value}`:""}</strong>${condition.notes?`<p>${esc(condition.notes)}</p>`:""}</div><button type="button" data-remove-condition="${index}">Remove</button></div>`).join(""):"<p class='muted'>No structured conditions.</p>";
 document.querySelectorAll("[data-remove-condition]").forEach(button=>button.onclick=()=>{c.structuredConditions.splice(Number(button.dataset.removeCondition),1);render();});
}
$("conditionCombatantSelect").onchange=renderConditionTools;
$("applyConditionBtn").onclick=()=>{
 const c=find($("conditionCombatantSelect").value);if(!c)return toast("Add a combatant first.");
 const name=$("conditionName").value,value=Number($("conditionValue").value)||0,notes=$("conditionNotes").value.trim();
 const existing=c.structuredConditions.find(x=>x.name===name);
 if(existing){existing.value=value;existing.notes=notes}else c.structuredConditions.push({name,value,notes});
 render();toast(`${name} applied.`);
};
$("recoveryCheckBtn").onclick=()=>{
 const c=find($("conditionCombatantSelect").value);if(!c)return toast("Select a combatant.");
 const dying=c.structuredConditions.find(x=>x.name==="dying");if(!dying)return toast("This combatant is not dying.");
 const dc=10+(dying.value||0),rollValue=Math.floor(Math.random()*20)+1;
 if(rollValue===20)dying.value=Math.max(0,dying.value-2);
 else if(rollValue===1)dying.value+=2;
 else if(rollValue>=dc)dying.value=Math.max(0,dying.value-1);
 else dying.value+=1;
 if(dying.value<=0){c.structuredConditions=c.structuredConditions.filter(x=>x!==dying);const wounded=c.structuredConditions.find(x=>x.name==="wounded");if(wounded)wounded.value=(wounded.value||0)+1;else c.structuredConditions.push({name:"wounded",value:1,notes:"Gained after recovery from dying."});}
 render();toast(`${c.name} rolled ${rollValue} vs DC ${dc}.`);
};

const XP_BY_DIFFERENCE={"-4":10,"-3":15,"-2":20,"-1":30,"0":40,"1":60,"2":80,"3":120,"4":160};
$("calculateXpBtn").onclick=()=>{
 const partyLevel=Number($("xpPartyLevel").value)||1,partySize=Number($("xpPartySize").value)||4;
 const enemies=encounter().combatants.filter(c=>c.type!=="Player");
 let total=0,unrated=0;
 for(const c of enemies){const diff=c.level-partyLevel;if(diff<-4){total+=Math.max(1,Math.round(10*Math.pow(.5,-4-diff)))}else if(diff>4){unrated++}else total+=XP_BY_DIFFERENCE[String(diff)]||0}
 const base={trivial:40,low:60,moderate:80,severe:120,extreme:160};
 const adjustment={trivial:10,low:20,moderate:20,severe:30,extreme:40};
 const budgets=Object.fromEntries(Object.keys(base).map(k=>[k,base[k]+(partySize-4)*adjustment[k]]));
 let threat="Beyond Extreme";
 if(total<=budgets.trivial)threat="Trivial";else if(total<=budgets.low)threat="Low";else if(total<=budgets.moderate)threat="Moderate";else if(total<=budgets.severe)threat="Severe";else if(total<=budgets.extreme)threat="Extreme";
 $("xpBudgetResult").innerHTML=`<strong>${total} XP — ${threat}</strong><br>Adjusted budgets: Trivial ${budgets.trivial}, Low ${budgets.low}, Moderate ${budgets.moderate}, Severe ${budgets.severe}, Extreme ${budgets.extreme}.${unrated?`<br>${unrated} creature(s) are more than 4 levels above the party and need manual review.`:""}`;
};

function cloudAuthHeader(){
 const user=$("cloudUsername").value,password=$("cloudPassword").value;
 return user||password?{"Authorization":"Basic "+btoa(`${user}:${password}`)}:{};
}
$("cloudUploadBtn").onclick=async()=>{
 const url=$("cloudUrl").value.trim();if(!url)return $("cloudStatus").textContent="Enter a WebDAV file URL.";
 try{
  collect();collectNotes();save();
  const response=await fetch(url,{method:"PUT",headers:{"Content-Type":"application/json",...cloudAuthHeader()},body:JSON.stringify({version:5,state,simpleInitiative},null,2)});
  if(!response.ok)throw Error(`Upload failed: ${response.status}`);
  $("cloudStatus").textContent="Cloud upload completed.";
 }catch(error){$("cloudStatus").textContent=`Cloud upload failed: ${error.message}`}
};
$("cloudDownloadBtn").onclick=async()=>{
 const url=$("cloudUrl").value.trim();if(!url)return $("cloudStatus").textContent="Enter a WebDAV file URL.";
 try{
  const response=await fetch(url,{headers:cloudAuthHeader()});if(!response.ok)throw Error(`Download failed: ${response.status}`);
  const data=await response.json();if(!data.state?.encounters)throw Error("The cloud file is not a tracker save.");
  state=data.state;if(data.simpleInitiative)simpleInitiative=data.simpleInitiative;normalizeState();selectedId=null;render();
  $("cloudStatus").textContent="Cloud download completed.";
 }catch(error){$("cloudStatus").textContent=`Cloud download failed: ${error.message}`}
};


function parseStatBlock(text){
 const raw=String(text||"").replace(/\r/g,"").trim();if(!raw)throw Error("Paste a stat block first.");
 const lines=raw.split("\n").map(x=>x.trim()).filter(Boolean),first=lines[0]||"Imported Combatant";
 const header=first.match(/^(.+?)(?:\s+(CREATURE|NPC|HAZARD)\s+(-?\d+))?$/i);
 const c=defaultCombatant(header?.[1]?.trim()||"Imported Combatant");
 c.type=header?.[2]?header[2][0].toUpperCase()+header[2].slice(1).toLowerCase():"Creature";
 c.level=Number(header?.[3]??raw.match(/\bLevel\s+(-?\d+)/i)?.[1]??1);
 const number=(rx,f=0)=>{const m=raw.match(rx);return m?Number(m[1]):f};
 c.perception=number(/Perception\s*([+-]?\d+)/i);c.ac=number(/\bAC\s*(\d+)/i,10);c.maxHp=number(/\bHP\s*(\d+)/i,10);c.hp=c.maxHp;
 c.fort=number(/\bFort(?:itude)?\s*([+-]?\d+)/i);c.ref=number(/\bRef(?:lex)?\s*([+-]?\d+)/i);c.will=number(/\bWill\s*([+-]?\d+)/i);
 c.spellDc=number(/\b(?:Spell\s+)?DC\s*(\d+)/i,10);c.spellAttack=number(/\b(?:spell\s+)?attack\s*([+-]?\d+)/i);
 c.senses=(raw.match(/Perception\s*[+-]?\d+\s*;?\s*([^\n]*)/i)?.[1]||"").trim();
 const lineValue=label=>lines.find(x=>new RegExp("^"+label+"\\b","i").test(x))?.replace(new RegExp("^"+label+"\\s*","i"),"").trim()||"";
 c.languages=lineValue("Languages");c.speed=lineValue("Speed")||"25 ft.";c.resistances=lineValue("Resistances");c.weaknesses=lineValue("Weaknesses");c.immunities=lineValue("Immunities");
 const ab=raw.match(/Str\s*([+-]?\d+).*?Dex\s*([+-]?\d+).*?Con\s*([+-]?\d+).*?Int\s*([+-]?\d+).*?Wis\s*([+-]?\d+).*?Cha\s*([+-]?\d+)/is);
 if(ab)[c.abilities.str,c.abilities.dex,c.abilities.con,c.abilities.int,c.abilities.wis,c.abilities.cha]=ab.slice(1,7).map(Number);
 const skills=lineValue("Skills");if(skills)c.skills=[...skills.matchAll(/([A-Za-z][A-Za-z ’'-]+?)\s*([+-]\d+)/g)].map(m=>({id:uid(),name:m[1].trim().replace(/,$/,""),modifier:Number(m[2])}));
 const items=lineValue("Items");if(items)c.items=items.split(/,(?![^()]*\))/).map(x=>x.trim()).filter(Boolean).map(name=>({id:uid(),name,quantity:1,notes:""}));
 c.attacks=lines.filter(x=>/^(Melee|Ranged)\b/i.test(x)).map(line=>{
   const kind=line.match(/^(Melee|Ranged)/i)[1],cost=line.match(/\[(\d+)-action\]|\[([123])\]/i),bonus=line.match(/([+-]\d+)/),traits=line.match(/\(([^)]*)\)/)?.[1]||"",damage=line.match(/(\d+d\d+(?:[+-]\d+)?)/i)?.[1]||"1d4";
   const name=(bonus?line.slice(0,bonus.index):line).replace(/^(Melee|Ranged)\s*/i,"").replace(/\[[^\]]+\]/g,"").trim()||kind+" Attack";
   const details=line.split(/→|->/)[1]?.trim()||line;
   return{id:uid(),name,actionCost:Number(cost?.[1]||cost?.[2]||1),attack:Number(bonus?.[1]||0),traits,damage,damageType:(details.match(/\b(bludgeoning|piercing|slashing|fire|cold|electricity|acid|sonic|mental|poison|force|spirit|void|vitality)\b/i)?.[1]||"").toLowerCase(),range:kind.toLowerCase()==="ranged"?(line.match(/range\s*([^,)\n]+)/i)?.[1]?.trim()||"ranged"):"melee",reload:line.match(/reload\s*(\d+)/i)?.[1]||"",ammo:"",special:details};
 });
 function section(head,stops){const s=lines.findIndex(x=>x.toLowerCase().startsWith(head.toLowerCase()));if(s<0)return[];const out=[];for(let i=s+1;i<lines.length;i++){if(stops.some(h=>lines[i].toLowerCase().startsWith(h.toLowerCase())))break;out.push(lines[i])}return out}
 function entries(head,stops,kind){return section(head,stops).filter(x=>/^[-•]/.test(x)||/[–—-]/.test(x)).map(line=>{const clean=line.replace(/^[-•]\s*/,""),parts=clean.split(/\s+[–—-]\s+/),h=parts.shift()||clean,effect=parts.join(" – "),cost=Number(h.match(/\[(\d+)-action\]|\[([123])\]/i)?.[1]||h.match(/\[(\d+)-action\]|\[([123])\]/i)?.[2]||0);return{id:uid(),name:h.replace(/\[[^\]]+\]/g,"").replace(/\([^)]*\)/g,"").trim(),effect,trigger:"",category:kind,cost,traits:h.match(/\(([^)]*)\)/)?.[1]||""}})}
 c.actions=[...entries("Offensive Abilities",["Spells","Reactions","Automatic Abilities"],"Offensive"),...entries("Actions",["Reactions","Spells"],"Action")].map(x=>({id:x.id,name:x.name,cost:x.cost||1,traits:x.traits,trigger:x.trigger,effect:x.effect}));
 c.reactions=entries("Reactions",["Speed","Melee","Ranged","Spells"],"Reaction").map(x=>({id:x.id,name:x.name,trigger:x.trigger,effect:x.effect}));
 c.specialAbilities=[...entries("Interaction Abilities",["Items","AC","Saves","HP"],"Interaction"),...entries("Automatic Abilities",["Reactions","Speed","Melee","Ranged"],"Automatic")].map(x=>({id:x.id,name:x.name,category:x.category,trigger:x.trigger,effect:x.effect}));
 c.spells=[];for(const m of raw.matchAll(/^(?:•|-)?\s*(?:(\d+)(?:st|nd|rd|th)?|Cantrips?|Focus Spells?(?:\s*\((\d+)\s*FP\))?)\s*:\s*(.+)$/gim)){const rank=m[1]?m[1]:(/cantrip/i.test(m[0])?"Cantrip":m[2]?`Focus ${m[2]}`:"");for(const name of m[3].split(",").map(x=>x.trim()).filter(Boolean))c.spells.push({id:uid(),name,rank,type:/focus/i.test(m[0])?"Focus":"Spell",actionCost:"",effect:""})}
 c.notes=`Imported from pasted stat block. Review all fields for accuracy.\n\nOriginal text:\n${raw}`;return c;
}
let parsedStatBlock=null;
function statPreview(c){const rows=[["Name",c.name],["Type",c.type],["Level",c.level],["HP",`${c.hp}/${c.maxHp}`],["AC",c.ac],["Perception",`+${c.perception}`],["Saves",`Fort +${c.fort}, Ref +${c.ref}, Will +${c.will}`],["Languages",c.languages||"—"],["Senses",c.senses||"—"],["Skills",c.skills.map(s=>`${s.name} ${s.modifier>=0?"+":""}${s.modifier}`).join(", ")||"—"],["Attacks",c.attacks.map(a=>`${a.name} +${a.attack} (${a.damage})`).join(", ")||"—"],["Actions",c.actions.map(a=>a.name).join(", ")||"—"],["Reactions",c.reactions.map(a=>a.name).join(", ")||"—"],["Abilities",c.specialAbilities.map(a=>a.name).join(", ")||"—"],["Spells",c.spells.map(a=>a.name).join(", ")||"—"]];return rows.map(([l,v])=>`<div class="preview-row"><strong>${esc(l)}</strong><span>${esc(v)}</span></div>`).join("")}
$("previewStatBlockBtn").onclick=()=>{try{parsedStatBlock=parseStatBlock($("statBlockInput").value);$("statBlockPreview").innerHTML=statPreview(parsedStatBlock)}catch(e){parsedStatBlock=null;$("statBlockPreview").textContent=e.message}};
$("importStatBlockBtn").onclick=()=>{try{const c=parsedStatBlock||parseStatBlock($("statBlockInput").value);c.id=uid();encounter().combatants.push(c);selectedId=c.id;render();tab("builder");toast(`${c.name} imported. Review it before play.`)}catch(e){toast(e.message)}};
$("clearStatBlockBtn").onclick=()=>{$("statBlockInput").value="";$("statBlockPreview").textContent="Paste a stat block and select Preview Import.";parsedStatBlock=null};

window.addEventListener("beforeunload",()=>{try{collect();collectNotes();save();saveSimpleInitiative()}catch{}});
normalizeState();render();previewCreature();$("calculateRunesBtn").click();$("calculateXpBtn").click();
})();