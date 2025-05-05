const { SlashCommandBuilder, MessageFlags } = require("discord.js");
const db = require("../database/decks.js");

function callback(interaction) {
	db.getAllDeckStats(interaction, interaction.user.id, (stats) => {
		if (!stats.length) {
			interaction.reply({
				content: "You don't have any decks.",
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		stats.sort((a, b) => (b.count || 0) - (a.count || 0));

		let replyContent = "name (card count, total score, average score):\n";
		let currentLength = replyContent.length;

		for (let i = 0; i < stats.length; i++) {
			const deckStat = stats[i];
			const deckInfo =
				`${deckStat.deck} ` +
				(deckStat
					? `(${deckStat.count || 0}, ${deckStat.total || 0}, ${deckStat.average?.toFixed(2) || 0})`
					: "(error)") +
				"\n";

			if (currentLength + deckInfo.length <= 2000) {
				replyContent += deckInfo;
				currentLength += deckInfo.length;
			} else {
				break;
			}
		}

		interaction.reply({
			content: replyContent,
			flags: MessageFlags.Ephemeral,
		});
	});
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName(__filename.split("/").pop().replace(".js", ""))
		.setDescription("Lists all your decks and their statistics."),
	callback,
};
