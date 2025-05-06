"use strict";

const { ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require("discord.js");
const db = require("../database/decks.js");
const { buildContent } = require("../utils/decks.js");
const { getUserScore } = require("../utils/database.js");
const { ask } = require("../utils/learn.js");

const getIncorrectButton = () =>
	new ButtonBuilder().setCustomId("incorrect").setLabel("❌").setStyle(ButtonStyle.Danger);

async function callback(interaction) {
	const userId = interaction.user.id;
	const [_, deck, id, timeoutId, active] = interaction.customId.split("_");
	clearTimeout(timeoutId);
	db.getCardById(interaction, deck, id, (card) => {
		db.updateScoreById(
			interaction,
			deck,
			id,
			Math.max(0, getUserScore(card.score, interaction.user.id) - 1),
			userId,
			card.score,
			() => {
				const button = new ActionRowBuilder().addComponents(getIncorrectButton().setDisabled(true));
				interaction.update({
					content: buildContent(card, false),
					components: [button],
				});
				if (active) ask(deck, interaction.user, true);
			}
		);
	});
}

module.exports = {
	callback,
	getIncorrectButton,
};
