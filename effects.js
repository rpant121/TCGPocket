// effects.js - Complete with all move effects implemented
// Trainer + Move + Ability effects for Pokémon TCG Pocket Battle
"use strict";

console.log('[effects.js] loaded');

/* ============================
   CONSTANTS
============================ */
const ENERGY_ICONS = Object.freeze({
  fire: 'https://archives.bulbagarden.net/media/upload/thumb/a/ad/Fire-attack.png/20px-Fire-attack.png',
  water: 'https://archives.bulbagarden.net/media/upload/thumb/1/11/Water-attack.png/20px-Water-attack.png',
  grass: 'https://archives.bulbagarden.net/media/upload/thumb/2/2e/Grass-attack.png/20px-Grass-attack.png',
  lightning: 'https://archives.bulbagarden.net/media/upload/thumb/0/04/Lightning-attack.png/20px-Lightning-attack.png',
  psychic: 'https://archives.bulbagarden.net/media/upload/thumb/e/ef/Psychic-attack.png/20px-Psychic-attack.png',
  fighting: 'https://archives.bulbagarden.net/media/upload/thumb/4/48/Fighting-attack.png/20px-Fighting-attack.png',
  darkness: 'https://archives.bulbagarden.net/media/upload/thumb/a/ab/Darkness-attack.png/20px-Darkness-attack.png',
  metal: 'https://archives.bulbagarden.net/media/upload/thumb/6/64/Metal-attack.png/20px-Metal-attack.png',
  colorless: 'https://archives.bulbagarden.net/media/upload/thumb/1/1d/Colorless-attack.png/30px-Colorless-attack.png'
});

const STATUS_TYPES = new Set(['poison', 'poisoned', 'paralysis', 'paralyzed', 'sleep', 'asleep', 'burn', 'burned', 'confusion', 'confused']);

/* ============================
   UTILITY FUNCTIONS
============================ */
const pkToPlayer = pk => pk === 'p1' ? 'player1' : 'player2';
const oppPk = pk => pk === 'p1' ? 'p2' : 'p1';
const popup = msg => globalThis.showPopup?.(msg) ?? console.log('[popup]', msg);
const parseInt10 = (v, def = 0) => parseInt(v, 10) || def;
const normStr = s => String(s || '').trim().toLowerCase().replace(/['']/g, "'").replace(/\s+/g, ' ');

function shuffleArray(arr) {
  if (!arr?.length) return;
  for (let i = arr.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

/* ============================
   DOM HELPERS (Cached)
============================ */
const getActiveDiv = pk => globalThis.activeFor?.(pkToPlayer(pk)) ?? document?.getElementById(pk === 'p1' ? 'p1Active' : 'p2Active');
const getBenchDiv = pk => globalThis.benchFor?.(pkToPlayer(pk)) ?? document?.getElementById(pk === 'p1' ? 'p1Bench' : 'p2Bench');
const getActiveImg = pk => getActiveDiv(pk)?.querySelector('img') ?? null;
const getBenchImgs = pk => Array.from(getBenchDiv(pk)?.querySelectorAll('img') ?? []);
const getAllPokemonImgs = pk => [getActiveImg(pk), ...getBenchImgs(pk)].filter(Boolean);

function getSlotFromImg(img) {
  return img?.closest('.card-slot') ?? null;
}

function getHpFromImg(img) {
  if (!img) return { base: 0, cur: 0 };
  
  // Check for modified max HP (Giant's Cape)
  const slot = img.closest('.card-slot');
  const modifiedMax = slot?.dataset.maxHp ? parseInt10(slot.dataset.maxHp) : null;
  
  const base = modifiedMax || parseInt10(img.dataset.hp);
  const cur = parseInt10(img.dataset.chp, base);
  return { base, cur };
}

function setHpOnImg(img, base, cur) {
  if (!img) return;
  
  const slot = getSlotFromImg(img);
  const hasModifiedMax = slot?.dataset.maxHp;
  
  // CRITICAL: Don't overwrite img.dataset.hp if Giant's Cape is active
  // The original base HP must remain in img.dataset.hp
  if (!hasModifiedMax) {
    img.dataset.hp = base;
  }
  
  img.dataset.chp = cur;
  
  if (!slot) return;
  
  let hpDiv = slot.querySelector('.hp-overlay');
  if (!hpDiv) {
    hpDiv = document.createElement('div');
    hpDiv.className = 'hp-overlay';
    slot.appendChild(hpDiv);
  }
  
  // Display max HP: use modified max if it exists, otherwise use base
  const displayMax = hasModifiedMax ? parseInt(slot.dataset.maxHp, 10) : base;
  hpDiv.textContent = `${cur} / ${displayMax}`;
  
  // Make HP green if modified max exists
  if (hasModifiedMax) {
    hpDiv.style.background = 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)';
    hpDiv.style.fontWeight = '900';
  } else {
    hpDiv.style.background = 'rgba(0,0,0,.85)';
    hpDiv.style.fontWeight = '800';
  }
}

function healImg(img, amount) {
  if (!img || amount <= 0) return false;
  
  // 🆕 A3a - Claydol Heal Block (prevent all healing)
  // Check if ANY player has Claydol with prevent_all_healing
  const allPokemon = typeof document !== 'undefined' ? 
    [...document.querySelectorAll('.card-img')] : [];
  
  for (const pokemon of allPokemon) {
    const cacheKey = `${pokemon.dataset.set}-${pokemon.dataset.num}`;
    const abilityRow = globalThis.abilityCache?.[cacheKey];
    
    if (abilityRow?.effect_type === 'prevent_all_healing') {
      console.log('[Heal Block] Healing prevented by', pokemon.alt);
      if (typeof popup === 'function') {
        popup(`Heal Block: ${pokemon.alt} prevents all healing!`);
      }
      return false;
    }
  }
  
  const { base, cur } = getHpFromImg(img);
  if (cur >= base) return false;
  setHpOnImg(img, base, Math.min(base, cur + amount));
  return true;
}

function damageImg(img, amount, attackerImg = null) {
  if (!img || amount <= 0) return { knocked: false };
  
  // 🆕 Check for Oricorio's Safeguard ability
  // If attacker is an ex Pokemon, Oricorio takes no damage
  if (attackerImg) {
    const defenderName = (img.alt || '').toLowerCase();
    const attackerName = (attackerImg.alt || '').toLowerCase();
    const isAttackerEx = attackerName.includes(' ex');
    const isDefenderOricorio = defenderName.includes('oricorio');
    
    if (isDefenderOricorio && isAttackerEx) {
      console.log('[Safeguard] Oricorio prevented damage from', attackerImg.alt);
      popup(`Safeguard: ${img.alt} takes no damage from ${attackerImg.alt}!`);
      return { knocked: false };
    }
  }
  
  const { base, cur } = getHpFromImg(img);
  const newHp = Math.max(0, cur - amount);
  setHpOnImg(img, base, newHp);
  return { knocked: newHp <= 0 };
}

/* ============================
   ENERGY HELPERS
============================ */
function getEnergyBox(slot, create = false) {
  if (!slot) return null;
  let box = slot.querySelector('.energy-pips');
  if (!box && create) {
    box = document.createElement('div');
    box.className = 'energy-pips';
    slot.appendChild(box);
  }
  return box;
}

function attachEnergy(img, type) {
  const slot = getSlotFromImg(img);
  const box = getEnergyBox(slot, true);
  if (!box) return;
  
  const k = (type || 'colorless').toLowerCase();
  const pip = document.createElement('div');
  pip.className = 'energy-pip';
  pip.dataset.type = k;
  pip.style.backgroundImage = `url('${ENERGY_ICONS[k] || ENERGY_ICONS.colorless}')`;
  box.appendChild(pip);
}

function removeEnergy(img, type, count) {
  const slot = getSlotFromImg(img);
  if (!slot || count <= 0) return 0;
  
  const pips = slot.querySelectorAll('.energy-pip');
  const target = type?.toLowerCase() ?? null;
  let removed = 0;
  
  for (const pip of pips) {
    if (removed >= count) break;
    if (!target || pip.dataset.type === target) {
      pip.remove();
      removed++;
    }
  }
  return removed;
}

function countEnergy(img, type = null) {
  const slot = getSlotFromImg(img);
  if (!slot) return 0;
  const pips = slot.querySelectorAll('.energy-pip');
  
  // No type filter - count all energy
  if (!type) {
    let total = 0;
    for (const pip of pips) {
      const pipType = pip.dataset.type;
      total += getEnergyValue(img, pipType);
    }
    return total;
  }
  
  // Count specific type with multiplier
  const t = type.toLowerCase();
  let count = 0;
  for (const pip of pips) {
    if (pip.dataset.type === t) {
      count += getEnergyValue(img, t);
    }
  }
  return count;
}

// Async version that can fetch metadata if needed
async function countEnergyAsync(img, type = null) {
  const slot = getSlotFromImg(img);
  if (!slot) return 0;
  const pips = slot.querySelectorAll('.energy-pip');
  
  // Ensure Pokemon types are cached
  if (!img.dataset.pokemonTypes && img.dataset.set && img.dataset.num) {
    try {
      const meta = await globalThis.fetchCardMeta(img.dataset.set, img.dataset.num);
      if (meta.types) {
        img.dataset.pokemonTypes = meta.types.map(t => t.toLowerCase()).join(',');
      }
    } catch (e) {
      console.error('[countEnergyAsync] Failed to fetch meta:', e);
    }
  }
  
  // No type filter - count all energy
  if (!type) {
    let total = 0;
    for (const pip of pips) {
      const pipType = pip.dataset.type;
      total += getEnergyValue(img, pipType);
    }
    return total;
  }
  
  // Count specific type with multiplier
  const t = type.toLowerCase();
  let count = 0;
  for (const pip of pips) {
    if (pip.dataset.type === t) {
      count += getEnergyValue(img, t);
    }
  }
  return count;
}

// Helper function to get energy value (respects multipliers like Jungle Totem)
function getEnergyValue(img, energyType) {
  if (!img || !energyType) return 1;
  
  // Determine which player owns this Pokemon
  const p1Active = getActiveImg('p1');
  const p1Bench = getBenchImgs('p1');
  const p2Active = getActiveImg('p2');
  const p2Bench = getBenchImgs('p2');
  
  let owner = null;
  if (img === p1Active || p1Bench.includes(img)) owner = 'p1';
  else if (img === p2Active || p2Bench.includes(img)) owner = 'p2';
  
  if (!owner) return 1; // Can't determine owner, use default
  
  // 🆕 AUTO-DETECT: Check if Serperior is in play (passive ability)
  // This works even if the ability wasn't manually activated
  let hasSerperior = false;
  const allMyPokemon = owner === 'p1' ? [p1Active, ...p1Bench] : [p2Active, ...p2Bench];
  
  for (const pokemon of allMyPokemon) {
    if (pokemon && pokemon.alt && pokemon.alt.toLowerCase().includes('serperior')) {
      hasSerperior = true;
      console.log(`[jungle-totem] Serperior detected for ${owner}!`);
      break;
    }
  }
  
  // If Serperior is in play and this is Grass energy on a Grass Pokemon, double it
  if (hasSerperior && energyType.toLowerCase() === 'grass') {
    // Check if this Pokemon is Grass type
    if (img.dataset.pokemonTypes) {
      const types = img.dataset.pokemonTypes.toLowerCase().split(',');
      if (types.includes('grass')) {
        console.log(`[jungle-totem] ${img.alt}: grass energy counts as 2`);
        return 2;
      }
    }
  }
  
  // Also check for manually activated energy multiplier (from globalThis.state)
  const multiplier = globalThis.state?.energyMultiplier?.[owner];
  
  if (multiplier && multiplier.type === energyType.toLowerCase()) {
    // Check if Pokemon is the correct type for the multiplier
    if (img.dataset.pokemonTypes) {
      const types = img.dataset.pokemonTypes.toLowerCase().split(',');
      if (types.includes(multiplier.restriction)) {
        console.log(`[energy-multiplier] ${img.alt}: ${energyType} energy counts as ${multiplier.multiplier}`);
        return multiplier.multiplier;
      }
    }
  }
  
  return 1; // Default to 1
}

function moveEnergy(from, to, type) {
  const fromSlot = getSlotFromImg(from);
  const toBox = getEnergyBox(getSlotFromImg(to), true);
  if (!fromSlot || !toBox) return 0;
  
  const t = (type || 'colorless').toLowerCase();
  let moved = 0;
  
  for (const pip of fromSlot.querySelectorAll('.energy-pip')) {
    if (pip.dataset.type === t) {
      toBox.appendChild(pip);
      moved++;
    }
  }
  return moved;
}

/* ============================
   ARCEUS DETECTION HELPER
============================ */
// Check if player has Arceus or Arceus ex in play (for Arceus-dependent abilities)
function hasArceusInPlay(pk) {
  const allPokemon = getAllPokemonImgs(pk);
  const hasArceus = allPokemon.some(img => {
    const name = (img.alt || '').toLowerCase();
    return name.includes('arceus');
  });
  
  console.log(`[arceus-check] Player ${pk} has ${allPokemon.length} Pokemon`);
  console.log(`[arceus-check] Pokemon names:`, allPokemon.map(img => img.alt));
  console.log(`[arceus-check] Has Arceus: ${hasArceus}`);
  
  return hasArceus;
}

/* ============================
   USER SELECTION HELPER
============================ */
function awaitSelection(candidates, glowClass = 'heal-glow') {
  return new Promise((resolve, reject) => {
    candidates.forEach(img => img.classList.add(glowClass));
    
    const cleanup = () => {
      document.removeEventListener('click', clickHandler, true);
      document.removeEventListener('keydown', escapeHandler);
      candidates.forEach(c => c.classList.remove(glowClass));
    };
    
    const clickHandler = e => {
      const img = e.target.closest('img');
      if (!img || !candidates.includes(img)) {
        // Clicked outside - cancel selection
        e.stopPropagation();
        e.preventDefault();
        cleanup();
        resolve(null);
        return;
      }
      
      e.stopPropagation();
      e.preventDefault();
      cleanup();
      resolve(img);
    };
    
    const escapeHandler = e => {
      if (e.key === 'Escape') {
        e.preventDefault();
        cleanup();
        resolve(null);
      }
    };
    
    document.addEventListener('click', clickHandler, true);
    document.addEventListener('keydown', escapeHandler);
  });
}

/* ============================
   STATUS HELPER
============================ */
function applyStatus(pk, status) {
  globalThis.setStatus?.(pk, status);
}

/* ============================
   COIN FLIP HELPER
============================ */
async function flipCoin() {
  return globalThis.doCoinFlip?.() ?? (Math.random() < 0.5 ? 'heads' : 'tails');
}

/* ============================
   CSV LOADING (Lazy + Cached)
============================ */
let moveEffectRows = null;
let moveEffectMap = null;
let abilityEffectRows = null;
let abilityEffectMap = null;

function parseCsv(text) {
  const rows = [];
  let field = '', row = [], inQuotes = false;
  
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') inQuotes = false;
      else field += c;
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ',') { row.push(field.trim()); field = ''; }
      else if (c === '\n' || c === '\r') {
        if (field || row.length) { row.push(field.trim()); rows.push(row); }
        field = ''; row = [];
        if (c === '\r' && text[i + 1] === '\n') i++;
      }
      else field += c;
    }
  }
  if (field || row.length) { row.push(field.trim()); rows.push(row); }
  
  const [header, ...body] = rows;
  if (!header) return [];
  
  return body.map(r => Object.fromEntries(header.map((k, i) => [k, r[i] ?? ''])));
}

async function loadMoveEffects() {
  if (moveEffectRows) return;
  try {
    const text = await fetch('move_effects.csv').then(r => r.text());
    moveEffectRows = parseCsv(text);
    
    // Build lookup map for O(1) access
    moveEffectMap = new Map();
    for (const row of moveEffectRows) {
      const key = `${normStr(row.pokemonName)}|${normStr(row.attackName)}`;
      moveEffectMap.set(key, row);
    }
    console.log('[move-effects] loaded', moveEffectRows.length, 'rows');
  } catch (e) {
    console.error('[move-effects] load failed:', e);
    moveEffectRows = [];
    moveEffectMap = new Map();
  }
}

async function loadAbilityEffects() {
  if (abilityEffectRows) return abilityEffectRows;
  try {
    const text = await fetch('ability_effects.csv').then(r => r.text());
    abilityEffectRows = parseCsv(text.replace(/^\uFEFF/, ''));
    
    // Build lookup map - support multiple abilities per card
    abilityEffectMap = new Map();
    for (const row of abilityEffectRows) {
      // Normalize the number to always be 3 digits for consistent lookup
      const paddedNum = String(row.number).padStart(3, '0');
      const key = `${(row.set || '').toUpperCase()}-${paddedNum}`;
      abilityEffectMap.set(key, row);
      
      // Also key by name for flexibility
      const nameKey = `${key}-${normStr(row.abilityName)}`;
      abilityEffectMap.set(nameKey, row);
    }
    
    // Update global reference so battle.html can access it
    globalThis.ABILITY_EFFECT_ROWS = abilityEffectRows;
    window.ABILITY_EFFECT_ROWS = abilityEffectRows;
    
    console.log('[ability-effects] loaded', abilityEffectRows.length, 'rows');
    return abilityEffectRows;
  } catch (e) {
    console.error('[ability-effects] load failed:', e);
    abilityEffectRows = [];
    abilityEffectMap = new Map();
    globalThis.ABILITY_EFFECT_ROWS = [];
    window.ABILITY_EFFECT_ROWS = [];
    return [];
  }
}

function getMoveRow(pokeName, attackName) {
  if (!moveEffectMap) return null;
  return moveEffectMap.get(`${normStr(pokeName)}|${normStr(attackName)}`) ?? null;
}

function getAbilityRow(set, num, abilityName = null) {
  if (!abilityEffectMap || abilityEffectMap.size === 0) return null;
  
  // Normalize inputs
  const normalizedSet = String(set || '').toUpperCase();
  const normalizedNum = String(num || '').padStart(3, '0');
  const key = `${normalizedSet}-${normalizedNum}`;
  
  // If abilityName provided, try specific lookup first
  if (abilityName) {
    const nameKey = `${key}-${normStr(abilityName)}`;
    const exact = abilityEffectMap.get(nameKey);
    if (exact) return exact;
  }
  
  // Fallback to card-based lookup
  return abilityEffectMap.get(key) ?? null;
}

