import fs from "fs"
import { formatHex, parseHex, convertRgbToOklab } from 'culori'

function make_piece_colors(base) {
	let rgb = parseHex(base)
        let sh1 = convertRgbToOklab(rgb); sh1.l *= 0.90;
        let sh2 = convertRgbToOklab(rgb); sh2.l *= 0.85;
        let sh3 = convertRgbToOklab(rgb); sh3.l *= 0.80;
        let sh4 = convertRgbToOklab(rgb); sh4.l *= 0.25;
	return [ base, formatHex(sh1), formatHex(sh2), formatHex(sh3), formatHex(sh4) ]
}

const color_austria = make_piece_colors("#ffffff")
const color_hanover = make_piece_colors("#56beda")
const color_france = make_piece_colors("#ed1c24")
const color_imperial = make_piece_colors("#fff200")
const color_prussia = make_piece_colors("#00558c")
const color_russia = make_piece_colors("#157d36")
const color_sweden = make_piece_colors("#bacb32")

// sizes used in coin
// const IMAGE_W = 42
// const IMAGE_H = 28
// const TALL = 18

const IMAGE_W = 40
const IMAGE_H = Math.round( IMAGE_W * 3/4 )
const TALL = 15

const RX = (IMAGE_W - 1) / 2
const RY = (IMAGE_H - 1) / 2
const SVG_W = RX * 2 + 3
const SVG_H = RY * 2 + 3 + TALL
const CX = (RX * 2 + 3) / 2
const CY = (RY * 2 + 3) / 2

console.log("CYLINDER", SVG_W, SVG_H)

function mkarc(cx, cy, rx, ry, h) {
	return [
		'M', cx - rx, cy,
		'L', cx - rx, cy + h,
		'A', rx, ry, 0, 0, 0, cx + rx, cy + h,
		'L', cx + rx, cy,
		'z'
	].join(" ")
}

function print_cylinder(output, icon_file, c) {
	let icon = icon_file ? fs.readFileSync(icon_file).toString('base64') : null
	let svg = []

	svg.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${SVG_W}" height="${SVG_H}">`)

	if (icon)
		svg.push(`<clipPath id="c"><ellipse cx="${CX}" cy="${CY}" rx="${RX}" ry="${RY}"/></clipPath>`)

	if (1) {
		svg.push(`<linearGradient id="g">`)
		svg.push(`<stop offset="0%" stop-color="${c[1]}"/>`)
		svg.push(`<stop offset="50%" stop-color="${c[2]}"/>`)
		svg.push(`<stop offset="100%" stop-color="${c[3]}"/>`)
		svg.push('</linearGradient>')
		svg.push(`<path fill="url(#g)" stroke="${c[4]}" d="${mkarc(CX, CY, RX, RY, TALL)}"/>`)
	} else {
		svg.push(`<path fill="${c[1]}" stroke="${c[4]}" d="${mkarc(CX, CY, RX, RY, TALL)}"/>`)
	}

	if (icon) {
		svg.push(`<image preserveAspectRatio="none" href="data:image/png;base64,${icon}" clip-path="url(#c)" x="1" y="1" width="${IMAGE_W}" height="${IMAGE_H}"/>`)
		svg.push(`<ellipse fill="none" stroke="${c[4]}" cx="${CX}" cy="${CY}" rx="${RX}" ry="${RY}"/>`)
	} else {
		svg.push(`<ellipse fill="${c[0]}" stroke="${c[4]}" cx="${CX}" cy="${CY}" rx="${RX}" ry="${RY}"/>`)
	}

	svg.push('</svg>')
	fs.writeFileSync(output, svg.join("\n") + "\n")
}

const CUBE_SIDE = 20
const CUBE_ASPECT = 3/4
const CUBE_TALL = 15

const CUBE_W = Math.round( CUBE_SIDE * Math.sqrt(2) )
const CUBE_H = Math.round( CUBE_SIDE * Math.sqrt(2) * CUBE_ASPECT )

const CUBE_SVG_W = CUBE_W + 3
const CUBE_SVG_H = CUBE_TALL + CUBE_H + 3

console.log("CUBE", CUBE_SVG_W, CUBE_SVG_H, CUBE_W)

