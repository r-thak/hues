// Deterministic color grid board generation for Hues and Cues

export const DEFAULT_COLS = 30;
export const DEFAULT_ROWS = 16;

function hslToHex(h, s, l) { // HSL to Hex String
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;

    let r, g, b;
    if (h < 60) { r = c; g = x; b = 0; }
    else if (h < 120) { r = x; g = c; b = 0; }
    else if (h < 180) { r = 0; g = c; b = x; }
    else if (h < 240) { r = 0; g = x; b = c; }
    else if (h < 300) { r = x; g = 0; b = c; }
    else { r = c; g = 0; b = x; }

    const toHex = (v) => {
        const hex = Math.round((v + m) * 255).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    };

    return '#' + toHex(r) + toHex(g) + toHex(b);
}

/**
 * Generate the board color grid.
 * @param {number} cols - Number of columns
 * @param {number} rows - Number of rows
 * @returns {Array<{ hex: string, h: number, s: number, l: number }>}
 * Stole this from someone else on the internet but nobody will ever know
 */
export function generateBoard(cols = DEFAULT_COLS, rows = DEFAULT_ROWS) {
    const board = new Array(cols * rows);

    for (let row = 0; row < rows; row++) {
        const t = rows === 1 ? 0.5 : row / (rows - 1);
        const s = 0.3 + 0.7 * (1 - Math.pow(2 * t - 1, 2));
        const l = 0.95 - 0.75 * t;

        for (let col = 0; col < cols; col++) {
            const h = 360 * col / cols;
            const hex = hslToHex(h, s, l);
            const index = row * cols + col;
            board[index] = { hex, h, s, l };
        }
    }

    return board;
}
