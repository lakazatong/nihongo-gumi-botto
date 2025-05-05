"use strict";

const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const db = require("../database/decks.js");
const { buildContent } = require("../utils/decks.js");

const getCorrectButton = () => new ButtonBuilder().setCustomId("correct").setLabel("✅").setStyle(ButtonStyle.Success);

async function callback(interaction) {
	const [_, deck, id, timeoutId] = interaction.customId.split("_");
	clearTimeout(timeoutId);
	db.getCardById(interaction, deck, id, (row) => {
		db.updateScoreById(interaction, deck, id, row.score + 1, async (response) => {
			const button = new ActionRowBuilder().addComponents(getCorrectButton().setDisabled(true));
			await interaction.update({
				content: buildContent(row, false),
				components: [button],
			});
		});
	});
}

module.exports = {
	callback,
	getCorrectButton,
};
