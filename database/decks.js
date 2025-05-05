"use strict";

const { MessageFlags } = require("discord.js");
const sqlite3 = require("sqlite3").verbose();
const { isOk, getUserScore } = require("../utils/database.js");

class DecksDatabase {
	constructor(path = "./database/decks.db") {
		this.db = new sqlite3.Database(path, (err) => {
			if (err) {
				console.error("Error opening decks.db:", err.message);
			} else {
				this.db.run(`
                    CREATE TABLE IF NOT EXISTS defaults (
						id INTEGER PRIMARY KEY AUTOINCREMENT,
                        user_id TEXT NOT NULL,
                        deck TEXT NOT NULL,
						UNIQUE (user_id)
                    )
                `);
				this.db.run(`
                    CREATE TABLE IF NOT EXISTS owners (
						id INTEGER PRIMARY KEY AUTOINCREMENT,
						user_id TEXT NOT NULL,
						deck TEXT NOT NULL,
						UNIQUE (user_id, deck)
					)
                `);
			}
		});
	}

	/* defaults handling */

	/* getters */

	getDefaultDeck(interaction, userId, callback) {
		this.db.get(`SELECT deck FROM defaults WHERE user_id = ?`, [userId], (err, row) => {
			if (isOk(interaction, err)) callback(row?.deck);
		});
	}

	/* setters */

	updateDefault(interaction, userId, deck, callback) {
		this.db.run(`INSERT OR REPLACE INTO defaults (user_id, deck) VALUES (?, ?)`, [userId, deck], function (err) {
			if (isOk(interaction, err)) callback?.(this);
		});
	}

	/* owners handling */

	/* getters */

	getOwners(interaction, deck, callback) {
		this.db.all(`SELECT user_id FROM owners WHERE deck = ?`, [deck], (err, cards) => {
			if (isOk(interaction, err)) callback(cards?.map((row) => row.user_id) || []);
		});
	}

	/* setters */

	addOwner(interaction, userId, deck, callback) {
		this.db.run(`INSERT OR IGNORE INTO owners (user_id, deck) VALUES (?, ?)`, [userId, deck], function (err) {
			if (isOk(interaction, err)) callback?.(this);
		});
	}

	removeOwner(interaction, userId, deck, callback) {
		this.db.run(`DELETE FROM owners WHERE user_id = ? AND deck = ?`, [userId, deck], function (err) {
			if (isOk(interaction, err)) callback?.(this);
		});
	}

	removeOwners(interaction, deck, callback) {
		this.db.run(`DELETE FROM owners WHERE deck = ?`, [deck], function (err) {
			if (isOk(interaction, err)) callback?.(this);
		});
	}

	/* decks handling */

	/* getters */

	getRandomCard(interaction, deck, userId, callback) {
		this.db.all(`SELECT * FROM ${deck}`, [], (err, cards) => {
			if (!isOk(interaction, err)) return;
			if (!cards || cards.length === 0) {
				callback();
				return;
			}

			const weights = cards.map((card) => {
				const userScore = getUserScore(card.score, userId);
				return 1 / (userScore + 1);
			});

			const totalWeight = weights.reduce((a, b) => a + b, 0);
			const thresholds = [];
			let acc = 0;

			for (let w of weights) {
				acc += w / totalWeight;
				thresholds.push(acc);
			}

			const r = Math.random();
			const index = thresholds.findIndex((t) => r <= t);
			callback(cards[index]);
		});
	}

	getCardById(interaction, deck, id, callback) {
		this.db.get(`SELECT * FROM ${deck} WHERE id = ?`, [id], (err, card) => {
			if (isOk(interaction, err)) callback(card);
		});
	}

	getCardByKanji(interaction, deck, kanji, callback) {
		this.db.get(`SELECT * FROM ${deck} WHERE kanji = ?`, [kanji], (err, card) => {
			if (isOk(interaction, err)) callback(card);
		});
	}

	getDecks(interaction, userId, callback) {
		this.db.all(`SELECT deck FROM owners WHERE user_id = ?`, [userId], (err, cards) => {
			if (isOk(interaction, err)) callback(cards?.map((row) => row.deck) || []);
		});
	}

