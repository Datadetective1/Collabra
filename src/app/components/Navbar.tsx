"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState, useRef, useEffect } from "react";

export default function Navbar() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">C</span>
            </div>
            <span className="text-xl font-bold text-gray-900">Collabra</span>
          </Link>

          {session ? (
            <div className="flex items-center gap-6">
              <div className="hidden md:flex items-center gap-5">
                <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 text-sm font-medium">
                  Dashboard
                </Link>
                <Link href="/explore" className="text-gray-600 hover:text-gray-900 text-sm font-medium">
                  Explore
                </Link>
                <Link href="/marketplace" className="text-gray-600 hover:text-gray-900 text-sm font-medium">
                  Marketplace
                </Link>
                <Link href="/bounties" className="text-gray-600 hover:text-gray-900 text-sm font-medium">
                  Bounties
                </Link>
                <Link href="/messages" className="text-gray-600 hover:text-gray-900 text-sm font-medium">
                  Messages
                </Link>
                {/* More dropdown */}
                <div className="relative" ref={moreRef}>
                  <button
                    onClick={() => setMoreOpen(!moreOpen)}
                    className="text-gray-600 hover:text-gray-900 text-sm font-medium flex items-center gap-1"
                  >
                    More
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {moreOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                      <Link href="/problems" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setMoreOpen(false)}>Problems</Link>
                      <Link href="/showcase" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setMoreOpen(false)}>Showcase</Link>
                      <Link href="/talent" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setMoreOpen(false)}>Talent</Link>
                      <Link href="/organizations" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setMoreOpen(false)}>Organizations</Link>
                      <Link href="/hosting" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setMoreOpen(false)}>Hosting</Link>
                      <hr className="my-1 border-gray-100" />
                      <Link href="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setMoreOpen(false)}>Profile</Link>
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Sign out
              </button>
              <button
                className="md:hidden text-gray-600"
                onClick={() => setMenuOpen(!menuOpen)}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Link href="/showcase" className="text-sm text-gray-600 hover:text-gray-900">Showcase</Link>
              <Link href="/marketplace" className="text-sm text-gray-600 hover:text-gray-900">Marketplace</Link>
              <Link href="/bounties" className="text-sm text-gray-600 hover:text-gray-900">Bounties</Link>
              <Link href="/talent" className="text-sm text-gray-600 hover:text-gray-900">Talent</Link>
              <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900">Sign in</Link>
              <Link href="/register" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700">
                Join with Invite
              </Link>
            </div>
          )}
        </div>

        {menuOpen && session && (
          <div className="md:hidden pb-4 space-y-2">
            <Link href="/dashboard" className="block text-gray-600 hover:text-gray-900 text-sm py-1">Dashboard</Link>
            <Link href="/explore" className="block text-gray-600 hover:text-gray-900 text-sm py-1">Explore</Link>
            <Link href="/marketplace" className="block text-gray-600 hover:text-gray-900 text-sm py-1">Marketplace</Link>
            <Link href="/bounties" className="block text-gray-600 hover:text-gray-900 text-sm py-1">Bounties</Link>
            <Link href="/messages" className="block text-gray-600 hover:text-gray-900 text-sm py-1">Messages</Link>
            <Link href="/problems" className="block text-gray-600 hover:text-gray-900 text-sm py-1">Problems</Link>
            <Link href="/showcase" className="block text-gray-600 hover:text-gray-900 text-sm py-1">Showcase</Link>
            <Link href="/talent" className="block text-gray-600 hover:text-gray-900 text-sm py-1">Talent</Link>
            <Link href="/organizations" className="block text-gray-600 hover:text-gray-900 text-sm py-1">Organizations</Link>
            <Link href="/hosting" className="block text-gray-600 hover:text-gray-900 text-sm py-1">Hosting</Link>
            <Link href="/profile" className="block text-gray-600 hover:text-gray-900 text-sm py-1">Profile</Link>
          </div>
        )}
      </div>
    </nav>
  );
}