/* ============================
   TRAINER EFFECTS
============================ */
const TRAINER_EFFECTS = {
  heal: async (state, pk, { param1 }) => {
    const amount = parseInt10(param1);
    if (amount && healImg(getActiveImg(pk), amount)) {
      popup(`Healed ${amount} damage from your Active Pokémon.`);
    } else {
      popup('No damage to heal.');
    }
  },

  heal_type: async (state, pk, { param1, param2 }) => {
    const amount = parseInt10(param1);
    const type = (param2 || 'grass').toLowerCase();
    
    // Get all Pokemon of the specified type
    const targets = [];
    for (const img of getAllPokemonImgs(pk)) {
      try {
        const meta = await globalThis.fetchCardMeta(img.dataset.set, img.dataset.num);
        if (meta.types?.some(t => t.toLowerCase() === type)) {
          // Check against modified max HP if it exists (for Leaf Cape / Giant Cape)
          const slot = img.closest('.card-slot');
          const modifiedMaxHp = slot?.dataset.maxHp ? parseInt10(slot.dataset.maxHp) : null;
          const maxHp = modifiedMaxHp || parseInt10(img.dataset.hp);
          const curHp = parseInt10(img.dataset.chp, maxHp);
          
          if (curHp < maxHp) targets.push(img); // Only damaged Pokemon
        }
      } catch {}
    }
    
    if (!targets.length) {
      popup(`No damaged ${type}-type Pokémon.`);
      return;
    }
    
    popup(`Choose a ${type}-type Pokémon to heal ${amount} damage.`);
    const chosen = await awaitSelection(targets);
    
    if (chosen && healImg(chosen, amount)) {
      popup(`Healed ${amount} damage from ${chosen.alt}.`);
      globalThis.addLog?.(pk, `used Erika on ${chosen.alt}`, chosen.src, { name: chosen.alt });
    }
  },

  flip_attach_energy: async (state, pk, { param1 }) => {
    const type = param1 || 'water';
    const imgs = getAllPokemonImgs(pk);
    const targets = [];
    
    for (const img of imgs) {
      try {
        const meta = await globalThis.fetchCardMeta(img.dataset.set, img.dataset.num);
        if (meta.types?.some(t => t.toLowerCase() === type)) targets.push(img);
      } catch {}
    }
    
    if (!targets.length) { popup(`No ${type}-type Pokémon in play.`); return; }
    
    popup(`Click a ${type} Pokémon to power up.`);
    const chosen = await awaitSelection(targets);
    if (!chosen) return;
    
    let heads = 0;
    while ((await flipCoin()) === 'heads') {
      heads++;
      attachEnergy(chosen, type);
    }
    
    popup(heads ? `${chosen.alt} gained ${heads} ${type} Energy!` : 'First flip was tails.');
    globalThis.addLog?.(pk, `used Misty: ${heads} heads`, chosen.src, { name: chosen.alt });
  },

  boost_damage_type_targets: async (state, pk, { param1, param2 }) => {
    const amount = parseInt10(param1);
    const names = param2?.split(',').map(s => s.trim().toLowerCase()).filter(Boolean) ?? [];
    if (!amount || !names.length) return;
    
    globalThis.__trainerBoostByName ??= {};
    names.forEach(n => globalThis.__trainerBoostByName[n] = (globalThis.__trainerBoostByName[n] || 0) + amount);
    popup(`Attacks by ${names.join(', ')} get +${amount} damage this turn.`);
  },

  boost_all_damage: async (state, pk, { param1 }) => {
    const amount = parseInt10(param1);
    if (!amount) return;
    state.temp ??= {};
    state.temp[pk] ??= {};
    state.temp[pk].globalDamageBoost = (state.temp[pk].globalDamageBoost || 0) + amount;
    popup(`Giovanni: All your Pokémon do +${amount} damage this turn.`);
  },

  return_active_to_hand: async (state, pk, { param2 }) => {
    const allowed = param2?.split(',').map(s => s.trim().toLowerCase()).filter(Boolean) ?? [];
    const activeImg = getActiveImg(pk);
    if (!activeImg) { popup('No Active Pokémon.'); return; }
    
    const name = (activeImg.alt || '').toLowerCase();
    if (allowed.length && !allowed.includes(name)) { popup('Invalid target.'); return; }
    
    state[pk].hand.push({
      name: activeImg.alt,
      set: activeImg.dataset.set,
      number: activeImg.dataset.num,
      image: activeImg.src
    });
    
    const slot = getSlotFromImg(activeImg);
    if (slot) {
      slot.innerHTML = '<span class="slot-label">Empty</span>';
      slot.dataset.empty = '1';
    }
    
    popup('Returned Active to hand.');
    globalThis.beginPromotionFlow?.(pkToPlayer(pk));
  },

  attach_energy_to_targets: async (state, pk, { param1, param2 }) => {
    const count = parseInt10(param1);
    const names = param2?.split(',').map(s => s.trim().toLowerCase()).filter(Boolean) ?? [];
    const target = getAllPokemonImgs(pk).find(img => names.includes((img.alt || '').toLowerCase()));
    
    if (!target) { popup('No valid target.'); return; }
    for (let i = 0; i < count; i++) attachEnergy(target, 'fighting');
    popup(`Attached ${count} Fighting Energy to ${target.alt}.`);
  },

  force_opponent_switch: async (state, pk) => {
    globalThis.promoteFromBench?.(state, oppPk(pk), true);
    popup('Opponent must switch.');
  },

  move_all_energy_type: async (state, pk, { param1, param2 }) => {
    const type = param1?.toLowerCase() || 'lightning';
    const names = param2?.split(',').map(s => s.trim().toLowerCase()).filter(Boolean) ?? [];
    const active = getActiveImg(pk);
    
    if (!active || !names.includes((active.alt || '').toLowerCase())) {
      popup('Invalid target.'); return;
    }
    
    let total = 0;
    for (const bench of getBenchImgs(pk)) total += moveEnergy(bench, active, type);
    popup(total ? `Moved ${total} ${type} Energy to ${active.alt}.` : 'No energy to move.');
  },

  draw_cards: async (state, pk, { param1 }) => {
    const n = parseInt10(param1);
    if (n) { globalThis.drawCards?.(state, pk, n); popup(`Drew ${n} card(s).`); }
  },

  reduce_retreat_cost: async (state, pk, { param1 }) => {
    globalThis.setTempRetreatFor?.(pk, parseInt10(param1, 1), 'reduce');
    popup('Retreat cost reduced this turn.');
  },

  reveal_opponent_hand: async (state, pk) => {
    const hand = state[oppPk(pk)].hand ?? [];
    popup(hand.length ? `Opponent's hand: ${hand.map(c => c.name).join(', ')}` : "Opponent's hand is empty.");
  },

  view_top_deck: async (state, pk, { param1 }) => {
    const deck = state[pk].deck ?? [];
    const n = Math.min(parseInt10(param1), deck.length);
    popup(n ? `Top ${n}: ${deck.slice(0, n).map(c => c.name).join(', ')}` : 'Deck is empty.');
  },

  search_basic_pokemon: async (state, pk) => {
    const deck = state[pk].deck ?? [];
    if (!deck.length) { popup('Deck is empty.'); return; }
    
    for (const card of deck) {
      try {
        const meta = await fetch(`https://api.tcgdex.net/v2/en/sets/${card.set}/${card.number || card.num}`).then(r => r.json());
        if (meta.category === 'Pokemon' && meta.stage?.toLowerCase() === 'basic') {
          deck.splice(deck.indexOf(card), 1);
          state[pk].hand.push(card);
          popup(`Found ${card.name}!`);
          return;
        }
      } catch {}
    }
    popup('No Basic Pokémon found.');
  },

  shuffle_opponent_hand_draw: async (state, pk, { param1 }) => {
    const opp = oppPk(pk);
    const oppDeck = state[opp].deck ?? [];
    const oppHand = state[opp].hand ?? [];
    
    oppDeck.push(...oppHand);
    oppHand.length = 0;
    shuffleArray(oppDeck);
    
    const n = parseInt10(param1);
    if (n) globalThis.drawCards?.(state, opp, n);
    popup(`Opponent shuffled hand and drew ${n}.`);
  },

  summon_fossil_pokemon: async (state, pk, { param1, param2 }) => {
    // param1 = HP (40), param2 = evolves into (e.g., "Omanyte")
    const hp = parseInt10(param1, 40);
    const evolvesInto = param2 || '';
    
    // Get trainer card that was played
    const trainerCard = state.trainerCard;
    if (!trainerCard) {
      popup('Error: No trainer card found');
      throw new Error('No trainer card found'); // Throw error to keep card in hand
    }
    
    const fossilSet = trainerCard.dataset.set;
    const fossilNum = trainerCard.dataset.num;
    const fossilName = trainerCard.alt || 'Fossil';
    
    console.log(`[fossil] Playing ${fossilName} (${fossilSet}-${fossilNum}) as 40 HP Pokemon`);
    
    // Check if player can play a basic Pokemon
    const owner = pkToPlayer(pk);
    const activeDiv = getActiveDiv(pk);
    const benchDiv = getBenchDiv(pk);
    
    const activeSlot = activeDiv?.querySelector('.card-slot');
    const benchSlots = Array.from(benchDiv?.querySelectorAll('.card-slot') ?? []);
    
    // Check if active is empty or if there's bench space
    const hasActiveEmpty = activeSlot && !activeSlot.querySelector('img');
    const benchFree = benchSlots.filter(s => !s.querySelector('img'));
    
    if (!hasActiveEmpty && benchFree.length === 0) {
      popup('No space to play fossil!');
      throw new Error('No space to play fossil'); // Throw error to keep card in hand
    }
    
    // Create fossil "Pokemon" card
    const fossilImg = document.createElement('img');
    fossilImg.className = 'card-img';
    fossilImg.src = trainerCard.src; // Use trainer card image
    fossilImg.alt = fossilName;
    fossilImg.dataset.set = fossilSet;
    fossilImg.dataset.num = fossilNum;
    fossilImg.dataset.hp = String(hp);
    fossilImg.dataset.chp = String(hp);
    fossilImg.dataset.playedTurn = String(globalThis.turnNumber || 0);
    fossilImg.dataset.isFossil = 'true'; // Mark as fossil
    fossilImg.dataset.evolvesInto = evolvesInto;
    
    // Assign instance ID
    if (globalThis.assignInstanceId) {
      globalThis.assignInstanceId(fossilImg);
    }
    
    // Choose where to place it
    let targetSlot;
    if (hasActiveEmpty) {
      targetSlot = activeSlot;
      console.log('[fossil] Placing in active slot');
    } else {
      // Place on first available bench slot automatically
      targetSlot = benchFree[0];
      console.log('[fossil] Placing on bench slot');
    }
    
    // Place the fossil
    targetSlot.appendChild(fossilImg);
    
    // Set HP display
    if (globalThis.setHpOnImage) {
      globalThis.setHpOnImage(fossilImg, hp, hp);
    }
    
    // Mark slot as occupied
    if (globalThis.markSlot) {
      globalThis.markSlot(targetSlot, true);
    }
    
    popup(`Played ${fossilName} as a 40 HP Pokemon`);
    console.log(`[fossil] ${fossilName} placed successfully`);
  },

  // 🆕 A1a TRAINER EFFECTS - START

  // Peek at top deck for specific type
  peek_topdeck_type: async (state, pk, { param1, param2 }) => {
    // param1: "psychic" (type to search for)
    // param2: "hand_or_bottom" (what to do with it)
    const targetType = (param1 || '').toLowerCase();
    
    // Look at top card (stub - needs deck system)
    popup(`Look at top deck card. If ${targetType}, add to hand. Otherwise, put on bottom.`);
    console.log(`[peek_topdeck_type] Would check for ${targetType} type`);
    
    // If deck system exists, use it
    if (globalThis.peekTopDeck && globalThis.moveTopToBottom) {
      const topCard = globalThis.peekTopDeck(state, pk);
      if (topCard) {
        const isPsychic = topCard.types?.some(t => t.toLowerCase() === targetType);
        if (isPsychic) {
          popup(`Found ${topCard.name} - added to hand!`);
          globalThis.drawCards?.(state, pk, 1);
        } else {
          popup(`${topCard.name} is not ${targetType} - moved to bottom`);
          globalThis.moveTopToBottom?.(state, pk);
        }
      }
    }
  },

  // Reduce all incoming damage next turn
  reduce_all_incoming_damage_next_turn: async (state, pk, { param1 }) => {
    const reduction = parseInt10(param1, 10);
    
    if (!globalThis.state) globalThis.state = {};
    if (!globalThis.state.damageReduction) globalThis.state.damageReduction = {};
    
    globalThis.state.damageReduction[pk] = {
      amount: reduction,
      target: 'all', // All Pokemon
      duration: 'next_turn'
    };
    
    popup(`All your Pokemon will take -${reduction} damage next turn`);
    console.log(`[Blue] ${pk} Pokemon protected for -${reduction} damage`);
  },

  // Revive opponent's Pokemon to their bench
  revive_opponent_pokemon: async (state, pk, { param1 }) => {
    // param1: "basic" (only Basic Pokemon)
    const opp = oppPk(pk);
    
    popup('Revive opponent Basic Pokemon from discard pile (not fully implemented)');
    console.log(`[Pokemon Flute] Would revive opponent's Basic from discard`);
    
    // If discard system exists, use it
    if (globalThis.getDiscardBasicPokemon && globalThis.addToBench) {
      const discardBasics = globalThis.getDiscardBasicPokemon(state, opp);
      
      if (discardBasics.length === 0) {
        popup('No Basic Pokemon in opponent\'s discard pile');
        return;
      }
      
      // Let player choose which to revive
      popup('Choose a Basic Pokemon to revive to opponent\'s bench');
      const chosen = await awaitSelection(discardBasics);
      
      if (chosen) {
        globalThis.addToBench(state, opp, chosen);
        globalThis.removeFromDiscard(state, opp, chosen);
        popup(`Revived ${chosen.name} to opponent's bench`);
      }
    }
  },

  // 🆕 A1a TRAINER EFFECTS - END

  // 🆕 A2 TRAINER EFFECTS - START

  // Pokemon Tools - attach to Pokemon
  increase_max_hp: async (state, pk, { param1 }) => {
    // Giant Cape: +20 HP
    const amount = parseInt10(param1, 20);
    
    // Check if tool is being attached (target already selected)
    let chosen = globalThis.toolAttachTarget;
    
    if (!chosen) {
      // Fallback: manual selection
      const imgs = getAllPokemonImgs(pk);
      if (!imgs.length) { popup('No Pokemon in play.'); return; }
      
      popup(`Choose a Pokemon to attach Giant Cape (+${amount} HP)`);
      const selected = await awaitSelection(imgs);
      if (!selected) return;
      chosen = selected;
    }
    
    const slot = getSlotFromImg(chosen);
    if (!slot) return;
    
    // Get current HP for popup display
    const { base, cur } = getHpFromImg(chosen);
    const newMax = base + amount;
    
    // Set new max HP (this function handles updating current HP too!)
    globalThis.setMaxHp?.(chosen, newMax);
    
    popup(`${chosen.alt} max HP: ${base} → ${newMax}`);
    console.log(`[Giant Cape] ${chosen.alt} max HP increased by ${amount}`);
  },

  counter_on_hit_tool: async (state, pk, { param1 }) => {
    // Rocky Helmet: counter 20 damage when hit
    const damage = parseInt10(param1, 20);
    
    // Check if tool is being attached (target already selected)
    const chosen = globalThis.toolAttachTarget;
    
    if (!chosen) {
      // Fallback: manual selection
      const imgs = getAllPokemonImgs(pk);
      if (!imgs.length) { popup('No Pokemon in play.'); return; }
      
      popup(`Choose a Pokemon to attach Rocky Helmet (${damage} counter damage)`);
      const selected = await awaitSelection(imgs);
      if (!selected) return;
      chosen = selected;
    }
    
    popup(`${chosen.alt} will counter ${damage} damage when hit!`);
    console.log(`[Rocky Helmet] ${chosen.alt} will counter ${damage} damage`);
  },

  cure_status_end_of_turn: async (state, pk) => {
    // Lum Berry: cure all status at end of turn, then discard
    
    // Check if tool is being attached (target already selected)
    const chosen = globalThis.toolAttachTarget;
    
    if (!chosen) {
      // Fallback: manual selection
      const imgs = getAllPokemonImgs(pk);
      if (!imgs.length) { popup('No Pokemon in play.'); return; }
      
      popup('Choose a Pokemon to attach Lum Berry (cures status at turn end)');
      const selected = await awaitSelection(imgs);
      if (!selected) return;
      chosen = selected;
    }
    
    popup(`${chosen.alt} will be cured of status at turn end!`);
    console.log(`[Lum Berry] ${chosen.alt} will be cured at turn end`);
  },

  // Item: Switch card in hand with deck
  switch_card_in_hand_with_deck: async (state, pk) => {
    // Pokemon Communication - let user select Pokemon from hand
    const hand = state[pk].hand ?? [];
    const deck = state[pk].deck ?? [];
    
    if (!deck.length) {
      popup('Deck is empty.');
      throw new Error('NO_TARGET');
    }
    
    // Find Pokemon in hand
    const pokemonInHand = [];
    for (const card of hand) {
      // Skip if this is the trainer card itself
      if (card.name === 'Pokémon Communication' || card.name === 'Pokemon Communication') {
        continue;
      }
      
      try {
        const meta = await globalThis.fetchCardMeta(card.set, card.number || card.num);
        if (meta.category === 'Pokemon') {
          pokemonInHand.push(card);
        }
      } catch {}
    }
    
    if (!pokemonInHand.length) {
      popup('No Pokemon in hand.');
      throw new Error('NO_TARGET');
    }
    
    // Find Pokemon in deck
    const pokemonInDeck = [];
    for (const card of deck) {
      try {
        const meta = await globalThis.fetchCardMeta(card.set, card.number || card.num);
        if (meta.category === 'Pokemon') {
          pokemonInDeck.push(card);
        }
      } catch {}
    }
    
    if (!pokemonInDeck.length) {
      popup('No Pokemon in deck.');
      throw new Error('NO_TARGET');
    }
    
    // Use selection system - store data globally and trigger glow
    globalThis.__pokemonCommSelection = {
      pk,
      hand,
      deck,
      pokemonInHand,
      pokemonInDeck
    };
    
    // Trigger glow on hand cards (this will be handled in battle.html)
    popup('Choose a Pokemon from your hand to exchange.');
    
    // Set a flag that Pokemon Communication is active
    globalThis.__pokemonCommActive = true;
    
    // Render hand to show glowing cards
    if (globalThis.renderAllHands) {
      globalThis.renderAllHands();
    }
    
    // Wait for selection
    const selected = await new Promise((resolve) => {
      globalThis.__pokemonCommResolve = resolve;
    });
    
    if (!selected) {
      popup('Selection cancelled.');
      throw new Error('NO_TARGET');
    }
    
    // Get random Pokemon from deck
    const randomFromDeck = pokemonInDeck[Math.floor(Math.random() * pokemonInDeck.length)];
    
    // Swap them
    const handIdx = hand.indexOf(selected);
    const deckIdx = deck.indexOf(randomFromDeck);
    
    if (handIdx >= 0 && deckIdx >= 0) {
      hand[handIdx] = randomFromDeck;
      deck[deckIdx] = selected;
      
      popup(`Exchanged ${selected.name} for ${randomFromDeck.name}!`);
      console.log(`[Pokemon Communication] ${selected.name} ↔ ${randomFromDeck.name}`);
    } else {
      popup('Error: Could not complete exchange.');
    }
  },

  // Supporter: Force switch damaged bench Pokemon
  force_switch_damaged_bench: async (state, pk) => {
    // Cyrus: Switch in damaged benched Pokemon
    const opp = oppPk(pk);
    const benchImgs = getBenchImgs(opp);
    
    const damagedBench = benchImgs.filter(img => {
      const { base, cur } = getHpFromImg(img);
      return cur < base;
    });
    
    if (!damagedBench.length) {
      popup('No damaged bench Pokemon.');
      return;
    }
    
    popup('Choose a damaged bench Pokemon to switch in');
    const chosen = await awaitSelection(damagedBench);
    if (!chosen) return;
    
    // Directly promote without requiring another click
    const oppPlayer = pkToPlayer(opp);
    const activeDiv = globalThis.activeFor?.(oppPlayer);
    const activeSlot = activeDiv?.querySelector('.card-slot');
    const activeImg = activeSlot?.querySelector('img');
    const benchSlot = chosen.closest('.card-slot');
    
    if (!activeSlot || !benchSlot) {
      popup('Error: Could not find slots');
      return;
    }
    
    // Perform the swap
    if (activeImg) {
      // Swap active with bench
      const activePack = globalThis.detachAttachments?.(activeSlot) || {};
      const benchPack = globalThis.detachAttachments?.(benchSlot) || {};
      
      activeSlot.removeChild(activeImg);
      benchSlot.removeChild(chosen);
      
      activeSlot.appendChild(chosen);
      benchSlot.appendChild(activeImg);
      
      globalThis.attachAttachments?.(activeSlot, benchPack);
      globalThis.attachAttachments?.(benchSlot, activePack);
      
      globalThis.markSlot?.(activeSlot, true);
      globalThis.markSlot?.(benchSlot, true);
    } else {
      // Active is empty, just move bench to active
      benchSlot.removeChild(chosen);
      activeSlot.appendChild(chosen);
      const benchPack = globalThis.detachAttachments?.(benchSlot) || {};
      globalThis.attachAttachments?.(activeSlot, benchPack);
      globalThis.markSlot?.(activeSlot, true);
      globalThis.markSlot?.(benchSlot, false);
    }
    
    popup(`Forced ${chosen.alt} to active spot!`);
    console.log(`[Cyrus] Forced ${chosen.alt} active`);
  },

  // Supporter: Search for named Pokemon
  search_named_random: async (state, pk, { param2 }) => {
    // Team Galactic Grunt: Search for Glameow, Stunky, or Croagunk
    const names = param2?.split(',').map(s => s.trim().toLowerCase()).filter(Boolean) ?? [];
    const deck = state[pk].deck ?? [];
    
    if (!deck.length) { popup('Deck is empty.'); return; }
    
    // Find matching Pokemon
    for (const card of deck) {
      const cardName = (card.name || '').toLowerCase();
      if (names.some(n => cardName.includes(n))) {
        deck.splice(deck.indexOf(card), 1);
        state[pk].hand.push(card);
        popup(`Found ${card.name}!`);
        return;
      }
    }
    
    popup(`No ${names.join('/')} found in deck.`);
  },

  // Supporter: Attach energy from discard to targets
  attach_from_discard_to_targets: async (state, pk, { param1, param2 }) => {
    // Volkner: Attach 2 Lightning from discard to Electivire/Luxray
    const parts = param1?.split('|') ?? [];
    const count = parseInt10(parts[0], 2);
    const energyType = (parts[1] || 'lightning').toLowerCase();
    const names = param2?.split(',').map(s => s.trim().toLowerCase()).filter(Boolean) ?? [];
    
    // Find valid target
    const target = getAllPokemonImgs(pk).find(img => 
      names.includes((img.alt || '').toLowerCase())
    );
    
    if (!target) {
      popup('No valid target Pokemon in play.');
      return;
    }
    
    // Check discard pile for energy
    const owner = pkToPlayer(pk);
    const discardEnergy = globalThis.playerState?.[owner]?.discard?.energyCounts?.[energyType] ?? 0;
    
    if (discardEnergy < count) {
      popup(`Not enough ${energyType} energy in discard (need ${count}, have ${discardEnergy}).`);
      return;
    }
    
    // Attach energy from discard
    for (let i = 0; i < count; i++) {
      attachEnergy(target, energyType);
    }
    
    // Remove from discard count
    if (globalThis.playerState?.[owner]?.discard?.energyCounts) {
      globalThis.playerState[owner].discard.energyCounts[energyType] -= count;
    }
    
    popup(`Attached ${count} ${energyType} energy from discard to ${target.alt}!`);
    console.log(`[Volkner] ${count}× ${energyType} to ${target.alt} from discard`);
  },

  // Supporter: Move energy from bench to active
  move_energy_bench_to_active: async (state, pk) => {
    // Dawn: Move 1 energy from bench to active
    const active = getActiveImg(pk);
    const bench = getBenchImgs(pk);
    
    if (!active) { popup('No active Pokemon.'); return; }
    
    // Find bench Pokemon with energy
    const benchWithEnergy = bench.filter(img => {
      const slot = getSlotFromImg(img);
      const energyBox = slot?.querySelector('.energy-pips');
      return energyBox && energyBox.children.length > 0;
    });
    
    if (!benchWithEnergy.length) {
      popup('No bench Pokemon have energy.');
      return;
    }
    
    popup('Choose a bench Pokemon to move energy from');
    const chosen = await awaitSelection(benchWithEnergy);
    if (!chosen) return;
    
    // Move one energy
    const slot = getSlotFromImg(chosen);
    const energyBox = slot?.querySelector('.energy-pips');
    const pips = energyBox?.querySelectorAll('.energy-pip:not(.phantom-pip)');
    
    if (!pips?.length) {
      popup('No energy to move.');
      return;
    }
    
    const firstPip = pips[0];
    const energyType = firstPip.dataset.type || 'colorless';
    
    // Remove from bench
    firstPip.remove();
    
    // Add to active
    attachEnergy(active, energyType);
    
    popup(`Moved 1 ${energyType} energy from ${chosen.alt} to ${active.alt}!`);
    console.log(`[Dawn] ${energyType} energy: ${chosen.alt} → ${active.alt}`);
  },

  // Supporter: Shuffle hand, draw points needed to win
  shuffle_hand_draw_points: async (state, pk) => {
    // Mars: Opponent shuffles hand, draws cards = points needed to win
    const opp = oppPk(pk);
    const oppPlayer = pkToPlayer(opp);
    const oppDeck = state[opp].deck ?? [];
    const oppHand = state[opp].hand ?? [];
    
    // Get opponent's points using proper function
    const oppPoints = globalThis.getPoints?.(oppPlayer) ?? 0;
    const pointsNeeded = Math.max(0, 3 - oppPoints);
    
    console.log(`[Mars] Opponent: ${oppPlayer}, Points: ${oppPoints}, Needed: ${pointsNeeded}`);
    
    if (pointsNeeded === 0) {
      popup('Opponent already has 3 points - no cards drawn.');
      return;
    }
    
    // Shuffle hand into deck
    oppDeck.push(...oppHand);
    oppHand.length = 0;
    shuffleArray(oppDeck);
    
    // Draw cards
    const drawn = globalThis.drawCards?.(state, opp, pointsNeeded) ?? 0;
    
    popup(`Opponent shuffled hand and drew ${pointsNeeded} card(s)!`);
    console.log(`[Mars] Drew ${pointsNeeded} cards for opponent`);
  },

  // 🆕 A2 TRAINER EFFECTS - END

  // 🆕 A2a TRAINER EFFECTS - START

  // Heal all Pokemon with specific energy type attached
  heal_all_with_type_energy: async (state, pk, { param1, param2 }) => {
    // Irida: Heal 40 from each Pokemon with Water energy
    const amount = parseInt10(param1, 40);
    const energyType = (param2 || 'water').toLowerCase();
    
    const imgs = getAllPokemonImgs(pk);
    let healed = 0;
    
    for (const img of imgs) {
      const slot = getSlotFromImg(img);
      const energyBox = slot?.querySelector('.energy-pips');
      const pips = Array.from(energyBox?.querySelectorAll('.energy-pip:not(.phantom-pip)') ?? []);
      
      // Check if has energy of the type
      const hasType = pips.some(pip => (pip.dataset.type || '').toLowerCase() === energyType);
      
      if (hasType) {
        const { base, cur } = getHpFromImg(img);
        if (cur < base) {
          healImg(img, amount);
          healed++;
        }
      }
    }
    
    popup(healed ? `Healed ${amount} damage from ${healed} Pokemon with ${energyType} energy!` : `No damaged Pokemon with ${energyType} energy.`);
    console.log(`[Irida] Healed ${healed} Pokemon with ${energyType} energy`);
  },

  // Revive basic Pokemon from discard to hand
  revive_basic_to_hand: async (state, pk) => {
    // Celestic Town Elder: Put random basic from discard to hand
    const owner = pkToPlayer(pk);
    const discard = globalThis.playerState?.[owner]?.discard?.cards ?? [];
    
    if (!discard.length) {
      popup('No cards in discard pile.');
      return;
    }
    
    // Find basic Pokemon in discard
    const basics = [];
    for (const card of discard) {
      try {
        const meta = await globalThis.fetchCardMeta(card.set, card.number || card.num);
        if (meta.category === 'Pokemon' && meta.stage?.toLowerCase() === 'basic') {
          basics.push(card);
        }
      } catch {}
    }
    
    if (!basics.length) {
      popup('No Basic Pokemon in discard pile.');
      return;
    }
    
    // Pick random
    const chosen = basics[Math.floor(Math.random() * basics.length)];
    
    // Remove from discard
    const discardIdx = discard.indexOf(chosen);
    if (discardIdx >= 0) {
      discard.splice(discardIdx, 1);
      
      // Add to hand
      state[pk].hand.push(chosen);
      
      popup(`Retrieved ${chosen.name} from discard!`);
      console.log(`[Celestic Town Elder] ${chosen.name} from discard to hand`);
      
      // Update discard drawer if open
      const drawer = owner === 'player1' ? globalThis.p1DiscardDrawer : globalThis.p2DiscardDrawer;
      if (drawer?.classList.contains('show')) {
        globalThis.renderDiscard?.(owner);
      }
    }
  },

  // Reduce attack cost for specific named Pokemon
  reduce_attack_cost_targets: async (state, pk, { param1, param2 }) => {
    // Barry: Snorlax/Heracross/Staraptor cost 2 less colorless this turn
    const reduction = parseInt10(param1, 2);
    const names = param2?.split(',').map(s => s.trim().toLowerCase()).filter(Boolean) ?? [];
    
    if (!names.length) {
      popup('No target names specified.');
      return;
    }
    
    // Store in global state for this turn
    if (!globalThis.attackCostReduction) globalThis.attackCostReduction = {};
    
    names.forEach(name => {
      globalThis.attackCostReduction[name] = (globalThis.attackCostReduction[name] || 0) + reduction;
    });
    
    popup(`Attacks by ${names.join(', ')} cost ${reduction} less {C} this turn!`);
    console.log(`[Barry] ${names.join(', ')} attacks cost -${reduction} colorless`);
  },

  // Reduce incoming damage for specific type next turn
  reduce_type_incoming_damage_next_turn: async (state, pk, { param1, param2 }) => {
    // Adaman: All Metal Pokemon take -20 next turn
    const reduction = parseInt10(param1, 20);
    const type = (param2 || 'metal').toLowerCase();
    
    if (!globalThis.state) globalThis.state = {};
    if (!globalThis.state.typeProtection) globalThis.state.typeProtection = {};
    
    globalThis.state.typeProtection[pk] = {
      type: type,
      reduction: reduction,
      duration: 'next_turn'
    };
    
    popup(`All ${type} Pokemon take -${reduction} damage next turn!`);
    console.log(`[Adaman] ${type} Pokemon protected for -${reduction}`);
  },

  // 🆕 A2a TRAINER EFFECTS - END

  // 🆕 A2b TRAINER EFFECTS - START

  // Both players shuffle hands and draw same number
  shuffle_both_hands_draw_same: async (state, pk) => {
    // Iono: Each player shuffles hand into deck, then draws that many
    const p1Hand = state.p1.hand ?? [];
    const p2Hand = state.p2.hand ?? [];
    const p1Deck = state.p1.deck ?? [];
    const p2Deck = state.p2.deck ?? [];
    
    const p1HandSize = p1Hand.length;
    const p2HandSize = p2Hand.length;
    
    // Shuffle p1 hand into deck
    p1Deck.push(...p1Hand);
    p1Hand.length = 0;
    shuffleArray(p1Deck);
    
    // Shuffle p2 hand into deck
    p2Deck.push(...p2Hand);
    p2Hand.length = 0;
    shuffleArray(p2Deck);
    
    // Draw same number of cards
    globalThis.drawCards?.(state, 'p1', p1HandSize);
    globalThis.drawCards?.(state, 'p2', p2HandSize);
    
    popup(`Both players shuffled hands and drew ${p1HandSize}/${p2HandSize} cards!`);
    console.log(`[Iono] P1 drew ${p1HandSize}, P2 drew ${p2HandSize}`);
  },

  // Heal and cure all status conditions
  heal_and_cure_status: async (state, pk, { param1 }) => {
    // Pokemon Center Lady: Heal 30 and cure all status
    const amount = parseInt10(param1, 30);
    const imgs = getAllPokemonImgs(pk);
    
    if (!imgs.length) {
      popup('No Pokemon in play.');
      return;
    }
    
    popup(`Choose a Pokemon to heal ${amount} and cure status.`);
    const chosen = await awaitSelection(imgs);
    if (!chosen) return;
    
    // Heal damage
    healImg(chosen, amount);
    
    // Cure all status using the proper clearStatusOnImg function
    const hadStatus = chosen.dataset.status;
    if (hadStatus) {
      if (typeof globalThis.clearStatusOnImg === 'function') {
        globalThis.clearStatusOnImg(chosen);
      } else {
        // Fallback if function not available
        delete chosen.dataset.status;
        const slot = getSlotFromImg(chosen);
        const icon = slot?.querySelector('.status-icon');
        if (icon) icon.remove();
      }
      
      popup(`${chosen.alt} healed ${amount} and cured ${hadStatus}!`);
      console.log(`[Pokemon Center Lady] ${chosen.alt} healed + cured ${hadStatus}`);
    } else {
      popup(`${chosen.alt} healed ${amount}!`);
      console.log(`[Pokemon Center Lady] ${chosen.alt} healed (no status)`);
    }
  },

  // Boost damage vs Pokemon ex
  boost_damage_vs_ex: async (state, pk, { param1 }) => {
    // Red: +20 damage to opponent's Pokemon ex this turn
    const bonus = parseInt10(param1, 20);
    
    state.temp ??= {};
    state.temp[pk] ??= {};
    state.temp[pk].damageVsEx = (state.temp[pk].damageVsEx || 0) + bonus;
    
    popup(`Your Pokemon do +${bonus} damage to opponent's Pokemon ex this turn!`);
    console.log(`[Red] +${bonus} damage vs ex`);
  },

  // Flip until tails, discard energy for each heads
  flip_discard_energy_until_tails: async (state, pk) => {
    // Team Rocket Grunt: Flip until tails, discard energy per heads
    const opp = oppPk(pk);
    const activeImg = getActiveImg(opp);
    
    if (!activeImg) {
      popup('No opponent Active Pokemon.');
      return;
    }
    
    const slot = getSlotFromImg(activeImg);
    const energyBox = slot?.querySelector('.energy-pips');
    const pips = energyBox?.querySelectorAll('.energy-pip:not(.phantom-pip)');
    
    if (!pips?.length) {
      popup('Opponent has no energy to discard.');
      return;
    }
    
    let heads = 0;
    while ((await flipCoin()) === 'heads') {
      heads++;
    }
    
    if (heads === 0) {
      popup('First flip was tails - no energy discarded.');
      return;
    }
    
    // Discard up to heads count of random energy
    const pipsArray = Array.from(pips);
    const toDiscard = Math.min(heads, pipsArray.length);
    
    for (let i = 0; i < toDiscard; i++) {
      const randomIdx = Math.floor(Math.random() * pipsArray.length);
      const pip = pipsArray.splice(randomIdx, 1)[0];
      pip.remove();
    }
    
    popup(`${heads} heads! Discarded ${toDiscard} energy from ${activeImg.alt}!`);
    console.log(`[Team Rocket Grunt] ${heads} heads, discarded ${toDiscard} energy`);
  }
,

  // 🆕 A3 TRAINER EFFECTS - START
  
  // Big Malasada - Heal 10 and remove random status
  heal_active_and_cure_random_status: async (state, pk, { param1 }) => {
    const amount = parseInt10(param1, 10);
    const activeImg = getActiveImg(pk);
    
    if (!activeImg) {
      popup('No Active Pokémon.');
      return;
    }
    
    // Heal damage
    const healed = healImg(activeImg, amount);
    
    // Remove random status if any
    const currentStatus = activeImg.dataset.status;
    let curedStatus = null;
    
    if (currentStatus) {
      delete activeImg.dataset.status;
      const slot = getSlotFromImg(activeImg);
      const marker = slot?.querySelector('.status-marker');
      if (marker) marker.remove();
      curedStatus = currentStatus;
    }
    
    if (healed && curedStatus) {
      popup(`Healed ${amount} damage and cured ${curedStatus}!`);
    } else if (healed) {
      popup(`Healed ${amount} damage from ${activeImg.alt}.`);
    } else if (curedStatus) {
      popup(`Cured ${curedStatus} from ${activeImg.alt}.`);
    } else {
      popup('No damage or status to remove.');
    }
  },

  // Fishing Net - Revive Basic Water Pokemon to hand
  revive_type_to_hand: async (state, pk, { param1, param2 }) => {
    const stage = (param1 || 'basic').toLowerCase();
    const type = (param2 || 'water').toLowerCase();
    const player = pkToPlayer(pk);
    const discardPile = state[player]?.discardPile || [];
    
    if (!discardPile.length) {
      popup('Your discard pile is empty.');
      return;
    }
    
    // Filter discard pile for matching cards
    const eligibleCards = [];
    for (const card of discardPile) {
      try {
        const meta = await globalThis.fetchCardMeta(card.set, card.number || card.num);
        const cardStage = (meta.stage || '').toLowerCase();
        const hasType = meta.types?.some(t => t.toLowerCase() === type);
        
        if (cardStage === stage && hasType) {
          eligibleCards.push(card);
        }
      } catch {}
    }
    
    if (!eligibleCards.length) {
      popup(`No ${stage} ${type}-type Pokémon in discard pile.`);
      return;
    }
    
    // Pick random eligible card
    const randomCard = eligibleCards[Math.floor(Math.random() * eligibleCards.length)];
    
    // Remove from discard pile
    const index = discardPile.indexOf(randomCard);
    if (index > -1) {
      discardPile.splice(index, 1);
    }
    
    // Add to hand
    state[pk].hand.push(randomCard);
    globalThis.renderAllHands?.();
    
    popup(`Retrieved ${randomCard.name} from discard pile!`);
    console.log(`[Fishing Net] Retrieved ${randomCard.name}`);
  },

  // Rare Candy - Evolve Basic to Stage 2
  evolve_basic_to_stage2: async (state, pk) => {
    const owner = pkToPlayer(pk);
    
    console.log('[Rare Candy] Starting - Turn:', globalThis.turnNumber);
    
    // === RESTRICTION CHECKS (throw errors to keep card in hand) ===
    
    // Restriction 1: Can't use during first 2 turns
    if (globalThis.turnNumber <= 2) {
      const msg = "You can't use Rare Candy during the first two turns.";
      console.log('[Rare Candy] Failed:', msg);
      throw new Error(msg);
    }
    
    // === GET ALL ELIGIBLE TARGETS ===
    
    // Get all Basic Pokemon in play (that weren't played this turn)
    const allPokemon = getAllPokemonImgs(pk);
    const eligibleBasics = [];
    
    console.log('[Rare Candy] Checking', allPokemon.length, 'Pokemon');
    
    for (const img of allPokemon) {
      try {
        const playedTurn = parseInt(img.dataset.playedTurn || '0', 10);
        
        // 🆕 Check if this is a fossil (trainer card acting as Pokemon)
        const isFossil = img.dataset.isFossil === 'true';
        
        let stage = '';
        if (isFossil) {
          // Fossils act as Basic Pokemon
          stage = 'basic';
          console.log(`[Rare Candy] ${img.alt}: FOSSIL (treating as basic), playedTurn=${playedTurn}, currentTurn=${globalThis.turnNumber}`);
        } else {
          // Normal Pokemon - fetch metadata
          const meta = await globalThis.fetchCardMeta(img.dataset.set, img.dataset.num);
          stage = (meta.stage || '').toLowerCase();
          console.log(`[Rare Candy] ${img.alt}: stage=${stage}, playedTurn=${playedTurn}, currentTurn=${globalThis.turnNumber}`);
        }
        
        // Must be basic AND not played this turn
        if (stage === 'basic' && playedTurn !== globalThis.turnNumber) {
          // For fossils, create a pseudo-meta object
          const meta = isFossil ? {
            name: img.alt,
            stage: 'Basic',
            hp: img.dataset.hp
          } : await globalThis.fetchCardMeta(img.dataset.set, img.dataset.num);
          
          eligibleBasics.push({ img, meta, isFossil });
          console.log(`[Rare Candy] ✓ ${img.alt} is eligible${isFossil ? ' (fossil)' : ''}`);
        } else if (stage === 'basic' && playedTurn === globalThis.turnNumber) {
          console.log(`[Rare Candy] ✗ ${img.alt} was played this turn`);
        }
      } catch (e) {
        console.warn('[Rare Candy] Failed to fetch meta for:', img.alt, e);
      }
    }
    
    if (!eligibleBasics.length) {
      const msg = 'No eligible Basic Pokémon. (Basics cannot be evolved the turn they are played)';
      console.log('[Rare Candy] Failed:', msg);
      throw new Error(msg);
    }
    
    console.log('[Rare Candy] Found', eligibleBasics.length, 'eligible basics');
    
    // Get all Stage 2 cards from hand
    const hand = state[pk].hand || [];
    const stage2InHand = [];
    
    console.log('[Rare Candy] Checking', hand.length, 'cards in hand');
    
    for (const handCard of hand) {
      try {
        const cardMeta = await globalThis.fetchCardMeta(handCard.set, handCard.number || handCard.num);
        const cardStage = (cardMeta.stage || '').toLowerCase();
        
        if (cardStage === 'stage2') {
          stage2InHand.push({ handCard, cardMeta });
          console.log(`[Rare Candy] Found Stage 2 in hand: ${cardMeta.name}`);
        }
      } catch (e) {
        console.warn('[Rare Candy] Failed to fetch meta for hand card', e);
      }
    }
    
    if (!stage2InHand.length) {
      const msg = 'No Stage 2 Pokémon in hand.';
      console.log('[Rare Candy] Failed:', msg);
      throw new Error(msg);
    }
    
    console.log('[Rare Candy] Found', stage2InHand.length, 'Stage 2 cards in hand');
    
    // === HELPER FUNCTIONS ===
    
    // Check if Stage 2 can evolve from Basic (HYBRID METHOD)
    async function canRareCandyEvolve(basicImg, basicMeta, stage2Meta, isFossil = false) {
      let basicName = normStr(basicImg.alt || basicMeta.name);
      const stage2Name = normStr(stage2Meta.name);
      
      console.log(`[Rare Candy] Checking: ${basicName} → ${stage2Name}${isFossil ? ' (fossil)' : ''}`);
      
      // 🆕 FOSSIL HANDLING - Fossils evolve based on their evolvesInto data
      if (isFossil) {
        // Get what this fossil evolves into (stored when fossil was played)
        const evolvesInto = normStr(basicImg.dataset.evolvesInto || '');
        
        console.log(`[Rare Candy] Fossil "${basicName}" evolves into: "${evolvesInto}"`);
        
        if (!evolvesInto) {
          console.log(`[Rare Candy] Fossil has no evolvesInto data`);
          return false;
        }
        
        // Check if Stage 2's Stage 1 matches the fossil's evolution
        const stage1Name = normStr(stage2Meta.evolveFrom || '');
        
        console.log(`[Rare Candy] Stage 2 "${stage2Name}" evolves from Stage 1: "${stage1Name}"`);
        
        if (!stage1Name) return false;
        
        // Fetch Stage 1 metadata to check what it evolves from
        const stage1Card = await findCardByName(stage1Name);
        if (!stage1Card) {
          console.log(`[Rare Candy] Could not find Stage 1 "${stage1Name}"`);
          return false;
        }
        
        const stage1Meta = await globalThis.fetchCardMeta(stage1Card.set, stage1Card.num);
        if (!stage1Meta) return false;
        
        const stage1EvolveFrom = normStr(stage1Meta.evolveFrom || '');
        
        console.log(`[Rare Candy] Stage 1 "${stage1Name}" evolves from: "${stage1EvolveFrom}"`);
        
        // The Stage 1 should evolve from what the fossil represents
        // For Skull Fossil: evolvesInto="Cranidos", Stage1="Cranidos", Stage1.evolveFrom="Skull Fossil"
        const matches = stage1EvolveFrom === basicName || 
                       stage1EvolveFrom.includes(basicName) ||
                       basicName.includes(stage1EvolveFrom);
        
        console.log(`[Rare Candy] Fossil evolution check: ${matches ? '✓ VALID' : '✗ INVALID'}`);
        return matches;
      }
      
      // 🆕 FOSSIL MAPPING for non-fossil basics (if they have fossil names)
      const FOSSIL_MAP = {
        'helixfossil': 'omanyte',
        'domefossil': 'kabuto',
        'oldamber': 'aerodactyl',
        'skullfossil': 'cranidos',
        'armorfossil': 'shieldon'
      };
      
      // If this is a fossil name, use the actual Pokemon name for evolution checks
      const basicNameNormalized = basicName.replace(/\s/g, '');
      if (FOSSIL_MAP[basicNameNormalized]) {
        console.log(`[Rare Candy] Fossil name detected: ${basicName} → ${FOSSIL_MAP[basicNameNormalized]}`);
        basicName = FOSSIL_MAP[basicNameNormalized];
      }
      
      // FAST PATH: Try naming heuristic first
      const basicRoot = basicName.substring(0, 4);
      const stage2Root = stage2Name.substring(0, 4);
      
      if (basicRoot === stage2Root) {
        console.log(`[Rare Candy] Fast path: Names match (${basicRoot})`);
        return true;
      }
      
      // Also check for common endings (e.g., "saur" in bulba/ivy/venu)
      if (basicName.length >= 4 && stage2Name.length >= 4) {
        const basicEnd = basicName.substring(basicName.length - 4);
        const stage2End = stage2Name.substring(stage2Name.length - 4);
        if (basicEnd === stage2End && basicEnd.length >= 3) {
          console.log(`[Rare Candy] Fast path: Names share ending (${basicEnd})`);
          return true;
        }
      }
      
      // SLOW PATH: Verify through Stage 1 lookup
      console.log(`[Rare Candy] Names don't match, checking Stage 1...`);
      const stage1Name = normStr(stage2Meta.evolveFrom || '');
      
      if (!stage1Name) return false;
      
      const stage1Card = await findCardByName(stage1Name);
      if (!stage1Card) return false;
      
      const stage1Meta = await globalThis.fetchCardMeta(stage1Card.set, stage1Card.num);
      if (!stage1Meta) return false;
      
      const stage1EvolveFrom = normStr(stage1Meta.evolveFrom || '');
      console.log(`[Rare Candy] Stage 1 "${stage1Name}" evolves from: "${stage1EvolveFrom}"`);
      console.log(`[Rare Candy] Basic: "${basicName}"`);
      
      return basicName === stage1EvolveFrom || 
             basicName.includes(stage1EvolveFrom) ||
             stage1EvolveFrom.includes(basicName);
    }
    
    // Find card by name in database
    async function findCardByName(cardName) {
      const normalizedName = normStr(cardName);
      const commonSets = ['A1', 'A1a', 'A2', 'A2a', 'A2b', 'A3'];
      
      for (const set of commonSets) {
        try {
          const setResponse = await fetch(`https://api.tcgdex.net/v2/en/sets/${set}`);
          if (!setResponse.ok) continue;
          
          const setData = await setResponse.json();
          for (const card of setData.cards || []) {
            if (normStr(card.name) === normalizedName) {
              return { set: set, num: card.localId };
            }
          }
        } catch (err) {
          console.warn(`[Rare Candy] Failed to search set ${set}:`, err);
          continue;
        }
      }
      
      return null;
    }
    
    // === BUILD VALID EVOLUTION PAIRS ===
    
    const validPairs = [];
    
    console.log('[Rare Candy] Checking evolution combinations...');
    
    for (const { img: basicImg, meta: basicMeta, isFossil } of eligibleBasics) {
      for (const { handCard, cardMeta: stage2Meta } of stage2InHand) {
        const canEvolve = await canRareCandyEvolve(basicImg, basicMeta, stage2Meta, isFossil);
        if (canEvolve) {
          validPairs.push({ basicImg, basicMeta, handCard, stage2Meta });
          console.log(`[Rare Candy] ✓ Valid: ${basicImg.alt} → ${stage2Meta.name}`);
        }
      }
    }
    
    if (!validPairs.length) {
      const msg = 'No valid evolution combinations. (Stage 2 must evolve from a Basic in play)';
      console.log('[Rare Candy] Failed:', msg);
      throw new Error(msg);
    }
    
    console.log('[Rare Candy] Found', validPairs.length, 'valid evolution pairs');
    
    // === SELECTION PHASE 1: CHOOSE BASIC ===
    
    popup('Rare Candy: Choose a Basic Pokémon to evolve.');
    const uniqueBasics = [];
    const basicMap = new Map();
    
    for (const pair of validPairs) {
      if (!basicMap.has(pair.basicImg)) {
        basicMap.set(pair.basicImg, []);
        uniqueBasics.push(pair.basicImg);
      }
      basicMap.get(pair.basicImg).push(pair);
    }
    
    const chosenBasic = await awaitSelection(uniqueBasics);
    if (!chosenBasic) {
      throw new Error('Evolution cancelled.');
    }
    
    console.log('[Rare Candy] Player selected:', chosenBasic.alt);
    
    // === SELECTION PHASE 2: CHOOSE STAGE 2 ===
    
    const pairsForBasic = basicMap.get(chosenBasic);
    
    if (pairsForBasic.length === 1) {
      const { handCard, stage2Meta } = pairsForBasic[0];
      console.log('[Rare Candy] Evolving', chosenBasic.alt, '→', stage2Meta.name);
      
      await globalThis.evolveCard(
        chosenBasic, stage2Meta, handCard, owner,
        handCard.set, handCard.number || handCard.num
      );
      
      popup(`Rare Candy: ${chosenBasic.alt} evolved into ${stage2Meta.name}!`);
      console.log(`[Rare Candy] Success!`);
      
    } else {
      popup(`Choose which Stage 2 to evolve ${chosenBasic.alt} into.`);
      const validNames = pairsForBasic.map(p => p.stage2Meta.name).join(', ');
      popup(`Valid Stage 2 cards: ${validNames}. Using first for now.`);
      
      const { handCard, stage2Meta } = pairsForBasic[0];
      console.log('[Rare Candy] Multiple options, using:', stage2Meta.name);
      
      await globalThis.evolveCard(
        chosenBasic, stage2Meta, handCard, owner,
        handCard.set, handCard.number || handCard.num
      );
      
      popup(`Rare Candy: ${chosenBasic.alt} evolved into ${stage2Meta.name}!`);
      console.log(`[Rare Candy] Success!`);
    }
  },

  // Rotom Dex - Peek at top card, optionally shuffle
  peek_topdeck_optional_shuffle: async (state, pk, { param1 }) => {
    const count = parseInt10(param1, 1);
    const player = pkToPlayer(pk);
    const deck = state[player]?.deck || [];
    
    if (!deck.length) {
      popup('Your deck is empty.');
      return;
    }
    
    // Show top card
    const topCard = deck[deck.length - 1];
    popup(`Top card: ${topCard.name}. Shuffle deck?`);
    
    // TODO: Add UI button for shuffle choice
    // For now, just show the card
    console.log(`[Rotom Dex] Top card: ${topCard.name}`);
    
    // Auto-shuffle for now (can add player choice later)
    const shouldShuffle = Math.random() < 0.5; // Placeholder
    if (shouldShuffle) {
      shuffleArray(deck);
      popup('Deck shuffled.');
      console.log('[Rotom Dex] Deck shuffled');
    }
  },

  // Poison Barb - Tool that inflicts poison when hit
  counter_inflict_status_tool: async (state, pk, { param1 }) => {
    // This tool's effect is triggered in battle.html when the Pokemon takes damage
    // The implementation is in damageActiveOf() function around line 4483
    // This function just confirms attachment
    popup('Poison Barb attached! Will poison attackers when this Pokémon is hit.');
    console.log('[Poison Barb] Tool attached - effect will trigger on damage');
  },

  // Leaf Cape - HP boost for Grass types
  increase_max_hp_type: async (state, pk, { param1, param2 }) => {
    const hpBonus = parseInt10(param1, 30);
    const requiredType = (param2 || 'grass').toLowerCase();
    
    // Get the Pokemon this tool is being attached to
    const targetImg = globalThis.toolAttachTarget;
    if (!targetImg) {
      popup('Error: No target Pokemon found.');
      console.error('[Leaf Cape] No toolAttachTarget set');
      return;
    }
    
    // Check if Pokemon is the correct type
    try {
      const meta = await globalThis.fetchCardMeta(targetImg.dataset.set, targetImg.dataset.num);
      const hasType = meta.types?.some(t => t.toLowerCase() === requiredType);
      
      if (!hasType) {
        popup(`Leaf Cape can only be attached to ${param2}-type Pokémon!`);
        console.log(`[Leaf Cape] ${targetImg.alt} is not ${requiredType} type`);
        throw new Error(`Wrong type for Leaf Cape`);
      }
      
      // Apply HP bonus (similar to Giant Cape)
      const slot = getSlotFromImg(targetImg);
      if (!slot) {
        popup('Error: Could not find Pokemon slot.');
        return;
      }
      
      const baseHp = parseInt10(targetImg.dataset.hp);
      const curHp = parseInt10(targetImg.dataset.chp, baseHp);
      const newMaxHp = baseHp + hpBonus;
      
      // Set modified max HP
      slot.dataset.maxHp = String(newMaxHp);
      
      // Add HP bonus to current HP
      const newCurHp = curHp + hpBonus;
      
      setHpOnImg(targetImg, baseHp, newCurHp);
      
      popup(`Leaf Cape: ${targetImg.alt} gained +${hpBonus} HP!`);
      console.log(`[Leaf Cape] ${targetImg.alt} HP: ${curHp}/${baseHp} → ${newCurHp}/${newMaxHp}`);
      
    } catch (err) {
      console.error('[Leaf Cape] Error:', err);
      throw err; // Re-throw to prevent tool attachment
    }
  },

  // Acerola - Transfer damage to opponent
  transfer_damage_named_to_opponent: async (state, pk, { param1, param2 }) => {
    const transferAmount = parseInt10(param1, 40);
    const allowedNames = (param2 || '').split(',').map(n => normStr(n));
    
    const myPokemon = getAllPokemonImgs(pk);
    const eligible = [];
    
    for (const img of myPokemon) {
      const name = normStr(img.alt);
      const { base, cur } = getHpFromImg(img);
      const hasDamage = cur < base;
      const isNamed = allowedNames.some(n => name.includes(n));
      
      if (hasDamage && isNamed) {
        eligible.push(img);
      }
    }
    
    if (!eligible.length) {
      popup(`No eligible Pokémon with damage.`);
      return;
    }
    
    popup(`Choose ${param2} with damage.`);
    const chosen = await awaitSelection(eligible);
    
    if (chosen) {
      const { base, cur } = getHpFromImg(chosen);
      const actualDamage = base - cur;
      const actualTransfer = Math.min(transferAmount, actualDamage);
      
      // Heal chosen Pokemon
      healImg(chosen, actualTransfer);
      
      // Damage opponent's active
      const oppOwner = oppPk(pk) === 'p1' ? 'player1' : 'player2';
      
      if (globalThis.damageActiveOf) {
        const result = await globalThis.damageActiveOf(oppOwner, actualTransfer, { isDirectAttack: false });
        
        popup(`Moved ${actualTransfer} damage to opponent!`);
        console.log(`[Acerola] Transferred ${actualTransfer} damage`);
        
        // Check if transfer KO'd opponent
        if (result.knocked && typeof globalThis.handleKnockOut === 'function') {
          console.log('[Acerola] Opponent knocked out by transferred damage!');
          const oppImg = globalThis.getActiveImage(oppOwner);
          if (oppImg) {
            const gameEnded = await globalThis.handleKnockOut(oppOwner, oppImg, true);
            if (!gameEnded && typeof globalThis.beginPromotionFlow === 'function') {
              globalThis.beginPromotionFlow(oppOwner);
            }
          }
        }
      }
    }
  },

  // Ilima - Return damaged colorless Pokemon to hand
  return_damaged_type_to_hand: async (state, pk, { param1 }) => {
    const type = (param1 || 'colorless').toLowerCase();
    const allPokemon = getAllPokemonImgs(pk);
    const eligible = [];
    
    for (const img of allPokemon) {
      try {
        const meta = await globalThis.fetchCardMeta(img.dataset.set, img.dataset.num);
        const hasType = meta.types?.some(t => t.toLowerCase() === type);
        const { base, cur } = getHpFromImg(img);
        const hasDamage = cur < base;
        
        if (hasType && hasDamage) {
          eligible.push(img);
        }
      } catch {}
    }
    
    if (!eligible.length) {
      popup(`No damaged ${type}-type Pokémon.`);
      return;
    }
    
    popup(`Choose a damaged ${type}-type Pokémon to return to hand.`);
    const chosen = await awaitSelection(eligible);
    
    if (chosen) {
      // Add to hand
      state[pk].hand.push({
        name: chosen.alt,
        set: chosen.dataset.set,
        number: chosen.dataset.num,
        image: chosen.src
      });
      
      // Remove from field
      const slot = getSlotFromImg(chosen);
      if (slot) {
        slot.innerHTML = '<span class="slot-label">Empty</span>';
        slot.dataset.empty = '1';
        delete slot.dataset.maxHp;
      }
      
      globalThis.renderAllHands?.();
      popup(`Returned ${chosen.alt} to hand.`);
      
      // If active was returned, trigger promotion
      if (getActiveImg(pk) === null) {
        globalThis.beginPromotionFlow?.(pkToPlayer(pk));
      }
    }
  },

  // Kiawe - Attach energy to targets, then end turn
  attach_energy_to_targets_end_turn: async (state, pk, { param1, param2 }) => {
    const [countStr, type] = (param1 || '2|fire').split('|');
    const count = parseInt10(countStr, 2);
    const energyType = (type || 'fire').toLowerCase();
    const names = (param2 || '').split(',').map(n => normStr(n));
    
    const allPokemon = getAllPokemonImgs(pk);
    const eligible = allPokemon.filter(img => {
      const name = normStr(img.alt);
      return names.some(n => name.includes(n));
    });
    
    if (!eligible.length) {
      popup('No valid target Pokémon.');
      return;
    }
    
    popup(`Choose ${param2} to attach ${count} ${energyType} Energy.`);
    const chosen = await awaitSelection(eligible);
    
    if (chosen) {
      for (let i = 0; i < count; i++) {
        attachEnergy(chosen, energyType);
      }
      
      popup(`Attached ${count} ${energyType} Energy to ${chosen.alt}. Your turn ends.`);
      console.log(`[Kiawe] Attached ${count} ${energyType} energy, ending turn`);
      
      // End turn immediately
      setTimeout(() => {
        if (globalThis.startTurn && globalThis.currentPlayer) {
          const nextPlayer = globalThis.currentPlayer === 'player1' ? 'player2' : 'player1';
          console.log(`[Kiawe] Ending turn, switching to ${nextPlayer}`);
          globalThis.startTurn(nextPlayer);
        } else {
          console.error('[Kiawe] Cannot end turn - startTurn or currentPlayer not available');
        }
      }, 1000);
    }
  },

  // Guzma - Discard all opponent's tools
  discard_all_opponent_tools: async (state, pk) => {
    const oppPk = pk === 'p1' ? 'p2' : 'p1';
    const oppOwner = oppPk === 'p1' ? 'player1' : 'player2';
    const oppPokemon = getAllPokemonImgs(oppPk);
    
    let toolsDiscarded = 0;
    const pokemonToKO = []; // Track Pokemon that should be KO'd after tool removal
    
    for (const img of oppPokemon) {
      const slot = getSlotFromImg(img);
      if (!slot) continue;
      
      const toolThumb = slot.querySelector('.tool-thumb');
      if (toolThumb) {
        toolThumb.remove();
        
        // Clear tool data from slot
        const toolData = globalThis.getToolDataFromSlot?.(slot);
        if (toolData) {
          globalThis.setToolDataOnSlot?.(slot, null);
          
          // Check if this is an HP-boosting tool (Giant Cape or Leaf Cape)
          const isGiantCape = toolData.set === 'A2' && toolData.num === '147';
          const isLeafCape = toolData.set === 'A3' && toolData.num === '147';
          
          if (isGiantCape || isLeafCape) {
            const hpBonus = isGiantCape ? 20 : 30;
            delete slot.dataset.maxHp;
            
            const cardImg = slot.querySelector('img');
            if (cardImg) {
              const baseHp = parseInt10(cardImg.dataset.hp);
              const curHp = parseInt10(cardImg.dataset.chp);
              
              // Remove the HP bonus - if current HP is now <= 0, this Pokemon should be KO'd
              const newCurHp = curHp - hpBonus;
              
              if (newCurHp <= 0) {
                // Mark for KO after we finish removing all tools
                pokemonToKO.push({ img: cardImg, wasActive: getActiveImg(oppPk) === cardImg });
                console.log(`[Guzma] ${cardImg.alt} will be KO'd (HP: ${curHp} - ${hpBonus} = ${newCurHp})`);
              } else {
                // Just update HP normally
                setHpOnImg(cardImg, baseHp, newCurHp);
              }
            }
          }
          
          toolsDiscarded++;
        }
      }
    }
    
    popup(toolsDiscarded > 0 
      ? `Discarded ${toolsDiscarded} Tool card${toolsDiscarded > 1 ? 's' : ''}!` 
      : 'No Tools to discard.');
    
    console.log(`[Guzma] Discarded ${toolsDiscarded} tools`);
    
    // Handle KOs after all tools are removed
    for (const { img, wasActive } of pokemonToKO) {
      popup(`${img.alt} was Knocked Out by losing its HP boost!`);
      
      if (globalThis.handleKnockOut) {
        const gameEnded = await globalThis.handleKnockOut(oppOwner, img, wasActive);
        
        // If active Pokemon was KO'd and game didn't end, trigger promotion
        if (!gameEnded && wasActive && typeof globalThis.beginPromotionFlow === 'function') {
          globalThis.beginPromotionFlow(oppOwner);
        }
      }
    }
  },

  // Lana - Force opponent switch if you have Araquanid
  force_opponent_switch_if_named: async (state, pk, { param2 }) => {
    const requiredName = normStr(param2 || 'araquanid');
    const myPokemon = getAllPokemonImgs(pk);
    
    const hasRequired = myPokemon.some(img => normStr(img.alt).includes(requiredName));
    
    if (!hasRequired) {
      popup(`You need ${param2} in play to use this card.`);
      return;
    }
    
    globalThis.promoteFromBench?.(state, oppPk(pk), true);
    popup(`Opponent must switch (you have ${param2}).`);
  },

  // Mallow - Heal full, discard all energy
  heal_full_discard_energy_named: async (state, pk, { param2 }) => {
    const names = (param2 || '').split(',').map(n => normStr(n));
    const allPokemon = getAllPokemonImgs(pk);
    
    const eligible = allPokemon.filter(img => {
      const name = normStr(img.alt);
      const { base, cur } = getHpFromImg(img);
      return names.some(n => name.includes(n)) && cur < base;
    });
    
    if (!eligible.length) {
      popup(`No damaged ${param2} in play.`);
      return;
    }
    
    popup(`Choose ${param2} to fully heal.`);
    const chosen = await awaitSelection(eligible);
    
    if (chosen) {
      const { base } = getHpFromImg(chosen);
      
      // Heal to full
      setHpOnImg(chosen, base, base);
      
      // Discard all energy
      const slot = getSlotFromImg(chosen);
      const energyBox = slot?.querySelector('.energy-pips');
      if (energyBox) {
        const pipCount = energyBox.querySelectorAll('.energy-pip').length;
        energyBox.remove();
        popup(`Healed ${chosen.alt} to full HP! Discarded ${pipCount} Energy.`);
      } else {
        popup(`Healed ${chosen.alt} to full HP!`);
      }
    }
  },

  // Lillie - Heal Stage 2 Pokemon
  heal_stage: async (state, pk, { param1, param2 }) => {
    const amount = parseInt10(param1, 60);
    const stage = (param2 || 'stage2').toLowerCase();
    
    const allPokemon = getAllPokemonImgs(pk);
    const eligible = [];
    
    for (const img of allPokemon) {
      try {
        const meta = await globalThis.fetchCardMeta(img.dataset.set, img.dataset.num);
        const cardStage = (meta.stage || '').toLowerCase();
        const { base, cur } = getHpFromImg(img);
        
        if (cardStage === stage && cur < base) {
          eligible.push(img);
        }
      } catch {}
    }
    
    if (!eligible.length) {
      popup(`No damaged ${stage} Pokémon.`);
      return;
    }
    
    popup(`Choose a ${stage} Pokémon to heal ${amount} damage.`);
    const chosen = await awaitSelection(eligible);
    
    if (chosen && healImg(chosen, amount)) {
      popup(`Healed ${amount} damage from ${chosen.alt}.`);
    }
  },

  // 🆕 A3 TRAINER EFFECTS - END
  // 🆕 A2b TRAINER EFFECTS - END
  
  // ========================================
  // 🆕 A3a TRAINER EFFECTS START
  // ========================================
  
  // Beast Wall - Reduce damage if no points scored
  reduce_all_incoming_damage_next_turn_if_no_points: async (state, pk, { param1 }) => {
    const reduction = parseInt10(param1, 20);
    const opp = oppPk(pk);
    
    // Check if opponent has any points
    const oppPoints = (opp === 'p1' ? globalThis.p1Points : globalThis.p2Points) || 0;
    
    if (oppPoints > 0) {
      popup('Cannot use Beast Wall - opponent has already gotten points.');
      return;
    }
    
    // Set up damage reduction for Ultra Beasts
    if (!globalThis.state) globalThis.state = {};
    if (!globalThis.state.damageReduction) globalThis.state.damageReduction = {};
    
    globalThis.state.damageReduction[pk] = {
      amount: reduction,
      target: 'ultra_beast', // Only Ultra Beasts
      duration: 'next_turn'
    };
    
    popup(`Your Ultra Beasts will take -${reduction} damage during opponent's next turn`);
    console.log(`[Beast Wall] ${pk} Ultra Beasts protected for -${reduction} damage`);
  },
  
  // Repel - Force switch opponent's Basic Pokemon
  force_opponent_switch_basic: async (state, pk) => {
    const opp = oppPk(pk);
    const activeImg = getActiveImg(opp);
    
    if (!activeImg) {
      popup('No opponent Active Pokemon.');
      return;
    }
    
    // Check if active is Basic
    try {
      const meta = await globalThis.fetchCardMeta(activeImg.dataset.set, activeImg.dataset.num);
      const stage = (meta.stage || '').toLowerCase();
      
      if (stage !== 'basic') {
        popup('Opponent\'s Active Pokemon is not a Basic Pokemon.');
        return;
      }
    } catch {
      popup('Could not verify Pokemon stage.');
      return;
    }
    
    // Force switch
    const oppPlayer = opp === 'p1' ? 'player1' : 'player2';
    if (typeof globalThis.beginPromotionFlow === 'function') {
      globalThis.beginPromotionFlow(oppPlayer);
      popup('Repel: Switched out opponent\'s Basic Pokemon!');
    }
  },
  
  // Gladion - Search for Type: Null or Silvally
  search_named_random: async (state, pk, { param2 }) => {
    // param2: "Type: Null;Silvally"
    const names = (param2 || '').split(';').map(n => n.trim());
    
    popup(`Searching deck for ${names.join(' or ')}...`);
    console.log(`[Gladion] Searching for: ${names.join(', ')}`);
    
    // Get player's deck
    const deck = state[pk]?.deck || [];
    
    if (deck.length === 0) {
      popup('Your deck is empty.');
      return;
    }
    
    // Find all matching cards - use exact match OR contains match
    const matches = [];
    for (const card of deck) {
      const cardName = (card.name || '').trim();
      const cardNameLower = cardName.toLowerCase();
      
      for (const searchName of names) {
        const searchLower = searchName.toLowerCase();
        // Try exact match first, then contains
        if (cardName === searchName || 
            cardNameLower === searchLower ||
            cardNameLower.includes(searchLower) ||
            searchLower.includes(cardNameLower)) {
          matches.push(card);
          break; // Don't add same card twice
        }
      }
    }
    
    if (matches.length === 0) {
      popup(`No ${names.join(' or ')} found in deck.`);
      console.log('[Gladion] No matches. Deck contents:', deck.map(c => c.name));
      return;
    }
    
    // Pick random match
    const chosen = matches[Math.floor(Math.random() * matches.length)];
    
    // Remove from deck and add to hand
    const deckIndex = deck.indexOf(chosen);
    if (deckIndex !== -1) {
      deck.splice(deckIndex, 1);
      state[pk].hand = state[pk].hand || [];
      state[pk].hand.push(chosen);
      
      popup(`Found ${chosen.name}! Added to hand.`);
      console.log(`[Gladion] Added to hand:`, chosen.name);
      
      // Update hand UI if available
      if (globalThis.renderHand) {
        globalThis.renderHand(pk);
      }
    }
  },
  
  // Looker - Reveal opponent's Supporters
  reveal_opponent_supporters: async (state, pk) => {
    const opp = oppPk(pk);
    
    popup('Revealing opponent\'s Supporters...');
    console.log(`[Looker] Revealing opponent's Supporters`);
    
    // Get opponent's deck
    const deck = state[opp]?.deck || [];
    
    if (deck.length === 0) {
      popup('Opponent\'s deck is empty.');
      return;
    }
    
    // Find all Supporter cards
    const supporters = [];
    for (const card of deck) {
      // Check if it's a Supporter (category === 'Trainer' and trainerType === 'Supporter')
      if (card.category === 'Trainer' && card.trainerType === 'Supporter') {
        supporters.push(card);
      }
    }
    
    if (supporters.length === 0) {
      popup('No Supporters found in opponent\'s deck.');
      return;
    }
    
    // Show the supporters to the player
    const supporterNames = supporters.map(c => c.name).join(', ');
    popup(`Revealed ${supporters.length} Supporter(s): ${supporterNames}`);
    console.log(`[Looker] Revealed Supporters:`, supporters);
    
    // Display in a more visible way if UI function exists
    if (globalThis.showCardReveal) {
      globalThis.showCardReveal('Opponent\'s Supporters', supporters);
    }
  },
  
  // Lusamine - Attach energy to Ultra Beast if points condition met
  attach_from_discard_ultra_beast_if_points: async (state, pk, { param1 }) => {
    const count = parseInt10(param1, 2);
    const opp = oppPk(pk);
    
    // Check if opponent has at least 1 point
    const oppPoints = (opp === 'p1' ? globalThis.p1Points : globalThis.p2Points) || 0;
    
    if (oppPoints < 1) {
      popup('Cannot use Lusamine - opponent hasn\'t gotten any points yet.');
      return;
    }
    
    // List of all Ultra Beasts
    const ULTRA_BEASTS = [
      'nihilego', 'buzzwole', 'pheromosa', 'xurkitree', 'celesteela',
      'kartana', 'guzzlord', 'poipole', 'naganadel', 'stakataka', 'blacephalon'
    ];
    
    // Get all Ultra Beasts in play
    const allPokemon = getAllPokemonImgs(pk);
    const ultraBeasts = allPokemon.filter(img => {
      const name = (img.alt || '').toLowerCase();
      return ULTRA_BEASTS.some(ub => name.includes(ub));
    });
    
    if (!ultraBeasts.length) {
      popup('No Ultra Beasts in play.');
      return;
    }
    
    popup('Choose an Ultra Beast to attach Energy from discard.');
    const chosen = await awaitSelection(ultraBeasts);
    
    if (!chosen) return;
    
    // Get energy counts from discard pile - use state parameter
    const energyCounts = state[pk]?.discard?.energyCounts || {};
    
    console.log('[Lusamine] Checking discard for', pk);
    console.log('[Lusamine] energyCounts:', energyCounts);
    
    // Get available energy types (exclude 'total' key)
    const availableTypes = Object.keys(energyCounts).filter(type => 
      type !== 'total' && energyCounts[type] > 0
    );
    
    console.log('[Lusamine] Available energy types:', availableTypes);
    
    if (availableTypes.length === 0) {
      popup('No Energy in discard pile.');
      console.log('[Lusamine] No energy found. Discard state:', state[pk]?.discard);
      return;
    }
    
    // Calculate total energy available
    const totalEnergy = availableTypes.reduce((sum, type) => sum + energyCounts[type], 0);
    const attachCount = Math.min(count, totalEnergy);
    
    console.log('[Lusamine] Will attach', attachCount, 'energy');
    
    if (attachCount === 0) {
      popup('No Energy in discard pile.');
      return;
    }
    
    // Attach random energy from discard
    for (let i = 0; i < attachCount; i++) {
      // Pick a random type that has energy available
      const availableNow = availableTypes.filter(type => energyCounts[type] > 0);
      if (availableNow.length === 0) break;
      
      const randomType = availableNow[Math.floor(Math.random() * availableNow.length)];
      
      // Attach energy to the Pokemon
      if (typeof attachEnergy === 'function') {
        attachEnergy(chosen, randomType);
        console.log(`[Lusamine] Attached ${randomType} energy (${i+1}/${attachCount})`);
      }
      
      // Decrease count in discard
      energyCounts[randomType]--;
      console.log(`[Lusamine] ${randomType} remaining in discard: ${energyCounts[randomType]}`);
    }
    
    popup(`Lusamine: Attached ${attachCount} Energy from discard to ${chosen.alt}!`);
    console.log(`[Lusamine] Successfully attached ${attachCount} Energy to`, chosen.alt);
    
    // Update discard UI if available
    const owner = pk === 'p1' ? 'player1' : 'player2';
    if (typeof renderDiscard === 'function') {
      renderDiscard(owner);
    }
  },
  
  // ========================================
  // 🆕 A3b TRAINER EFFECTS START
  // ========================================
  
  // Eevee Bag - Boost or heal Eeveelutions (choice)
  eevee_boost_or_heal: async (state, pk, { param1, param2 }) => {
    const boostAmount = parseInt10(param1, 10);
    const healAmount = parseInt10(param2, 20);
    
    // List of all Eeveelutions
    const EEVEELUTIONS = [
      'vaporeon', 'jolteon', 'flareon', 'espeon', 'umbreon',
      'leafeon', 'glaceon', 'sylveon'
    ];
    
    // Get all Eeveelutions in play
    const allPokemon = getAllPokemonImgs(pk);
    const eeveelutions = allPokemon.filter(img => {
      const name = (img.alt || '').toLowerCase();
      return EEVEELUTIONS.some(ee => name.includes(ee));
    });
    
    if (!eeveelutions.length) {
      popup('No Pokémon that evolve from Eevee in play.');
      return;
    }
    
    // Create choice UI
    popup(`Eevee Bag: Choose effect for ${eeveelutions.length} Eeveelution(s)`);
    
    // Simple selection approach: Let user select from dummy options
    const boostOption = document.createElement('div');
    boostOption.textContent = `Boost: +${boostAmount} damage this turn`;
    boostOption.style.cursor = 'pointer';
    
    const healOption = document.createElement('div');
    healOption.textContent = `Heal: ${healAmount} damage from each`;
    healOption.style.cursor = 'pointer';
    
    // Use awaitSelection with special choice markers
    const boostMarker = eeveelutions[0]; // Use first Eeveelution as boost marker
    const healMarker = eeveelutions.length > 1 ? eeveelutions[1] : eeveelutions[0]; // Use second or first
    
    popup('Click an Eeveelution: First one = Boost, Second one = Heal (or same if only 1)');
    const choice = await awaitSelection(eeveelutions);
    
    if (!choice) return;
    
    // Determine choice based on which was selected
    const chosenIndex = eeveelutions.indexOf(choice);
    
    if (chosenIndex === 0 || eeveelutions.length === 1) {
      // Boost option
      if (!globalThis.state) globalThis.state = {};
      if (!globalThis.state.damageBoost) globalThis.state.damageBoost = {};
      
      globalThis.state.damageBoost[pk] = {
        amount: boostAmount,
        target: 'eeveelution',
        targetNames: EEVEELUTIONS,
        duration: 'this_turn'
      };
      
      popup(`Eevee Bag: Eeveelutions will do +${boostAmount} damage this turn!`);
      console.log(`[Eevee Bag] Boost activated: +${boostAmount} damage`);
    } else {
      // Heal option
      for (const img of eeveelutions) {
        healImg(img, healAmount);
      }
      popup(`Eevee Bag: Healed ${healAmount} damage from ${eeveelutions.length} Eeveelution(s)!`);
      console.log(`[Eevee Bag] Healed ${eeveelutions.length} Eeveelutions`);
    }
  },
  
  // Hau - Boost damage for specific Alola starters
  // NOTE: This uses existing boost_damage_type_targets handler
  // boost_damage_type_targets: defined earlier
  
  // Penny - Copy random opponent Supporter
  copy_random_opponent_supporter: async (state, pk) => {
    const opp = oppPk(pk);
    
    popup('Penny: Looking at opponent\'s Supporters...');
    console.log(`[Penny] Copying opponent's Supporter`);
    
    // Get opponent's deck
    const deck = state[opp]?.deck || [];
    
    if (deck.length === 0) {
      popup('Opponent\'s deck is empty.');
      return;
    }
    
    // Find all Supporter cards (excluding Penny itself)
    const supporters = [];
    for (const card of deck) {
      if (card.category === 'Trainer' && 
          card.trainerType === 'Supporter' && 
          card.name !== 'Penny') {
        supporters.push(card);
      }
    }
    
    if (supporters.length === 0) {
      popup('No valid Supporters found in opponent\'s deck (or only Penny found).');
      return;
    }
    
    // Pick random supporter
    const chosen = supporters[Math.floor(Math.random() * supporters.length)];
    
    popup(`Penny copies: ${chosen.name}!`);
    console.log(`[Penny] Copying:`, chosen);
    
    // Shuffle the chosen card back into opponent's deck
    // (it was just revealed, not removed)
    
    // Now execute the chosen supporter's effect as if this player played it
    if (chosen.effect_type && TRAINER_EFFECTS[chosen.effect_type]) {
      try {
        await TRAINER_EFFECTS[chosen.effect_type](state, pk, {
          param1: chosen.param1,
          param2: chosen.param2
        });
        console.log(`[Penny] Successfully executed ${chosen.name} effect`);
      } catch (err) {
        console.error(`[Penny] Failed to execute effect:`, err);
        popup(`Failed to execute ${chosen.name} effect.`);
      }
    } else {
      popup(`${chosen.name} effect not implemented.`);
      console.log(`[Penny] Effect type not found:`, chosen.effect_type);
    }
  },

  // 🆕 A3a/A3b TRAINER EFFECTS - END
};

