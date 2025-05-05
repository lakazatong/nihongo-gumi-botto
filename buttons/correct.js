"use strict";

const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const db = require("../database/decks.js");
const { buildContent, getUserScore } = require("../utils/decks.js");

const getCorrectButton = () => new ButtonBuilder().setCustomId("correct").setLabel("✅").setStyle(ButtonStyle.Success);

async function callback(interaction) {
	const userId = interaction.user.id;
	const [_, deck, id, timeoutId] = interaction.customId.split("_");
	clearTimeout(timeoutId);
	db.getCardById(interaction, deck, id, (row) => {
		db.updateScoreById(
			interaction,
			deck,
			id,
			getUserScore(row.score, interaction.user.id) + 1,
			userId,
			row.score,
			() => {
				const button = new ActionRowBuilder().addComponents(getCorrectButton().setDisabled(true));
				interaction.update({
					content: buildContent(row, false),
					components: [button],
				});
			}
		);
	});
}

module.exports = {
	callback,
	getCorrectButton,
};
