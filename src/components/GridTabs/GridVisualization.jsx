import React from 'react';

const GridVisualization = ({
    activeCells = [],
    winningNumbers = [],
    center = null
}) => {
    // Generate 7x7 grid (1-49)
    const grid = Array.from({ length: 49 }, (_, i) => i + 1);

    return (
        <div className="flex flex-col items-center">
            <div className="grid grid-cols-7 gap-1 bg-gray-200 p-2 rounded-lg shadow-inner">
                {grid.map(num => {
                    const isWinner = winningNumbers.includes(num);
                    const isActive = activeCells.includes(num);
                    const isCenter = num === center;

                    let bgClass = "bg-white";
                    if (isWinner && isActive) bgClass = "bg-green-400 font-bold border-2 border-green-600";
                    else if (isWinner) bgClass = "bg-yellow-200 border-2 border-yellow-400";
                    else if (isCenter) bgClass = "bg-blue-500 text-white font-bold";
                    else if (isActive) bgClass = "bg-blue-100";

                    return (
                        <div
                            key={num}
                            className={`w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded text-sm sm:text-base cursor-default transition-all ${bgClass}`}
                            title={`Number ${num}`}
                        >
                            {num}
                        </div>
                    );
                })}
            </div>

            <div className="flex gap-4 mt-2 text-xs text-gray-600">
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-green-400 border border-green-600 rounded"></div>
                    <span>Caught</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-blue-500 rounded"></div>
                    <span>Center</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-blue-100 rounded"></div>
                    <span>Grid Area</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-yellow-200 border border-yellow-400 rounded"></div>
                    <span>Missed</span>
                </div>
            </div>
        </div>
    );
};

export default GridVisualization;