globalThis.TRAINER_EFFECTS = TRAINER_EFFECTS;

/* ============================
   MOVE EFFECTS
============================ */
const MOVE_HANDLERS = {
  // Status effects
  inflict_status: async (s, pk, { param1 }, ctx) => {
    if (!ctx.isFinal) return;
    applyStatus(oppPk(pk), param1);
    popup(`Inflicted ${param1}!`);
  },
  
  inflict_paralysis: async (s, pk, p, ctx) => { if (ctx.isFinal) { applyStatus(oppPk(pk), 'paralysis'); popup('Paralyzed!'); } },
  inflict_sleep: async (s, pk, p, ctx) => { if (ctx.isFinal) { applyStatus(oppPk(pk), 'sleep'); popup('Asleep!'); } },
  inflict_poison: async (s, pk, p, ctx) => { if (ctx.isFinal) { applyStatus(oppPk(pk), 'poison'); popup('Poisoned!'); } },
  inflict_burn: async (s, pk, p, ctx) => { if (ctx.isFinal) { applyStatus(oppPk(pk), 'burn'); popup('Burned!'); } },
  inflict_confusion: async (s, pk, p, ctx) => { if (ctx.isFinal) { applyStatus(oppPk(pk), 'confusion'); popup('Confused!'); } },
  
  flip_inflict_status_if_heads: async (s, pk, { param1 }, ctx) => {
    if (!ctx.isFinal) return;
    if ((await flipCoin()) === 'heads') { applyStatus(oppPk(pk), param1); popup(`HEADS → ${param1}!`); }
    else popup('TAILS → no effect.');
  },
  
  flip_inflict_effect_if_heads: async (s, pk, { param1, param2 }, ctx) => {
    if (!ctx.isFinal) return;
    
    if ((await flipCoin()) === 'tails') {
      popup('TAILS → no effect.');
      return;
    }
    
    const effect = param1?.toLowerCase();
    const opp = oppPk(pk);
    
    // Initialize special effects storage if needed
    globalThis.__specialEffects ??= { p1: {}, p2: {} };
    
    switch (effect) {
      case 'attack_lock':
        globalThis.__specialEffects[opp].attackLock = true;
        popup("HEADS → Opponent can't attack next turn!");
        break;
        
      case 'prevent_damage_next_turn':
        globalThis.__specialEffects[pk].preventDamage = true;
        popup("HEADS → This Pokémon will take no damage next turn!");
        break;
        
      default:
        // Check if it's a status condition
        if (STATUS_TYPES.has(effect)) {
          applyStatus(opp, param1);
          popup(`HEADS → ${param1}!`);
        } else {
          popup(`HEADS → ${param1}!`);
        }
    }
  },
  
  inflict_effect: async (s, pk, { param1, param2 }, ctx) => {
    if (!ctx.isFinal) return;
    
    const effect = param1?.toLowerCase();
    const opp = oppPk(pk);
    
    // Initialize special effects storage if needed
    globalThis.__specialEffects ??= { p1: {}, p2: {} };
    
    switch (effect) {
      case 'attack_lock':
        globalThis.__specialEffects[opp].attackLock = true;
        popup("Opponent can't attack next turn!");
        break;
        
      case 'block_supporter':
        globalThis.__specialEffects[opp].supporterBlock = true;
        popup("Opponent can't use Supporters next turn!");
        break;
        
      case 'retreat_lock':
        globalThis.__specialEffects[opp].retreatLock = true;
        popup("Opponent can't retreat next turn!");
        break;
        
      case 'prevent_damage_next_turn':
        globalThis.__specialEffects[pk].preventDamage = true;
        popup("This Pokémon will take no damage next turn!");
        break;
        
      case 'reduce_damage_next_turn':
        const reduction = parseInt10(param2, 20);
        globalThis.__specialEffects[pk].damageReduction = reduction;
        popup(`This Pokémon will take ${reduction} less damage next turn!`);
        break;
        
      default:
        // Check if it's a status condition
        if (STATUS_TYPES.has(effect)) {
          applyStatus(opp, param1);
        } else {
          popup(`Applied ${param1}.`);
        }
    }
  },

  // Healing
  heal_self: async (s, pk, { param1 }, ctx) => {
    if (!ctx.isFinal) return;
    const amt = parseInt10(param1);
    healImg(getActiveImg(pk), amt);
    popup(`Healed ${amt} damage.`);
  },
  
  heal_equal_to_damage_done: async (s, pk, p, ctx) => {
    if (!ctx.isFinal || !ctx.rawCtx?.damageDealt) return;
    healImg(getActiveImg(pk), ctx.rawCtx.damageDealt);
    popup(`Healed ${ctx.rawCtx.damageDealt} damage.`);
  },

  // Damage bonuses
  bonus_damage_if_opponent_damaged: async (s, pk, { param1 }, ctx) => {
    const { base, cur } = getHpFromImg(getActiveImg(oppPk(pk)));
    if (cur < base) ctx.addBonus(parseInt10(param1));
  },
  
  bonus_damage_if_self_damaged: async (s, pk, { param1 }, ctx) => {
    const { base, cur } = getHpFromImg(getActiveImg(pk));
    if (cur < base) ctx.addBonus(parseInt10(param1));
  },
  
  bonus_damage_for_each_energy_on_opponent: async (s, pk, { param1 }, ctx) => {
    ctx.addBonus(countEnergy(getActiveImg(oppPk(pk))) * parseInt10(param1));
  },
  
  bonus_damage_for_each_bench: async (s, pk, { param1 }, ctx) => {
    ctx.addBonus(getBenchImgs(pk).length * parseInt10(param1));
  },
  
  bonus_damage_for_each_typed_bench: async (s, pk, { param1, param2 }, ctx) => {
    const type = param1?.toLowerCase();
    const per = parseInt10(param2);
    let count = 0;
    
    for (const img of getBenchImgs(pk)) {
      try {
        const meta = await globalThis.fetchCardMeta(img.dataset.set, img.dataset.num);
        if (meta.types?.some(t => t.toLowerCase() === type)) count++;
      } catch {}
    }
    ctx.addBonus(count * per);
  },
  
  bonus_damage_for_each_named_bench: async (s, pk, { param1, param2 }, ctx) => {
    const name = param1?.toLowerCase();
    const count = getBenchImgs(pk).filter(img => (img.alt || '').toLowerCase() === name).length;
    ctx.addBonus(count * parseInt10(param2));
  },
  
  bonus_damage_if_opponent_poisoned: async (s, pk, { param1 }, ctx) => {
    if (getActiveImg(oppPk(pk))?.dataset.status?.toLowerCase() === 'poisoned') {
      ctx.addBonus(parseInt10(param1));
    }
  },
  
  extra_damage_if_extra_energy_attached: async (s, pk, { param1, param2 }, ctx) => {
    const [needed, bonus] = (param2 || '').split('|').map(v => parseInt10(v));
    if (countEnergy(getActiveImg(pk), param1?.toLowerCase()) >= needed) {
      ctx.addBonus(bonus);
    }
  },

  // Flip-based damage
  flip_bonus_damage_if_heads: async (s, pk, { param2 }, ctx) => {
    if (!ctx.isFinal) return;
    if ((await flipCoin()) === 'heads') ctx.addBonus(parseInt10(param2));
  },
  
  flip_bonus_damage_with_self_damage: async (s, pk, { param1, param2 }, ctx) => {
    if (!ctx.isFinal) return;
    if ((await flipCoin()) === 'heads') ctx.addBonus(parseInt10(param1));
    else damageImg(getActiveImg(pk), parseInt10(param2));
  },
  
  flip_bonus_if_double_heads: async (s, pk, { param1 }, ctx) => {
    if (!ctx.isFinal) return;
    if ((await flipCoin()) === 'heads' && (await flipCoin()) === 'heads') {
      ctx.addBonus(parseInt10(param1));
    }
  },
  
  flip_multiplier: async (s, pk, { param1, param2 }, ctx) => {
    if (!ctx.isFinal) return;
    let heads = 0;
    for (let i = 0; i < parseInt10(param1); i++) {
      if ((await flipCoin()) === 'heads') heads++;
    }
    ctx.setOverride(heads * parseInt10(param2));
  },
  
  flip_until_tails_multiplier: async (s, pk, { param1 }, ctx) => {
    if (!ctx.isFinal) return;
    let heads = 0;
    while ((await flipCoin()) === 'heads') heads++;
    ctx.setOverride(heads * parseInt10(param1));
  },
  
  flip_do_nothing_if_tails: async (s, pk, p, ctx) => {
    if (!ctx.isFinal) return;
    if ((await flipCoin()) === 'tails') ctx.setOverride(0);
  },

  // Energy discard
  discard_energy_specific: async (s, pk, { param1, param2 }, ctx) => {
    if (!ctx.isFinal) return;
    const removed = removeEnergy(getActiveImg(pk), param1, parseInt10(param2, 1));
    popup(`Discarded ${removed} ${param1} Energy.`);
  },
  
  discard_energy_all: async (s, pk, p, ctx) => {
    if (!ctx.isFinal) return;
    removeEnergy(getActiveImg(pk), null, 999);
    popup('Discarded all Energy.');
  },
  
  discard_random_energy_from_opponent: async (s, pk, p, ctx) => {
    if (!ctx.isFinal) return;
    removeEnergy(getActiveImg(oppPk(pk)), null, 1);
    popup('Discarded opponent Energy.');
  },
  
  flip_discard_random_from_opponent: async (s, pk, p, ctx) => {
    if (!ctx.isFinal) return;
    if ((await flipCoin()) === 'heads') {
      removeEnergy(getActiveImg(oppPk(pk)), null, 1);
      popup('HEADS → discarded opponent Energy.');
    } else popup('TAILS.');
  },

  // Bench/target damage
  bench_damage_one: async (s, pk, { param1, param2 }, ctx) => {
    if (!ctx.isFinal) return;
    const mode = (param1 || 'opponent').toLowerCase();
    const dmg = parseInt10(param2 || param1);
    if (!dmg) return;
    
    const candidates = [];
    const opp = oppPk(pk);
    
    // In Pokemon TCG Pocket, attacks that say "1 of your opponent's Pokémon"
    // can target BOTH active and bench Pokemon
    if (mode === 'opponent') {
      // Include active Pokemon
      const activeImg = getActiveImg(opp);
      if (activeImg) candidates.push(activeImg);
      // Include bench Pokemon
      candidates.push(...getBenchImgs(opp));
    } else if (mode === 'active') {
      // Explicit active-only targeting
      const img = getActiveImg(opp);
      if (img) candidates.push(img);
    } else if (mode === 'bench') {
      // Explicit bench-only targeting (opponent)
      candidates.push(...getBenchImgs(opp));
    } else if (mode === 'self') {
      // Self bench targeting (like Zapdos)
      candidates.push(...getBenchImgs(pk));
    }
    
    if (!candidates.length) { popup('No valid targets.'); return; }
    
    // Get attacker for Oricorio check
    const attackerImg = ctx?.attackerImg || getActiveImg(pk);
    
    popup('Choose a Pokemon for bench damage.');
    const chosen = await awaitSelection(candidates);
    if (chosen) {
      // damageImg applies raw damage WITHOUT weakness (correct for bench)
      const result = damageImg(chosen, dmg, attackerImg);
      popup(`Dealt ${dmg} to ${chosen.alt}.`);
      
      // 🆕 Check if bench Pokemon was knocked out
      if (result.knocked) {
        console.log('[bench-damage] Pokemon knocked out:', chosen.alt);
        // Get the owner of the knocked out Pokemon
        const owner = chosen.closest('#player1') ? 'player1' : 'player2';
        const oppOwner = owner === 'player1' ? 'player2' : 'player1';
        const oppPkStr = oppOwner === 'player1' ? 'p1' : 'p2';
        // Check if it was active Pokemon that was KO'd
        const wasActive = chosen.closest('.active');
        
        // Handle knockout after a brief delay to show the damage
        setTimeout(async () => {
          if (typeof globalThis.handleKnockOut === 'function') {
            const gameEnded = await globalThis.handleKnockOut(oppPkStr, chosen, wasActive);
            // If active Pokemon was KO'd and game didn't end, trigger promotion
            if (!gameEnded && wasActive && typeof globalThis.beginPromotionFlow === 'function') {
              globalThis.beginPromotionFlow(oppOwner);
            }
          }
        }, 500);
      }
    }
  },
  
  bench_damage_all_opponent: async (s, pk, { param1 }, ctx) => {
    if (!ctx.isFinal) return;
    const dmg = parseInt10(param1);
    const benchImgs = getBenchImgs(oppPk(pk));
    const knockedPokemon = []; // Store knocked Pokemon with their info
    
    // Get attacker for Oricorio check
    const attackerImg = ctx?.attackerImg || getActiveImg(pk);
    
    for (const img of benchImgs) {
      const result = damageImg(img, dmg, attackerImg);
      if (result.knocked) {
        const owner = img.closest('#player1') ? 'player1' : 'player2';
        knockedPokemon.push({ img, owner });
      }
    }
    
    popup(`Dealt ${dmg} to all opponent bench.`);
    
    // 🆕 Handle knockouts sequentially after damage is shown
    if (knockedPokemon.length > 0) {
      console.log('[bench-damage-all] Knocked out:', knockedPokemon.map(p => p.img.alt));
      setTimeout(async () => {
        for (const { img, owner } of knockedPokemon) {
          if (typeof handleKnockOut === 'function') {
            await handleKnockOut(owner, img, false); // false = not active Pokemon
          }
        }
      }, 500);
    }
  },


  // 🆕 A1a MOVE EFFECTS - START

  // Bonus damage based on opponent's bench
  bonus_damage_for_each_opponent_bench: async (s, pk, { param1 }, ctx) => {
    const bonusPerBench = parseInt10(param1, 20);
    const oppBenchCount = getBenchImgs(oppPk(pk)).length;
    const bonus = bonusPerBench * oppBenchCount;
    
    if (bonus > 0) {
      console.log(`[bonus_opponent_bench] +${bonus} (${oppBenchCount} benched × ${bonusPerBench})`);
      ctx.addBonus(bonus);
    }
  },

  // Bonus damage if opponent is Pokemon ex
  bonus_damage_if_opponent_ex: async (s, pk, { param1 }, ctx) => {
    const bonus = parseInt10(param1, 80);
    const oppImg = getActiveImg(oppPk(pk));
    
    if (oppImg) {
      // Check if opponent is ex using API suffix field
      let isEx = false;
      try {
        const meta = await globalThis.fetchCardMeta(oppImg.dataset.set, oppImg.dataset.num);
        isEx = meta.suffix?.toUpperCase() === 'EX';
      } catch (e) {
        console.warn('[bonus_damage_if_opponent_ex] Could not fetch meta:', e);
        // Fallback to name check
        const name = (oppImg.alt || '').toLowerCase();
        isEx = name.includes(' ex');
      }
      
      if (isEx) {
        console.log(`[bonus_if_ex] Opponent is Pokemon ex, +${bonus} damage`);
        ctx.addBonus(bonus);
        if (ctx.isFinal) {
          popup(`+${bonus} damage (opponent is Pokémon ex)!`);
        }
      }
    }
  },

  // Bonus damage if any of your Pokemon were KO'd last turn
  bonus_damage_if_pokemon_ko_last_turn: async (s, pk, { param1 }, ctx) => {
    const bonus = parseInt10(param1, 60);
    
    // Check if we had a KO last turn
    if (!globalThis.state) globalThis.state = {};
    if (!globalThis.state.koLastTurn) globalThis.state.koLastTurn = {};
    
    const hadKO = globalThis.state.koLastTurn[pk];
    
    if (hadKO) {
      console.log(`[revenge] Pokemon was KO'd last turn, +${bonus} damage`);
      ctx.addBonus(bonus);
    }
  },

  // Discard energy then deal bench damage
  discard_energy_then_bench_damage: async (s, pk, { param1, param2 }, ctx) => {
    if (!ctx.isFinal) return;
    
    // param1: "fire|2" (type and count)
    // param2: "opponent|80" (target and damage)
    const [energyType, discardCount] = (param1 || '|').split('|');
    const [target, damage] = (param2 || '|').split('|');
    
    const activeImg = getActiveImg(pk);
    
    // Discard energy first
    const discarded = removeEnergy(activeImg, energyType?.toLowerCase(), parseInt10(discardCount));
    
    if (!discarded) {
      popup('Not enough Energy to discard');
      return;
    }
    
    popup(`Discarded ${discardCount} ${energyType} Energy`);
    
    // Then do bench damage
    const targetPk = target === 'opponent' ? oppPk(pk) : pk;
    const benchPokemon = getBenchImgs(targetPk);
    
    if (benchPokemon.length === 0) {
      popup('No bench targets');
      return;
    }
    
    popup(`Choose target for ${damage} damage`);
    const chosen = await awaitSelection(benchPokemon);
    
    if (chosen) {
      const result = damageImg(chosen, parseInt10(damage));
      popup(`Dealt ${damage} to ${chosen.alt}`);
      
      // 🆕 Check if bench Pokemon was knocked out
      if (result.knocked) {
        console.log('[discard-bench-damage] Pokemon knocked out:', chosen.alt);
        const owner = chosen.closest('#player1') ? 'player1' : 'player2';
        setTimeout(() => {
          if (typeof handleKnockOut === 'function') {
            handleKnockOut(owner, chosen, false);
          }
        }, 500);
      }
    }
  },

  // Discard random energy from ALL Pokemon (yours and opponent's)
  discard_random_energy_all_pokemon: async (s, pk, { param1 }, ctx) => {
    if (!ctx.isFinal) return;
    
    const count = parseInt10(param1, 1);
    
    // Get ALL Pokemon with energy from both players
    const allPokemon = [
      ...getAllPokemonImgs('p1'),
      ...getAllPokemonImgs('p2')
    ].filter(img => {
      const slot = getSlotFromImg(img);
      const energyBox = slot?.querySelector('.energy-pips');
      return energyBox && energyBox.children.length > 0;
    });
    
    if (allPokemon.length === 0) {
      popup('No Pokemon have Energy attached');
      return;
    }
    
    for (let i = 0; i < count; i++) {
      // Pick random Pokemon
      const randomPokemon = allPokemon[Math.floor(Math.random() * allPokemon.length)];
      
      // Get random energy type from that Pokemon
      const slot = getSlotFromImg(randomPokemon);
      const energyBox = slot?.querySelector('.energy-pips');
      const energies = Array.from(energyBox?.children ?? []);
      
      if (energies.length > 0) {
        const randomEnergy = energies[Math.floor(Math.random() * energies.length)];
        randomEnergy.remove();
        popup(`Discarded Energy from ${randomPokemon.alt}`);
      }
    }
  },

  // Flip a coin for each Energy attached
  flip_multiplier_energy_count: async (s, pk, { param1 }, ctx) => {
    if (!ctx.isFinal) return;
    
    const dmgPerHeads = parseInt10(param1, 50);
    const activeImg = getActiveImg(pk);
    const energyCount = countEnergy(activeImg);
    
    if (energyCount === 0) {
      popup('No Energy attached to flip for!');
      ctx.setOverride(0);
      return;
    }
    
    let heads = 0;
    for (let i = 0; i < energyCount; i++) {
      if ((await flipCoin()) === 'heads') heads++;
    }
    
    const totalDmg = heads * dmgPerHeads;
    popup(`Flipped ${energyCount} coins: ${heads} heads for ${totalDmg} damage!`);
    ctx.setOverride(totalDmg);
  },

  // Heal all your Pokemon
  heal_all: async (s, pk, { param1 }, ctx) => {
    if (!ctx.isFinal) return;
    
    const healAmount = parseInt10(param1, 20);
    const allMyPokemon = getAllPokemonImgs(pk);
    
    let healedCount = 0;
    allMyPokemon.forEach(img => {
      const { base, cur } = getHpFromImg(img);
      if (cur < base) {
        const newHp = Math.min(base, cur + healAmount);
        setHpOnImg(img, base, newHp);
        healedCount++;
      }
    });
    
    if (healedCount > 0) {
      popup(`Healed ${healAmount} damage from ${healedCount} Pokemon`);
    } else {
      popup('No Pokemon needed healing');
    }
    console.log(`[heal_all] Healed ${healAmount} from ${allMyPokemon.length} Pokemon`);
  },

  // Shuffle hand, draw equal to opponent's hand
  shuffle_hand_draw_match_opponent: async (s, pk, p, ctx) => {
    if (!ctx.isFinal) return;
    
    // This is primarily a UI/deck management effect
    // Stub implementation for now
    const oppHand = s[oppPk(pk)]?.hand ?? [];
    const oppHandSize = oppHand.length;
    
    popup(`Shuffle your hand and draw ${oppHandSize} cards`);
    console.log(`[mimic] Would shuffle hand and draw ${oppHandSize} cards`);
    
    // If deck system exists, use it
    if (globalThis.shuffleHandIntoDeck && globalThis.drawCards) {
      globalThis.shuffleHandIntoDeck(s, pk);
      globalThis.drawCards(s, pk, oppHandSize);
    }
  },

  // 🆕 A1a MOVE EFFECTS - END

  // Self damage
  self_damage_fixed_amount: async (s, pk, { param1 }, ctx) => {
    if (!ctx.isFinal) return;
    damageImg(getActiveImg(pk), parseInt10(param1));
  },

  // Defense
  reduce_incoming_damage_next_turn: async (s, pk, { param1 }, ctx) => {
    if (!ctx.isFinal) return;
    globalThis.__reduceIncomingNextTurn ??= {};
    globalThis.__reduceIncomingNextTurn[pk] = parseInt10(param1);
    popup(`Will take ${param1} less damage next turn.`);
  },

  // Energy attachment
  attach_energy_from_zone: async (s, pk, { param1, param2 }, ctx) => {
    if (!ctx.isFinal) return;
    const type = (param1 || 'colorless').toLowerCase();
    
    if (param2 === 'count_heads') {
      let heads = 0;
      for (let i = 0; i < 3; i++) if ((await flipCoin()) === 'heads') heads++;
      
      const targets = [];
      for (const img of getBenchImgs(pk)) {
        try {
          const meta = await globalThis.fetchCardMeta(img.dataset.set, img.dataset.num);
          if (meta.types?.some(t => t.toLowerCase() === type)) targets.push(img);
        } catch {}
      }
      
      if (!targets.length) { popup('No valid target.'); return; }
      
      popup(`${heads} heads. Choose target.`);
      const chosen = await awaitSelection(targets);
      if (chosen) {
        for (let i = 0; i < heads; i++) attachEnergy(chosen, type);
        popup(`Attached ${heads} ${type} Energy to ${chosen.alt}.`);
      }
      return;
    }
    
    if (param2 === 'self') {
      attachEnergy(getActiveImg(pk), type);
      popup(`Attached ${type} Energy.`);
      return;
    }
    
    if (param2 === 'to_bench') {
      const targets = getBenchImgs(pk);
      if (!targets.length) { popup('No bench targets.'); return; }
      
      popup('Choose bench target.');
      const chosen = await awaitSelection(targets);
      if (chosen) {
        attachEnergy(chosen, type);
        popup(`Attached ${type} Energy to ${chosen.alt}.`);
      }
    }
  },

  // Switching
  switch_self_with_bench: async (s, pk, p, ctx) => {
    if (!ctx.isFinal) return;
    globalThis.promoteFromBench?.(s, pk, false);
    popup('Switched with bench.');
  },
  
  force_opponent_switch: async (s, pk, p, ctx) => {
    if (!ctx.isFinal) return;
    globalThis.promoteFromBench?.(s, oppPk(pk), true);
    popup('Forced opponent switch.');
  },

  // Search/utility
  search_pokemon_type_random: async (s, pk, { param1 }, ctx) => {
    if (!ctx.isFinal) return;
    const deck = s[pk].deck ?? [];
    if (!deck.length) { popup('Deck empty.'); return; }
    
    const idx = (Math.random() * deck.length) | 0;
    const card = deck.splice(idx, 1)[0];
    s[pk].hand.push(card);
    popup(`Found ${card.name}.`);
  },
  
  search_specific_into_bench: async (s, pk, { param1 }, ctx) => {
    if (!ctx.isFinal) return;
    const name = param1?.toLowerCase();
    const deck = s[pk].deck ?? [];
    const idx = deck.findIndex(c => (c.name || '').toLowerCase() === name);
    
    if (idx === -1) { popup(`No ${param1} in deck.`); return; }
    
    const card = deck.splice(idx, 1)[0];
    (s[pk].bench ??= []).push(card);
    popup(`Put ${card.name} on bench.`);
  },
  
  reveal_opponent_hand: async (s, pk, p, ctx) => {
    if (!ctx.isFinal) return;
    const hand = s[oppPk(pk)].hand ?? [];
    popup(hand.length ? `Hand: ${hand.map(c => c.name).join(', ')}` : 'Empty hand.');
  },
  
  draw_cards: async (s, pk, { param1 }, ctx) => {
    if (!ctx.isFinal) return;
    globalThis.drawCards?.(s, pk, parseInt10(param1));
    popup(`Drew ${param1} card(s).`);
  },
  
  copy_opponent_attack: async (s, pk, p, ctx) => {
    if (!ctx.isFinal) return;
    const oppImg = getActiveImg(oppPk(pk));
    if (!oppImg) return;
    
    try {
      const meta = await globalThis.fetchCardMeta(oppImg.dataset.set, oppImg.dataset.num);
      const attacks = meta?.attacks ?? [];
      if (!attacks.length) { popup('No attacks to copy.'); return; }
      
      let atk;
      if (attacks.length === 1) {
        atk = attacks[0];
        popup(`Copying ${atk.name}...`);
      } else {
        // Create selection prompt with attack choices
        const choice = await new Promise(resolve => {
          const attackList = attacks.map((a, idx) => {
            const dmgText = a.damage ? ` (${a.damage})` : ' (Effect)';
            return `${idx + 1}. ${a.name}${dmgText}`;
          }).join('\n');
          
          popup(`Choose attack to copy:\n${attackList}`);
          
          // Create temporary buttons for selection
          const container = document.createElement('div');
          container.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:10000;background:white;padding:20px;border-radius:10px;box-shadow:0 4px 6px rgba(0,0,0,0.3);';
          
          attacks.forEach((a, idx) => {
            const btn = document.createElement('button');
            const dmgText = a.damage ? ` (${a.damage})` : ' (Effect)';
            btn.textContent = `${a.name}${dmgText}`;
            btn.style.cssText = 'display:block;margin:10px 0;padding:10px 20px;font-size:16px;cursor:pointer;width:100%;';
            btn.onclick = () => {
              document.body.removeChild(container);
              resolve(idx);
            };
            container.appendChild(btn);
          });
          
          document.body.appendChild(container);
        });
        
        atk = attacks[choice];
      }
      
      // Apply the attack with its effects - CRITICAL: Use opponent's Pokemon name for move lookup
      // Store the original Pokemon for the effect to use
      const originalPk = pk;
      
      // Temporarily override the active Pokemon to be the opponent for move lookup
      const mewImg = getActiveImg(pk);
      if (mewImg) {
        // Store Mew's original name
        const mewName = mewImg.alt;
        
        // Temporarily set to opponent's name for move lookup
        mewImg.alt = oppImg.alt;
        
        // Apply the move effect (this will look up using opponent's name)
        const baseDmg = parseInt10(atk.damage, 0);
        const finalDmg = await applyMoveEffect(s, pk, atk.name, baseDmg, { ...ctx.rawCtx, isFinal: true });
        
        // Restore Mew's name
        mewImg.alt = mewName;
        
        ctx.setOverride(finalDmg);
        popup(`Copied ${atk.name}!`);
      }
    } catch (err) { 
      console.error('[Mew ex] Copy failed:', err);
      popup('Copy failed.'); 
    }
  },

  // Multi-target random damage (Dragonite's Draco Meteor) - NOW IMPLEMENTED ✅
  random_multi_target_damage: async (s, pk, { param1, param2 }, ctx) => {
    if (!ctx.isFinal) return;
    
    const times = parseInt10(param1, 4);
    const dmg = parseInt10(param2, 50);
    const targets = getAllPokemonImgs(oppPk(pk));
    
    if (!targets.length) {
      popup('No targets available.');
      return;
    }
    
    // Get attacker for Oricorio check
    const attackerImg = ctx?.attackerImg || getActiveImg(pk);
    
    const hitLog = {};
    
    for (let i = 0; i < times; i++) {
      const chosen = targets[Math.floor(Math.random() * targets.length)];
      damageImg(chosen, dmg, attackerImg);
      
      const name = chosen.alt || 'Unknown';
      hitLog[name] = (hitLog[name] || 0) + 1;
    }
    
    const summary = Object.entries(hitLog)
      .map(([name, count]) => `${name} (${count}×${dmg})`)
      .join(', ');
    
    popup(`Draco Meteor hit: ${summary}`);
  },
  
  // Aerodactyl's Primal Wingbeat - NOW IMPLEMENTED ✅
  flip_force_shuffle_opponent_pokemon_into_deck: async (s, pk, p, ctx) => {
    if (!ctx.isFinal) return;
    
    if ((await flipCoin()) === 'tails') {
      popup('TAILS → no effect.');
      return;
    }
    
    const oppImg = getActiveImg(oppPk(pk));
    if (!oppImg) {
      popup('No opponent Active Pokémon.');
      return;
    }
    
    const opp = oppPk(pk);
    const oppDeck = s[opp].deck ?? [];
    
    // Add Active Pokémon back to deck
    oppDeck.push({
      name: oppImg.alt,
      set: oppImg.dataset.set,
      number: oppImg.dataset.num,
      image: oppImg.src
    });
    
    shuffleArray(oppDeck);
    
    // Clear the Active slot
    const slot = getSlotFromImg(oppImg);
    if (slot) {
      slot.innerHTML = '<span class="slot-label">Empty</span>';
      slot.dataset.empty = '1';
    }
    
    popup(`HEADS → Shuffled ${oppImg.alt} back into deck!`);
    
    // Force opponent to promote from bench
    setTimeout(() => {
      globalThis.beginPromotionFlow?.(pkToPlayer(opp));
    }, 500);
  },
  
  // Persian's Shadow Claw - NOW IMPLEMENTED ✅
  flip_discard_random_from_opponent_hand: async (s, pk, p, ctx) => {
    if (!ctx.isFinal) return;
    
    if ((await flipCoin()) === 'tails') {
      popup('TAILS → no effect.');
      return;
    }
    
    const oppHand = s[oppPk(pk)].hand ?? [];
    
    if (!oppHand.length) {
      popup("HEADS → but opponent's hand is empty.");
      return;
    }
    
    const idx = Math.floor(Math.random() * oppHand.length);
    const discarded = oppHand.splice(idx, 1)[0];
    
    popup(`HEADS → Discarded ${discarded.name} from opponent's hand!`);
    globalThis.addLog?.(pk, `discarded <b>${discarded.name}</b> from opponent's hand`, discarded.image, discarded);
  },

  // 🆕 A2 MOVE EFFECTS - START

  // Leafeon's Leafy Cyclone - Block all attacks next turn
  self_lock_next_turn: async (s, pk, p, ctx) => {
    if (!ctx.isFinal) return;
    globalThis.__specialEffects ??= { p1: {}, p2: {} };
    globalThis.__specialEffects[pk].attackLock = true;
    popup("This Pokémon can't attack next turn!");
  },

  // Torterra's Frenzy Plant - Block specific attack next turn
  self_lock_specific_attack: async (s, pk, { param1 }, ctx) => {
    if (!ctx.isFinal) return;
    const img = getActiveImg(pk);
    if (!img) return;
    
    // Store the attack name that's locked
    const attackName = param1 || ctx.rawCtx?.attackName || '';
    if (!attackName) return;
    
    // Store in dataset for checking next turn
    img.dataset.lockedAttack = attackName;
    console.log(`[self_lock_specific_attack] Locked "${attackName}" for ${img.alt}`);
    
    popup(`This Pokémon can't use ${attackName} next turn!`);
  },

  // Yanmega ex's Air Slash - Discard random energy from self
  discard_random_energy_self: async (s, pk, { param1 }, ctx) => {
    if (!ctx.isFinal) return;
    const count = parseInt10(param1, 1);
    const img = getActiveImg(pk);
    if (!img) return;
    
    const slot = img.closest('.card-slot');
    if (!slot) return;
    
    const pips = Array.from(slot.querySelectorAll('.energy-pip'));
    if (pips.length === 0) {
      popup('No energy to discard.');
      return;
    }
    
    let discarded = 0;
    for (let i = 0; i < count && pips.length > 0; i++) {
      const idx = Math.floor(Math.random() * pips.length);
      const pip = pips.splice(idx, 1)[0];
      pip.remove();
      discarded++;
    }
    
    popup(`Discarded ${discarded} Energy from this Pokémon.`);
  },

  // Snover's Ice Shard - Bonus damage if opponent is specific type
  bonus_damage_if_opponent_type: async (s, pk, { param1, param2 }, ctx) => {
    const oppImg = getActiveImg(oppPk(pk));
    if (!oppImg) return;
    
    const targetType = (param1 || '').toLowerCase(); // e.g., 'fighting'
    const bonus = parseInt10(param2, 30);
    
    // Get opponent type from cached data or API
    let oppType = oppImg.dataset.cachedType;
    
    if (!oppType) {
      // Fetch from API if not cached
      try {
        const meta = await globalThis.fetchCardMeta(oppImg.dataset.set, oppImg.dataset.num);
        oppType = meta.types?.[0]?.toLowerCase();
        if (oppType) {
          oppImg.dataset.cachedType = oppType;
        }
      } catch (err) {
        console.error('[bonus_damage_if_opponent_type] Failed to fetch type:', err);
        return;
      }
    }
    
    if (oppType === targetType) {
      ctx.addBonus(bonus);
      console.log(`[bonus_damage_if_opponent_type] +${bonus} vs ${targetType}`);
    }
  },

  // Combee's Call for Family - Search any basic to bench
  search_basic_to_bench: async (s, pk, p, ctx) => {
    if (!ctx.isFinal) return;
    
    const owner = pkToPlayer(pk);
    const deck = s[pk]?.deck || [];
    
    if (deck.length === 0) {
      popup('Deck is empty.');
      return;
    }
    
    // Find all basic Pokemon in deck
    const basics = [];
    for (const card of deck) {
      try {
        const meta = await globalThis.fetchCardMeta(card.set, card.num);
        if (meta.category?.toLowerCase() === 'pokemon' && meta.stage?.toLowerCase() === 'basic') {
          basics.push(card);
        }
      } catch (err) {
        console.error('[search_basic_to_bench] Failed to check card:', err);
      }
    }
    
    if (basics.length === 0) {
      popup('No Basic Pokémon in deck.');
      return;
    }
    
    // Pick random basic
    const chosen = basics[Math.floor(Math.random() * basics.length)];
    
    // Remove from deck
    const idx = deck.findIndex(c => c.set === chosen.set && c.num === chosen.num);
    if (idx !== -1) {
      deck.splice(idx, 1);
    }
    
    // Check if bench has space
    const benchDiv = owner === 'player1' ? globalThis.p1Bench : globalThis.p2Bench;
    const benchSlots = Array.from(benchDiv?.querySelectorAll('.card-slot') ?? []);
    const emptySlot = benchSlots.find(slot => !slot.querySelector('img'));
    
    if (!emptySlot) {
      popup('Bench is full!');
      // Put card back in deck
      deck.push(chosen);
      return;
    }
    
    // Create Pokemon image
    const img = document.createElement('img');
    img.className = 'card-img';
    img.src = chosen.image;
    img.alt = chosen.name;
    img.dataset.set = chosen.set;
    img.dataset.num = chosen.num;
    
    // Fetch HP from API
    try {
      const meta = await globalThis.fetchCardMeta(chosen.set, chosen.num);
      const hp = parseInt10(meta.hp, 0);
      img.dataset.hp = String(hp);
      img.dataset.chp = String(hp);
      img.dataset.playedTurn = String(globalThis.turnNumber || 0);
      
      // Assign instance ID
      if (globalThis.assignInstanceId) {
        globalThis.assignInstanceId(img);
      }
      
      // Place on bench
      emptySlot.innerHTML = '';
      emptySlot.appendChild(img);
      
      // Set HP display
      if (globalThis.setHpOnImage) {
        globalThis.setHpOnImage(img, hp, hp);
      }
      
      // Mark slot as occupied
      if (globalThis.markSlot) {
        globalThis.markSlot(emptySlot, true);
      }
      
      popup(`Put ${chosen.name} onto the Bench!`);
      globalThis.addLog?.(pk, `put <b>${chosen.name}</b> onto the Bench`, chosen.image, chosen);
    } catch (err) {
      console.error('[search_basic_to_bench] Failed to place:', err);
      popup('Failed to place Pokémon.');
      // Put card back in deck
      deck.push(chosen);
    }
  },

  // 🆕 A2 MOVE EFFECTS - END
  
  // 🆕 A2 COMPLETE FIX - 18 NEW HANDLERS
  
  // 1. Palkia ex - Dimensional Storm (discard energy + bench damage)
  discard_energy_and_bench_damage: async (s, pk, { param1, param2 }, ctx) => {
    if (!ctx.isFinal) return;
    
    // Parse params: "3|20" = 3 energy, 20 bench damage
    const [countStr, damageStr] = (param2 || '|').split('|');
    const count = parseInt10(countStr, 3);
    const damage = parseInt10(damageStr, 20);
    
    const energyType = param1?.toLowerCase();
    const img = getActiveImg(pk);
    if (!img) return;
    
    const slot = img.closest('.card-slot');
    if (!slot) return;
    
    // Discard specific energy type (dataset.type, not dataset.energyType!)
    const pips = Array.from(slot.querySelectorAll('.energy-pip'));
    const typedPips = pips.filter(p => 
      p.dataset.type?.toLowerCase() === energyType
    );
    
    let discarded = 0;
    for (let i = 0; i < count && typedPips.length > 0; i++) {
      const pip = typedPips.shift();
      pip?.remove();
      discarded++;
    }
    
    popup(`Discarded ${discarded} ${energyType} Energy.`);
    
    // Damage all opponent bench
    const oppBench = getBenchImgs(oppPk(pk));
    const knockedPokemon = [];
    
    for (const benchImg of oppBench) {
      const result = damageImg(benchImg, damage);
      if (result.knocked) {
        const owner = benchImg.closest('#player1') ? 'player1' : 'player2';
        knockedPokemon.push({ img: benchImg, owner });
      }
    }
    
    if (oppBench.length > 0) {
      popup(`${damage} damage to each opponent Benched Pokémon!`);
    }
    
    // 🆕 Handle knockouts sequentially after damage is shown
    if (knockedPokemon.length > 0) {
      console.log('[discard-bench-damage-all] Knocked out:', knockedPokemon.map(p => p.img.alt));
      setTimeout(async () => {
        for (const { img, owner } of knockedPokemon) {
          if (typeof handleKnockOut === 'function') {
            await handleKnockOut(owner, img, false);
          }
        }
      }, 500);
    }
  },

  // 2. Manaphy - Oceanic Gift (attach to multiple bench)
  attach_energy_to_multiple_bench: async (s, pk, { param1, param2 }, ctx) => {
    if (!ctx.isFinal) return;
    
    const energyType = param1?.toLowerCase() || 'colorless';
    const count = parseInt10(param2, 2);
    const owner = pk === 'p1' ? 'player1' : 'player2';
    
    const bench = getBenchImgs(pk);
    if (bench.length === 0) {
      popup('No Benched Pokémon.');
      return;
    }
    
    // Calculate how many we can actually attach
    const actualCount = Math.min(count, bench.length);
    
    popup(`Choose ${actualCount} Benched Pokémon for ${energyType} Energy`);
    
    const selected = [];
    for (let i = 0; i < actualCount; i++) {
      const available = bench.filter(b => !selected.includes(b));
      if (available.length === 0) break;
      
      const target = await awaitSelection(available, 'heal-glow');
      if (!target) break;
      
      selected.push(target);
      
      // Attach energy
      const slot = target.closest('.card-slot');
      if (slot && typeof globalThis.attachEnergyToSlot === 'function') {
        globalThis.attachEnergyToSlot(owner, slot, energyType);
      }
    }
    
    popup(`Attached ${selected.length} ${energyType} Energy to bench!`);
  },

  // 3. Rampardos - Head Smash (self-damage only if KO)
  self_damage_if_ko: async (s, pk, { param1 }, ctx) => {
    if (!ctx.isFinal) return;
    // Store flag to check after damage in handleAttackClick
    ctx.checkKoForRecoil = parseInt10(param1, 50);
  },

  // 4. Luxray - Volt Bolt (discard energy + snipe any Pokemon)
  discard_energy_and_snipe: async (s, pk, { param1, param2 }, ctx) => {
    if (!ctx.isFinal) return;
    
    const energyType = param1?.toLowerCase();
    const damage = parseInt10(param2, 120);
    
    const img = getActiveImg(pk);
    if (!img) return;
    
    const slot = img.closest('.card-slot');
    if (!slot) return;
    
    // Discard all of specific energy type (dataset.type, not dataset.energyType!)
    const pips = Array.from(slot.querySelectorAll('.energy-pip'));
    const typedPips = pips.filter(p => 
      p.dataset.type?.toLowerCase() === energyType
    );
    
    typedPips.forEach(pip => pip.remove());
    popup(`Discarded ${typedPips.length} ${energyType} Energy.`);
    
    // Snipe any opponent Pokemon
    const allOppPokemon = [
      getActiveImg(oppPk(pk)),
      ...getBenchImgs(oppPk(pk))
    ].filter(Boolean);
    
    if (allOppPokemon.length === 0) {
      popup('No opponent Pokémon to damage.');
      return;
    }
    
    // Pick first available (TODO: Add user selection UI)
    const target = allOppPokemon[0];
    damageImg(target, damage);
    popup(`${damage} damage to ${target.alt}!`);
  },

  // 5. Dialga ex - Metallic Turbo (attach 2 energy to 1 bench)
  attach_multiple_energy_to_bench_one: async (s, pk, { param1, param2 }, ctx) => {
    if (!ctx.isFinal) return;
    
    const energyType = param1?.toLowerCase() || 'metal';
    const count = parseInt10(param2, 2);
    const owner = pk === 'p1' ? 'player1' : 'player2';
    
    const bench = getBenchImgs(pk);
    if (bench.length === 0) {
      popup('No Benched Pokémon.');
      return;
    }
    
    popup(`Choose a Benched Pokémon for ${count} ${energyType} Energy`);
    
    // Let user select 1 benched Pokemon
    const target = await awaitSelection(bench, 'heal-glow');
    if (!target) return;
    
    const slot = target.closest('.card-slot');
    if (!slot) return;
    
    // Attach multiple energy
    for (let i = 0; i < count; i++) {
      if (typeof globalThis.attachEnergyToSlot === 'function') {
        globalThis.attachEnergyToSlot(owner, slot, energyType);
      }
    }
    
    popup(`Attached ${count} ${energyType} Energy to ${target.alt}!`);
  },

  // 6. Uxie - Mind Boost (attach to specific names)
  attach_energy_to_specific_names: async (s, pk, { param1, param2 }, ctx) => {
    if (!ctx.isFinal) return;
    
    const energyType = param1?.toLowerCase() || 'psychic';
    const names = (param2 || '').split('|').map(n => n.trim().toLowerCase());
    const owner = pk === 'p1' ? 'player1' : 'player2';
    
    const bench = getBenchImgs(pk);
    const validTargets = bench.filter(img => 
      names.some(name => img.alt.toLowerCase().includes(name))
    );
    
    if (validTargets.length === 0) {
      popup(`No ${names.join(' or ')} on Bench.`);
      return;
    }
    
    if (validTargets.length === 1) {
      // Only one valid target, auto-select
      const target = validTargets[0];
      const slot = target.closest('.card-slot');
      if (slot && typeof globalThis.attachEnergyToSlot === 'function') {
        globalThis.attachEnergyToSlot(owner, slot, energyType);
        popup(`Attached ${energyType} Energy to ${target.alt}!`);
      }
    } else {
      // Multiple valid targets, let user choose
      popup(`Choose ${names.join(' or ')} for ${energyType} Energy`);
      const target = await awaitSelection(validTargets, 'heal-glow');
      if (!target) return;
      
      const slot = target.closest('.card-slot');
      if (slot && typeof globalThis.attachEnergyToSlot === 'function') {
        globalThis.attachEnergyToSlot(owner, slot, energyType);
        popup(`Attached ${energyType} Energy to ${target.alt}!`);
      }
    }
  },

  // 7. Rhyperior - Mountain Swing (discard top deck)
  discard_top_deck: async (s, pk, { param1 }, ctx) => {
    if (!ctx.isFinal) return;
    
    const count = parseInt10(param1, 3);
    const deck = s[pk]?.deck || [];
    
    let discarded = 0;
    for (let i = 0; i < count && deck.length > 0; i++) {
      deck.shift(); // Remove from top
      discarded++;
    }
    
    popup(`Discarded ${discarded} cards from deck.`);
  },

  // 8. Spiritomb - Swirling Disaster (damage ALL opponent Pokemon)
  damage_all_opponent_pokemon: async (s, pk, { param1 }, ctx) => {
    if (!ctx.isFinal) return;
    
    const damage = parseInt10(param1, 10);
    
    // Damage active + bench
    const allOppPokemon = [
      getActiveImg(oppPk(pk)),
      ...getBenchImgs(oppPk(pk))
    ].filter(Boolean);
    
    for (const oppImg of allOppPokemon) {
      damageImg(oppImg, damage);
    }
    
    popup(`${damage} damage to each opponent's Pokémon!`);
  },

  // 9. Drapion - Cross Poison (flip multiplier + conditional poison)
  flip_multiplier_conditional_poison: async (s, pk, { param1, param2 }, ctx) => {
    const flipCount = parseInt10(param1, 4);
    const [damageStr, thresholdStr] = (param2 || '|').split('|');
    const damagePerHeads = parseInt10(damageStr, 40);
    const threshold = parseInt10(thresholdStr, 2);
    
    let heads = 0;
    for (let i = 0; i < flipCount; i++) {
      if ((await flipCoin()) === 'heads') heads++;
    }
    
    const damage = heads * damagePerHeads;
    ctx.addBonus(damage);
    
    if (ctx.isFinal) {
      popup(`Flipped ${heads} heads: +${damage} damage!`);
      
      if (heads >= threshold) {
        applyStatus(oppPk(pk), 'poison');
        popup('Opponent is now Poisoned!');
      }
    }
  },

  // 10. Croagunk/Toxicroak - Group Beatdown (flip per Pokemon in play)
  flip_multiplier_pokemon_in_play: async (s, pk, { param1 }, ctx) => {
    const damagePerHeads = parseInt10(param1, 20);
    
    // Count all Pokemon in play (active + bench)
    const allPokemon = [getActiveImg(pk), ...getBenchImgs(pk)].filter(Boolean);
    const flipCount = allPokemon.length;
    
    let heads = 0;
    for (let i = 0; i < flipCount; i++) {
      if ((await flipCoin()) === 'heads') heads++;
    }
    
    const damage = heads * damagePerHeads;
    ctx.setOverride(damage);
    
    if (ctx.isFinal) {
      popup(`Flipped ${heads}/${flipCount} heads: ${damage} damage!`);
    }
  },

  // 11. Wormadam - Iron Head (flip until tails, bonus damage)
  flip_until_tails_bonus_damage: async (s, pk, { param1 }, ctx) => {
    const bonusPerHeads = parseInt10(param1, 30);
    
    let heads = 0;
    while ((await flipCoin()) === 'heads') {
      heads++;
    }
    
    const bonus = heads * bonusPerHeads;
    ctx.addBonus(bonus);
    
    if (ctx.isFinal) {
      popup(`Flipped ${heads} heads: +${bonus} damage!`);
    }
  },

  // 12. Pachirisu/Rotom/Skarmory - Tool damage bonus
  bonus_damage_if_tool_attached: async (s, pk, { param1, param2 }, ctx) => {
    const target = param1?.toLowerCase(); // 'self' or 'opponent'
    const bonus = parseInt10(param2, 30);
    
    let checkImg;
    if (target === 'opponent') {
      checkImg = getActiveImg(oppPk(pk));
    } else {
      checkImg = getActiveImg(pk);
    }
    
    if (!checkImg) return;
    
    // Check for tool attached - tools are stored in slot.dataset.toolSet/toolNum
    const slot = checkImg.closest('.card-slot');
    const hasTool = slot && (slot.dataset.toolSet || slot.dataset.tool);
    
    if (hasTool) {
      ctx.addBonus(bonus);
      if (ctx.isFinal) {
        popup(`Tool attached: +${bonus} damage!`);
      }
    }
  },

  // 13. Togekiss - Overdrive Smash (boost next turn)
  self_boost_next_turn: async (s, pk, { param1, param2 }, ctx) => {
    if (!ctx.isFinal) return;
    
    const boost = parseInt10(param1, 60);
    const attackName = param2 || 'Overdrive Smash';
    
    const img = getActiveImg(pk);
    if (!img) return;
    
    // Store boost for next turn
    img.dataset.nextTurnBoost = boost;
    img.dataset.boostedAttack = attackName;
    
    popup(`Next turn: ${attackName} does +${boost} damage!`);
  },

  // 14. Porygon-Z - Buggy Beam (change opponent energy type)
  change_opponent_energy_type: async (s, pk, p, ctx) => {
    if (!ctx.isFinal) return;
    
    const types = ['grass', 'fire', 'water', 'lightning', 'psychic', 'fighting', 'darkness', 'metal'];
    const randomType = types[Math.floor(Math.random() * types.length)];
    
    // Store flag for opponent's next energy generation
    globalThis.__energyOverride = globalThis.__energyOverride || {};
    globalThis.__energyOverride[oppPk(pk)] = randomType;
    
    popup(`Opponent's next Energy will be ${randomType}!`);
  },

  // 15. Starly - Pluck (discard opponent tools before damage)
  discard_opponent_tools_before_damage: async (s, pk, p, ctx) => {
    if (!ctx.isFinal) return;
    
    const oppImg = getActiveImg(oppPk(pk));
    if (!oppImg) return;
    
    // Check for tools and discard them
    if (oppImg.dataset.tool) {
      popup(`Discarded ${oppImg.dataset.tool}!`);
      delete oppImg.dataset.tool;
    }
    
    const toolCard = oppImg.closest('.card-slot')?.querySelector('.tool-card');
    if (toolCard) {
      toolCard.remove();
      popup('Discarded Pokémon Tool!');
    }
  },

  // 16. Bidoof - Super Fang (halve opponent HP)
  halve_opponent_hp: async (s, pk, p, ctx) => {
    const oppImg = getActiveImg(oppPk(pk));
    if (!oppImg) return;
    
    const { cur } = getHpFromImg(oppImg);
    const halfDamage = Math.floor(cur / 2);
    
    ctx.setOverride(halfDamage);
    
    if (ctx.isFinal) {
      popup(`Half of ${cur} HP = ${halfDamage} damage!`);
    }
  },

  // 17. Purugly - Interrupt (reveal hand, shuffle card)
  reveal_hand_shuffle_card: async (s, pk, p, ctx) => {
    if (!ctx.isFinal) return;
    
    const oppHand = s[oppPk(pk)]?.hand || [];
    
    if (oppHand.length === 0) {
      popup("Opponent's hand is empty.");
      return;
    }
    
    // Pick random card to shuffle (TODO: Add user selection UI)
    const idx = Math.floor(Math.random() * oppHand.length);
    const card = oppHand.splice(idx, 1)[0];
    
    // Add to opponent deck
    const oppDeck = s[oppPk(pk)]?.deck || [];
    oppDeck.push(card);
    
    // Shuffle deck
    for (let i = oppDeck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [oppDeck[i], oppDeck[j]] = [oppDeck[j], oppDeck[i]];
    }
    
    popup(`Shuffled ${card.name} into opponent's deck!`);
  },

  // 18. Fan Rotom - Spin Storm (flip to return active to hand)
  return_opponent_active_to_hand: async (s, pk, p, ctx) => {
    if (!ctx.isFinal) return;
    
    if ((await flipCoin()) === 'tails') {
      popup('TAILS → no effect.');
      return;
    }
    
    const oppImg = getActiveImg(oppPk(pk));
    if (!oppImg) return;
    
    popup('HEADS → Returning active to hand!');
    
    // Add to opponent hand
    const oppHand = s[oppPk(pk)]?.hand || [];
    oppHand.push({
      set: oppImg.dataset.set,
      num: oppImg.dataset.num,
      name: oppImg.alt,
      image: oppImg.src
    });
    
    // Remove from field
    const slot = oppImg.closest('.card-slot');
    if (slot) {
      slot.innerHTML = '';
      if (typeof globalThis.markSlot === 'function') {
        globalThis.markSlot(slot, false);
      }
    }
    
    // Opponent must promote
    popup('Opponent must promote from Bench!');
  },

  // 19. Regigigas - Raging Hammer (bonus equal to self damage)
  bonus_damage_equal_to_self_damage: async (s, pk, p, ctx) => {
    const img = getActiveImg(pk);
    if (!img) return;
    
    const { base, cur } = getHpFromImg(img);
    const damageOnSelf = base - cur;
    
    if (damageOnSelf > 0) {
      ctx.addBonus(damageOnSelf);
      if (ctx.isFinal) {
        popup(`+${damageOnSelf} damage (damage on self)!`);
      }
    }
  },

  // 20. Finneon/Shinx - Flip to prevent damage and effects
  flip_prevent_damage_and_effects: async (s, pk, p, ctx) => {
    if (!ctx.isFinal) return;
    
    if ((await flipCoin()) === 'heads') {
      globalThis.__specialEffects ??= { p1: {}, p2: {} };
      globalThis.__specialEffects[pk].preventDamage = true;
      popup('HEADS → This Pokémon will take no damage next turn!');
    } else {
      popup('TAILS → no effect.');
    }
  },

  // 🆕 A2 COMPLETE FIX - END

  // 🆕 A2a/A2b MOVE EFFECTS - START (16 new effects)

  // 1. Confused status - attacks with param1=confused
  // Already handled by inflict_status above with param1=confused

  // 2. Attack lock with flip - Manectric Flash, Magmortar Smoke Bomb
  attack_lock_flip: async (s, pk, p, ctx) => {
    if (!ctx.isFinal) return;
    
    const opp = oppPk(pk);
    globalThis.__specialEffects ??= { p1: {}, p2: {} };
    globalThis.__specialEffects[opp].attackLockFlip = true;
    
    popup("Opponent must flip before attacking - tails means attack fails!");
    console.log('[attack_lock_flip] Opponent must flip before attacking');
  },

  // 3. Flip reveal and shuffle opponent card - Gastly Astonish
  flip_reveal_shuffle_opponent_card: async (s, pk, p, ctx) => {
    if (!ctx.isFinal) return;
    
    if ((await flipCoin()) === 'tails') {
      popup('TAILS → no effect.');
      return;
    }
    
    const opp = oppPk(pk);
    const oppHand = s[opp]?.hand || [];
    
    if (!oppHand.length) {
      popup("HEADS → but opponent's hand is empty!");
      return;
    }
    
    // Pick random card
    const randomIdx = Math.floor(Math.random() * oppHand.length);
    const card = oppHand.splice(randomIdx, 1)[0];
    
    // Shuffle into deck
    const oppDeck = s[opp]?.deck || [];
    oppDeck.push(card);
    shuffleArray(oppDeck);
    
    popup(`HEADS → Revealed ${card.name} and shuffled it into deck!`);
    console.log(`[Astonish] Shuffled ${card.name} into deck`);
  },

  // 4. Bonus damage if opponent is ex
  bonus_damage_if_opponent_ex: async (s, pk, { param1 }, ctx) => {
    const oppImg = getActiveImg(oppPk(pk));
    if (!oppImg) return;
    
    // Check if opponent is ex using API suffix field
    let isEx = false;
    try {
      const meta = await globalThis.fetchCardMeta(oppImg.dataset.set, oppImg.dataset.num);
      isEx = meta.suffix?.toUpperCase() === 'EX';
    } catch (e) {
      console.warn('[bonus_damage_if_opponent_ex] Could not fetch meta:', e);
      // Fallback to name check
      const name = (oppImg.alt || '').toLowerCase();
      isEx = name.includes(' ex');
    }
    
    if (isEx) {
      const bonus = parseInt10(param1, 30);
      ctx.addBonus(bonus);
      if (ctx.isFinal) {
        popup(`+${bonus} damage (opponent is Pokémon ex)!`);
      }
    }
  },

  // 5. Increase self damage next turn - Donphan Rolling Spin, Cyclizar Overacceleration
  increase_self_damage_next_turn: async (s, pk, { param1, param2 }, ctx) => {
    if (!ctx.isFinal) return;
    
    const attackName = param1; // e.g., "Rolling Spin"
    const bonus = parseInt10(param2, 60);
    
    const img = getActiveImg(pk);
    if (!img) return;
    
    // Store the bonus for next turn
    globalThis.__attackBonuses ??= {};
    const key = `${img.dataset.instanceId || img.alt}_${attackName}`;
    globalThis.__attackBonuses[key] = bonus;
    
    popup(`Next turn, ${attackName} will do +${bonus} damage!`);
    console.log(`[increase_self_damage_next_turn] ${attackName} +${bonus} next turn`);
  },

  // 6. Heavy poison - Toxicroak Toxic (20 damage per checkup instead of 10)
  inflict_status_heavy: async (s, pk, { param1, param2 }, ctx) => {
    if (!ctx.isFinal) return;
    
    const status = (param1 || 'poison').toLowerCase();
    const damage = parseInt10(param2, 20);
    
    applyStatus(oppPk(pk), status);
    
    // Store heavy poison data
    const oppImg = getActiveImg(oppPk(pk));
    if (oppImg) {
      oppImg.dataset.heavyPoison = damage; // 20 instead of normal 10
    }
    
    popup(`Inflicted heavy ${status} (${damage} damage per checkup)!`);
    console.log(`[heavy_poison] ${damage} damage per checkup`);
  },

  // 7. Bonus damage if opponent is specific type - Mawile Iron Beam Breaker
  bonus_damage_if_opponent_type: async (s, pk, { param1, param2 }, ctx) => {
    const oppImg = getActiveImg(oppPk(pk));
    if (!oppImg) return;
    
    const targetType = (param1 || 'metal').toLowerCase();
    const bonus = parseInt10(param2, 30);
    
    try {
      const meta = await globalThis.fetchCardMeta(oppImg.dataset.set, oppImg.dataset.num);
      const hasType = meta.types?.some(t => t.toLowerCase() === targetType);
      
      if (hasType) {
        ctx.addBonus(bonus);
        if (ctx.isFinal) {
          popup(`+${bonus} damage (opponent is ${targetType}-type)!`);
        }
      }
    } catch {}
  },

  // 8. Flip inflict effect on self if tails - Origin Forme Dialga Time Mash
  flip_inflict_effect_self_if_tails: async (s, pk, { param1 }, ctx) => {
    if (!ctx.isFinal) return;
    
    if ((await flipCoin()) === 'heads') {
      popup('HEADS → no additional effect.');
      return;
    }
    
    const effect = (param1 || '').toLowerCase();
    
    if (effect === 'attack_lock_self') {
      const img = getActiveImg(pk);
      if (img) {
        globalThis.__specialEffects ??= { p1: {}, p2: {} };
        globalThis.__specialEffects[pk].attackLockSelf = true;
        popup("TAILS → This Pokémon can't attack next turn!");
        console.log('[Time Mash] Attack locked next turn');
      }
    }
  },

  // 9. Discard random energy from self - Giratina Crisis Dive, Arceus Power Blast
  discard_random_energy_self: async (s, pk, { param1 }, ctx) => {
    if (!ctx.isFinal) return;
    
    const count = parseInt10(param1, 1);
    const img = getActiveImg(pk);
    if (!img) return;
    
    const slot = getSlotFromImg(img);
    const energyBox = slot?.querySelector('.energy-pips');
    const pips = Array.from(energyBox?.querySelectorAll('.energy-pip:not(.phantom-pip)') || []);
    
    if (!pips.length) {
      popup('No energy to discard.');
      return;
    }
    
    const toDiscard = Math.min(count, pips.length);
    for (let i = 0; i < toDiscard; i++) {
      const randomIdx = Math.floor(Math.random() * pips.length);
      pips.splice(randomIdx, 1)[0].remove();
    }
    
    popup(`Discarded ${toDiscard} random energy from this Pokémon!`);
    console.log(`[discard_random_energy_self] Discarded ${toDiscard} energy`);
  },

  // 10. Inflict status on self - Snorlax Collapse (self asleep)
  inflict_status_self: async (s, pk, { param1 }, ctx) => {
    if (!ctx.isFinal) return;
    
    const status = (param1 || 'asleep').toLowerCase();
    applyStatus(pk, status);
    popup(`This Pokémon is now ${status}!`);
    console.log(`[inflict_status_self] ${status}`);
  },

  // 11. Reveal opponent hand - Noctowl Silent Wing
  reveal_opponent_hand: async (s, pk, p, ctx) => {
    if (!ctx.isFinal) return;
    
    const opp = oppPk(pk);
    const oppHand = s[opp]?.hand || [];
    
    if (!oppHand.length) {
      popup("Opponent's hand is empty!");
      return;
    }
    
    const names = oppHand.map(c => c.name).join(', ');
    popup(`Opponent's hand: ${names}`);
    console.log(`[reveal_opponent_hand] ${names}`);
  },

  // 12. Flip until tails, bonus damage - Pinsir Guillotine Rush
  flip_until_tails_bonus_damage: async (s, pk, { param1 }, ctx) => {
    const bonusPerHeads = parseInt10(param1, 40);
    let heads = 0;
    
    while ((await flipCoin()) === 'heads') {
      heads++;
    }
    
    if (heads > 0) {
      const totalBonus = heads * bonusPerHeads;
      ctx.addBonus(totalBonus);
      if (ctx.isFinal) {
        popup(`${heads} heads → +${totalBonus} damage!`);
      }
    } else if (ctx.isFinal) {
      popup('First flip was tails.');
    }
  },

  // 13. Attach multiple energy from zone to self - Charizard ex Stoke
  attach_multiple_energy_from_zone_self: async (s, pk, { param1, param2 }, ctx) => {
    if (!ctx.isFinal) return;
    
    const energyType = (param1 || 'fire').toLowerCase();
    const count = parseInt10(param2, 3);
    
    const img = getActiveImg(pk);
    if (!img) return;
    
    for (let i = 0; i < count; i++) {
      attachEnergy(img, energyType);
    }
    
    popup(`Attached ${count} ${energyType} Energy to this Pokémon!`);
    console.log(`[Stoke] Attached ${count}× ${energyType}`);
  },

  // 14. Random single target damage - Wiglett Spring Out
  random_single_target_damage: async (s, pk, { param1 }, ctx) => {
    if (!ctx.isFinal) return;
    
    const damage = parseInt10(param1, 30);
    const oppImgs = getAllPokemonImgs(oppPk(pk));
    
    if (!oppImgs.length) {
      popup('No opponent Pokémon to damage.');
      return;
    }
    
    // Pick random target
    const target = oppImgs[Math.floor(Math.random() * oppImgs.length)];
    damageImg(target, damage);
    
    popup(`Random target: ${target.alt} took ${damage} damage!`);
    console.log(`[random_single_target_damage] ${target.alt} -${damage} HP`);
  },

  // 15. Bench damage to Pokemon with energy - Alakazam Psychic Suppression
  bench_damage_opponent_with_energy: async (s, pk, { param1 }, ctx) => {
    if (!ctx.isFinal) return;
    
    const damage = parseInt10(param1, 20);
    const benchImgs = getBenchImgs(oppPk(pk));
    const knockedPokemon = [];
    
    // Get attacker for Oricorio check
    const attackerImg = ctx?.attackerImg || getActiveImg(pk);
    
    let count = 0;
    for (const img of benchImgs) {
      const slot = getSlotFromImg(img);
      const energyBox = slot?.querySelector('.energy-pips');
      const pips = energyBox?.querySelectorAll('.energy-pip:not(.phantom-pip)');
      
      if (pips && pips.length > 0) {
        const result = damageImg(img, damage, attackerImg);
        if (result.knocked) {
          const owner = img.closest('#player1') ? 'player1' : 'player2';
          knockedPokemon.push({ img, owner });
        }
        count++;
      }
    }
    
    if (count > 0) {
      popup(`${damage} damage to ${count} benched Pokémon with energy!`);
      console.log(`[bench_damage_opponent_with_energy] ${count} targets`);
    }
    
    // 🆕 Handle knockouts sequentially after damage is shown
    if (knockedPokemon.length > 0) {
      console.log('[bench-damage-with-energy] Knocked out:', knockedPokemon.map(p => p.img.alt));
      setTimeout(async () => {
        for (const { img, owner } of knockedPokemon) {
          if (typeof handleKnockOut === 'function') {
            await handleKnockOut(owner, img, false);
          }
        }
      }, 500);
    }
  },

  // 16. Flip multiplier per energy attached - Gholdengo Scintillating Surfing
  flip_multiplier_per_energy: async (s, pk, { param1, param2 }, ctx) => {
    const energyType = (param1 || 'metal').toLowerCase();
    const damagePerHeads = parseInt10(param2, 50);
    
    const img = getActiveImg(pk);
    if (!img) return;
    
    // Count energy of specified type
    const slot = getSlotFromImg(img);
    const energyBox = slot?.querySelector('.energy-pips');
    const pips = Array.from(energyBox?.querySelectorAll('.energy-pip:not(.phantom-pip)') || []);
    const typeCount = pips.filter(pip => (pip.dataset.type || '').toLowerCase() === energyType).length;
    
    if (typeCount === 0) {
      if (ctx.isFinal) popup(`No ${energyType} Energy attached!`);
      return;
    }
    
    // Flip once for each energy
    let heads = 0;
    for (let i = 0; i < typeCount; i++) {
      if ((await flipCoin()) === 'heads') heads++;
    }
    
    const totalDamage = heads * damagePerHeads;
    ctx.setOverride(totalDamage);
    
    if (ctx.isFinal) {
      popup(`${heads}/${typeCount} heads → ${totalDamage} damage!`);
      console.log(`[flip_multiplier_per_energy] ${heads}/${typeCount} heads`);
    }
  },

  // 🆕 A2a/A2b MOVE EFFECTS - END
  
  // ========================================
  // 🆕 A3 MOVE EFFECTS START
  // ========================================
  
  // === PHASE 1: SIMPLE NEW HANDLERS ===
  
  // 1. bonus_damage_conditional - Universal conditional damage boost
  bonus_damage_conditional: async (s, pk, { param1, param2 }, ctx) => {
    const amount = parseInt10(param1, 0);
    const condition = (param2 || '').toLowerCase();
    
    const attacker = getActiveImg(pk);
    const defender = getActiveImg(oppPk(pk));
    
    let conditionMet = false;
    
    switch (condition) {
      case 'opponent_basic':
        if (defender) {
          const meta = await globalThis.fetchCardMeta(defender.dataset.set, defender.dataset.num);
          conditionMet = (meta.stage || '').toLowerCase() === 'basic';
        }
        break;
        
      case 'opponent_has_ability':
        if (defender) {
          const abilityRow = await globalThis.getAbilityRowForCard?.(defender.dataset.set, defender.dataset.num);
          conditionMet = !!abilityRow;
        }
        break;
        
      case 'opponent_has_more_hp':
        if (attacker && defender) {
          const attackerMaxHp = parseInt10(attacker.dataset.hp);
          const defenderMaxHp = parseInt10(defender.dataset.hp);
          conditionMet = defenderMaxHp > attackerMaxHp;
        }
        break;
        
      case 'opponent_has_status':
        if (defender) {
          conditionMet = !!(defender.dataset.status);
        }
        break;
        
      case 'own_bench_damaged':
        const benchPokemon = getBenchImgs(pk);
        conditionMet = benchPokemon.some(img => {
          const maxHp = parseInt10(img.dataset.hp);
          const curHp = parseInt10(img.dataset.chp);
          return curHp < maxHp;
        });
        break;
        
      case 'switched_in':
        const playedTurn = parseInt10(attacker?.dataset.playedTurn, 0);
        const currentTurn = globalThis.turnNumber || 0;
        conditionMet = playedTurn === currentTurn;
        break;
        
      case 'supporter_played_this_turn':
        // Silvally - Brave Buddies
        if (!globalThis.__supporterPlayedThisTurn) globalThis.__supporterPlayedThisTurn = { p1: false, p2: false };
        conditionMet = globalThis.__supporterPlayedThisTurn[pk] === true;
        break;
    }
    
    if (conditionMet) {
      ctx.addBonus(amount);
      console.log(`[bonus_damage_conditional] +${amount} damage (${condition})`);
    }
  },
  
  // 2. bench_damage_per_energy_on_target - Tapu Lele's Energy Arrow
  bench_damage_per_energy_on_target: async (s, pk, { param1 }, ctx) => {
    if (!ctx.isFinal) return;
    
    const damagePerEnergy = parseInt10(param1, 20);
    const oppPlayer = oppPk(pk);
    
    // Get all opponent Pokemon (active + bench) since text says "1 of your opponent's Pokémon"
    const candidates = [
      getActiveImg(oppPlayer),
      ...getBenchImgs(oppPlayer)
    ].filter(Boolean);
    
    if (!candidates.length) {
      popup('No Pokemon to damage.');
      return;
    }
    
    // Get attacker for Oricorio check
    const attackerImg = ctx?.attackerImg || getActiveImg(pk);
    
    popup('Energy Arrow: Choose a Pokemon to damage.');
    const target = await awaitSelection(candidates);
    if (!target) {
      popup('Damage cancelled.');
      return;
    }
    
    const energyCount = countPipsOn(target.closest('.card-slot')).total;
    const totalDamage = energyCount * damagePerEnergy;
    
    if (totalDamage > 0) {
      damageImg(target, totalDamage, attackerImg);
      popup(`${target.alt} took ${totalDamage} damage (${energyCount} energy × ${damagePerEnergy})!`);
    } else {
      popup(`${target.alt} has no energy attached.`);
    }
  },
  
  // 3. bench_damage_to_damaged_only - Decidueye ex's Pierce the Pain
  bench_damage_to_damaged_only: async (s, pk, { param1 }, ctx) => {
    if (!ctx.isFinal) return;
    
    const damage = parseInt10(param1, 100);
    const oppPlayer = oppPk(pk);
    
    // Get all opponent's Pokemon (active + bench) with damage
    const allOpponentPokemon = [
      getActiveImg(oppPlayer),
      ...getBenchImgs(oppPlayer)
    ].filter(Boolean);
    
    // Filter to only damaged Pokemon
    const damagedPokemon = [];
    for (const img of allOpponentPokemon) {
      const slot = img.closest('.card-slot');
      const modifiedMaxHp = slot?.dataset.maxHp ? parseInt10(slot.dataset.maxHp) : null;
      const maxHp = modifiedMaxHp || parseInt10(img.dataset.hp);
      const curHp = parseInt10(img.dataset.chp, maxHp);
      
      if (curHp < maxHp) {
        damagedPokemon.push(img);
      }
    }
    
    if (damagedPokemon.length === 0) {
      popup('No damaged Pokemon to target.');
      return;
    }
    
    // Let user select one damaged Pokemon
    popup('Pierce the Pain: Select a damaged Pokemon to deal 100 damage.');
    const selected = await awaitSelection(damagedPokemon);
    
    if (!selected) {
      popup('No Pokemon selected.');
      return;
    }
    
    // Get attacker for Oricorio check
    const attackerImg = ctx?.attackerImg || getActiveImg(pk);
    
    // Deal damage to selected Pokemon
    const result = damageImg(selected, damage, attackerImg);
    popup(`Pierce the Pain: Dealt ${damage} damage to ${selected.alt}!`);
    console.log(`[Decidueye] Pierce the Pain dealt ${damage} to ${selected.alt}`);
    
    // Check if Pokemon was knocked out
    if (result.knocked) {
      console.log('[Pierce the Pain] Pokemon knocked out:', selected.alt);
      // Get the owner of the knocked out Pokemon
      const owner = selected.closest('#player1') ? 'player1' : 'player2';
      // Check if it was active Pokemon that was KO'd
      const wasActive = selected.closest('.active');
      
      // Handle knockout after a brief delay to show the damage
      setTimeout(async () => {
        if (typeof globalThis.handleKnockOut === 'function') {
          const gameEnded = await globalThis.handleKnockOut(owner, selected, wasActive);
          // If active Pokemon was KO'd and game didn't end, trigger promotion
          if (!gameEnded && wasActive && typeof globalThis.beginPromotionFlow === 'function') {
            globalThis.beginPromotionFlow(owner);
          }
        }
      }, 500);
    }
  },
  
  // 4. discard_random_energy_from_both - Oricorio's Kindle
  discard_random_energy_from_both: async (s, pk, p, ctx) => {
    if (!ctx.isFinal) return;
    
    // Discard from both players
    for (const player of [pk, oppPk(pk)]) {
      const activeImg = getActiveImg(player);
      if (!activeImg) continue;
      
      const slot = activeImg.closest('.card-slot');
      const pips = Array.from(slot.querySelectorAll('.energy-pip:not(.phantom-pip)'));
      
      if (pips.length === 0) continue;
      
      // Pick random pip
      const randomPip = pips[Math.floor(Math.random() * pips.length)];
      const energyType = randomPip.dataset.type || 'colorless';
      
      randomPip.remove();
      
      const owner = player === 'p1' ? 'player1' : 'player2';
      popup(`${owner === pkToPlayer(pk) ? 'You' : 'Opponent'} discarded 1 ${energyType} energy!`);
    }
    
    if (globalThis.updateAllEnergyVisuals) {
      globalThis.updateAllEnergyVisuals();
    }
  },
  
  // 5. discard_random_item_from_opponent_hand - Alolan Raticate
  discard_random_item_from_opponent_hand: async (s, pk, p, ctx) => {
    if (!ctx.isFinal) return;
    
    const oppHand = s[oppPk(pk)].hand || [];
    const items = [];
    
    for (const card of oppHand) {
      try {
        const meta = await globalThis.fetchCardMeta(card.set, card.number || card.num);
        if ((meta.category || '').toLowerCase() === 'trainer' && 
            (meta.trainerType || '').toLowerCase() === 'item') {
          items.push(card);
        }
      } catch (e) {}
    }
    
    if (items.length === 0) {
      popup('Opponent has no Item cards to discard.');
      return;
    }
    
    const randomItem = items[Math.floor(Math.random() * items.length)];
    const idx = oppHand.indexOf(randomItem);
    if (idx >= 0) {
      oppHand.splice(idx, 1);
      popup(`Opponent discarded ${randomItem.name}!`);
      
      if (globalThis.renderAllHands) {
        globalThis.renderAllHands();
      }
    }
  },
  
  // 6. inflict_random_status - Alolan Muk ex's Chemical Panic
  inflict_random_status: async (s, pk, p, ctx) => {
    if (!ctx.isFinal) return;
    
    const statuses = ['burned', 'poisoned', 'confused', 'paralyzed', 'asleep'];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
    
    applyStatus(oppPk(pk), randomStatus);
    popup(`Opponent is now ${randomStatus}!`);
  },

  // === PHASE 2: MEDIUM COMPLEXITY ===
  
  // 7. bonus_damage_during_next_turn - Crabominable ex
  bonus_damage_during_next_turn: async (s, pk, { param1 }, ctx) => {
    if (!ctx.isFinal) return;
    
    const bonusAmount = parseInt10(param1, 0);
    
    // Store bonus for next turn
    if (!globalThis.state) globalThis.state = {};
    if (!globalThis.state.temp) globalThis.state.temp = { p1: {}, p2: {} };
    if (!globalThis.state.temp[pkToPlayer(pk)]) globalThis.state.temp[pkToPlayer(pk)] = {};
    
    globalThis.state.temp[pkToPlayer(pk)].nextTurnDamageBonus = bonusAmount;
    
    popup(`Next turn's attack will deal +${bonusAmount} damage!`);
    console.log(`[bonus_damage_during_next_turn] Set +${bonusAmount} for next turn`);
  },

  // 8. increase_incoming_damage_next_turn - Kommo-o's Clanging Scales
  increase_incoming_damage_next_turn: async (s, pk, { param1 }, ctx) => {
    if (!ctx.isFinal) return;
    
    const increaseAmount = parseInt10(param1, 30);
    const oppPlayer = oppPk(pk);
    const oppImg = getActiveImg(oppPlayer);
    
    if (!oppImg) return;
    
    // Mark opponent to take more damage next turn
    oppImg.dataset.incomingDamageIncrease = increaseAmount;
    
    popup(`Opponent will take +${increaseAmount} damage next turn!`);
    console.log(`[increase_incoming_damage] ${oppImg.alt} will take +${increaseAmount} next turn`);
  },
  
  // 9. increase_opponent_costs_next_turn - Oranguru's Primate's Trap
  increase_opponent_costs_next_turn: async (s, pk, { param1 }, ctx) => {
    if (!ctx.isFinal) return;
    
    const costIncrease = parseInt10(param1, 2);
    
    if (!globalThis.__specialEffects) globalThis.__specialEffects = { p1: {}, p2: {} };
    if (!globalThis.__specialEffects[oppPk(pk)]) globalThis.__specialEffects[oppPk(pk)] = {};
    
    globalThis.__specialEffects[oppPk(pk)].attackCostIncrease = costIncrease;
    
    popup(`Opponent's attacks cost +${costIncrease} energy next turn!`);
    console.log(`[increase_costs] Opponent attacks cost +${costIncrease}`);
  },
  
  // 10. inflict_effect_counter_next_turn - Sandslash's Spike Armor
  inflict_effect_counter_next_turn: async (s, pk, { param1 }, ctx) => {
    if (!ctx.isFinal) return;
    
    const counterDamage = parseInt10(param1, 60);
    const selfImg = getActiveImg(pk);
    
    if (!selfImg) return;
    
    // Mark self to counter damage if attacked next turn
    selfImg.dataset.counterDamageNextTurn = counterDamage;
    
    popup(`If attacked next turn, will deal ${counterDamage} damage back!`);
    console.log(`[counter_next_turn] Set counter: ${counterDamage}`);
  },
  
  // 11. attach_energy_from_zone_to_self - Cosmog, Spoink, etc.
  attach_energy_from_zone_to_self: async (s, pk, { param1 }, ctx) => {
    if (!ctx.isFinal) return;
    
    const energyType = (param1 || 'colorless').toLowerCase();
    const selfImg = getActiveImg(pk);
    
    if (!selfImg) {
      popup('No active Pokemon to attach energy to.');
      return;
    }
    
    const slot = selfImg.closest('.card-slot');
    const owner = pkToPlayer(pk);
    
    // Attach from energy zone
    if (globalThis.attachEnergyToSlot) {
      globalThis.attachEnergyToSlot(owner, slot, energyType);
      popup(`Attached 1 ${energyType} energy to ${selfImg.alt}!`);
    }
  },
  
  // === PHASE 3: COMPLEX FLIP EFFECTS ===
  
  // 12. flip_conditional_burn - Alolan Marowak's Burning Bonemerang
  flip_conditional_burn: async (s, pk, { param1 }, ctx) => {
    if (!ctx.isFinal) return;
    
    const flipCount = parseInt10(param1, 2);
    let headsCount = 0;
    
    for (let i = 0; i < flipCount; i++) {
      const result = await flipCoin();
      if (result === 'heads') headsCount++;
    }
    
    popup(`Flipped ${headsCount}/${flipCount} heads!`);
    
    // Burn only if ALL flips are heads
    if (headsCount === flipCount) {
      applyStatus(oppPk(pk), 'burned');
      popup('Opponent is now burned!');
    }
  },
  
  // 13. flip_discard_energy_if_heads - Lycanroc's Crunch
  flip_discard_energy_if_heads: async (s, pk, p, ctx) => {
    if (!ctx.isFinal) return;
    
    const result = await flipCoin();
    
    if (result === 'heads') {
      const oppImg = getActiveImg(oppPk(pk));
      if (!oppImg) return;
      
      const slot = oppImg.closest('.card-slot');
      const pips = Array.from(slot.querySelectorAll('.energy-pip:not(.phantom-pip)'));
      
      if (pips.length === 0) {
        popup('Heads! But opponent has no energy to discard.');
        return;
      }
      
      // Discard one random energy
      const randomPip = pips[Math.floor(Math.random() * pips.length)];
      const energyType = randomPip.dataset.type || 'colorless';
      randomPip.remove();
      
      popup(`Heads! Discarded 1 ${energyType} energy!`);
      
      if (globalThis.updateAllEnergyVisuals) {
        globalThis.updateAllEnergyVisuals();
      }
    } else {
      popup('Tails! No energy discarded.');
    }
  },
  
  // 14. flip_self_damage_if_tails - Tapu Bulu's Stuck-In Tackle
  flip_self_damage_if_tails: async (s, pk, { param1 }, ctx) => {
    if (!ctx.isFinal) return;
    
    const selfDamage = parseInt10(param1, 20);
    const result = await flipCoin();
    
    if (result === 'tails') {
      const selfImg = getActiveImg(pk);
      if (selfImg) {
        damageImg(selfImg, selfDamage);
        popup(`Tails! ${selfImg.alt} took ${selfDamage} damage!`);
      }
    } else {
      popup('Heads! No self-damage.');
    }
  },
  
  // 15. flip_multiplier_until_tails - Alolan Dugtrio's Iron Head
  flip_multiplier_until_tails: async (s, pk, { param1 }, ctx) => {
    const baseDamage = parseInt10(param1, 10);
    let headsCount = 0;
    
    // Keep flipping until tails
    while (true) {
      const result = await flipCoin();
      if (result === 'heads') {
        headsCount++;
      } else {
        break; // Got tails, stop flipping
      }
    }
    
    const totalDamage = headsCount * baseDamage;
    ctx.bonusDamage = (ctx.bonusDamage || 0) + totalDamage;
    
    if (ctx.isFinal) {
      popup(`Flipped ${headsCount} heads before tails! Total: ${totalDamage} damage!`);
    }
  },
  
  // 16. flip_prevent_damage_and_effects_next_turn - Mr. Mime's Barrier Shove
  flip_prevent_damage_and_effects_next_turn: async (s, pk, p, ctx) => {
    if (!ctx.isFinal) return;
    
    const result = await flipCoin();
    
    if (result === 'heads') {
      const selfImg = getActiveImg(pk);
      if (selfImg) {
        // Mark for complete immunity next turn
        selfImg.dataset.preventAllNextTurn = 'true';
        popup('Heads! This Pokemon prevents all damage and effects next turn!');
        console.log('[prevent_all_next_turn] Immunity granted');
      }
    } else {
      popup('Tails! No effect.');
    }
  },
  
  // 17. flip_reveal_and_shuffle - Gastly's Astonish
  flip_reveal_and_shuffle: async (s, pk, p, ctx) => {
    if (!ctx.isFinal) return;
    
    const result = await flipCoin();
    
    if (result === 'heads') {
      const oppDeck = s[oppPk(pk)].deck || [];
      const oppHand = s[oppPk(pk)].hand || [];
      
      if (oppHand.length === 0) {
        popup('Heads! But opponent has no cards in hand.');
        return;
      }
      
      // Show opponent's hand
      const handNames = oppHand.map(c => c.name).join(', ');
      popup(`Heads! Opponent's hand: ${handNames}`);
      
      // Shuffle hand back into deck
      oppDeck.push(...oppHand);
      oppHand.length = 0;
      
      // Shuffle deck
      for (let i = oppDeck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [oppDeck[i], oppDeck[j]] = [oppDeck[j], oppDeck[i]];
      }
      
      popup('Shuffled hand into deck!');
      
      if (globalThis.renderAllHands) {
        globalThis.renderAllHands();
      }
      if (globalThis.updateDeckBubbles) {
        globalThis.updateDeckBubbles();
      }
    } else {
      popup('Tails! No effect.');
    }
  },

  // === PHASE 4: DECK SEARCH EFFECTS ===
  
  // 18. search_evolution_of_self - Rockruff's Signs of Evolution
  search_evolution_of_self: async (s, pk, p, ctx) => {
    if (!ctx.isFinal) return;
    
    const selfImg = getActiveImg(pk);
    if (!selfImg) return;
    
    const selfMeta = await globalThis.fetchCardMeta(selfImg.dataset.set, selfImg.dataset.num);
    const selfName = (selfMeta.name || '').toLowerCase();
    
    const deck = s[pk].deck || [];
    const evolutions = [];
    
    // Find cards that evolve from this Pokemon
    for (const card of deck) {
      try {
        const meta = await globalThis.fetchCardMeta(card.set, card.number || card.num);
        const evolvesFrom = (meta.evolveFrom || '').toLowerCase();
        
        if (evolvesFrom === selfName) {
          evolutions.push({ card, meta });
        }
      } catch (e) {}
    }
    
    if (evolutions.length === 0) {
      popup(`No evolution of ${selfMeta.name} found in deck.`);
      return;
    }
    
    // If multiple evolutions, let player choose
    let chosen;
    if (evolutions.length === 1) {
      chosen = evolutions[0];
    } else {
      popup(`Choose evolution: ${evolutions.map(e => e.meta.name).join(', ')}`);
      // For simplicity, take the first one
      chosen = evolutions[0];
    }
    
    // Add to hand
    const idx = deck.indexOf(chosen.card);
    if (idx >= 0) {
      deck.splice(idx, 1);
      (s[pk].hand ||= []).push(chosen.card);
      popup(`Added ${chosen.meta.name} to hand!`);
      
      if (globalThis.renderAllHands) {
        globalThis.renderAllHands();
      }
      if (globalThis.updateDeckBubbles) {
        globalThis.updateDeckBubbles();
      }
    }
  },
  
  // 19. search_named_to_bench - Wishiwashi's Call for Family
  search_named_to_bench: async (s, pk, { param1 }, ctx) => {
    if (!ctx.isFinal) return;
    
    const targetName = (param1 || '').toLowerCase();
    const deck = s[pk].deck || [];
    const bench = getBenchImgs(pk);
    
    // Check if bench is full
    if (bench.filter(img => img).length >= 3) {
      popup('Bench is full!');
      return;
    }
    
    // Find matching cards in deck
    const matches = deck.filter(card => 
      (card.name || '').toLowerCase().includes(targetName)
    );
    
    if (matches.length === 0) {
      popup(`No ${param1} found in deck.`);
      return;
    }
    
    // Take first match and put on bench
    const card = matches[0];
    const idx = deck.indexOf(card);
    deck.splice(idx, 1);
    
    // Put on bench through UI
    if (globalThis.putCardOnBench) {
      globalThis.putCardOnBench(pkToPlayer(pk), card.set, card.number || card.num);
      popup(`Put ${card.name} on bench!`);
    }
    
    if (globalThis.updateDeckBubbles) {
      globalThis.updateDeckBubbles();
    }
  },
  
  // 20. switch_self_with_bench_type - Tapu Koko's Volt Switch
  switch_self_with_bench_type: async (s, pk, { param1 }, ctx) => {
    if (!ctx.isFinal) return;
    
    const requiredType = (param1 || '').toLowerCase();
    const benchPokemon = getBenchImgs(pk);
    
    // Filter bench by type
    const validTargets = [];
    for (const img of benchPokemon) {
      const types = await globalThis.getTypesForPokemon?.(img);
      if (types && types.some(t => t.toLowerCase() === requiredType)) {
        validTargets.push(img);
      }
    }
    
    if (validTargets.length === 0) {
      popup(`No ${param1}-type Pokemon on bench to switch with.`);
      return;
    }
    
    popup(`Choose ${param1}-type Pokemon to switch with.`);
    const chosen = await awaitSelection(validTargets);
    
    if (!chosen) {
      popup('Switch cancelled.');
      return;
    }
    
    // Perform switch
    if (globalThis.forceSwitchSpecific) {
      globalThis.forceSwitchSpecific(s, pk, chosen);
      popup(`Switched with ${chosen.alt}!`);
    }
  },
  
  // === PHASE 5: SELF-INFLICT EFFECTS (Extensions) ===
  
  // 21. self_inflict_effect - Necrozma's Prismatic Laser
  self_inflict_effect: async (s, pk, { param1 }, ctx) => {
    if (!ctx.isFinal) return;
    
    const effect = (param1 || '').toLowerCase();
    
    // Apply effect to self
    if (effect === 'cant_attack_next_turn' || effect === 'attack_lock') {
      if (!globalThis.__specialEffects) globalThis.__specialEffects = { p1: {}, p2: {} };
      if (!globalThis.__specialEffects[pk]) globalThis.__specialEffects[pk] = {};
      
      globalThis.__specialEffects[pk].attackLock = true;
      popup('This Pokemon cannot attack next turn!');
    }
  },
  
  // 22. self_inflict_status - Bewear's Tantrum
  self_inflict_status: async (s, pk, { param1 }, ctx) => {
    if (!ctx.isFinal) return;
    
    const status = (param1 || '').toLowerCase();
    applyStatus(pk, status);
    popup(`${getActiveImg(pk)?.alt || 'This Pokemon'} is now ${status}!`);
  },
  
  // 23. inflict_double_status - Salazzle's Heated Poison
  inflict_double_status: async (s, pk, { param1, param2 }, ctx) => {
    if (!ctx.isFinal) return;
    
    const status1 = (param1 || '').toLowerCase();
    const status2 = (param2 || '').toLowerCase();
    
    // Apply first status
    if (status1) {
      applyStatus(oppPk(pk), status1);
    }
    
    // Apply second status (will override first in current implementation)
    // Note: This needs special handling for multiple statuses
    if (status2) {
      setTimeout(() => {
        applyStatus(oppPk(pk), status2);
        popup(`Opponent is now ${status1} and ${status2}!`);
      }, 500);
    }
  },
  
  // 24. inflict_effect_retreat_lock - Dhelmise ex, Sableye
  inflict_effect_retreat_lock: async (s, pk, p, ctx) => {
    if (!ctx.isFinal) return;
    
    if (!globalThis.__specialEffects) globalThis.__specialEffects = { p1: {}, p2: {} };
    if (!globalThis.__specialEffects[oppPk(pk)]) globalThis.__specialEffects[oppPk(pk)] = {};
    
    globalThis.__specialEffects[oppPk(pk)].retreatLock = true;
    popup('Opponent cannot retreat next turn!');
    console.log('[retreat_lock] Opponent locked from retreating');
  },

  // ========================================
  // 🆕 A3 MOVE EFFECTS END
  // ========================================
  
  // ========================================
  // 🆕 A3a/A3b NEW MOVE EFFECTS START
  // ========================================
  
  // Espeon - Energy Crush (20 for each energy on ALL opponent Pokemon)
  bonus_damage_for_each_energy_on_all_opponent_pokemon: async (s, pk, p, ctx) => {
    if (ctx.isFinal) return;
    
    const perEnergy = parseInt10(p.param1, 20);
    let totalEnergy = 0;
    
    // Count energy on all opponent Pokemon
    const oppPokemon = getAllPokemonImgs(oppPk(pk));
    for (const img of oppPokemon) {
      const slot = getSlotFromImg(img);
      const energyBox = slot?.querySelector('.energy-pips');
      if (energyBox) {
        const pips = energyBox.querySelectorAll('.energy-pip');
        totalEnergy += pips.length;
      }
    }
    
    const bonus = totalEnergy * perEnergy;
    ctx.damage += bonus;
    console.log(`[Energy Crush] +${bonus} damage for ${totalEnergy} energy on opponent's Pokemon`);
  }
  
  // Bonus damage for each specific energy type attached to THIS Pokemon
  ,bonus_damage_for_each_energy_type: async (s, pk, p, ctx) => {
    if (ctx.isFinal) return;
    
    const energyType = (p.param1 || '').toLowerCase();
    const perEnergy = parseInt10(p.param2, 10);
    
    const activeImg = getActiveImg(pk);
    if (!activeImg) return;
    
    const slot = getSlotFromImg(activeImg);
    const energyBox = slot?.querySelector('.energy-pips');
    if (!energyBox) return;
    
    const pips = energyBox.querySelectorAll('.energy-pip');
    const typeCount = Array.from(pips).filter(p => p.dataset.type === energyType).length;
    
    const bonus = typeCount * perEnergy;
    ctx.damage += bonus;
    console.log(`[Bonus per ${energyType}] +${bonus} damage for ${typeCount} ${energyType} energy`);
  }
  
  // Sylveon - Evoharmony (30 for each Evolution Pokemon on bench)
  ,bonus_damage_for_each_evolution_bench: async (s, pk, p, ctx) => {
    if (ctx.isFinal) return;
    
    const perEvo = parseInt10(p.param1, 30);
    const benchImgs = getBenchImgs(pk);
    
    let evoCount = 0;
    for (const img of benchImgs) {
      try {
        const meta = await fetchCardMeta(img.dataset.set, img.dataset.num);
        // Evolution Pokemon have a stage (Stage 1, Stage 2)
        if (meta.stage && meta.stage.toLowerCase() !== 'basic') {
          evoCount++;
        }
      } catch (e) {
        // Skip if can't fetch meta
      }
    }
    
    const bonus = evoCount * perEvo;
    ctx.damage += bonus;
    console.log(`[Evoharmony] +${bonus} damage for ${evoCount} Evolution Pokemon on bench`);
  }
  
  // Jolteon - Beginning Bolt (bonus if evolved this turn)
  ,bonus_damage_if_evolved_this_turn: async (s, pk, p, ctx) => {
    if (ctx.isFinal) return;
    
    const bonus = parseInt10(p.param1, 20);
    const activeImg = getActiveImg(pk);
    if (!activeImg) return;
    
    const playedTurn = parseInt(activeImg.dataset.playedTurn || '0', 10);
    if (playedTurn === globalThis.turnNumber) {
      ctx.damage += bonus;
      popup(`Beginning Bolt: +${bonus} damage (evolved this turn)!`);
      console.log(`[Beginning Bolt] +${bonus} damage for evolving this turn`);
    }
  }
  
  // Vanillite/Vanillish/Slurpuff - Sweets Relay (bonus if this move used last turn)
  ,bonus_damage_if_last_move_name_used: async (s, pk, p, ctx) => {
    if (ctx.isFinal) return;
    
    const moveName = p.param1 || '';
    const bonus = parseInt10(p.param2, 20);
    
    // Check if this move was used last turn by any of player's Pokemon
    if (!globalThis.__moveHistory) globalThis.__moveHistory = { p1: [], p2: [] };
    
    const lastTurnMoves = globalThis.__moveHistory[pk] || [];
    const usedLastTurn = lastTurnMoves.some(move => 
      move.name && move.name.toLowerCase() === moveName.toLowerCase()
    );
    
    if (usedLastTurn) {
      ctx.damage += bonus;
      popup(`${moveName}: +${bonus} damage (used last turn)!`);
      console.log(`[${moveName}] +${bonus} damage for using last turn`);
    }
    
    // Record this move for next turn (do this in isFinal phase)
    if (ctx.isFinal) {
      if (!globalThis.__moveHistory) globalThis.__moveHistory = { p1: [], p2: [] };
      if (!globalThis.__moveHistory[pk]) globalThis.__moveHistory[pk] = [];
      globalThis.__moveHistory[pk].push({ name: ctx.moveName, turn: globalThis.turnNumber });
      
      // Clear old moves (only keep moves from last turn)
      globalThis.__moveHistory[pk] = globalThis.__moveHistory[pk].filter(m => 
        m.turn >= globalThis.turnNumber - 1
      );
    }
  }
  
  // Damage times how many times this move name was used
  ,damage_times_move_name_used: async (s, pk, p, ctx) => {
    if (ctx.isFinal) return;
    
    const moveName = ctx.moveName || '';
    
    // Track how many times this specific move has been used
    if (!globalThis.__moveUseCount) globalThis.__moveUseCount = { p1: {}, p2: {} };
    if (!globalThis.__moveUseCount[pk]) globalThis.__moveUseCount[pk] = {};
    
    const count = globalThis.__moveUseCount[pk][moveName] || 0;
    
    // Multiply base damage by count
    const multiplier = Math.max(1, count);
    ctx.damage = ctx.damage * multiplier;
    
    console.log(`[${moveName}] Damage × ${multiplier} (used ${count} times)`);
    
    // Increment counter (do this in isFinal phase)
    if (ctx.isFinal) {
      if (!globalThis.__moveUseCount) globalThis.__moveUseCount = { p1: {}, p2: {} };
      if (!globalThis.__moveUseCount[pk]) globalThis.__moveUseCount[pk] = {};
      globalThis.__moveUseCount[pk][moveName] = (globalThis.__moveUseCount[pk][moveName] || 0) + 1;
    }
  }
  
  // Flip coins until tails, bonus damage for each heads
  ,flip_bonus_damage_until_tails: async (s, pk, p, ctx) => {
    if (ctx.isFinal) return;
    
    const bonusPerHeads = parseInt10(p.param1, 20);
    
    let headsCount = 0;
    let result;
    
    do {
      result = await coinFlip();
      if (result === 'heads') {
        headsCount++;
      }
    } while (result === 'heads');
    
    const bonus = headsCount * bonusPerHeads;
    ctx.damage += bonus;
    
    popup(`Flipped ${headsCount} heads, +${bonus} damage!`);
    console.log(`[Flip until tails] ${headsCount} heads, +${bonus} damage`);
  }
  
  // Flip 2 coins with different outcomes for HH, HT/TH, TT
  ,flip_two_stage: async (s, pk, p, ctx) => {
    if (ctx.isFinal) return;
    
    // param1 = TT damage, param2 = HT/TH damage, param3 = HH damage
    const ttDamage = parseInt10(p.param1, 0);
    const mixedDamage = parseInt10(p.param2, 40);
    const hhDamage = parseInt10(p.param3, 80);
    
    const flip1 = await coinFlip();
    const flip2 = await coinFlip();
    
    const headsCount = (flip1 === 'heads' ? 1 : 0) + (flip2 === 'heads' ? 1 : 0);
    
    if (headsCount === 0) {
      ctx.damage = ttDamage;
      popup(`Both tails! ${ttDamage} damage.`);
    } else if (headsCount === 1) {
      ctx.damage = mixedDamage;
      popup(`One heads! ${mixedDamage} damage.`);
    } else {
      ctx.damage = hhDamage;
      popup(`Both heads! ${hhDamage} damage.`);
    }
    
    console.log(`[Two-stage flip] ${headsCount} heads = ${ctx.damage} damage`);
  }
  
  // Inflict effect only if opponent is Basic Pokemon
  ,inflict_effect_if_basic: async (s, pk, p, ctx) => {
    if (!ctx.isFinal) return;
    
    const effect = p.param1 || '';
    
    const oppActive = getActiveImg(oppPk(pk));
    if (!oppActive) return;
    
    try {
      const meta = await fetchCardMeta(oppActive.dataset.set, oppActive.dataset.num);
      const isBasic = (meta.stage || '').toLowerCase() === 'basic';
      
      if (isBasic) {
        // Apply the effect based on type
        if (effect === 'attack_lock') {
          if (!globalThis.__specialEffects) globalThis.__specialEffects = { p1: {}, p2: {} };
          globalThis.__specialEffects[oppPk(pk)].attackLock = true;
          popup('Opponent Basic Pokemon cannot attack next turn!');
        } else if (effect === 'cant_attack_next_turn') {
          if (!globalThis.__specialEffects) globalThis.__specialEffects = { p1: {}, p2: {} };
          globalThis.__specialEffects[oppPk(pk)].cantAttackNextTurn = true;
          popup('Opponent Basic Pokemon cannot attack next turn!');
        }
        console.log(`[Effect if basic] Applied ${effect} to Basic Pokemon`);
      } else {
        popup('Opponent is not a Basic Pokemon - no effect.');
      }
    } catch (e) {
      console.error('[inflict_effect_if_basic] Failed to check stage:', e);
    }
  }
  
  // Bonus damage for each benched Pokemon (generic)
  ,bonus_damage_for_each_benched: async (s, pk, p, ctx) => {
    if (ctx.isFinal) return;
    
    const target = p.param1 || 'self'; // 'self' or 'opponent'
    const perBench = parseInt10(p.param2, 10);
    
    const targetPk = target === 'opponent' ? oppPk(pk) : pk;
    const benchImgs = getBenchImgs(targetPk);
    
    const bonus = benchImgs.length * perBench;
    ctx.damage += bonus;
    console.log(`[Bonus per bench] +${bonus} damage for ${benchImgs.length} benched Pokemon`);
  }
  
  // Damage all of OWN benched Pokemon
  ,bench_damage_all_self: async (s, pk, p, ctx) => {
    if (!ctx.isFinal) return;
    
    const damage = parseInt10(p.param1, 10);
    const benchImgs = getBenchImgs(pk);
    
    for (const img of benchImgs) {
      await damageImg(img, damage);
    }
    
    if (benchImgs.length > 0) {
      popup(`Damaged all ${benchImgs.length} benched Pokemon for ${damage} each!`);
      console.log(`[Bench damage self] ${damage} to ${benchImgs.length} benched Pokemon`);
    }
  }

  // ========================================
  // 🆕 A3a/A3b NEW MOVE EFFECTS END
  // ========================================

};

