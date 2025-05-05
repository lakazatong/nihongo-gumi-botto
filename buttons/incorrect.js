"use strict";

const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const db = require("../database/decks.js");
const { buildContent } = require("../utils/decks.js");

const getIncorrectButton = () =>
	new ButtonBuilder().setCustomId("incorrect").setLabel("❌").setStyle(ButtonStyle.Danger);

async function callback(interaction) {
	const [_, deck, id, timeoutId] = interaction.customId.split("_");
	clearTimeout(timeoutId);
	db.getCardById(interaction, deck, id, (row) => {
		db.updateScoreById(interaction, deck, id, Math.max(0, row.score - 1), async (response) => {
			const button = new ActionRowBuilder().addComponents(getIncorrectButton().setDisabled(true));
			await interaction.update({
				content: buildContent(row, false),
				components: [button],
			});
		});
	});
}

module.exports = {
	callback,
	getIncorrectButton,
};
