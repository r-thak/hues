// Scoring logic for Hues and Cues

export const DEFAULT_SCORING_RADII = [
    { maxDist: 0, points: 3 },
    { maxDist: 1, points: 2 },
    { maxDist: 2, points: 1 },
];

/**
 * Compute Chebyshev distance between two cells on the board.
 * @param {number} cellA - Flat index of cell A
 * @param {number} cellB - Flat index of cell B
 * @param {number} cols - Number of columns in the board
 * @returns {number} Chebyshev distance
 */
export function chebyshevDistance(cellA, cellB, cols) {
    const rowA = Math.floor(cellA / cols);
    const colA = cellA % cols;
    const rowB = Math.floor(cellB / cols);
    const colB = cellB % cols;
    return Math.max(Math.abs(rowA - rowB), Math.abs(colA - colB));
}

/**
 * Score a single guess based on distance from target.
 * @param {number} distance - Chebyshev distance from target
 * @param {Array<{ maxDist: number, points: number }>} scoringRadii - Sorted by maxDist ascending
 * @returns {number} Points awarded
 */
export function scoreGuess(distance, scoringRadii = DEFAULT_SCORING_RADII) {
    for (const { maxDist, points } of scoringRadii) {
        if (distance <= maxDist) {
            return points;
        }
    }
    return 0;
}

/**
 * Score the cue giver for a round.
 * Returns the count of guesses that fall within any scoring radius.
 * @param {Array<number|null>} guesses - All guess cell indices (g1 and g2 from all guessers, may contain nulls)
 * @param {number} targetCell - The target cell index
 * @param {number} cols - Number of columns
 * @param {Array<{ maxDist: number, points: number }>} scoringRadii
 * @returns {number} Cue giver's score
 */
export function scoreCueGiver(guesses, targetCell, cols, scoringRadii = DEFAULT_SCORING_RADII) {
    let count = 0;
    for (const guess of guesses) {
        if (guess == null) continue;
        const dist = chebyshevDistance(guess, targetCell, cols);
        if (scoreGuess(dist, scoringRadii) > 0) {
            count++;
        }
    }
    return count;
}
