# New Effects Analysis: CSV Files vs Existing Implementation

This document compares all effect types found in the CSV files (`ability_effects.csv`, `trainer_effects.csv`, `move_effects.csv`) against what's already implemented in `effects.js`.

---

## ABILITY EFFECTS

### ✅ Already Implemented (Existing Handlers)

These ability effects already have handlers in `ABILITY_HANDLERS`:

1. **heal_all** - Heal damage from all Pokémon
2. **force_switch_opponent_basic** - Force opponent to switch in a Basic Pokémon
3. **deal_damage_any** - Deal damage to any opponent Pokémon
4. **attach_energy_from_zone** - Attach energy from Energy Zone
5. **attach_energy_from_zone_to_active** - Attach energy from zone to active Pokémon
6. **attach_energy_from_zone_to_type** - Attach energy from zone to specific type
7. **attach_from_discard_self_damage** - Attach from discard with self damage
8. **block_supporters** - Block opponent from using Supporters
9. **flip_inflict_status** - Flip coin to inflict status condition
10. **inflict_status** - Inflict status condition directly
11. **counter_on_hit** - Counter damage when hit
12. **reduce_incoming_damage** - Reduce incoming damage
13. **force_opponent_switch** - Force opponent to switch
14. **peek_topdeck** - Look at top card of deck
15. **double_energy_type** - Double energy type (Jungle Totem)
16. **move_energy_type_to_active** - Move energy type to active
17. **block_evolution** - Block evolution
18. **reduce_damage_from_types** - Reduce damage from specific types
19. **block_attack_effects** - Block attack effects
20. **move_all_damage** - Move all damage
21. **zero_retreat_if_energy** - Zero retreat if energy attached
22. **boost_type_damage** - Boost damage for specific type
23. **damage_on_energy_attach** - Damage when energy attached
24. **flip_reduce_damage** - Flip to reduce damage
25. **discard_to_draw** - Discard to draw cards
26. **boost_damage_if_arceus** - Boost damage if Arceus in play
27. **attach_energy_from_zone_to_type** - Attach energy from zone to type
28. **zero_retreat_if_arceus** - Zero retreat if Arceus in play
29. **reduce_attack_cost_if_arceus** - Reduce attack cost if Arceus
30. **damage_during_checkup** - Damage during checkup
31. **reduce_damage_if_arceus** - Reduce damage if Arceus
32. **deal_damage_if_arceus** - Deal damage if Arceus
33. **peek_topdeck_either_player** - Peek topdeck of either player
34. **reduce_active_basic_retreat_cost** - Reduce active basic retreat cost
35. **immune_to_special_conditions** - Immune to special conditions

### 🆕 New Ability Effects (Need Implementation)

These ability effects are in the CSV but **NOT** yet implemented:

