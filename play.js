"use strict"

// vim: set nowrap:

// TODO: sort selected generals above deselected generals when detaching?

const svgNS = "http://www.w3.org/2000/svg"

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
const ELIMINATED_TRAIN_Y = 210
const ELIMINATED_GENERAL_X = 1040
const ELIMINATED_GENERAL_Y = 160
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

/* CARD TEXTS */

const fate_flavor_text = [
	"Frederick chats with de Catt, “I cannot do without this Spanish snuff. It is a deeply rooted habit. I am befouling my face and my clothing. I look like a pig, don’t I?” De Catt, “I have to admit, Sire, that your face and your uniform are heavily coated with tobacco.” Frederick laughs. “Well, my dear, that is exactly what I call looking like a pig.”",
	"Russia founds her first mortgage bank, her first university and the Academy of the Three Noblest Arts in Petersburg. The Tsarina is generous in other areas too.",
	"Tsarina Elisabeth’s furious energy shores up the crumbling Austro-Russian alliance.",
	"General Tottleben raids Berlin and demands 4 million Thalers of war contributions. However, when rumours of Frederick’s approach reach him, he beats a hasty retreat.",
	"Rousseau publishes The Social Contract (Du contrat social), a fundamental philosophic text for modern democracy.",
	"The Russians are roaming the Neumark, marauding and spreading devastation. Fermor gives the order to bombard Küstrin with red-hot cannonballs.",
	"A number of supposedly fainthearted generals are court-martialed on Tsarina Elisabeth’s orders. Apraxin takes this as an instruction to act even more ruthlessly towards the local population, but it is the discipline of his own troops that deteriorates.",
	"Following his triumph at Kunersdorf, Pjotr S. Saltikov laments, “One more victory like this and I will have to take the message to Petersburg myself, alone and with my general’s baton in my hand.” He refuses to occupy the undefended Berlin.",
	"Portugal: Following the assassination attempt on Joseph I the conspiring aristocrats are executed.",
	"The French Foreign Secretary Choiseul believes that the destruction of Prussia would not be wise. He starts peace negotiations with Frederick. They fail after only a few days.",
	"Taken from a letter of Prince Soubise: “I believe our plan was excellent; but the enemy was not willing to give us enough time for its execution. The most important thing now is to save our nation’s honour and to lay the blame squarely on the Imperial Army.”",
	"Death of Georg Friedrich Händel, the prolific composer of oratorios, operas, vocal and instrumental music. The combatants respect the funeral rites in his native city of Halle.",
	"The Marquise de Pompadour, mistress of Louis XV and the de facto the ruler of France, dissuades the King from his thoughts of peace. “I prefer my lover to be a hero!” she argues.",
	"Voltaire writes, “In these seven years of war allied with Austria, France has lost more money and more men than in all the wars against Austria in the last two hundred years.”",
	"Frederick composes a verse: “This weakling on the throne / plaything of the Pompadour / with an evil love’s reward / marked for ever more.” Madame Pompadour swears revenge.",
	"The Duke of Cumberland, nicknamed “the Bloody Butcher of Scotland”, falls under the spell of a Danish Pietist, who promises to stop the French army with the assistance of the Holy Ghost.",
	"The Prince de Soubise is devastated when his favourite dog dies. He refuses to see anyone for three days.",
	"Frederick to his sister, “If, in common life, three citizens took it into their heads to fall upon their neighbour, and burn his house about him, they very certainly, by sentence of tribunal, would be broken on the wheel. O tempora, o mores! Indeed, it would be better to live with tigers, leopards and foxes, than with the assassins, bandits and rascals who reign over this poor world.”",
	"The 62-year-old Duc de Richelieu is a famous fellow, having bedded more than 600 ladies, outperforming even his King, Louis XV — And right now, the lovely Marquise de Nivernais is arriving . . .",
	"Abbé Bernis writes, “France has no generals who can compete with Frederick the Great, and if she had, they wouldn’t be given supreme command.”",
	"Gideon Ernst von Laudon had once wanted to serve in the Prussian army, but was turned down by Frederick. Perhaps the King did not like his red hair or the fact that he looked like a horse. Now Laudon turns out to be the most competent Austrian general and repeatedly manages to put the Prussians in great difficulty.",
	"Daun wins a brilliant victory over Frederick. And Prince Henry toasts his brother’s defeat in champagne! Also, Maria Theresa acclaims her hero.",
	"Death of the composer Johann Stamitz. In Berlin, Frederick the Great founds the Royal Prussian Porcelain Manufacture KPM.",
	"Austrian hussars capture an important Prussian supply train, causing the Prussians to suffer a grave shortage of food and ammunition.",
	"“There is not a trace of what I once was left to be found. I have become a grey old man who has lost half his teeth; a man with no cheer, bereft of spirit and lacking in imagination; in one word: a shadow.”",
	"The new reader of Prussia’s King is introduced: Henri de Catt, a 33-year old Swiss. His most important task will be sitting through Frederick’s interminable monologues.",
	"Frederick repeatedly speaks of suicide, composes a flood of poems and dreams of alliances with the Turks and the Tartars.",
	"Frederick’s generals implore him to break off the battle; the enemy is bound to withdraw. But Frederick is stubborn. And that’s the way the catastrophe of Kunersdorf begins . . .",
	"Frederick demands 300,000 Thalers in war contributions from the burghers of Leipzig, some of whom are held prisoner and fed only bread and water until the money is paid.",
	"Leopold von Daun, dilatory as a matter of principle, faces the Prussians with four times their force. It takes 5 weeks of argument with the council of war in Vienna to come up with a plan of action . . .",
	"Frederick writes to his sister Wilhelmine: “What an awful slaughter! What a bloodbath! An unthinking world calls it heroism, but close up, it is always horrid.”",
	"With perfect use of the oblique battle formation, Frederick routs Charles of Lorraine (Karl von Lothringen) who outnumbers him two to one.",
	"The grain supply has gone rotten in many Russian depots, causing widespread supply problems.",
	"At Liegnitz, 80,000 Austrians surprisingly encircle Frederick’s 30,000 men. Improvising masterfully, the Prussian King manages to escape the trap.",
	"Frederick writes, “Our troops were in complete confusion, I reassembled them three times, but finally we had to quit the field. My coat is riddled with bullets, two horses were killed under me — my misfortune is that I am still alive.”",
	"Frederick orders Austrian coinage with decreased silver content to be minted and exchanged for genuine currency. Satisfied, he states, “My enemies are financing my war efforts.”",
	"Prussia is recruiting new troops. “But they are so lousy”, Frederick scoffs, “that they can be shown to the enemy only from a distance.”",
	"After one of his generals loses a battle Frederick writes, “It was my belief that this thing was destined to fail. It is not your fault that the cowards ran away so promptly.”",
	"Keith is deeply worried about the exposed position of the Prussian camp. “If the Austrians leave us alone here, they deserve to be hanged!” Frederick retorts, “They are more afraid of us than of the gallows.” A fatal mistake; the Austrians attack that same night.",
	"By unifying the collections of Cotton, Harley and Sloane, the British Museum in London is founded.",
	"Frederick orders Seydlitz to engage the enemy at last! Seydlitz replies, “After the battle, my head is at His Majesty’s disposal. During the battle, however, I would like to be permitted to serve my King with good use of the same.” — Seydlitz will unleash his charge at the decisive moment.",
	"The British occupy Cuba, which they hope to exchange for Spanish Florida. Also, fresh troops are sent to the Electorate of Hanover.",
	"Of his brother Henry (Heinrich), Frederick states, “He is the only one of us who has not made a single mistake so far.”",
	"Frederick: “One could assume that the Caucasus or the Cordillera is the homeland of the Austrian generals. Whenever they see a mountain, they climb it. They appear to be blindly in love with the rocks and the ravines.”",
	"In Vienna caricatures are circulating that depict Leopold von Daun with a nightcap. His wife is pelted with horse manure on her daily drive through the city.",
	"“Hottentots” is the only name Frederick has for the Swedes. Only a poorly equipped militia is sent to fight them.",
	"Following a major defeat, the Runaway Army, as the Imperial Army is now called, only stops retreating on reaching the Harz.",
	"Frederick writes of Maria Theresa, “I have to admit that this Lady is highly admirable because of her excellent morals. Only few women are her equal in this regard, most are whores. Maria Theresa abominates all whores; she has them thrown in prison, especially if she suspects them of desiring her husband.”",

	"Voltaire, Frederick’s two-faced friend, manages to print Frederick’s poems, which contain negative comments about the King of England. London society is outraged and the House of Commons votes unanimously for a reduction of subsidies.",
	"William Pitt, the main advocate of the alliance with Prussia, has lost influence. His successor Lord Bute intends to make peace with France. To achieve this, he is willing to make certain concessions: Prussia should agree to give up Upper Silesia and the County of Glatz. To support his policy, he reduces the subsidies.",
	"Death of the Tsarina. Her successor, Peter III, is an ardent admirer of Frederick. He begs for the Prussian Black-Eagle-Medal and declares that it is more of an honour to be a Prussian General than a Russian Tsar. He then signs the peace treaty. Three months later he is assassinated and his wife, Catherine the Great, accedes to the throne. Nevertheless, the peace is kept.",
	"Adolf Frederick, King of Sweden, initiates peace negotiations with Frederick the Great, who is in a mood for ridicule: “Peace? Am I then at war with Sweden? I am not, am I?” The Swedish envoys assure him that indeed he is, and so a peace treaty is signed.",
	"Robert Clive’s fantastic victory at Plassey means the complete loss of India for France. Moreover the state is on the verge of bankruptcy. Louis XV overrules Madame Pompadour and reduces spending on the war and subsidies.",
	"In the war for the colonies France loses a wide range of possessions along the Ohio and Mississippi rivers, and in Quebec. Tax income decreases drastically. The Duc de Choiseul advises that military expenditure and subsidies be reduced.",

	"1756, August 29. Frederick is convinced that war cannot be avoided. So he strikes ﬁrst and invades Saxony with his armies under his personal command.",
	"Escaping the Prussians, Minister Brühl has to leave behind 802 bathrobes, 28 coaches, 67 vinaigrettes and 1500 wigs.",
	"Saxony has surrendered, and now Frederick demands an alliance! – “That never happened in world’s history before!” – Frederick: “I attach importance to being inventive.”",
	"William Pitt convinces the British House of Commons that the battle for America will be won in Europe. After a standing ovation, Prussia is voted generous subsidies.",
	"In the spring of 1757, Frederick starts an offensive into Bohemia before the attackers are able to complete the encirclement of Prussia. Siege is laid to Prague...",
]