function print_cube(output, c) {
	let svg = []

	// let xo = 0
	// let yo = 0
	// let ys = 1 // 2/3

	// let w = 20
	// let d = Math.sqrt(w * w + w * w)
	// let h = Math.round(w * 0.8)

	let xo = 1.5
	let yo = 1.5
	let dx = CUBE_W
	let dy = CUBE_H
	let h = CUBE_TALL

	let v = [
		[ xo + (dx/2), yo + (0) ],
		[ xo + (dx), yo + (dy/2) ],
		[ xo + (dx/2), yo + (dy) ],
		[ xo + (0), yo + (dy/2) ],
	]

	let v2 = [
		[ v[1][0], v[1][1] ],
		[ v[1][0], v[1][1] + h ],
		[ v[2][0], v[2][1] + h ],
		[ v[3][0], v[3][1] + h ],
		[ v[3][0], v[3][1] ],
	]

	let v3 = [
		[ v[2][0], v[2][1] ],
		[ v[2][0], v[2][1] + h ],
	]

	let f1 = [
		[ v[1][0], v[1][1] ],
		[ v[1][0], v[1][1] + h ],
		[ v[2][0], v[2][1] + h ],
		[ v[2][0], v[2][1] ],
	]

	let f2 = [
		[ v[2][0], v[2][1] ],
		[ v[2][0], v[2][1] + h ],
		[ v[3][0], v[3][1] + h ],
		[ v[3][0], v[3][1] ],
	]

	svg.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${CUBE_SVG_W}" height="${CUBE_SVG_H}">`)

	svg.push(`<path fill="${c[0]}" d="M${v}"/>`)
	svg.push(`<path fill="${c[3]}" d="M${f1}"/>`)
	svg.push(`<path fill="${c[1]}" d="M${f2}"/>`)

	svg.push(`<path fill="none" stroke-linecap="round" stroke-linejoin="round" stroke="${c[4]}" d="M${v}z M${v2} M${v3}"/>`)

	svg.push('</svg>')
	fs.writeFileSync(output, svg.join("\n") + "\n")
}

print_cylinder("images/cylinder_austria_oos.svg", null, color_austria)
print_cylinder("images/cylinder_austria_1.svg", "tools/stickers/A1.png", color_austria)
print_cylinder("images/cylinder_austria_2.svg", "tools/stickers/A2.png", color_austria)
print_cylinder("images/cylinder_austria_3.svg", "tools/stickers/A3.png", color_austria)
print_cylinder("images/cylinder_austria_4.svg", "tools/stickers/A4.png", color_austria)
print_cylinder("images/cylinder_austria_5.svg", "tools/stickers/A5.png", color_austria)

print_cylinder("images/cylinder_france_oos.svg", null, color_france)
print_cylinder("images/cylinder_france_1.svg", "tools/stickers/F1.png", color_france)
print_cylinder("images/cylinder_france_2.svg", "tools/stickers/F2.png", color_france)
print_cylinder("images/cylinder_france_3.svg", "tools/stickers/F3.png", color_france)

print_cylinder("images/cylinder_hanover_oos.svg", null, color_hanover)
print_cylinder("images/cylinder_hanover_1.svg", "tools/stickers/H1.png", color_hanover)
print_cylinder("images/cylinder_hanover_2.svg", "tools/stickers/H2.png", color_hanover)

print_cylinder("images/cylinder_imperial_oos.svg", null, color_imperial)
print_cylinder("images/cylinder_imperial_1.svg", "tools/stickers/I1.png", color_imperial)

print_cylinder("images/cylinder_prussia_oos.svg", null, color_prussia)
print_cylinder("images/cylinder_prussia_1.svg", "tools/stickers/P1.png", color_prussia)
print_cylinder("images/cylinder_prussia_2.svg", "tools/stickers/P2.png", color_prussia)
print_cylinder("images/cylinder_prussia_3.svg", "tools/stickers/P3.png", color_prussia)
print_cylinder("images/cylinder_prussia_4.svg", "tools/stickers/P4.png", color_prussia)
print_cylinder("images/cylinder_prussia_5.svg", "tools/stickers/P5.png", color_prussia)
print_cylinder("images/cylinder_prussia_6.svg", "tools/stickers/P6.png", color_prussia)
print_cylinder("images/cylinder_prussia_7.svg", "tools/stickers/P7.png", color_prussia)
print_cylinder("images/cylinder_prussia_8.svg", "tools/stickers/P8.png", color_prussia)

print_cylinder("images/cylinder_russia_oos.svg", null, color_russia)
print_cylinder("images/cylinder_russia_1.svg", "tools/stickers/R1.png", color_russia)
print_cylinder("images/cylinder_russia_2.svg", "tools/stickers/R2.png", color_russia)
print_cylinder("images/cylinder_russia_3.svg", "tools/stickers/R3.png", color_russia)
print_cylinder("images/cylinder_russia_4.svg", "tools/stickers/R4.png", color_russia)

print_cylinder("images/cylinder_sweden_oos.svg", null, color_sweden)
print_cylinder("images/cylinder_sweden_1.svg", "tools/stickers/S1.png", color_sweden)

print_cube("images/cube_austria.svg", color_austria)
print_cube("images/cube_france.svg", color_france)
print_cube("images/cube_hanover.svg", color_hanover)
print_cube("images/cube_imperial.svg", color_imperial)
print_cube("images/cube_prussia.svg", color_prussia)
print_cube("images/cube_russia.svg", color_russia)
print_cube("images/cube_sweden.svg", color_sweden)
