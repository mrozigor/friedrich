"use strict"

const R_FREDERICK = "Frederick"
const R_ELISABETH = "Elisabeth"
const R_MARIA_THERESA = "Maria Theresa"
const R_POMPADOUR = "Pompadour"

const SCENARIO_INDEX = {
	"4P": 4,
	"3P": 3,
	"The War in the West": 1,
	"The Austrian Theatre": 2,
}

const ROLE_NAME_1 = [
	R_FREDERICK,
	R_POMPADOUR,
]

const ROLE_NAME_2 = [
	R_FREDERICK,
	R_MARIA_THERESA,
]

const ROLE_NAME_3 = [
	R_FREDERICK,
	R_ELISABETH,
	R_MARIA_THERESA,
]

const ROLE_NAME_4 = [
	R_FREDERICK,
	R_ELISABETH,
	R_MARIA_THERESA,
	R_POMPADOUR,
]

exports.roles = function (scenario, _options) {
	let n = SCENARIO_INDEX[scenario]
	switch (n) {
		case 1: return ROLE_NAME_1
		case 2: return ROLE_NAME_2
		case 3: return ROLE_NAME_3
		case 4: return ROLE_NAME_4
	}
	return [ "Nobody" ]
}

exports.scenarios = Object.keys(SCENARIO_INDEX)

/* DATA */

var game
var view
var states = {}

const data = require("./data")

function find_city(city) {
	let n = data.cities.name.length
	let x = -1
	for (let c = 0; c < n; ++c) {
		if (data.cities.name[c] === city) {
			if (x < 0)
				x = c
			else
				throw "TWO CITIES: " + city
		}
	}
	if (x < 0)
		throw "CITY NOT FOUND: " + city
	return x
}

function find_city_list(names) {
	let list = []
	for (let n of names)
		set_add(list, find_city(n))
	return list
}

let suit_name = [ "\u2660", "\u2663", "\u2665", "\u2666", "\u2641" ]

const P_PRUSSIA = 0
const P_HANOVER = 1
const P_RUSSIA = 2
const P_SWEDEN = 3
const P_AUSTRIA = 4
const P_IMPERIAL = 5
const P_FRANCE = 6

const POWER_NAME = [ "Prussia", "Hanover", "Russia", "Sweden", "Austria", "Imperial Army", "France" ]

const SPADES = 0
const CLUBS = 1
const HEARTS = 2
const DIAMONDS = 3
const RESERVE = 4

// Strokes of Fate cards
const FC_POEMS = 13
const FC_LORD_BUTE = 14
const FC_ELISABETH = 15
const FC_SWEDEN = 16
const FC_INDIA = 17
const FC_AMERICA = 18

const ELIMINATED = data.cities.name.length
const REMOVED = ELIMINATED + 1

const max_power_troops_4 = [ 32, 12, 16, 4, 30, 6, 20 ]

function max_power_troops(pow) {
	if (game.scenario === 1 && pow === P_PRUSSIA)
		return 3
	if (game.scenario === 2 && pow === P_PRUSSIA)
		return 24
	let max = max_power_troops_4[pow]
	let n = 0
	for (let p of all_power_generals[pow])
		if (game.pos[p] < REMOVED)
			n += 8
	return Math.min(n, max)
}

const all_powers = [ 0, 1, 2, 3, 4, 5, 6 ]

const all_home_or_depot_cities = [
	data.country.Prussia,
	data.country.Hanover,
	find_city_list([ "Sierpc", "Warszawa" ]),
	data.country.Sweden,
	data.country.Austria,
	set_union(data.country.Empire, data.country.Saxony),
	find_city_list([ "Hildburghausen" ]),
	find_city_list([ "Koblenz", "Gemünden" ]),
]

const all_power_depots = [
	find_city_list([ "Berlin" ]),
	find_city_list([ "Stade" ]),
	find_city_list([ "Sierpc", "Warszawa" ]),
	find_city_list([ "Stralsund" ]),
	find_city_list([ "Tabor", "Brünn" ]),
	find_city_list([ "Hildburghausen" ]),
	find_city_list([ "Koblenz", "Gemünden" ]),
]

const MUNSTER_Y = data.cities.y[find_city("Munster")]

const all_power_re_entry_cities = [
	data.sectors.spades_berlin,
	data.sectors.diamonds_stade.filter(s => data.cities.y[s] < MUNSTER_Y),
	data.sectors.spades_warszawa,
	data.country.Sweden,
	set_intersect(data.sectors.diamonds_brunn, data.country.Austria),
	data.sectors.spades_south_of_hildburghausen,
	data.sectors.hearts_south_of_koblenz,
]

const piece_abbr = [
	"P1", "P2", "P3", "P4", "P5", "P6", "P7", "P8",
	"H1", "H2",
	"R1", "R2", "R3", "R4",
	"S1",
	"A1", "A2", "A3", "A4", "A5",
	"IA1",
	"F1", "F2", "F3",
	"PT1", "PT2", "HT", "RT1", "RT2", "ST", "AT1", "AT2", "IAT", "FT1", "FT2",
]

const piece_name = [
	"Friedrich", "Winterfeldt", "Heinrich", "Schwerin", "Keith", "Seydlitz", "Dohna", "Lehwaldt",
	"Ferdinand", "Cumberland",
	"Saltikov", "Fermor", "Apraxin", "Tottleben",
	"Ehrensvärd",
	"Daun", "Browne", "Karl", "Laudon", "Lacy",
	"Hildburghausen",
	"Richelieu", "Soubise", "Chevert",

	"supply train", "supply train",
	"supply train",
	"supply train", "supply train",
	"supply train",
	"supply train", "supply train",
	"supply train",
	"supply train", "supply train",

	//"Prussian supply train", "Prussian supply train",
	//"Hanoverian supply train",
	//"Russian supply train", "Russian supply train",
	//"Swedish supply train",
	//"Austrian supply train", "Austrian supply train",
	//"Imperial Army supply train",
	//"French supply train", "French supply train",
]

const all_power_generals = [
	/* P */ [ 0, 1, 2, 3, 4, 5, 6, 7 ],
	/* H */ [ 8, 9 ],
	/* R */ [ 10, 11, 12, 13 ],
	/* S */ [ 14 ],
	/* A */ [ 15, 16, 17, 18, 19 ],
	/* I */ [ 20 ],
	/* F */ [ 21, 22, 23 ],
]

const GEN_FRIEDRICH = 0
const GEN_SEYDLITZ = 5
const GEN_CUMBERLAND = 9
const GEN_APRAXIN = 12
const GEN_TOTTLEBEN = 13
const GEN_EHRENSVAERD = 14
const GEN_DAUN = 15
const GEN_LAUDON = 18
const GEN_HILDBURGHAUSEN = 20

const all_power_generals_rev = all_power_generals.map(list => list.slice().reverse())

const all_power_trains = [
	/* P */ [ 24, 25 ],
	/* H */ [ 26 ],
	/* R */ [ 27, 28 ],
	/* S */ [ 29 ],
	/* A */ [ 30, 31 ],
	/* I */ [ 32 ],
	/* F */ [ 33, 34 ],
]

function is_general(p) {
	return p < 24
}

const all_pieces = [ ...all_power_generals.flat(), ...all_power_trains.flat() ]
const all_generals = [ ...all_power_generals.flat() ]

const all_prussia_trains = [
	...all_power_trains[P_PRUSSIA],
	...all_power_trains[P_HANOVER],
]

const all_anti_prussia_trains = [
	...all_power_trains[P_RUSSIA],
	...all_power_trains[P_SWEDEN],
	...all_power_trains[P_AUSTRIA],
	...all_power_trains[P_IMPERIAL],
	...all_power_trains[P_FRANCE],
]

const all_friendly_trains = [
	all_prussia_trains,
	all_prussia_trains,
	all_anti_prussia_trains,
	all_anti_prussia_trains,
	all_anti_prussia_trains,
	all_anti_prussia_trains,
	all_anti_prussia_trains,
]

const all_enemy_trains = [
	all_anti_prussia_trains,
	all_anti_prussia_trains,
	all_prussia_trains,
	all_prussia_trains,
	all_prussia_trains,
	all_prussia_trains,
	all_prussia_trains,
]

const all_prussia_generals = [
	...all_power_generals[P_PRUSSIA],
	...all_power_generals[P_HANOVER],
]

const all_anti_prussia_generals = [
	...all_power_generals[P_RUSSIA],
	...all_power_generals[P_SWEDEN],
	...all_power_generals[P_AUSTRIA],
	...all_power_generals[P_IMPERIAL],
	...all_power_generals[P_FRANCE],
]

const all_enemy_generals = [
	all_anti_prussia_generals,
	all_anti_prussia_generals,
	all_prussia_generals,
	all_prussia_generals,
	all_prussia_generals,
	all_prussia_generals,
	all_prussia_generals,
]

function is_supply_train(p) {
	return p >= 24
}

function to_deck(c) {
	return c >> 7
}

function to_suit(c) {
	return (c >> 4) & 7
}

function to_value(c) {
	return c & 15
}

function is_reserve(c) {
	return to_suit(c) === RESERVE
}

function format_cards(list) {
	return list.map(c => to_value(c) + suit_name[to_suit(c)]).join(", ")
}

function format_selected() {
	if (game.selected.length === 0)
		return "nobody"
	return game.selected.map(p => piece_name[p]).join(" and ")
}

function format_stack(s) {
	let list = []
	for (let p of all_pieces)
		if (game.pos[p] === s)
			list.push(p)
	return suit_name[get_space_suit(s)] + " " + list.map(p => piece_name[p]).join(" and ")
}

/* CARDS OF FATE (PASSIVE) */

const NEXT_TURN_IF_FERMOR_STARTS_HIS_MOVE_IN_KÜSTRIN_H6_OR_IN_AN_ADJACENT_CITY_HE_MAY_NOT_MOVE = 5
const NEXT_TURN_SALTIKOV_MAY_MOVE_ONLY_2_CITIES = 7
const NEXT_TURN_IF_PRUSSIA_AND_FRANCE_FIGHT_EACH_OTHER_THEY_MAY_NOT_USE_TCS_WITH_VALUES_OF_10_OR_MORE = 9
const NEXT_TURN_SOUBISE_AND_HILDBURGHAUSEN_MAY_NOT_ATTACK_WITH_THE_SAME_TC_SYMBOL = 10
const NEXT_TURN_NO_GENERAL_MAY_BE_ATTACKED_IN_THE_CITY_OF_HALLE_E4_AND_NO_SUPPLY_TRAIN_MAY_BE_ELIMINATED_IN_THE_CITY_OF_HALLE = 11
const NEXT_TURN_THE_FIRST_TC_PLAYED_BY_FRANCE_IS_WORTH_AN_ADDITIONAL_POINT = 12
const NEXT_TURN_CUMBERLAND_MAY_NOT_MOVE_INTO_ATTACK_POSITION = 15
const NEXT_TURN_SOUBISE_MAY_NOT_MOVE_INTO_ATTACK_POSITION = 16
const NEXT_TURN_RICHELIEU_MAY_MOVE_2_CITIES_ONLY = 18
const NEXT_TURN_CHEVERT_MAY_NOT_UNSTACK = 19
const NEXT_TURN_FRIEDRICH_MAY_NOT_MOVE_INTO_ATTACK_POSITION = 24
const NEXT_TURN_FRIEDRICH_MAY_NOT_RECEIVE_ANY_NEW_TROOPS = 26
const NEXT_TURN_IF_FRIEDRICH_IS_INVOLVED_IN_COMBAT_PRUSSIA_MUST_REACH_A_POSITIVE_SCORE_WITH_THE_FIRST_TCS_SHE_PLAYS_IF_POSSIBLE = 27
const NEXT_TURN_ANY_PRUSSIANS_WHO_ARE_ATTACKED_BY_DAUN_MAY_MOVE_TO_ANY_EMPTY_ADJACENT_CITY = 29
const NEXT_TURN_IF_FRIEDRICH_ATTACKS_HIS_FIRST_TC_IS_WORTH_5_ADDITIONAL_POINTS = 31
const NEXT_TURN_FRIEDRICH_MAY_MOVE_4_CITIES_EVEN_AS_A_STACK = 33
const NEXT_TURN_EVERY_PRUSSIAN_GENERAL_WHO_RECEIVES_NEW_TROOPS_MAY_NOT_MOVE_INTO_ATTACK_POSITION = 36
const NEXT_TURN_IF_FRIEDRICH_IS_ATTACKED_THE_FIRST_TC_PLAYED_BY_PRUSSIA_IS_WORTH_NOTHING_0_POINTS = 38
const NEXT_TURN_PRUSSIA_MAY_PLAY_THE_11_OF_SPADES_SEYDLITZ_ONCE_AT_DOUBLE_VALUE = 40
const NEXT_TURN_PRINZ_HEINRICH_PROTECTS_OBJECTIVES_UP_TO_4_CITIES_DISTANT = 42
const NEXT_TURN_DAUN_MAY_MOVE_ONLY_2_CITIES = 44

