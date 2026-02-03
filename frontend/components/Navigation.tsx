'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  label: string;
  href: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/', icon: '📊' },
  { label: 'Governance', href: '/governance', icon: '🏛️' },
  { label: 'Decisions', href: '/decisions', icon: '✅' },
  { label: 'Audit Trail', href: '/audit', icon: '📋' },
  { label: 'Policies', href: '/policies', icon: '⚙️' },
  { label: 'Settings', href: '/settings', icon: '⚡' },
];

export default function Navigation() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-dark-secondary border-b border-primary sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 flex-shrink-0">
            <span className="text-xl sm:text-2xl">🏛️</span>
            <span className="text-sm sm:text-xl font-bold gradient-text hidden sm:inline">
              AI-Med-Agent
            </span>
          </Link>

          {/* Desktop Nav Items */}
          <div className="hidden md:flex items-center space-x-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                  pathname === item.href
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-300 hover:bg-dark-tertiary hover:text-white'
                }`}
              >
                <span className="mr-1">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>

          {/* User Info - Desktop */}
          <div className="hidden sm:flex items-center space-x-3 flex-shrink-0">
            <div className="text-right text-xs">
              <p className="text-gray-300">Connected</p>
              <p className="text-indigo-400 font-medium">AWS</p>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-sm flex-shrink-0">
              <span>🔐</span>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-md text-gray-300 hover:bg-dark-tertiary hover:text-white flex-shrink-0"
            aria-label="Toggle menu"
          >
            <span className="text-xl">{mobileMenuOpen ? '✕' : '☰'}</span>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-3 space-y-1 border-t border-primary">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-3 rounded-md text-sm touch-target ${
                  pathname === item.href
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-300 hover:bg-dark-tertiary'
                }`}
              >
                {item.icon} {item.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
