"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';
import { BookOpen, Menu, X } from 'lucide-react';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/pdfs', label: 'My PDFs' },
    { href: '/progress', label: 'Progress' },
    { href: '/quiz', label: 'Quizzes' },
  ];

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <>
      <nav className="sticky top-0 z-50 glass border-b shadow-lg backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 md:h-20">
            {/* Logo */}
            <Link href="/dashboard" className="flex items-center group">
              <div className="bg-gradient-primary p-2.5 rounded-xl shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                <BookOpen className="h-5 w-5 md:h-7 md:w-7 text-white" />
              </div>
              <span className="ml-2 md:ml-3 text-lg md:text-2xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 bg-clip-text text-transparent animate-pulse-slow">
                ReviseAI
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6 lg:gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm lg:text-base font-semibold transition-all duration-300 relative group px-3 py-2 ${
                    isActive(link.href)
                      ? 'text-purple-600'
                      : 'text-gray-700 hover:text-purple-600'
                  }`}
                >
                  {link.label}
                  <span
                    className={`absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-purple-600 to-blue-600 transform origin-left transition-transform duration-300 rounded-full ${
                      isActive(link.href) ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                    }`}
                  />
                </Link>
              ))}
            </div>

            {/* Desktop User Button */}
            <div className="hidden md:flex items-center gap-4">
              <div className="scale-110 hover:scale-125 transition-transform duration-300">
                <UserButton afterSignOutUrl="/" />
              </div>
            </div>

            {/* Mobile Menu Button & User */}
            <div className="flex md:hidden items-center gap-3">
              <div className="scale-100 hover:scale-110 transition-transform duration-300">
                <UserButton afterSignOutUrl="/" />
              </div>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-xl hover:bg-purple-50 active:bg-purple-100 transition-all duration-300 hover:scale-105"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6 text-purple-600" />
                ) : (
                  <Menu className="h-6 w-6 text-purple-600" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 space-y-2 mobile-menu-enter border-t border-purple-100">
              {navLinks.map((link, index) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  style={{ animationDelay: `${index * 50}ms` }}
                  className={`block px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 transform hover:translate-x-1 ${
                    isActive(link.href)
                      ? 'bg-gradient-primary text-white shadow-lg'
                      : 'text-gray-700 hover:bg-purple-50 hover:text-purple-600'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </>
  );
}
