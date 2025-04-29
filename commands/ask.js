"use strict";

const { kanjis_db } = require("../database/kanjis.js");
const { getOrDefaultAlias } = require("../database/aliases.js");

async function callback(interaction) {
	getOrDefaultAlias(interaction.user.id, interaction.user.username, (err, alias) => {
		if (err) {
			console.error(err);
			interaction.reply({
				content: "An error occurred while fetching the alias.",
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		kanjis_db.get("SELECT * FROM kanjis WHERE alias = ? ORDER BY RANDOM() LIMIT 1", [alias], async (err, row) => {
			if (err) {
				console.error(err);
				await interaction.reply("An error occurred while fetching data.");
				return;
			}
			if (!row) {
				await interaction.reply("No data found in the database for your user ID.");
				return;
			}
			const buttons = new ActionRowBuilder().addComponents(
				getCorrectButton().setCustomId(`correct_${row.id}`),
				getIncorrectButton().setCustomId(`incorrect_${row.id}`)
			);

			await interaction.reply({
				content: row.sentence
					? `${row.kanji}\n||${row.reading}||\n||${row.meanings}||\n||${row.sentence}||`
					: `${row.kanji}\n||${row.reading}||\n||${row.meanings}||`,
				components: [buttons],
			});

			setTimeout(async () => {
				await interaction.editReply({
					content: row.sentence
						? `${row.kanji}\n${row.reading}\n${row.meanings}\n${row.sentence}`
						: `${row.kanji}\n${row.reading}\n${row.meanings}`,
					components: [],
				});
			}, 30000);
		});
	});
}

module.exports = {
	callback,
};
