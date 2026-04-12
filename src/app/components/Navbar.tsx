"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";

export default function Navbar() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

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
              <div className="hidden md:flex items-center gap-6">
                <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 text-sm font-medium">
                  Dashboard
                </Link>
                <Link href="/problems" className="text-gray-600 hover:text-gray-900 text-sm font-medium">
                  Problems
                </Link>
                <Link href="/explore" className="text-gray-600 hover:text-gray-900 text-sm font-medium">
                  Explore
                </Link>
                <Link href="/profile" className="text-gray-600 hover:text-gray-900 text-sm font-medium">
                  Profile
                </Link>
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
              <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900">
                Sign in
              </Link>
              <Link
                href="/register"
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700"
              >
                Join with Invite
              </Link>
            </div>
          )}
        </div>

        {menuOpen && session && (
          <div className="md:hidden pb-4 space-y-2">
            <Link href="/dashboard" className="block text-gray-600 hover:text-gray-900 text-sm py-1">Dashboard</Link>
            <Link href="/problems" className="block text-gray-600 hover:text-gray-900 text-sm py-1">Problems</Link>
            <Link href="/explore" className="block text-gray-600 hover:text-gray-900 text-sm py-1">Explore</Link>
            <Link href="/profile" className="block text-gray-600 hover:text-gray-900 text-sm py-1">Profile</Link>
          </div>
        )}
      </div>
    </nav>
  );
}
