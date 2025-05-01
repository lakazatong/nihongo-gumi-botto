"use strict";

const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { db } = require("../database/decks.js");

const getCorrectButton = () => new ButtonBuilder().setCustomId("correct").setLabel("✅").setStyle(ButtonStyle.Success);

async function callback(interaction) {
	const [_, id] = interaction.customId.split("_");
	db.get("SELECT * FROM decks WHERE id = ?", [id], (err, row) => {
		if (err) {
			console.error("db.get", err);
			return;
		}
		db.run("UPDATE decks SET score = ? WHERE id = ?", [row.score + 1, id], async (err) => {
			if (err) {
				console.error("db.run", err);
				return;
			}
			const button = new ActionRowBuilder().addComponents(getCorrectButton().setDisabled(true));
			await interaction.update({
				content: row.sentence
					? `${row.kanji}\n${row.reading}\n${row.meanings}\n${row.sentence}`
					: `${row.kanji}\n${row.reading}\n${row.meanings}`,
				components: [button],
			});
		});
	});
}

module.exports = {
	callback,
	getCorrectButton,
};
