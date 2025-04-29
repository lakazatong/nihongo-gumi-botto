"use strict";

const { kanjis_db } = require("../database/kanjis.js");
const { getOrDefaultAlias } = require("../database/aliases.js");

async function callback(interaction) {
	const userId = interaction.user.id;
	const kanji = interaction.options.getString("kanji");
	const reading = interaction.options.getString("reading");
	const meanings = interaction.options.getString("meanings");
	const sentence = interaction.options.getString("sentence") || null;

	getOrDefaultAlias(userId, interaction.user.username, (err, alias) => {
		if (err) {
			console.error(err);
			interaction.reply({
				content: "An error occurred while fetching the alias.",
				flags: MessageFlags.Ephemeral,
			});
			return;
		}
		kanjis_db.run(
			"INSERT INTO kanjis (alias, kanji, reading, meanings, sentence) VALUES (?, ?, ?, ?, ?)",
			[alias, kanji, reading, meanings, sentence],
			async (err) => {
				if (err) {
					console.error(err);
					await interaction.reply({
						content: "An error occurred while saving data.",
						flags: MessageFlags.Ephemeral,
					});
				} else {
					await interaction.reply({
						content: "Kanji saved successfully!",
						flags: MessageFlags.Ephemeral,
					});
				}
			}
		);
	});
}

module.exports = {
	callback,
};
