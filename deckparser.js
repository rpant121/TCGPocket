// deckParser.js
// Parses Pokémon TCG Pocket deck text and fetches card images from TCGdex

let pocketSets = new Set();
let pocketSetsLoaded = false;
let pocketSetsLoading = null;

/** Load all valid Pocket sets from the tcgp series */
export async function loadPocketSets() {
  // Return existing promise if already loading
  if (pocketSetsLoading) return pocketSetsLoading;
  
  // Return immediately if already loaded
  if (pocketSetsLoaded && pocketSets.size > 0) return;
  
  // Create and cache the loading promise
  pocketSetsLoading = (async () => {
    const res = await fetch('https://api.tcgdex.net/v2/en/series/tcgp');
    const data = await res.json();
    pocketSets = new Set(data.sets.map((s) => s.id));
    pocketSetsLoaded = true;
    pocketSetsLoading = null;
  })();
  
  return pocketSetsLoading;
}

/** Parse Limitless-style text into structured objects */
export function parseDecklist(text) {
  const pattern = /^(\d+)\s+([\wÉé'\-\s]+)\s+([A-Za-z0-9\-]+)\s+(\d+)$/;
  const lines = text.split(/\r?\n/);
  const cards = [];

  for (const line of lines) {
    let trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    if (trimmed.includes(":")) {
      trimmed = trimmed.replace(":", "");
    }
    const match = trimmed.match(pattern);
    if (match) {
      const [_, qty, name, set, num] = match;
      cards.push({
        quantity: Number(qty),
        name: name.trim(),
        set: set.trim(),
        number: num.trim(),
      });
    }
  }
  return cards;
}

const cache = {};

/** Fetch metadata for a single card */
export async function fetchCardData(card) {
  if (!pocketSets.size) await loadPocketSets();

  if (!pocketSets.has(card.set)) {
    console.warn(`Skipping ${card.set}-${card.number}: not part of Pocket series.`);
    return { ...card, image: '', missing: true };
  }

  const key = `${card.set}-${card.number}`;
  if (cache[key]) return cache[key];

  const url = `https://api.tcgdex.net/v2/en/sets/${card.set}/${card.number}`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error();
    const data = await res.json();
    const result = {
      ...card,
      image: data.image + "/high.png"|| '',
      rarity: data.rarity || '',
      hp: data.hp || '',
      cardType: data.category || '',
      name: data.name || card.name,
    };
    cache[key] = result;
    return result;
  } catch {
    console.warn(`Missing card data: ${card.set}-${card.number}`);
    return { ...card, image: '', missing: true };
  }
}
