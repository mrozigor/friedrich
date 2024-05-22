"use strict"

function toggle_pieces() {
	document.getElementById("pieces").classList.toggle("hide")
}

/* DATA */

const P_PRUSSIA = 0
const P_HANOVER = 1
const P_RUSSIA = 2
const P_SWEDEN = 3
const P_AUSTRIA = 4
const P_IMPERIAL = 5
const P_FRANCE = 6

const cities = data.cities
const last_city = cities.name.length - 1

const ELIMINATED = data.cities.name.length
const REMOVED = ELIMINATED + 1
const ELIMINATED_TRAIN_X = 1065
const ELIMINATED_TRAIN_Y = 200
const ELIMINATED_GENERAL_X = 1040
const ELIMINATED_GENERAL_Y = 150
const ELIMINATED_GENERAL_DX = 50

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

const objective1 = [ [], [], [], [], [], [], [] ]
const objective2 = [ [], [], [], [], [], [], [] ]
const protect = [ [], [], [], [], [], [], [] ]

for (let s of data.type.objective_prussia) set_add(objective1[P_PRUSSIA], s)
for (let s of data.type.objective_russia) set_add(objective1[P_RUSSIA], s)
for (let s of data.type.objective1_sweden) set_add(objective1[P_SWEDEN], s)
for (let s of data.type.objective2_sweden) set_add(objective2[P_SWEDEN], s)
for (let s of data.type.objective1_austria) set_add(objective1[P_AUSTRIA], s)
for (let s of data.type.objective2_austria) set_add(objective2[P_AUSTRIA], s)
for (let s of data.type.objective1_imperial) set_add(objective1[P_IMPERIAL], s)
for (let s of data.type.objective2_imperial) set_add(objective2[P_IMPERIAL], s)
for (let s of data.type.objective_france) set_add(objective1[P_FRANCE], s)

const power_class = [ "prussia", "hanover", "russia", "sweden", "austria", "imperial", "france" ]
const power_name = [ "Prussia", "Hanover", "Russia", "Sweden", "Austria", "Imperial Army", "France" ]

const cards_of_fate_name = [
	"No Fate",
	"Card of Fate 1",
	"Card of Fate 2",
	"Card of Fate 3",
	"Card of Fate 4",
	"Card of Fate 5",
	"Card of Fate 6",
	"Card of Fate 7",
	"Card of Fate 8",
	"Card of Fate 9",
	"Card of Fate 10",
	"Card of Fate 11",
	"Card of Fate 12",
	"Poems",
	"Lord Bute",
	"Elisabeth",
	"Sweden",
	"India",
	"America",
]

const GENERAL_POWER = [ 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 2, 2, 2, 2, 3, 4, 4, 4, 4, 4, 5, 6, 6, 6 ]
const TRAIN_POWER = [ 0, 0, 1, 2, 2, 3, 4, 4, 5, 6, 6 ]

const all_powers = [ 0, 1, 2, 3, 4, 5, 6 ]

const all_power_generals = [
	/* P */ [ 0, 1, 2, 3, 4, 5, 6, 7 ],
	/* H */ [ 8, 9 ],
	/* R */ [ 10, 11, 12, 13 ],
	/* S */ [ 14 ],
	/* A */ [ 15, 16, 17, 18, 19 ],
	/* I */ [ 20 ],
	/* F */ [ 21, 22, 23 ],
]

const all_power_trains = [
	/* P */ [ 24, 25 ],
	/* H */ [ 26 ],
	/* R */ [ 27, 28 ],
	/* S */ [ 29 ],
	/* A */ [ 30, 31 ],
	/* I */ [ 32 ],
	/* F */ [ 33, 34 ],
]

const RESERVE = 4
let suit_class = [ "S", "C", "H", "D", "R" ]
let suit_name = [ "\u2660", "\u2663", "\u2665", "\u2666", "R" ]

function to_suit(c) {
	return (c >> 4) & 7
}

function to_value(c) {
	return c & 15
}

/* BUILD UI */

const ui = {
	header: document.querySelector("header"),
	spaces_element: document.getElementById("spaces"),
	pieces_element: document.getElementById("pieces"),
	markers_element: document.getElementById("markers"),
	clock_of_fate: document.getElementById("clock_of_fate"),
	power_panel_list: document.getElementById("power_panel_list"),
	hand: [
		document.getElementById("hand_prussia"),
		document.getElementById("hand_hanover"),
		document.getElementById("hand_russia"),
		document.getElementById("hand_sweden"),
		document.getElementById("hand_austria"),
		document.getElementById("hand_imperial"),
		document.getElementById("hand_france"),
	],
	cities: [],
	action_register: [],
}

