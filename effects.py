#!/usr/bin/env python3
import requests
import pandas as pd
import urllib3

# Disable SSL warnings for development (certificate chain issue)
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

SET_ID = "B1"
BASE_URL = f"https://api.tcgdex.net/v2/en/sets/{SET_ID}"
MOVE_EFFECTS_FILE = f"{SET_ID.lower()}_move_effects.csv"
ABILITY_EFFECTS_FILE = f"{SET_ID.lower()}_ability_effects.csv"
TRAINER_EFFECTS_FILE = f"{SET_ID.lower()}_trainer_effects.csv"


def fetch_json(url):
    try:
        # Disable SSL verification for development (certificate chain issue)
        return requests.get(url, verify=False).json()
    except Exception as e:
        print(f"Failed to fetch {url}: {e}")
        return None


def main():
    print(f"Fetching set metadata for {SET_ID}...")
    data = fetch_json(BASE_URL)
    if not data or "cards" not in data:
        print("Error: Could not load set data.")
        return

    cards = data["cards"]
    print(f"Found {len(cards)} card references.")

    move_rows = []
    ability_rows = []
    trainer_rows = []

    for ref in cards:
        local_id = ref.get("localId") or ref.get("id")
        card_url = f"{BASE_URL}/{local_id}"
        card = fetch_json(card_url)

        if not card:
            continue

        category = card.get("category")
        number = card.get("localId") or card.get("number") or ""

        # ===== POKEMON CARDS: MOVES AND ABILITIES =====
        if category == "Pokemon":
            pokemon_name = (card.get("name") or "").replace(",", " ")

            # MOVES/ATTACKS
            attacks = card.get("attacks", [])
            for atk in attacks:
                attack_name = (atk.get("name") or "").replace(",", " ")
                effect_text = atk.get("effect") or ""
                effect_text = effect_text.replace("\n", " ")

                damage = atk.get("damage") or ""
                damage_str = str(damage)
                damage_base = ''.join(c for c in damage_str if c.isdigit()) or ""
                damage_notation = damage_str

                if effect_text:
                    print(pokemon_name + " - " + attack_name + ": " + effect_text)
                    move_rows.append({
                        "set": SET_ID,
                        "number": number,
                        "pokemonName": pokemon_name,
                        "attackName": attack_name,
                        "effect_type": "",
                        "param1": "",
                        "param2": "",
                        "text": effect_text,
                        "damageBase": damage_base,
                        "damageNotation": damage_notation
                    })

            # ABILITIES
            abilities = card.get("abilities", [])
            if abilities:
                print(f"{pokemon_name}: {abilities[0]['name']}")
                
                for ab in abilities:
                    ability_name = (ab.get("name") or "").replace(",", " ")
                    effect_text = ab.get("effect") or ""
                    effect_text = effect_text.replace("\n", " ")

                    ability_rows.append({
                        "set": SET_ID,
                        "number": number,
                        "pokemonName": pokemon_name,
                        "abilityName": ability_name,
                        "abilityType": "",     # (passive/active, filled manually later)
                        "effect_type": "",     # handler ID
                        "param1": "",
                        "param2": "",
                        "text": effect_text
                    })

        # ===== TRAINER CARDS =====
        elif category == "Trainer":
            trainer_name = (card.get("name") or "").replace(",", " ")
            trainer_type = card.get("trainerType") or ""   # Item / Supporter / Stadium

            # tcgdex stores trainer effects in `effect` (string) or sometimes a list `effects`
            effect_text = card.get("effect")

            print(f"{trainer_name}: {effect_text}")

            # Normalize
            if isinstance(effect_text, list):
                effect_text = " ".join(effect_text)

            effect_text = (effect_text or "").replace("\n", " ")

            trainer_rows.append({
                "id": SET_ID + '-' + str(number),
                "trainerName": trainer_name,
                "trainerType": trainer_type,
                "effect_type": "",   # fill manually
                "param1": "",
                "param2": "",
                "text": effect_text
            })

    # ===== GENERATE CSVs =====
    print(f"\n{'='*60}")
    print(f"SUMMARY:")
    print(f"  Move Effects: {len(move_rows)}")
    print(f"  Ability Effects: {len(ability_rows)}")
    print(f"  Trainer Effects: {len(trainer_rows)}")
    print(f"{'='*60}\n")

    # Move Effects CSV
    if move_rows:
        df_moves = pd.DataFrame(move_rows)
        df_moves.to_csv(MOVE_EFFECTS_FILE, index=False)
        print(f"CSV generated: {MOVE_EFFECTS_FILE}")
        print(df_moves.head())
        print()

    # Ability Effects CSV
    if ability_rows:
        df_abilities = pd.DataFrame(ability_rows)
        df_abilities.to_csv(ABILITY_EFFECTS_FILE, index=False)
        print(f"CSV generated: {ABILITY_EFFECTS_FILE}")
        print(df_abilities.head())
        print()

    # Trainer Effects CSV
    if trainer_rows:
        df_trainers = pd.DataFrame(trainer_rows)
        df_trainers.to_csv(TRAINER_EFFECTS_FILE, index=False)
        print(f"CSV generated: {TRAINER_EFFECTS_FILE}")
        print(df_trainers.head())
        print()

    print(f"{'='*60}")
    print(f"All CSVs generated successfully!")
    print(f"{'='*60}")


main()