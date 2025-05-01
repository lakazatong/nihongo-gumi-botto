"use strict";

const { SlashCommandBuilder } = require("discord.js");
const db = require("../database/decks.js");

async function callback(interaction, deck) {
	db.getDeckStats(interaction, deck, (row) => {
		interaction.reply(
			`Deck: ${deck}\nCards: ${row.count}\nTotal Score: ${row.total || 0}\nAverage Score: ${
				row.average?.toFixed(2) || 0
			}`
		);
	});
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName("info")
		.setDescription("Shows informations about a deck.")
		.addStringOption((opt) => opt.setName("deck").setDescription("The deck name").setRequired(false)),
	callback,
};
