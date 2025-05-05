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
	const userId = user.id;
	function ask() {
		db.getOwners(interaction, deck, (owner_ids) => {
			if (owner_ids.length === 0) {
				user.send({
					content: `**${deck}** session: the deck doesn't exist anymore.`,
					flags: MessageFlags.Ephemeral,
				});
				return;
			}
			if (!owner_ids.includes(userId)) {
				user.send({
					content: `**${deck}** session: You are not the owner anymore.`,
					flags: MessageFlags.Ephemeral,
				});
				return;
			}
			db.getRandomCard(interaction, deck, userId, (card) => {
				if (!card) {
					user.send({
						content: `**${deck}** session: the deck is now empty.`,
						flags: MessageFlags.Ephemeral,
					});
					return;
				}

				let message;

				const timeoutId = setTimeout(
					() =>
						message.edit({
							content: buildContent(card, false),
							flags: MessageFlags.Ephemeral,
							components: [],
						}),
					30000
				);

				const buttons = new ActionRowBuilder().addComponents(
					getCorrectButton().setCustomId(`correct_${deck}_${card.id}_${timeoutId}`),
					getIncorrectButton().setCustomId(`incorrect_${deck}_${card.id}_${timeoutId}`)
				);

				message = user.send({
					content: buildContent(card),
					flags: MessageFlags.Ephemeral,
					components: [buttons],
				});
			});
		});
	}

	sessions.set(getKey(userId, deck), [interval, setInterval(ask, interval * 60000)]);

	if (resume) {
		user.send({
			content: `**${deck}** session: resumed with an interval of **${interval}** minutes.`,
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
				content: `Stopped your learning session for **${deck}**.`,
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

	if (pause) {
		if (!sessions.has(getKey(userId, deck))) {
			interaction.reply({
				content: `No active session to pause for **${deck}**.`,
				flags: MessageFlags.Ephemeral,
			});
			return;
		}
		const [oldInterval, intervalId] = sessions.get(getKey(userId, deck));
		clearInterval(intervalId);
		sessions.delete(getKey(userId, deck));
		interaction.reply({
			content: `Paused your session for **${pause}** minutes for **${deck}**.`,
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
		content: `Started a learning session every **${interval}** minutes for **${deck}**.`,
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