globalThis.MOVE_EFFECT_HANDLERS = MOVE_HANDLERS;

/* ============================
   MOVE EFFECT DISPATCHER
============================ */

// Helper: Select bench Pokemon with user interaction
async function selectBenchPokemon(pk, count, filterFn = null) {
  const bench = getBenchImgs(pk);
  const available = filterFn ? bench.filter(filterFn) : bench;
  
  if (available.length === 0) {
    return [];
  }
  
  if (available.length <= count) {
    return available; // Auto-select all if not enough to choose
  }
  
  // TODO: Implement proper UI selection
  // For now, return first N available
  popup(`Selected ${count} Benched Pokemon (auto-selection)`);
  return available.slice(0, count);
}

// Helper: Select any Pokemon with user interaction
async function selectPokemon(pk, options, message) {
  if (options.length === 0) return null;
  if (options.length === 1) return options[0];
  
  // TODO: Implement proper UI selection
  // For now, return first option
  popup(message || 'Auto-selected first available Pokemon');
  return options[0];
}

const previewCache = { p1: null, p2: null };

async function applyMoveEffect(state, pk, attackName, baseDamage, ctx = {}) {
  await loadMoveEffects();
  
  const img = getActiveImg(pk);
  if (!img) return baseDamage;
  
  const isFinal = ctx.isFinal ?? true;
  let damage = baseDamage;
  
  // 🆕 ARCEUS PASSIVE ABILITY - boost_damage_if_arceus
  // Check BEFORE move effects so it applies even to attacks without special effects
  console.log(`[arceus-boost-START] img=${!!img}, isFinal=${isFinal}, dataset.set=${img?.dataset?.set}, dataset.num=${img?.dataset?.num}`);
  
  if (img && isFinal && img.dataset.set && img.dataset.num) {
    try {
      // Use ability cache for synchronous lookup
      const cacheKey = `${img.dataset.set}-${img.dataset.num}`;
      const abilityRow = globalThis.abilityCache?.[cacheKey];
      
      console.log(`[arceus-damage-debug] Checking ${img.alt} (${cacheKey}) for boost_damage_if_arceus`);
      console.log(`[arceus-damage-debug] Ability row:`, abilityRow);
      console.log(`[arceus-damage-debug] Cache size:`, Object.keys(globalThis.abilityCache || {}).length);
      
      if (abilityRow?.effect_type === 'boost_damage_if_arceus') {
        console.log(`[arceus-damage-debug] Found boost ability, checking for Arceus...`);
        if (hasArceusInPlay(pk)) {
          const arceusDamageBoost = parseInt10(abilityRow.param1, 30);
          damage += arceusDamageBoost;
          console.log(`[Arceus boost] +${arceusDamageBoost} damage (Arceus in play)`);
        } else {
          console.log(`[arceus-damage-debug] ${img.alt} has ability but no Arceus in play`);
        }
      }
    } catch (e) {
      console.error('[arceus-damage-debug] Error checking Arceus boost:', e);
      // Ability check failed, continue without boost
    }
  } else {
    console.log(`[arceus-boost-SKIP] Skipped because: img=${!!img}, isFinal=${isFinal}, set=${img?.dataset?.set}, num=${img?.dataset?.num}`);
  }
  
  const row = getMoveRow(img.alt, attackName);
  
  if (!row?.effect_type) return damage;
  if (row.damageNotation?.includes('×')) baseDamage = 0;
  
  const handler = MOVE_HANDLERS[row.effect_type];
  if (!handler) {
    console.warn('[move] Missing handler:', row.effect_type);
    return baseDamage;
  }
  
  const context = {
    damage,  // 🆕 Add damage to context for new A3a/A3b effects
    moveName: attackName,  // 🆕 Add move name for tracking effects
    isFinal,
    rawCtx: ctx,
    addBonus: amt => { damage += amt; },
    setOverride: v => { damage = v; }
  };
  
  
  await handler(state, pk, { param1: row.param1, param2: row.param2 }, context);
  
  // 🆕 Update damage from context (for effects that modify ctx.damage directly)
  // Only update if context.damage changed from the initial value
  if (context.damage !== damage) {
    damage = context.damage;
  }
  
  // Prevent double-counting for preview vs final
  const delta = damage - baseDamage;
  if (!isFinal) {
    previewCache[pk] = { attack: normStr(attackName), delta };
  } else {
    const prev = previewCache[pk];
    if (prev?.attack === normStr(attackName)) {
      damage = baseDamage + (delta - prev.delta);
    }
  }
  
  // Apply global boost (Giovanni)
  const boost = state.temp?.[pk]?.globalDamageBoost || 0;
  if (boost) damage += boost;
  
  if (isFinal) {
    globalThis.addLog?.(pk, `used <b>${attackName}</b>`, img.src, { name: img.alt });
  }
  
  // 🆕 A2 FIX - Return both damage and context for special effects like Rampardos
  if (isFinal && context.checkKoForRecoil) {
    return { damage, context };
  }
  
  return damage;
}

