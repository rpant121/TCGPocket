#!/usr/bin/env python3
import pandas as pd
import re

def match_move_effect(text):
    """Match move effect text to effect_type, param1, param2"""
    if not text or pd.isna(text):
        return None, None, None
    
    text_lower = text.lower()
    
    # Switch effects
    if 'switch this pokémon' in text_lower or 'switch this pokemon' in text_lower:
        if 'with 1 of your benched' in text_lower or 'may switch' in text_lower:
            return 'switch_self_with_bench', '', ''
    
    # Flip coin effects
    if 'flip a coin' in text_lower or 'flip 2 coins' in text_lower or 'flip' in text_lower:
        if 'if heads' in text_lower:
            # Bonus damage on heads
            match = re.search(r'(\d+)\s+more\s+damage', text_lower)
            if match:
                return 'flip_bonus_damage_if_heads', '1', match.group(1)
            # Flip multiplier
            match = re.search(r'flip\s+(\d+)\s+coins', text_lower)
            if match:
                num_coins = match.group(1)
                match_dmg = re.search(r'(\d+)\s+damage\s+for\s+each', text_lower)
                if match_dmg:
                    return 'flip_multiplier', num_coins, match_dmg.group(1)
                match_dmg = re.search(r'(\d+)\s+more\s+damage', text_lower)
                if match_dmg:
                    return 'flip_multiplier_bonus', num_coins, match_dmg.group(1)
        if 'if tails' in text_lower and 'does nothing' in text_lower:
            return 'flip_do_nothing_if_tails', '', ''
    
    # Status effects (check for flip + status combinations first)
    if 'flip a coin' in text_lower and 'poisoned and paralyzed' in text_lower:
        return 'flip_inflict_status_both', 'poisoned_paralyzed', ''
    
    if 'is now burned' in text_lower or 'is now burnt' in text_lower:
        return 'inflict_status', 'burned', ''
    if 'is now poisoned' in text_lower:
        return 'inflict_status', 'poisoned', ''
    if 'is now asleep' in text_lower:
        return 'inflict_status', 'asleep', ''
    if 'is now confused' in text_lower:
        return 'inflict_status', 'confused', ''
    if 'is now paralyzed' in text_lower:
        return 'inflict_status', 'paralyzed', ''
    if 'poisoned and paralyzed' in text_lower:
        return 'inflict_status', 'poisoned_paralyzed', ''
    
    # Heal effects
    if 'heal' in text_lower and 'damage' in text_lower:
        match = re.search(r'heal\s+(\d+)\s+damage', text_lower)
        if match:
            amount = match.group(1)
            if 'from this pokémon' in text_lower or 'from this pokemon' in text_lower:
                return 'heal_self', amount, ''
            if 'from 1 of your benched' in text_lower:
                return 'heal_bench_one', amount, ''
    
    # Damage to bench
    if 'damage to 1 of your opponent' in text_lower or 'damage to 1 of your opponent\'s' in text_lower:
        match = re.search(r'(\d+)\s+damage\s+to\s+1', text_lower)
        if match:
            return 'bench_damage_one', match.group(1), ''
    if 'damage to each of your opponent' in text_lower:
        match = re.search(r'(\d+)\s+damage\s+to\s+each', text_lower)
        if match:
            return 'bench_damage_all_opponent', match.group(1), ''
    
    # Self damage
    if 'also does' in text_lower and 'damage to itself' in text_lower:
        match = re.search(r'(\d+)\s+damage\s+to\s+itself', text_lower)
        if match:
            return 'self_damage_fixed_amount', match.group(1), ''
    
    # Energy effects
    if 'attach' in text_lower and 'energy' in text_lower:
        if 'from your energy zone' in text_lower:
            match = re.search(r'(\{?\w+\}?)\s+energy', text_lower)
            if match:
                energy_type = match.group(1).replace('{', '').replace('}', '').lower()
                if 'to 1 of your benched basic' in text_lower:
                    return 'attach_energy_from_zone', energy_type, ''
                return 'attach_energy_from_zone', energy_type, ''
        if 'discard all' in text_lower and 'energy' in text_lower:
            match = re.search(r'discard\s+all\s+(\{?\w+\}?)\s+energy', text_lower)
            if match:
                energy_type = match.group(1).replace('{', '').replace('}', '').lower()
                return 'discard_energy_specific', energy_type, 'all'
            if 'discard all energy' in text_lower:
                return 'discard_energy_specific', 'all', 'all'
    
    # Bonus damage conditions
    if 'does' in text_lower and 'more damage' in text_lower:
        match = re.search(r'(\d+)\s+more\s+damage', text_lower)
        if match:
            amount = match.group(1)
            if 'if this pokémon has' in text_lower or 'if this pokemon has' in text_lower:
                if 'at least' in text_lower and 'extra' in text_lower and 'energy' in text_lower:
                    match_energy = re.search(r'(\d+)\s+extra\s+(\{?\w+\}?)\s+energy', text_lower)
                    if match_energy:
                        return 'extra_damage_if_extra_energy_attached', f"{match_energy.group(1)}|{amount}", match_energy.group(2).replace('{', '').replace('}', '').lower()
                if 'any' in text_lower and 'energy attached' in text_lower:
                    match_energy = re.search(r'any\s+(\{?\w+\}?)\s+energy', text_lower)
                    if match_energy:
                        energy_type = match_energy.group(1).replace('{', '').replace('}', '').lower()
                        return 'bonus_damage_per_energy_attached', energy_type, amount
            if 'if your opponent\'s active pokémon is' in text_lower:
                if 'poisoned' in text_lower:
                    return 'bonus_damage_if_opponent_poisoned', amount, ''
                if 'evolved' in text_lower:
                    return 'bonus_damage_if_evolution', amount, ''
            if 'if this pokémon has damage' in text_lower:
                return 'bonus_damage_if_damaged', amount, ''
            if 'if' in text_lower and 'on it' in text_lower and 'damage' in text_lower:
                return 'bonus_damage_if_damaged', amount, ''
    
    # Damage based on bench
    if 'damage for each' in text_lower or 'damage to each' in text_lower:
        match = re.search(r'(\d+)\s+damage\s+for\s+each', text_lower)
        if match:
            if 'benched pokémon' in text_lower:
                return 'bonus_damage_for_each_bench', match.group(1), ''
    
    # Damage based on damage on self
    if 'damage equal to the damage this pokémon has' in text_lower or 'damage to your opponent\'s active pokémon equal to the damage this pokémon has' in text_lower:
        return 'damage_equal_to_self_damage', '', ''
    
    # Search effects
    if 'put' in text_lower and 'from your deck' in text_lower:
        if 'random' in text_lower:
            match = re.search(r'(\d+)\s+random\s+(\w+)', text_lower)
            if match:
                pokemon_name = match.group(2).lower()
                return 'search_specific_into_bench', pokemon_name, ''
            match = re.search(r'(\{?\w+\}?)\s+pokémon', text_lower)
            if match:
                pokemon_type = match.group(1).replace('{', '').replace('}', '').lower()
                return 'search_pokemon_type_random', pokemon_type, ''
    
    # Discard from deck
    if 'discard' in text_lower and 'top card' in text_lower:
        if 'of your opponent\'s deck' in text_lower:
            return 'discard_top_opponent_deck', '1', ''
        if 'of your deck' in text_lower:
            match = re.search(r'top\s+(\d+)\s+cards?', text_lower)
            if match:
                return 'discard_top_own_deck', match.group(1), ''
            return 'discard_top_own_deck', '1', ''
    
    # Devolve
    if 'devolve' in text_lower:
        return 'devolve_opponent', '', ''
    
    # Copy attack
    if 'choose' in text_lower and 'attack' in text_lower and 'use it' in text_lower:
        return 'copy_opponent_attack', '', ''
    
    # Prevent actions
    if 'can\'t use' in text_lower or 'cannot use' in text_lower:
        if 'supporter' in text_lower:
            return 'prevent_supporter_next_turn', '', ''
    
    # Discard tool cards
    if 'discard' in text_lower and 'tool' in text_lower:
        match = re.search(r'discard\s+up\s+to\s+(\d+)', text_lower)
        if match:
            return 'discard_tools_for_damage', match.group(1), ''
    
    # End of turn damage
    if 'end of your opponent\'s next turn' in text_lower and 'damage' in text_lower:
        match = re.search(r'(\d+)\s+damage', text_lower)
        if match:
            return 'damage_end_of_opponent_turn', match.group(1), ''
    
    # Damage if specific pokemon
    if 'if your opponent\'s active pokémon is' in text_lower:
        match = re.search(r'is\s+(\w+)', text_lower)
        if match:
            pokemon_name = match.group(1).lower()
            if 'more damage' in text_lower:
                match_dmg = re.search(r'(\d+)\s+more\s+damage', text_lower)
                if match_dmg:
                    return 'bonus_damage_if_named_opponent', pokemon_name, match_dmg.group(1)
    
    # Damage if different energy types
    if '2 or more different types of energy' in text_lower:
        match = re.search(r'(\d+)\s+more\s+damage', text_lower)
        if match:
            return 'bonus_damage_if_multiple_energy_types', match.group(1), ''
    
    # Damage stacking
    if 'this effect stacks' in text_lower:
        match = re.search(r'\+(\d+)\s+damage', text_lower)
        if match:
            return 'stacking_damage_boost', match.group(1), ''
    
    # Reduce energy cost if damaged
    if 'can be used for' in text_lower and 'energy' in text_lower:
        if 'has damage' in text_lower:
            match = re.search(r'(\d+)\s+(\{?\w+\}?)\s+energy', text_lower)
            if match:
                energy_type = match.group(2).replace('{', '').replace('}', '').lower()
                return 'reduce_energy_cost_if_damaged', f"{match.group(1)}|{energy_type}", ''
    
    # Bonus damage if named pokemon on bench
    if 'if' in text_lower and 'is on your bench' in text_lower:
        match = re.search(r'if\s+(\w+)\s+is\s+on\s+your\s+bench', text_lower)
        if match:
            pokemon_name = match.group(1).lower()
            match_dmg = re.search(r'(\d+)\s+more\s+damage', text_lower)
            if match_dmg:
                return 'bonus_damage_if_named_bench', pokemon_name, match_dmg.group(1)
    
    # Flip both heads
    if 'flip 2 coins' in text_lower and 'both' in text_lower and 'heads' in text_lower:
        match = re.search(r'(\d+)\s+more\s+damage', text_lower)
        if match:
            return 'flip_both_heads_bonus', match.group(1), ''
    
    # Discard energy specific type
    if 'discard all' in text_lower and 'energy' in text_lower:
        match = re.search(r'discard\s+all\s+(\{?\w+\}?)\s+energy', text_lower)
        if match:
            energy_type = match.group(1).replace('{', '').replace('}', '').lower()
            return 'discard_energy_specific', energy_type, 'all'
        if 'discard all energy from this pokémon' in text_lower:
            return 'discard_energy_specific', 'all', 'all'
    
    return None, None, None