/* OBJECTIVES */

const all_objectives = []
set_add_all(all_objectives, data.type.objective1_austria)
set_add_all(all_objectives, data.type.objective2_austria)
set_add_all(all_objectives, data.type.objective1_imperial)
set_add_all(all_objectives, data.type.objective2_imperial)
set_add_all(all_objectives, data.type.objective1_sweden)
set_add_all(all_objectives, data.type.objective2_sweden)
set_add_all(all_objectives, data.type.objective_france)
set_add_all(all_objectives, data.type.objective_prussia)
set_add_all(all_objectives, data.type.objective_russia)

const protect_range = []
for (let s of all_objectives)
	make_protect_range(protect_range[s] = [], s, s, 3)

function make_protect_range(result, start, here, range) {
	for (let next of data.cities.adjacent[here]) {
		if (next !== start)
			set_add(result, next)
		if (range > 1)
			make_protect_range(result, start, next, range - 1)
	}
}

const primary_objective = [ [], [], [], [], [], [], [] ]
const secondary_objective = [ [], [], [], [], [], [], [] ]
const protect = [ [], [], [], [], [], [], [] ]

for (let s of data.type.objective_prussia) set_add(primary_objective[P_PRUSSIA], s)
for (let s of data.type.objective_russia) set_add(primary_objective[P_RUSSIA], s)
for (let s of data.type.objective1_sweden) set_add(primary_objective[P_SWEDEN], s)
for (let s of data.type.objective2_sweden) set_add(secondary_objective[P_SWEDEN], s)
for (let s of data.type.objective1_austria) set_add(primary_objective[P_AUSTRIA], s)
for (let s of data.type.objective2_austria) set_add(secondary_objective[P_AUSTRIA], s)
for (let s of data.type.objective1_imperial) set_add(primary_objective[P_IMPERIAL], s)
for (let s of data.type.objective2_imperial) set_add(secondary_objective[P_IMPERIAL], s)
for (let s of data.type.objective_france) set_add(primary_objective[P_FRANCE], s)

const full_objective = [
	set_union(primary_objective[0], secondary_objective[0]),
	set_union(primary_objective[1], secondary_objective[1]),
	set_union(primary_objective[2], secondary_objective[2]),
	set_union(primary_objective[3], secondary_objective[3]),
	set_union(primary_objective[4], secondary_objective[4]),
	set_union(primary_objective[5], secondary_objective[5]),
	set_union(primary_objective[6], secondary_objective[6]),
]

function make_protect(power, country) {
	for (let s of all_objectives)
		if (set_has(country, s))
			set_add(protect[power], s)
}

make_protect(P_PRUSSIA, data.country.Prussia)
make_protect(P_PRUSSIA, data.country.Saxony)
make_protect(P_HANOVER, data.country.Hanover)
make_protect(P_AUSTRIA, data.country.Austria)

function is_conquest_space(pow, s) {
	return set_has(full_objective[pow], s)
}

function is_reconquest_space(pow, s) {
	return set_has(protect[pow], s)
}

function is_protected_from_conquest(s) {
	for (let pow of all_powers) {
		if (set_has(protect[pow], s)) {
			let range = protect_range[s]
			for (let p of all_power_generals[pow])
				if (set_has(range, game.pos[p]))
					return true
			if (pow === P_IMPERIAL) {
				for (let p of all_power_trains[pow])
					if (set_has(range, game.pos[p]))
						return true
			}
		}
	}
	return false
}

function is_protected_from_reconquest(s) {
	for (let pow of all_powers) {
		if (set_has(full_objective[pow], s)) {
			let range = protect_range[s]
			for (let p of all_power_generals[pow])
				if (set_has(range, game.pos[p]))
					return true
			if (pow === P_IMPERIAL) {
				for (let p of all_power_trains[pow])
					if (set_has(range, game.pos[p]))
						return true
			}
		}
	}
	return false
}

/* STATE */

function turn_power_draw() {
	let n = 0

	if (game.scenario === 1 && game.power === P_PRUSSIA) {
		if (set_has(game.fate, FC_LORD_BUTE) || set_has(game.fate, FC_POEMS))
			return 1
		return 2
	}

	if (game.scenario === 2 && game.power === P_PRUSSIA) {
		n = 5
		if (set_has(game.fate, FC_LORD_BUTE))
			n -= 1
		if (set_has(game.fate, FC_POEMS))
			n -= 1
		return n
	}

	switch (game.power) {
		case P_PRUSSIA:
			n = 7
			if (set_has(game.fate, FC_LORD_BUTE))
				n = Math.max(4, n - 2)
			if (set_has(game.fate, FC_POEMS))
				n = Math.max(4, n - 2)
			break
		case P_HANOVER:
			n = 2
			if (set_has(game.fate, FC_INDIA) && set_has(game.fate, FC_AMERICA))
				n = 1
			break
		case P_RUSSIA:
			n = 4
			break
		case P_SWEDEN:
			n = 1
			break
		case P_AUSTRIA:
			n = 5
			if (set_has(game.fate, FC_INDIA) || set_has(game.fate, FC_AMERICA))
				n = 4
			break
		case P_IMPERIAL:
			n = 1
			break
		case P_FRANCE:
			n = 4
			if (set_has(game.fate, FC_INDIA) || set_has(game.fate, FC_AMERICA))
				n = 4
			break
	}
	return n
}

function has_power_dropped_out(pow) {
	if (game.scenario === 1)
		return pow !== P_PRUSSIA && pow !== P_HANOVER && pow !== P_FRANCE
	if (game.scenario === 2)
		return pow !== P_PRUSSIA && pow !== P_AUSTRIA && pow !== P_IMPERIAL
	switch (pow) {
		case P_RUSSIA: return has_russia_dropped_out()
		case P_SWEDEN: return has_sweden_dropped_out()
		case P_FRANCE: return has_france_dropped_out()
	}
	return false
}

function has_russia_dropped_out() {
	return set_has(game.fate, FC_ELISABETH)
}

function has_sweden_dropped_out() {
	return set_has(game.fate, FC_SWEDEN)
}

function has_france_dropped_out() {
	return set_has(game.fate, FC_INDIA) && set_has(game.fate, FC_AMERICA)
}

function has_imperial_army_switched_players() {
	return (has_russia_dropped_out() && has_sweden_dropped_out()) || has_france_dropped_out()
}

function has_removed_all_pieces(pow) {
	for (let p of all_power_generals[pow])
		if (game.pos[p] !== REMOVED)
			return false
	for (let p of all_power_trains[pow])
		if (game.pos[p] !== REMOVED)
			return false
	return true
}

function player_from_power(pow) {
	let role = null

	if (game.scenario === 2 && pow === P_IMPERIAL)
		return R_MARIA_THERESA

	switch (pow) {
		case P_PRUSSIA:
		case P_HANOVER:
			role = R_FREDERICK
			break
		case P_RUSSIA:
		case P_SWEDEN:
			role = R_ELISABETH
			break
		case P_AUSTRIA:
			role = R_MARIA_THERESA
			break
		case P_IMPERIAL:
			if (has_russia_dropped_out() && has_sweden_dropped_out())
				role = R_ELISABETH
			else if (has_france_dropped_out())
				role = R_POMPADOUR
			else
				role = R_MARIA_THERESA
			break
		case P_FRANCE:
			role = R_POMPADOUR
			break
	}

	if (game.scenario === 3 && role === R_POMPADOUR)
		role = R_ELISABETH
	return role
}

function set_active_to_power(power) {
	game.power = power
	game.active = current_player()
}

function current_player() {
	return player_from_power(game.power)
}

function get_top_piece(s) {
	for (let p of all_pieces)
		if (game.pos[p] === s)
			return p
	return -1
}

function get_supreme_commander(s) {
	for (let p of all_generals)
		if (game.pos[p] === s)
			return p
	return -1
}

function get_stack_power(s) {
	for (let pow of all_powers)
		for (let p of all_power_generals[pow])
			if (game.pos[p] === s)
				return pow
	throw "IMPOSSIBLE"
}

function is_space_suit(s, ranges) {
	for (let [a, b] of ranges)
		if (s >= a && s <= b)
			return true
	return false
}

function get_space_suit(s) {
	if (s >= ELIMINATED)
		return SPADES
	if (is_space_suit(s, data.suit.spades))
		return SPADES
	if (is_space_suit(s, data.suit.clubs))
		return CLUBS
	if (is_space_suit(s, data.suit.hearts))
		return HEARTS
	if (is_space_suit(s, data.suit.diamonds))
		return DIAMONDS
	throw "IMPOSSIBLE"
}

function count_eliminated_trains() {
	let n = 0
	for (let p of all_power_trains[game.power])
		if (game.pos[p] === ELIMINATED)
			++n
	return n
}

function count_used_troops() {
	let current = 0
	for (let p of all_power_generals[game.power])
		current += game.troops[p]
	return current
}

function count_unused_generals() {
	let n = 0
	for (let p of all_power_generals[game.power])
		if (game.pos[p] !== REMOVED && game.troops[p] === 0)
			++n
	return n
}

function has_any_piece(to) {
	for (let s of game.pos)
		if (s === to)
			return true
	return false
}

function has_friendly_supply_train(to) {
	for (let p of all_friendly_trains[game.power])
		if (game.pos[p] === to)
			return true
	return false
}

function has_enemy_supply_train(to) {
	for (let p of all_enemy_trains[game.power])
		if (game.pos[p] === to)
			return true
	return false
}

function has_enemy_piece(to) {
	for (let p of all_enemy_generals[game.power])
		if (game.pos[p] === to)
			return true
	for (let p of all_enemy_trains[game.power])
		if (game.pos[p] === to)
			return true
	return false
}

function has_any_other_general(to) {
	for (let other of all_powers)
		if (other !== game.power)
			for (let p of all_power_generals[other])
				if (game.pos[p] === to)
					return true
	return false
}

function has_own_general(to) {
	for (let p of all_power_generals[game.power])
		if (game.pos[p] === to)
			return true
	return false
}

function count_pieces(to) {
	let n = 0
	for (let s of game.pos)
		if (s === to)
			++n
	return n
}

function add_one_troop(p) {
	for (let x of all_power_generals[game.power]) {
		if (game.pos[x] === game.pos[p] && game.troops[x] < 8) {
			game.troops[x] ++
			break
		}
	}
}

function remove_one_troop(p) {
	for (let x of all_power_generals_rev[game.power]) {
		if (game.pos[x] === game.pos[p] && game.troops[x] > 1) {
			game.troops[x] --
			break
		}
	}
}

function retire_general(p) {
	log("P" + p + " retired.")

	// save troops if possible
	let s = game.pos[p]
	let n = game.troops[p]
	game.pos[p] = REMOVED
	game.troops[p] = 0

	if (s < ELIMINATED) {
		for (let p of all_power_generals[game.power]) {
			if (game.pos[p] === s) {
				let x = Math.min(n, 8 - game.troops[p])
				game.troops[p] += x
				n -= x
			}
		}
		if (n > 0)
			log("Lost " + n + " troops.")
	}
}

/* SEQUENCE OF PLAY */

const POWER_FROM_ACTION_STEP = [
	P_PRUSSIA,
	P_HANOVER,
	P_RUSSIA,
	P_SWEDEN,
	P_AUSTRIA,
	P_IMPERIAL,
	P_FRANCE,
]

function set_active_to_current_action_step() {
	set_active_to_power(POWER_FROM_ACTION_STEP[game.step])
}

function goto_start_turn() {
	game.step = 0

	// Check before drawing a fate card.
	if (check_victory())
		return

	if (++game.turn <= 5) {
		log("# \u2014 " + game.turn + " \u2014")
		log("$" + (game.turn - 1 + 48 + 6))
	} else {
		// remove non-stroke of fate card from last turn
		for (let i = 1; i <= 12; ++i)
			set_delete(game.fate, i)

		let fc = game.clock.pop()

		let fs = SPADES
		if (game.scenario >= 3)
			fs = get_space_suit(game.pos[game.vg])

		if (fc > 12) {
			log("# " + strokes_of_fate_name[fc-13])
			log("$" + (fc - 13 + 48))
			game.fx = 0
		} else {
			game.fx = (fc - 1) * 4 + fs
			log("# Card of Fate " + fc + suit_name[fs])
			log("$" + game.fx)
		}

		set_add(game.fate, fc)

		// Check again in case of eased victory conditions.
		if (check_victory())
			return

		if (fate_effect_immediate[game.fx]) {
			fate_effect_immediate[game.fx]()
			return
		}

		// dropped out powers are virtual in 2p scenarios
		if (game.scenario === 1 || game.scenario === 2) {
			resume_start_turn()
			return
		}

		if (fc === FC_ELISABETH) {
			set_active_to_power(P_PRUSSIA)
			game.state = "russia_quits_the_game_1"
			return
		}

		if (fc === FC_SWEDEN) {
			set_active_to_power(P_PRUSSIA)
			game.state = "sweden_quits_the_game_1"
			return
		}

		if ((fc === FC_INDIA && set_has(game.fate, FC_AMERICA)) || (fc === FC_AMERICA && set_has(game.fate, FC_INDIA))) {
			set_active_to_power(P_HANOVER)
			game.state = "france_quits_the_game_1"
			return
		}
	}

	resume_start_turn()
}

