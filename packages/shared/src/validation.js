// Clue validation for Hues and Cues

/**
 * Count the number of words in a string.
 * Split on whitespace and hyphens.
 * @param {string} text
 * @returns {number}
 */
export function countWords(text) {
    const trimmed = text.trim();
    if (trimmed.length === 0) return 0;
    const tokens = trimmed.split(/[\s-]+/).filter(t => t.length > 0);
    return tokens.length;
}

/**
 * Validate a clue word.
 * @param {string} text - The clue text
 * @param {number} maxWords - Maximum allowed word count
 * @returns {{ valid: boolean, wordCount: number, error?: string }}
 */
export function validateClue(text, maxWords) {
    if (!text || text.trim().length === 0) {
        return { valid: false, wordCount: 0, error: 'Clue cannot be empty' };
    }

    const wordCount = countWords(text);

    if (wordCount === 0) {
        return { valid: false, wordCount: 0, error: 'Clue cannot be empty' };
    }

    if (wordCount > maxWords) {
        return {
            valid: false,
            wordCount,
            error: `Clue must be at most ${maxWords} word${maxWords === 1 ? '' : 's'} (got ${wordCount})`,
        };
    }

    return { valid: true, wordCount };
}
