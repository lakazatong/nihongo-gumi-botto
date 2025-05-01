"use strict";

const { ActionRowBuilder, MessageFlags } = require("discord.js");
const { db } = require("../database/decks.js");
const { getCorrectButton } = require("../buttons/correct.js");
const { getIncorrectButton } = require("../buttons/incorrect.js");

async function callback(interaction) {
	const userId = interaction.user.id;

	function help(deck) {
		db.getRandomDeck(interaction, deck, (row) => {
			const buttons = new ActionRowBuilder().addComponents(
				getCorrectButton().setCustomId(`correct_${row.id}`),
				getIncorrectButton().setCustomId(`incorrect_${row.id}`)
			);

			interaction.reply({
				content: row.sentence
					? `${row.kanji}\n||${row.reading}||\n||${row.meanings}||\n||${row.sentence}||`
					: `${row.kanji}\n||${row.reading}||\n||${row.meanings}||`,
				components: [buttons],
			});

			setTimeout(async () => {
				interaction.editReply({
					content: row.sentence
						? `${row.kanji}\n${row.reading}\n${row.meanings}\n${row.sentence}`
						: `${row.kanji}\n${row.reading}\n${row.meanings}`,
					components: [],
				});
			}, 30000);
		});
	}

	function help2(deck) {
		db.getOwner(interaction, deck, (owner_id) => {
			if (owner_id === null) {
				interaction.reply({
					content: "The deck does not exist.",
					flags: MessageFlags.Ephemeral,
				});
			} else if (owner_id !== userId) {
				interaction.reply({
					content: "You are not the owner of this deck.",
					flags: MessageFlags.Ephemeral,
				});
			} else {
				help(deck);
			}
		});
	}

	const deck = interaction.options.getString("deck") || null;

	if (deck) {
		help2(deck);
	} else {
		db.getDefaultDeck(interaction, userId, (deck) => {
			if (deck) {
				help2(deck);
			} else {
				interaction.reply({
					content: "No deck was given and no default deck was set.",
					flags: MessageFlags.Ephemeral,
				});
			}
		});
	}
}

module.exports = {
	callback,
};
