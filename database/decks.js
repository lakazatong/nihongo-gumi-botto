"use strict";

const { MessageFlags } = require("discord.js");
const sqlite3 = require("sqlite3").verbose();

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
                        sentence TEXT,
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

	#handleGetError(interaction, err) {
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

	getOwner(interaction, deck, callback) {
		this.db.get(`SELECT * FROM owners WHERE deck = ?`, [deck], (err, row) => {
			if (this.#handleGetError(interaction, err)) return;
			callback(row?.user_id || null);
		});
	}

	getDefaultDeck(interaction, userId, callback) {
		this.db.get(`SELECT deck FROM defaults WHERE user_id = ?`, [userId], (err, row) => {
			if (this.#handleGetError(interaction, err)) return;
			callback(row?.deck || null);
		});
	}

	getRandomCard(interaction, deck, callback) {
		this.db.get("SELECT * FROM decks WHERE deck = ? ORDER BY RANDOM() LIMIT 1", [deck], (err, row) => {
			if (this.#handleGetError(interaction, err)) return;
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
			if (this.#handleGetError(interaction, err)) return;
			callback(row);
		});
	}

	getCardByKanji(interaction, deck, kanji, callback) {
		this.db.get("SELECT * FROM decks WHERE deck = ? AND kanji = ?", [deck, kanji], (err, row) => {
			if (this.#handleGetError(interaction, err)) return;
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
				if (this.#handleGetError(interaction, err)) return;
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

	#handleRunError(interaction, err) {
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

	setOwner(interaction, userId, deck, callback) {
		this.db.run(`INSERT INTO owners (user_id, deck) VALUES (?, ?)`, [userId, deck], (err) => {
			if (this.#handleRunError(interaction, err)) return;
			callback?.(this);
		});
	}

	updateDefault(interaction, userId, deck, callback) {
		this.db.run(`INSERT OR REPLACE INTO defaults (user_id, deck) VALUES (?, ?)`, [userId, deck], (err) => {
			if (this.#handleRunError(interaction, err)) return;
			callback?.(this);
		});
	}

	addCard(interaction, deck, kanji, reading, meanings, sentence, callback) {
		this.db.run(
			"INSERT INTO decks (deck, kanji, reading, meanings, sentence) VALUES (?, ?, ?, ?, ?)",
			[deck, kanji, reading, meanings, sentence],
			(err) => {
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
		this.db.run("DELETE FROM decks WHERE deck = ?", [deck], (err) => {
			if (this.#handleRunError(interaction, err)) return;
			callback?.(this);
		});
	}

	updateCard(interaction, deck, kanji, reading, meanings, sentence, callback) {
		this.db.run(
			"UPDATE decks SET reading = ?, meanings = ?, sentence = ? WHERE deck = ? AND kanji = ?",
			[reading, meanings, sentence, deck, kanji],
			(err) => {
				if (this.#handleRunError(interaction, err)) return;
				callback?.(this);
			}
		);
	}

	deleteCard(interaction, deck, kanji, callback) {
		this.db.run("DELETE FROM decks WHERE deck = ? AND kanji = ?", [deck, kanji], (err) => {
			if (this.#handleRunError(interaction, err)) return;
			callback?.(this);
		});
	}

	updateScoreById(interaction, id, newScore, callback) {
		this.db.run("UPDATE decks SET score = ? WHERE id = ?", [newScore, id], (err) => {
			if (this.#handleRunError(interaction, err)) return;
			callback(this);
		});
	}

	dropDeck(interaction, deck, callback) {
		this.db.run("DELETE FROM decks WHERE deck = ?", [deck], (err) => {
			if (this.#handleRunError(interaction, err)) return;
			this.db.run("DELETE FROM owners WHERE deck = ?", [deck], (err) => {
				if (this.#handleRunError(interaction, err)) return;
				callback?.(this);
			});
		});
	}
}

module.exports = new DecksDatabase();
