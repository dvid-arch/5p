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

const truestdata = eval(arrayMatch[1]);
const activeWeeks = truestdata.filter(d => d && d.length > 0);

let totalPossibleRepeats = 0;
let actualRepeats = 0;
let totalPossibleRepeats2 = 0;
let actualRepeats2 = 0;

for (let i = 0; i < activeWeeks.length - 1; i++) {
    const current = new Set(activeWeeks[i]);
    const next = activeWeeks[i + 1];

    totalPossibleRepeats += current.size;
    next.forEach(num => {
        if (current.has(num)) {
            actualRepeats++;
        }
    });
}

for (let i = 0; i < activeWeeks.length - 2; i++) {
    const current = new Set(activeWeeks[i]);
    const nextNext = activeWeeks[i + 2];

    totalPossibleRepeats2 += current.size;
    nextNext.forEach(num => {
        if (current.has(num)) {
            actualRepeats2++;
        }
    });
}

const prob1 = (actualRepeats / totalPossibleRepeats * 100).toFixed(2);
const prob2 = (actualRepeats2 / totalPossibleRepeats2 * 100).toFixed(2);
const avgRepeatsPerWeek = (actualRepeats / (activeWeeks.length - 1)).toFixed(2);

console.log(`--- Echo Analysis ---`);
console.log(`1-Week Repeat Probability: ${prob1}%`);
console.log(`2-Week Repeat Probability: ${prob2}%`);
console.log(`Average repeats per week: ${avgRepeatsPerWeek}`);
console.log(`Random Random baseline (avg 5 numbers): ~10.2%`);
