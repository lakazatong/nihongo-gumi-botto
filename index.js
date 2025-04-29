"use strict";

const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, Partials } = require("discord.js");

require("dotenv").config();

require("./database/kanjis.js");
require("./database/aliases.js");

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

const commands = [
	new SlashCommandBuilder().setName("ping").setDescription("Replies with Pong!"),
	new SlashCommandBuilder().setName("ask").setDescription("Fetches a random kanji from the database."),
	new SlashCommandBuilder()
		.setName("save")
		.setDescription("Saves a new kanji to the database.")
		.addStringOption((option) =>
			option.setName("kanji").setDescription("The kanjis representation").setRequired(true)
		)
		.addStringOption((option) => option.setName("reading").setDescription("The reading writing").setRequired(true))
		.addStringOption((option) => option.setName("meanings").setDescription("The meanings").setRequired(true))
		.addStringOption((option) =>
			option.setName("sentence").setDescription("The sentence it was found in if any").setRequired(false)
		),
	new SlashCommandBuilder()
		.setName("load")
		.setDescription("Loads your anki's exported kanjis.")
		.addAttachmentOption((option) => option.setName("file").setDescription("The file to load").setRequired(true)),
].map((command) => command.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

(async () => {
	try {
		console.log("Started refreshing application (/) commands.");

		await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), {
			body: commands,
		});

		console.log("Successfully reloaded application (/) commands.");
	} catch (error) {
		console.error(error);
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