function resume_start_turn() {
	game.selected = null
	delete game.ia_lost

	// MARIA: politics
	// MARIA: hussars

	goto_action_stage()
}

function goto_action_stage() {
	set_active_to_current_action_step()

	clear_undo()

	if (has_power_dropped_out(game.power)) {
		end_action_stage()
		return
	}

	log("=" + game.power)
	goto_tactical_cards()
}

function end_action_stage() {
	clear_undo()

	if (++game.step === 7)
		goto_end_of_turn()
	else
		goto_action_stage()
}

function goto_end_of_turn() {
	if (game.scenario === 1 || game.scenario === 2) {
		log("Imaginary player draws 5 TC.")
		for (let i = 0; i < 5; ++i)
			draw_next_tc()
	}

	goto_start_turn()
}

/* VICTORY */

function has_conquered_all_of(list) {
	for (let s of list)
		if (!set_has(game.conquest, s))
			return false
	return true
}

function check_power_victory(victory, city_list, power) {
	if (has_conquered_all_of(city_list[power]))
		set_add(victory, power)
}

function check_victory_list(victory) {
	if (victory.length > 0) {
		goto_game_over(
			victory.map(player_from_power).join(", "),
			victory.map(p => POWER_NAME[p]).join(" and ") + " won."
		)
		return true
	} else {
		return false
	}
}

function check_victory() {
	if (game.scenario === 1)
		return check_victory_the_war_in_the_west()
	if (game.scenario === 2)
		return check_victory_the_austrian_theatre()
	return check_victory_4()
}

function check_victory_the_war_in_the_west() {
	if (has_france_dropped_out()) {
		goto_game_over(R_FREDERICK, "Prussia won.")
		return true
	}
	if (has_conquered_all_of(full_objective[P_FRANCE])) {
		goto_game_over(R_POMPADOUR, "France won.")
		return true
	}
	return false
}

function check_victory_the_austrian_theatre() {
	if (has_russia_dropped_out() && has_sweden_dropped_out() && has_france_dropped_out()) {
		goto_game_over(R_FREDERICK, "Prussia won.")
		return true
	}

	let victory = []

	check_power_victory(victory, full_objective, P_AUSTRIA)
	check_power_victory(victory, full_objective, P_IMPERIAL)
	check_power_victory(victory, full_objective, P_PRUSSIA)

	return check_victory_list(victory)
}

function check_victory_4() {
	// Prussian victory
	if (has_russia_dropped_out() && has_sweden_dropped_out() && has_france_dropped_out()) {
		goto_game_over(R_FREDERICK, "Prussia won.")
		return true
	}

	let victory = []

	check_power_victory(victory, full_objective, P_RUSSIA)
	check_power_victory(victory, full_objective, P_FRANCE)

	if (has_russia_dropped_out()) {
		check_power_victory(victory, primary_objective, P_SWEDEN)
	} else {
		check_power_victory(victory, full_objective, P_SWEDEN)
	}

	if (has_imperial_army_switched_players()) {
		check_power_victory(victory, primary_objective, P_AUSTRIA)
		check_power_victory(victory, primary_objective, P_IMPERIAL)
	} else {
		check_power_victory(victory, full_objective, P_AUSTRIA)
		check_power_victory(victory, full_objective, P_IMPERIAL)
	}

	return check_victory_list(victory)
}

/* TACTICAL CARDS */

function find_largest_discard(u) {
	for (let i = 0; i < 5; ++i)
		if (u[i] <= u[0] && u[i] <= u[1] && u[i] <= u[2] && u[i] <= u[3] && u[i] <= u[4])
			return i
	throw "OUT OF CARDS"
}

function next_tactics_deck() {
	let held = [ 0, 0, 0, 0, 0 ]

	// count cards in hands
	for (let pow of all_powers) {
		for (let c of game.hand[pow])
			held[to_deck(c)]++
	}
	if (game.draw)
		for (let c of game.draw)
			held[to_deck(c)]++

	// find next unused deck
	for (let i = 1; i < 5; ++i) {
		if (held[i] === 0) {
			game.deck = make_tactics_deck(i)
			shuffle_bigint(game.deck)
			return
		}
	}

	log("Discards " + held.map(x=>50-x).join(", "))
	log("Deck 1: " + make_tactics_discard(0).map(x=>"C"+x).join(" "))
	log("Deck 2: " + make_tactics_discard(1).map(x=>"C"+x).join(" "))
	log("Deck 3: " + make_tactics_discard(2).map(x=>"C"+x).join(" "))
	log("Deck 4: " + make_tactics_discard(3).map(x=>"C"+x).join(" "))
	log("Deck 5: " + make_tactics_discard(4).map(x=>"C"+x).join(" "))

	// find two largest discard piles
	let a = find_largest_discard(held)
	if (held[a] === 50)
		return
	held[a] = 100

	let b = find_largest_discard(held)
	log("Deck " + b + ": " + held[b])
	if (held[b] === 50)
		return

	log("Shuffled new deck from discards " + (a+1) + " and " + (b+1) + ".")

	game.deck = [
		make_tactics_discard(a),
		make_tactics_discard(b)
	].flat()

	shuffle_bigint(game.deck)
}

function draw_next_tc() {
	if (game.deck.length === 0)
		next_tactics_deck()
	if (game.deck.length === 0)
		return -1
	return game.deck.pop()
}

function goto_tactical_cards() {
	let n = turn_power_draw()

	game.draw = []
	for (let i = 0; i < n; ++i) {
		let c = draw_next_tc()
		if (c >= 0)
			set_add(game.draw, c)
	}

	if (game.draw.length < n)
		log("Draw " + game.draw.length + " / " + n + " TC.")
	else
		log("Draw " + n + " TC.")

	if (should_power_discard_tc() && game.draw.length > 0)
		game.state = "tactical_cards_discard"
	else
		game.state = "tactical_cards_show"
}

function should_power_discard_tc() {
	if (game.power === P_FRANCE && !set_has(FC_AMERICA) && !set_has(FC_INDIA))
		return game.draw.length === 4
	if (game.scenario === 1 && game.power === P_PRUSSIA)
		return game.draw.length === 2
	return false
}

states.tactical_cards_discard = {
	prompt() {
		view.draw = game.draw
		prompt("Draw " + format_cards(game.draw) + ". Discard one of them.")
		for (let c of game.draw)
			gen_action_card(c)
	},
	card(c) {
		push_undo()
		log("Discarded 1 TC.")
		set_delete(game.draw, c)
		game.state = "tactical_cards_discard_done"
	},
}

states.tactical_cards_discard_done = {
	prompt() {
		view.draw = game.draw
		prompt("Draw " + format_cards(game.draw) + ".")
		view.actions.end_cards = 1
	},
	end_cards() {
		end_tactical_cards()
	},
}

states.tactical_cards_show = {
	prompt() {
		view.draw = game.draw
		prompt("Draw " + format_cards(game.draw) + ".")
		view.actions.end_cards = 1
	},
	end_cards() {
		end_tactical_cards()
	},
}

function end_tactical_cards() {
	for (let c of game.draw)
		set_add(game.hand[game.power], c)
	delete game.draw

	// MARIA: supply is before movement

	goto_movement()
}

/* TRANSFER TROOPS */

function count_stacked_take() {
	let n = 0
	for (let p of game.selected)
		n += 8 - game.troops[p]
	return n
}

function count_unstacked_take() {
	let here = game.pos[game.selected[0]]
	let n = 0
	for (let p of all_power_generals[game.power])
		if (game.pos[p] === here && !set_has(game.selected, p))
			n += 8 - game.troops[p]
	return n
}

function count_stacked_give() {
	let n = 0
	for (let p of game.selected)
		n += game.troops[p] - 1
	return n
}

function count_unstacked_give() {
	let here = game.pos[game.selected[0]]
	let n = 0
	for (let p of all_power_generals[game.power])
		if (game.pos[p] === here && !set_has(game.selected, p))
			n += game.troops[p] - 1
	return n
}

function take_troops(total) {
	let here = game.pos[game.selected[0]]

	let n = total
	for (let p of game.selected) {
		let x = Math.max(0, Math.min(n, 8 - game.troops[p]))
		game.troops[p] += x
		n -= x
	}

	n = total
	for (let p of all_power_generals_rev[game.power]) {
		if (game.pos[p] === here && !set_has(game.selected, p)) {
			let x = Math.max(0, Math.min(n, game.troops[p] - 1))
			game.troops[p] -= x
			n -= x
		}
	}
}

function give_troops(total) {
	let here = game.pos[game.selected[0]]

	let n = total
	for (let p of all_power_generals[game.power]) {
		if (game.pos[p] === here && !set_has(game.selected, p)) {
			let x = Math.max(0, Math.min(n, 8 - game.troops[p]))
			game.troops[p] += x
			n -= x
		}
	}

	n = total
	for (let p of game.selected) {
		let x = Math.max(0, Math.min(n, game.troops[p] - 1))
		game.troops[p] -= x
		n -= x
	}
}

/* MOVEMENT */

function goto_movement() {
	game.state = "movement"
	set_clear(game.moved)
}

function is_supreme_commander(p) {
	let s = game.pos[p]
	for (let other of all_generals)
		if (game.pos[other] === s)
			return other === p
	return false
}

states.movement = {
	prompt() {
		let done = true
		for (let p of all_power_generals[game.power]) {
			if (!set_has(game.moved, p) && is_supreme_commander(p) && game.pos[p] < ELIMINATED) {
				gen_action_piece(p)
				done = false
			}
		}

		for (let p of all_power_trains[game.power]) {
			if (!set_has(game.moved, p) && game.pos[p] < ELIMINATED) {
				gen_action_piece(p)
				done = false
			}
		}

		if (done)
			prompt("Movement done.")
		else
			prompt("Move your generals and supply trains.")

		view.actions.end_movement = 1
	},
	piece(p) {
		push_undo()

		game.selected = [ p ]
		let here = game.pos[p]
		for (let other of all_power_generals[game.power])
			if (other > p && game.pos[other] === here)
				game.selected.push(other)

		game.count = 0

		if (data.cities.major_roads[here].length > 0)
			game.major = 1
		else
			game.major = 0

		if (is_supply_train(p))
			resume_move_supply_train()
		else
			resume_move_general()
	},
	end_movement() {
		push_undo()
		goto_recruit()
	},
}

function format_move(max) {
	let n = max - game.count
	if (game.major)
		return ` up to ${n} + 1 cities.`
	return ` up to ${n} cities.`
}

function can_move_train_to(to) {
	return !has_any_piece(to)
}

function can_continue_train_from(_) {
	return true
}

function can_move_general_to(to) {
	if (has_friendly_supply_train(to))
		return false
	if (has_any_other_general(to))
		return false
	if (game.selected.length + count_pieces(to) > 3)
		return false
	return true
}

function can_continue_general_from(from) {
	if (has_enemy_supply_train(from))
		return false
	if (has_own_general(from))
		return false
	return true
}

function search_move(from, range, road_type, can_move_to, can_continue_from) {
	let seen = [ from, -1 ]
	let queue = [ from << 4 ]
	while (queue.length > 0) {
		let item = queue.shift()
		let here = item >> 4
		let dist = (item & 15) + 1
		for (let next of data.cities[road_type][here]) {
			if (map_has(seen, next))
				continue
			if (!can_move_to(next))
				continue
			if (dist <= range) {
				map_set(seen, next, here)
				if (can_continue_from(next))
					queue.push((next << 4) | dist)
			}
		}
	}
	return seen
}

function resume_move_supply_train() {
	if (game.count === 2 + game.major) {
		end_move_piece()
	} else {
		let here = game.pos[game.selected[0]]
		game.state = "move_supply_train"
		if (game.major && game.count < 3)
			game.move_major = search_move(here, 3 - game.count, "major_roads", can_move_train_to, can_continue_train_from)
		else
			game.move_major = []
		if (game.count < 2)
			game.move_minor = search_move(here, 2 - game.count, "adjacent", can_move_train_to, can_continue_train_from)
		else
			game.move_minor = []
	}
}

