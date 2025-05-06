"use strict";

const { ActionRowBuilder } = require("discord.js");
const db = require("../database/decks.js");
const { buildContent } = require("../utils/decks.js");
const { getUserScore } = require("../utils/database.js");
const { ask } = require("../utils/learn.js");
const { getIncorrectButton } = require("../utils/buttons.js");

async function callback(interaction) {
	const userId = interaction.user.id;
	const [_, deck, card_ids_raw, id, timeoutId, active] = interaction.customId.split("_");
	const card_ids = card_ids_raw.length === 0 ? [] : card_ids_raw.split(",");
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
				if (active === "true") ask(deck, card_ids, interaction.user, true);
			}
		);
	});
}

module.exports = {
	callback,
};
