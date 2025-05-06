"use strict";

function isKana(char) {
	const code = char.charCodeAt(0);
	return (
		(code >= 0x3040 && code <= 0x309f) || // hiragana
		(code >= 0x30a0 && code <= 0x30ff) || // katakana
		(code >= 0x31f0 && code <= 0x31ff) || // katakana phonetic extensions
		(code >= 0xff65 && code <= 0xff9f) // half-width katakana
	);
}
