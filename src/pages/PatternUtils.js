// PatternUtils.js
export const GRID_SIZE = 7; // 7x7 grid (1..49)

/**
 * Preprocess raw array-of-arrays into objects:
 * { id, numbers, sum, length, shapeSig }
 */
export function preprocess(rawData = []) {
  return rawData.map((numbers, idx) => {
    const sum = numbers.reduce((a, b) => a + b, 0);
    const length = numbers.length;
    const shapeSig = getShapeSignature(numbers);
    return { id: idx + 1, numbers, sum, length, shapeSig };
  });
}

/** frequency of numbers 1..49 across all sets */
export function frequencyMap(sets) {
  const freq = Array(GRID_SIZE * GRID_SIZE + 1).fill(0); // index 0 unused
  sets.forEach(s => s.numbers.forEach(n => freq[n]++));
  return freq; // use indices 1..49
}

/** produce 2D grid heatmap values (rows x cols) */
export function gridHeatmapFromFreq(freq) {
  const rows = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    const row = [];
    for (let c = 0; c < GRID_SIZE; c++) {
      const num = r * GRID_SIZE + c + 1;
      row.push(freq[num]);
    }
    rows.push(row);
  }
  return rows;
}

/** create a binary 7x7 signature string */
export function getShapeSignature(numbers) {
  const grid = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0));
  numbers.forEach(n => {
    const r = Math.floor((n - 1) / GRID_SIZE);
    const c = (n - 1) % GRID_SIZE;
    grid[r][c] = 1;
  });
  return grid.map(r => r.join("")).join("|");
}

/** detect simple patterns (horiz/vert/diag streaks + symmetry) */
export function detectPatterns(numbers) {
  const coords = numbers.map(n => ({
    row: Math.floor((n - 1) / GRID_SIZE),
    col: (n - 1) % GRID_SIZE,
  }));

  let horizontal = 0, vertical = 0, diagonal = 0;
  let symmetryLR = true, symmetryTB = true;

  coords.forEach(({ row, col }) => {
    if (coords.some(c => c.row === row && Math.abs(c.col - col) === 1)) horizontal++;
    if (coords.some(c => c.col === col && Math.abs(c.row - row) === 1)) vertical++;
    if (coords.some(c => Math.abs(c.row - row) === 1 && Math.abs(c.col - col) === 1)) diagonal++;

    if (!coords.some(c => c.row === row && c.col === GRID_SIZE - 1 - col)) symmetryLR = false;
    if (!coords.some(c => c.col === col && c.row === GRID_SIZE - 1 - row)) symmetryTB = false;
  });

  return {
    horizontalStreaks: Math.floor(horizontal / 2),
    verticalStreaks: Math.floor(vertical / 2),
    diagonalStreaks: Math.floor(diagonal / 2),
    symmetryLR,
    symmetryTB,
  };
}

/**
 * small "plugin registry" for additional analyzers / visualizers:
 * plugins are objects { id, name, run(sets) => result }
 */
/**
 * Detect algebraic bonds: A*B=C, A+B=C, A^2=B, etc.
 */
export function detectAlgebraicBonds(numbers) {
  const sorted = [...numbers].sort((a, b) => a - b);
  const n = sorted.length;
  const bonds = [];

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const sum = sorted[i] + sorted[j];
      const product = sorted[i] * sorted[j];

      // Addition Bond
      if (sorted.includes(sum)) {
        bonds.push({ type: "addition", a: sorted[i], b: sorted[j], result: sum });
      }

      // Multiplication Bond
      if (product <= 49 && sorted.includes(product)) {
        bonds.push({ type: "multiplication", a: sorted[i], b: sorted[j], result: product });
      }
    }
  }

  // Check for powers/roots
  sorted.forEach(val => {
    const sq = val * val;
    if (sq <= 49 && sorted.includes(sq)) {
      bonds.push({ type: "square", a: val, result: sq });
    }
  });

  return bonds;
}

/**
 * Detect results that WOULD complete a bond if they appeared.
 * Returns a map of number -> intensity (how many partial bonds it completes)
 */
export function detectPartialAlgebraicResults(numbers) {
  const sorted = [...numbers].sort((a, b) => a - b);
  const n = sorted.length;
  const numSet = new Set(sorted);
  const results = {};

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const sum = sorted[i] + sorted[j];
      const product = sorted[i] * sorted[j];

      if (sum <= 49 && !numSet.has(sum)) {
        results[sum] = (results[sum] || 0) + 1;
      }
      if (product > 1 && product <= 49 && !numSet.has(product)) {
        results[product] = (results[product] || 0) + 1;
      }
    }
  }

  // Squares
  sorted.forEach(val => {
    const sq = val * val;
    if (sq > 1 && sq <= 49 && !numSet.has(sq)) {
      results[sq] = (results[sq] || 0) + 1;
    }
  });

  return results;
}

const plugins = new Map();
export function registerPlugin(plugin) {
  if (!plugin?.id) throw new Error("Plugin must have an id");
  plugins.set(plugin.id, plugin);
}
export function unregisterPlugin(pluginId) {
  plugins.delete(pluginId);
}
export function runPlugins(sets) {
  const results = {};
  for (const [id, p] of plugins) {
    try {
      results[id] = p.run(sets);
    } catch (e) {
      results[id] = { error: String(e) };
    }
  }
  return results;
}