const fate_effect_text = [
	"No effect.",
	"Any one Russian on-map general receives a new troop for free (if possible).",
	"Austria and Russia may exchange one TC with each other.",
	"Tottleben receives a new troop for free (if possible and if on-map).",
	"No effect.",
	"If Fermor starts his move in Küstrin (H6) or in an adjacent city, he may not move next turn.",
	"Apraxin immediately loses one troop (but not if he has to be taken off-map).",
	"Next turn, Saltikov may move only 2 cities (3 on main roads).",
	"No effect.",
	"Next turn, if Prussia and France fight each other, they may not use TCs with values of 10 or more.",
	"Next turn, Soubise and Hildburghausen may not attack with the same TC-symbol.",
	"Next turn, no general may be attacked in the city of Halle (E4) and no supply train may be eliminated in the city of Halle.",
	"Next turn, the first TC played by France is worth an additional point.",
	"No effect.",
	"France may discard any one TC for a new one from the draw deck.",
	"Next turn, Cumberland may not move into attack position; he may not eliminate a supply train.",
	"Next turn, Soubise may not move into attack position; he may not eliminate a supply train.",
	"No effect.",
	"Next turn, Richelieu may move 2 cities only (3 on main roads).",
	"If stacked, Chevert may not unstack next turn.",
	"Austria may move Laudon by one city immediately; Laudon may even unstack.",
	"Daun receives one new troop (if possible and if on-map).",
	"No effect.",
	"Austria may flip any one Prussian general/stack in Austria or Saxony, and in doing so, set him out of supply.",
	"Next turn, Friedrich may not move into attack position and may not eliminate a supply train.",
	"No effect.",
	"Next turn, Friedrich may not receive any new troops.",
	"If Friedrich is involved in combat next turn, Prussia must reach a positive score with the first TC(s) she plays (if possible).",
	"Any one Prussian on-map general receives a new troop for free (if possible).",
	"Next turn, any Prussians who are attacked by Daun may move to any empty adjacent city (before the combat is resolved); by doing so they avoid all combat.",
	"No effect.",
	"If Friedrich attacks next turn, his first TC is worth 5 additional points.",
	"All Russian generals 5 or 6 cities distant from their nearest supply train are immediately out of supply; flip them.",
	"Next turn, Friedrich may move 4 cities, even as a stack (5 on main roads).",
	"No effect.",
	"Prussia may draw randomly one TC from Austria, after first giving one TC of her choice to Austria.",
	"Next turn, every Prussian general who receives new troops may not move into attack position.",
	"Any one Prussian general with 2 or more troops loses one troop immediately.",
	"If Friedrich is attacked next turn, the first TC played by Prussia is worth nothing (0 points).",
	"No effect.",
	"Next turn, Prussia may play the 11 of spades (Seydlitz) once at double value.",
	"Any one Hanoverian on-map general receives a new troop (if possible).",
	"Next turn, Prinz Heinrich protects objectives up to 4 cities distant.",
	"No effect.",
	"Next turn, Daun may move only 2 cities (3 on main roads).",
	"If Ehrensvärd is 5 or 6 cities distant from his supply train, he is immediately out of supply; flip him.",
	"If Hildburghausen has lost a battle this turn, Prussia may move him 2 cities westwards (if possible).",
	"No effect.",

	// "From now on Prussia will receive two less Tactical Cards, but always a minimum of four.",
	// "From now on Prussia will receive two less Tactical Cards, but always a minimum of four.",
	// "Russia quits the game! Also, Prussia has to remove any one general (other than Friedrich) permanently from the game; this general may be off-map. For Sweden eased victory conditions come into effect. If Sweden has already quit the game, the Imperial Army switches players and eased victory conditions come into effect for Austria and the Imperial Army (see rule 11).",
	// "Sweden quits the game! Also, Prussia has to remove any one general (other than Friedrich) permanently from the game; this general may be off-map. If Russia has already quit the game as well, the Imperial Army switches players and eased victory conditions come into effect for Austria and the Imperial Army (see rule 11).",
	// "From now on Austria receives only 4 TC; France only 3 (which she may all keep). If this has already happened, then: France quits the game! Cumberland is removed permanently from the game. Hanover receives only 1 TC from now on. The Imperial Army switches players and eased victory conditions come into effect for Austria and the Imperial Army (see rule 11).",
	// "From now on Austria receives only 4 TC; France only 3 (which she may all keep). If this has already happened, then: France quits the game. Cumberland is removed permanently from the game. Hanover receives only 1 TC from now on. The Imperial Army switches players and eased victory conditions come into effect for Austria and the Imperial Army (see rule 11).",

	"From now on Prussia will receive two less Tactical Cards, but always a minimum of four.",
	"From now on Prussia will receive two less Tactical Cards, but always a minimum of four.",
	"Russia quits the game! For Sweden eased victory conditions come into effect. If Sweden has already quit the game, the Imperial Army switches players and eased victory conditions come into effect for Austria and the Imperial Army.",
	"Sweden quits the game! If Russia has already quit the game as well, the Imperial Army switches players and eased victory conditions come into effect for Austria and the Imperial Army.",
	"From now on Austria receives only 4 TC; France only 3 (which she may all keep). If this has already happened, then: France quits the game! Hanover receives only 1 TC from now on. The Imperial Army switches players and eased victory conditions come into effect for Austria and the Imperial Army.",
	"From now on Austria receives only 4 TC; France only 3 (which she may all keep). If this has already happened, then: France quits the game! Hanover receives only 1 TC from now on. The Imperial Army switches players and eased victory conditions come into effect for Austria and the Imperial Army.",

	null,
	null,
	null,
	null,
	null,
]