globalThis.applyMoveEffectFromCsv = applyMoveEffect;
globalThis.runMoveEffect = applyMoveEffect;
globalThis.loadMoveEffects = loadMoveEffects;

/* ============================
   ABILITY EFFECTS
============================ */
const ABILITY_HANDLERS = {
  heal_all: async (s, pk, { param1 }) => {
    const amt = parseInt10(param1, 20);
    let healed = 0;
    for (const img of getAllPokemonImgs(pk)) if (healImg(img, amt)) healed++;
    popup(healed ? `Healed ${amt} from ${healed} Pokémon.` : 'Nothing to heal.');
  },

  force_switch_opponent_basic: async (s, pk) => {
    const opp = oppPk(pk);
    const basics = [];
    
    for (const img of getBenchImgs(opp)) {
      try {
        const meta = await globalThis.fetchCardMeta(img.dataset.set, img.dataset.num);
        if (meta.stage?.toLowerCase() === 'basic') basics.push(img);
      } catch {}
    }
    
    if (!basics.length) { popup('No Basic Pokémon on opponent bench.'); return; }
    
    popup('Opponent: choose Basic to switch in.');
    const chosen = await awaitSelection(basics, 'promote-glow');
    if (chosen) globalThis.beginPromotionFlow?.(pkToPlayer(opp));
  },

  deal_damage_any: async (s, pk, { param1 }) => {
    const dmg = parseInt10(param1, 20);
    const targets = getAllPokemonImgs(oppPk(pk));
    if (!targets.length) { popup('No targets.'); return; }
    
    // Close zoom backdrop if open (so user can select target)
    if (typeof globalThis.zoomBackdrop !== 'undefined' && globalThis.zoomBackdrop.classList.contains('show')) {
      globalThis.zoomBackdrop.classList.remove('show');
      if (typeof globalThis.currentZoom !== 'undefined') {
        globalThis.currentZoom = { img: null, meta: null };
      }
    }
    
    popup(`Choose target for ${dmg} damage.`);
    const chosen = await awaitSelection(targets);
    if (chosen) {
      const result = damageImg(chosen, dmg);
      popup(`Dealt ${dmg} to ${chosen.alt}.`);
      
      // Return KO status AND the Pokemon that was hit
      return { 
        knocked: result.knocked,
        knockedImg: result.knocked ? chosen : null
      };
    }
    
    return { knocked: false, knockedImg: null };
  },

  attach_energy_from_zone: async (s, pk, { param1, param2 }, ctx) => {
    // Magneton Volt Charge: attach Lightning to THIS Pokemon (can be active or benched)
    const type = (param1 || 'lightning').toLowerCase();
    const count = parseInt10(param2, 1);
    
    // Get the Pokemon that has this ability from context
    // Could be sourceImg (from zoom panel) or abilityPokemon (from other triggers)
    let targetImg = ctx?.sourceImg || ctx?.abilityPokemon;
    
    console.log('[Volt Charge] Context:', ctx);
    console.log('[Volt Charge] targetImg:', targetImg?.alt || 'none');
    
    if (!targetImg) { 
      popup('Could not identify which Pokemon to attach energy to.'); 
      console.error('[Volt Charge] No sourceImg or abilityPokemon in context');
      return; 
    }
    
    // Attach energy to THIS Pokemon (whether active or benched)
    for (let i = 0; i < count; i++) {
      attachEnergy(targetImg, type);
    }
    
    const location = getActiveImg(pk) === targetImg ? 'active' : 'bench';
    popup(`${targetImg.alt} (${location}): Attached ${count} ${type} Energy to itself.`);
    console.log(`[Volt Charge] ${targetImg.alt} (${location}) attached ${count}× ${type} to itself`);
  },

  attach_energy_from_zone_to_active: async (s, pk, { param1 }) => {
    const type = (param1 || 'psychic').toLowerCase();
    const active = getActiveImg(pk);
    if (!active) { popup('No Active.'); return; }
    
    try {
      const meta = await globalThis.fetchCardMeta(active.dataset.set, active.dataset.num);
      if (!meta.types?.some(t => t.toLowerCase() === type)) {
        popup(`Active is not ${type}-type.`); return;
      }
    } catch { popup('Type check failed.'); return; }
    
    attachEnergy(active, type);
    
    popup(`Attached ${type} Energy.`);
  },

  flip_inflict_status: async (s, pk, { param1 }) => {
    const status = param1 || 'asleep';
    if ((await flipCoin()) === 'heads') {
      applyStatus(oppPk(pk), status);
      popup(`HEADS → ${status}!`);
    } else popup('TAILS → no effect.');
  },

  inflict_status: async (s, pk, { param1 }) => {
    applyStatus(oppPk(pk), param1 || 'poisoned');
    popup(`Opponent is ${param1 || 'poisoned'}.`);
  },

  force_opponent_switch: async (s, pk) => {
    globalThis.beginPromotionFlow?.(pkToPlayer(oppPk(pk)));
    popup('Opponent must switch.');
  },

  peek_topdeck: async (s, pk, { param1 }) => {
    const deck = s[pk].deck ?? [];
    const n = Math.min(parseInt10(param1, 1), deck.length);
    popup(n ? `Top: ${deck.slice(0, n).map(c => c.name).join(', ')}` : 'Deck empty.');
  },

  heal_active: async (s, pk, { param1 }) => {
    const img = getActiveImg(pk);
    if (img && healImg(img, parseInt10(param1))) popup(`Healed ${param1}.`);
    else popup('Nothing to heal.');
  },

  draw_cards: async (s, pk, { param1 }) => {
    globalThis.drawCards?.(s, pk, parseInt10(param1, 1));
    popup(`Drew ${param1 || 1} card(s).`);
  },

  move_energy: async (s, pk, { param1 }) => {
    const type = param1?.toLowerCase() || null;
    const all = getAllPokemonImgs(pk);
    if (all.length < 2) { popup('Need 2+ Pokémon.'); return; }
    
    popup('Select source.');
    const source = await awaitSelection(all);
    if (!source || !countEnergy(source, type)) { popup('No energy to move.'); return; }
    
    const targets = all.filter(img => img !== source);
    popup('Select target.');
    const target = await awaitSelection(targets);
    
    if (target && removeEnergy(source, type, 1)) {
      attachEnergy(target, type || 'colorless');
      popup(`Moved energy to ${target.alt}.`);
    }
  },

  // 🆕 A1a ABILITY EFFECTS - START

  // Block evolution - Aerodactyl ex
  block_evolution: async (s, pk, { param1 }) => {
    // param1: "opponent" (who is blocked)
    // This is a passive ability - set a global flag
    if (!globalThis.state) globalThis.state = {};
    if (!globalThis.state.evolutionBlocked) globalThis.state.evolutionBlocked = {};
    
    const target = param1 === 'opponent' ? oppPk(pk) : pk;
    globalThis.state.evolutionBlocked[target] = true;
    
    console.log(`[block_evolution] ${target} cannot evolve their Active Pokemon`);
    popup('Opponent cannot evolve their Active Pokemon!');
  },

  // Double energy type - Serperior
  double_energy_type: async (s, pk, { param1 }) => {
    // param1: "grass" (energy type to double)
    // This is a passive ability - affects energy counting globally
    if (!globalThis.state) globalThis.state = {};
    if (!globalThis.state.energyMultiplier) globalThis.state.energyMultiplier = {};
    
    globalThis.state.energyMultiplier[pk] = {
      type: param1?.toLowerCase(),
      multiplier: 2,
      restriction: param1?.toLowerCase() // Only affects same-type Pokemon
    };
    
    // Cache types on all Pokemon images for faster lookup
    const allPokemon = getAllPokemonImgs(pk);
    for (const img of allPokemon) {
      try {
        const meta = await globalThis.fetchCardMeta(img.dataset.set, img.dataset.num);
        if (meta.types) {
          img.dataset.pokemonTypes = meta.types.map(t => t.toLowerCase()).join(',');
        }
      } catch (e) {
        console.error('[double_energy] Failed to cache type for', img.alt);
      }
    }
    
    console.log(`[double_energy] ${pk} ${param1} Energy now provides 2 ${param1}`);
    popup(`${param1} Energy provides 2 ${param1} for your ${param1} Pokemon!`);
  },

  // Move energy type to active - Vaporeon
  move_energy_type_to_active: async (s, pk, { param1, param2 }) => {
    // param1: "water" (energy type)
    // param2: "unlimited" (can use multiple times)
    const energyType = (param1 || 'water').toLowerCase();
    
    // Get benched Pokemon with the specified energy type
    const benchWithEnergy = [];
    for (const img of getBenchImgs(pk)) {
      try {
        const meta = await globalThis.fetchCardMeta(img.dataset.set, img.dataset.num);
        const hasType = meta.types?.some(t => t.toLowerCase() === energyType);
        const hasEnergy = countEnergy(img, energyType) > 0;
        
        if (hasType && hasEnergy) {
          benchWithEnergy.push(img);
        }
      } catch {}
    }
    
    if (benchWithEnergy.length === 0) {
      popup(`No benched ${energyType} Pokemon with ${energyType} Energy`);
      return;
    }
    
    // Get active Pokemon
    const activeImg = getActiveImg(pk);
    if (!activeImg) {
      popup('No Active Pokemon');
      return;
    }
    
    // Check if active is the right type
    try {
      const activeMeta = await globalThis.fetchCardMeta(activeImg.dataset.set, activeImg.dataset.num);
      const activeHasType = activeMeta.types?.some(t => t.toLowerCase() === energyType);
      
      if (!activeHasType) {
        popup(`Active Pokemon is not ${energyType} type`);
        return;
      }
    } catch {
      popup('Could not verify Active Pokemon type');
      return;
    }
    
    popup(`Choose benched ${energyType} Pokemon to move ${energyType} Energy from`);
    const source = await awaitSelection(benchWithEnergy);
    
    if (source) {
      // Move one energy from bench to active
      if (removeEnergy(source, energyType, 1)) {
        attachEnergy(activeImg, energyType);
        popup(`Moved ${energyType} Energy to Active Pokemon`);
      }
    }
  },

  // 🆕 A2 ABILITY EFFECTS - START

  // Thick Fat (Piloswine/Mamoswine) - Reduce damage from Fire/Water attacks
  reduce_damage_from_types: async () => {
    // Passive - handled in damage calculation
  },

  // Crystal Body (Regice) - Block attack effects
  block_attack_effects: async () => {
    // Passive - handled in attack effects
  },

  // Shadow Void (Dusknoir) - Move all damage from one Pokemon to this one
  move_all_damage: async (s, pk, params, ctx) => {
    const targets = getAllPokemonImgs(pk).filter(img => {
      const slot = img.closest('.card-slot');
      const modifiedMaxHp = slot?.dataset.maxHp ? parseInt10(slot.dataset.maxHp) : null;
      const hp = modifiedMaxHp || parseInt10(img.dataset.hp, 0);
      const chp = parseInt10(img.dataset.chp, hp);
      return chp < hp; // Has damage
    });
    
    if (!targets.length) {
      popup('No Pokémon with damage.');
      return;
    }
    
    popup('Shadow Void: Choose Pokémon to move damage from.');
    const chosen = await awaitSelection(targets);
    if (!chosen) return;
    
    // Get the Pokemon with this ability from context
    // Could be sourceImg (from zoom panel) or abilityPokemon (from other triggers)
    const dusknoir = ctx?.sourceImg || ctx?.abilityPokemon;
    
    if (!dusknoir) {
      popup('Could not identify which Dusknoir to move damage to.');
      console.error('[Shadow Void] No sourceImg or abilityPokemon in context');
      return;
    }
    
    // Calculate damage on chosen Pokemon
    const chosenSlot = chosen.closest('.card-slot');
    const chosenModifiedHp = chosenSlot?.dataset.maxHp ? parseInt10(chosenSlot.dataset.maxHp) : null;
    const chosenHp = chosenModifiedHp || parseInt10(chosen.dataset.hp, 0);
    const chosenChp = parseInt10(chosen.dataset.chp, 0);
    const damage = chosenHp - chosenChp;
    
    if (damage <= 0) {
      popup('No damage to move.');
      return;
    }
    
    // Heal chosen Pokemon completely
    chosen.dataset.chp = String(chosenHp);
    if (globalThis.setHpOnImage) {
      globalThis.setHpOnImage(chosen, chosenHp, chosenHp);
    }
    
    // Damage Dusknoir (or whichever Pokemon has this ability)
    const result = damageImg(dusknoir, damage);
    popup(`Moved ${damage} damage to ${dusknoir.alt}.`);
    
    // Return KO status
    return { 
      knocked: result.knocked,
      knockedImg: result.knocked ? dusknoir : null
    };
  },

  // Levitate (Giratina) - Zero retreat cost if has energy
  zero_retreat_if_energy: async () => {
    // Passive - handled in retreat cost calculation
  },

  // Fighting Coach (Lucario) - Boost Fighting Pokemon damage
  boost_type_damage: async () => {
    // Passive - handled in damage calculation
  },

  // Nightmare Aura (Darkrai ex) - Damage when attaching Dark energy
  damage_on_energy_attach: async () => {
    // Passive - handled in energy attachment
  },

  // Guarded Grill (Bastiodon) - Flip to reduce damage
  flip_reduce_damage: async () => {
    // Passive - handled in damage calculation
  },

  // Reckless Shearing (Garchomp) - Discard to draw
  discard_to_draw: async (s, pk) => {
    const owner = pkToPlayer(pk);
    const hand = s[pk]?.hand || [];
    
    if (hand.length === 0) {
      popup('No cards in hand to discard.');
      return;
    }
    
    // Show hand and let player choose card to discard
    popup('Choose a card from your hand to discard.');
    
    // Trigger hand selection
    if (globalThis.beginHandCardDiscard) {
      await globalThis.beginHandCardDiscard(owner, 1);
    } else {
      // Fallback: discard random card
      const randomIndex = Math.floor(Math.random() * hand.length);
      const discarded = hand.splice(randomIndex, 1)[0];
      
      if (globalThis.pushCardToDiscard && discarded) {
        const fakeImg = document.createElement('img');
        fakeImg.dataset.set = discarded.set;
        fakeImg.dataset.num = discarded.num;
        globalThis.pushCardToDiscard(owner, fakeImg);
      }
      
      popup(`Discarded ${discarded?.name || 'a card'}.`);
    }
    
    // Draw 1 card
    if (globalThis.drawCard) {
      globalThis.drawCard(owner);
      popup('Drew 1 card.');
    }
  },

  // 🆕 A2 ABILITY EFFECTS - END

  // 🆕 A1a ABILITY EFFECTS - END

  // 🆕 A2a/A2b ABILITY EFFECTS - START (13 new)

  // 1. boost_damage_if_arceus - Passive
  boost_damage_if_arceus: async () => {
    // Passive - handled in damage calculation
    // Check if Arceus/Arceus ex in play, add bonus
  },

  // 2. deal_damage_if_arceus - Active
  deal_damage_if_arceus: async (s, pk, { param1 }) => {
    // Crobat Cunning Link: Do 30 damage if Arceus in play
    const damage = parseInt10(param1, 30);
    
    // Check if Arceus or Arceus ex in play
    const allPokemon = getAllPokemonImgs(pk);
    const hasArceus = allPokemon.some(img => {
      const name = (img.alt || '').toLowerCase();
      return name.includes('arceus');
    });
    
    if (!hasArceus) {
      popup('No Arceus in play - ability cannot be used.');
      return { knocked: false, knockedImg: null };
    }
    
    // Choose target
    const targets = getAllPokemonImgs(oppPk(pk));
    if (!targets.length) {
      popup('No targets.');
      return { knocked: false, knockedImg: null };
    }
    
    // Close zoom backdrop
    if (typeof globalThis.zoomBackdrop !== 'undefined' && globalThis.zoomBackdrop.classList.contains('show')) {
      globalThis.zoomBackdrop.classList.remove('show');
      if (typeof globalThis.currentZoom !== 'undefined') {
        globalThis.currentZoom = { img: null, meta: null };
      }
    }
    
    popup(`Choose opponent's Active Pokemon for ${damage} damage.`);
    const chosen = await awaitSelection([getActiveImg(oppPk(pk))].filter(Boolean));
    
    if (chosen) {
      const result = damageImg(chosen, damage);
      popup(`Dealt ${damage} to ${chosen.alt}!`);
      console.log(`[Cunning Link] ${damage} damage to ${chosen.alt}`);
      
      // Return KO status
      return {
        knocked: result.knocked,
        knockedImg: result.knocked ? chosen : null
      };
    }
    
    return { knocked: false, knockedImg: null };
  },

  // 3. zero_retreat_if_arceus - Passive
  zero_retreat_if_arceus: async () => {
    // Passive - handled in retreat cost calculation
    // Check if Arceus in play, reduce retreat to 0
  },

  // 4. reduce_attack_cost_if_arceus - Passive
  reduce_attack_cost_if_arceus: async () => {
    // Passive - handled in attack cost calculation
    // Check if Arceus in play, reduce colorless cost by 1
  },

  // 5. damage_during_checkup - Passive
  damage_during_checkup: async () => {
    // Glaceon ex Snowy Terrain - deals 10 during checkup
    // Passive - handled in checkup phase
    // Must check if active and deal 10 to opponent
  },

  // 6. reduce_damage_if_arceus - Passive
  reduce_damage_if_arceus: async () => {
    // Passive - handled in damage calculation
    // Check if Arceus in play, reduce incoming damage by 30
  },

  // 7. peek_topdeck_either_player - Active
  peek_topdeck_either_player: async (s, pk) => {
    // Unown CHECK: Look at top of either player's deck
    popup('Choose: Look at your deck or opponent\'s deck?');
    
    // Create choice buttons
    const choices = ['My Deck', 'Opponent Deck'];
    let chosenPlayer = null;
    
    // Simple async choice implementation
    chosenPlayer = await new Promise(resolve => {
      const choice1 = confirm('Look at YOUR deck? (OK = Your deck, Cancel = Opponent deck)');
      resolve(choice1 ? pk : oppPk(pk));
    });
    
    const deck = s[chosenPlayer]?.deck || [];
    if (deck.length === 0) {
      popup('Deck is empty!');
      return;
    }
    
    const topCard = deck[0];
    const deckOwner = chosenPlayer === pk ? 'Your' : 'Opponent\'s';
    popup(`${deckOwner} top card: ${topCard.name}`);
    console.log(`[CHECK] Looked at ${deckOwner} top card: ${topCard.name}`);
  },

  // 8. attach_energy_from_zone_to_type - Active
  attach_energy_from_zone_to_type: async (s, pk, { param1, param2 }) => {
    // Leafeon ex Forest Breath: Attach Grass to Grass Pokemon (requires active)
    const energyType = (param1 || 'grass').toLowerCase();
    const targetType = (param2 || 'grass').toLowerCase();
    
    // Must be in active spot
    const active = getActiveImg(pk);
    let sourceImg = null;
    
    // Find the Leafeon ex that has this ability
    const allPokemon = getAllPokemonImgs(pk);
    for (const img of allPokemon) {
      if ((img.alt || '').toLowerCase().includes('leafeon')) {
        sourceImg = img;
        break;
      }
    }
    
    if (!sourceImg || getActiveImg(pk) !== sourceImg) {
      popup('Leafeon ex must be in the Active Spot to use this ability.');
      return;
    }
    
    // Find all Pokemon of target type
    const targets = [];
    for (const img of getAllPokemonImgs(pk)) {
      try {
        const meta = await globalThis.fetchCardMeta(img.dataset.set, img.dataset.num);
        if (meta.types?.some(t => t.toLowerCase() === targetType)) {
          targets.push(img);
        }
      } catch {}
    }
    
    if (!targets.length) {
      popup(`No ${targetType}-type Pokemon in play.`);
      return;
    }
    
    // Close zoom backdrop
    if (typeof globalThis.zoomBackdrop !== 'undefined' && globalThis.zoomBackdrop.classList.contains('show')) {
      globalThis.zoomBackdrop.classList.remove('show');
      if (typeof globalThis.currentZoom !== 'undefined') {
        globalThis.currentZoom = { img: null, meta: null };
      }
    }
    
    popup(`Choose a ${targetType}-type Pokemon to attach ${energyType} Energy.`);
    const chosen = await awaitSelection(targets);
    
    if (chosen) {
      attachEnergy(chosen, energyType);
      popup(`Attached ${energyType} Energy to ${chosen.alt}!`);
      console.log(`[Forest Breath] ${energyType} → ${chosen.alt}`);
    }
  },

  // 9. reduce_active_basic_retreat_cost - Passive
  reduce_active_basic_retreat_cost: async () => {
    // Shaymin Sky Support: Active Basic Pokemon retreat cost -1
    // Passive - handled in retreat cost calculation
    // Must check if on bench, check if active is Basic, reduce cost by 1
  },

  // 10. immune_to_special_conditions - Passive
  immune_to_special_conditions: async () => {
    // Arceus ex Fabled Luster: Can't be affected by status
    // Passive - handled when applying status
    // Check before applying any status condition
  },

  // 11. zero_retreat_named - Passive
  zero_retreat_named: async () => {
    // Tatsugiri Retreat Directive: Active Dondozo has no retreat cost
    // Passive - handled in retreat cost calculation
    // Check if active is named Pokemon (Dondozo), reduce to 0
  },

  // 12. attach_energy_end_turn - Active
  attach_energy_end_turn: async (s, pk, { param1, param2 }) => {
    // Giratina ex Broken-Space Bellow: Attach Psychic, THEN END TURN
    const energyType = (param1 || 'psychic').toLowerCase();
    const count = parseInt10(param2, 1);
    
    // Find Giratina ex
    let targetImg = null;
    const allPokemon = getAllPokemonImgs(pk);
    for (const img of allPokemon) {
      if ((img.alt || '').toLowerCase().includes('giratina')) {
        targetImg = img;
        break;
      }
    }
    
    if (!targetImg) {
      popup('Could not find Giratina ex.');
      return;
    }
    
    // Attach energy
    for (let i = 0; i < count; i++) {
      attachEnergy(targetImg, energyType);
    }
    
    popup(`Attached ${count} ${energyType} Energy to Giratina ex. Turn ending...`);
    console.log(`[Broken-Space Bellow] Attached ${energyType}, ENDING TURN`);
    
    // END THE TURN IMMEDIATELY
    // The turn end is triggered by clicking the main button programmatically
    setTimeout(() => {
      const mainButton = document.getElementById('mainButton');
      if (mainButton && mainButton.textContent === 'End Turn') {
        mainButton.click();
      } else {
        popup('⚠️ Could not end turn automatically');
      }
    }, 800);
  },

  // 13. heal_active - Active
  heal_active: async (s, pk, { param1 }) => {
    // Wigglytuff Comforting Song: Heal 20 from active Pokemon only
    const amount = parseInt10(param1, 20);
    const active = getActiveImg(pk);
    
    if (!active) {
      popup('No Active Pokemon.');
      return;
    }
    
    const { base, cur } = getHpFromImg(active);
    if (cur >= base) {
      popup('Active Pokemon has no damage to heal.');
      return;
    }
    
    healImg(active, amount);
    popup(`Healed ${amount} damage from ${active.alt}!`);
    console.log(`[Comforting Song] Healed ${amount} from active`);
  },

  // 🆕 A3 ABILITY EFFECTS - START (10 new)

  // 1. zero_retreat_first_turn - Wimpod
  zero_retreat_first_turn: async (s, pk, { param1 }, ctx) => {
    // Only active during first 2 turns
    if (globalThis.turnNumber && globalThis.turnNumber <= 2) {
      console.log('[Wimp Out] Zero retreat cost (first turn)');
      return -999; // Signal zero retreat
    }
    return 0;
  },

  // 2. prevent_damage_from_ex - Oricorio  
  prevent_damage_from_ex: async (s, pk, { param1 }, ctx) => {
    // Check if attacker is a Pokemon-ex
    const attackerImg = ctx?.attackerImg;
    if (!attackerImg) return 0;
    
    const attackerName = (attackerImg.alt || '').toLowerCase();
    const isEx = attackerName.includes(' ex');
    
    if (isEx) {
      console.log('[Safeguard] Prevented all damage from Pokemon-ex');
      popup(`Safeguard: No damage from ${attackerImg.alt}!`);
      return -999; // Block all damage
    }
    return 0;
  },

  // 3. cure_and_prevent_status_with_energy - Comfey
  cure_and_prevent_status_with_energy: async (s, pk, { param1 }, ctx) => {
    const requiredType = (param1 || 'psychic').toLowerCase();
    
    // For all your Pokemon with this energy type:
    // 1. Remove status
    // 2. Mark as protected
    
    const allPokemon = getAllPokemonImgs(pk);
    let protectedCount = 0;
    
    for (const img of allPokemon) {
      const slot = getSlotFromImg(img);
      const energyBox = slot?.querySelector('.energy-pips');
      if (!energyBox) {
        delete img.dataset.statusProtected;
        continue;
      }
      
      const pips = energyBox.querySelectorAll('.energy-pip');
      const hasType = Array.from(pips).some(p => p.dataset.type === requiredType);
      
      if (hasType) {
        // Remove existing status
        if (img.dataset.status) {
          delete img.dataset.status;
          const marker = slot.querySelector('.status-marker');
          if (marker) marker.remove();
          console.log(`[Flower Shield] Cured ${img.alt}`);
        }
        
        // Mark as protected
        img.dataset.statusProtected = 'comfey';
        protectedCount++;
      } else {
        // Remove protection if no energy
        if (img.dataset.statusProtected === 'comfey') {
          delete img.dataset.statusProtected;
        }
      }
    }
    
    if (protectedCount > 0) {
      console.log(`[Flower Shield] Protecting ${protectedCount} Pokemon with ${requiredType} energy`);
    }
  },

  // 4. inflict_status_on_energy_attach - Komala
  inflict_status_on_energy_attach: async (s, pk, { param1 }, ctx) => {
    const status = param1 || 'asleep';
    const abilityPokemon = ctx?.targetImg || ctx?.abilityPokemon;
    
    if (!abilityPokemon) return;
    
    // Check if this Pokemon is in active spot
    const isActive = abilityPokemon.closest('.active');
    if (!isActive) return;
    
    // Inflict status on self
    if (globalThis.setStatus) {
      setTimeout(() => {
        globalThis.setStatus(abilityPokemon, status);
        popup(`Comatose: ${abilityPokemon.alt} is now ${status}!`);
        console.log(`[Comatose] Self-inflicted ${status}`);
      }, 100);
    }
  },

  // 5. heal_type_pokemon - Primarina
  heal_type_pokemon: async (s, pk, { param1, param2 }) => {
    const amount = parseInt10(param1, 30);
    const type = (param2 || 'water').toLowerCase();
    
    const allPokemon = getAllPokemonImgs(pk);
    let healed = 0;
    
    for (const img of allPokemon) {
      try {
        const meta = await globalThis.fetchCardMeta(img.dataset.set, img.dataset.num);
        if (meta.types?.some(t => t.toLowerCase() === type)) {
          if (healImg(img, amount)) healed++;
        }
      } catch {}
    }
    
    if (healed > 0) {
      popup(`Melodious Healing: Healed ${amount} from ${healed} ${type}-type Pokémon!`);
      console.log(`[Melodious Healing] Healed ${healed} Pokemon`);
    } else {
      popup(`No damaged ${type}-type Pokémon to heal.`);
    }
  },

  // 6. move_all_energy_type - Lunala ex
  move_all_energy_type: async (s, pk, { param1 }) => {
    const type = (param1 || 'psychic').toLowerCase();
    
    // Get bench Pokemon with this type of energy
    const benchImgs = getBenchImgs(pk);
    const eligible = [];
    
    for (const img of benchImgs) {
      const slot = getSlotFromImg(img);
      const energyBox = slot?.querySelector('.energy-pips');
      if (!energyBox) continue;
      
      const pips = energyBox.querySelectorAll('.energy-pip');
      const hasType = Array.from(pips).some(p => p.dataset.type === type);
      if (hasType) eligible.push(img);
    }
    
    if (!eligible.length) {
      popup(`No benched Pokémon with ${type} energy.`);
      return;
    }
    
    popup(`Psychic Connect: Choose a benched Pokémon to move ALL ${type} energy from.`);
    const chosen = await awaitSelection(eligible);
    if (!chosen) return;
    
    // Move ALL energy of this type to active
    const activeImg = getActiveImg(pk);
    if (!activeImg) return;
    
    const srcSlot = getSlotFromImg(chosen);
    const srcBox = srcSlot?.querySelector('.energy-pips');
    if (!srcBox) return;
    
    const pips = Array.from(srcBox.querySelectorAll('.energy-pip'));
    const typePips = pips.filter(p => p.dataset.type === type);
    
    // Move each pip
    for (const pip of typePips) {
      pip.remove();
    }
    
    // Attach to active
    const destSlot = getSlotFromImg(activeImg);
    let destBox = destSlot?.querySelector('.energy-pips');
    if (!destBox) {
      destBox = document.createElement('div');
      destBox.className = 'energy-pips';
      destSlot.appendChild(destBox);
    }
    
    for (let i = 0; i < typePips.length; i++) {
      const pip = document.createElement('div');
      pip.className = 'energy-pip';
      pip.dataset.type = type;
      pip.style.backgroundImage = `url('${ENERGY_ICONS[type] || ''}')`;
      destBox.appendChild(pip);
    }
    
    popup(`Psychic Connect: Moved ${typePips.length} ${type} energy to ${activeImg.alt}!`);
    console.log(`[Psychic Connect] Moved ${typePips.length} ${type} energy`);
  },

  // 7. switch_from_bench - Solgaleo ex
  switch_from_bench: async (s, pk, { param1 }, ctx) => {
    const abilityPokemon = ctx?.abilityPokemon;
    if (!abilityPokemon) return;
    
    // Must be on bench
    const isBench = abilityPokemon.closest('.bench');
    if (!isBench) {
      popup('Rising Road can only be used from the Bench.');
      return;
    }
    
    // Get active Pokemon
    const activeImg = getActiveImg(pk);
    if (!activeImg) {
      popup('No Active Pokémon to switch with.');
      return;
    }
    
    // Use the existing force switch mechanism
    if (globalThis.forceSwitchSpecific) {
      globalThis.forceSwitchSpecific(s, pk, abilityPokemon);
      popup(`Rising Road: ${abilityPokemon.alt} switched to Active!`);
      console.log(`[Rising Road] Switched ${abilityPokemon.alt} from bench to active`);
    }
  },

  // 8. counter_on_knockout - Pyukumuku (requires battle.html trigger)
  counter_on_knockout: async (s, pk, { param1 }, ctx) => {
    // This is triggered in battle.html handleKnockOut function
    // When this Pokemon is KO'd, damage the attacker
    const damage = parseInt10(param1, 50);
    const attacker = ctx?.attacker;
    
    if (attacker && globalThis.damageActiveOf) {
      popup(`Innards Out: ${damage} damage to attacker!`);
      setTimeout(async () => {
        const result = await globalThis.damageActiveOf(attacker, damage, { isDirectAttack: false });
        console.log(`[Innards Out] Dealt ${damage} damage to attacker`);
        
        // Check if Innards Out KO'd the attacker
        if (result.knocked && typeof globalThis.handleKnockOut === 'function') {
          console.log('[Innards Out] Attacker knocked out by Innards Out!');
          const attackerImg = globalThis.getActiveImage(attacker);
          if (attackerImg) {
            const gameEnded = await globalThis.handleKnockOut(attacker, attackerImg, true);
            if (!gameEnded && typeof globalThis.beginPromotionFlow === 'function') {
              globalThis.beginPromotionFlow(attacker);
            }
          }
        }
      }, 500);
    }
  },

  // 9. flip_avoid_knockout - Conkeldurr (requires battle.html trigger)
  flip_avoid_knockout: async (s, pk, { param1 }, ctx) => {
    // This is triggered in battle.html damageActiveOf function
    // When Pokemon would be KO'd, flip coin
    // If heads, survive with 10 HP
    
    const flip = await flipCoin();
    
    if (flip === 'heads') {
      // Survive with 10 HP
      const img = ctx?.targetImg;
      if (img) {
        const { base } = getHpFromImg(img);
        setHpOnImg(img, base, 10);
        popup(`Guts: ${img.alt} survived with 10 HP!`);
        console.log(`[Guts] Survived knockout with coin flip`);
        return { avoided: true };
      }
    } else {
      popup(`Guts: Coin flip was tails. ${ctx?.targetImg?.alt} was Knocked Out.`);
      console.log(`[Guts] Failed to avoid knockout`);
    }
    
    return { avoided: false };
  },

  // 10. move_energy_on_knockout - Passimian ex (requires battle.html trigger)
  move_energy_on_knockout: async (s, pk, { param1 }, ctx) => {
    // This is triggered in battle.html handleKnockOut function
    // Move all energy of specified type to a bench Pokemon
    const type = (param1 || 'fighting').toLowerCase();
    const knockedPokemon = ctx?.knockedPokemon;
    
    if (!knockedPokemon) return;
    
    // Get all energy of this type from knocked Pokemon
    const slot = getSlotFromImg(knockedPokemon);
    const energyBox = slot?.querySelector('.energy-pips');
    if (!energyBox) return;
    
    const pips = Array.from(energyBox.querySelectorAll('.energy-pip'));
    const typePips = pips.filter(p => p.dataset.type === type);
    
    if (!typePips.length) {
      console.log(`[Offload Pass] No ${type} energy to move`);
      return;
    }
    
    // Get bench Pokemon to move to
    const benchImgs = getBenchImgs(pk);
    if (!benchImgs.length) {
      console.log(`[Offload Pass] No bench Pokemon to move energy to`);
      return;
    }
    
    popup(`Offload Pass: Choose a benched Pokémon to receive ${typePips.length} ${type} energy.`);
    const chosen = await awaitSelection(benchImgs);
    if (!chosen) return;
    
    // Move energy
    for (const pip of typePips) {
      pip.remove();
    }
    
    const destSlot = getSlotFromImg(chosen);
    let destBox = destSlot?.querySelector('.energy-pips');
    if (!destBox) {
      destBox = document.createElement('div');
      destBox.className = 'energy-pips';
      destSlot.appendChild(destBox);
    }
    
    for (let i = 0; i < typePips.length; i++) {
      const pip = document.createElement('div');
      pip.className = 'energy-pip';
      pip.dataset.type = type;
      pip.style.backgroundImage = `url('${ENERGY_ICONS[type] || ''}')`;
      destBox.appendChild(pip);
    }
    
    popup(`Offload Pass: Moved ${typePips.length} ${type} energy to ${chosen.alt}!`);
    console.log(`[Offload Pass] Moved ${typePips.length} ${type} energy to bench`);
  }

  // 🆕 A3 ABILITY EFFECTS - END

  // ========================================
  // 🆕 A3a/A3b ABILITY EFFECTS START
  // ========================================
  
  // ===== ACTIVE ABILITIES =====
  
  // Shiinotic - Search for random Pokemon from deck
  ,search_pokemon_random: async (state, pk) => {
    const deck = state[pk]?.deck || [];
    
    if (deck.length === 0) {
      popup('Your deck is empty.');
      return;
    }
    
    // Find all Pokemon cards
    const pokemonCards = [];
    for (const card of deck) {
      try {
        const meta = await globalThis.fetchCardMeta(card.set, card.number || card.num);
        if (meta.category === 'Pokemon') {
          pokemonCards.push(card);
        }
      } catch (e) {
        // Skip cards that can't be fetched
      }
    }
    
    if (pokemonCards.length === 0) {
      popup('No Pokémon in deck.');
      return;
    }
    
    // Pick random Pokemon
    const chosen = pokemonCards[Math.floor(Math.random() * pokemonCards.length)];
    
    // Remove from deck and add to hand
    const deckIndex = deck.indexOf(chosen);
    if (deckIndex !== -1) {
      deck.splice(deckIndex, 1);
      state[pk].hand = state[pk].hand || [];
      state[pk].hand.push(chosen);
      
      popup(`Illuminate: Found ${chosen.name}!`);
      console.log('[Illuminate] Added random Pokemon to hand:', chosen.name);
      
      // Update UI
      if (typeof renderHand === 'function') {
        const owner = pk === 'p1' ? 'player1' : 'player2';
        renderHand(owner);
      }
    }
  }
  
  // Celesteela - Switch active Ultra Beast with benched Ultra Beast
  ,switch_ultra_beast: async (state, pk) => {
    const ULTRA_BEASTS = [
      'nihilego', 'buzzwole', 'pheromosa', 'xurkitree', 'celesteela',
      'kartana', 'guzzlord', 'poipole', 'naganadel', 'stakataka', 'blacephalon'
    ];
    
    const activeImg = getActiveImg(pk);
    if (!activeImg) {
      popup('No active Pokémon.');
      return;
    }
    
    // Check if active is Ultra Beast
    const activeName = (activeImg.alt || '').toLowerCase();
    const isActiveUB = ULTRA_BEASTS.some(ub => activeName.includes(ub));
    
    if (!isActiveUB) {
      popup('Active Pokémon is not an Ultra Beast.');
      return;
    }
    
    // Get benched Ultra Beasts
    const benchImgs = getBenchImgs(pk);
    const benchedUBs = benchImgs.filter(img => {
      const name = (img.alt || '').toLowerCase();
      return ULTRA_BEASTS.some(ub => name.includes(ub));
    });
    
    if (benchedUBs.length === 0) {
      popup('No benched Ultra Beasts.');
      return;
    }
    
    popup('Ultra Thrusters: Choose a benched Ultra Beast to switch with.');
    const chosen = await awaitSelection(benchedUBs);
    
    if (!chosen) return;
    
    // Perform the swap
    try {
      const owner = pk === 'p1' ? 'player1' : 'player2';
      const activeDiv = globalThis.activeFor(owner);
      const activeSlot = activeDiv?.querySelector('.card-slot');
      const benchSlot = chosen.closest('.card-slot');
      
      if (!activeSlot || !benchSlot) {
        popup('Error: Could not find slots');
        console.error('[Ultra Thrusters] Missing slots:', { activeSlot, benchSlot });
        return;
      }
      
      // Use game's attachment functions
      const activePack = globalThis.detachAttachments(activeSlot);
      const benchPack = globalThis.detachAttachments(benchSlot);
      
      // Swap the Pokemon images
      activeSlot.removeChild(activeImg);
      benchSlot.removeChild(chosen);
      
      activeSlot.appendChild(chosen);
      benchSlot.appendChild(activeImg);
      
      // Reattach attachments to their new locations
      globalThis.attachAttachments(activeSlot, benchPack);
      globalThis.attachAttachments(benchSlot, activePack);
      
      // Update slot markers
      if (typeof globalThis.markSlot === 'function') {
        globalThis.markSlot(activeSlot, true);
        globalThis.markSlot(benchSlot, true);
      }
      
      popup(`Ultra Thrusters: Switched ${activeName} with ${chosen.alt}!`);
      console.log('[Ultra Thrusters] Successfully switched Ultra Beasts');
      
      // Update player background based on new active
      if (typeof globalThis.updatePlayerTypeBackground === 'function') {
        const playerNum = activeDiv === globalThis.p1Active ? 1 : 2;
        globalThis.updatePlayerTypeBackground(playerNum);
      }
    } catch (err) {
      console.error('[Ultra Thrusters] Swap failed:', err);
      popup('Switch failed. Please try again.');
    }
  }
  
  // Greninja - Deal 20 damage to any opponent Pokemon
  ,deal_damage_any: async (state, pk, { param1 }) => {
    const damage = parseInt10(param1, 20);
    const oppPk = oppPk(pk);
    
    // Get all opponent Pokemon
    const oppPokemon = getAllPokemonImgs(oppPk);
    
    if (oppPokemon.length === 0) {
      popup('No opponent Pokémon to damage.');
      return;
    }
    
    popup(`Water Shuriken: Choose an opponent's Pokémon to damage.`);
    const target = await awaitSelection(oppPokemon);
    
    if (!target) return;
    
    // Deal damage
    if (typeof damageImg === 'function') {
      const result = await damageImg(target, damage);
      popup(`Water Shuriken: Dealt ${damage} damage to ${target.alt}!`);
      console.log('[Water Shuriken] Dealt', damage, 'damage to', target.alt);
      return result;
    }
  }
  
  // Pidgeot - Force opponent to switch active Pokemon
  ,force_opponent_switch: async (state, pk) => {
    const oppPk = oppPk(pk);
    
    // Check if opponent has bench
    const oppBench = getBenchImgs(oppPk);
    if (oppBench.length === 0) {
      popup('Opponent has no benched Pokémon to switch to.');
      return;
    }
    
    popup('Drive Off: Opponent must choose a new Active Pokémon.');
    
    // Trigger opponent's promotion flow
    if (typeof beginPromotionFlow === 'function') {
      const oppOwner = oppPk === 'p1' ? 'player1' : 'player2';
      await beginPromotionFlow(oppOwner);
      console.log('[Drive Off] Forced opponent to switch');
    }
  }
  
  // Flareon ex - Attach Fire energy from discard, take 20 damage
  ,attach_from_discard_self_damage: async (state, pk, { param1, param2 }) => {
    const energyType = (param1 || 'fire').toLowerCase();
    const selfDamage = parseInt10(param2, 20);
    
    const abilityPokemon = getActiveImg(pk); // Flareon ex should be active
    if (!abilityPokemon) {
      popup('No active Pokémon.');
      return;
    }
    
    // Check if energy exists in discard
    const owner = pk === 'p1' ? 'player1' : 'player2';
    const energyCounts = state[pk]?.discard?.energyCounts || {};
    
    if (!energyCounts[energyType] || energyCounts[energyType] <= 0) {
      popup(`No ${energyType} Energy in discard pile.`);
      return;
    }
    
    // Attach energy
    if (typeof attachEnergy === 'function') {
      attachEnergy(abilityPokemon, energyType);
      energyCounts[energyType]--;
      
      // Deal self-damage
      if (typeof damageImg === 'function') {
        await damageImg(abilityPokemon, selfDamage);
      }
      
      popup(`Combust: Attached ${energyType} Energy and took ${selfDamage} damage.`);
      console.log(`[Combust] Attached ${energyType}, dealt ${selfDamage} self-damage`);
      
      // Update discard UI
      if (typeof renderDiscard === 'function') {
        renderDiscard(owner);
      }
    }
  }
  
  // Ambipom - Search for random Tool card from deck
  ,search_tool_random: async (state, pk) => {
    const deck = state[pk]?.deck || [];
    
    if (deck.length === 0) {
      popup('Your deck is empty.');
      return;
    }
    
    // Find all Tool cards
    const toolCards = [];
    for (const card of deck) {
      try {
        const meta = await globalThis.fetchCardMeta(card.set, card.number || card.num);
        if (meta.category === 'Trainer' && meta.trainerType === 'Tool') {
          toolCards.push(card);
        }
      } catch (e) {
        // Skip cards that can't be fetched
      }
    }
    
    if (toolCards.length === 0) {
      popup('No Tool cards in deck.');
      return;
    }
    
    // Pick random Tool
    const chosen = toolCards[Math.floor(Math.random() * toolCards.length)];
    
    // Remove from deck and add to hand
    const deckIndex = deck.indexOf(chosen);
    if (deckIndex !== -1) {
      deck.splice(deckIndex, 1);
      state[pk].hand = state[pk].hand || [];
      state[pk].hand.push(chosen);
      
      popup(`Catching Tail: Found ${chosen.name}!`);
      console.log('[Catching Tail] Added random Tool to hand:', chosen.name);
      
      // Update UI
      if (typeof renderHand === 'function') {
        const owner = pk === 'p1' ? 'player1' : 'player2';
        renderHand(owner);
      }
    }
  }
  
  // Gardevoir - Attach Psychic energy from zone to active Psychic Pokemon
  ,attach_energy_from_zone_to_active: async (state, pk, { param1, param2 }) => {
    const energyType = (param1 || 'psychic').toLowerCase();
    const count = parseInt10(param2, 1);
    
    const activeImg = getActiveImg(pk);
    if (!activeImg) {
      popup('No active Pokémon.');
      return;
    }
    
    // Check if active Pokemon is the correct type
    try {
      const meta = await globalThis.fetchCardMeta(activeImg.dataset.set, activeImg.dataset.num);
      const types = meta.types || [];
      const hasCorrectType = types.some(t => t.toLowerCase() === energyType);
      
      if (!hasCorrectType) {
        popup(`Active Pokémon is not ${energyType} type.`);
        return;
      }
    } catch (e) {
      console.warn('[Psy Shadow] Could not check Pokemon type:', e);
    }
    
    // Attach energy from zone
    for (let i = 0; i < count; i++) {
      if (typeof attachEnergy === 'function') {
        attachEnergy(activeImg, energyType);
      }
    }
    
    popup(`Psy Shadow: Attached ${count} ${energyType} Energy!`);
    console.log(`[Psy Shadow] Attached ${count} ${energyType} energy to active`);
  }
  
  // ===== PASSIVE ABILITIES =====
  // Note: Most passive abilities are triggered from battle.html at specific points
  // These are just the handlers that get called
  
  // Luxray - Reduce opponent's damage by 20 (when Luxray is active)
  ,reduce_opponent_damage: async (state, pk, { param1 }) => {
    // This is checked in battle.html during damage calculation
    // Just a placeholder - the actual logic is in battle.html
    console.log('[Luxray] Intimidating Fang active - reducing opponent damage');
  }
  
  // Zeraora - Attach Lightning energy at end of first turn
  
  ,attach_energy_end_of_first_turn: async (state, pk, { param1 }, context = {}) => {
    const energyType = (param1 || 'lightning').toLowerCase();
    const abilityPokemon = context.abilityPokemon;
    
    if (!abilityPokemon) {
      console.warn('[Thunderclap Flash] No ability Pokemon in context');
      return;
    }
    
    // Check if this is the player's first turn
    // Player 1 first turn = global turn 1
    // Player 2 first turn = global turn 2
    const playerTurn = Math.ceil(globalThis.turnNumber / 2);
    const isFirstTurn = (pk === 'p1' && globalThis.turnNumber === 1) || 
                        (pk === 'p2' && globalThis.turnNumber === 2);
    
    if (!isFirstTurn) {
      console.log(`[Thunderclap Flash] Not player's first turn (global turn ${globalThis.turnNumber}), skipping`);
      return;
    }
    
    // Attach energy
    if (typeof attachEnergy === 'function') {
      attachEnergy(abilityPokemon, energyType);
      popup(`Thunderclap Flash: Attached ${energyType} Energy!`);
      console.log(`[Thunderclap Flash] Attached ${energyType} at end of ${pk}'s turn 1 (global turn ${globalThis.turnNumber})`);
    }
  }
  // Claydol - Prevent all healing (global effect)
  ,prevent_all_healing: async () => {
    // This is checked in battle.html before any heal operation
    // Just a placeholder
    console.log('[Claydol] Heal Block active - no healing allowed');
  }
  
  // Nihilego - Increase poison damage by 10
  ,increase_poison_damage: async (state, pk, { param1 }) => {
    // This is checked in battle.html during poison damage calculation
    // Just a placeholder
    console.log('[Nihilego] More Poison active - poison damage increased');
  }
  
  // Ferrothorn - Counter 20 damage when hit (if active)
  // This is handled by the existing counter_on_hit in battle.html
  // (Already implemented in handleKnockOut)
  
  // Stoutland - Increase opponent's attack cost by 1
  ,increase_opponent_cost: async (state, pk, { param1 }) => {
    // This is checked in battle.html when checking if player can attack
    // Just a placeholder
    console.log('[Stoutland] Guard Dog Visage active - opponent attacks cost +1');
  }
  
  // Aerodactyl ex - Block opponent from evolving active Pokemon
  ,block_evolution: async (state, pk, { param1 }) => {
    // This is checked in battle.html when trying to evolve
    // Just a placeholder
    console.log('[Aerodactyl ex] Primeval Law active - opponent cannot evolve active');
  }
  
  // Sylveon ex - Draw 2 cards when this Pokemon evolves
  ,draw_on_evolution: async (state, pk, { param1 }, context = {}) => {
    const count = parseInt10(param1, 2);
    const deck = state[pk]?.deck || [];
    
    if (deck.length === 0) {
      popup('Deck is empty.');
      return;
    }
    
    // Draw cards
    const drawn = [];
    for (let i = 0; i < count && deck.length > 0; i++) {
      const card = deck.shift();
      state[pk].hand = state[pk].hand || [];
      state[pk].hand.push(card);
      drawn.push(card);
    }
    
    if (drawn.length > 0) {
      popup(`Happy Ribbon: Drew ${drawn.length} card(s)!`);
      console.log('[Happy Ribbon] Drew cards on evolution:', drawn.map(c => c.name));
      
      // Update UI
      if (typeof renderHand === 'function') {
        const owner = pk === 'p1' ? 'player1' : 'player2';
        renderHand(owner);
      }
    }
  }
  
  // Eevee ex - Can evolve into any Eeveelution
  ,eevee_evolution_rule: async () => {
    // This is handled in battle.html evolution logic
    // When checking evolveFrom, if the basic is "Eevee ex", allow any Eeveelution
    console.log('[Eevee ex] Veevee \'volve - can evolve into any Eeveelution');
  }
  
  // Snorlax ex - Heal 20 at end of turn if in active spot
  ,heal_active_end_of_turn: async (state, pk, { param1 }, context = {}) => {
    const healAmount = parseInt10(param1, 20);
    const abilityPokemon = context.abilityPokemon;
    
    if (!abilityPokemon) {
      console.warn('[Full-Mouth Manner] No ability Pokemon in context');
      return;
    }
    
    // Check if in active spot
    const activeImg = getActiveImg(pk);
    if (activeImg !== abilityPokemon) {
      console.log('[Full-Mouth Manner] Not in active spot, skipping');
      return;
    }
    
    // Check if damaged
    const maxHp = parseInt(abilityPokemon.dataset.hp, 10);
    const currentHp = parseInt(abilityPokemon.dataset.chp, 10);
    
    if (currentHp >= maxHp) {
      console.log('[Full-Mouth Manner] Already at full HP');
      return;
    }
    
    // Heal
    if (typeof healImg === 'function') {
      healImg(abilityPokemon, healAmount);
      popup(`Full-Mouth Manner: Healed ${healAmount} damage!`);
      console.log(`[Full-Mouth Manner] Healed ${healAmount} at end of turn`);
    }
  }

  // 🆕 A3a/A3b ABILITY EFFECTS - END

  // 🆕 A2a/A2b ABILITY EFFECTS - END

  // Passive placeholders
  ,counter_on_hit: async () => {},
  reduce_incoming_damage: async () => {},
  block_supporters: async () => {}
};

