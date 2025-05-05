"use strict";

const { SlashCommandBuilder, MessageFlags } = require("discord.js");
const db = require("../database/decks.js");
const { getTargetUser } = require("../utils/decks.js");

async function callback(interaction, deck) {
	const target = await getTargetUser(interaction);
	if (!target) return;
	db.removeOwner(interaction, target.id, deck, (response) => {
		if (response.changes === 0) {
			interaction.reply({
				content: `**${target.globalName}** never had ownership of **${deck}**.`,
				flags: MessageFlags.Ephemeral,
			});
		} else {
			interaction.reply({
				content: `**${target.globalName}** no longer has ownership of **${deck}**.`,
				flags: MessageFlags.Ephemeral,
			});
		}
	});
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName(__filename.split("/").pop().replace(".js", ""))
		.setDescription("Removes someone else's access to one of your decks.")
		.addUserOption((opt) =>
			opt.setName("friend").setDescription("The user to revoke a deck from").setRequired(false)
		)
		.addStringOption((opt) =>
			opt.setName("id").setDescription("The user ID to revoke a deck from").setRequired(false)
		)
		.addStringOption((opt) =>
			opt.setName("deck").setDescription("The name of the deck to revoke").setRequired(false)
		),
	callback,
};
