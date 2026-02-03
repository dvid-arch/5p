import { analyzeLotteryData } from './src/hooks/useLotteryAnalysis.js';
import { truestdata } from './src/constant/data.js';
import fs from 'fs';

async function exportTrainingData() {
    console.log("=== NEURAL DATA EXPORTER (JS -> PYTHON) ===");
    console.log(`Analyzing ${truestdata.length} draws...`);

    const samples = [];
    const LOOK_AHEAD = 5;

    const columns = [
        'draw_idx', 'number',
        'momentum', 'gap', 'markov', 'pattern', 'algebraic',
        'lag1', 'lag2', 'hmmState', 'resonance',
        'hit_in_5'
    ];

    for (let i = 100; i < truestdata.length - LOOK_AHEAD; i += 2) { // Sample every 2nd to keep file size reasonable
        if (i % 50 === 0) process.stdout.write(`\rProgress: ${i}/${truestdata.length - LOOK_AHEAD}...`);

        const slice = truestdata.slice(i).reverse();
        const analysis = analyzeLotteryData(slice);
        if (!analysis || !analysis.signals) continue;

        const sensors = analysis.signals;
        const futureDraws = truestdata.slice(i - LOOK_AHEAD, i);
        const lastDraw = slice[slice.length - 1].numbers || slice[slice.length - 1];
        const prevDraw = slice.length > 1 ? (slice[slice.length - 2].numbers || slice[slice.length - 2]) : [];

        for (let num = 1; num <= 49; num++) {
            const s = sensors[num];
            if (!s) continue;

            const hit = futureDraws.some(d => (d.numbers || d).includes(num)) ? 1 : 0;

            // Recalculate features used by trainer
            samples.push([
                i, num,
                (s.velocity - 0.5).toFixed(4),
                s.gap.toFixed(4),
                s.markov.toFixed(4),
                s.pattern.toFixed(4),
                0, // Algebraic placeholder (engine uses local var)
                lastDraw.includes(num) ? 1 : 0,
                prevDraw.includes(num) ? 1 : 0,
                s.hmmState.toFixed(4),
                s.resonance,
                hit
            ]);
        }
    }

    console.log(`\nCollected ${samples.length} samples.`);
    const csvContent = [columns.join(','), ...samples.map(row => row.join(','))].join('\n');
    fs.writeFileSync('neural_training_data.csv', csvContent);
    console.log("✅ Exported to neural_training_data.csv");
}

exportTrainingData();
