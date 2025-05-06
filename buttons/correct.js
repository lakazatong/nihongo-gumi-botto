"use strict";

const { ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require("discord.js");
const db = require("../database/decks.js");
const { buildContent } = require("../utils/decks.js");
const { getUserScore } = require("../utils/database.js");

const getCorrectButton = () => new ButtonBuilder().setCustomId("correct").setLabel("✅").setStyle(ButtonStyle.Success);

async function callback(interaction) {
	const userId = interaction.user.id;
	const [_, deck, id, timeoutId] = interaction.customId.split("_");
	clearTimeout(timeoutId);
	db.getCardById(interaction, deck, id, (card) => {
		db.updateScoreById(
			interaction,
			deck,
			id,
			getUserScore(card.score, interaction.user.id) + 1,
			userId,
			card.score,
			() => {
				const button = new ActionRowBuilder().addComponents(getCorrectButton().setDisabled(true));
				interaction.update({
					content: buildContent(card, false),
					flags: MessageFlags.Ephemeral,
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
