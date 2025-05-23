"use strict";

const { SlashCommandBuilder, MessageFlags } = require("discord.js");
const db = require("../database/decks.js");
const { sessions, getKey, ask } = require("../utils/learn.js");
const { pickWeightedRandom } = require("../utils/database.js");

function startSession(deck, card_ids, interval, user, lastCardId) {
	const userId = user.id;
	sessions.set(getKey(userId, deck), [
		interval,
		null,
		setInterval(() => ask(deck, card_ids, user), interval * 60000),
		null,
		lastCardId,
	]);

	if (lastCardId) {
		user.send({
			content: `**${deck}** session: resumed with an interval of **${interval}** minute${
				interval > 1 ? "s" : ""
			}.`,
			flags: MessageFlags.Ephemeral,
		});
	}

	ask(deck, card_ids, user);
}

async function callback(interaction, deck) {
	const userId = interaction.user.id;
	const stop = interaction.options.getBoolean("stop");
	const pause = interaction.options.getInteger("pause");
	const interval = interaction.options.getInteger("interval");
	let count = interaction.options.getInteger("count");

	if (Number.isInteger(count)) {
		if (count <= 1) {
			interaction.reply({
				content: `**Count** must be at least 2.`,
				flags: MessageFlags.Ephemeral,
			});
			return;
		}
	} else {
		count = 0;
	}

	if (stop) {
		if (sessions.has(getKey(userId, deck))) {
			const [oldInterval, pauseTimeoutId, intervalId, timeoutId, _] = sessions.get(getKey(userId, deck));
			if (pauseTimeoutId) clearTimeout(pauseTimeoutId);
			if (intervalId) clearInterval(intervalId);
			if (timeoutId) clearTimeout(intervalId);
			sessions.delete(getKey(userId, deck));
			interaction.reply({
				content: `Stopped your${oldInterval === 0 ? " active" : ""} learning session for **${deck}**.`,
				flags: MessageFlags.Ephemeral,
			});
		} else {
			interaction.reply({
				content: `No active learning session to stop for **${deck}**.`,
				flags: MessageFlags.Ephemeral,
			});
		}
		return;
	}

	const user = await interaction.client.users.fetch(userId);

	function help(card_ids) {
		if (pause) {
			if (!sessions.has(getKey(userId, deck))) {
				interaction.reply({
					content: `No active session to pause for **${deck}**.`,
					flags: MessageFlags.Ephemeral,
				});
				return;
			}
			const [oldInterval, pauseTimeoutId, intervalId, timeoutId, lastCardId] = sessions.get(getKey(userId, deck));
			let resumeCallback;
			let content = `Renewed your pause for **${deck}** to **${pause}** minute${pause > 1 ? "s" : ""}.`;
			if (oldInterval === 0) {
				resumeCallback = () => {
					sessions.set(getKey(userId, deck), [oldInterval, null, null, null, lastCardId]);
					user.send({
						content: `**${deck}** session: resumed the active session.`,
						flags: MessageFlags.Ephemeral,
					});
					ask(deck, card_ids, user);
				};
				if (pauseTimeoutId) {
					clearTimeout(pauseTimeoutId);
				} else {
					clearTimeout(timeoutId);
					content = `Paused your active session for **${pause}** minute${
						pause > 1 ? "s" : ""
					} for **${deck}**.`;
				}
			} else {
				resumeCallback = () => startSession(deck, card_ids, oldInterval, user, lastCardId);
				if (pauseTimeoutId) {
					clearTimeout(pauseTimeoutId);
				} else {
					clearInterval(intervalId);
					content = `Paused your session for **${pause}** minute${pause > 1 ? "s" : ""} for **${deck}**.`;
				}
			}
			sessions.set(getKey(userId, deck), [
				oldInterval,
				setTimeout(resumeCallback, pause * 60000),
				null,
				null,
				lastCardId,
			]);
			interaction.reply({
				content,
				flags: MessageFlags.Ephemeral,
			});

			return;
		}

		let lastCardId = "";

		if (sessions.has(getKey(userId, deck))) {
			const [_, pauseTimeoutId, intervalId, timeoutId, oldLastCardId] = sessions.get(getKey(userId, deck));
			if (pauseTimeoutId) clearTimeout(pauseTimeoutId);
			if (intervalId) clearInterval(intervalId);
			if (timeoutId) clearTimeout(timeoutId);
			lastCardId = oldLastCardId;
		}

		if (interval === 0) {
			sessions.set(getKey(userId, deck), [0, null, null, null, lastCardId]);
			ask(deck, card_ids, user);
			interaction.reply({
				content: `Started an active learning session for **${deck}**.`,
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		if (!interval) {
			interaction.reply({ content: "Interval is required unless stopping.", flags: MessageFlags.Ephemeral });
			return;
		}

		startSession(deck, card_ids, interval, user, lastCardId);

		interaction.reply({
			content: `Started a learning session every **${interval}** minute${
				interval > 1 ? "s" : ""
			} for **${deck}**.`,
			flags: MessageFlags.Ephemeral,
		});
	}

	if (count === 0) {
		help([]);
	} else {
		db.getAllCards(interaction, deck, (cards) =>
			help(pickWeightedRandom(cards, userId, count).map((card) => card.id.toString()))
		);
	}
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
					{ name: "1分", value: 1 },
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
		.addIntegerOption((opt) =>
			opt.setName("count").setDescription("How many cards to be quizzed for.").setRequired(false)
		)
		.addStringOption((opt) => opt.setName("deck").setDescription("The deck name").setRequired(false)),
	callback,
};