function register_action(target, action, id) {
	target.my_id = id
	target.my_action = action
	target.onmousedown = (evt) => on_click_action(evt, target)
	ui.action_register.push(target)
}

function on_click_action(evt, target) {
	if (evt.button === 0)
		if (send_action(target.my_action, target.my_id))
			evt.stopPropagation()
}

function process_actions() {
	for (let target of ui.action_register)
		target.classList.toggle("action", is_action(target.my_action, target.my_id))
}

function is_action(action, arg) {
	if (arg === undefined)
		return !!(view.actions && view.actions[action] === 1)
	return !!(view.actions && view.actions[action] && set_has(view.actions[action], arg))
}

function make_road(type, x, y, dx, dy) {
	let e = document.createElement("div")
	e.className = type
	e.style.left = x + "px"
	e.style.top = y + "px"
	let a = Math.atan2(dy, dx)
	let s = (Math.hypot(dx, dy) - 15) / 20
	e.style.transform =
		"rotate(" + a + "rad)" +
		"scale(" + s + ", 1)"
	// TODO: rotate to align
	ui.spaces_element.appendChild(e)
}

function create_piece(action, id, style) {
	let e = document.createElement("div")
	e.className = style
	register_action(e, action, id)
	return e
}

function create_marker(style) {
	let e = document.createElement("div")
	e.className = style
	return e
}

function make_tc_id(n, suit, value) {
	return (n << 7) | (suit << 4) | value
}

function make_tc_deck(n) {
	for (let suit = 0; suit <= 3; ++suit) {
		for (let value = 2; value <= 13; ++value) {
			let c = (n << 7) | (suit << 4) | value
			ui.tc[c] = create_piece("card", c, "card tc " + suit_class[suit] + value)
		}
	}
	for (let value = 2; value <= 3; ++value) {
		let c = (n << 7) | (4 << 4) | value
		ui.tc[c] = create_piece("card", c, "card tc R")
	}
}

function make_tc_deck_back(n) {
	let list = []
	for (let i = 0; i < 50; ++i) {
		let e = document.createElement("div")
		e.className = "card tc reverse " + n
		list.push(e)
	}
	return list
}

function make_fate_card(fc) {
	let e = document.createElement("div")
	if (fc === 0)
		e.className = "card fate reverse"
	else
		e.className = "card fate c" + fc
	return e
}

