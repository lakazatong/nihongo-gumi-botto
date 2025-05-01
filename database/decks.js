"use strict";

const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./database/decks.db", (err) => {
	if (err) {
		console.error("Error opening decks.db:", err.message);
	} else {
		db.run(`
            CREATE TABLE IF NOT EXISTS decks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                deck TEXT NOT NULL,
                kanji TEXT NOT NULL,
                reading TEXT NOT NULL,
                meanings TEXT NOT NULL,
                sentence TEXT,
                score INTEGER DEFAULT 0,
                UNIQUE (deck, kanji)
            )
        `);
		db.run(`
			CREATE TABLE IF NOT EXISTS defaults (
				user_id TEXT PRIMARY KEY,
				deck TEXT NOT NULL
			)
		`);
		db.run(`
            CREATE TABLE IF NOT EXISTS owners (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
				user_id TEXT NOT NULL,
				deck TEXT NOT NULL
            )
        `);
	}
});

function getOwner(interaction, deck, callback) {
	db.get(`SELECT * FROM owners WHERE deck = ?`, [deck], (err, row) => {
		if (err) {
			console.error("getOwner", err);
			interaction.reply({
				content: "An error occurred with sqlite.",
				flags: MessageFlags.Ephemeral,
			});
			return;
		}
		callback(row?.user_id || null);
	});
}

function setOwner(userId, deck) {
	db.run(`INSERT INTO owners (user_id, deck) VALUES (?, ?)`, [userId, deck]);
}

function updateDefault(userId, deck) {
	db.run(`INSERT OR REPLACE INTO defaults (user_id, deck) VALUES (?, ?)`, [userId, deck]);
}

function getDefaultDeck(userId, callback) {
	db.get(`SELECT deck FROM defaults WHERE user_id = ?`, [userId], (err, row) => {
		if (err) {
			callback(err);
			return;
		}

		callback(null, row?.deck || null);
	});
}

function getRandomDeckEntry(interaction, deck, callback) {
	db.get("SELECT * FROM decks WHERE deck = ? ORDER BY RANDOM() LIMIT 1", [deck], (err, row) => {
		if (err) {
			console.error("getRandomDeckEntry", err);
			interaction.reply({
				content: "An error occurred with sqlite.",
				flags: MessageFlags.Ephemeral,
			});
			return;
		}
		if (!row) {
			interaction.reply({
				content: "Empty deck.",
				flags: MessageFlags.Ephemeral,
			});
			return;
		}
		callback(row);
	});
}

function getDeckById(interaction, id, callback) {
	db.get("SELECT * FROM decks WHERE id = ?", [id], (err, row) => {
		if (err) {
			console.error("getDeckById", err);
			interaction.reply({
				content: "An error occurred with sqlite.",
				flags: MessageFlags.Ephemeral,
			});
			return;
		}
		callback(row);
	});
}

function getDeckEntryByKanji(interaction, deck, kanji, callback) {
	db.get("SELECT * FROM decks WHERE deck = ? AND kanji = ?", [deck, kanji], (err, row) => {
		if (err) {
			console.error("getDeckEntryByKanji", err);
			interaction.reply({
				content: "An error occurred with sqlite.",
				flags: MessageFlags.Ephemeral,
			});
			return;
		}
		if (!row) {
			interaction.reply({
				content: `This kanji does not exist in the deck ${deck}.`,
				flags: MessageFlags.Ephemeral,
			});
			return;
		}
		callback(row);
	});
}

function getDeckStats(interaction, deck, callback) {
	db.get(
		"SELECT COUNT(*) as count, SUM(score) as total, AVG(score) as average FROM decks WHERE deck = ?",
		[deck],
		(err, row) => {
			if (err) {
				console.error("getDeckStats", err);
				interaction.reply({
					content: "An error occurred with sqlite.",
					flags: MessageFlags.Ephemeral,
				});
				return;
			}
			callback(row);
		}
	);
}

module.exports = {
	db,
	getOwner,
	setOwner,
	updateDefault,
	getDefaultDeck,
	getRandomDeckEntry,
	getDeckById,
	getDeckEntryByKanji,
	getDeckStats,
};
