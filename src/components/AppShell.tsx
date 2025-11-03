"use client";

import { useState } from "react";
import { Menu, X, Sparkles } from "lucide-react";
import classNames from "classnames";

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="relative min-h-screen">
      <div className="cosmic-bg" />

      <div className="relative flex h-screen overflow-hidden">
        <aside
          className={classNames(
            "fixed inset-y-0 left-0 z-50 w-64 transform bg-gradient-to-b from-purple-900/30 to-blue-900/20 backdrop-blur-xl border-r border-purple-500/20 transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0",
            {
              "translate-x-0": sidebarOpen,
              "-translate-x-full": !sidebarOpen,
            }
          )}
        >
          <div className="flex h-full flex-col">
            <div className="flex h-16 items-center justify-between border-b border-purple-500/20 px-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-purple-400" />
                <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                  Cosmic
                </span>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden text-purple-300 hover:text-purple-100 transition-colors"
                aria-label="Close sidebar"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto p-4">
              <div className="space-y-2">
                <a
                  href="/"
                  className="block px-4 py-2 rounded-lg text-purple-300 hover:bg-purple-500/10 transition-colors"
                >
                  Home
                </a>
                <a
                  href="/library"
                  className="block px-4 py-2 rounded-lg text-purple-300 hover:bg-purple-500/10 transition-colors"
                >
                  Library
                </a>
                <a
                  href="/graph"
                  className="block px-4 py-2 rounded-lg bg-purple-500/10 text-purple-200 hover:bg-purple-500/20 transition-colors"
                >
                  Knowledge Graph
                </a>
                <a
                  href="/library-test"
                  className="block px-4 py-2 rounded-lg text-purple-300 hover:bg-purple-500/10 transition-colors"
                >
                  Library Test
                </a>
              </div>
            </nav>

            <div className="border-t border-purple-500/20 p-4">
              <p className="text-xs text-purple-400/60 text-center">Cosmic App v0.1.0</p>
            </div>
          </div>
        </aside>

        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        <div className="flex flex-1 flex-col overflow-hidden">
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-purple-500/20 bg-gradient-to-r from-purple-900/30 to-blue-900/20 backdrop-blur-xl px-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-purple-300 hover:text-purple-100 transition-colors"
              aria-label="Open sidebar"
            >
              <Menu className="h-6 w-6" />
            </button>

            <div className="flex items-center gap-4">
              <h1 className="text-lg font-semibold text-purple-100">Welcome to the Cosmos</h1>
            </div>

            <div className="flex items-center gap-2">
              <button className="rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 transition-all">
                Get Started
              </button>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
