import AppShell from "@/components/AppShell";
import { Rocket, Database, Network } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <AppShell>
      <div className="space-y-8">
        <section className="text-center">
          <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent mb-4">
            Welcome to the Cosmic Experience
          </h2>
          <p className="text-purple-200/80 text-lg max-w-2xl mx-auto mb-6">
            A Next.js 14 application featuring a cosmic-themed interface with graph visualization
            capabilities powered by react-force-graph and state management with Zustand.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/library"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all hover:scale-105"
            >
              <Database className="h-5 w-5" />
              Manage Library
            </Link>
            <Link
              href="/graph"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-medium shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all hover:scale-105"
            >
              <Network className="h-5 w-5" />
              Explore Knowledge Graph
            </Link>
          </div>
        </section>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl bg-gradient-to-br from-purple-900/40 to-blue-900/30 backdrop-blur-sm border border-purple-500/20 p-6 shadow-lg shadow-purple-500/10 hover:shadow-purple-500/20 transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-lg bg-purple-500/20 p-3">
                <Rocket className="h-6 w-6 text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold text-purple-100">Next.js 14</h3>
            </div>
            <p className="text-purple-200/70">
              Built with the latest Next.js App Router, TypeScript, and modern React features for
              optimal performance.
            </p>
          </div>

          <div className="rounded-xl bg-gradient-to-br from-blue-900/40 to-cyan-900/30 backdrop-blur-sm border border-blue-500/20 p-6 shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-lg bg-blue-500/20 p-3">
                <Network className="h-6 w-6 text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-blue-100">Graph Visualization</h3>
            </div>
            <p className="text-blue-200/70">
              Powered by react-force-graph for stunning 2D and 3D network visualizations with
              interactive capabilities.
            </p>
          </div>

          <div className="rounded-xl bg-gradient-to-br from-pink-900/40 to-purple-900/30 backdrop-blur-sm border border-pink-500/20 p-6 shadow-lg shadow-pink-500/10 hover:shadow-pink-500/20 transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-lg bg-pink-500/20 p-3">
                <Database className="h-6 w-6 text-pink-400" />
              </div>
              <h3 className="text-xl font-semibold text-pink-100">State Management</h3>
            </div>
            <p className="text-pink-200/70">
              Simplified state management with Zustand for a clean and efficient data flow across
              your application.
            </p>
          </div>
        </div>

        <section className="rounded-xl bg-gradient-to-br from-purple-900/20 to-blue-900/10 backdrop-blur-sm border border-purple-500/20 p-8">
          <h3 className="text-2xl font-semibold text-purple-100 mb-4">Quick Start</h3>
          <div className="space-y-3 text-purple-200/80">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-purple-500/20 px-3 py-1 text-sm font-mono text-purple-300">
                1
              </div>
              <p>
                <code className="bg-purple-950/50 px-2 py-1 rounded text-purple-300">
                  npm run dev
                </code>{" "}
                - Start the development server
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-purple-500/20 px-3 py-1 text-sm font-mono text-purple-300">
                2
              </div>
              <p>
                <code className="bg-purple-950/50 px-2 py-1 rounded text-purple-300">
                  npm run build
                </code>{" "}
                - Build for production
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-purple-500/20 px-3 py-1 text-sm font-mono text-purple-300">
                3
              </div>
              <p>
                <code className="bg-purple-950/50 px-2 py-1 rounded text-purple-300">
                  npm run lint
                </code>{" "}
                - Run ESLint checks
              </p>
            </div>
          </div>
        </section>

        <section className="text-center space-y-4">
          <h3 className="text-xl font-semibold text-purple-100">Tech Stack</h3>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              "Next.js 14",
              "TypeScript",
              "Tailwind CSS",
              "React",
              "Zustand",
              "react-force-graph",
              "Lucide Icons",
              "ESLint",
              "Prettier",
            ].map((tech) => (
              <span
                key={tech}
                className="px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-200 text-sm"
              >
                {tech}
              </span>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
