"use strict";

const { SlashCommandBuilder } = require("discord.js");
const db = require("../database/decks.js");

async function callback(interaction) {
	db.getAllDeckStats(interaction, interaction.user.id, (rows) => {
		interaction.reply({
			content:
				"name (card count, total score, average score)\n" +
				rows.map((r) => `- ${r.deck} (${r.count}, ${r.total || 0}, ${r.average?.toFixed(2) || 0})`).join("\n"),
		});
	});
}

module.exports = {
	data: new SlashCommandBuilder().setName("list").setDescription("Lists all your decks and their statistics."),
	callback,
};
