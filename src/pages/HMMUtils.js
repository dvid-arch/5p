/**
 * Hidden Markov Model (HMM) implementation for Lottery State Analysis
 * 
 * States:
 * 0: Dormant (Low resonance, high entropy)
 * 1: Structural (Algebraic bonds forming)
 * 2: Magnetic (High echo/stickiness)
 */
export class HMM {
    constructor(numStates = 3, numObservations = 4) {
        this.numStates = numStates;
        this.numObservations = numObservations;

        // Transition matrix A[i][j] = P(state j | state i)
        this.A = Array(numStates).fill().map(() => Array(numStates).fill(1 / numStates));

        // Emission matrix B[i][k] = P(observation k | state i)
        this.B = Array(numStates).fill().map(() => Array(numObservations).fill(1 / numObservations));

        // Initial state distribution Pi[i] = P(initial state i)
        this.Pi = Array(numStates).fill(1 / numStates);
    }

    /**
     * Train using Baum-Welch (Expectation-Maximization)
     * observations: sequence of discrete observations [0, 1, 2, 3]
     */
    train(observations, iterations = 20) {
        const T = observations.length;
        if (T < 2) return;

        for (let iter = 0; iter < iterations; iter++) {
            // 1. Forward procedure (Alpha)
            const alpha = Array(T).fill().map(() => Array(this.numStates).fill(0));
            for (let i = 0; i < this.numStates; i++) {
                alpha[0][i] = this.Pi[i] * this.B[i][observations[0]];
            }

            for (let t = 0; t < T - 1; t++) {
                for (let j = 0; j < this.numStates; j++) {
                    let sum = 0;
                    for (let i = 0; i < this.numStates; i++) {
                        sum += alpha[t][i] * this.A[i][j];
                    }
                    alpha[t + 1][j] = sum * this.B[j][observations[t + 1]];
                }
                // Normalize to prevent underflow
                const norm = alpha[t + 1].reduce((a, b) => a + b, 0);
                if (norm > 0) alpha[t + 1] = alpha[t + 1].map(v => v / norm);
            }

            // 2. Backward procedure (Beta)
            const beta = Array(T).fill().map(() => Array(this.numStates).fill(0));
            for (let i = 0; i < this.numStates; i++) beta[T - 1][i] = 1;

            for (let t = T - 2; t >= 0; t--) {
                for (let i = 0; i < this.numStates; i++) {
                    let sum = 0;
                    for (let j = 0; j < this.numStates; j++) {
                        sum += this.A[i][j] * this.B[j][observations[t + 1]] * beta[t + 1][j];
                    }
                    beta[t][i] = sum;
                }
                // Normalize
                const norm = beta[t].reduce((a, b) => a + b, 0);
                if (norm > 0) beta[t] = beta[t].map(v => v / norm);
            }

            // 3. Update Step (Gamma and Xi)
            const gamma = Array(T).fill().map(() => Array(this.numStates).fill(0));
            const xi = Array(T - 1).fill().map(() =>
                Array(this.numStates).fill().map(() => Array(this.numStates).fill(0))
            );

            for (let t = 0; t < T; t++) {
                let denom = 0;
                for (let i = 0; i < this.numStates; i++) denom += alpha[t][i] * beta[t][i];
                for (let i = 0; i < this.numStates; i++) gamma[t][i] = denom > 0 ? (alpha[t][i] * beta[t][i]) / denom : 0;
            }

            for (let t = 0; t < T - 1; t++) {
                let denom = 0;
                for (let i = 0; i < this.numStates; i++) {
                    for (let j = 0; j < this.numStates; j++) {
                        denom += alpha[t][i] * this.A[i][j] * this.B[j][observations[t + 1]] * beta[t + 1][j];
                    }
                }
                for (let i = 0; i < this.numStates; i++) {
                    for (let j = 0; j < this.numStates; j++) {
                        xi[t][i][j] = denom > 0 ? (alpha[t][i] * this.A[i][j] * this.B[j][observations[t + 1]] * beta[t + 1][j]) / denom : 0;
                    }
                }
            }

            // 4. M-Step: Re-estimate parameters
            for (let i = 0; i < this.numStates; i++) {
                this.Pi[i] = gamma[0][i];

                let denomA = 0;
                for (let t = 0; t < T - 1; t++) denomA += gamma[t][i];
                for (let j = 0; j < this.numStates; j++) {
                    let numA = 0;
                    for (let t = 0; t < T - 1; t++) numA += xi[t][i][j];
                    this.A[i][j] = denomA > 0 ? numA / denomA : 1 / this.numStates;
                }

                let denomB = 0;
                for (let t = 0; t < T; t++) denomB += gamma[t][i];
                for (let k = 0; k < this.numObservations; k++) {
                    let numB = 0;
                    for (let t = 0; t < T; t++) {
                        if (observations[t] === k) numB += gamma[t][i];
                    }
                    this.B[i][k] = denomB > 0 ? numB / denomB : 1 / this.numObservations;
                }
            }
        }
    }

    /**
     * Predict current state probability using Forward algorithm
     */
    predictStateProbabilities(observations) {
        const T = observations.length;
        if (T === 0) return this.Pi;

        let alpha = this.Pi.map((p, i) => p * this.B[i][observations[0]]);
        let norm = alpha.reduce((a, b) => a + b, 0);
        if (norm > 0) alpha = alpha.map(v => v / norm);

        for (let t = 1; t < T; t++) {
            let nextAlpha = Array(this.numStates).fill(0);
            for (let j = 0; j < this.numStates; j++) {
                let sum = 0;
                for (let i = 0; i < this.numStates; i++) {
                    sum += alpha[i] * this.A[i][j];
                }
                nextAlpha[j] = sum * this.B[j][observations[t]];
            }
            norm = nextAlpha.reduce((a, b) => a + b, 0);
            if (norm > 0) alpha = nextAlpha.map(v => v / norm);
            else alpha = nextAlpha;
        }

        return alpha;
    }
}

/**
 * Helper to convert draw features into discrete observations for HMM
 */
export function discretizeDraw(features) {
    const { bondIntensity, echoCount } = features;

    if (echoCount >= 3) return 2; // Magnetic State
    if (bondIntensity >= 2) return 1; // Structural State
    return 0; // Dormant State
}
