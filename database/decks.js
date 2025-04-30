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

function exists(deck, callback) {
	decks_db.get(`SELECT * FROM owners WHERE deck = ?`, [deck], (err, row) => {
		if (err) {
			callback(err);
			return;
		}
		callback(null, !!row);
	});
}

function isOwner(userId, deck, callback) {
	decks_db.get(`SELECT * FROM owners WHERE user_id = ? AND deck = ?`, [userId, deck], (err, row) => {
		if (err) {
			callback(err);
			return;
		}
		callback(null, !!row);
	});
}

function updateDefault(userId, deck) {
	decks_db.run(`UPDATE defaults SET deck = ? WHERE user_id = ?`, [deck, userId], function (err) {
		if (err) {
			return;
		}
	});
}

function getDeck(userId, callback) {
	decks_db.get(`SELECT deck FROM defaults WHERE user_id = ?`, [userId], (err, row) => {
		if (err) {
			callback(err);
			return;
		}

		callback(null, row?.deck);
	});
}

function addDeck(userId, deck) {
	decks_db.run(`INSERT INTO defaults (user_id, deck) VALUES (?, ?)`, [userId, deck], function (err) {
		if (err) {
			return;
		}
	});
	decks_db.run(`INSERT INTO owners (user_id, deck) VALUES (?, ?)`, [userId, deck], function (err) {
		if (err) {
			return;
		}
	});
}

module.exports = {
	decks_db,
	exists,
	isOwner,
	updateDeck: updateDefault,
	getDeck,
};
