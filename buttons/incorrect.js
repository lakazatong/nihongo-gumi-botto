"use strict";

const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const db = require("../database/decks.js");
const { buildContent } = require("../utils/decks.js");
const { getUserScore } = require("../utils/database.js");

const getIncorrectButton = () =>
	new ButtonBuilder().setCustomId("incorrect").setLabel("❌").setStyle(ButtonStyle.Danger);

async function callback(interaction) {
	const [_, deck, id, timeoutId] = interaction.customId.split("_");
	clearTimeout(timeoutId);
	db.getCardById(interaction, deck, id, (row) => {
		db.updateScoreById(
			interaction,
			deck,
			id,
			Math.max(0, getUserScore(row.score, interaction.user.id) - 1),
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
	getIncorrectButton,
};
