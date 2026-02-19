import React from 'react';

/**
 * Skip navigation link for keyboard and screen reader users.
 * Visible only on focus (Tab key).
 */
const SkipNavigation: React.FC = () => {
    return (
        <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[200] focus:px-4 focus:py-2 focus:bg-red-500 focus:text-white focus:rounded-xl focus:text-sm focus:font-bold focus:shadow-lg focus:outline-none"
            tabIndex={0}
        >
            Skip to main content
        </a>
    );
};

export default SkipNavigation;