	getDeckStats(interaction, deck, userId, callback) {
		this.db.all(`SELECT * FROM ${deck}`, [], (err, cards) => {
			if (!isOk(interaction, err)) return;

			const totalScore = cards.reduce((sum, card) => sum + getUserScore(card.score, userId), 0);
			const count = cards.length;

			callback({
				count,
				total: totalScore,
				average: count > 0 ? totalScore / count : 0,
			});
		});
	}

	getAllDeckStats(interaction, userId, callback) {
		this.getDecks(interaction, userId, (decks) => {
			const stats = [];
			let remaining = decks.length;

			if (remaining === 0) {
				callback(stats);
				return;
			}

			decks.forEach((deck) => {
				this.db.all(`SELECT score FROM ${deck}`, [], (err, cards) => {
					if (err) {
						stats.push({ deck, count: undefined, total: undefined, average: undefined });
					} else {
						const total = cards.reduce((sum, card) => sum + getUserScore(card.score, userId), 0);
						const count = cards.length;

						stats.push({
							deck,
							count,
							total,
							average: count > 0 ? total / count : 0,
						});
					}

					if (--remaining === 0) callback(stats);
				});
			});
		});
	}

	/* setters */

	addCard(interaction, deck, kanji, reading, meanings, forms, example, callback) {
		this.db.run(
			`INSERT OR IGNORE INTO ${deck} (kanji, reading, meanings, forms, example) VALUES (?, ?, ?, ?, ?)`,
			[kanji, reading, meanings, forms, example],
			function (err) {
				if (isOk(interaction, err)) callback?.(this);
			}
		);
	}

	clearDeck(interaction, deck, callback) {
		this.db.run(`DELETE FROM ${deck}`, [], function (err) {
			if (isOk(interaction, err)) callback?.(this);
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

		values.push(kanji);

		this.db.run(`UPDATE ${deck} SET ${fields.join(", ")} WHERE kanji = ?`, values, function (err) {
			if (isOk(interaction, err)) callback?.(this);
		});
	}

	deleteCardByKanji(interaction, deck, kanji, callback) {
		this.db.run(`DELETE FROM ${deck} WHERE kanji = ?`, [kanji], function (err) {
			if (isOk(interaction, err)) callback?.(this);
		});
	}

	updateScoreById(interaction, deck, id, newScore, userId, oldScore, callback) {
		let updatedScore;
		const prefix = `${userId}:`;
		const start = oldScore.indexOf(prefix);

		if (start === -1) {
			updatedScore = oldScore ? `${oldScore},${prefix}${newScore}` : `${prefix}${newScore}`;
		} else {
			const afterStart = start + prefix.length;
			const end = oldScore.indexOf(",", afterStart);
			const before = oldScore.slice(0, start);
			const after = end === -1 ? "" : oldScore.slice(end + 1);
			updatedScore = [before, `${prefix}${newScore}`, after].filter(Boolean).join(",");
		}

		this.db.run(`UPDATE ${deck} SET score = ? WHERE id = ?`, [updatedScore, id], function (err) {
			if (isOk(interaction, err)) callback?.(this);
		});
	}

	createDeck(interaction, userId, deck, callback) {
		const self = this;
		self.db.run(
			`CREATE TABLE ${deck} (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				kanji TEXT,
				reading TEXT NOT NULL,
				meanings TEXT NOT NULL,
				forms TEXT,
				example TEXT,
				score TEXT NOT NULL DEFAULT '',
				UNIQUE (kanji)
			)`,
			[],
			function (err) {
				if (!isOk(interaction, err)) return;
				const createDeckResponse = this;
				self.addOwner(interaction, userId, deck, function (addOwnerResponse) {
					callback?.(createDeckResponse, addOwnerResponse);
				});
			}
		);
	}

	dropDeck(interaction, deck, callback) {
		const self = this;
		self.db.run(`DROP TABLE ${deck}`, [], function (err) {
			if (!isOk(interaction, err)) return;
			const dropDeckResponse = this;
			self.removeOwners(interaction, deck, function (removeOwnersResponse) {
				callback?.(dropDeckResponse, removeOwnersResponse);
			});
		});
	}
}

module.exports = new DecksDatabase();
