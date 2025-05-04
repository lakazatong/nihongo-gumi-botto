"use strict";

const { SlashCommandBuilder, MessageFlags, ActionRowBuilder } = require("discord.js");
const db = require("../database/decks.js");
const { getCorrectButton } = require("../buttons/correct.js");
const { getIncorrectButton } = require("../buttons/incorrect.js");
const { buildContent } = require("../utils/decks.js");

const sessions = new Map();

function getKey(id, deck) {
	return `${id}_${deck}`;
}

function startSession(deck, interval, user, resume) {
	function ask() {
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
			if (owner_id !== user.id) {
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
						content: buildContent(row),
						components: [],
					});
				}, 30000);

				const buttons = new ActionRowBuilder().addComponents(
					getCorrectButton().setCustomId(`correct_${row.id}_${timeoutId}`),
					getIncorrectButton().setCustomId(`incorrect_${row.id}_${timeoutId}`)
				);

				message = await user.send({
					content: buildContent(row),
					components: [buttons],
				});
			});
		});
	}

	sessions.set(getKey(user.id, deck), [interval, setInterval(ask, interval * 60000)]);

	if (resume) {
		user.send({
			content: `Resumed your learning session every ${interval} minutes using deck ${deck}.`,
			flags: MessageFlags.Ephemeral,
		});
	}

	ask();
}

async function callback(interaction, deck) {
	const userId = interaction.user.id;
	const stop = interaction.options.getBoolean("stop");
	const pause = interaction.options.getInteger("pause");
	const interval = interaction.options.getInteger("interval");

	if (stop) {
		if (sessions.has(getKey(userId, deck))) {
			const [_, intervalId] = sessions.get(getKey(userId, deck));
			clearInterval(intervalId);
			sessions.delete(getKey(userId, deck));
			interaction.reply({
				content: `Stopped your learning session for the deck ${deck}.`,
				flags: MessageFlags.Ephemeral,
			});
		} else {
			interaction.reply({
				content: `No active learning session to stop for the deck ${deck}.`,
				flags: MessageFlags.Ephemeral,
			});
		}
		return;
	}

	const user = await interaction.client.users.fetch(userId);

	if (pause) {
		if (!sessions.has(getKey(userId, deck))) {
			interaction.reply({
				content: `No active session to pause for the deck ${deck}.`,
				flags: MessageFlags.Ephemeral,
			});
			return;
		}
		const [oldInterval, intervalId] = sessions.get(getKey(userId, deck));
		clearInterval(intervalId);
		sessions.delete(getKey(userId, deck));
		interaction.reply({
			content: `Paused your session for ${pause} minutes for the deck ${deck}.`,
			flags: MessageFlags.Ephemeral,
		});
		setTimeout(() => {
			startSession(deck, oldInterval, user, true);
		}, pause * 60000);
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

	if (sessions.has(getKey(userId, deck))) {
		const [_, intervalId] = sessions.get(getKey(userId, deck));
		clearInterval(intervalId);
	}

	startSession(deck, interval, user, false);

	interaction.reply({
		content: `Started a learning session every ${interval} minutes using deck ${deck}.`,
		flags: MessageFlags.Ephemeral,
	});
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName(__filename.split("/").pop().replace(".js", ""))
		.setDescription("Periodically quizzes you with a random card from a deck or some decks.")
		.addBooleanOption((opt) =>
			opt.setName("stop").setDescription("Stops the current learning session").setRequired(false)
		)
		.addIntegerOption((opt) =>
			opt
				.setName("pause")
				.setDescription("Pauses the current learning session")
				.setRequired(false)
				.addChoices([
					{ name: "15分", value: 15 },
					{ name: "1時間", value: 60 },
					{ name: "3時間", value: 60 * 3 },
					{ name: "8時間", value: 60 * 8 },
					{ name: "24時間", value: 60 * 24 },
				])
		)
		.addIntegerOption((opt) =>
			opt.setName("interval").setDescription("Interval in minutes between quizzes").setRequired(false)
		)
		.addStringOption((opt) => opt.setName("deck").setDescription("The deck name").setRequired(false)),
	callback,
};
