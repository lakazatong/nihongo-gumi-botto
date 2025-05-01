"use strict";

const sqlite3 = require("sqlite3").verbose();

const decks_db = new sqlite3.Database("./database/decks.db", (err) => {
	if (err) {
		console.error("Error opening decks.db:", err.message);
	} else {
		decks_db.run(`
            CREATE TABLE IF NOT EXISTS defaults (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                deck TEXT NOT NULL
            )
        `);
		decks_db.run(`
            CREATE TABLE IF NOT EXISTS owners (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
				user_id TEXT NOT NULL,
				deck TEXT NOT NULL
            )
        `);
	}
});

function getOwner(deck, callback) {
	decks_db.get(`SELECT * FROM owners WHERE deck = ?`, [deck], (err, row) => {
		if (err) {
			callback(err);
			return;
		}
		callback(null, row?.user_id || null);
	});
}

function setOwner(userId, deck) {
	decks_db.run(`INSERT INTO owners (user_id, deck) VALUES (?, ?)`, [userId, deck]);
}

function updateDefault(userId, deck) {
	decks_db.run(`INSERT INTO defaults (user_id, deck) VALUES (?, ?)`, [userId, deck]);
}

function getDefaultDeck(userId, callback) {
	decks_db.get(`SELECT deck FROM defaults WHERE user_id = ?`, [userId], (err, row) => {
		if (err) {
			callback(err);
			return;
		}

		callback(null, row?.deck || null);
	});
}

module.exports = {
	decks_db,
	getOwner,
	setOwner,
	updateDefault,
	getDefaultDeck,
};