function on_init() {
	ui.pieces = [
		create_piece("piece", 0, "piece cylinder prussia prussia_1"),
		create_piece("piece", 1, "piece cylinder prussia prussia_2"),
		create_piece("piece", 2, "piece cylinder prussia prussia_3"),
		create_piece("piece", 3, "piece cylinder prussia prussia_4"),
		create_piece("piece", 4, "piece cylinder prussia prussia_5"),
		create_piece("piece", 5, "piece cylinder prussia prussia_6"),
		create_piece("piece", 6, "piece cylinder prussia prussia_7"),
		create_piece("piece", 7, "piece cylinder prussia prussia_8"),
		create_piece("piece", 8, "piece cylinder hanover hanover_1"),
		create_piece("piece", 9, "piece cylinder hanover hanover_2"),
		create_piece("piece", 10, "piece cylinder russia russia_1"),
		create_piece("piece", 11, "piece cylinder russia russia_2"),
		create_piece("piece", 12, "piece cylinder russia russia_3"),
		create_piece("piece", 13, "piece cylinder russia russia_4"),
		create_piece("piece", 14, "piece cylinder sweden sweden_1"),
		create_piece("piece", 15, "piece cylinder austria austria_1"),
		create_piece("piece", 16, "piece cylinder austria austria_2"),
		create_piece("piece", 17, "piece cylinder austria austria_3"),
		create_piece("piece", 18, "piece cylinder austria austria_4"),
		create_piece("piece", 19, "piece cylinder austria austria_5"),
		create_piece("piece", 20, "piece cylinder imperial imperial_1"),
		create_piece("piece", 21, "piece cylinder france france_1"),
		create_piece("piece", 22, "piece cylinder france france_2"),
		create_piece("piece", 23, "piece cylinder france france_3"),
		create_piece("piece", 24, "piece cube prussia"),
		create_piece("piece", 25, "piece cube prussia"),
		create_piece("piece", 26, "piece cube hanover"),
		create_piece("piece", 27, "piece cube russia"),
		create_piece("piece", 28, "piece cube russia"),
		create_piece("piece", 29, "piece cube sweden"),
		create_piece("piece", 30, "piece cube austria"),
		create_piece("piece", 31, "piece cube austria"),
		create_piece("piece", 32, "piece cube imperial"),
		create_piece("piece", 33, "piece cube france"),
		create_piece("piece", 34, "piece cube france"),
	]

	for (let e of ui.pieces)
		ui.pieces_element.appendChild(e)

	ui.troops = []
	for (let i = 0; i < 24; ++i)
		ui.troops[i] = create_marker("hide")
	for (let e of ui.troops)
		ui.pieces_element.appendChild(e)

	ui.conquest = []
	ui.retro = []
	for (let s of all_objectives) {
		for (let pow = 0; pow < 7; ++pow) {
			if (set_has(objective1[pow], s) || set_has(objective2[pow], s)) {
				ui.conquest[s] = create_conquest("marker conquest " + power_class[pow], s)
				ui.retro[s] = create_conquest("marker retroactive " + power_class[pow], s)
			}
		}
	}

	ui.turns = [
		create_marker("marker turn T1"),
		create_marker("marker turn T2"),
		create_marker("marker turn T3"),
		create_marker("marker turn T4"),
		create_marker("marker turn T5"),
	]

	for (let e of ui.turns)
		ui.pieces_element.appendChild(e)

	ui.tc = []
	make_tc_deck(0)
	make_tc_deck(1)
	make_tc_deck(2)
	make_tc_deck(3)

	ui.tc_back = [
		make_tc_deck_back("deck_1"),
		make_tc_deck_back("deck_2"),
		make_tc_deck_back("deck_3"),
		make_tc_deck_back("deck_4"),
	]

	ui.tcbreak = document.createElement("div")
	ui.tcbreak.className = "draw-break"

	ui.fate = []
	for (let fc = 0; fc <= 18; ++fc)
		ui.fate[fc] = make_fate_card(fc)

	if (0) {
		for (let a = 0; a <= last_city; ++a) {
			for (let b of cities.major_roads[a]) {
				if (a < b) {
					let dx = cities.x[a] - cities.x[b]
					let dy = cities.y[a] - cities.y[b]
					let x = (cities.x[a] + cities.x[b]) / 2
					let y = (cities.y[a] + cities.y[b]) / 2
					make_road("major_road", x - 10, y - 3, dx, dy)
				}
			}
			for (let b of cities.roads[a]) {
				if (a < b) {
					let dx = cities.x[a] - cities.x[b]
					let dy = cities.y[a] - cities.y[b]
					let x = (cities.x[a] + cities.x[b]) / 2
					let y = (cities.y[a] + cities.y[b]) / 2
					make_road("road", x - 10, y - 1, dx, dy)
				}
			}
		}
	}

	for (let a = 0; a <= last_city; ++a) {
		let e = ui.cities[a] = document.createElement("div")
		let x = cities.x[a]
		let y = cities.y[a]

		if (set_has(data.type.depot, a)) {
			e.className = "space depot"
			x -= 26
			y -= 26
		}
		else if (set_has(all_objectives, a)) {
			if (set_has(data.type.objective1_austria, a) || set_has(data.type.objective2_austria, a))
				e.className = "space objective austria"
			if (set_has(data.type.objective1_imperial, a) || set_has(data.type.objective2_imperial, a))
				e.className = "space objective imperial"
			if (set_has(data.type.objective1_sweden, a) || set_has(data.type.objective2_sweden, a))
				e.className = "space objective sweden"
			if (set_has(data.type.objective_france, a))
				e.className = "space objective france"
			if (set_has(data.type.objective_prussia, a))
				e.className = "space objective prussia"
			if (set_has(data.type.objective_russia, a))
				e.className = "space objective russia"
			x -= 20
			y -= 20
		}
		else {
			e.className = "space city"
			x -= 18
			y -= 18
		}

		register_action(e, "space", a)

		//e.classList.add("hide")
		e.style.left = x + "px"
		e.style.top = y + "px"
		e.title = cities.name[a]

		ui.spaces_element.appendChild(e)
	}

	update_favicon()
}

/* UPDATE UI */

function layout_general_offset(g, s) {
	let n = 0
	for (let i = g+1; i < 24; ++i)
		if (view.pos[i] === s)
			++n
	return n
}

function layout_general_count(g, s) {
	let n = 0
	for (let i = 0; i < 24; ++i)
		if (view.pos[i] === s)
			++n
	return n
}

