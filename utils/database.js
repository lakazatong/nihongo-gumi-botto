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

function getUserScore(score, userId) {
	const scores = score.split(",");
	let userScore = 0;

	scores.forEach((entry) => {
		const [id, scoreValue] = entry.split(":");
		if (id === userId) {
			userScore = parseInt(scoreValue);
		}
	});

	return userScore;
}

module.exports = {
	isOk,
	getUserScore,
};
