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
/**
 * Calculate Global Harmonic Field:
 * Dense algebraic resonance by checking multiple previous draws and inverse ops.
 */
export function calculateHarmonicField(history = [], depth = 3) {
  const field = {}; // number -> field strength
  const recent = history.slice(-depth).reverse(); // [lastDraw, prevDraw, ...]

  recent.forEach((draw, idx) => {
    const numbers = draw.numbers || draw;
    const n = numbers.length;
    const weight = (depth - idx) / depth; // 1.0, 0.66, 0.33...

    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const A = numbers[i], B = numbers[j];

        // Sum & Product
        const signals = [A + B, A * B, Math.abs(A - B)];
        if (A % B === 0) signals.push(A / B);
        if (B % A === 0) signals.push(B / A);

        signals.forEach(s => {
          if (s >= 1 && s <= 49 && !numbers.includes(s)) {
            field[s] = (field[s] || 0) + (weight * 0.1);
          }
        });
      }

      // Powers & Roots
      const sq = numbers[i] * numbers[i];
      if (sq >= 1 && sq <= 49 && !numbers.includes(sq)) {
        field[sq] = (field[sq] || 0) + (weight * 0.2);
      }
    }
  });

  return field;
}

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

/**
 * Aggregates partial bond targets across the last X weeks to find the most "urgent" completions.
 * Returns an array of { number, intensity } sorted by intensity.
 */
export function getStrongestMissingResults(history = [], limit = 5) {
  const aggregate = {};
  const recentWeeks = history.slice(0, limit);

  recentWeeks.forEach((draw, idx) => {
    const partials = detectPartialAlgebraicResults(draw);
    const weight = (limit - idx) / limit; // Recency weight

    Object.entries(partials).forEach(([num, count]) => {
      aggregate[num] = (aggregate[num] || 0) + (count * weight);
    });
  });

  return Object.entries(aggregate)
    .map(([num, intensity]) => ({ number: parseInt(num), intensity }))
    .sort((a, b) => b.intensity - a.intensity);
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
/**
 * Detect Isolated Spatial Clusters:
 * 3 numbers that touch only each other and produce exactly 2 algebraic results.
 */
export function detectIsolatedClusters(draw) {
  const results = [];
  const n = draw.length;

  // Helper for adjacency
  const areAdj = (n1, n2) => {
    const r1 = Math.floor((n1 - 1) / GRID_SIZE);
    const c1 = (n1 - 1) % GRID_SIZE;
    const r2 = Math.floor((n2 - 1) / GRID_SIZE);
    const c2 = (n2 - 1) % GRID_SIZE;
    return Math.abs(r1 - r2) <= 1 && Math.abs(c1 - c2) <= 1 && (r1 !== r2 || c1 !== c2);
  };

  // Helper for orthogonal adjacency
  const areOrtho = (n1, n2) => {
    const r1 = Math.floor((n1 - 1) / GRID_SIZE);
    const c1 = (n1 - 1) % GRID_SIZE;
    const r2 = Math.floor((n2 - 1) / GRID_SIZE);
    const c2 = (n2 - 1) % GRID_SIZE;
    return (r1 === r2 && Math.abs(c1 - c2) === 1) || (c1 === c2 && Math.abs(r1 - r2) === 1);
  };

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      for (let k = j + 1; k < n; k++) {
        const triple = [draw[i], draw[j], draw[k]];

        // 1. Isolation check: None of the 3 touch any other number in draw
        const others = draw.filter(num => !triple.includes(num));
        const isIsolated = triple.every(t => !others.some(o => areAdj(t, o)));
        if (!isIsolated) continue;

        // 2. Connectivity & Middle Number
        // We test each of the 3 as a potential "Middle" independently.
        const validHits = [];
        for (let idx = 0; idx < 3; idx++) {
          const mid = triple[idx];
          const sibs = triple.filter((_, sIdx) => sIdx !== idx);

          if (areAdj(mid, sibs[0]) && areAdj(mid, sibs[1])) {
            // Candidate middle connects to both others.
            // Check algebraic resonance for THIS middle specifically.
            const plusResults = new Set();
            const multResults = new Set();

            sibs.forEach(s => {
              const sum = mid + s;
              const mul = mid * s;
              if (sum >= 1 && sum <= 49) plusResults.add(sum);
              if (mul >= 1 && mul <= 49) multResults.add(mul);
            });

            // Check if EITHER op type produces exactly 2 results for THIS mid.
            if (plusResults.size === 2) {
              validHits.push({ mid, sibs, preds: [...plusResults].sort((a, b) => a - b), type: 'addition' });
            }
            if (multResults.size === 2) {
              validHits.push({ mid, sibs, preds: [...multResults].sort((a, b) => a - b), type: 'multiplication' });
            }
          }
        }

        if (validHits.length > 0) {
          // Selection Priority: 
          // 1. Identify the best middle candidate (prefer orthogonal branching)
          const hubs = [...new Set(validHits.map(h => h.mid))];
          let bestMid = hubs.find(m => {
            const sibs = triple.filter(t => t !== m);
            return areOrtho(m, sibs[0]) && areOrtho(m, sibs[1]);
          });

          if (!bestMid) bestMid = hubs[0];

          // Push BOTH valid hits (Addition/Multiplication) for that best hub
          validHits.filter(h => h.mid === bestMid).forEach(hit => {
            results.push({
              numbers: triple,
              middle: hit.mid,
              predictions: hit.preds,
              type: hit.type
            });
          });
        }
      }
    }
  }
  return results;
}