def match_ability_effect(text):
    """Match ability effect text to effect_type, param1, param2"""
    if not text or pd.isna(text):
        return None, None, None
    
    text_lower = text.lower()
    
    # Draw card effects
    if 'draw a card' in text_lower or 'draw 1 card' in text_lower:
        if 'end of your turn' in text_lower and 'active spot' in text_lower:
            return 'draw_card_end_of_turn', '', ''
    
    # Heal effects
    if 'heal' in text_lower and 'damage' in text_lower:
        match = re.search(r'heal\s+(\d+)\s+damage', text_lower)
        if match:
            amount = match.group(1)
            if 'from 1 of your' in text_lower:
                match_type = re.search(r'(\{?\w+\}?)\s+pokémon', text_lower)
                if match_type:
                    pokemon_type = match_type.group(1).replace('{', '').replace('}', '').lower()
                    return 'heal', amount, pokemon_type
                return 'heal', amount, ''
            if 'from this pokémon' in text_lower or 'from this pokemon' in text_lower:
                return 'heal', amount, ''
    
    # Reveal hand
    if 'reveal their hand' in text_lower or 'reveal your opponent\'s hand' in text_lower:
        return 'reveal_opponent_hand', '', ''
    
    # Counterattack/KO effects
    if 'knocked out' in text_lower and 'damage' in text_lower:
        if 'do' in text_lower or 'does' in text_lower:
            match = re.search(r'(\d+)\s+damage\s+to\s+the\s+attacking', text_lower)
            if match:
                return 'counter_on_ko', match.group(1), ''
        if 'flip a coin' in text_lower:
            if 'if heads' in text_lower and 'knocked out' in text_lower:
                return 'flip_ko_attacker_on_ko', '', ''
    
    # Counterattack on damage
    if 'damaged by an attack' in text_lower and 'do' in text_lower:
        match = re.search(r'(\d+)\s+damage\s+to\s+the\s+attacking', text_lower)
        if match:
            return 'counter_on_hit', match.group(1), ''
    
    # Reduce damage
    if 'takes' in text_lower and 'damage from attacks' in text_lower:
        match = re.search(r'−?(\d+)\s+damage', text_lower)
        if match:
            return 'reduce_incoming_damage', match.group(1), ''
    
    # No retreat cost
    if 'no retreat cost' in text_lower or 'retreat cost is 0' in text_lower:
        if 'if' in text_lower:
            match = re.search(r'if\s+you\s+have\s+(\w+)', text_lower)
            if match:
                return 'remove_retreat_cost_if_named', match.group(1).lower(), ''
        return 'remove_retreat_cost', '', ''
    
    # Prevent damage/effects
    if 'prevent all damage' in text_lower and 'effects' in text_lower:
        if 'next turn' in text_lower:
            return 'prevent_damage_and_effects_next_turn', '', ''
    
    return None, None, None

