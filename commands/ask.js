"use strict";

const { ActionRowBuilder, MessageFlags } = require("discord.js");
const { kanjis_db } = require("../database/kanjis.js");
const { getOwner, getDefaultDeck } = require("../database/decks.js");
const { getCorrectButton } = require("../buttons/correct.js");
const { getIncorrectButton } = require("../buttons/incorrect.js");

async function callback(interaction) {
	function help(deck) {
		kanjis_db.get("SELECT * FROM kanjis WHERE deck = ? ORDER BY RANDOM() LIMIT 1", [deck], (err, row) => {
			if (err) {
				console.error(err);
				return;
			}
			if (!row) {
				interaction.reply({
					content: "Empty deck.",
					flags: MessageFlags.Ephemeral,
				});
				return;
			}
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
		getOwner(deck, (err, owner_id) => {
			if (err) {
				console.error(err);
				interaction.reply({
					content: "An error occurred while getting the deck owner.",
					flags: MessageFlags.Ephemeral,
				});
				return;
			}

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

	const userId = interaction.user.id;
	const deck = interaction.options.getString("deck") || null;
	if (deck) {
		help2(deck);
	} else {
		getDefaultDeck(userId, (err, deck) => {
			if (err) {
				console.error(err);
				interaction.reply({
					content: "An error occurred while fetching the default deck.",
					flags: MessageFlags.Ephemeral,
				});
				return;
			}
			if (deck) {
				help2(deck);
			} else {
				interaction.reply({
					content: "No deck was given and no default deck was set.",
					flags: MessageFlags.Ephemeral,
				});
				return;
			}
		});
	}
}

module.exports = {
	callback,
};