function resume_move_general() {
	if (game.count === 3 + game.major) {
		end_move_piece()
	} else {
		let here = game.pos[game.selected[0]]
		game.state = "move_general"
		if (game.major && game.count < 4)
			game.move_major = search_move(here, 4 - game.count, "major_roads", can_move_general_to, can_continue_general_from)
		else
			game.move_major = []
		if (game.count < 3)
			game.move_minor = search_move(here, 3 - game.count, "adjacent", can_move_general_to, can_continue_general_from)
		else
			game.move_minor = []
	}
}

function move_general_to(to) {
	let pow = game.power
	let who = game.selected[0]
	let from = game.pos[who]
	let stop = false

	for (let p of game.selected) {
		set_add(game.moved, p)
		game.pos[p] = to
	}

	// uniting stacks (turn all oos if one is oos)
	let oos = false
	for (let p of all_power_generals[game.power])
		if (game.pos[p] === to && is_out_of_supply(p))
			oos = true
	if (oos)
		for (let p of all_power_generals[game.power])
			if (game.pos[p] === to)
				set_out_of_supply(p)

	// conquer space
	if (is_conquest_space(pow, from) && !set_has(game.conquest, from)) {
		if (is_protected_from_conquest(from)) {
			set_add(game.retro, from)
		} else {
			log("Conquered S" + from)
			set_add(game.conquest, from)
		}
	}

	// re-conquer space
	if (is_reconquest_space(pow, from) && set_has(game.conquest, from)) {
		if (is_protected_from_reconquest(from)) {
			set_add(game.retro, from)
		} else {
			log("Reconquered S" + from)
			set_delete(game.conquest, from)
		}
	}

	// eliminate supply train
	for (let p of all_enemy_trains[pow]) {
		if (game.pos[p] === to) {
			log("Eliminate P" + p)
			game.pos[p] = ELIMINATED
			stop = true
		}
	}

	// uniting stacks: flag all as moved and stop moving
	for (let p of all_power_generals[pow]) {
		if (game.pos[p] === to && !set_has(game.selected, p)) {
			set_add(game.moved, p)
			stop = true
		}
	}

	return stop
}

function move_general_immediately(to) {
	for (let p of game.selected) {
		log("P" + p + " to S" + to)
		game.pos[p] = to
	}

	// uniting stacks (turn all oos if one is oos)
	let oos = false
	for (let p of all_power_generals[game.power])
		if (game.pos[p] === to && is_out_of_supply(p))
			oos = true
	if (oos)
		for (let p of all_power_generals[game.power])
			if (game.pos[p] === to)
				set_out_of_supply(p)

	// eliminate supply train
	for (let p of all_enemy_trains[game.power]) {
		if (game.pos[p] === to) {
			log("Eliminate P" + p)
			game.pos[p] = ELIMINATED
		}
	}
}

states.move_supply_train_NEW = {
	prompt() {
		prompt("Move supply train" + format_move(2))
		view.selected = game.selected

		let who = game.selected[0]
		let here = game.pos[who]

		if (game.move_major)
			map_for_each_key(game.move_major, s => { if (s !== here) gen_action_space(s) })
		if (game.move_minor)
			map_for_each_key(game.move_minor, s => { if (s !== here) gen_action_space(s) })

		view.move_major = game.move_major
		view.move_minor = game.move_minor

		/*
		if (game.count < 2 + game.major)
			for (let next of data.cities.major_roads[here])
				if (!has_any_piece(next))
					gen_action_space(next)
		if (game.count < 2)
			for (let next of data.cities.roads[here])
				if (!has_any_piece(next))
					gen_action_space(next)
		*/

		if (game.count > 0) {
			gen_action_piece(who)
			view.actions.stop = 1
		}
	},
	piece(_) {
		this.stop()
	},
	stop() {
		end_move_piece()
	},
	space(to) {
		let who = game.selected[0]

		set_add(game.moved, who)
		game.pos[who] = to

		log("P" + who + " to S" + to)

		let m = map_get(game.move_major, to, 0)
		if (m > 0) {
			while (m > 0) {
				// TODO: reverse
				log(">S" + m)
				m = map_get(game.move_major, m)
				++ game.count
			}
		} else {
			m = map_get(game.move_minor, to, 0)
			while (m > 0) {
				// TODO: reverse
				log(">S" + m)
				m = map_get(game.move_minor, m)
				++ game.count
			}
			game.major = 0
		}

		resume_move_supply_train()
	},
}

states.move_supply_train_OLD = {
	prompt() {
		prompt("Move supply train" + format_move(2))
		view.selected = game.selected

		let who = game.selected[0]
		let here = game.pos[who]

		if (game.count < 2 + game.major)
			for (let next of data.cities.major_roads[here])
				if (!has_any_piece(next))
					gen_action_space(next)
		if (game.count < 2)
			for (let next of data.cities.roads[here])
				if (!has_any_piece(next))
					gen_action_space(next)

		if (game.count > 0) {
			gen_action_piece(who)
			view.actions.stop = 1
		}
	},
	piece(_) {
		this.stop()
	},
	stop() {
		end_move_piece()
	},
	space(to) {
		let who = game.selected[0]
		let here = game.pos[who]

		log("P" + who + " to S" + to)

		if (!set_has(data.cities.major_roads[here], to))
			game.major = 0

		set_add(game.moved, who)
		game.pos[who] = to

		if (++game.count === 2 + game.major)
			end_move_piece()
	},
}

states.move_general_NEW = {
	prompt() {
		prompt("Move " + format_selected() + format_move(3))
		view.selected = game.selected

		let who = game.selected[0]
		let here = game.pos[who]

		if (game.count === 0) {
			if (game.selected.length > 1)
				view.actions.detach = 1
			else
				view.actions.detach = 0

			let s_take = count_stacked_take()
			let s_give = count_stacked_give()
			let u_take = count_unstacked_take()
			let u_give = count_unstacked_give()
			if (s_take > 0 && u_give > 0)
				view.actions.take = 1
			if (s_give > 0 && u_take > 0)
				view.actions.give = 1
		} else {
			gen_action_piece(who)
			view.actions.stop = 1
		}

		view.move_major = game.move_major
		view.move_minor = game.move_minor

		if (game.move_major)
			map_for_each_key(game.move_major, s => { if (s !== here) gen_action_space_or_piece(s) })
		if (game.move_minor)
			map_for_each_key(game.move_minor, s => { if (s !== here) gen_action_space_or_piece(s) })
	},
	take() {
		game.state = "move_take"
	},
	give() {
		game.state = "move_give"
	},
	detach() {
		game.state = "move_detach"
	},
	piece(p) {
		if (p === game.selected[0])
			this.stop()
		else
			this.space(game.pos[p])
	},
	stop() {
		for (let p of game.selected)
			set_add(game.moved, p)
		end_move_piece()
	},
	space(to) {
		let who = game.selected[0]
		let path = [ to ]

		let m = map_get(game.move_major, to, -1)
		if (m >= 0) {
			while (m >= 0) {
				path.unshift(m)
				m = map_get(game.move_major, m, -1)
				++game.count
			}
		} else {
			m = map_get(game.move_minor, to, -1)
			while (m >= 0) {
				path.unshift(m)
				m = map_get(game.move_minor, m, -1)
				++game.count
			}
			game.major = 0
		}

		log("P" + who + " " + path.map(s => "S" + s).join(" > "))

		let stop = false
		path.shift() // skip start space
		for (let s of path)
			stop ||= move_general_to(s)

		if (stop)
			this.stop()
		else
			resume_move_general()
	},
}

states.move_general_OLD = {
	prompt() {
		prompt("Move " + format_selected() + format_move(3))
		view.selected = game.selected

		let who = game.selected[0]
		let here = game.pos[who]

		if (game.count === 0) {
			if (game.selected.length > 1)
				view.actions.detach = 1
			else
				view.actions.detach = 0

			let s_take = count_stacked_take()
			let s_give = count_stacked_give()
			let u_take = count_unstacked_take()
			let u_give = count_unstacked_give()

			if (s_take > 0 && u_give > 0)
				view.actions.take = 1
			if (s_give > 0 && u_take > 0)
				view.actions.give = 1
		} else {
			gen_action_piece(who)
			view.actions.stop = 1
		}

		if (game.count < 3 + game.major)
			for (let next of data.cities.major_roads[here])
				if (can_move_general_to(next))
					gen_action_space_or_piece(next)

		if (game.count < 3)
			for (let next of data.cities.roads[here])
				if (can_move_general_to(next))
					gen_action_space_or_piece(next)
	},
	take() {
		game.state = "move_take"
	},
	give() {
		game.state = "move_give"
	},
	detach() {
		game.state = "move_detach"
	},
	piece(p) {
		if (p === game.selected[0])
			this.stop()
		else
			this.space(game.pos[p])
	},
	stop() {
		for (let p of game.selected)
			set_add(game.moved, p)
		end_move_piece()
	},
	space(to) {
		let who = game.selected[0]
		let from = game.pos[who]

		log("P" + who + " to S" + to)

		if (!set_has(data.cities.major_roads[from], to))
			game.major = 0

		if (move_general_to(to) || ++game.count === 3 + game.major)
			end_move_piece()
	},
}

states.move_general = states.move_general_OLD
states.move_supply_train = states.move_supply_train_OLD
//states.move_general = states.move_general_NEW
//states.move_supply_train = states.move_supply_train_NEW

states.move_detach = {
	prompt() {
		prompt("Move " + format_selected() + ". Detach general from stack.")
		for (let p of game.selected)
			gen_action_piece(p)
	},
	piece(p) {
		set_delete(game.selected, p)
		game.state = "move_general"
	},
}

states.move_take = {
	prompt() {
		prompt("Transfer troops to " + format_selected() + ".")
		let take = count_stacked_take()
		let give = count_unstacked_give()
		let n = Math.min(take, give)
		view.actions.value = []
		for (let i = 1; i <= n; ++i)
			view.actions.value.push(i)
	},
	value(v) {
		take_troops(v)
		if (game.state === "laudon_take")
			game.state = "austria_may_move_laudon_by_one_city_immediately"
		else
			game.state = "move_general"
	},
}

states.move_give = {
	prompt() {
		prompt("Transfer troops from " + format_selected() + ".")
		let take = count_unstacked_take()
		let give = count_stacked_give()
		let n = Math.min(take, give)
		view.actions.value = []
		for (let i = 1; i <= n; ++i)
			view.actions.value.push(i)
	},
	value(v) {
		give_troops(v)
		if (game.state === "laudon_give")
			game.state = "austria_may_move_laudon_by_one_city_immediately"
		else
			game.state = "move_general"
	},
}

function end_move_piece() {
	game.selected = null
	delete game.move_major
	delete game.move_minor
	game.state = "movement"
}

/* RECRUITMENT */

function troop_cost() {
	if (game.re_enter !== undefined)
		return 8
	return 6
}

function has_available_depot() {
	for (let s of all_power_depots[game.power])
		if (!has_enemy_piece(s))
			return true
	return false
}

function goto_recruit() {
	push_undo()
	game.count = 0

	// TODO: reveal too much if we skip recruitment phase?
	if (count_eliminated_trains() === 0 && count_used_troops() === max_power_troops(game.power)) {
		end_recruit()
		return
	}

	// if all depots have enemy pieces, choose ONE city in XXX sector and COST is 8
	if (has_available_depot())
		game.state = "recruit"
	else
		game.state = "re_enter_choose_city"
}

states.re_enter_choose_city = {
	prompt() {
		prompt("Choose city to re-enter troops.")
		for (let s of all_power_re_entry_cities[game.power])
			if (!has_enemy_piece(s))
				gen_action_space(s)
	},
	space(s) {
		push_undo()
		game.re_enter = s
		game.state = "recruit"
	},
}

function has_re_entry_space(p) {
	let can_re_enter_at = is_general(p) ? can_re_enter_general : can_re_enter_supply_train
	if (game.re_enter !== undefined)
		return can_re_enter_at(game.re_enter)
	for (let s of all_power_depots[game.power])
		if (can_re_enter_at(s))
			return true
	return false
}

