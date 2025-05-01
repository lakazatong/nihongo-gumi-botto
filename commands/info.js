"use strict";

const db = require("../database/decks.js");

async function callback(interaction, deck) {
	db.getDeckStats(interaction, deck, (row) => {
		interaction.reply({
			content: `Deck: ${deck}\nCards: ${row.count}\nTotal Score: ${row.total || 0}\nAverage Score: ${
				row.average?.toFixed(2) || 0
			}`,
		});
	});
}

module.exports = callback;
