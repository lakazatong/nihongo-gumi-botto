"use strict";

const { MessageFlags } = require("discord.js");
const db = require("../database/decks.js");

function checkDeckOwnership(interaction, callback) {
	function help2(deck) {
		db.isOwner(interaction, interaction.user.id, deck, (bool) => {
			if (bool === null) {
				interaction.reply({
					content: "The deck does not exist.",
					flags: MessageFlags.Ephemeral,
				});
			} else if (bool === false) {
				interaction.reply({
					content: "You are not the owner of this deck.",
					flags: MessageFlags.Ephemeral,
				});
			} else {
				callback(deck);
			}
		});
	}

	const deck = interaction.options.getString("deck") || null;

	if (deck) {
		help2(deck);
	} else {
		db.getDefaultDeck(interaction, interaction.user.id, (deck) => {
			if (deck) {
				help2(deck);
			} else {
				interaction.reply({
					content: "No deck was given and no default deck was set.",
					flags: MessageFlags.Ephemeral,
				});
			}
		});
	}
}

function checkOrCreateDeckOwnership(interaction, callback) {
	function help2(deck) {
		db.isOwner(interaction, interaction.user.id, deck, (bool) => {
			if (bool === null) {
				db.addOwner(interaction, interaction.user.id, deck);
				callback(deck);
			} else if (bool === false) {
				interaction.reply({
					content: "You are not the owner of this deck.",
					flags: MessageFlags.Ephemeral,
				});
			} else {
				callback(deck);
			}
		});
	}

	const deck = interaction.options.getString("deck") || null;

	if (deck) {
		help2(deck);
	} else {
		db.getDefaultDeck(interaction, interaction.user.id, (deck) => {
			if (deck) {
				help2(deck);
			} else {
				interaction.reply({
					content: "No deck was given and no default deck was set.",
					flags: MessageFlags.Ephemeral,
				});
			}
		});
	}
}

function buildContent(row, spoiler = true) {
	const s = spoiler ? "||" : "";
	const lines = [`${row.kanji}`, `${s}${row.reading}${s}`];

	lines.push(
		`### Meanings\n${s}${row.meanings
			.split(";")
			.map((entry) => {
				const [category, values] = entry.split(":");
				const items = values
					.split(",")
					.map((v) => `- ${v}`)
					.join("\n");
				return `${category}:\n${items}`;
			})
			.join("\n")}${s}`
	);

	if (row.forms) {
		const forms = row.forms
			.split(",")
			.map((f) => `- ${f}`)
			.join("\n");
		lines.push(`### Forms\n${s}${forms}${s}`);
	}

	if (row.example) lines.push(`### Example\n${s}${row.example}${s}`);

	return lines.join("\n");
}

async function getTargetUser(interaction) {
	const friend = interaction.options.getUser("friend");
	const friendId = interaction.options.getString("id");

	if (friend && friendId) {
		await interaction.reply({
			content: "You can only provide either a friend or an ID, not both.",
			flags: MessageFlags.Ephemeral,
		});
		return null;
	}

	if (!friend && !friendId) {
		await interaction.reply({
			content: "You must provide either a friend or an ID.",
			flags: MessageFlags.Ephemeral,
		});
		return null;
	}

	if (friendId && !/^\d{18}$/.test(friendId)) {
		await interaction.reply({
			content: "The user ID must be exactly 18 digits long.",
			flags: MessageFlags.Ephemeral,
		});
		return null;
	}

	const target = friend || (await interaction.client.users.fetch(friendId));
	return target;
}

module.exports = {
	checkDeckOwnership,
	checkOrCreateDeckOwnership,
	buildContent,
	getTargetUser,
};