1. **heal** - Heal damage from a Pokémon (different from heal_all)
2. **heal_active** - Heal active Pokémon
3. **heal_active_end_of_turn** - Heal active at end of turn
4. **heal_type_pokemon** - Heal Pokémon of specific type
5. **attach_energy_end_of_first_turn** - Attach energy end of first turn
6. **attach_energy_end_turn** - Attach energy at end of turn
7. **attach_energy_to_bench_on_hit** - Attach energy to bench when hit
8. **auto_evolve_on_energy_attach** - Auto evolve when energy attached
9. **counter_inflict_status** - Counter and inflict status
10. **counter_on_knockout** - Counter on knockout
11. **counter_on_ko** - Counter on KO (alias)
12. **cure_and_prevent_status_with_energy** - Cure and prevent status with energy
13. **discard_energy_on_evolution** - Discard energy on evolution
14. **discard_tools_opponent_self** - Discard tools from opponent/self
15. **discard_top_opponent_deck** - Discard top of opponent deck
16. **draw_card_end_of_turn** - Draw card at end of turn
17. **draw_on_evolution** - Draw on evolution
18. **eevee_evolution_rule** - Eevee evolution special rule
19. **flip_avoid_knockout** - Flip to avoid knockout
20. **flip_force_switch_opponent_basic** - Flip to force switch opponent basic
21. **flip_ko_attacker_on_ko** - Flip KO attacker on KO
22. **flip_no_points_on_ko** - Flip no points on KO
23. **flip_prevent_damage** - Flip to prevent damage
24. **increase_max_hp_type** - Increase max HP for type
25. **increase_opponent_cost** - Increase opponent energy cost
26. **increase_poison_damage** - Increase poison damage
27. **inflict_status_on_energy_attach** - Inflict status on energy attach
28. **move_all_energy_type** - Move all energy of type
29. **move_all_energy_type_to_self** - Move all energy type to self
30. **move_energy_on_knockout** - Move energy on knockout
31. **prevent_all_healing** - Prevent all healing
32. **prevent_damage_and_effects_next_turn** - Prevent damage/effects next turn
33. **prevent_damage_from_ex** - Prevent damage from ex
34. **prevent_status** - Prevent status conditions
35. **reduce_all_damage** - Reduce all damage
36. **reduce_energy_cost** - Reduce energy cost
37. **reduce_incoming_damage_if_full_hp** - Reduce damage if full HP
38. **reduce_opponent_damage** - Reduce opponent damage
39. **remove_retreat_cost** - Remove retreat cost
40. **remove_retreat_cost_if_named** - Remove retreat cost if named
41. **reveal_opponent_hand** - Reveal opponent hand
42. **search_pokemon_random** - Search random Pokémon
43. **search_supporter_from_discard_on_evolution** - Search supporter from discard on evolution
44. **search_tool_random** - Search random tool
45. **switch_from_bench** - Switch from bench
46. **switch_type_with_bench** - Switch type with bench
47. **switch_ultra_beast** - Switch ultra beast
48. **zero_retreat_first_turn** - Zero retreat first turn
49. **zero_retreat_named** - Zero retreat if named
50. **allow_evolution_first_turn** - Allow evolution first turn
51. **boost_damage** - Boost damage (generic)
52. **boost_type_damage_multiple** - Boost type damage multiple

---

## TRAINER EFFECTS

### ✅ Already Implemented (Existing Handlers)

These trainer effects already have handlers in `TRAINER_EFFECTS`:

1. **heal** - Heal damage
2. **heal_type** - Heal type Pokémon
3. **flip_attach_energy** - Flip to attach energy
4. **boost_damage_type_targets** - Boost damage for type targets
5. **boost_all_damage** - Boost all damage
6. **return_active_to_hand** - Return active to hand
7. **attach_energy_to_targets** - Attach energy to targets
8. **force_opponent_switch** - Force opponent switch
9. **move_all_energy_type** - Move all energy type
10. **draw_cards** - Draw cards
11. **reduce_retreat_cost** - Reduce retreat cost
12. **reveal_opponent_hand** - Reveal opponent hand
13. **view_top_deck** - View top deck
14. **search_basic_pokemon** - Search basic Pokémon
15. **shuffle_opponent_hand_draw** - Shuffle opponent hand and draw
16. **summon_fossil_pokemon** - Summon fossil Pokémon
17. **peek_topdeck_type** - Peek topdeck type
18. **reduce_all_incoming_damage_next_turn** - Reduce all incoming damage next turn
19. **revive_opponent_pokemon** - Revive opponent Pokémon
20. **increase_max_hp** - Increase max HP
21. **counter_on_hit_tool** - Counter on hit tool
22. **cure_status_end_of_turn** - Cure status end of turn
23. **switch_card_in_hand_with_deck** - Switch card in hand with deck
24. **force_switch_damaged_bench** - Force switch damaged bench
25. **search_named_random** - Search named random
26. **attach_from_discard_to_targets** - Attach from discard to targets
27. **move_energy_bench_to_active** - Move energy bench to active
28. **shuffle_hand_draw_points** - Shuffle hand draw points
29. **heal_all_with_type_energy** - Heal all with type energy
30. **revive_basic_to_hand** - Revive basic to hand
31. **reduce_attack_cost_targets** - Reduce attack cost targets
32. **reduce_type_incoming_damage_next_turn** - Reduce type incoming damage next turn
33. **shuffle_both_hands_draw_same** - Shuffle both hands draw same
34. **heal_and_cure_status** - Heal and cure status
35. **boost_damage_vs_ex** - Boost damage vs ex
36. **flip_discard_energy_until_tails** - Flip discard energy until tails
37. **heal_active_and_cure_random_status** - Heal active and cure random status
38. **revive_type_to_hand** - Revive type to hand
39. **peek_topdeck_optional_shuffle** - Peek topdeck optional shuffle
40. **counter_inflict_status_tool** - Counter inflict status tool
41. **increase_max_hp_type** - Increase max HP type
42. **transfer_damage_named_to_opponent** - Transfer damage named to opponent
43. **return_damaged_type_to_hand** - Return damaged type to hand
44. **attach_energy_to_targets_end_turn** - Attach energy to targets end turn
45. **discard_all_opponent_tools** - Discard all opponent tools
46. **force_opponent_switch_if_named** - Force opponent switch if named
47. **heal_full_discard_energy_named** - Heal full discard energy named
48. **heal_stage** - Heal stage
49. **reduce_all_incoming_damage_next_turn_if_no_points** - Reduce all incoming damage next turn if no points
50. **force_opponent_switch_basic** - Force opponent switch basic
51. **reveal_opponent_supporters** - Reveal opponent supporters
52. **attach_from_discard_ultra_beast_if_points** - Attach from discard ultra beast if points
53. **eevee_boost_or_heal** - Eevee boost or heal
54. **copy_random_opponent_supporter** - Copy random opponent supporter
55. **move_energy_on_knockout_tool** - Move energy on knockout tool
56. **boost_damage_per_point** - Boost damage per point
57. **heal_active_end_of_turn_tool** - Heal active end of turn tool
58. **discard_energy_type_from_opponent** - Discard energy type from opponent
59. **flip_revive_from_discard** - Flip revive from discard
60. **guarantee_coin_flip** - Guarantee coin flip
61. **move_energy_type_multiple** - Move energy type multiple
62. **reduce_incoming_damage** - Reduce incoming damage
63. **rescue_to_hand** - Rescue to hand
64. **shuffle_opponent_hand** - Shuffle opponent hand
65. **switch_active** - Switch active
66. **use_previous_evolution_attacks** - Use previous evolution attacks
67. **heal_and_remove_status** - Heal and remove status
68. **search_tools_into_hand** - Search tools into hand
69. **reorder_opponent_deck** - Reorder opponent deck

