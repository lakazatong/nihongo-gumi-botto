"use strict";

const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { db } = require("../database/decks.js");

const getIncorrectButton = () =>
	new ButtonBuilder().setCustomId("incorrect").setLabel("❌").setStyle(ButtonStyle.Danger);

async function callback(interaction) {
	const [_, id] = interaction.customId.split("_");
	db.get("SELECT * FROM decks WHERE id = ?", [id], (err, row) => {
		if (err) {
			console.error("db.get", err);
			return;
		}
		db.run("UPDATE decks SET score = ? WHERE id = ?", [Math.max(0, row.score - 1), id], async (err) => {
			if (err) {
				console.error("db.run", err);
				return;
			}
			const button = new ActionRowBuilder().addComponents(getIncorrectButton().setDisabled(true));
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
	getIncorrectButton,
};
