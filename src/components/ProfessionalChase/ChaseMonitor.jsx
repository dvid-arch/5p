import { Link } from 'react-router-dom';
import { Layers, ArrowRight, Target, ShieldAlert, Calendar } from 'lucide-react';

const ChaseMonitor = ({ currentChases, fibo }) => {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {currentChases.length === 0 ? (
                    <div className="col-span-full bg-white p-12 rounded-3xl border border-dashed border-gray-200 flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 mb-4">
                            <Layers size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">No Active Chases Found</h3>
                        <p className="text-gray-500 max-w-xs mt-1">
                            The system is currently scanning historical patterns for new isolated clusters.
                        </p>
                    </div>
                ) : (
                    currentChases.map((chase, idx) => {
                        const nextStake = fibo[chase.step];
                        const totalRisk = chase.totalSpent;
                        const breakevenHit = (totalRisk * 1.5) / 11.5; // Approx hit needed at 11.5x odds
                        const progress = (chase.step / 27) * 100;
                        const age = chase.originIndex;

                        return (
                            <div key={idx} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                                <div className="p-6">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-3">
                                            <div className="flex -space-x-2">
                                                {chase.pair.map(num => (
                                                    <div key={num} className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold border-2 border-white shadow-sm">
                                                        {num}
                                                    </div>
                                                ))}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-900">Elite Pair Chase</h4>
                                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Origin: {chase.origin.join(', ')}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${chase.step > 20 ? 'bg-red-100 text-red-600' :
                                                chase.step > 10 ? 'bg-orange-100 text-orange-600' :
                                                    'bg-blue-100 text-blue-600'
                                                }`}>
                                                Step {chase.step} / 27
                                            </div>
                                            {chase.stats && (
                                                <div className={`text-[8px] font-black px-2 py-0.5 rounded-md uppercase tracking-tighter ${chase.stats.grade === 'Elite Alpha' ? 'bg-amber-100 text-amber-600 border border-amber-200' : 'bg-indigo-100 text-indigo-600 border border-indigo-200'}`}>
                                                    {chase.stats.label} • {chase.stats.winRate} WR
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 mb-4 text-[10px] font-bold text-gray-400 uppercase">
                                        <Calendar size={12} />
                                        Detected {age} Weeks Ago
                                    </div>

                                    <div className="grid grid-cols-3 gap-4 mb-6">
                                        <div className="p-3 bg-gray-50 rounded-2xl">
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Next Bet</p>
                                            <p className="text-lg font-bold text-gray-800">{nextStake.toLocaleString()}</p>
                                        </div>
                                        <div className="p-3 bg-gray-50 rounded-2xl">
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Total Spent</p>
                                            <p className="text-lg font-bold text-gray-800">{totalRisk.toLocaleString()}</p>
                                        </div>
                                        <div className="p-3 bg-gray-50 rounded-2xl">
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Reset @</p>
                                            <p className="text-lg font-bold text-green-600">{(totalRisk * 1.5).toLocaleString()}</p>
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                            <span>Chase Maturity</span>
                                            <span>{progress.toFixed(0)}%</span>
                                        </div>
                                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full transition-all duration-500 ${chase.step > 20 ? 'bg-red-500' :
                                                    chase.step > 10 ? 'bg-orange-500' :
                                                        'bg-blue-500'
                                                    }`}
                                                style={{ width: `${progress}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-gray-50 px-6 py-3 flex items-center justify-between border-t border-gray-100">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase">Target Odds: 11.5x</span>
                                    <Link
                                        to={`/one/truestdata/${chase.originIndex}/${chase.originFullDraw.join("-")}`}
                                        className="text-blue-600 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 hover:gap-2 transition-all"
                                    >
                                        View Cluster <ArrowRight size={12} />
                                    </Link>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Strategic Overview */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Target size={20} className="text-blue-600" />
                    Strategy Enforcement Logic
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3 p-4 bg-blue-50/50 rounded-2xl">
                        <div className="bg-blue-600 text-white p-1 rounded-md mt-0.5">
                            <ShieldAlert size={16} />
                        </div>
                        <div>
                            <p className="font-bold text-gray-800 text-sm">Profit Lock (50%)</p>
                            <p className="text-xs text-gray-500 leading-relaxed">
                                Resets ALL active seeds to Step 1 only if the win payout covers 100% of the total hole plus at least 50% profit.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3 p-4 bg-indigo-50/50 rounded-2xl">
                        <div className="bg-indigo-600 text-white p-1 rounded-md mt-0.5">
                            <Layers size={16} />
                        </div>
                        <div>
                            <p className="font-bold text-gray-800 text-sm">Staggered Fibo</p>
                            <p className="text-xs text-gray-500 leading-relaxed">
                                Sequence stalls every other step to keep the cumulative cap under 27k while maintaining a 27-week survival window.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChaseMonitor;