/* PANEL ORDER */

const panel_order = [ P_PRUSSIA, P_HANOVER, P_RUSSIA, P_SWEDEN, P_AUSTRIA, P_IMPERIAL, P_FRANCE, P_FRANCE+1 ]

function sort_power_panel() {
	let start = 0
	if (view)
		start = view.power
	ui.power_panel_list.replaceChildren()
	for (let i = 0; i < 8; ++i) {
		let p = panel_order[(i + start) % 8]
		ui.power_panel_list.appendChild(ui.power_panel[p])
	}
}

/* BUILD UI */

const ui = {
	header: document.querySelector("header"),
	roads_element: document.getElementById("roads"),
	spaces_element: document.getElementById("spaces"),
	pieces_element: document.getElementById("pieces"),
	markers_element: document.getElementById("markers"),
	clock_of_fate: document.getElementById("clock_of_fate"),
	power_panel_list: document.getElementById("power_panel_list"),
	power_panel: [
		document.getElementById("hand_prussia_panel"),
		document.getElementById("hand_hanover_panel"),
		document.getElementById("hand_russia_panel"),
		document.getElementById("hand_sweden_panel"),
		document.getElementById("hand_austria_panel"),
		document.getElementById("hand_imperial_panel"),
		document.getElementById("hand_france_panel"),
		document.getElementById("clock_of_fate_panel"),
	],
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
	roads: [],
	action_register: [],
}

