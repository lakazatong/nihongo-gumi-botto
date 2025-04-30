"use strict";

const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, Partials } = require("discord.js");

require("dotenv").config();

// long requires
require("./database/kanjis.js");
require("./database/decks.js");
require("./utils/anki_parser.js");

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.GuildModeration,
		GatewayIntentBits.GuildExpressions,
		GatewayIntentBits.GuildIntegrations,
		GatewayIntentBits.GuildWebhooks,
		GatewayIntentBits.GuildInvites,
		GatewayIntentBits.GuildVoiceStates,
		GatewayIntentBits.GuildPresences,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.GuildMessageReactions,
		GatewayIntentBits.GuildMessageTyping,
		GatewayIntentBits.DirectMessages,
		GatewayIntentBits.DirectMessageReactions,
		GatewayIntentBits.DirectMessageTyping,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildScheduledEvents,
		GatewayIntentBits.AutoModerationConfiguration,
		GatewayIntentBits.AutoModerationExecution,
		GatewayIntentBits.GuildMessagePolls,
		GatewayIntentBits.DirectMessagePolls,
	],
	partials: [
		Partials.User,
		Partials.Channel,
		Partials.GuildMember,
		Partials.Message,
		Partials.Reaction,
		Partials.GuildScheduledEvent,
		Partials.ThreadMember,
		Partials.SoundboardSound,
	],
});

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

(async () => {
	try {
		await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), {
			body: [
				new SlashCommandBuilder().setName("ping").setDescription("Replies with Pong!"),
				new SlashCommandBuilder()
					.setName("ask")
					.setDescription("Quizzes you with a random card from the deck.")
					.addStringOption((option) =>
						option.setName("deck").setDescription("The deck name").setRequired(false)
					),
				new SlashCommandBuilder()
					.setName("save")
					.setDescription("Saves a new card to the deck.")
					.addStringOption((option) =>
						option.setName("kanji").setDescription("The kanjis writing").setRequired(true)
					)
					.addStringOption((option) =>
						option.setName("reading").setDescription("The kana writing").setRequired(true)
					)
					.addStringOption((option) =>
						option.setName("meanings").setDescription("The meanings").setRequired(true)
					)
					.addStringOption((option) =>
						option.setName("sentence").setDescription("The sentence it was found in").setRequired(false)
					)
					.addStringOption((option) =>
						option.setName("deck").setDescription("The deck name").setRequired(false)
					),
				new SlashCommandBuilder()
					.setName("load")
					.setDescription("Loads your anki's exported file in the deck.")
					.addAttachmentOption((option) =>
						option.setName("file").setDescription("The file to load").setRequired(true)
					)
					.addStringOption((option) =>
						option.setName("deck").setDescription("The deck name").setRequired(false)
					),
				new SlashCommandBuilder()
					.setName("default")
					.setDescription("Changes your default deck.")
					.addStringOption((option) =>
						option.setName("deck").setDescription("The default deck name").setRequired(true)
					),
			].map((command) => command.toJSON()),
		});

		console.log("Slash commands online.");
	} catch (err) {
		console.error(err);
	}
})();

client.once("ready", () => {
	console.log(`Logged in as ${client.user.tag}!`);
});

client.on("interactionCreate", async (interaction) => {
	if (interaction.isCommand()) {
		const { commandName } = interaction;
		const mod = require("./commands/" + commandName + ".js");
		if (mod) mod.callback(interaction);
	} else if (interaction.isButton()) {
		const [action, _] = interaction.customId.split("_");
		const mod = require("./buttons/" + action + ".js");
		if (mod) mod.callback(interaction);
	}
});

client.login(process.env.DISCORD_TOKEN);