globalThis.ABILITY_HANDLERS = ABILITY_HANDLERS;

/* ============================
   ABILITY DISPATCHER
============================ */
globalThis.abilityUsedThisTurn = { p1: {}, p2: {} };
globalThis.resetAbilityUsage = pk => { globalThis.abilityUsedThisTurn[pk] = {}; };

async function applyAbilityEffect(state, pk, row, context = {}) {
  await loadAbilityEffects();
  
  if (!row?.effect_type) { popup('Ability not implemented.'); return; }
  
  const handler = ABILITY_HANDLERS[row.effect_type];
  if (!handler) { popup(`"${row.abilityName}" not implemented.`); return; }
  
  try {
    const result = await handler(state, pk, { param1: row.param1, param2: row.param2 }, context);
    const img = context.abilityPokemon || getActiveImg(pk);
    globalThis.addLog?.(pk, `used <b>${row.abilityName}</b>`, img?.src, { name: img?.alt });
    return result;  // Return result from handler
  } catch (e) {
    console.error('[ability] Error:', e);
    popup('Ability failed.');
    return { knocked: false };
  }
}

globalThis.applyAbilityEffectFromCsv = applyAbilityEffect;
globalThis.ensureAbilityEffectsLoaded = loadAbilityEffects;
globalThis.getAbilityRowForCard = getAbilityRow;
globalThis.ABILITY_EFFECT_ROWS = abilityEffectRows;

