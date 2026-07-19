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
 spellAttack:0,spellDc:10,spells:[],notes:""};
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
function save(msg=false){localStorage.setItem(KEY,JSON.stringify(state));if(msg)toast("Saved on this device.")}
function toast(t){$("toast").textContent=t;$("toast").classList.add("show");clearTimeout(toast.t);toast.t=setTimeout(()=>$("toast").classList.remove("show"),2200)}
function shortDescription(text,max=150){const value=String(text??"").trim();return value.length>max?value.slice(0,max-1).trimEnd()+"…":value}
function roll(expr){const m=String(expr).replace(/\s/g,"").match(/^(\d*)d(\d+)([+-]\d+)?$/i);if(!m)throw Error("Use a format such as 1d20+7.");const n=+m[1]||1,s=+m[2],mod=+m[3]||0;if(n<1||n>100||s<2)throw Error("Invalid dice.");const rs=Array.from({length:n},()=>Math.floor(Math.random()*s)+1);return`${expr}: [${rs.join(", ")}]${mod?` ${mod>=0?"+":"-"} ${Math.abs(mod)}`:""} = ${rs.reduce((a,b)=>a+b,0)+mod}`}
function render(){renderSelect();renderEncounter();renderPicker();renderBuilder();renderNotes();renderSimpleInitiative();save()}
function renderSelect(){$("encounterSelect").innerHTML=state.encounters.map(e=>`<option value="${e.id}" ${e.id===state.currentEncounterId?"selected":""}>${esc(e.name)}</option>`).join("")}
function renderEncounter(){
 const e=encounter();$("encounterName").value=e.name;$("roundValue").textContent=e.round;$("turnLabel").textContent=e.combatants[e.turnIndex]?.name||"No active combatant";
 $("initiativeList").innerHTML=e.combatants.length?e.combatants.map((c,i)=>{
 const hpPct=c.maxHp?Math.max(0,Math.min(100,c.hp/c.maxHp*100)):0;
 const dots=Array.from({length:c.maxActions},(_,j)=>`<button class="action-dot ${j<c.actionsUsed?"used":""}" data-action="${c.id}" data-i="${j}" type="button">${j+1}</button>`).join("");
 const attacks=c.attacks.map((a,j)=>`<button type="button" data-atk="${c.id}" data-ai="${j}">${esc(a.name)} +${a.attack}</button><button type="button" data-dmg="${c.id}" data-ai="${j}">${esc(a.damage)}</button>`).join("");
 const actionList=(c.actions||[]).map(a=>`<div class="ability-summary"><strong>${esc(a.name)}</strong><span class="badge">${Number(a.cost)||0} action${Number(a.cost)===1?"":"s"}</span><p>${esc(shortDescription(a.effect||a.trigger||"No description."))}</p></div>`).join("");
 const reactionList=(c.reactions||[]).map(r=>`<div class="ability-summary"><strong>${esc(r.name)}</strong><span class="badge">Reaction</span><p>${esc(shortDescription(r.effect||r.trigger||"No description."))}</p></div>`).join("");
 const specialList=(c.specialAbilities||[]).map(a=>`<div class="ability-summary"><strong>${esc(a.name)}</strong>${a.category?`<span class="badge">${esc(a.category)}</span>`:""}<p>${esc(shortDescription(a.effect||a.trigger||"No description."))}</p></div>`).join("");
 return`<article class="combatant-card ${i===e.turnIndex?"active-turn":""}">
 <div class="combatant-top"><div><div class="combatant-name">${esc(c.name)}</div><span class="badge">${esc(c.type)} · Level ${c.level}</span></div><strong>Init ${c.initiative}</strong><strong>AC ${c.ac}</strong><div class="card-actions"><button data-copy="${c.id}" type="button">Duplicate</button><button data-edit="${c.id}" type="button">Edit</button></div></div>
 <div class="hp-bar"><div class="hp-fill" style="width:${hpPct}%"></div></div>
 <div class="combatant-controls"><label>Amount<input data-amount="${c.id}" type="number" value="1" min="0"></label><button data-hurt="${c.id}">Damage</button><button data-heal="${c.id}">Heal</button><button data-temp="${c.id}">Temp HP</button><strong>HP ${c.hp}/${c.maxHp}${c.tempHp?` +${c.tempHp} temp`:""}</strong><button data-save="${c.id}" data-kind="fort">Fort +${c.fort}</button><button data-save="${c.id}" data-kind="ref">Ref +${c.ref}</button><button data-save="${c.id}" data-kind="will">Will +${c.will}</button><button data-per="${c.id}">Perception +${c.perception}</button><button data-react="${c.id}">${c.reactionUsed?"Reaction Used":"Reaction Ready"}</button></div>
 <div class="detail-line">${esc(c.senses)}${c.languages?` · Languages: ${esc(c.languages)}`:""}</div>
 <div class="action-track">${dots}</div>
 <div class="attack-buttons">${attacks}</div>
 ${(actionList||reactionList||specialList)?`<div class="encounter-ability-grid">
   ${actionList?`<section><h4>Actions</h4>${actionList}</section>`:""}
   ${reactionList?`<section><h4>Reactions</h4>${reactionList}</section>`:""}
   ${specialList?`<section><h4>Abilities</h4>${specialList}</section>`:""}
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
$("nextTurnBtn").onclick=()=>{const e=encounter();if(!e.combatants.length)return;if(e.turnIndex>=0){const c=e.combatants[e.turnIndex];c.actionsUsed=0;c.reactionUsed=false}e.turnIndex++;if(e.turnIndex>=e.combatants.length){e.turnIndex=0;e.round++}render()};
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

window.addEventListener("beforeunload",()=>{try{collect();collectNotes();save();saveSimpleInitiative()}catch{}});
render();
})();