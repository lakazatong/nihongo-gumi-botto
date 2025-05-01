"use strict";

const { MessageFlags, ActionRowBuilder } = require("discord.js");
const db = require("../database/decks.js");
const { getCorrectButton } = require("../buttons/correct.js");
const { getIncorrectButton } = require("../buttons/incorrect.js");

const sessions = new Map();

async function callback(interaction, deck) {
	const userId = interaction.user.id;
	const stop = interaction.options.getBoolean("stop");
	const interval = interaction.options.getInteger("interval");

	if (stop) {
		if (sessions.has(userId)) {
			clearInterval(sessions.get(userId));
			sessions.delete(userId);
			interaction.reply({ content: "Stopped your learning session.", flags: MessageFlags.Ephemeral });
		} else {
			interaction.reply({ content: "No active learning session to stop.", flags: MessageFlags.Ephemeral });
		}
		return;
	}

	if (interval === 0) {
		interaction.reply({ content: "Interval cannot be 0.", flags: MessageFlags.Ephemeral });
		return;
	}

	if (!interval) {
		interaction.reply({ content: "Interval is required unless stopping.", flags: MessageFlags.Ephemeral });
		return;
	}

	if (sessions.has(userId)) {
		clearInterval(sessions.get(userId));
	}

	const user = await interaction.client.users.fetch(userId);

	sessions.set(
		userId,
		setInterval(() => {
			db.db.get(`SELECT * FROM owners WHERE deck = ?`, [deck], (err, row) => {
				if (err) {
					console.error("get", err);
					user.send({
						content: "Session: An error occurred with sqlite.",
						flags: MessageFlags.Ephemeral,
					});
					return;
				}
				const owner_id = row?.user_id || null;
				if (owner_id === null) {
					user.send({
						content: "Session: The deck does not exist anymore.",
						flags: MessageFlags.Ephemeral,
					});
					return;
				}
				if (owner_id !== userId) {
					user.send({
						content: "Session: You are not the owner of this deck anymore.",
						flags: MessageFlags.Ephemeral,
					});
					return;
				}
				db.db.get("SELECT * FROM decks WHERE deck = ? ORDER BY RANDOM() LIMIT 1", [deck], async (err, row) => {
					if (err) {
						console.error("get", err);
						user.send({
							content: "Session: An error occurred with sqlite.",
							flags: MessageFlags.Ephemeral,
						});
						return;
					}

					if (!row) {
						user.send({
							content: "Session: Empty deck.",
							flags: MessageFlags.Ephemeral,
						});
						return;
					}

					let message;

					const timeoutId = setTimeout(() => {
						message.edit({
							content: row.sentence
								? `${row.kanji}\n${row.reading}\n${row.meanings}\n${row.sentence}`
								: `${row.kanji}\n${row.reading}\n${row.meanings}`,
							components: [],
						});
					}, 30000);

					const buttons = new ActionRowBuilder().addComponents(
						getCorrectButton().setCustomId(`correct_${row.id}_${timeoutId}`),
						getIncorrectButton().setCustomId(`incorrect_${row.id}_${timeoutId}`)
					);

					message = await user.send({
						content: row.sentence
							? `${row.kanji}\n||${row.reading}||\n||${row.meanings}||\n||${row.sentence}||`
							: `${row.kanji}\n||${row.reading}||\n||${row.meanings}||`,
						components: [buttons],
					});
				});
			});
		}, interval * 60000)
	);

	interaction.reply({
		content: `Started learning every ${interval} minutes using deck "${deck}".`,
		flags: MessageFlags.Ephemeral,
	});
}

module.exports = callback;