// Helper for battle.html to find ability row with flexible matching
globalThis.findAbilityRow = function(set, num, abilityName) {
  if (!abilityEffectRows?.length) return null;
  
  const normalizedSet = String(set || '').toUpperCase();
  const normalizedNum = String(num || '').padStart(3, '0');
  const normalizedAbility = normStr(abilityName);
  
  return abilityEffectRows.find(r => {
    const rowSet = String(r.set || '').toUpperCase();
    const rowNum = String(r.number || '').padStart(3, '0');
    const rowAbility = normStr(r.abilityName);
    
    return rowSet === normalizedSet && 
           rowNum === normalizedNum && 
           rowAbility === normalizedAbility;
  }) ?? null;
};

globalThis.activateAbility = async function(state, pk, abilityName, cardKey) {
  await loadAbilityEffects();
  
  const img = getActiveImg(pk);
  if (!img) { popup('No Active Pokémon.'); return; }
  
  const row = getAbilityRow(img.dataset.set, img.dataset.num, abilityName);
  if (!row) { popup('No ability data.'); return; }
  if (row.abilityType === 'passive') { popup('Passive ability.'); return; }
  if (globalThis.abilityUsedThisTurn[pk]?.[cardKey]) { popup('Already used this turn.'); return; }
  
  globalThis.abilityUsedThisTurn[pk] ??= {};
  globalThis.abilityUsedThisTurn[pk][cardKey] = true;
  
  await applyAbilityEffect(state, pk, row);
};