### 🆕 New Trainer Effects (Need Implementation)

These trainer effects are in the CSV but **NOT** yet implemented:

1. **attach_energy_to_named** - Attach energy to named Pokémon
2. **attach_from_discard_to_active** - Attach from discard to active
3. **boost_damage_per_point** - Boost damage per point (may be duplicate)
4. **discard_energy_type_from_opponent** - Discard energy type from opponent (may be duplicate)
5. **draw_on_ko_tool** - Draw on KO tool
6. **evolve_basic_to_stage2** - Evolve basic to stage 2
7. **flip_avoid_ko_named** - Flip avoid KO named
8. **flip_discard_energy_double_heads** - Flip discard energy double heads
9. **heal_named** - Heal named Pokémon
10. **reduce_incoming_damage_if_high_retreat** - Reduce incoming damage if high retreat

---

## MOVE EFFECTS

### ✅ Already Implemented (Existing Handlers)

These move effects already have handlers in `MOVE_HANDLERS`:

1. **inflict_status** - Inflict status condition
2. **inflict_paralysis** - Inflict paralysis
3. **inflict_sleep** - Inflict sleep
4. **inflict_poison** - Inflict poison
5. **inflict_burn** - Inflict burn
6. **inflict_confusion** - Inflict confusion
7. **flip_inflict_status_if_heads** - Flip inflict status if heads
8. **flip_inflict_effect_if_heads** - Flip inflict effect if heads
9. **cant_attack_next_turn** - Can't attack next turn
10. **inflict_effect** - Inflict effect
11. **heal_self** - Heal self
12. **heal_equal_to_damage_done** - Heal equal to damage done
13. **bonus_damage_if_opponent_damaged** - Bonus damage if opponent damaged
14. **bonus_damage_if_self_damaged** - Bonus damage if self damaged
15. **bonus_damage_for_each_energy_on_opponent** - Bonus damage per energy on opponent
16. **bonus_damage_for_each_bench** - Bonus damage per bench
17. **bonus_damage_for_each_typed_bench** - Bonus damage per typed bench
18. **bonus_damage_for_each_named_bench** - Bonus damage per named bench
19. **bonus_damage_if_opponent_poisoned** - Bonus damage if opponent poisoned
20. **bonus_damage_if_damaged_last_turn** - Bonus damage if damaged last turn
21. **bonus_damage_if_evolution** - Bonus damage if evolution
22. **bonus_damage_if_no_damage_self** - Bonus damage if no damage self
23. **bonus_damage_if_opponent_burned** - Bonus damage if opponent burned
24. **bonus_damage_if_switched_in** - Bonus damage if switched in
25. **bonus_damage_if_tool** - Bonus damage if tool
26. **bonus_damage_if_type** - Bonus damage if type
27. **boost_next_attack** - Boost next attack
28. **discard_bench_for_bonus_damage** - Discard bench for bonus damage
29. **extra_damage_if_extra_energy_attached** - Extra damage if extra energy attached
30. **flip_bonus_damage_if_heads** - Flip bonus damage if heads
31. **flip_bonus_damage_with_self_damage** - Flip bonus damage with self damage
32. **flip_bonus_if_double_heads** - Flip bonus if double heads
33. **flip_multiplier** - Flip multiplier
34. **flip_until_tails_multiplier** - Flip until tails multiplier
35. **flip_do_nothing_if_tails** - Flip do nothing if tails
36. **flip_block_attack** - Flip block attack
37. **flip_multiplier_bonus** - Flip multiplier bonus
38. **flip_multiplier_self_confuse** - Flip multiplier self confuse
39. **flip_prevent_damage_next_turn** - Flip prevent damage next turn
40. **flip_set_hp** - Flip set HP
41. **flip_shuffle_random_from_hand** - Flip shuffle random from hand
42. **discard_energy_specific** - Discard energy specific
43. **discard_energy_all** - Discard all energy
44. **discard_random_energy_from_opponent** - Discard random energy from opponent
45. **flip_discard_random_from_opponent** - Flip discard random from opponent
46. **bench_damage_one** - Bench damage one
47. **bench_damage_all_opponent** - Bench damage all opponent
48. **bonus_damage_for_each_opponent_bench** - Bonus damage per opponent bench
49. **bonus_damage_if_opponent_ex** - Bonus damage if opponent ex
50. **bonus_damage_if_pokemon_ko_last_turn** - Bonus damage if Pokémon KO last turn
51. **discard_energy_then_bench_damage** - Discard energy then bench damage
52. **discard_random_energy_all_pokemon** - Discard random energy all Pokémon
53. **flip_multiplier_energy_count** - Flip multiplier energy count
54. **heal_all** - Heal all
55. **shuffle_hand_draw_match_opponent** - Shuffle hand draw match opponent
56. **self_damage_fixed_amount** - Self damage fixed amount
57. **reduce_incoming_damage_next_turn** - Reduce incoming damage next turn
58. **attach_energy_from_zone** - Attach energy from zone
59. **attach_multiple_energy_from_zone** - Attach multiple energy from zone
60. **change_energy_type** - Change energy type
61. **move_all_energy_to_bench** - Move all energy to bench
62. **discard_random_from_opponent_hand** - Discard random from opponent hand
63. **draw_until_equal_hand** - Draw until equal hand
64. **increase_energy_cost** - Increase energy cost
65. **switch_self_with_bench** - Switch self with bench
66. **force_opponent_switch** - Force opponent switch
67. **search_pokemon_type_random** - Search Pokémon type random
68. **search_specific_into_bench** - Search specific into bench
69. **random_multi_target_damage** - Random multi target damage
70. **bonus_damage_conditional** - Bonus damage conditional
71. **damage_equal_to_self_damage** - Damage equal to self damage
72. **discard_top_own_deck_bonus_if_type** - Discard top own deck bonus if type
73. **prevent_supporter_next_turn** - Prevent supporter next turn

