const fs = require("fs")

let fate_text = []
let fate_effect = []

function parse_fate_cards_raw() {
	let num = 1
	let out = []
	let buf = []

	function flush_card() {
		if (buf.length === 0)
			return
		if (buf.length !== 9)
			throw "BAD CARD"

		let number = parseInt(buf[8])
		let x = (number - 1) * 4


		fate_text[x+0] = buf[0]
		fate_text[x+1] = buf[2]
		fate_text[x+2] = buf[4]
		fate_text[x+3] = buf[6]

		fate_effect[x+0] = buf[1]
		fate_effect[x+1] = buf[3]
		fate_effect[x+2] = buf[5]
		fate_effect[x+3] = buf[7]
	}

	fs.readFileSync("tools/fatecards.ascii.txt", "utf-8").split("\n").forEach(line => {
		line = line.trim()

		if (line[0] === "-") {
			flush_card()
			num++
			buf = []
		} else if (line.length > 0) {
			buf.push(line)
		}
	})
}

parse_fate_cards_raw()

console.log("const fate_flavor_text = " + JSON.stringify(fate_text, 0, 4))
console.log("const fate_effect_text = " + JSON.stringify(fate_effect, 0, 4))
