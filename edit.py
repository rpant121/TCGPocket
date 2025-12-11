import pandas as pd

attacks = pd.read_csv("a2_attack_effects.csv")

effects = attacks[attacks.get("effect_text").notna()].drop("extra", axis = 1)
effects[["set","number","pokemonName","attackName","effect_type","param1","param2","effect_text","damageBase","damageNotation"]]

effects.to_csv("a2_move_effects.csv")