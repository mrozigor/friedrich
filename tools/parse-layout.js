"use strict"

const fs = require("fs")

let points = {}
let rects = {}
let edges = {}
let mode, name, subname, x, y, w, h, cx, cy, rx, ry, x2, y2
let labels = []
let sectors = {}

function array_insert(array, index, item) {
	for (let i = array.length; i > index; --i)
		array[i] = array[i - 1]
	array[index] = item
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

function add_point(x, y) {
	if (name in points)
		points[name].push([x,y])
	else
		points[name] = [ [x,y] ]
}

function add_rect(x, y, w, h) {
	if (name in rects)
		rects[name].push([x,y,x+w,y+h])
	else
		rects[name] = [ [x,y,x+w,y+h] ]
}

function add_edge(x1, y1, x2, y2) {
	if (name in edges)
		edges[name].push({x1,y1,x2,y2})
	else
		edges[name] = [ {x1,y1,x2,y2} ]
}

function flush() {
	if (mode === 'path') {
		add_edge(x, y, x2, y2)
	}
	if (mode === 'rect') {
		if (subname && subname.startsWith("#"))
			sectors[subname.slice(1)] = [x, y, x+w, y+h]
		if (name.startsWith("$"))
			add_rect(x, y, w, h)
		else
			add_point( x + w/2, y + h/2 )
	}
	if (mode === 'circle') {
		add_point( cx, cy )
	}
	x = y = x2 = y2 = w = h = cx = cy = rx = ry = 0
	subname = null
}

function parse_path_data(path) {
	let cx = 0
	let cy = 0
	let abs = 0
	for (let i = 0; i < path.length;) {
		switch (path[i]) {
		case 'M':
			x2 = x = cx = Number(path[i+1])
			y2 = y = cy = Number(path[i+2])
			i += 3
			abs = true
			break
		case 'm':
			x2 = x = cx = cx + Number(path[i+1])
			y2 = y = cy = cy + Number(path[i+2])
			i += 3
			abs = false
			break
		case 'C':
			x2 = cx = Number(path[i+5])
			y2 = cy = Number(path[i+6])
			i += 7
			abs = true
			break
		case 'L':
			i += 1
			abs = true
			break
		case 'H':
			x2 = cx = Number(path[i+1])
			i += 2
			abs = true
			break
		case 'V':
			y2 = cy = Number(path[i+1])
			i += 2
			abs = true
			break
		case 'c':
			x2 = cx = cx + Number(path[i+5])
			y2 = cy = cy + Number(path[i+6])
			i += 7
			abs = false
			break
		case 'l':
			i += 1
			abs = false
			break
		case 'h':
			x2 = cx = cx + Number(path[i+1])
			i += 2
			abs = false
			break
		case 'v':
			y2 = cy = cy + Number(path[i+1])
			i += 2
			abs = false
			break
		default:
			if (abs) {
				x2 = cx = Number(path[i+0])
				y2 = cy = Number(path[i+1])
			} else {
				x2 = cx = cx + Number(path[i+0])
				y2 = cy = cy + Number(path[i+1])
			}
			i += 2
			break
		}
	}
}

for (let line of fs.readFileSync("tools/layout.svg", "utf-8").split("\n")) {
	line = line.trim()
	if (line.startsWith("<rect")) {
		flush()
		mode = "rect"
		x = y = w = h = 0
	}
	else if (line.startsWith("<ellipse") || line.startsWith("<circle")) {
		flush()
		mode = "circle"
		cx = cy = rx = ry = 0
	}
	else if (line.startsWith("<path")) {
		flush()
		mode = "path"
	}
	else if (line.startsWith("<g")) {
		flush()
		mode = "g"
	}
	else if (line.startsWith('x="'))
		x = (Number(line.split('"')[1]))
	else if (line.startsWith('y="'))
		y = (Number(line.split('"')[1]))
	else if (line.startsWith('width="'))
		w = (Number(line.split('"')[1]))
	else if (line.startsWith('height="'))
		h = (Number(line.split('"')[1]))
	else if (line.startsWith('cx="'))
		cx = (Number(line.split('"')[1]))
	else if (line.startsWith('cy="'))
		cy = (Number(line.split('"')[1]))
	else if (line.startsWith('r="'))
		rx = ry = (Number(line.split('"')[1]))
	else if (line.startsWith('rx="'))
		rx = (Number(line.split('"')[1]))
	else if (line.startsWith('ry="'))
		ry = (Number(line.split('"')[1]))
	else if (line.startsWith('inkscape:label="') && mode === "g")
		name = line.split('"')[1]
	else if (line.startsWith('inkscape:label="') && mode !== "g")
		subname = line.split('"')[1]
	else if (line.startsWith('d="'))
		parse_path_data(line.split('"')[1].split(/[ ,]/))
	if (line.includes("</tspan>")) {
		let name = line.replace(/^[^>]*>/, "").replace(/<\/tspan.*/, "")
		labels.push({x, y, name})
	}
}

flush()

function find_closest_node(list, x, y) {
	let nd = Infinity, nn = null

	for (let n of list) {
		let d = Math.hypot(n.x - x, n.y - y)
		if (d < nd) {
			nd = d
			nn = n
		}
	}

	if (!nn) {
		console.log("NOT FOUND", x, y)
		return [ null, 0 ]
	}

	return [ nn, nd ]
}

function find_closest_city(x, y) {
	let nd = Infinity, nn = -1

	for (let i = 0; i < cities.length; ++i) {
		let n = cities[i]
		let d = Math.hypot(n.x - x, n.y - y)
		if (d < nd) {
			nd = d
			nn = i
		}
	}

	return nn
}

function find_enclosing_rect(list, x, y) {
	for (let [x1, y1, x2, y2] of list) {
		if (x >= x1 && x <= x2)
			if (y >= y1 && y <= y2)
				return true
	}
	return false
}

const CLUBS = "clubs"
const HEARTS = "hearts"
const SPADES = "spades"
const DIAMONDS = "diamonds"

const AUSTRIA = "Austria"
const SAXONY = "Saxony"
const EMPIRE = "Empire"
const HANOVER = "Hanover"
const PRUSSIA = "Prussia"
const SWEDEN = "Sweden"
const POLAND = "Poland"

// FIND and label all points!
let all_labels = labels.slice()
let cities = []
for (let key in points) {
	for (let [x, y] of points[key]) {
		let [ node, dist ] = find_closest_node(labels, x, y)
		if (dist > 15) {
			console.log("DISTANCE TOO FAR", key,x,y, "dist=" + dist, "name=" + node.name)
		}
		if (node) {
			labels = labels.filter(x => x !== node)
			let suit = "UNKNOWN"

			if (find_enclosing_rect(rects.$CLUBS, x, y))
				suit = CLUBS
			else if (find_enclosing_rect(rects.$HEARTS, x, y))
				suit = HEARTS
			else if (find_enclosing_rect(rects.$DIAMONDS, x, y))
				suit = DIAMONDS
			else if (find_enclosing_rect(rects.$SPADES, x, y))
				suit = SPADES
			else
				console.log("NOT ASSIGNED SUIT", x, y)

			let country = "UNKNOWN"
			if (find_enclosing_rect(rects.$Empire, x, y)) {
				country = EMPIRE
			}
			else if (find_enclosing_rect(rects.$Austria, x, y)) {
				country = AUSTRIA
			}
			else if (find_enclosing_rect(rects.$Hanover, x, y)) {
				country = HANOVER
			}
			else if (find_enclosing_rect(rects.$Saxony, x, y)) {
				country = SAXONY
			}
			else if (find_enclosing_rect(rects.$Sweden, x, y)) {
				country = SWEDEN
			}
			else if (find_enclosing_rect(rects.$Poland, x, y)) {
				country = POLAND
			}
			else if (find_enclosing_rect(rects.$Prussia, x, y)) {
				country = PRUSSIA
			}

			if (country === "UNKNOWN")
				console.log("no country:", node)

			cities.push({
				name: node.name,
				country,
				suit,
				type: key,
				x: Math.round(x),
				y: Math.round(y),
				adjacent: [],
				main_roads: [],
				roads: [],
			})
		} else {
			let [ dupname, dupdist ] = find_closest_node(all_labels, x, y)
			console.log("ALREADY USED", dupname, dupdist, x, y)
		}
	}
}

cities.sort((a,b) => {
	let a_obj = a.type.includes("objective")
	let b_obj = b.type.includes("objective")

	if (a_obj && !b_obj) return -1
	if (!a_obj && b_obj) return 1

	// if (a.type === "depot" && b.type !== "depot") return -1
	// if (a.type !== "depot" && b.type === "depot") return 1

	if (a.suit < b.suit) return -1
	if (a.suit > b.suit) return 1

	// if (a.country < b.country) return -1
	// if (a.country > b.country) return 1

	//if (a.type === "major_fortress" && b.type !== "major_fortress") return -1
	//if (a.type !== "major_fortress" && b.type === "major_fortress") return 1
	//if (a.type === "minor_fortress" && b.type !== "minor_fortress") return -1
	//if (a.type !== "minor_fortress" && b.type === "minor_fortress") return 1

	if (a.name < b.name) return -1
	if (a.name > b.name) return 1
	return b.y - a.y
})

for (let e of edges.main_road) {
	let a = find_closest_city(e.x1, e.y1)
	let b = find_closest_city(e.x2, e.y2)
	set_add(cities[a].main_roads, b)
	set_add(cities[b].main_roads, a)
	set_add(cities[a].adjacent, b)
	set_add(cities[b].adjacent, a)
}

for (let e of edges.road) {
	let a = find_closest_city(e.x1, e.y1)
	let b = find_closest_city(e.x2, e.y2)
	set_add(cities[a].roads, b)
	set_add(cities[b].roads, a)
	set_add(cities[a].adjacent, b)
	set_add(cities[b].adjacent, a)
}

let arrays = {
	name: [],
	// country: [],
	// suit: [],
	// type: [],
	x: [],
	y: [],
	adjacent: [],
	main_roads: [],
	roads: [],
}

let sets = {
	type: {
		objective_prussia: [],
		objective_russia: [],
		objective1_sweden: [],
		objective2_sweden: [],
		objective1_austria: [],
		objective2_austria: [],
		objective1_imperial: [],
		objective2_imperial: [],
		objective_france: [],
		depot: [],
		city: [],
	},
	suit: {
		clubs: [],
		diamonds: [],
		hearts: [],
		spades: [],
	},
	country: {
		Austria: [],
		Sweden: [],
		Poland: [],
		Prussia: [],
		Hanover: [],
		Saxony: [],
		Empire: [],
	},
}

for (let i = 0; i < cities.length; ++i) {
	let city = cities[i]
	for (let key in city) {
		if (arrays[key])
			arrays[key].push(city[key])
		if (sets[key])
			sets[key][city[key]].push(i)
	}
}

function map_to_range(x) {
	let pairs = []
	let a = 0, b = 1
	for (; b < x.length; ++b) {
		if (x[b-1] + 1 === x[b])
			continue
		pairs.push([x[a],x[b-1]])
		a = b
	}
	pairs.push([x[a],x[b-1]])
	return pairs
}

function remap_to_range(obj) {
	for (let key in obj)
		obj[key] = map_to_range(obj[key])
}

remap_to_range(sets.suit)
//remap_to_range(sets.country)

delete sets.type.city

sets.cities = arrays

function list_cities_in_rect(rect) {
	let [ x1, y1, x2, y2 ] = rect
	let list = []
	for (let i = 0; i < sets.cities.name.length; ++i) {
		let x = sets.cities.x[i]
		let y = sets.cities.y[i]
		if (x >= x1 && x <= x2 && y >= y1 && y <= y2)
			list.push(i)
	}
	return list
}

sets.sectors = {}
for (let key in sectors)
	sets.sectors[key] = list_cities_in_rect(sectors[key])

console.log("const data = " + JSON.stringify(sets))
console.log("if (typeof module === 'object') module.exports = data")
