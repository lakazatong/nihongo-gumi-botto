"use strict";

const { SlashCommandBuilder } = require("discord.js");
const db = require("../database/decks.js");

async function callback(interaction) {
	db.getAllDeckStats(interaction, interaction.user.id, (stats) => {
		interaction.reply({
			content:
				"name (card count, total score, average score)\n" +
				stats
					.map((r) =>
						`- ${r.deck} ` + r
							? `(${r.count || 0}, ${r.total || 0}, ${r.average?.toFixed(2) || 0})`
							: "(error)"
					)
					.join("\n"),
		});
	});
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName(__filename.split("/").pop().replace(".js", ""))
		.setDescription("Lists all your decks and their statistics."),
	callback,
};
