"use strict";

const { MessageFlags } = require("discord.js");
const fs = require("fs");
const axios = require("axios");
const { saveCardsToJson } = require("../utils/anki_parser.js");
const { kanjis_db } = require("../database/kanjis.js");
const { isOwner, getOrDefaultDeck } = require("../database/decks.js");

async function callback(interaction) {
	const attachment = interaction.options.getAttachment("file");

	await interaction.reply({
		content: "Processing your file...",
		flags: MessageFlags.Ephemeral,
	});

	async function help(deck) {
		const fileUrl = attachment.url;
		const filename = attachment.name;

		try {
			const response = await axios.get(fileUrl, {
				responseType: "stream",
			});
			const writer = fs.createWriteStream(filename);
			response.data.pipe(writer);

			await new Promise((resolve, reject) => {
				writer.on("finish", resolve);
				writer.on("error", reject);
			});

			const cardsPath = saveCardsToJson(filename);
			if (!cardsPath) {
				await interaction.editReply({
					content: "An error occurred while parsing the file.",
				});
				return;
			}
			const fileContent = fs.readFileSync(cardsPath, "utf-8");

			JSON.parse(fileContent).forEach(({ kanji, reading, meanings, sentence }) => {
				const formattedMeanings = Object.entries(meanings)
					.map(([category, values]) => `${category}: ${values.join(", ")}`)
					.join("\n");

				kanjis_db.run(
					"INSERT INTO kanjis (deck, kanji, reading, meanings, sentence) VALUES (?, ?, ?, ?, ?)",
					[deck, kanji, reading, formattedMeanings, sentence || null],
					async (err) => {
						if (err) console.error(err);
					}
				);
			});

			await Promise.all([
				fs.unlink(cardsPath, (err) => {
					console.error(err);
				}),
				fs.unlink(filename, (err) => {
					console.error(err);
				}),
			]);

			await interaction.editReply({
				content: `All kanjis of ${filename} were successfully loaded in the deck ${deck}!`,
			});
		} catch (err) {
			console.error(err);
			await interaction.editReply({
				content: "An error occurred while getting the file.",
			});
		}
	}

	function help2(deck) {
		getOrDefaultDeck(interaction.user.id, interaction.user.username, (err, deck) => {
			if (err) {
				console.error(err);
				interaction.reply({
					content: "An error occurred while fetching the deck.",
					flags: MessageFlags.Ephemeral,
				});
				return;
			}
			help(deck);
		});
	}

	const deck = interaction.options.getString("deck") || null;
	if (deck) {
		exists(deck, (err, bool) => {
			if (err) {
				console.error(err);
				interaction.reply({
					content: "An error occurred while checking if the deck exists.",
					flags: MessageFlags.Ephemeral,
				});
				return;
			}

			if (bool) {
				isOwner(interaction.user.id, deck, (err, bool) => {
					if (err) {
						console.error(err);
						interaction.reply({
							content: "An error occurred while checking the deck owner.",
							flags: MessageFlags.Ephemeral,
						});
						return;
					}
					if (bool) {
						help(deck);
					} else {
						interaction.reply({
							content: "You are not the owner of this deck.",
							flags: MessageFlags.Ephemeral,
						});
					}
				});
			} else {
				help2(deck);
			}
		});
	} else {
		help2(deck);
	}
}

module.exports = {
	callback,
};
