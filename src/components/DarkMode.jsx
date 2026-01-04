import React, { useState, useEffect } from 'react';

const DarkModeToggle = () => {
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <button
      onClick={toggleDarkMode}
      className="p-2 rounded-full border border-slate-300/10 bg-gray-200 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600"
      aria-label="Toggle Dark Mode"
    >
      {darkMode ? (
        <svg
          className="w-6 h-6 text-yellow-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 3v1m0 16v1m8.66-8.66h1m-16 0h1m13.36-5.36l.71-.71m-12.72 12.72l.71-.71m0-12.72l-.71-.71m12.72 12.72l-.71-.71M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      ) : (
        <svg
          className="w-6 h-6 text-gray-800 dark:text-gray-200"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 3v1m0 16v1m8.66-8.66h1m-16 0h1m13.36-5.36l.71-.71m-12.72 12.72l.71-.71m0-12.72l-.71-.71m12.72 12.72l-.71-.71M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      )}
    </button>
  );
};

export default DarkModeToggle;