/**
 * Detect Inverse Clusters:
 * Finds pairs in the draw that could have been produced by a hypothetical 3-number "Seed" cluster.
 */
export function detectInverseClusters(draw) {
  const results = [];
  const n = draw.length;

  const areAdj = (n1, n2) => {
    const r1 = Math.floor((n1 - 1) / GRID_SIZE);
    const c1 = (n1 - 1) % GRID_SIZE;
    const r2 = Math.floor((n2 - 1) / GRID_SIZE);
    const c2 = (n2 - 1) % GRID_SIZE;
    return Math.abs(r1 - r2) <= 1 && Math.abs(c1 - c2) <= 1 && (r1 !== r2 || c1 !== c2);
  };

  const areOrtho = (n1, n2) => {
    const r1 = Math.floor((n1 - 1) / GRID_SIZE);
    const c1 = (n1 - 1) % GRID_SIZE;
    const r2 = Math.floor((n2 - 1) / GRID_SIZE);
    const c2 = (n2 - 1) % GRID_SIZE;
    return (r1 === r2 && Math.abs(c1 - c2) === 1) || (c1 === c2 && Math.abs(r1 - r2) === 1);
  };

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const A = draw[i];
      const B = draw[j];

      for (let M = 1; M <= 49; M++) {
        const configs = [
          { type: 'addition', s1: A - M, s2: B - M },
          { type: 'multiplication', s1: A % M === 0 ? A / M : -1, s2: B % M === 0 ? B / M : -1 }
        ];

        configs.forEach(cfg => {
          const { s1, s2, type } = cfg;
          if (s1 >= 1 && s1 <= 49 && s2 >= 1 && s2 <= 49 && s1 !== s2 && s1 !== M && s2 !== M) {
            if (areAdj(M, s1) && areAdj(M, s2)) {
              results.push({
                pair: [A, B].sort((a, b) => a - b),
                seed: [M, s1, s2].sort((a, b) => a - b),
                middle: M,
                type,
                isOrtho: areOrtho(M, s1) && areOrtho(M, s2)
              });
            }
          }
        });
      }
    }
  }

  // Deduplicate
  const unique = [];
  results.forEach(res => {
    const key = `${res.pair.join(',')}-${res.seed.join(',')}`;
    if (!unique.some(u => `${u.pair.join(',')}-${u.seed.join(',')}` === key)) {
      unique.push(res);
    }
  });

  return unique;
}