states.recruit = {
	prompt() {
		let cost = troop_cost()
		let buy_amount = (game.count / cost) | 0
		let n_troops = count_used_troops()
		let av_troops = max_power_troops(game.power) - n_troops
		let av_trains = count_eliminated_trains()

		if (av_trains === 0 && av_troops === 0)
			prompt(`Nothing to recruit. ${n_troops}/${max_power_troops(game.power)} troops.`)
		else
			prompt(`Recruit supply trains and/or troops. ${n_troops}/${max_power_troops(game.power)} troops. ${game.count} points.`)

		if (buy_amount < av_troops + av_trains) {
			for (let c of game.hand[game.power])
				gen_action_card(c)
		}

		if (game.count >= cost) {
			if (av_troops > 0) {
				for (let p of all_power_generals[game.power]) {
					if (game.troops[p] > 0 && game.troops[p] < 8)
						gen_action_supreme_commander(game.pos[p])
					else if (game.pos[p] === ELIMINATED && has_re_entry_space(p))
						gen_action_piece(p)
				}
			}
			if (av_trains > 0) {
				for (let p of all_power_trains[game.power]) {
					if (game.pos[p] === ELIMINATED && has_re_entry_space(p))
						gen_action_piece(p)
				}
			}
		}

		// don't force buying a T
		if (buy_amount === 0 || av_troops === 0)
			view.actions.end_recruit = 1
	},
	card(c) {
		push_undo()
		log("Recruit with C" + c)
		array_remove_item(game.hand[game.power], c)
		game.count += is_reserve(c) ? 10 : to_value(c)
	},
	piece(p) {
		push_undo()
		game.count -= troop_cost()
		if (game.pos[p] === ELIMINATED) {
			game.selected = [ p ]
			game.state = "re_enter"
		} else {
			add_one_troop(p)
		}
	},
	end_recruit() {
		push_undo()
		end_recruit()
	},
}

function end_recruit() {
	delete game.re_enter
	goto_combat()
}

function can_re_enter_general(to) {
	if (has_friendly_supply_train(to))
		return false
	if (has_any_other_general(to))
		return false
	if (1 + count_pieces(to) > 3)
		return false
	return true
}

function can_re_enter_supply_train(s) {
	return !has_any_piece(s)
}

states.re_enter = {
	prompt() {
		prompt("Re-enter " + format_selected() + ".")
		let p = game.selected[0]
		let can_re_enter_at = is_general(p) ? can_re_enter_general : can_re_enter_supply_train

		if (game.re_enter !== undefined) {
			if (can_re_enter_at(game.re_enter))
				gen_action_space(game.re_enter)
		} else {
			for (let s of all_power_depots[game.power])
				if (can_re_enter_at(s))
					gen_action_space(s)
		}
	},
	space(s) {
		let p = game.selected[0]
		log("Re-entered P" + p + " at S" + s + ".")
		game.pos[p] = s
		if (set_has(all_power_generals[game.power], p))
			game.troops[p] = 1
		game.selected = null
		game.state = "recruit"
	},
}

/* COMBAT */

function format_combat(value) {
	return format_stack(game.attacker) + " vs " + format_stack(game.defender) + " at " + value
}

function prompt_combat(value, extra = null) {
	if (extra)
		prompt(format_combat(value) + ". " + extra)
	else
		prompt(format_combat(value) + ".")
}

function inactive_combat() {
	return "play TC for " + format_combat(game.count)
}

function goto_combat() {
	set_clear(game.moved)

	let from = []
	let to = []

	for (let p of all_power_generals[game.power])
		if (game.pos[p] < ELIMINATED)
			set_add(from, game.pos[p])

	for (let p of all_enemy_generals[game.power])
		if (game.pos[p] < ELIMINATED)
			set_add(to, game.pos[p])

	game.combat = []
	for (let a of from) {
		for (let b of to) {
			if (set_has(data.cities.adjacent[a], b)) {
				game.combat.push(a)
				game.combat.push(b)
			}
		}
	}

	if (game.combat.length > 0)
		game.state = "combat"
	else
		goto_retroactive_conquest()
}

states.combat = {
	prompt() {
		prompt("Combat!")
		for (let i = 0; i < game.combat.length; i += 2)
			gen_action_supreme_commander(game.combat[i])
	},
	piece(p) {
		push_undo()
		game.attacker = game.pos[p]
		game.state = "combat_target"
	},
}

states.combat_target = {
	prompt() {
		prompt("Choose enemy stack to fight.")
		for (let i = 0; i < game.combat.length; i += 2)
			if (game.combat[i] === game.attacker)
				gen_action_supreme_commander(game.combat[i+1])
	},
	piece(p) {
		clear_undo()

		game.defender = game.pos[p]

		for (let i = 0; i < game.combat.length; i += 2) {
			if (game.combat[i] === game.attacker && game.combat[i+1] === game.defender) {
				array_remove_pair(game.combat, i)
				break
			}
		}

		goto_combat_play()
	},
}

function set_active_attacker() {
	set_active_to_power(get_stack_power(game.attacker))
}

function set_active_defender() {
	set_active_to_power(get_stack_power(game.defender))
}

function goto_combat_play() {
	let a_troops = 0
	let d_troops = 0

	for (let p of all_generals) {
		if (game.pos[p] === game.attacker)
			a_troops += game.troops[p]
		if (game.pos[p] === game.defender)
			d_troops += game.troops[p]
	}

	log_br()

	let a = get_supreme_commander(game.attacker)
	let d = get_supreme_commander(game.defender)
	log(`P${a} (${a_troops}) at S${game.attacker}`)
	log(`P${d} (${d_troops}) at S${game.defender}`)

	game.count = a_troops - d_troops

	if (game.count <= 0) {
		set_active_attacker()
		game.state = "combat_attack"
	} else {
		set_active_defender()
		game.state = "combat_defend"
	}
}

function resume_combat_attack() {
	if (game.count >= 0) {
		game.state = "combat_attack_swap"
	} else {
		game.state = "combat_attack"
	}
}

function resume_combat_defend() {
	if (game.count <= 0) {
		game.state = "combat_defend_swap"
	} else {
		game.state = "combat_defend"
	}
}

function gen_play_card(suit) {
	let has_suit = false
	for (let c of game.hand[game.power]) {
		let c_suit = to_suit(c)
		if (c_suit === suit) {
			has_suit = true
			gen_action_card(c)
		}
		else if (c_suit === RESERVE)
			gen_action_card(c)
	}
	return has_suit
}

states.combat_attack = {
	inactive: inactive_combat,
	prompt() {
		prompt_combat(game.count)
		view.selected = [ get_supreme_commander(game.attacker) ]
		let has_suit = gen_play_card(get_space_suit(game.attacker))
		if (game.count === 0 && has_suit)
			view.actions.pass = 0
		else
			view.actions.pass = 1
	},
	card(c) {
		push_undo()

		array_remove_item(game.hand[game.power], c)
		let c_suit = to_suit(c)
		if (c_suit === RESERVE) {
			game.state = "combat_attack_reserve"
		} else {
			game.count += to_value(c)
			log(POWER_NAME[game.power] + " C" + c + " = " + (game.count))
			resume_combat_attack()
		}
	},
	pass() {
		clear_undo()
		resolve_combat()
	},
}

states.combat_defend = {
	inactive: inactive_combat,
	prompt() {
		prompt_combat(-game.count)

		view.selected = [ get_supreme_commander(game.defender) ]
		let has_suit = gen_play_card(get_space_suit(game.defender))
		if (game.count === 0 && has_suit)
			view.actions.pass = 0
		else
			view.actions.pass = 1
	},
	card(c) {
		push_undo()

		array_remove_item(game.hand[game.power], c)
		let c_suit = to_suit(c)
		if (c_suit === RESERVE) {
			game.state = "combat_defend_reserve"
		} else {
			game.count -= to_value(c)
			log(POWER_NAME[game.power] + " C" + c + " = " + (game.count))
			resume_combat_defend()
		}
	},
	pass() {
		clear_undo()
		resolve_combat()
	},
}

states.combat_attack_reserve = {
	inactive: inactive_combat,
	prompt() {
		prompt_combat(game.count, "Choose value.")
		view.selected = [ get_supreme_commander(game.attacker)]
		view.actions.value = [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 ]
	},
	value(v) {
		log(POWER_NAME[game.power] + " reserve " + v)
		game.count += v
		resume_combat_attack()
	},
}

states.combat_defend_reserve = {
	inactive: inactive_combat,
	prompt() {
		prompt_combat(-game.count, "Choose value.")
		view.selected = [ get_supreme_commander(game.defender) ]
		view.actions.value = [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 ]
	},
	value(v) {
		log(POWER_NAME[game.power] + " reserve " + v)
		game.count -= v
		resume_combat_defend()
	},
}

states.combat_attack_swap = {
	inactive: inactive_combat,
	prompt() {
		prompt_combat(game.count)
		view.selected = [ get_supreme_commander(game.attacker) ]
		view.actions.next = 1
	},
	next() {
		clear_undo()
		set_active_defender()
		game.state = "combat_defend"
	},
}

states.combat_defend_swap = {
	inactive: inactive_combat,
	prompt() {
		prompt_combat(-game.count)
		view.selected = [ get_supreme_commander(game.defender) ]
		view.actions.next = 1
	},
	next() {
		clear_undo()
		set_active_attacker()
		game.state = "combat_attack"
	},
}

function select_stack(s) {
	let list = []
	for (let p of all_generals)
		if (game.pos[p] === s)
			list.push(p)
	return list
}

function resolve_combat() {
	if (game.count === 0) {
		log("Tie.")
		next_combat()
	} else if (game.count > 0) {
		if (get_supreme_commander(game.defender) == GEN_HILDBURGHAUSEN)
			game.ia_lost = 1
		game.vg = get_supreme_commander(game.attacker)
		game.selected = select_stack(game.defender)
		goto_retreat()
	} else {
		if (get_supreme_commander(game.attacker) == GEN_HILDBURGHAUSEN)
			game.ia_lost = 1
		game.vg = get_supreme_commander(game.defender)
		game.selected = select_stack(game.attacker)
		goto_retreat()
	}
}

function next_combat() {
	clear_undo()
	log_br()
	set_active_to_current_action_step()
	game.count = 0
	delete game.attacker
	delete game.defender
	if (game.combat.length > 0)
		game.state = "combat"
	else
		game.state = "combat_done"
}

states.combat_done = {
	prompt() {
		prompt("Combat done.")
		view.actions.end_combat = 1
	},
	end_combat() {
		goto_retroactive_conquest()
	},
}

/* RETREAT */

function get_winner() {
	return game.count > 0 ? game.attacker : game.defender
}

function get_loser() {
	return game.count < 0 ? game.attacker : game.defender
}

function set_active_winner() {
	if (game.count > 0)
		set_active_attacker()
	else
		set_active_defender()
}

function goto_retreat() {
	let hits = Math.abs(game.count)

	let loser = get_loser()

	// no more fighting for the loser
	for (let i = game.combat.length - 2; i >= 0; i -= 2)
		if (game.combat[i] === loser || game.combat[i+1] === loser)
			array_remove_pair(game.combat, i)

	log("P" + get_supreme_commander(loser) + " lost " + hits + " troops.")

	// apply hits
	for (let i = game.selected.length - 1; i >= 0 && hits > 0; --i) {
		let p = game.selected[i]
		while (game.troops[p] > 1 && hits > 0) {
			--game.troops[p]
			--hits
		}
	}

	for (let i = game.selected.length - 1; i >= 0 && hits > 0; --i) {
		let p = game.selected[i]
		while (game.troops[p] > 0 && hits > 0) {
			--game.troops[p]
			--hits
		}
	}

	resume_retreat()
}

function resume_retreat() {
	// eliminate generals with no more hits
	for (let p of game.selected) {
		if (game.troops[p] === 0) {
			game.state = "retreat_eliminate_hits"
			return
		}
	}

	// retreat remaining generals
	if (game.selected.length > 0) {
		game.retreat = search_retreat(get_loser(), get_winner(), Math.abs(game.count))
		if (game.retreat.length > 0) {
			// victor chooses retreat destination
			set_active_winner()
			game.state = "retreat"
		} else {
			// eliminate if there are no retreat possibilities
			delete game.retreat
			game.state = "retreat_eliminate_trapped"
		}
		return
	}

	// no retreat if generals wiped out
	next_combat()
}

states.retreat_eliminate_hits = {
	prompt() {
		prompt("Eliminate generals without troops.")
		// remove eliminated generals
		for (let p of game.selected)
			if (game.troops[p] === 0)
				gen_action_piece(p)
	},
	piece(p) {
		log("P" + p + " eliminated.")
		game.pos[p] = ELIMINATED
		set_delete(game.selected, p)
		resume_retreat()
	},
}

states.retreat_eliminate_trapped = {
	prompt() {
		prompt("Eliminate " + format_selected() + " without a retreat path.")
		for (let p of game.selected)
			gen_action_piece(p)
	},
	piece(_) {
		log("Trapped.")
		for (let p of game.selected) {
			game.pos[p] = ELIMINATED
			game.troops[p] = 0
		}
		next_combat()
	},
}

// search distances from winner within retreat range
function search_retreat_distance(from, range) {
	let seen = [ from, 0 ]
	let queue = [ from << 4 ]
	while (queue.length > 0) {
		let item = queue.shift()
		let here = item >> 4
		let dist = (item & 15) + 1
		for (let next of data.cities.adjacent[here]) {
			if (map_has(seen, next))
				continue
			if (dist <= range) {
				map_set(seen, next, dist)
				queue.push((next << 4) | dist)
			}
		}
	}
	return seen
}

