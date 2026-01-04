import React from 'react';

// --- Configuration ---
const MAX_NUMBER = 49;
const ALL_NUMBERS = Array.from({ length: MAX_NUMBER }, (_, i) => i + 1);

// A reusable style helper for number cells
const numberCellStyle = (isHighlighted) => {
  const baseStyle = 'flex items-center justify-center font-semibold rounded-full transition-all duration-300';
  if (isHighlighted) {
    // Styles for selected numbers (pop-out effect)
    return `${baseStyle} w-11 h-11 bg-green-500 text-white border-2 border-green-400 shadow-lg z-10 transform scale-110`;
  }
  // Styles for default (unselected) numbers
  return `${baseStyle} w-10 h-10 bg-gray-200 text-gray-800 border border-gray-300 z-0`;
};

// ========== SHAPE COMPONENTS ==========

const CircularVisualizer = ({ numbers }) => {
  const radius = 130; // Increased radius to give numbers more space
  const containerSize = radius * 2 + 60;
  const angleStep = (2 * Math.PI) / MAX_NUMBER;

  return (
    <div
      className="relative"
      style={{ width: `${containerSize}px`, height: `${containerSize}px` }}
    >
      {ALL_NUMBERS.map((num, index) => {
        const isHighlighted = numbers.includes(num);
        const angle = angleStep * (index - (MAX_NUMBER / 4) + 1);
        const x = radius * Math.cos(angle) + radius + 30; // Centering offset
        const y = radius * Math.sin(angle) + radius + 30; // Centering offset

        return (
          <div
            key={num}
            className={numberCellStyle(isHighlighted)}
            style={{
              position: 'absolute',
              top: `${y}px`,
              left: `${x}px`,
              transform: isHighlighted ? 'translate(-50%, -50%) scale(1.1)' : 'translate(-50%, -50%)',
            }}
          >
            {num}
          </div>
        );
      })}
    </div>
  );
};

const RightAngledTriangleVisualizer = ({ numbers }) => {
  const rows = [];
  let currentNumber = 1;
  for (let rowNum = 1; currentNumber <= MAX_NUMBER; rowNum++) {
    const rowItems = [];
    for (let colNum = 0; colNum < rowNum && currentNumber <= MAX_NUMBER; colNum++) {
      const num = currentNumber;
      const isHighlighted = numbers.includes(num);
      rowItems.push(
        <div key={num} className={numberCellStyle(isHighlighted)}>
          {num}
        </div>
      );
      currentNumber++;
    }
    // Each row is a flex container, left-aligned
    rows.push(
      <div key={`row-${rowNum}`} className="flex justify-start gap-2 w-full">
        {rowItems}
      </div>
    );
  }
  return (
    // The main container stacks the rows vertically and aligns them to the start
    <div className="flex flex-col items-start gap-2 p-4">
      {rows}
    </div>
  );
};

const SquareVisualizer = ({ numbers }) => (
    <div className="grid grid-cols-7 gap-2 p-4">
        {ALL_NUMBERS.map((num) => {
            const isHighlighted = numbers.includes(num);
            return (
                <div key={num} className={numberCellStyle(isHighlighted)}>
                    {num}
                </div>
            );
        })}
    </div>
);


// ========== MAIN CARD COMPONENT ==========

const NumberVisualizerCard = ({ id, numbers, shape }) => {
  const sum = numbers.reduce((acc, curr) => acc + curr, 0);
  const length = numbers.length;

  const handleCopy = () => {
    navigator.clipboard.writeText(numbers.join(', '));
    alert('Numbers copied to clipboard!');
  };

  const renderShape = () => {
    switch (shape) {
      case 'right-angled-triangle':
        return <RightAngledTriangleVisualizer numbers={numbers} />;
      case 'square':
        return <SquareVisualizer numbers={numbers} />;
      case 'circle':
      default:
        return <CircularVisualizer numbers={numbers} />;
    }
  };

  return (
    <div className="bg-gray-800 text-white rounded-lg shadow-2xl p-4 flex flex-col items-center">
      {/* Header */}
      <div className="w-full flex justify-between items-center mb-4 px-2">
        <div className="font-mono text-sm sm:text-base">
          <span className="font-bold">No: {id}</span>
          <span className="ml-3">Sum: <span className="font-bold">{sum}</span></span>
          <span className="ml-3">Len: <span className="font-bold">{length}</span></span>
        </div>
        <button
          onClick={handleCopy}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md transition-colors text-xs sm:text-sm"
        >
          Copy
        </button>
      </div>

      {/* Visualization Area */}
      <div className="bg-white rounded-md w-full flex justify-center items-center">
        {renderShape()}
      </div>
    </div>
  );
};

export default NumberVisualizerCard;