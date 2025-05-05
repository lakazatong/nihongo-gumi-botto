"use strict";

const { SlashCommandBuilder } = require("discord.js");
const db = require("../database/decks.js");

async function callback(interaction, deck) {
	db.getDeckStats(interaction, deck, (stats) => {
		interaction.reply(
			`Deck: **${deck}**\nCards: ${stats.count || 0}\nTotal Score: ${stats.total || 0}\nAverage Score: ${
				stats.average?.toFixed(2) || 0
			}`
		);
	});
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName(__filename.split("/").pop().replace(".js", ""))
		.setDescription("Shows informations about a deck.")
		.addStringOption((opt) => opt.setName("deck").setDescription("The deck name").setRequired(false)),
	callback,
};