// search all possible retreat paths of given length
function search_retreat_possible_dfs(result, seen, here, range) {
	for (let next of data.cities.adjacent[here]) {
		if (seen.includes(next))
			continue
		if (has_any_piece(next))
			continue
		if (range === 1) {
			map_set(result, next, seen.slice())
		} else {
			seen.push(next)
			search_retreat_possible_dfs(result, seen, next, range - 1)
			seen.pop()
		}
	}
}

function search_retreat_possible(from, range) {
	let result = []
	search_retreat_possible_dfs(result, [from], from, range)
	return result
}

function search_retreat(loser, winner, range) {
	let distance = search_retreat_distance(winner, range + 1)
	let possible = search_retreat_possible(loser, range)

	let max = 0
	for (let s of possible) {
		let d = map_get(distance, s, -1)
		if (d > max)
			max = d
	}

	let result = []
	map_for_each(possible, (s, path) => {
		if (map_get(distance, s, -1) === max) {
			result.push(s)
			result.push(path)
		}
	})
	return result
}

states.retreat = {
	prompt() {
		prompt("Retreat " + format_selected() + " " + Math.abs(game.count) + " cities.")
		view.selected = game.selected
		view.retreat = game.retreat
		map_for_each_key(game.retreat, gen_action_space)
	},
	space(to) {
		push_undo()
		log("Retreated to S" + to + ".")
		for (let p of game.selected) {
			game.pos[p] = to
		}
		delete game.retreat
		next_combat()
	},
}

states.retreat_done = {
	prompt() {
		prompt("Retreat done.")
		view.actions.next = 1
	},
	next() {
		next_combat()
	},
}

/* RETRO-ACTIVE CONQUEST */

function goto_retroactive_conquest() {
	delete game.combat

	for (let s of game.retro) {
		if (is_conquest_space(game.power, s)) {
			if (!is_protected_from_conquest(s)) {
				log("Conquered S" + s)
				set_add(game.conquest, s)
			}
		}
		if (is_reconquest_space(game.power, s)) {
			if (!is_protected_from_reconquest(s)) {
				log("Reconquered S" + s)
				set_delete(game.conquest, s)
			}
		}
	}

	set_clear(game.retro)

	// MARIA: supply is before movement

	goto_supply()
}

/* SUPPLY */

function search_supply_bfs(from, range) {
	let seen = [ from ]
	let queue = [ from << 4 ]
	while (queue.length > 0) {
		let item = queue.shift()
		let here = item >> 4
		let dist = (item & 15) + 1
		for (let next of data.cities.adjacent[here]) {
			if (set_has(seen, next))
				continue
			if (has_enemy_piece(next))
				continue
			set_add(seen, next)
			if (dist < range)
				queue.push((next << 4) | dist)
		}
	}
	return seen
}

function search_supply(range) {
	for (let p of all_power_trains[game.power]) {
		let here = game.pos[p]
		if (here >= ELIMINATED)
			continue
		if (!game.supply)
			game.supply = search_supply_bfs(here, range)
		else
			set_add_all(game.supply, search_supply_bfs(here, range))
	}
}

function is_out_of_supply(p) {
	return (game.oos & (1 << p)) !== 0
}

function set_out_of_supply(p) {
	return game.oos |= (1 << p)
}

function set_in_supply(p) {
	return game.oos &= ~(1 << p)
}

function has_supply_line(p) {
	if (!game.supply)
		return false
	let s = game.pos[p]
	if (set_has(all_home_or_depot_cities[game.power], s))
		return true
	if (game.supply && set_has(game.supply, s))
		return true
	return false
}

function should_flip_generals() {
	for (let p of all_power_generals[game.power]) {
		if (game.pos[p] >= ELIMINATED)
			continue
		if (set_has(game.moved, p))
			continue
		if (is_out_of_supply(p) || !has_supply_line(p))
			return true
	}
	return false
}

function goto_supply() {
	set_clear(game.moved)
	search_supply(6)
	if (should_flip_generals())
		game.state = "supply"
	else
		end_supply()
}

states.supply = {
	prompt() {
		prompt("Supply.")
		for (let p of all_power_generals[game.power]) {
			if (game.pos[p] >= ELIMINATED)
				continue
			if (set_has(game.moved, p))
				continue
			if (is_out_of_supply(p) || !has_supply_line(p))
				gen_action_supreme_commander(game.pos[p])
		}
	},
	piece(x) {
		let s = game.pos[x]
		for (let p of all_power_generals[game.power]) {
			if (game.pos[p] === s) {
				set_add(game.moved, p)
				if (is_out_of_supply(p)) {
					set_in_supply(p)
					if (!has_supply_line(p)) {
						log("P" + p + " eliminated.")
						game.pos[p] = ELIMINATED
						game.troops[p] = 0
					} else {
						log("P" + p + " in supply.")
					}
				} else {
					log("P" + p + " out of supply.")
					set_out_of_supply(p)
				}
			}
		}
		if (!should_flip_generals())
			game.state = "supply_done"
	},
}

states.supply_done = {
	prompt() {
		prompt("Supply done.")
		view.actions.end_supply = 1
	},
	end_supply() {
		end_supply()
	},
}

function end_supply() {
	set_clear(game.moved)
	delete game.supply
	end_action_stage()
}

/* STROKES OF FATE */

const strokes_of_fate_name = [
	"Poems",
	"Lord Bute",
	"Elisabeth",
	"Sweden",
	"India",
	"America",
]

states.russia_quits_the_game_1 = {
	prompt() {
		prompt("Russia quits the game. Remove all Russian pieces.")
		for (let p of all_power_generals[P_RUSSIA])
			gen_action_piece(p)
		for (let p of all_power_trains[P_RUSSIA])
			gen_action_piece(p)
	},
	piece(p) {
		game.pos[p] = REMOVED
		if (is_general(p))
			game.troops[p] = 0
		if (has_removed_all_pieces(P_RUSSIA))
			game.state = "russia_quits_the_game_2"
	},
}

states.russia_quits_the_game_2 = {
	prompt() {
		prompt("Russia quits the game. Retire one Prussian general.")
		for (let p of all_power_generals[game.power])
			if (p !== GEN_FRIEDRICH && game.pos[p] < ELIMINATED)
				gen_action_piece(p)
	},
	piece(p) {
		push_undo()
		retire_general(p)
		game.state = "russia_quits_the_game_3"
	},
}

states.russia_quits_the_game_3 = {
	prompt() {
		prompt("Russia quits the game.")
		view.actions.done = 1
	},
	done() {
		remove_power_from_play(P_RUSSIA)
		resume_start_turn()
	},
}

states.sweden_quits_the_game_1 = {
	prompt() {
		prompt("Sweden quits the game. Remove all Swedish pieces.")
		for (let p of all_power_generals[P_SWEDEN])
			gen_action_piece(p)
		for (let p of all_power_trains[P_SWEDEN])
			gen_action_piece(p)
	},
	piece(p) {
		game.pos[p] = REMOVED
		if (is_general(p))
			game.troops[p] = 0
		if (has_removed_all_pieces(P_SWEDEN))
			game.state = "sweden_quits_the_game_2"
	},
}

states.sweden_quits_the_game_2 = {
	prompt() {
		prompt("Sweden quits the game. Retire one Prussian general.")
		for (let p of all_power_generals[game.power])
			if (p !== GEN_FRIEDRICH && game.pos[p] < ELIMINATED)
				gen_action_piece(p)
	},
	piece(p) {
		push_undo()
		retire_general(p)
		game.state = "sweden_quits_the_game_3"
	},
}

states.sweden_quits_the_game_3 = {
	prompt() {
		prompt("Sweden quits the game.")
		view.actions.done = 1
	},
	done() {
		remove_power_from_play(P_SWEDEN)
		resume_start_turn()
	},
}

states.france_quits_the_game_1 = {
	prompt() {
		prompt("France quits the game. Remove all French pieces.")
		for (let p of all_power_generals[P_FRANCE])
			gen_action_piece(p)
		for (let p of all_power_trains[P_FRANCE])
			gen_action_piece(p)
	},
	piece(p) {
		game.pos[p] = REMOVED
		if (is_general(p))
			game.troops[p] = 0
		if (has_removed_all_pieces(P_FRANCE))
			game.state = "france_quits_the_game_2"
	},
}

states.france_quits_the_game_2 = {
	prompt() {
		prompt("France quits the game. Retire Cumberland.")
		gen_action_piece(GEN_CUMBERLAND)
	},
	piece(p) {
		retire_general(p)
		remove_power_from_play(P_FRANCE)
		resume_start_turn()
	},
}

/* CARDS OF FATE (IMMEDIATE) */

const fate_effect_immediate = [
	null,
	any_one_russian_on_map_general_receives_a_new_troop_for_free,
	austria_and_russia_may_exchange_one_tc_with_each_other,
	tottleben_receives_a_new_troop_for_free,

	null,
	null,
	apraxin_immediately_loses_one_troop,
	null,

	null,
	null,
	null,
	null,

	null,
	null,
	france_may_discard_any_one_tc_for_a_new_one_from_the_draw_deck,
	null,

	null,
	null,
	null,
	null,

	austria_may_move_laudon_by_one_city_immediately,
	daun_receives_one_new_troop,
	null,
	austria_may_flip_any_one_prussian_general_or_stack_in_austria_or_saxony,

	null,
	null,
	null,
	null,

	any_one_prussian_on_map_general_receives_a_new_troop_for_free,
	null,
	null,
	null,

	all_russian_generals_5_or_6_cities_distant_from_their_nearest_supply_train_are_immediately_out_of_supply,
	null,
	null,
	prussia_may_draw_randomly_one_tc_from_austria_after_first_giving_one_tc_of_her_choice_to_austria,

	null,
	any_one_prussian_general_with_2_or_more_troops_loses_one_troop_immediately,
	null,
	null,

	null,
	any_one_hanoverian_on_map_general_receives_a_new_troop,
	null,
	null,

	null,
	if_ehrensvärd_is_5_or_6_cities_distant_from_his_supply_train_he_is_immediately_out_of_supply,
	if_hildburghausen_has_lost_a_battle_this_turn_prussia_may_move_him_2_cities_westwards,
	null,
]

function any_one_russian_on_map_general_receives_a_new_troop_for_free() {
	goto_receive_a_new_troop(P_RUSSIA, all_power_generals[P_RUSSIA])
}

function tottleben_receives_a_new_troop_for_free() {
	goto_receive_a_new_troop(P_RUSSIA, [ GEN_TOTTLEBEN ])
}

function daun_receives_one_new_troop() {
	goto_receive_a_new_troop(P_AUSTRIA, [ GEN_DAUN ])
}

function any_one_prussian_on_map_general_receives_a_new_troop_for_free() {
	goto_receive_a_new_troop(P_PRUSSIA, all_power_generals[P_PRUSSIA])
}

function any_one_hanoverian_on_map_general_receives_a_new_troop() {
	goto_receive_a_new_troop(P_HANOVER, all_power_generals[P_HANOVER])
}

function apraxin_immediately_loses_one_troop() {
	goto_lose_one_troop(P_RUSSIA, [ GEN_APRAXIN ])
}

function any_one_prussian_general_with_2_or_more_troops_loses_one_troop_immediately() {
	goto_lose_one_troop(P_PRUSSIA, all_power_generals[P_PRUSSIA])
}

function all_russian_generals_5_or_6_cities_distant_from_their_nearest_supply_train_are_immediately_out_of_supply() {
	goto_flip_5_or_6_from_nearest_train(P_RUSSIA, all_power_generals[P_RUSSIA])
}

function if_ehrensvärd_is_5_or_6_cities_distant_from_his_supply_train_he_is_immediately_out_of_supply() {
	goto_flip_5_or_6_from_nearest_train(P_SWEDEN, [ GEN_EHRENSVAERD ])
}

function austria_may_flip_any_one_prussian_general_or_stack_in_austria_or_saxony() {
	set_active_to_power(P_AUSTRIA)

	game.selected = []
	for (let p of all_power_generals[P_PRUSSIA])
		if (!is_out_of_supply(p) && (set_has(data.country.Austria, p) || set_has(data.country.Saxony, p)))
			game.selected.push(p)

	if (game.selected.length > 0) {
		game.state = "flip_any_one_prussian_general_or_stack_in_austria_or_saxony"
	} else {
		resume_start_turn()
	}
}

function austria_and_russia_may_exchange_one_tc_with_each_other() {
	set_active_to_power(P_AUSTRIA)
	if (!has_power_dropped_out(P_RUSSIA))
		game.state = "austria_and_russia_may_exchange_one_tc_with_each_other_1"
	else
		resume_start_turn()
}