def match_trainer_effect(text):
    """Match trainer effect text to effect_type, param1, param2"""
    if not text or pd.isna(text):
        return None, None, None
    
    text_lower = text.lower()
    
    # Reduce retreat cost (Tool)
    if 'retreat cost' in text_lower and 'less' in text_lower:
        match = re.search(r'(\d+)\s+less', text_lower)
        if match:
            match_type = re.search(r'(\{?\w+\}?)\s+pokémon', text_lower)
            if match_type:
                pokemon_type = match_type.group(1).replace('{', '').replace('}', '').lower()
                return 'reduce_retreat_cost', pokemon_type, match.group(1)
    
    # Use previous evolution attacks (Tool)
    if 'use any attack from its previous evolutions' in text_lower:
        return 'use_previous_evolution_attacks', '', ''
    
    # Heal and remove status
    if 'heal' in text_lower and 'damage' in text_lower:
        match = re.search(r'heal\s+(\d+)\s+damage', text_lower)
        if match:
            amount = match.group(1)
            if 'recovers from' in text_lower:
                return 'heal_and_remove_status', amount, ''
    
    # Search deck
    if 'look at the top' in text_lower and 'cards of your deck' in text_lower:
        match = re.search(r'top\s+(\d+)\s+cards', text_lower)
        if match:
            num_cards = match.group(1)
            if 'put all' in text_lower and 'tool' in text_lower:
                return 'search_tools_into_hand', num_cards, ''
    
    # Reorder opponent deck
    if 'look at' in text_lower and 'cards from the top of your opponent\'s deck' in text_lower:
        match = re.search(r'look\s+at\s+that\s+many', text_lower)
        if match:
            if 'put them back in any order' in text_lower:
                return 'reorder_opponent_deck', '', ''
    
    return None, None, None

