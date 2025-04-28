'use strict';

const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, Partials, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const sqlite3 = require('sqlite3').verbose();
const axios = require('axios');
const fs = require('fs');
require('dotenv').config();

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
        GatewayIntentBits.DirectMessagePolls
    ], partials: [
        Partials.User,
        Partials.Channel,
        Partials.GuildMember,
        Partials.Message,
        Partials.Reaction,
        Partials.GuildScheduledEvent,
        Partials.ThreadMember,
        Partials.SoundboardSound
    ]
});

const db = new sqlite3.Database('./kanjis.db', (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        db.run(`
            CREATE TABLE IF NOT EXISTS kanjis (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                kanji TEXT NOT NULL,
                reading TEXT NOT NULL,
                meanings TEXT NOT NULL,
                sentence TEXT,
                score INTEGER DEFAULT 0
            )
        `);
    }
});

const commands = [
    new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Replies with Pong!'),
    new SlashCommandBuilder()
        .setName('ask')
        .setDescription('Fetches a random kanji from the database.'),
    new SlashCommandBuilder()
        .setName('save')
        .setDescription('Saves a new kanji to the database.')
        .addStringOption(option =>
            option.setName('kanji')
                .setDescription('The kanjis representation')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reading')
                .setDescription('The reading writing')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('meanings')
                .setDescription('The meanings')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('sentence')
                .setDescription('The sentence it was found in if any')
                .setRequired(false)),
    new SlashCommandBuilder()
        .setName('load')
        .setDescription('Loads your anki\'s exported kanjis.')
        .addAttachmentOption(option =>
            option.setName('file')
                .setDescription('The file to load')
                .setRequired(true))
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        console.log('Started refreshing application (/) commands.');

        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands }
        );

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
})();

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

const getCorrectButton = () => new ButtonBuilder()
    .setCustomId('correct')
    .setLabel('✅')
    .setStyle(ButtonStyle.Success);

const getIncorrectButton = () => new ButtonBuilder()
    .setCustomId('incorrect')
    .setLabel('❌')
    .setStyle(ButtonStyle.Danger);

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand() && !interaction.isButton()) return;

    if (interaction.isCommand()) {
        const { commandName } = interaction;

        if (commandName === 'ping') {
            await interaction.reply('Pong!');
        } else if (commandName === 'ask') {
            db.get(
                'SELECT * FROM kanjis WHERE user_id = ? ORDER BY RANDOM() LIMIT 1', [interaction.user.id],
                async (err, row) => {
                    if (err) {
                        console.error(err);
                        await interaction.reply('An error occurred while fetching data.');
                        return;
                    }
                    if (!row) {
                        await interaction.reply('No data found in the database for your user ID.');
                        return;
                    }
                    const buttons = new ActionRowBuilder()
                        .addComponents(
                            getCorrectButton().setCustomId(`correct_${row.id}`),
                            getIncorrectButton().setCustomId(`incorrect_${row.id}`)
                        );

                    const message = await interaction.reply({
                        content: row.sentence
                            ? `${row.kanji}\n||${row.reading}||\n||${row.meanings}||\n||${row.sentence}||`
                            : `${row.kanji}\n||${row.reading}||\n||${row.meanings}||`,
                        components: [buttons]
                    });

                    setTimeout(async () => {
                        await interaction.editReply({
                            content: row.sentence
                            ? `${row.kanji}\n${row.reading}\n${row.meanings}\n${row.sentence}`
                            : `${row.kanji}\n${row.reading}\n${row.meanings}`,
                            components: []
                        });
                    }, 30000);
                }
            );
        } else if (commandName === 'save') {
            const userId = interaction.user.id;
            const kanji = interaction.options.getString('kanji');
            const reading = interaction.options.getString('reading');
            const meanings = interaction.options.getString('meanings');
            const sentence = interaction.options.getString('sentence') || null;

            db.run(
                'INSERT INTO kanjis (user_id, kanji, reading, meanings, sentence) VALUES (?, ?, ?, ?, ?)', [userId, kanji, reading, meanings, sentence],
                async (err) => {
                    if (err) {
                        console.error(err);
                        await interaction.reply({
                            content: 'An error occurred while saving data.',
                            flags: MessageFlags.Ephemeral
                        });
                        return;
                    }
                    await interaction.reply({
                        content: 'Kanji saved successfully!',
                        flags: MessageFlags.Ephemeral
                    });
                }
            );
        } else if (commandName === 'load') {
            const attachment = interaction.options.getAttachment('file');
            if (!attachment) {
                await interaction.reply({
                    content: 'No file provided.',
                    flags: MessageFlags.Ephemeral
                });
                return;
            }

            const fileUrl = attachment.url;
            const fileName = attachment.name;

            const path = `./${fileName}`;

            try {
                const response = await axios.get(fileUrl, { responseType: 'stream' });
                const writer = fs.createWriteStream(path);
                response.data.pipe(writer);

                await new Promise((resolve, reject) => {
                    writer.on('finish', resolve);
                    writer.on('error', reject);
                });

                const fileContent = fs.readFileSync(path, 'utf-8');
                const kanjiList = JSON.parse(fileContent);

                kanjiList.forEach(({ kanji, reading, meanings, sentence }) => {
                    const formattedMeanings = Object.entries(meanings)
                        .map(([category, values]) => `${category}: ${values.join(', ')}`)
                        .join('\n');

                    db.run(
                        'INSERT INTO kanjis (user_id, kanji, reading, meanings, sentence) VALUES (?, ?, ?, ?, ?)',
                        [interaction.user.id, kanji, reading, formattedMeanings, sentence || null],
                        (err) => {
                            if (err) console.error('Error inserting kanji:', err.message);
                        }
                    );
                });

                fs.unlinkSync(path);
                await interaction.reply({
                    content: `File ${fileName} loaded successfully!`,
                    flags: MessageFlags.Ephemeral
                });
            } catch (error) {
                console.error('Error processing the file:', error.message);
                await interaction.reply({
                    content: 'An error occurred while processing the file.',
                    flags: MessageFlags.Ephemeral
                });
            }
        }
    } else if (interaction.isButton()) {
        const [action, id] = interaction.customId.split('_');

        if (action === 'correct') {
            db.get(
                'SELECT * FROM kanjis WHERE id = ?', [id],
                (err, row) => {
                    if (err) {
                        console.error(err);
                        return;
                    }
                    db.run(
                        'UPDATE kanjis SET score = ? WHERE id = ?', [row.score + 1, id],
                        async (err) => {
                            if (err) {
                                console.error(err);
                                return;
                            }
                            const button = new ActionRowBuilder()
                                .addComponents(getCorrectButton().setDisabled(true))
                            await interaction.update({
                                content: `${row.kanji}\n${row.reading}\n${row.meanings}\n${row.sentence}`,
                                components: [button]
                            });
                        }
                    );
                }
            );
        } else if (action === 'incorrect') {
            db.get(
                'SELECT * FROM kanjis WHERE id = ?', [id],
                (err, row) => {
                    if (err) {
                        console.error(err);
                        return;
                    }
                    db.run(
                        'UPDATE kanjis SET score = ? WHERE id = ?', [Math.max(0, row.score - 1), id],
                        async (err) => {
                            if (err) {
                                console.error(err);
                                return;
                            }
                            const button = new ActionRowBuilder()
                                .addComponents(getIncorrectButton().setDisabled(true));
                            await interaction.update({
                                content: `${row.kanji}\n${row.reading}\n${row.meanings}\n${row.sentence}`,
                                components: [button]
                            });
                        }
                    );
                }
            );
        }
    }
});

client.login(process.env.DISCORD_TOKEN);