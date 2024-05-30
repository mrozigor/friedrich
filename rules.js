"use strict"

const R_FREDERICK = "Frederick"
const R_ELISABETH = "Elisabeth"
const R_MARIA_THERESA = "Maria Theresa"
const R_POMPADOUR = "Pompadour"

const ROLE_NAME_4 = [
	R_FREDERICK,
	R_ELISABETH,
	R_MARIA_THERESA,
	R_POMPADOUR,
]

const ROLE_NAME_3 = [
	R_FREDERICK,
	R_ELISABETH,
	R_MARIA_THERESA,
]

exports.roles = function (_scenario, options) {
	let n = parseInt(options.players) || 4
	if (n === 3)
		return ROLE_NAME_3
	else
		return ROLE_NAME_4
}

exports.scenarios = [
	"Standard",
//	"Expert",
//	"2P The War in the West",
//	"2P The Austrian Theatre",
]

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

const max_power_troops = [ 32, 12, 16, 4, 30, 6, 20 ]

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
const GEN_CUMBERLAND = 9

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

function turn_power_draw(pow) {
	let n = 0
	switch (pow) {
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
		if (game.troops[p] === 0)
			++n
	return n
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

function set_active_current_power() {
	game.power = POWER_FROM_ACTION_STEP[game.step]
	game.active = current_player()
}

function goto_start_turn() {
	game.step = 0

	// Check before drawing a fate card.
	if (check_victory())
		return

	if (++game.turn <= 5) {
		log("# Turn " + game.turn)
	} else {
		log("# Card of Fate")

		// remove non-stroke of fate card from last turn
		for (let i = 1; i <= 12; ++i)
			set_delete(game.fate, i)

		let fc = game.clock.pop()
		log("F" + fc)

		set_add(game.fate, fc)

		// Check again in case of eased victory conditions.
		if (check_victory())
			return

		if (fc === FC_ELISABETH) {
			game.hand[P_RUSSIA] = []
			game.power = P_PRUSSIA
			game.active = current_player()
			game.state = "russia_quits_the_game_1"
			return
		}

		if (fc === FC_SWEDEN) {
			game.hand[P_SWEDEN] = []
			game.power = P_PRUSSIA
			game.active = current_player()
			game.state = "sweden_quits_the_game_1"
			return
		}

		if ((fc === FC_INDIA && set_has(game.fate, FC_AMERICA)) || (fc === FC_AMERICA && set_has(game.fate, FC_INDIA))) {
			game.hand[P_FRANCE] = []
			game.power = P_HANOVER
			game.active = current_player()
			game.state = "france_quits_the_game_1"
			return
		}
	}

	resume_start_turn()
}

function resume_start_turn() {

	// MARIA: politics
	// MARIA: hussars

	goto_action_stage()
}

function goto_action_stage() {
	set_active_current_power()

	if (has_power_dropped_out(game.power)) {
		end_action_stage()
		return
	}

	log("=" + game.power)
	goto_tactical_cards()
}

function end_action_stage() {
	if (++game.step === 7)
		goto_end_of_turn()
	else
		goto_action_stage()
}

function goto_end_of_turn() {
	goto_start_turn()
}

/* VICTORY */

function has_conquered_all_of(list) {
	for (let s of list)
		if (!set_has(game.conquest, s))
			return false
	return true
}

function check_power_victory(list, power) {
	if (has_conquered_all_of(list[power])) {
		goto_game_over(player_from_power(power), POWER_NAME[power] + " won.")
		return true
	}
	return false
}

function check_victory() {
	// Prussian victory
	if (has_russia_dropped_out() && has_sweden_dropped_out() && has_france_dropped_out()) {
		goto_game_over(R_FREDERICK, "Prussia won.")
		return true
	}

	// Normal victory conditions
	if (
		check_power_victory(full_objective, P_RUSSIA) ||
		check_power_victory(full_objective, P_SWEDEN) ||
		check_power_victory(full_objective, P_AUSTRIA) ||
		check_power_victory(full_objective, P_IMPERIAL) ||
		check_power_victory(full_objective, P_FRANCE)
	)
		return true

	// Eased victory conditions
	if (has_russia_dropped_out()) {
		if (check_power_victory(primary_objective, P_SWEDEN))
			return true
	}
	if (has_imperial_army_switched_players()) {
		if (check_power_victory(primary_objective, P_AUSTRIA))
			return true
		if (check_power_victory(primary_objective, P_IMPERIAL))
			return true
	}

	return false
}

/* TACTICAL CARDS */

function find_largest_discard(u) {
	for (let i = 0; i < 4; ++i)
		if (u[i] <= u[0] && u[i] <= u[1] && u[i] <= u[2] && u[i] <= u[3])
			return i
	throw "IMPOSSIBLE"
}

function next_tactics_deck() {
	let held = [ 0, 0, 0, 0 ]

	// count cards in hands
	for (let pow of all_powers)
		for (let c of game.hand[pow])
			held[to_deck(c)]++

	// find next unused deck
	for (let i = 1; i < 4; ++i) {
		if (held[i] === 0) {
			game.deck = make_tactics_deck(i)
			shuffle_bigint(game.deck)
			return
		}
	}

	// find two largest discard piles
	let a = find_largest_discard(held)
	log("Deck " + a + ": " + held[a])
	if (held[a] === 50) {
		goto_game_over("Draw", "All cards held.")
		return
	}
	held[a] = 100

	let b = find_largest_discard(held)
	log("Deck " + b + ": " + held[b])
	if (held[b] === 50) {
		goto_game_over("Draw", "All cards held.")
		return
	}

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
	return game.deck.pop()
}

function goto_tactical_cards() {
	let pow = game.power
	let n = turn_power_draw(pow)

	log("Draw " + n + " TC.")

	for (let i = 0; i < n; ++i)
		set_add(game.hand[pow], draw_next_tc())

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
		prompt("Move your generals and supply trains.")

		let pow = game.power

		for (let p of all_power_generals[pow])
			if (!set_has(game.moved, p) && is_supreme_commander(p) && game.pos[p] < ELIMINATED)
				gen_action_piece(p)

		for (let p of all_power_trains[pow])
			if (!set_has(game.moved, p) && game.pos[p] < ELIMINATED)
				gen_action_piece(p)

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
		game.major = 1
		if (is_supply_train(p))
			game.state = "move_supply_train"
		else
			game.state = "move_general"
	},
	end_movement() {
		push_undo()
		goto_recruit()
	},

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

function count_pieces(to) {
	let n = 0
	for (let s of game.pos)
		if (s === to)
			++n
	return n
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

states.move_supply_train = {
	prompt() {
		prompt("Move supply train.")
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
		game.state = "movement"
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
			game.state = "movement"
	},
}

states.move_general = {
	prompt() {
		prompt("Move general.")
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
		game.state = "movement"
	},
	space(to) {
		let pow = game.power
		let who = game.selected[0]
		let from = game.pos[who]

		log("P" + who + " to S" + to)

		if (!set_has(data.cities.major_roads[from], to))
			game.major = 0

		// uniting stacks (flag all as moved)
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

		if (is_conquest_space(pow, from) && !set_has(game.conquest, from)) {
			if (is_protected_from_conquest(from)) {
				set_add(game.retro, from)
			} else {
				log("Conquered S" + from)
				set_add(game.conquest, from)
			}
		}

		if (is_reconquest_space(pow, from) && set_has(game.conquest, from)) {
			if (is_protected_from_reconquest(from)) {
				set_add(game.retro, from)
			} else {
				log("Reconquered S" + from)
				set_delete(game.conquest, from)
			}
		}

		for (let p of all_enemy_trains[pow]) {
			if (game.pos[p] === to) {
				log("Eliminate P" + p)
				game.pos[p] = ELIMINATED
				game.state = "movement"
				return
			}
		}

		for (let p of all_power_generals[pow]) {
			if (game.pos[p] === to && !set_has(game.selected, p)) {
				set_add(game.moved, p)
				game.state = "movement"
				return
			}
		}

		if (++game.count === 3 + game.major) {
			game.state = "movement"
		}
	},
}

states.move_detach = {
	prompt() {
		prompt("Detach general.")
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
		prompt("Take troops from detached generals.")
		let take = count_stacked_take()
		let give = count_unstacked_give()
		let n = Math.min(take, give)
		view.actions.value = []
		for (let i = 1; i <= n; ++i)
			view.actions.value.push(i)
	},
	value(v) {
		take_troops(v)
		game.state = "move_general"
	},
}

states.move_give = {
	prompt() {
		prompt("Give troops to detached generals.")
		let take = count_unstacked_take()
		let give = count_stacked_give()
		let n = Math.min(take, give)
		view.actions.value = []
		for (let i = 1; i <= n; ++i)
			view.actions.value.push(i)
	},
	value(v) {
		give_troops(v)
		game.state = "move_general"
	},
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
	if (count_eliminated_trains() === 0 && count_used_troops() === max_power_troops[game.power]) {
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

states.recruit = {
	prompt() {
		let cost = troop_cost()
		let buy_amount = (game.count / cost) | 0
		let n_troops = count_used_troops()
		let av_troops = max_power_troops[game.power] - n_troops
		let av_trains = count_eliminated_trains()

		if (av_trains === 0 && av_troops === 0)
			prompt(`Nothing to recruit. ${n_troops}/${max_power_troops[game.power]} troops.`)
		else
			prompt(`Recruit supply trains and/or troops. ${n_troops}/${max_power_troops[game.power]} troops. ${game.count} points.`)

		if (buy_amount < av_troops + av_trains) {
			for (let c of game.hand[game.power])
				gen_action_card(c)
		}

		if (game.count >= cost) {
			if (av_troops > 0)
				for (let p of all_power_generals[game.power])
					if (game.troops[p] < 8)
						gen_action_piece(p)
			if (av_trains > 0)
				for (let p of all_power_trains[game.power])
					if (game.pos[p] === ELIMINATED)
						gen_action_piece(p)
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
			game.troops[p]++
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

function can_re_enter_general(s) {
	return can_move_general_to(s)
}

function can_re_enter_supply_train(s) {
	return !has_any_piece(s)
}

states.re_enter = {
	prompt() {
		prompt("Re-enter piece.")
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
		push_undo()

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
	game.power = get_stack_power(game.attacker)
	game.active = current_player()
}

function set_active_defender() {
	game.power = get_stack_power(game.defender)
	game.active = current_player()
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
		set_active_defender()
		game.state = "combat_defend"
	} else {
		game.state = "combat_attack"
	}
}

function resume_combat_defend() {
	if (game.count <= 0) {
		set_active_attacker()
		game.state = "combat_attack"
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
	prompt() {
		prompt("Attack: " + game.count)
		view.selected = [
			get_supreme_commander(game.attacker),
			get_supreme_commander(game.defender)
		]
		let has_suit = gen_play_card(get_space_suit(game.attacker))
		if (game.count === 0 && has_suit)
			view.actions.pass = 0
		else
			view.actions.pass = 1
	},
	card(c) {
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
		resolve_combat()
	},
}

states.combat_defend = {
	prompt() {
		prompt("Defend: " + (-game.count))
		view.selected = [
			get_supreme_commander(game.attacker),
			get_supreme_commander(game.defender)
		]
		let has_suit = gen_play_card(get_space_suit(game.defender))
		if (game.count === 0 && has_suit)
			view.actions.pass = 0
		else
			view.actions.pass = 1
	},
	card(c) {
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
		resolve_combat()
	},
}

states.combat_attack_reserve = {
	prompt() {
		prompt("Attack: Choose value. " + game.count)
		view.selected = [
			get_supreme_commander(game.attacker),
			get_supreme_commander(game.defender)
		]
		view.actions.value = [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 ]
	},
	value(v) {
		log(POWER_NAME[game.power] + " reserve " + v)
		game.count += v
		resume_combat_attack()
	},
}

states.combat_defend_reserve = {
	prompt() {
		prompt("Defend: Choose value." + (-game.count))
		view.selected = [
			get_supreme_commander(game.attacker),
			get_supreme_commander(game.defender)
		]
		view.actions.value = [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 ]
	},
	value(v) {
		log(POWER_NAME[game.power] + " reserve " + v)
		game.count -= v
		resume_combat_defend()
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
		set_active_attacker()
		game.selected = select_stack(game.defender)
		goto_retreat()
	} else {
		set_active_defender()
		game.selected = select_stack(game.attacker)
		goto_retreat()
	}
}

function next_combat() {
	log_br()
	set_active_current_power()
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

function goto_retreat() {
	let hits = Math.abs(game.count)

	let winner = get_winner()
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

	// remove eliminated generals
	for (let i = game.selected.length - 1; i >= 0 && hits > 0; --i) {
		let p = game.selected[i]
		if (game.troops[p] === 0) {
			log("P" + p + " eliminated.")
			game.pos[p] = ELIMINATED
			array_remove(game.selected, i)
		}
	}

	if (game.selected.length > 0) {
		game.retreat = search_retreat(loser, winner, Math.abs(game.count))
		game.state = "retreat"
	} else {
		next_combat()
	}
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
			set_add(result, next)
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
	for (let s of possible)
		if (map_get(distance, s, -1) === max)
			result.push(s)
	return result
}

states.retreat = {
	prompt() {
		prompt("Retreat loser " + Math.abs(game.count))
		view.selected = game.selected
		if (game.retreat.length === 0) {
			prompt("Eliminate loser.")
			gen_action_piece(game.selected[0])
		} else {
			for (let to of game.retreat)
				gen_action_space(to)
		}
	},
	space(to) {
		push_undo()
		log("Retreated to S" + to + ".")
		for (let p of game.selected) {
			game.pos[p] = to
		}
		delete game.retreat
		game.state = "retreat_done"
		// next_combat()
	},
	piece(_) {
		push_undo()
		log("Eliminated.")
		for (let p of game.selected)
			game.pos[p] = ELIMINATED
		delete game.retreat
		game.state = "retreat_done"
		// next_combat()
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
		throw "SUPPLY NOT INITIALIZED"
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
		prompt("Supply")
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

/* CARDS OF FATE */

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

		turn: 5,
		step: 0,
		clock: null,
		fate: [],
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

	game.scenario = parseInt(options.players) || 4

	if (options.seeded)
		game.clock = make_seeded_fate_deck()
	else
		game.clock = make_fate_deck()

	game.deck = make_tactics_deck(0)

	shuffle_bigint(game.deck)

	log("# " + scenario)

	return game
}

states.setup = {
	prompt() {
		prompt("Setup troops: " + count_used_troops() + " / " + max_power_troops[game.power])
		let done = true
		for (let p of all_power_generals[game.power]) {
			if (game.troops[p] === 0) {
				gen_action_piece(p)
				done = false
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
		let n_troops = max_power_troops[game.power] - count_used_troops()

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

	if (game.state === "game_over") {
		view.prompt = game.victory
	} else if (game.active !== player) {
		let inactive = states[game.state].inactive || game.state
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
