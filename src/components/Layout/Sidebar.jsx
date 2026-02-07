import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    Home,
    BarChart3,
    Search,
    MessageSquare,
    Settings,
    ChevronRight,
    TrendingUp,
    BrainCircuit,
    LayoutDashboard,
    Calculator,
    Grid3x3
} from 'lucide-react';

const SidebarItem = ({ icon: Icon, label, path, active, collapsed }) => (
    <Link
        to={path}
        className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group ${active
            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
            : 'hover:bg-gray-100 text-gray-500 hover:text-blue-600'
            }`}
    >
        <Icon size={22} className={active ? 'text-white' : 'group-hover:scale-110 transition-transform'} />
        {!collapsed && <span className="font-medium whitespace-nowrap">{label}</span>}
        {active && !collapsed && <ChevronRight size={16} className="ml-auto" />}
    </Link>
);

const Sidebar = ({ collapsed }) => {
    const location = useLocation();
    const [isAdmin, setIsAdmin] = React.useState(true); // Default to true for current user

    const menuItems = isAdmin ? [
        { icon: LayoutDashboard, label: 'Main Dashboard', path: '/' },
        { icon: Home, label: 'Institutional Analytics', path: '/adanal' },
        { icon: Search, label: 'Pattern Explorer', path: '/analysis' },
        { icon: Grid3x3, label: 'Grid Predictor', path: '/grid-predictor' },
        { icon: TrendingUp, label: 'Professional Chase', path: '/professional-chase' },
        { icon: Calculator, label: 'Algebraic Bonds', path: '/algebraic' },
        { icon: BrainCircuit, label: 'AI Engine', path: '/Canal' },
    ] : [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
        { icon: Home, label: 'Capital Growth Hub', path: '/predictions' },
    ];

    return (
        <div className={`flex flex-col h-full bg-white border-r border-gray-200 transition-all duration-300 ${collapsed ? 'w-20' : 'w-64'}`}>
            <div className="p-6">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-600 p-2 rounded-lg">
                            <TrendingUp size={24} className="text-white" />
                        </div>
                        {!collapsed && (
                            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                                WinGame 5P
                            </span>
                        )}
                    </div>
                </div>

                {!collapsed && (
                    <div className="mb-6 px-2">
                        <button
                            onClick={() => setIsAdmin(!isAdmin)}
                            className={`w-full flex items-center justify-between p-2 rounded-xl text-[10px] font-bold tracking-widest uppercase transition-all ${isAdmin ? 'bg-indigo-50 text-indigo-600' : 'bg-green-50 text-green-600'
                                }`}
                        >
                            <span>{isAdmin ? '🛡️ Admin Mode' : '👤 User Mode'}</span>
                            <div className={`w-8 h-4 rounded-full relative transition-colors ${isAdmin ? 'bg-indigo-600' : 'bg-green-500'}`}>
                                <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${isAdmin ? 'right-0.5' : 'left-0.5'}`} />
                            </div>
                        </button>
                    </div>
                )}

                <nav className="space-y-2">
                    {menuItems.map((item) => (
                        <SidebarItem
                            key={item.path}
                            {...item}
                            active={location.pathname === item.path}
                            collapsed={collapsed}
                        />
                    ))}
                </nav>
            </div>

            <div className="mt-auto p-6">
                {!collapsed && (
                    <div className="bg-gray-50 rounded-2xl p-4 mb-4">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Account Type</p>
                        <p className="text-sm font-bold text-gray-700">{isAdmin ? 'Administrator' : 'Free Member'}</p>
                    </div>
                )}
                <SidebarItem
                    icon={Settings}
                    label="Settings"
                    path="/settings"
                    active={location.pathname === '/settings'}
                    collapsed={collapsed}
                />
            </div>
        </div>
    );
};

export default Sidebar;
