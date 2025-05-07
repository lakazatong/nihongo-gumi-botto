"use strict";

const { ActionRowBuilder, MessageFlags } = require("discord.js");
const db = require("../database/decks.js");
const { getCorrectButton, getIncorrectButton } = require("../utils/buttons.js");
const { pickWeightedRandom } = require("./database.js");
const { buildContent } = require("./decks.js");

const sessions = new Map();

function getKey(id, deck) {
	return `${id}_${deck}`;
}

function ask(deck, card_ids, user, active) {
	const userId = user.id;
	const sess = sessions.get(getKey(userId, deck));
	// if active and stopped or paused, kill the active lesson
	if (active && (!sess || sess[1])) return;
	db.db.all(`SELECT user_id FROM owners WHERE deck = ?`, [deck], (err, rows) => {
		if (err) {
			user.send({
				content: `**${deck}** session: ` + (err?.message || `an error occurred with sqlite.`),
			});
			return;
		}

		const owner_ids = rows?.map((row) => row.user_id) || [];

		if (owner_ids.length === 0) {
			user.send({
				content: `**${deck}** session: the deck doesn't exist anymore.`,
			});
			if (active) sessions.delete(getKey(userId, deck));
			return;
		}

		if (!owner_ids.includes(userId)) {
			user.send({
				content: `**${deck}** session: You are not the owner anymore.`,
			});
			if (active) sessions.delete(getKey(userId, deck));
			return;
		}

		async function help(card) {
			if (!card) {
				user.send({
					content: `**${deck}** session: the deck is now empty.`,
				});
				if (active) sessions.delete(getKey(userId, deck));
				return;
			}

			let message;

			const timeoutId = setTimeout(() => {
				message.edit({
					content: buildContent(card, false),
					components: [],
				});
				if (active) ask(deck, card_ids, user, true);
			}, 30000);

			if (sess) sessions.set(getKey(userId, deck), [sess[0], sess[1], sess[2], timeoutId]);

			const buttons = new ActionRowBuilder().addComponents(
				getCorrectButton().setCustomId(
					`correct_${deck}_${card_ids.join(",")}_${card.id}_${timeoutId}_${active ? "true" : "false"}`
				),
				getIncorrectButton().setCustomId(
					`incorrect_${deck}_${card_ids.join(",")}_${card.id}_${timeoutId}_${active ? "true" : "false"}`
				)
			);

			message = await user.send({
				content: buildContent(card),
				components: [buttons],
			});
		}

		db.db.all(`SELECT * FROM ${deck}`, [], (err, cards) => {
			if (err) {
				user.send({
					content: `**${deck}** session: ` + (err?.message || `an error occurred with sqlite.`),
				});
				if (active) sessions.delete(getKey(userId, deck));
				return;
			}

			help(
				!cards || cards.length === 0
					? null
					: pickWeightedRandom(
							card_ids.length === 0
								? cards
								: cards.filter((card) => card_ids.includes(card.id.toString())),
							userId
					  )[0]
			);
		});
	});
}

module.exports = {
	sessions,
	getKey,
	ask,
};
