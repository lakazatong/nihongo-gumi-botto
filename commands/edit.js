"use strict";

const { SlashCommandBuilder, MessageFlags } = require("discord.js");
const db = require("../database/decks.js");

async function callback(interaction, deck) {
	const kanji = interaction.options.getString("kanji");
	const reading = interaction.options.getString("reading") || null;
	const meanings = interaction.options.getString("meanings") || null;
	const forms = interaction.options.getString("forms") || null;
	const example = interaction.options.getString("example") || null;
	db.getCardByKanji(interaction, deck, kanji, (card) => {
		if (card) {
			if (
				(!reading || card.reading === reading) &&
				(!meanings || card.meanings === meanings) &&
				(!forms || card.forms === forms) &&
				(!example || card.example === example)
			) {
				interaction.reply({
					content: `No changes detected for **${kanji}** in **${deck}**.`,
					flags: MessageFlags.Ephemeral,
				});
			} else {
				db.updateCard(interaction, deck, kanji, reading, meanings, forms, example, () => {
					interaction.reply({
						content: `**${kanji}** in **${deck}** updated successfully.`,
						flags: MessageFlags.Ephemeral,
					});
				});
			}
		} else {
			interaction.reply({
				content: `**${kanji}** doesn't exist in **${deck}**.`,
				flags: MessageFlags.Ephemeral,
			});
		}
	});
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName(__filename.split("/").pop().replace(".js", ""))
		.setDescription("Edits a card from a deck.")
		.addStringOption((opt) => opt.setName("kanji").setDescription("The kanjis writing").setRequired(true))
		.addStringOption((opt) => opt.setName("reading").setDescription("The kana writing").setRequired(false))
		.addStringOption((opt) => opt.setName("meanings").setDescription("The meanings").setRequired(false))
		.addStringOption((opt) => opt.setName("forms").setDescription("Alternative forms").setRequired(false))
		.addStringOption((opt) =>
			opt.setName("example").setDescription("An example sentence it's used in").setRequired(false)
		)
		.addStringOption((opt) => opt.setName("deck").setDescription("The deck name").setRequired(false)),
	callback,
};