def main():
    print("Filling A4a CSV files...")
    
    # Read CSV files
    move_df = pd.read_csv('a4a_move_effects.csv')
    ability_df = pd.read_csv('a4a_ability_effects.csv')
    trainer_df = pd.read_csv('a4a_trainer_effects.csv')
    
    # Fill move effects
    print("\nProcessing move effects...")
    for idx, row in move_df.iterrows():
        if pd.isna(row['effect_type']) or row['effect_type'] == '':
            effect_type, param1, param2 = match_move_effect(row['text'])
            if effect_type:
                move_df.at[idx, 'effect_type'] = effect_type
                move_df.at[idx, 'param1'] = param1 if param1 else ''
                move_df.at[idx, 'param2'] = param2 if param2 else ''
                print(f"  {row['pokemonName']} - {row['attackName']}: {effect_type}")
    
    # Fill ability effects
    print("\nProcessing ability effects...")
    for idx, row in ability_df.iterrows():
        if pd.isna(row['effect_type']) or row['effect_type'] == '':
            effect_type, param1, param2 = match_ability_effect(row['text'])
            if effect_type:
                ability_df.at[idx, 'effect_type'] = effect_type
                ability_df.at[idx, 'param1'] = param1 if param1 else ''
                ability_df.at[idx, 'param2'] = param2 if param2 else ''
                print(f"  {row['pokemonName']} - {row['abilityName']}: {effect_type}")
    
    # Fill trainer effects
    print("\nProcessing trainer effects...")
    for idx, row in trainer_df.iterrows():
        if pd.isna(row['effect_type']) or row['effect_type'] == '':
            effect_type, param1, param2 = match_trainer_effect(row['text'])
            if effect_type:
                trainer_df.at[idx, 'effect_type'] = effect_type
                trainer_df.at[idx, 'param1'] = param1 if param1 else ''
                trainer_df.at[idx, 'param2'] = param2 if param2 else ''
                print(f"  {row['trainerName']}: {effect_type}")
    
    # Write back
    move_df.to_csv('a4a_move_effects.csv', index=False)
    ability_df.to_csv('a4a_ability_effects.csv', index=False)
    trainer_df.to_csv('a4a_trainer_effects.csv', index=False)
    
    print("\nDone! CSV files updated.")

if __name__ == '__main__':
    main()

