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

function getOwner(deck, callback) {
	db.get(`SELECT * FROM owners WHERE deck = ?`, [deck], (err, row) => {
		if (err) {
			callback(err);
			return;
		}
		callback(null, row?.user_id || null);
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

module.exports = {
	db,
	getOwner,
	setOwner,
	updateDefault,
	getDefaultDeck,
};
