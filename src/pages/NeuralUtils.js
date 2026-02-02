/**
 * Simple Multi-Layer Perceptron (MLP) for Signal Intelligence
 */
class NeuralNetwork {
    constructor(inputNodes, hiddenNodes, outputNodes) {
        this.inputNodes = inputNodes;
        this.hiddenNodes = hiddenNodes;
        this.outputNodes = outputNodes;

        // Initialize weights with small random values
        this.weightsIH = Array(this.hiddenNodes).fill().map(() => Array(this.inputNodes).fill().map(() => Math.random() * 2 - 1));
        this.weightsHO = Array(this.outputNodes).fill().map(() => Array(this.hiddenNodes).fill().map(() => Math.random() * 2 - 1));

        // Biases
        this.biasH = Array(this.hiddenNodes).fill().map(() => Math.random() * 2 - 1);
        this.biasO = Array(this.outputNodes).fill().map(() => Math.random() * 2 - 1);

        this.learningRate = 0.1;
    }

    sigmoid(x) {
        return 1 / (1 + Math.exp(-x));
    }

    sigmoidDerivative(x) {
        return x * (1 - x);
    }

    predict(inputArray) {
        // Feedforward
        // Hidden Layer
        let hidden = this.weightsIH.map((row, i) => {
            let sum = row.reduce((acc, weight, j) => acc + weight * inputArray[j], 0);
            return this.sigmoid(sum + this.biasH[i]);
        });

        // Output Layer
        let output = this.weightsHO.map((row, i) => {
            let sum = row.reduce((acc, weight, j) => acc + weight * hidden[j], 0);
            return this.sigmoid(sum + this.biasO[i]);
        });

        return { output, hidden };
    }

    train(inputArray, targetArray) {
        // 1. Feedforward
        const { output, hidden } = this.predict(inputArray);

        // 2. Calculate Output Error (Target - Output)
        const outputErrors = targetArray.map((target, i) => target - output[i]);

        // 3. Calculate Output Gradients
        const outputGradients = output.map((val, i) => {
            return outputErrors[i] * this.sigmoidDerivative(val) * this.learningRate;
        });

        // 4. Update Weights HO (Hidden -> Output)
        this.weightsHO = this.weightsHO.map((row, i) => {
            return row.map((weight, j) => {
                return weight + outputGradients[i] * hidden[j];
            });
        });

        // Update Output Biases
        this.biasO = this.biasO.map((bias, i) => bias + outputGradients[i]);

        // 5. Calculate Hidden Layer Errors
        const hiddenErrors = Array(this.hiddenNodes).fill(0).map((_, j) => {
            return this.weightsHO.reduce((acc, row, i) => acc + row[j] * outputErrors[i], 0);
        });

        // 6. Calculate Hidden Gradients
        const hiddenGradients = hidden.map((val, i) => {
            return hiddenErrors[i] * this.sigmoidDerivative(val) * this.learningRate;
        });

        // 7. Update Weights IH (Input -> Hidden)
        this.weightsIH = this.weightsIH.map((row, i) => {
            return row.map((weight, j) => {
                return weight + hiddenGradients[i] * inputArray[j];
            });
        });

        // Update Hidden Biases
        this.biasH = this.biasH.map((bias, i) => bias + hiddenGradients[i]);

        // Return MSE for logging
        return outputErrors.reduce((acc, err) => acc + err * err, 0) / outputErrors.length;
    }
}

/**
 * SignalTrainer: Manages training lifecycle for lottery signals
 */
export class SignalTrainer {
    constructor() {
        this.models = {}; // One model per number for fine-tuning
        this.lossHistory = [];
        this.isTraining = false;
        this.accuracy = 0;
    }

    trainAll(historicalData, sensorsPerDraw, numberRange, lookAheadWindow = 5) {
        this.isTraining = true;
        let totalLoss = 0;
        let samples = 0;

        // Initialize networks if needed
        for (let num = numberRange.min; num <= numberRange.max; num++) {
            if (!this.models[num]) {
                this.models[num] = new NeuralNetwork(8, 12, 1); // 8 inputs, 12 hidden, 1 output
            }
        }

        // Training Loops (Epochs)
        for (let epoch = 0; epoch < 20; epoch++) {
            totalLoss = 0;
            samples = 0;

            historicalData.forEach((draw, idx) => {
                // Look ahead for window hits
                const futureWindow = historicalData.slice(idx + 1, idx + 1 + lookAheadWindow);
                if (futureWindow.length === 0) return;

                const sensorsAtDraw = sensorsPerDraw[idx];
                if (!sensorsAtDraw) return;

                for (let num = numberRange.min; num <= numberRange.max; num++) {
                    const sensorFeatures = [
                        sensorsAtDraw[num]?.velocity || 0,
                        sensorsAtDraw[num]?.gap || 0,
                        sensorsAtDraw[num]?.markov || 0,
                        sensorsAtDraw[num]?.pattern || 0,
                        sensorsAtDraw[num]?.algebraic || 0,
                        sensorsAtDraw[num]?.lag1 || 0,
                        sensorsAtDraw[num]?.lag2 || 0,
                        sensorsAtDraw[num]?.hmmState || 0
                    ];

                    // Label is 1.0 if number hits ANYWHERE in the next 'lookAheadWindow' draws
                    const hitInWindow = futureWindow.some(d => (d.numbers || d).includes(num));
                    const label = hitInWindow ? [1.0] : [0.0];

                    totalLoss += this.models[num].train(sensorFeatures, label);
                    samples++;
                }
            });
        }

        this.lossHistory.push(totalLoss / Math.max(1, samples));
        this.isTraining = false;
        return this.models;
    }

    predict(num, sensorFeatures) {
        if (!this.models[num]) return 0.5;
        const result = this.models[num].predict(sensorFeatures);
        return result.output[0];
    }
}
