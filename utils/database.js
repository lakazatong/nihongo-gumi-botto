"use strict";

const { MessageFlags } = require("discord.js");

function isOk(interaction, err) {
	if (err) {
		interaction.reply({
			content: err?.message || "An error occurred with sqlite.",
			flags: MessageFlags.Ephemeral,
		});
		return false;
	}
	return true;
}

function getUserScore(score, userIdRaw) {
	const userId = userIdRaw.toString();
	const scores = score.split(",");
	let userScore = 0;

	scores.forEach((entry) => {
		const [id, scoreValue] = entry.split(":");
		if (id === userId) userScore = parseInt(scoreValue);
	});

	return userScore;
}

function pickWeightedRandom(cards, userId, count = 1) {
	let total = 0;
	let weights = cards.map((c) => {
		let w = 1 / (getUserScore(c.score, userId) + 1);
		total += w;
		return w;
	});

	let draws = [];
	let remaining = cards.map((c, i) => ({ card: c, weight: weights[i] }));

	for (let i = 0; i < count; i++) {
		let r = Math.random() * total;
		let acc = 0;
		for (let j = 0; j < remaining.length; j++) {
			acc += remaining[j].weight;
			if (acc >= r) {
				draws.push(remaining[j].card);
				total -= remaining[j].weight;
				remaining.splice(j, 1);
				break;
			}
		}
	}

	return draws;
}

module.exports = {
	isOk,
	getUserScore,
	pickWeightedRandom,
};
