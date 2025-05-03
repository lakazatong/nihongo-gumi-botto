"use strict";

const { MessageFlags } = require("discord.js");
const sqlite3 = require("sqlite3").verbose();

function handleGetError(interaction, err) {
	if (err) {
		console.error("get", err);
		interaction.reply({
			content: "An error occurred with sqlite.",
			flags: MessageFlags.Ephemeral,
		});
		return true;
	}
	return false;
}

function handleRunError(interaction, err) {
	if (err) {
		console.error("run", err);
		interaction.reply({
			content: "An error occurred with sqlite.",
			flags: MessageFlags.Ephemeral,
		});
		return true;
	}
	return false;
}

class DecksDatabase {
	constructor(path = "./database/decks.db") {
		this.db = new sqlite3.Database(path, (err) => {
			if (err) {
				console.error("Error opening decks.db:", err.message);
			} else {
				this.db.run(`
                    CREATE TABLE IF NOT EXISTS decks (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        deck TEXT NOT NULL,
                        kanji TEXT NOT NULL,
                        reading TEXT NOT NULL,
                        meanings TEXT NOT NULL,
						forms TEXT,
                        example TEXT,
                        score INTEGER DEFAULT 0,
                        UNIQUE (deck, kanji)
                    )
                `);
				this.db.run(`
                    CREATE TABLE IF NOT EXISTS defaults (
                        user_id TEXT PRIMARY KEY,
                        deck TEXT NOT NULL
                    )
                `);
				this.db.run(`
                    CREATE TABLE IF NOT EXISTS owners (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        user_id TEXT NOT NULL,
                        deck TEXT NOT NULL
                    )
                `);
			}
		});
	}

	isOwner(interaction, userId, deck, callback) {
		this.db.all(`SELECT user_id FROM owners WHERE deck = ?`, [deck], (err, rows) => {
			if (handleGetError(interaction, err)) return;
			if (!rows.length) return callback(null);
			callback(rows.some((row) => row.user_id === userId));
		});
	}

	getDefaultDeck(interaction, userId, callback) {
		this.db.get(`SELECT deck FROM defaults WHERE user_id = ?`, [userId], (err, row) => {
			if (handleGetError(interaction, err)) return;
			callback(row?.deck || null);
		});
	}

	getRandomCard(interaction, deck, callback) {
		this.db.get("SELECT * FROM decks WHERE deck = ? ORDER BY RANDOM() LIMIT 1", [deck], (err, row) => {
			if (handleGetError(interaction, err)) return;
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

	getCardById(interaction, id, callback) {
		this.db.get("SELECT * FROM decks WHERE id = ?", [id], (err, row) => {
			if (handleGetError(interaction, err)) return;
			callback(row);
		});
	}

	getCardByKanji(interaction, deck, kanji, callback) {
		this.db.get("SELECT * FROM decks WHERE deck = ? AND kanji = ?", [deck, kanji], (err, row) => {
			if (handleGetError(interaction, err)) return;
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

	getDeckStats(interaction, deck, callback) {
		this.db.get(
			"SELECT COUNT(*) as count, SUM(score) as total, AVG(score) as average FROM decks WHERE deck = ?",
			[deck],
			(err, row) => {
				if (handleGetError(interaction, err)) return;
				if (!row) {
					interaction.reply({
						content: `This deck does not exist.`,
						flags: MessageFlags.Ephemeral,
					});
					return;
				}
				callback(row);
			}
		);
	}

	getAllDeckStats(interaction, userId, callback) {
		this.db.all(
			`SELECT 
				d.deck,
				COUNT(*) as count,
				SUM(d.score) as total,
				AVG(d.score) as average
			FROM decks d
			INNER JOIN owners o ON d.deck = o.deck
			WHERE o.user_id = ?
			GROUP BY d.deck`,
			[userId],
			(err, rows) => {
				if (handleGetError(interaction, err)) return;
				if (!rows || rows.length === 0) {
					interaction.reply({
						content: `You don't own any decks.`,
						flags: MessageFlags.Ephemeral,
					});
					return;
				}
				callback(rows);
			}
		);
	}

	addOwner(interaction, userId, deck, callback) {
		this.db.run(`INSERT INTO owners (user_id, deck) VALUES (?, ?)`, [userId, deck], function (err) {
			if (handleRunError(interaction, err)) return;
			callback?.(this);
		});
	}

	removeOwner(interaction, userId, deck, callback) {
		this.db.run(`DELETE FROM owners WHERE user_id = ? AND deck = ?`, [userId, deck], function (err) {
			if (handleRunError(interaction, err)) return;
			callback?.(this);
		});
	}

	updateDefault(interaction, userId, deck, callback) {
		this.db.run(`INSERT OR REPLACE INTO defaults (user_id, deck) VALUES (?, ?)`, [userId, deck], function (err) {
			if (handleRunError(interaction, err)) return;
			callback?.(this);
		});
	}

	addCard(interaction, deck, kanji, reading, meanings, forms, example, callback) {
		this.db.run(
			"INSERT INTO decks (deck, kanji, reading, meanings, forms, example) VALUES (?, ?, ?, ?, ?, ?)",
			[deck, kanji, reading, meanings, forms, example],
			function (err) {
				if (err) {
					if (err.code === "SQLITE_CONSTRAINT") {
						interaction.reply({
							content: "That kanji already exists in the deck.",
							flags: MessageFlags.Ephemeral,
						});
					} else {
						console.error("addCard", err);
						interaction.reply({
							content: "An error occurred with sqlite.",
							flags: MessageFlags.Ephemeral,
						});
					}
					return;
				}
				callback?.(this);
			}
		);
	}

	clearDeck(interaction, deck, callback) {
		this.db.run("DELETE FROM decks WHERE deck = ?", [deck], function (err) {
			if (handleRunError(interaction, err)) return;
			callback?.(this);
		});
	}

	updateCard(interaction, deck, kanji, reading, meanings, forms, example, callback) {
		const fields = [];
		const values = [];

		if (reading) {
			fields.push("reading = ?");
			values.push(reading);
		}
		if (meanings) {
			fields.push("meanings = ?");
			values.push(meanings);
		}
		if (forms) {
			fields.push("forms = ?");
			values.push(forms);
		}
		if (example) {
			fields.push("example = ?");
			values.push(example);
		}

		if (fields.length === 0) {
			interaction.reply({
				content: "No values provided to update.",
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		values.push(deck, kanji);

		const sql = `UPDATE decks SET ${fields.join(", ")} WHERE deck = ? AND kanji = ?`;

		this.db.run(sql, values, function (err) {
			if (handleRunError(interaction, err)) return;
			callback?.(this);
		});
	}

	deleteCard(interaction, deck, kanji, callback) {
		this.db.run("DELETE FROM decks WHERE deck = ? AND kanji = ?", [deck, kanji], function (err) {
			if (handleRunError(interaction, err)) return;
			callback?.(this);
		});
	}

	updateScoreById(interaction, id, newScore, callback) {
		this.db.run("UPDATE decks SET score = ? WHERE id = ?", [newScore, id], function (err) {
			if (handleRunError(interaction, err)) return;
			callback?.(this);
		});
	}

	dropDeck(interaction, deck, callback) {
		const db = this.db;
		db.run("DELETE FROM decks WHERE deck = ?", [deck], function (err) {
			if (handleRunError(interaction, err)) return;
			const deckDeletionResponse = this;
			db.run("DELETE FROM owners WHERE deck = ?", [deck], function (err) {
				if (handleRunError(interaction, err)) return;
				callback?.(deckDeletionResponse, this);
			});
		});
	}
}

module.exports = new DecksDatabase();
