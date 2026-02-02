const fs = require('fs');
const path = require('path');

// Read data.js and extract the array
const dataPath = path.join(__dirname, 'src', 'constant', 'data.js');
const dataContent = fs.readFileSync(dataPath, 'utf8');
const arrayMatch = dataContent.match(/export const truestdata = (\[[\s\S]*\]);/);
if (!arrayMatch) {
    console.error("Could not find truestdata in data.js");
    process.exit(1);
}

// Clean up trailing commas that JS might not like in JSON.parse (but eval will handle)
// The data is a valid JS array literal, so eval is safest for a quick analysis script
const truestdata = eval(arrayMatch[1]);

function detectAlgebraicBonds(numbers) {
    const sorted = [...numbers].sort((a, b) => a - b);
    const n = sorted.length;
    const bonds = [];
    const numSet = new Set(sorted);

    for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
            const sum = sorted[i] + sorted[j];
            const product = sorted[i] * sorted[j];

            if (sum <= 49 && numSet.has(sum)) {
                bonds.push({ type: "addition", a: sorted[i], b: sorted[j], result: sum });
            }
            if (product <= 49 && numSet.has(product)) {
                bonds.push({ type: "multiplication", a: sorted[i], b: sorted[j], result: product });
            }
        }
    }
    return bonds;
}

// Calculate frequency
let weeksWithBonds = 0;
let totalBonds = 0;
const activeWeeks = truestdata.filter(d => d && d.length > 0);

activeWeeks.forEach(draw => {
    const bonds = detectAlgebraicBonds(draw);
    if (bonds.length > 0) weeksWithBonds++;
    totalBonds += bonds.length;
});

const freq = (weeksWithBonds / activeWeeks.length * 100).toFixed(1);

console.log(`Frequency: ${freq}% of active weeks contain at least one Algebraic Bond.`);
console.log(`Average Bonds per Week: ${(totalBonds / activeWeeks.length).toFixed(2)}`);

// Chase Logic: If A, B appear but NOT C, does C appear in next 3-5 weeks?
let partialBonds = 0;
let resolution3Weeks = 0;
let resolution5Weeks = 0;

for (let i = 0; i < truestdata.length - 5; i++) {
    const draw = truestdata[i];
    if (!draw || draw.length === 0) continue;

    const numSet = new Set(draw);

    for (let aIdx = 0; aIdx < draw.length; aIdx++) {
        for (let bIdx = aIdx + 1; bIdx < draw.length; bIdx++) {
            const a = draw[aIdx];
            const b = draw[bIdx];

            // Mult Partial
            const prod = a * b;
            if (prod > 2 && prod <= 49 && !numSet.has(prod)) {
                partialBonds++;
                if ([1, 2, 3].some(offset => truestdata[i + offset]?.includes(prod))) resolution3Weeks++;
                if ([1, 2, 3, 4, 5].some(offset => truestdata[i + offset]?.includes(prod))) resolution5Weeks++;
            }

            // Add Partial
            const sum = a + b;
            if (sum <= 49 && !numSet.has(sum)) {
                partialBonds++;
                if ([1, 2, 3].some(offset => truestdata[i + offset]?.includes(sum))) resolution3Weeks++;
                if ([1, 2, 3, 4, 5].some(offset => truestdata[i + offset]?.includes(sum))) resolution5Weeks++;
            }
        }
    }
}

console.log(`Chase Resolution (3 weeks): ${(resolution3Weeks / partialBonds * 100).toFixed(1)}%`);
console.log(`Chase Resolution (5 weeks): ${(resolution5Weeks / partialBonds * 100).toFixed(1)}%`);
console.log(`Total active weeks analyzed: ${activeWeeks.length}`);
