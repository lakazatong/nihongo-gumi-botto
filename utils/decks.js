"use strict";

const { MessageFlags } = require("discord.js");
const db = require("../database/decks.js");

function withDeck(interaction, ownerCallback, noOwnerCallback) {
	const userId = interaction.user.id;
	const deck = interaction.options.getString("deck") || null;

	function help(deck) {
		db.getOwners(interaction, deck, (owner_ids) => {
			if (owner_ids.length === 0) {
				noOwnerCallback(deck);
			} else if (owner_ids.includes(userId)) {
				ownerCallback(deck);
			} else {
				interaction.reply({
					content: `You are not the owner of **${deck}**.`,
					flags: MessageFlags.Ephemeral,
				});
			}
		});
	}

	if (deck) {
		help(deck);
	} else {
		db.getDefaultDeck(interaction, userId, (defaultDeck) => {
			if (defaultDeck) {
				help(defaultDeck);
			} else {
				interaction.reply({
					content: "No deck was given and no default deck was set.",
					flags: MessageFlags.Ephemeral,
				});
			}
		});
	}
}

function buildContent(card, spoiler = true) {
	const s = spoiler ? "||" : "";
	const lines = [`${card.kanji}`, `${s}${card.reading}${s}`];

	lines.push(
		`### Meanings\n${s}${card.meanings
			.split(";")
			.map((entry) => {
				const [category, values] = entry.split(":");
				if (!values) return `- ${category}`;
				const items = values
					.split(",")
					.map((v) => `- ${v}`)
					.join("\n");
				return `${category}:\n${items}`;
			})
			.join("\n")}${s}`
	);

	if (card.forms) {
		const forms = card.forms
			.split(",")
			.map((f) => `- ${f}`)
			.join("\n");
		lines.push(`### Forms\n${s}${forms}${s}`);
	}

	if (card.example) lines.push(`### Example\n${s}${card.example}${s}`);

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
	withDeck,
	buildContent,
	getTargetUser,
};
