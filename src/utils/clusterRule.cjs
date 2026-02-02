/**
 * Cluster Rule Logic
 * 
 * 1. Spatially connected group of 3 numbers on a 7-column grid.
 * 2. This group must be isolated (none of the 3 touch any other numbers in the draw).
 * 3. One number is the "Middle Number" (hub).
 * 4. Operations (+, *) between Middle and Siblings must yield exactly 2 unique valid numbers [1, 49].
 */

const COLS = 7;
const MAX_NUM = 49;

function getCoords(n) {
    const row = Math.floor((n - 1) / COLS);
    const col = (n - 1) % COLS;
    return { row, col };
}

function areAdjacent(n1, n2) {
    const c1 = getCoords(n1);
    const c2 = getCoords(n2);
    const dRow = Math.abs(c1.row - c2.row);
    const dCol = Math.abs(c1.col - c2.col);
    return dRow <= 1 && dCol <= 1 && (dRow + dCol > 0);
}

// Helper for orthogonal adjacency
const areOrtho = (n1, n2) => {
    const c1 = getCoords(n1);
    const c2 = getCoords(n2);
    return (c1.row === c2.row && Math.abs(c1.col - c2.col) === 1) ||
        (c1.col === c2.col && Math.abs(c1.row - c2.row) === 1);
};

/**
 * Identifies if 3 numbers form a valid cluster and returns the middle number and results.
 */
function checkCluster(threeNums, fullDraw) {
    if (threeNums.length !== 3) return null;

    // 1. Isolation Check: None of the 3 should touch any other number in fullDraw
    const others = fullDraw.filter(n => !threeNums.includes(n));
    for (const n of threeNums) {
        for (const o of others) {
            if (areAdjacent(n, o)) return null;
        }
    }

    // 2. Connectivity & Middle Candidate Evaluation
    const validHits = [];

    for (let idx = 0; idx < 3; idx++) {
        const mid = threeNums[idx];
        const sibs = threeNums.filter((_, sIdx) => sIdx !== idx);

        if (areAdjacent(mid, sibs[0]) && areAdjacent(mid, sibs[1])) {
            const plusSet = new Set();
            const multSet = new Set();

            sibs.forEach(s => {
                const sum = mid + s;
                const mul = mid * s;
                // Broadened: Include internal results (like 1+2=3) in the count
                if (sum >= 1 && sum <= MAX_NUM) plusSet.add(sum);
                if (mul >= 1 && mul <= MAX_NUM) multSet.add(mul);
            });

            if (plusSet.size === 2) {
                validHits.push({ middle: mid, sibs, predictions: [...plusSet].sort((a, b) => a - b), type: 'addition' });
            }
            if (multSet.size === 2) {
                validHits.push({ middle: mid, sibs, predictions: [...multSet].sort((a, b) => a - b), type: 'multiplication' });
            }
        }
    }

    if (validHits.length > 0) {
        // Selection Logic: 
        // 1. Identify best hub (prefer orthogonal branching)
        const hubs = [...new Set(validHits.map(h => h.middle))];
        let bestMid = hubs.find(m => {
            const sibs = threeNums.filter(t => t !== m);
            return areOrtho(m, sibs[0]) && areOrtho(m, sibs[1]);
        });
        if (!bestMid) bestMid = hubs[0];

        // Return all valid hits (Addition & Multiplication) for the chosen hub
        return validHits.filter(h => h.middle === bestMid);
    }

    return null;
}

/**
 * Finds all such clusters in a draw.
 */
function findClusters(draw) {
    const allResults = [];
    for (let i = 0; i < draw.length; i++) {
        for (let j = i + 1; j < draw.length; j++) {
            for (let k = j + 1; k < draw.length; k++) {
                const triple = [draw[i], draw[j], draw[k]];
                const clusterHits = checkCluster(triple, draw);
                if (clusterHits) {
                    allResults.push(...clusterHits);
                }
            }
        }
    }
    return allResults;
}

module.exports = {
    getCoords,
    areAdjacent,
    checkCluster,
    findClusters
};
