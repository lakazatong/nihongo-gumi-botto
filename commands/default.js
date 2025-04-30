"use strict";

const { MessageFlags } = require("discord.js");
const { updateDeck, getDeck } = require("../database/decks.js");

async function callback(interaction) {
	const userId = interaction.user.id;
	const newDeck = interaction.options.getString("deck");

	getDeck(userId, async (err, row) => {
		if (err) {
			console.error(err);
			interaction.reply({
				content: "An error occurred while fetching the deck.",
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		if (row) {
			updateDeck(userId, newDeck);
		} else {
			await interaction.reply({
				content: "You don't have a deck yet. Please create one first.",
				flags: MessageFlags.Ephemeral,
			});
			return;
		}
	});

	decks_db.run("UPDATE decks SET deck = ? WHERE user_id = ?", [newDeck, userId], async (err) => {
		if (err) {
			console.error(err);
			return;
		}

		decks_db.run(`INSERT INTO decks (user_id, deck) VALUES (?, ?)`, [userId, defaultDeck], function (err) {
			if (err) {
				callback(err);
				return;
			}
			decks_db.run(`INSERT INTO owners (user_id, deck) VALUES (?, ?)`, [userId, defaultDeck], function (err) {
				if (err) {
					callback(err);
					return;
				}
				callback(null, defaultDeck);
			});
		});

		await interaction.reply({
			content: `Successfully updated your deck to: ${newDeck}`,
			flags: MessageFlags.Ephemeral,
		});
	});
}

module.exports = {
	callback,
};
