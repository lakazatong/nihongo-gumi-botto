"use strict";

const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { db, getDeckById } = require("../database/decks.js");

const getCorrectButton = () => new ButtonBuilder().setCustomId("correct").setLabel("✅").setStyle(ButtonStyle.Success);

async function callback(interaction) {
	const [_, id] = interaction.customId.split("_");
	getDeckById(interaction, id, (row) => {
		db.updateScoreById(interaction, id, row.score + 1, async (response) => {
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
