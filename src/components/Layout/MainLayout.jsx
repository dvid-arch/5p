import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { Menu, X, Bell, User } from 'lucide-react';

const MainLayout = ({ children }) => {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            {/* Sidebar for Desktop */}
            <aside className="hidden md:flex">
                <Sidebar collapsed={sidebarCollapsed} />
            </aside>

            {/* Mobile Drawer */}
            <div
                className={`fixed inset-0 z-50 md:hidden transition-opacity duration-300 ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    }`}
            >
                <div className="absolute inset-0 bg-black/50" onClick={() => setIsMobileMenuOpen(false)} />
                <div
                    className={`absolute inset-y-0 left-0 w-64 bg-white transition-transform duration-300 transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
                        }`}
                >
                    <Sidebar collapsed={false} />
                </div>
            </div>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Top Header */}
                <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-8 flex-shrink-0">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
                        >
                            <Menu size={24} className="text-gray-600" />
                        </button>
                        <button
                            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                            className="hidden md:p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600"
                        >
                            {sidebarCollapsed ? <Menu size={20} /> : <X size={20} />}
                        </button>
                        <h2 className="text-lg font-semibold text-gray-800 hidden sm:block">
                            Lottery Intelligence Hub
                        </h2>
                    </div>

                    <div className="flex items-center gap-2 md:gap-4">
                        <button className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors relative">
                            <Bell size={20} />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                        </button>
                        <div className="h-8 w-px bg-gray-200 mx-2"></div>
                        <button className="flex items-center gap-2 p-1 pl-1 pr-3 hover:bg-gray-100 rounded-full transition-colors">
                            <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                                U
                            </div>
                            <span className="text-sm font-medium text-gray-700 hidden md:block">User Profile</span>
                        </button>
                    </div>
                </header>

                {/* Page Content */}
                <div className="flex-1 overflow-y-auto bg-gray-50">
                    <div className="p-4 md:p-8 max-w-[1600px] mx-auto">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default MainLayout;
