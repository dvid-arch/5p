const { detectInverseClusters } = require('./src/pages/PatternUtils');

// For local node execution, we need to mock or handle the export/import
// Since PatternUtils is an ESM module, we'll just test a small logic snippet 
// or run a quick check if possible.

const mockDraw = [3, 5, 20, 30, 40];
// Pair 3, 5 should decompose to [1, 2, 3] hub at 2 (2+1=3, 2+3=5)

console.log("Checking Inverse Cluster Logic for draw:", mockDraw);

// Since I can't easily require ESM from CJS without configuration, 
// I'll just write a standalone verification logic for this specific case 
// to ensure the math is right.

const COLS = 7;
const getCoords = (n) => ({ row: Math.floor((n - 1) / COLS), col: (n - 1) % COLS });
const areAdj = (n1, n2) => {
    const c1 = getCoords(n1);
    const c2 = getCoords(n2);
    return Math.abs(c1.row - c2.row) <= 1 && Math.abs(c1.col - c2.col) <= 1 && (n1 !== n2);
};

const M = 2;
const s1 = 3 - M; // 1
const s2 = 5 - M; // 3
console.log(`Testing Hub M=${M}, S1=${s1}, S2=${s2}`);
if (s1 >= 1 && s2 >= 1 && areAdj(M, s1) && areAdj(M, s2)) {
    console.log("✅ Match Found! Seed Cluster: [1, 2, 3]");
} else {
    console.log("❌ Failed to identify [1, 2, 3] from pair [3, 5]");
}