function france_may_discard_any_one_tc_for_a_new_one_from_the_draw_deck() {
	set_active_to_power(P_FRANCE)
	if (!has_power_dropped_out(P_FRANCE))
		game.state = "france_may_discard_any_one_tc_for_a_new_one_from_the_draw_deck"
	else
		resume_start_turn()
}

function prussia_may_draw_randomly_one_tc_from_austria_after_first_giving_one_tc_of_her_choice_to_austria() {
	set_active_to_power(P_PRUSSIA)
	game.state = "prussia_may_draw_randomly_one_tc_from_austria_after_first_giving_one_tc_of_her_choice_to_austria"
}

function austria_may_move_laudon_by_one_city_immediately() {
	set_active_to_power(P_AUSTRIA)
	if (game.pos[GEN_LAUDON] < ELIMINATED) {
		game.state = "austria_may_move_laudon_by_one_city_immediately"
		game.selected = [ GEN_LAUDON ]
	} else {
		resume_start_turn()
	}
}

function if_hildburghausen_has_lost_a_battle_this_turn_prussia_may_move_him_2_cities_westwards() {
	set_active_to_power(P_PRUSSIA)
	if (game.ia_lost)
		game.state = "prussia_may_move_hildburghausen_2_cities_westwards"
	else
		resume_start_turn()
}

function goto_receive_a_new_troop(power, list) {
	set_active_to_power(power)

	if (count_used_troops() === max_power_troops(power)) {
		resume_start_turn()
		return
	}

	game.selected = []
	for (let p of list)
		if (game.pos[p] < ELIMINATED && game.troops[p] < 8)
			game.selected.push(p)

	if (game.selected.length > 0) {
		game.state = "receive_a_new_troop"
	} else {
		resume_start_turn()
	}
}

states.receive_a_new_troop = {
	prompt() {
		prompt("Receive a new troop for free.")
		for (let p of game.selected)
			gen_action_supreme_commander(game.pos[p])
	},
	piece(p) {
		add_one_troop(p)
		resume_start_turn()
	}
}

function goto_lose_one_troop(power, list) {
	set_active_to_power(power)

	game.selected = []
	for (let p of list)
		if (game.pos[p] < ELIMINATED && game.troops[p] > 1)
			game.selected.push(p)

	if (game.selected.length > 0) {
		game.state = "lose_one_troop"
	} else {
		resume_start_turn()
	}
}

states.lose_one_troop = {
	prompt() {
		prompt("Lose one troop.")
		for (let p of game.selected)
			gen_action_supreme_commander(game.pos[p])
	},
	piece(p) {
		remove_one_troop(p)
		resume_start_turn()
	}
}

function goto_flip_5_or_6_from_nearest_train(power, list) {
	set_active_to_power(power)

	search_supply(4)

	game.selected = []
	for (let p of list)
		if (game.pos[p] < ELIMINATED && !is_out_of_supply(p))
			if (!set_has(game.supply, game.pos[p]))
				game.selected.push(p)

	delete game.supply

	if (game.selected.length > 0) {
		game.state = "flip_5_or_6_from_nearest_train"
	} else {
		resume_start_turn()
	}
}

states.flip_5_or_6_from_nearest_train = {
	prompt() {
		prompt("Flip " + format_selected() + " out of supply.")
		for (let p of game.selected)
			gen_action_supreme_commander(game.pos[p])
	},
	piece(p) {
		flip_stack_out_of_supply(p)
		if (game.selected.length === 0)
			resume_start_turn()
	}
}

states.flip_any_one_prussian_general_or_stack_in_austria_or_saxony = {
	prompt() {
		prompt("Flip any one Prussian general/stack in Austria or Saxony out of supply.")
		for (let p of game.selected)
			gen_action_supreme_commander(game.pos[p])
	},
	piece(p) {
		flip_stack_out_of_supply(p)
		resume_start_turn()
	}
}

function flip_stack_out_of_supply(p) {
	for (let x of all_power_generals[game.power]) {
		if (game.pos[x] === game.pos[p]) {
			log("P" + x + " out of supply")
			set_out_of_supply(x)
			set_delete(game.selected, x)
		}
	}
}

states.austria_and_russia_may_exchange_one_tc_with_each_other_1 = {
	prompt() {
		prompt("You may exchange one TC with Russia.")
		for (let c of game.hand[P_AUSTRIA])
			gen_action_card(c)
		view.actions.pass = 1
	},
	card(c) {
		set_delete(game.hand[P_AUSTRIA], c)
		game.exchange = c
		set_active_to_power(P_RUSSIA)
		game.state = "austria_and_russia_may_exchange_one_tc_with_each_other_2"
	},
	pass() {
		resume_start_turn()
	},
}

states.austria_and_russia_may_exchange_one_tc_with_each_other_2 = {
	prompt() {
		prompt("You may exchange one TC with Austria.")
		for (let c of game.hand[P_RUSSIA])
			gen_action_card(c)
		view.actions.pass = 1
	},
	card(c) {
		set_add(game.hand[P_RUSSIA], game.exchange)
		delete game.exchange

		set_delete(game.hand[P_RUSSIA], c)
		set_add(game.hand[P_AUSTRIA], c)

		log("Austria and Russia exchanged TC.")
		resume_start_turn()
	},
	pass() {
		log("Austria and Russia did not exchange TC.")
		set_add(game.hand[P_AUSTRIA], game.exchange)
		delete game.exchange
		resume_start_turn()
	},
}

states.france_may_discard_any_one_tc_for_a_new_one_from_the_draw_deck = {
	prompt() {
		prompt("You may discard one TC to draw a new one.")
		for (let c of game.hand[P_FRANCE])
			gen_action_card(c)
		view.actions.pass = 1
	},
	card(c) {
		log("France discarded one TC.")
		log("France drew one TC.")
		set_delete(game.hand[P_FRANCE], c)
		c = draw_next_tc()
		if (c >= 0)
			set_add(game.hand[P_FRANCE], c)
		resume_start_turn()
	},
	pass() {
		resume_start_turn()
	},
}

states.prussia_may_draw_randomly_one_tc_from_austria_after_first_giving_one_tc_of_her_choice_to_austria = {
	prompt() {
		prompt("You may give Austria one TC to draw a random TC from her.")
		for (let c of game.hand[P_PRUSSIA])
			gen_action_card(c)
		view.actions.pass = 1
	},
	card(c) {
		log("Prussia gave one TC to Austria.")
		log("Prussia took one random TC from Austria.")

		set_delete(game.hand[P_PRUSSIA], c)
		set_add(game.hand[P_AUSTRIA], c)

		let x = random_bigint(game.hand[P_AUSTRIA].length)
		c = game.hand[P_AUSTRIA][x]
		set_delete(game.hand[P_AUSTRIA], c)
		set_add(game.hand[P_PRUSSIA], c)

		resume_start_turn()
	},
	pass() {
		resume_start_turn()
	},
}

states.austria_may_move_laudon_by_one_city_immediately = {
	prompt() {
		prompt("You may move Laudon by one city.")
		view.selected = game.selected

		let here = game.pos[GEN_LAUDON]
		for (let next of data.cities.adjacent[here])
			// TODO: may capture supply trains?
			if (can_move_general_to(next))
				gen_action_space(next)

		let s_take = count_stacked_take()
		let s_give = count_stacked_give()
		let u_take = count_unstacked_take()
		let u_give = count_unstacked_give()
		if (s_take > 0 && u_give > 0)
			view.actions.take = 1
		if (s_give > 0 && u_take > 0)
			view.actions.give = 1
	},
	take() {
		push_undo()
		game.state = "laudon_take"
	},
	give() {
		push_undo()
		game.state = "laudon_give"
	},
	space(s) {
		push_undo()
		// no conquest, but may capture supply trains?
		move_general_immediately(s)
		game.state = "laudon_done"
	},
}

states.laudon_take = states.move_take
states.laudon_give = states.move_give

states.laudon_done = {
	prompt() {
		prompt("You may move Laudon by one city.")
		view.selected = game.selected
		view.actions.done = 1
	},
	done() {
		clear_undo()
		resume_start_turn()
	},
}

function is_west_of(here, there) {
	let dx = data.cities.x[there] - data.cities.x[here]
	let dy = data.cities.y[there] - data.cities.y[here]
	// more west than north/south
	return dx < 0 && Math.abs(dx) >= Math.abs(dy)
}

states.prussia_may_move_hildburghausen_2_cities_westwards = {
	prompt() {
		prompt("You may move Hildburghausen two cities westwards.")
		view.selected = game.selected
		view.actions.pass = 1

		let here = game.pos[GEN_HILDBURGHAUSEN]
		for (let a of data.cities.adjacent[here])
			if (!has_any_piece(a))
				for (let b of data.cities.adjacent[a])
					if (is_west_of(here, b) && !has_any_piece(b))
						gen_action_space(b)
	},
	space(s) {
		log("P" + GEN_HILDBURGHAUSEN + " to S" + s)
		game.pos[GEN_HILDBURGHAUSEN] = s
		resume_start_turn()
	},
	pass() {
		resume_start_turn()
	},
}

/* SETUP */

const POWER_FROM_SETUP_STEP_4 = [
	P_PRUSSIA,
	P_HANOVER,
	P_RUSSIA,
	P_SWEDEN,
	P_AUSTRIA,
	P_IMPERIAL,
	P_FRANCE,
]

const POWER_FROM_SETUP_STEP_3 = [
	P_PRUSSIA,
	P_HANOVER,
	P_RUSSIA,
	P_SWEDEN,
	P_FRANCE,
	P_AUSTRIA,
	P_IMPERIAL,
]

function set_active_setup_power() {
	if (game.scenario === 3)
		game.power = POWER_FROM_SETUP_STEP_3[game.step]
	else
		game.power = POWER_FROM_SETUP_STEP_4[game.step]
	game.active = current_player()
}

const SETUP_POSITION = [
	// P
	find_city("Oschatz"),
	find_city("Oschatz"),
	find_city("Berlin"),
	find_city("Strehlen"),
	find_city("Strehlen"),
	find_city("Brandenburg"),
	find_city("Arnswalde"),
	find_city("Mohrungen"),

	// H
	find_city("Stade"),
	find_city("Alfeld"),

	// R
	find_city("Bydgoszcz"),
	find_city("Bydgoszcz"),
	find_city("Łomża"),
	find_city("Sierpc"),

	// S
	find_city("Stralsund"),

	// A
	find_city("Brünn"),
	find_city("Melnik"),
	find_city("Melnik"),
	find_city("Olmütz"),
	find_city("Tabor"),

	// IA
	find_city("Hildburghausen"),

	// F
	find_city("Iserlohn"),
	find_city("Fulda"),
	find_city("Iserlohn"),

	// Supply Train
	find_city("Grünberg"),
	find_city("Jüterbog"),

	find_city("Gifhorn"),

	find_city("Toruń"),
	find_city("Warszawa"),

	find_city("Wismar"),

	find_city("Beraun"),
	find_city("Pardubitz"),

	find_city("Erlangen"),

	find_city("Gemünden"),
	find_city("Koblenz"),
]

const SETUP_TROOPS = [
	/* P (32) */ 0, 0, 0, 0, 0, 0, 0, 0,
	/* H (02) */ 0, 0,
	/* R (06) */ 0, 0, 0, 0,
	/* S  (4) */ 4,
	/* A (30) */ 0, 0, 0, 0, 0,
	/* IA (6) */ 6,
	/* F (20) */ 0, 0, 0,
]

function make_fate_deck() {
	let deck = []
	for (let i = 1; i <= 18; ++i)
		deck.push(i)
	shuffle_bigint(deck)
	return deck
}

function make_seeded_fate_deck() {
	let deck = []

	for (let i = 1; i <= 18; ++i) {
		if (i === FC_ELISABETH || i === FC_POEMS || i === FC_AMERICA)
			continue
		deck.push(i)
	}
	shuffle_bigint(deck)

	let aside = []
	for (let i = 0; i < 4; ++i)
		aside.push(deck.pop())

	deck.push(FC_ELISABETH)
	deck.push(FC_POEMS)
	deck.push(FC_AMERICA)
	shuffle_bigint(deck)

	for (let i = 0; i < 4; ++i)
		deck.push(aside.pop())

	return deck
}

function make_tactics_deck(n) {
	let deck = []
	for (let suit = 0; suit <= 3; ++suit)
		for (let value = 2; value <= 13; ++value)
			deck.push((n << 7) | (suit << 4) | value)
	deck.push((n << 7) | (RESERVE << 4) | 2)
	deck.push((n << 7) | (RESERVE << 4) | 3)
	return deck
}

function make_tactics_discard(n) {
	return make_tactics_deck(n).filter(c => {
		if (game.draw && set_has(game.draw, c))
			return false
		for (let pow of all_powers)
			if (set_has(game.hand[pow], c))
				return false
		return true
	})
}

