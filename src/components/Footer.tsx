"use client";

import Link from 'next/link';
import { BookOpen, Github, Twitter, Mail, Heart, Sparkles } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white mt-auto overflow-hidden">
      {/* Decorative Background */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-96 h-96 bg-purple-500 rounded-full filter blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500 rounded-full filter blur-3xl"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {/* Brand Section */}
          <div className="col-span-1 sm:col-span-2">
            <div className="flex items-center mb-4 group">
              <div className="bg-gradient-primary p-2 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                <BookOpen className="h-6 w-6 md:h-8 md:w-8 text-white" />
              </div>
              <span className="ml-3 text-xl md:text-2xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                ReviseAI
              </span>
            </div>
            <p className="text-slate-300 text-sm md:text-base mb-4 max-w-md leading-relaxed">
              AI-powered revision platform for students with PDF learning, quiz generation,
              and intelligent chatbot. Learn smarter, not harder. ✨
            </p>
            <div className="flex gap-3">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 md:p-2.5 glass-dark hover:bg-white/20 rounded-xl transition-all duration-300 hover:scale-110"
                aria-label="GitHub"
              >
                <Github className="h-4 w-4 md:h-5 md:w-5" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 md:p-2.5 glass-dark hover:bg-white/20 rounded-xl transition-all duration-300 hover:scale-110"
                aria-label="Twitter"
              >
                <Twitter className="h-4 w-4 md:h-5 md:w-5" />
              </a>
              <a
                href="mailto:support@reviseai.com"
                className="p-2 md:p-2.5 glass-dark hover:bg-white/20 rounded-xl transition-all duration-300 hover:scale-110"
                aria-label="Email"
              >
                <Mail className="h-4 w-4 md:h-5 md:w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-bold text-base md:text-lg mb-3 md:mb-4 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-300" />
              Quick Links
            </h3>
            <ul className="space-y-2">
              {[
                { href: '/dashboard', label: 'Dashboard' },
                { href: '/pdfs', label: 'My PDFs' },
                { href: '/quiz', label: 'Quizzes' },
                { href: '/progress', label: 'Progress' },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm md:text-base text-slate-300 hover:text-white hover:pl-2 transition-all duration-300 inline-block"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-bold text-base md:text-lg mb-3 md:mb-4 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-blue-300" />
              Resources
            </h3>
            <ul className="space-y-2">
              {[
                { href: '/help', label: 'Help Center' },
                { href: '/privacy', label: 'Privacy Policy' },
                { href: '/terms', label: 'Terms of Service' },
                { href: '/contact', label: 'Contact Us' },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm md:text-base text-slate-300 hover:text-white hover:pl-2 transition-all duration-300 inline-block"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 mt-6 md:mt-8 pt-6 md:pt-8 flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-0">
          <p className="text-slate-400 text-xs md:text-sm text-center sm:text-left">
            © {currentYear} ReviseAI. All rights reserved.
          </p>
          <p className="text-slate-400 text-xs md:text-sm flex items-center gap-1.5">
            Made with <Heart className="h-3 w-3 md:h-4 md:w-4 text-red-400 fill-current animate-pulse" /> for students worldwide
          </p>
        </div>
      </div>
    </footer>
  );
}