function register_action(target, action, id) {
	target.my_id = id
	target.my_action = action
	target.onmousedown = (evt) => on_click_action(evt, target)
	ui.action_register.push(target)
}

function on_click_action(evt, target) {
	if (evt.button === 0) {
		if (send_action(target.my_action, target.my_id)) {
			hide_move_path()
			evt.stopPropagation()
		}
	}
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

function make_road(c1, c2, type) {
	let e = document.createElementNS(svgNS, "line")
	e.setAttribute("class", type)
	let x1 = data.cities.x[c1]
	let y1 = data.cities.y[c1]
	let x2 = data.cities.x[c2]
	let y2 = data.cities.y[c2]

	let v = Math.hypot(x2 - x1, y2 - y1)
	let dx = (x2 - x1) / v
	let dy = (y2 - y1) / v
	let r = 18
	x1 += r * dx
	y1 += r * dy
	x2 -= r * dx
	y2 -= r * dy

	e.setAttribute("x1", x1)
	e.setAttribute("y1", y1)
	e.setAttribute("x2", x2)
	e.setAttribute("y2", y2)
	e.setAttribute("visibility", "hidden")
	ui.roads[c1][c2] = e
	ui.roads[c2][c1] = e
	ui.roads_element.appendChild(e)
}

function create_piece(action, id, style) {
	let e = document.createElement("div")
	e.className = style
	register_action(e, action, id)
	e.onmouseenter = on_focus_piece
	e.onmouseleave = on_blur_piece
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
			ui.tc[c] = create_piece("card", c, "card tc deck_" + (n+1) + " " + suit_class[suit] + value)
		}
	}
	for (let value = 2; value <= 3; ++value) {
		let c = (n << 7) | (4 << 4) | value
		ui.tc[c] = create_piece("card", c, "card tc deck_" + (n+1) + " R")
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

function has_removed_all_pieces(pow) {
	for (let p of all_power_generals[pow])
		if (view.pos[p] !== REMOVED)
			return false
	for (let p of all_power_trains[pow])
		if (view.pos[p] !== REMOVED)
			return false
	return true
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
	make_tc_deck(4)

	ui.tc_back = [
		make_tc_deck_back("deck_1"),
		make_tc_deck_back("deck_2"),
		make_tc_deck_back("deck_3"),
		make_tc_deck_back("deck_4"),
		make_tc_deck_back("deck_5"),
	]

	ui.tcbreak = document.createElement("div")
	ui.tcbreak.className = "draw-break"

	ui.fate = []
	for (let fc = 0; fc <= 18; ++fc)
		ui.fate[fc] = make_fate_card(fc)

	if (1) {
		for (let a = 0; a <= last_city; ++a)
			ui.roads[a] = []
		for (let a = 0; a <= last_city; ++a) {
			for (let b of cities.major_roads[a]) {
				if (a < b) {
					make_road(a, b, "major_road")
				}
			}
			for (let b of cities.roads[a]) {
				if (a < b) {
					make_road(a, b, "road")
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

		e.onmouseenter = on_focus_city
		e.onmouseleave = on_blur_city

		//e.classList.add("hide")
		e.style.left = x + "px"
		e.style.top = y + "px"
		e.title = cities.name[a]

		ui.spaces_element.appendChild(e)
	}

	sort_power_panel()

	update_favicon()
}

on_init()

/* SHOW PATH FOR MOVES */

function on_focus_city(evt) {
	document.getElementById("status").textContent = evt.target.my_name
	if (view) {
		if (view.move_minor)
			show_move_path(evt.target.my_id)
		if (view.retreat)
			show_retreat_path(evt.target.my_id)
	}
}

function on_blur_city() {
	document.getElementById("status").textContent = ""
	hide_move_path()
}

function on_focus_piece(evt) {
	document.getElementById("status").textContent = evt.target.my_name
	if (view && view.move_minor)
		show_move_path(view.pos[evt.target.my_id])
}

function on_blur_piece() {
	document.getElementById("status").textContent = ""
	hide_move_path()
}

var _move_path = []
var _battle_road = null

function hide_move_path() {
	if (_move_path) {
		for (let i = 1; i < _move_path.length; ++i) {
			let x = _move_path[i-1]
			let y = _move_path[i]
			ui.roads[x][y].setAttribute("visibility", "hidden")
		}
		_move_path = null
	}
}

function show_move_path(x) {
	hide_move_path()

	if (map_get(view.move_major, x, -1) >= 0) {
		_move_path = []
		while (x >= 0) {
			_move_path.push(x)
			x = map_get(view.move_major, x, -1)
		}
	}

	else

	if (map_get(view.move_minor, x, -1) >= 0) {
		_move_path = []
		while (x >= 0) {
			_move_path.push(x)
			x = map_get(view.move_minor, x, -1)
		}
	}

	if (_move_path) {
		for (let i = 1; i < _move_path.length; ++i) {
			let x = _move_path[i-1]
			let y = _move_path[i]
			ui.roads[x][y].setAttribute("visibility", "visible")
		}
	}
}

function show_retreat_path(x) {
	hide_move_path()
	_move_path = map_get(view.retreat, x, null)
	if (_move_path) {
		_move_path = _move_path.slice()
		_move_path.push(x)
		for (let i = 1; i < _move_path.length; ++i) {
			let x = _move_path[i-1]
			let y = _move_path[i]
			ui.roads[x][y].setAttribute("visibility", "visible")
		}
	}
}

function show_battle_path() {
	_battle_road = ui.roads[view.attacker][view.defender]
	_battle_road.setAttribute("visibility", "visible")
}

function hide_battle_path() {
	if (_battle_road) {
		_battle_road.setAttribute("visibility", "hidden")
		_battle_road = null
	}
}

function update_path() {
	hide_move_path()
	hide_battle_path()
	if (view.move_major) {
		ui.roads_element.setAttribute("class", "move")
	} else if (view.retreat) {
		ui.roads_element.setAttribute("class", "retreat")
	} else if (view.attacker !== undefined) {
		ui.roads_element.setAttribute("class", "battle")
		show_battle_path()
	} else {
		ui.roads_element.setAttribute("class", null)
	}
}

/* UPDATE UI */

function layout_general_offset(g, s) {
	let n = 0
	for (let i = g+1; i < 24; ++i) {
		if (view.pos[i] === s) {
			++n
			if (is_action("piece", i))
				++n
		}
	}
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
		if (i > g && view.pos[i] === s)
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

function cmp_tc(a, b) {
	let ax = (to_suit(a) << 7) + (to_value(a) << 3) + to_deck(a)
	let bx = (to_suit(b) << 7) + (to_value(b) << 3) + to_deck(b)
	return ax - bx
}

function on_update() {
	ui.header.classList.toggle("prussia", view.power === P_PRUSSIA)
	ui.header.classList.toggle("hanover", view.power === P_HANOVER)
	ui.header.classList.toggle("russia", view.power === P_RUSSIA)
	ui.header.classList.toggle("sweden", view.power === P_SWEDEN)
	ui.header.classList.toggle("austria", view.power === P_AUSTRIA)
	ui.header.classList.toggle("imperial", view.power === P_IMPERIAL)
	ui.header.classList.toggle("france", view.power === P_FRANCE)

	sort_power_panel()

	for (let g = 0; g <= 23; ++g)
		layout_general(g, view.pos[g])
	for (let t = 24; t <= 34; ++t)
		layout_train(t, view.pos[t])

	update_path()

	let back = [ 0, 0, 0, 0, 0 ]

	for (let i = 0; i < 5; ++i)
		ui.turns[i].classList.toggle("hide", (typeof view.fate === "object") || (i + 1 < view.fate))

	for (let pow = 0; pow < 7; ++pow) {
		ui.power_panel[pow].classList.toggle("hide", has_removed_all_pieces(pow))

		ui.hand[pow].replaceChildren()
		view.hand[pow].sort(cmp_tc)
		for (let c of view.hand[pow]) {
			if ((c & 15) === 0)
				ui.hand[pow].appendChild(ui.tc_back[c>>7][back[c>>7]++])
			else
				ui.hand[pow].appendChild(ui.tc[c])
		}
	}

	if (view.draw) {
		view.draw.sort(cmp_tc)
		if (view.hand[view.power].length > 0)
			ui.hand[view.power].appendChild(ui.tcbreak)
		for (let c of view.draw)
			ui.hand[view.power].appendChild(ui.tc[c])
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

	action_button("end_cards", "End card draw")
	action_button("end_setup", "End setup")
	action_button("end_recruit", "End recruit")
	action_button("end_movement", "End movement")
	action_button("end_combat", "End combat")
	action_button("end_supply", "End supply")
	action_button("end_turn", "End turn")

	action_button("undo", "Undo")

	process_actions()
}

/* LOG */

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
	text = text.replace(/C(\d+)/g, sub_tc)
	text = text.replace(/P(\d+)/g, sub_piece)

	if (text.match(/^\$(\d+)/)) {
		let fx = parseInt(text.substring(1))
		if (fx < 48 + 6)
			text = `<p class="q">${fate_flavor_text[fx]}<p>${fate_effect_text[fx]}`
		else
			text = `<p class="q">${fate_flavor_text[fx]}`
	}
	else if (text.match(/^# /)) {
		p.className = "h fate"
		text = text.substring(2)
	}
	else if (text.match(/^=\d/)) {
		p.className = "h " + power_class[text[1]]
		text = power_name[text[1]]
	}

	p.innerHTML = text
	return p
}

/* COMMON LIBRARY */

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
