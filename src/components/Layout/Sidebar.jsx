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
    BrainCircuit
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

    const menuItems = [
        { icon: Home, label: 'Dashboard', path: '/' },
        { icon: BarChart3, label: 'Advanced Analysis', path: '/adanal' },
        { icon: Search, label: 'Pattern Explorer', path: '/analysis' },
        { icon: BrainCircuit, label: 'AI Analysis', path: '/Canal' },
        { icon: MessageSquare, label: 'AI Assistant', path: '/chatai' },
    ];

    return (
        <div className={`flex flex-col h-full bg-white border-r border-gray-200 transition-all duration-300 ${collapsed ? 'w-20' : 'w-64'}`}>
            <div className="p-6">
                <div className="flex items-center gap-3 mb-8">
                    <div className="bg-blue-600 p-2 rounded-lg">
                        <TrendingUp size={24} className="text-white" />
                    </div>
                    {!collapsed && (
                        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                            WinGame 5P
                        </span>
                    )}
                </div>

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
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Support</p>
                        <p className="text-sm text-gray-600">Need help with predictions? Check our guide.</p>
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