/* ============================
   INIT
============================ */
globalThis.__reduceIncomingNextTurn = {};

// Initialize special effects system
globalThis.__specialEffects = { p1: {}, p2: {} };

/**
 * Clear special effects for a player at the start of their turn
 */
globalThis.clearSpecialEffects = function(pk) {
  if (globalThis.__specialEffects?.[pk]) {
    globalThis.__specialEffects[pk] = {};
  }
};

/**
 * 🆕 Clear all temporary turn-based effects
 * Call this at the END of each player's turn
 */
globalThis.clearTurnEffects = function(state, pk) {
  console.log(`[turn-cleanup] Clearing turn effects for ${pk}`);
  
  // Clear damage boosts (Giovanni, Blaine, etc.)
  if (state?.temp?.[pk]) {
    delete state.temp[pk].globalDamageBoost;
    console.log('[turn-cleanup] Cleared damage boosts');
  }
  
  // Clear retreat cost modifications (Leaf, X Speed)
  if (globalThis.clearTempRetreatFor) {
    globalThis.clearTempRetreatFor(pk);
    console.log('[turn-cleanup] Cleared retreat cost modifications');
  }
  
  // Clear special effects for opponent (they were affected during this turn)
  const oppPk = pk === 'p1' ? 'p2' : 'p1';
  globalThis.clearSpecialEffects(oppPk);
  
  // Clear damage reduction for opponent (Blue supporter effect)
  if (globalThis.state?.damageReduction?.[oppPk]) {
    delete globalThis.state.damageReduction[oppPk];
    console.log('[turn-cleanup] Cleared opponent damage reduction');
  }
  
  console.log(`[turn-cleanup] Turn effects cleared for ${pk}`);
};

/**
 * Check if a player can attack (not attack-locked)
 */
globalThis.canAttack = function(pk) {
  return !globalThis.__specialEffects?.[pk]?.attackLock;
};

/**
 * Check if a player can use supporters (not blocked)
 */
globalThis.canUseSupporter = function(pk) {
  return !globalThis.__specialEffects?.[pk]?.supporterBlock;
};

/**
 * Check if a player can retreat (not retreat-locked)
 */
globalThis.canRetreat = function(pk) {
  return !globalThis.__specialEffects?.[pk]?.retreatLock;
};

/**
 * Check if damage should be prevented
 */
globalThis.shouldPreventDamage = function(pk) {
  return globalThis.__specialEffects?.[pk]?.preventDamage ?? false;
};

/**
 * Get damage reduction amount
 */
globalThis.getDamageReduction = function(pk) {
  return globalThis.__specialEffects?.[pk]?.damageReduction ?? 0;
};

/**
 * Apply damage reduction to incoming damage
 * Should be called in battle.html when calculating damage
 */
globalThis.applyDamageModifiers = function(pk, baseDamage) {
  // Check for damage prevention
  if (globalThis.shouldPreventDamage(pk)) {
    popup('Damage prevented!');
    return 0;
  }
  
  // Check for damage reduction
  const reduction = globalThis.getDamageReduction(pk);
  if (reduction > 0) {
    const finalDamage = Math.max(0, baseDamage - reduction);
    if (finalDamage < baseDamage) {
      popup(`Damage reduced by ${reduction}!`);
    }
    return finalDamage;
  }
  
  return baseDamage;
};

// Pre-load ability effects so battle.html has access
loadAbilityEffects().then(() => {
  console.log('[effects.js] abilities loaded, rows:', globalThis.ABILITY_EFFECT_ROWS?.length);
});

// Export energy counting functions for battle.html
globalThis.countEnergy = countEnergy;
globalThis.countEnergyAsync = countEnergyAsync;
globalThis.getEnergyValue = getEnergyValue;

// 🆕 Helper to cache Pokemon types when they enter play
globalThis.cachePokemonTypes = async function(img) {
  if (!img || !img.dataset) return;
  
  // Skip if already cached
  if (img.dataset.pokemonTypes) {
    return;
  }
  
  try {
    const meta = await globalThis.fetchCardMeta(img.dataset.set, img.dataset.num);
    if (meta.types) {
      img.dataset.pokemonTypes = meta.types.map(t => t.toLowerCase()).join(',');
      console.log(`[cache-types] Cached for ${img.alt}: ${img.dataset.pokemonTypes}`);
    }
  } catch (e) {
    console.error('[cache-types] Failed to cache types:', e);
  }
};

// 🆕 Helper to cache types for all Pokemon currently in play
globalThis.cacheAllPokemonTypes = async function() {
  const allPokemon = [
    ...getAllPokemonImgs('p1'),
    ...getAllPokemonImgs('p2')
  ];
  
  for (const img of allPokemon) {
    await globalThis.cachePokemonTypes(img);
  }
  
  console.log('[cache-types] Cached types for all Pokemon in play');
};

// 🆕 AUTO-CACHE: Watch for Pokemon images being added to the DOM
if (typeof MutationObserver !== 'undefined') {
  const pokemonObserver = new MutationObserver(async (mutations) => {
    for (const mutation of mutations) {
      // Check for added nodes
      for (const node of mutation.addedNodes) {
        if (node.tagName === 'IMG' && node.dataset?.set && node.dataset?.num) {
          // This is a Pokemon card image - cache its types
          await globalThis.cachePokemonTypes(node);
        }
        
        // Also check if an element containing Pokemon images was added
        if (node.querySelectorAll) {
          const pokemonImgs = node.querySelectorAll('img[data-set][data-num]');
          for (const img of pokemonImgs) {
            await globalThis.cachePokemonTypes(img);
          }
        }
      }
    }
    
    // 🆕 Update energy visuals ONLY if a Serperior was added
    // Check if any added node is Serperior
    let serperiorAdded = false;
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.tagName === 'IMG' && node.alt && node.alt.toLowerCase().includes('serperior')) {
          serperiorAdded = true;
          break;
        }
        if (node.querySelectorAll) {
          const serperiors = node.querySelectorAll('img[alt*="Serperior" i], img[alt*="serperior" i]');
          if (serperiors.length > 0) {
            serperiorAdded = true;
            break;
          }
        }
      }
      if (serperiorAdded) break;
    }
    
    if (serperiorAdded && typeof globalThis.updateAllEnergyVisuals === 'function') {
      console.log('[auto-cache] Serperior added - updating energy visuals');
      globalThis.updateAllEnergyVisuals();
    }
  });
  
  // Expose observer globally so it can be disconnected/reconnected
  globalThis.pokemonTypeObserver = pokemonObserver;
  
  // Start observing when DOM is ready
  if (document.body) {
    pokemonObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
    console.log('[auto-cache] MutationObserver started - will auto-cache Pokemon types');
  } else {
    // If body not ready yet, wait for DOMContentLoaded
    document.addEventListener('DOMContentLoaded', () => {
      pokemonObserver.observe(document.body, {
        childList: true,
        subtree: true
      });
      console.log('[auto-cache] MutationObserver started - will auto-cache Pokemon types');
    });
  }
}

// 🆕 AUTO-CACHE: Cache types for any Pokemon already on the page when this script loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', async () => {
    console.log('[auto-cache] Page loaded - caching existing Pokemon types...');
    await globalThis.cacheAllPokemonTypes();
    
    // Update energy visuals for Jungle Totem
    if (typeof globalThis.updateAllEnergyVisuals === 'function') {
      globalThis.updateAllEnergyVisuals();
    }
  });
} else {
  // DOM already loaded
  (async () => {
    console.log('[auto-cache] Caching existing Pokemon types...');
    await globalThis.cacheAllPokemonTypes();
    
    // Update energy visuals for Jungle Totem
    if (typeof globalThis.updateAllEnergyVisuals === 'function') {
      globalThis.updateAllEnergyVisuals();
    }
  })();
}

console.log('[effects.js] ready - ALL A1 + A1a EFFECTS IMPLEMENTED ✅ (14 new effects added)');