exports.setup = function (seed, scenario, options) {
	game = {
		seed: seed,
		undo: [],
		log: [],

		scenario: 4,
		state: "setup",
		active: "Frederick",
		power: P_PRUSSIA,

		turn: 0,
		step: 0,
		clock: null,
		fate: [],
		vg: 0, // last victorious general for fate effect selection
		fx: 0, // current card of fate effect
		deck: null,
		hand: [ [], [], [], [], [], [], [] ],

		pos: SETUP_POSITION.slice(),
		oos: 0,
		troops: SETUP_TROOPS.slice(),
		conquest: [],

		moved: [],
		retro: [],

		selected: [],
		count: 0,
	}

	game.scenario = SCENARIO_INDEX[scenario]

	if (options.seeded)
		game.clock = make_seeded_fate_deck()
	else
		game.clock = make_fate_deck()

	game.deck = make_tactics_deck(0)

	shuffle_bigint(game.deck)

	if (game.scenario === 1)
		log("# The War in the West")
	if (game.scenario === 2)
		log("# The Austrian Theatre")

	if (game.scenario === 1)
		setup_the_war_in_the_west()

	if (game.scenario === 2)
		setup_the_austrian_theatre()

	return game
}

function remove_power_from_play(pow) {
	for (let p of all_power_generals[pow]) {
		game.pos[p] = REMOVED
		game.troops[p] = 0
	}
	for (let p of all_power_trains[pow])
		game.pos[p] = REMOVED
	for (let s of full_objective[pow])
		set_delete(game.conquest, s)
	if (game.hand[pow].length > 0)
		log("Discarded " + game.hand[pow].length + " TCs.")
	game.hand[pow] = []
}

function setup_the_war_in_the_west() {
	remove_power_from_play(P_RUSSIA)
	remove_power_from_play(P_SWEDEN)
	remove_power_from_play(P_AUSTRIA)
	remove_power_from_play(P_IMPERIAL)

	remove_power_from_play(P_PRUSSIA)
	game.pos[GEN_SEYDLITZ] = find_city("Brandenburg")
	game.troops[GEN_SEYDLITZ] = 3
	game.pos[24] = find_city("Jüterbog")
}

function setup_the_austrian_theatre() {
	remove_power_from_play(P_HANOVER)
	remove_power_from_play(P_RUSSIA)
	remove_power_from_play(P_SWEDEN)
	remove_power_from_play(P_FRANCE)

	game.pos[5] = REMOVED
	game.pos[6] = REMOVED
	game.pos[7] = REMOVED
}

states.setup = {
	prompt() {
		prompt("Setup troops: " + count_used_troops() + " / " + max_power_troops(game.power))
		let done = true
		for (let p of all_power_generals[game.power]) {
			if (game.pos[p] < ELIMINATED && game.troops[p] === 0) {
				if (is_supreme_commander(p)) {
					gen_action_piece(p)
					done = false
				}
			}
		}
		if (done)
			view.actions.end_setup = 1
	},
	piece(p) {
		push_undo()
		game.selected = select_stack(game.pos[p])
		game.state = "setup_general"
	},
	end_setup() {
		clear_undo()
		end_setup()
	},
}

states.setup_general = {
	prompt() {
		prompt("Setup troops.")
		view.selected = game.selected

		let n_selected = game.selected.length
		let n_other = count_unused_generals() - game.selected.length
		let n_troops = max_power_troops(game.power) - count_used_troops()

		// leave at least 1 for each remaining general
		let take_max = Math.min(8 * n_selected, n_troops - n_other)

		// leave no more than 8 for each remaining general
		let take_min = Math.max(1 * n_selected, n_troops - n_other * 8)

		view.actions.value = []
		for (let i = take_min; i <= take_max; ++i)
			view.actions.value.push(i)
	},
	value(v) {
		let save = game.selected.length - 1
		for (let p of game.selected) {
			let n = Math.min(8, v - save)
			game.troops[p] = n
			v -= n
			--save
		}
		game.selected = null
		game.state = "setup"
	},
}

function end_setup() {
	if (++game.step === 7) {
		goto_start_turn()
	} else {
		set_active_setup_power()
		if (count_unused_generals() === 0)
			end_setup()
	}
}

/* VIEW */

function mask_troops(player) {
	let view_troops = []
	for (let pow of all_powers) {
		if (player_from_power(pow) === player) {
			for (let p of all_power_generals[pow])
				view_troops.push(game.troops[p])
		} else {
			for (let p of all_power_generals[pow]) {
				let s = game.pos[p]
				if (game.attacker === s || game.defender === s)
					view_troops.push(game.troops[p])
				else
					view_troops.push(0)
			}
		}
	}
	return view_troops
}

function mask_hand(player) {
	let view_hand = []
	for (let pow of all_powers) {
		if (player_from_power(pow) === player)
			view_hand[pow] = game.hand[pow]
		else
			view_hand[pow] = game.hand[pow].map(c => c & ~127)
	}
	return view_hand
}

exports.view = function (state, player) {
	game = state
	view = {
		prompt: null,
		actions: null,
		log: game.log,

		fate: game.turn <= 5 ? game.turn : game.fate,
		pos: game.pos,
		oos: game.oos,
		conquest: game.conquest,
		troops: mask_troops(player),
		hand: mask_hand(player),

		power: game.power,
		retro: game.retro,
	}

	if (game.attacker !== undefined && game.defender !== undefined) {
		view.attacker = game.attacker
		view.defender = game.defender
	}

	if (game.state === "game_over") {
		view.prompt = game.victory
	} else if (game.active !== player) {
		let inactive = states[game.state].inactive || game.state
		if (typeof inactive === "function")
			inactive = inactive()
		view.prompt = `Waiting for ${POWER_NAME[game.power]} to ${inactive}.`
	} else {
		view.actions = {}
		if (states[game.state])
			states[game.state].prompt()
		else
			view.prompt = "Unknown state: " + game.state
		if (view.actions.undo === undefined) {
			if (game.undo && game.undo.length > 0)
				view.actions.undo = 1
			else
				view.actions.undo = 0
		}
	}

	return view
}

/* COMMON FRAMEWORK */

function goto_game_over(result, victory) {
	game.active = "None"
	game.state = "game_over"
	game.result = result
	game.victory = victory
	log("# Game Over")
	log(game.victory)
	return true
}

function prompt(str) {
	view.prompt = POWER_NAME[game.power] + ": " + str
}

exports.action = function (state, _player, action, arg) {
	game = state
	let S = states[game.state]
	if (S && action in S) {
		S[action](arg)
	} else {
		if (action === "undo" && game.undo && game.undo.length > 0)
			pop_undo()
		else
			throw new Error("Invalid action: " + action)
	}
	return game
}

function gen_action(action, argument) {
	if (view.actions[action] === undefined)
		view.actions[action] = [ argument ]
	else
		set_add(view.actions[action], argument)
}

function gen_action_piece(p) {
	gen_action("piece", p)
}

function gen_action_space(s) {
	gen_action("space", s)
}

function gen_action_supreme_commander(s) {
	let p = get_supreme_commander(s)
	if (p >= 0)
		gen_action_piece(p)
}

function gen_action_space_or_piece(s) {
	let p = get_top_piece(s)
	if (p >= 0)
		gen_action_piece(p)
	else
		gen_action_space(s)
}

function gen_action_card(c) {
	gen_action("card", c)
}

function log(msg) {
	game.log.push(msg)
}

function log_br() {
	if (game.log.length > 0 && game.log[game.log.length - 1] !== "")
		game.log.push("")
}

/* COMMON LIBRARY */

function clear_undo() {
	game.undo.length = 0
}

function push_undo() {
	if (game.undo) {
		let copy = {}
		for (let k in game) {
			let v = game[k]
			if (k === "undo")
				continue
			else if (k === "log")
				v = v.length
			else if (typeof v === "object" && v !== null)
				v = object_copy(v)
			copy[k] = v
		}
		game.undo.push(copy)
	}
}

function pop_undo() {
	if (game.undo) {
		let save_log = game.log
		let save_undo = game.undo
		game = save_undo.pop()
		save_log.length = game.log
		game.log = save_log
		game.undo = save_undo
	}
}

function random_bigint(range) {
	// Largest MLCG that will fit its state in a double.
	// Uses BigInt for arithmetic, so is an order of magnitude slower.
	// https://www.ams.org/journals/mcom/1999-68-225/S0025-5718-99-00996-5/S0025-5718-99-00996-5.pdf
	// m = 2**53 - 111
	return (game.seed = Number(BigInt(game.seed) * 5667072534355537n % 9007199254740881n)) % range
}

function shuffle_bigint(list) {
	// Fisher-Yates shuffle
	for (let i = list.length - 1; i > 0; --i) {
		let j = random_bigint(i + 1)
		let tmp = list[j]
		list[j] = list[i]
		list[i] = tmp
	}
}

// Fast deep copy for objects without cycles
function object_copy(original) {
	if (Array.isArray(original)) {
		let n = original.length
		let copy = new Array(n)
		for (let i = 0; i < n; ++i) {
			let v = original[i]
			if (typeof v === "object" && v !== null)
				copy[i] = object_copy(v)
			else
				copy[i] = v
		}
		return copy
	} else {
		let copy = {}
		for (let i in original) {
			let v = original[i]
			if (typeof v === "object" && v !== null)
				copy[i] = object_copy(v)
			else
				copy[i] = v
		}
		return copy
	}
}

// Array remove and insert (faster than splice)

function array_remove(array, index) {
	let n = array.length
	for (let i = index + 1; i < n; ++i)
		array[i - 1] = array[i]
	array.length = n - 1
}

function array_remove_item(array, item) {
	let n = array.length
	for (let i = 0; i < n; ++i)
		if (array[i] === item)
			return array_remove(array, i)
}

function array_insert(array, index, item) {
	for (let i = array.length; i > index; --i)
		array[i] = array[i - 1]
	array[index] = item
}

function array_remove_pair(array, index) {
	let n = array.length
	for (let i = index + 2; i < n; ++i)
		array[i - 2] = array[i]
	array.length = n - 2
}

function array_insert_pair(array, index, key, value) {
	for (let i = array.length; i > index; i -= 2) {
		array[i] = array[i-2]
		array[i+1] = array[i-1]
	}
	array[index] = key
	array[index+1] = value
}

// Set as plain sorted array

function set_clear(set) {
	set.length = 0
}

function set_has(set, item) {
	let a = 0
	let b = set.length - 1
	while (a <= b) {
		let m = (a + b) >> 1
		let x = set[m]
		if (item < x)
			b = m - 1
		else if (item > x)
			a = m + 1
		else
			return true
	}
	return false
}

function set_add(set, item) {
	let a = 0
	let b = set.length - 1
	while (a <= b) {
		let m = (a + b) >> 1
		let x = set[m]
		if (item < x)
			b = m - 1
		else if (item > x)
			a = m + 1
		else
			return
	}
	array_insert(set, a, item)
}

function set_delete(set, item) {
	let a = 0
	let b = set.length - 1
	while (a <= b) {
		let m = (a + b) >> 1
		let x = set[m]
		if (item < x)
			b = m - 1
		else if (item > x)
			a = m + 1
		else {
			array_remove(set, m)
			return
		}
	}
}

function set_add_all(set, other) {
	for (let item of other)
		set_add(set, item)
}

function set_union(one, two) {
	let set = []
	for (let item of one)
		set_add(set, item)
	for (let item of two)
		set_add(set, item)
	return set
}

function set_intersect(one, two) {
	let set = []
	for (let item of one)
		if (set_has(two, item))
			set_add(set, item)
	return set
}

// Map as plain sorted array of key/value pairs

function map_has(map, key) {
	let a = 0
	let b = (map.length >> 1) - 1
	while (a <= b) {
		let m = (a + b) >> 1
		let x = map[m<<1]
		if (key < x)
			b = m - 1
		else if (key > x)
			a = m + 1
		else
			return true
	}
	return false
}

function map_get(map, key, missing) {
	let a = 0
	let b = (map.length >> 1) - 1
	while (a <= b) {
		let m = (a + b) >> 1
		let x = map[m<<1]
		if (key < x)
			b = m - 1
		else if (key > x)
			a = m + 1
		else
			return map[(m<<1)+1]
	}
	return missing
}

function map_set(map, key, value) {
	let a = 0
	let b = (map.length >> 1) - 1
	while (a <= b) {
		let m = (a + b) >> 1
		let x = map[m<<1]
		if (key < x)
			b = m - 1
		else if (key > x)
			a = m + 1
		else {
			map[(m<<1)+1] = value
			return
		}
	}
	array_insert_pair(map, a<<1, key, value)
}

function map_for_each_key(map, f) {
	for (let i = 0; i < map.length; i += 2)
		f(map[i])
}

function map_for_each(map, f) {
	for (let i = 0; i < map.length; i += 2)
		f(map[i], map[i+1])
}
