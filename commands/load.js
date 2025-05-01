"use strict";

const { MessageFlags } = require("discord.js");
const fs = require("fs");
const axios = require("axios");
const { saveCardsToJson } = require("../utils/anki_parser.js");
const { kanjis_db } = require("../database/kanjis.js");
const { getOwner, getDefaultDeck } = require("../database/decks.js");

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
					flags: MessageFlags.Ephemeral,
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
				content: `All kanjis of ${filename} were successfully loaded into the deck ${deck}!`,
			});
		} catch (err) {
			console.error(err);
			await interaction.editReply({
				content: "An error occurred while getting the file.",
				flags: MessageFlags.Ephemeral,
			});
		}
	}

	function help2(deck) {
		getOwner(deck, (err, owner_id) => {
			if (err) {
				console.error(err);
				interaction.editReply({
					content: "An error occurred while getting the deck owner.",
					flags: MessageFlags.Ephemeral,
				});
				return;
			}

			if (owner_id === null) {
				setOwner(userId, deck);
				help(deck);
			} else if (owner_id === userId) {
				help(deck);
			} else {
				interaction.reply({
					content: "You are not the owner of this deck.",
					flags: MessageFlags.Ephemeral,
				});
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
				interaction.editReply({
					content: "An error occurred while fetching the default deck.",
					flags: MessageFlags.Ephemeral,
				});
				return;
			}
			if (deck) {
				help2(deck);
			} else {
				interaction.editReply({
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