function layout_general_offset_elim(g, s) {
	let n = 0
	let p = get_cylinder_power(g)
	for (let i of all_power_generals[p])
		if (i > g) // && view.pos[i] === s)
			++n
	return n
}

function layout_train_offset(g, s) {
	let n = 0
	for (let i = g+1; i < 35; ++i)
		if (view.pos[i] === s)
			++n
	return n
}

function get_cylinder_power(id) {
	for (let p of all_powers)
		if (set_has(all_power_generals[p], id))
			return p
	return -1
}

function layout_general(id, s) {
	let e = ui.pieces[id]
	let x, y, n

	if (s === REMOVED) {
		if (e.parentElement === ui.pieces_element)
			e.remove()
		return
	}
	if (e.parentElement !== ui.pieces_element)
		ui.pieces_element.appendChild(e)

	if (s === ELIMINATED) {
		n = layout_general_offset_elim(id)
		x = ELIMINATED_GENERAL_X + ELIMINATED_GENERAL_DX * get_cylinder_power(id)
		y = ELIMINATED_GENERAL_Y
	} else {
		n = layout_general_offset(id, s)
		if (layout_general_count(id, s) === 3)
			n -= 1
		x = data.cities.x[s]
		y = data.cities.y[s]
	}

	let selected = set_has(view.selected, id)

	e.style.left = (x - 21) + "px"
	e.style.top = (y - 29 - 15 * n) + "px"
	e.style.zIndex = y + n
	e.classList.toggle("selected", selected)
	e.classList.toggle("oos", (view.oos & (1 <<id)) !== 0)

	e = ui.troops[id]
	// e.style.left = (x + 21 + 1) + "px"
	// e.style.top = (y - 7 - 14 * n) + "px"
	e.style.left = (x - 7) + "px"
	// e.style.top = (y + 7 - 15 * n) + "px"
	e.style.top = (y + 2 - 15 * n) + "px"
	e.style.zIndex = y + n + 1
	e.className = power_class[GENERAL_POWER[id]] + " piece number n" + view.troops[id]
}

function layout_train(id, s) {
	let e = ui.pieces[id]
	let n = layout_train_offset(id, s)
	let x, y

	if (s === REMOVED) {
		if (e.parentElement === ui.pieces_element)
			e.remove()
		return
	}
	if (e.parentElement !== ui.pieces_element)
		ui.pieces_element.appendChild(e)

	if (s === ELIMINATED) {
		x = ELIMINATED_TRAIN_X
		y = ELIMINATED_TRAIN_Y
	} else {
		x = data.cities.x[s]
		y = data.cities.y[s]
	}

	e.style.left = (x - 14 + n * 33) + "px"
	e.style.top = (y - 21 - n * 0) + "px"
	e.classList.toggle("selected", set_has(view.selected, id))
}