### 🆕 New Move Effects (Need Implementation)

These move effects are in the CSV but **NOT** yet implemented:

1. **attach_energy_from_zone_to_self** - Attach energy from zone to self
2. **attach_energy_to_multiple_bench** - Attach energy to multiple bench
3. **attach_energy_to_specific_names** - Attach energy to specific names
4. **attach_multiple_energy_from_zone_self** - Attach multiple energy from zone self
5. **attach_multiple_energy_to_bench_one** - Attach multiple energy to bench one
6. **auto_evolve_random** - Auto evolve random
7. **bench_damage_all_self** - Bench damage all self
8. **bench_damage_opponent_with_energy** - Bench damage opponent with energy
9. **bench_damage_per_energy_on_target** - Bench damage per energy on target
10. **bench_damage_to_damaged_only** - Bench damage to damaged only
11. **bonus_damage_during_next_turn** - Bonus damage during next turn
12. **bonus_damage_equal_to_self_damage** - Bonus damage equal to self damage (may be duplicate)
13. **bonus_damage_for_each_bench** - Bonus damage for each bench (may be duplicate)
14. **bonus_damage_if_benched** - Bonus damage if benched
15. **bonus_damage_if_evolved_this_turn** - Bonus damage if evolved this turn
16. **bonus_damage_if_hand_count** - Bonus damage if hand count
17. **bonus_damage_if_last_move_name_used** - Bonus damage if last move name used
18. **bonus_damage_if_low_hp** - Bonus damage if low HP
19. **bonus_damage_if_multiple_energy_types** - Bonus damage if multiple energy types
20. **bonus_damage_if_named_bench** - Bonus damage if named bench
21. **bonus_damage_if_named_opponent** - Bonus damage if named opponent
22. **bonus_damage_if_opponent_has_ability** - Bonus damage if opponent has ability
23. **bonus_damage_if_opponent_has_more_hp** - Bonus damage if opponent has more HP
24. **bonus_damage_if_opponent_has_status** - Bonus damage if opponent has status
25. **bonus_damage_if_opponent_type** - Bonus damage if opponent type
26. **bonus_damage_if_own_bench_damaged** - Bonus damage if own bench damaged
27. **bonus_damage_per_ability_opponent** - Bonus damage per ability opponent
28. **bonus_damage_per_energy_attached** - Bonus damage per energy attached
29. **bonus_damage_per_energy_on_opponent_all** - Bonus damage per energy on opponent all
30. **bonus_damage_per_evolution_bench** - Bonus damage per evolution bench
31. **bonus_damage_per_retreat_cost** - Bonus damage per retreat cost
32. **bonus_damage_per_retreat_cost_reveal** - Bonus damage per retreat cost reveal
33. **change_opponent_energy_type** - Change opponent energy type
34. **copy_opponent_attack** - Copy opponent attack
35. **counter_on_hit_next_turn** - Counter on hit next turn
36. **damage_all_opponent_pokemon** - Damage all opponent Pokémon
37. **damage_all_opponent_stack** - Damage all opponent stack
38. **damage_end_of_opponent_turn** - Damage end of opponent turn
39. **damage_per_other_move_used** - Damage per other move used
40. **devolve_opponent** - Devolve opponent
41. **discard_all_opponent_tools** - Discard all opponent tools
42. **discard_energy_and_bench_damage** - Discard energy and bench damage
43. **discard_energy_and_snipe** - Discard energy and snipe
44. **discard_energy_specific_inflict_status** - Discard energy specific inflict status
45. **discard_energy_specific_reduce_damage** - Discard energy specific reduce damage
46. **discard_energy_type_from_opponent** - Discard energy type from opponent
47. **discard_from_hand_required** - Discard from hand required
48. **discard_opponent_tools_before_damage** - Discard opponent tools before damage
49. **discard_random_energy_from_both** - Discard random energy from both
50. **discard_random_energy_self** - Discard random energy self
51. **discard_random_item_from_opponent_hand** - Discard random item from opponent hand
52. **discard_tools_before_damage** - Discard tools before damage
53. **discard_tools_for_damage** - Discard tools for damage
54. **discard_tools_from_opponent** - Discard tools from opponent
55. **discard_top_deck** - Discard top deck
56. **discard_top_opponent_deck** - Discard top opponent deck
57. **draw_cards** - Draw cards
58. **flip_block_attack_next_turn** - Flip block attack next turn
59. **flip_both_heads_bonus** - Flip both heads bonus
60. **flip_conditional_burn** - Flip conditional burn
61. **flip_copy_opponent_attack** - Flip copy opponent attack
62. **flip_discard_energy_if_heads** - Flip discard energy if heads
63. **flip_discard_energy_multiple** - Flip discard energy multiple
64. **flip_discard_energy_until_tails** - Flip discard energy until tails
65. **flip_discard_random_from_opponent_hand** - Flip discard random from opponent hand
66. **flip_do_nothing_if_double_tails** - Flip do nothing if double tails
67. **flip_force_shuffle_opponent_pokemon_into_deck** - Flip force shuffle opponent Pokémon into deck
68. **flip_inflict_effect_self_if_tails** - Flip inflict effect self if tails
69. **flip_inflict_status_both** - Flip inflict status both
70. **flip_lock_self_if_tails** - Flip lock self if tails
71. **flip_multiplier_conditional_poison** - Flip multiplier conditional poison
72. **flip_multiplier_per_energy** - Flip multiplier per energy
73. **flip_multiplier_pokemon_in_play** - Flip multiplier Pokémon in play
74. **flip_multiplier_tool_bonus** - Flip multiplier tool bonus
75. **flip_multiplier_until_tails** - Flip multiplier until tails
76. **flip_prevent_damage_and_effects** - Flip prevent damage and effects
77. **flip_prevent_damage_and_effects_next_turn** - Flip prevent damage and effects next turn
78. **flip_reveal_and_shuffle** - Flip reveal and shuffle
79. **flip_reveal_discard_supporter** - Flip reveal discard supporter
80. **flip_reveal_shuffle_opponent_card** - Flip reveal shuffle opponent card
81. **flip_self_damage_if_tails** - Flip self damage if tails
82. **flip_two_stage** - Flip two stage
83. **flip_until_tails_bonus_damage** - Flip until tails bonus damage
84. **halve_opponent_hp** - Halve opponent HP
85. **heal_bench_one** - Heal bench one
86. **heal_type_pokemon** - Heal type Pokémon
87. **ignore_effects** - Ignore effects
88. **ignore_weakness** - Ignore weakness
89. **increase_incoming_damage_next_turn** - Increase incoming damage next turn
90. **increase_opponent_costs_next_turn** - Increase opponent costs next turn
91. **increase_self_damage_next_turn** - Increase self damage next turn
92. **inflict_double_status** - Inflict double status
93. **inflict_effect_counter_next_turn** - Inflict effect counter next turn
94. **inflict_effect_retreat_lock** - Inflict effect retreat lock
95. **inflict_random_status** - Inflict random status
96. **inflict_status_both** - Inflict status both
97. **inflict_status_choice** - Inflict status choice
98. **inflict_status_heavy** - Inflict status heavy
99. **inflict_status_on_energy_attach** - Inflict status on energy attach
100. **inflict_status_self** - Inflict status self
101. **prevent_damage_from_basic_next_turn** - Prevent damage from basic next turn
102. **prevent_damage_if_under_threshold** - Prevent damage if under threshold
103. **prevent_retreat_next_turn** - Prevent retreat next turn
104. **random_single_target_damage** - Random single target damage
105. **reduce_damage_next_turn** - Reduce damage next turn
106. **reduce_energy_cost_if_damaged** - Reduce energy cost if damaged
107. **return_opponent_active_to_hand** - Return opponent active to hand
108. **reveal_discard_supporter** - Reveal discard supporter
109. **reveal_hand_shuffle_card** - Reveal hand shuffle card
110. **reveal_opponent_hand** - Reveal opponent hand
111. **search_basic_to_bench** - Search basic to bench
112. **search_evolution_of_self** - Search evolution of self
113. **search_named_to_bench** - Search named to bench
114. **self_boost_next_turn** - Self boost next turn
115. **self_damage_if_ko** - Self damage if KO
116. **self_inflict_effect** - Self inflict effect
117. **self_inflict_status** - Self inflict status
118. **self_lock_next_turn** - Self lock next turn
119. **self_lock_specific_attack** - Self lock specific attack
120. **stacking_damage_boost** - Stacking damage boost
121. **switch_self_with_bench_type** - Switch self with bench type

---

## SUMMARY STATISTICS

- **Ability Effects**: ~35 implemented, ~52 new to implement
- **Trainer Effects**: ~69 implemented, ~10 new to implement
- **Move Effects**: ~73 implemented, ~121 new to implement

**Total**: ~177 implemented, ~183 new effects to implement

---

## NOTES

1. Some effects may have slight naming variations or be aliases (e.g., `counter_on_knockout` vs `counter_on_ko`)
2. Some effects may be duplicates across categories (e.g., `heal_all` exists in both abilities and moves)
3. Some effects may need to be grouped/reused where possible (e.g., similar flip effects)
4. Priority should be given to effects that are used by multiple cards
5. Some effects may require new helper functions or modifications to existing game state management

