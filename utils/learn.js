"use strict";

const { ActionRowBuilder, MessageFlags } = require("discord.js");
const db = require("../database/decks.js");
const { getCorrectButton } = require("../buttons/correct.js");
const { getIncorrectButton } = require("../buttons/incorrect.js");
const { getUserScore } = require("./database.js");
const { buildContent } = require("./decks.js");

const sessions = new Map();

function getKey(id, deck) {
	return `${id}_${deck}`;
}

function ask(deck, user, active) {
	const userId = user.id;
	// if active and stopped or paused, kill the active lesson
	if (active && (!sessions.has(getKey(userId, deck)) || sessions.get(getKey(userId, deck))[0])) return;
	db.db.all(`SELECT user_id FROM owners WHERE deck = ?`, [deck], (err, cards) => {
		if (err) {
			user.send({
				content: `**${deck}** session: ` + (err?.message || `an error occurred with sqlite.`),
			});
			return;
		}

		const owner_ids = cards?.map((row) => row.user_id) || [];

		if (owner_ids.length === 0) {
			user.send({
				content: `**${deck}** session: the deck doesn't exist anymore.`,
			});
			return;
		}

		if (!owner_ids.includes(userId)) {
			user.send({
				content: `**${deck}** session: You are not the owner anymore.`,
			});
			return;
		}

		function help(card) {
			if (!card) {
				user.send({
					content: `**${deck}** session: the deck is now empty.`,
				});
				return;
			}

			let message;

			const timeoutId = setTimeout(() => {
				message.edit({
					content: buildContent(card, false),
					components: [],
				});
				if (active) ask(deck, user, true);
			}, 30000);

			const buttons = new ActionRowBuilder().addComponents(
				getCorrectButton().setCustomId(`correct_${deck}_${card.id}_${timeoutId}_${active}`),
				getIncorrectButton().setCustomId(`incorrect_${deck}_${card.id}_${timeoutId}_${active}`)
			);

			message = user.send({
				content: buildContent(card),
				components: [buttons],
			});
		}

		db.db.all(`SELECT * FROM ${deck}`, [], (err, cards) => {
			if (err) {
				user.send({
					content: `**${deck}** session: ` + (err?.message || `an error occurred with sqlite.`),
				});
				return;
			}

			if (!cards || cards.length === 0) {
				help();
				return;
			}

			const weights = cards.map((card) => {
				const userScore = getUserScore(card.score, userId);
				return 1 / (userScore + 1);
			});

			const totalWeight = weights.reduce((a, b) => a + b, 0);
			const thresholds = [];
			let acc = 0;

			for (let w of weights) {
				acc += w / totalWeight;
				thresholds.push(acc);
			}

			const r = Math.random();
			const index = thresholds.findIndex((t) => r <= t);
			help(cards[index]);
		});
	});
}

module.exports = {
	sessions,
	getKey,
	ask,
};