function create_conquest(style, s) {
	let x = data.cities.x[s]
	let y = data.cities.y[s]
	let e = document.createElement("div")
	e.dataset.id = s
	e.style.left = (x - 16) + "px"
	e.style.top = (y - 16) + "px"
	e.className = style
	return e
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

function update_favicon() {
	let favicon = document.querySelector('link[rel="icon"]')
	switch (params.role) {
	case "Frederick": favicon.href = "favicon/favicon_frederick.png"; break
	case "Elisabeth": favicon.href = "favicon/favicon_elisabeth.png"; break
	case "Maria Theresa": favicon.href = "favicon/favicon_maria_theresa.png"; break
	case "Pompadour": favicon.href = "favicon/favicon_pompadour.png"; break
	}
}

function on_update() {
	ui.header.classList.toggle("prussia", view.power === P_PRUSSIA)
	ui.header.classList.toggle("hanover", view.power === P_HANOVER)
	ui.header.classList.toggle("russia", view.power === P_RUSSIA)
	ui.header.classList.toggle("sweden", view.power === P_SWEDEN)
	ui.header.classList.toggle("austria", view.power === P_AUSTRIA)
	ui.header.classList.toggle("imperial", view.power === P_IMPERIAL)
	ui.header.classList.toggle("france", view.power === P_FRANCE)

	for (let g = 0; g <= 23; ++g)
		layout_general(g, view.pos[g])
	for (let t = 24; t <= 34; ++t)
		layout_train(t, view.pos[t])

	let back = [ 0, 0, 0, 0 ]

	for (let i = 0; i < 5; ++i)
		ui.turns[i].classList.toggle("hide", (typeof view.fate === "object") || (i + 1 < view.fate))

	for (let pow = 0; pow < 7; ++pow) {
		ui.hand[pow].replaceChildren()
		for (let c of view.hand[pow]) {
			if ((c & 15) === 0)
				ui.hand[pow].appendChild(ui.tc_back[c>>7][back[c>>7]++])
			else
				ui.hand[pow].appendChild(ui.tc[c])
		}
	}

	if (false) {
		if (view.draw) {
			ui.draw_panel.classList.remove("hide")
			ui.draw.replaceChildren()
			for (let c of view.draw)
				ui.draw.appendChild(ui.tc[c])
		} else {
			ui.draw_panel.classList.add("hide")
		}
	} else {
		if (view.draw) {
			if (view.hand[view.power].length > 0)
				ui.hand[view.power].appendChild(ui.tcbreak)
			for (let c of view.draw)
				ui.hand[view.power].appendChild(ui.tc[c])
		}
	}

	ui.clock_of_fate.replaceChildren()
	ui.clock_of_fate.appendChild(ui.fate[0])
	if (typeof view.fate === "object")
		for (let c of view.fate)
			ui.clock_of_fate.appendChild(ui.fate[c])

	ui.markers_element.replaceChildren()
	for (let s of view.conquest)
		ui.markers_element.appendChild(ui.conquest[s])
	for (let s of view.retro)
		ui.markers_element.appendChild(ui.retro[s])

	/* troops 1-8, reserve 1-10 with modifiers +1 and +5 */
	for (let v = 16; v >= 1; --v)
		action_button_with_argument("value", v, v)

	action_button("take", "Take")
	action_button("give", "Give")
	action_button("recruit", "Recruit")
	action_button("transfer", "Transfer")
	action_button("detach", "Detach")

	action_button("stop", "Stop")
	action_button("pass", "Pass")
	action_button("next", "Next")
	action_button("done", "Done")

	action_button("end_cards", "End cards")
	action_button("end_setup", "End setup")
	action_button("end_recruit", "End recruit")
	action_button("end_movement", "End movement")
	action_button("end_combat", "End combat")
	action_button("end_supply", "End supply")
	action_button("end_turn", "End turn")

	action_button("undo", "Undo")
	
	process_actions()
}

const piece_name = [
	"P1", "P2", "P3", "P4", "P5", "P6", "P7", "P8",
	"H1", "H2",
	"R1", "R2", "R3", "R4",
	"S1",
	"A1", "A2", "A3", "A4", "A5",
	"IA1",
	"F1", "F2", "F3",
	"PT1", "PT2", "HT", "RT1", "RT2", "ST", "AT1", "AT2", "IAT", "FT1", "FT2",
]

function sub_piece(match, p1) {
	let x = p1 | 0
	let n = piece_name[x]
	// TODO: tooltip to highlight piece
	return n
}

function sub_space(match, p1) {
	let x = p1 | 0
	let n = data.cities.name[x]
	// TODO: tooltip to highlight location
	return n
}

function sub_tc(match, p1) {
	let x = p1 | 0
	let suit = to_suit(x)
	let value = to_value(x)
	if (suit === RESERVE)
		return suit_name[suit]
	return value + suit_name[suit]
}

function sub_fate(match, p1) {
	let x = p1 | 0
	return cards_of_fate_name[x]
}

function on_log(text) {
	let p = document.createElement("div")

	if (text.match(/^>/)) {
		text = text.substring(1)
		p.className = 'i'
	}

	text = text.replace(/&/g, "&amp;")
	text = text.replace(/</g, "&lt;")
	text = text.replace(/>/g, "&gt;")

	text = text.replace(/S(\d+)/g, sub_space)
	text = text.replace(/F(\d+)/g, sub_fate)
	text = text.replace(/C(\d+)/g, sub_tc)
	text = text.replace(/P(\d+)/g, sub_piece)

	if (text.match(/^# /)) {
		p.className = "h"
		text = text.substring(2)
	}
	else if (text.match(/^=\d/)) {
		p.className = "h " + power_class[text[1]]
		text = power_name[text[1]]
	}

	p.innerHTML = text
	return p
}

on_init()

// === COMMON LIBRARY ===

function array_insert(array, index, item) {
	for (let i = array.length; i > index; --i)
		array[i] = array[i - 1]
	array[index] = item
}

function set_has(set, item) {
	if (set === item) return true
	if (set === undefined) return false
	if (set === null) return false
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

function set_add_all(set, other) {
	for (let item of other)
		set_add(set, item)
}

