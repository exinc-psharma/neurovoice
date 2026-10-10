import { Activity, GitFork, Menu, X } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  const closeMenu = () => setOpen(false);

  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-white/10 bg-[#07111f]/85 backdrop-blur-xl">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:h-20 sm:px-6 lg:px-8">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 sm:gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10 sm:h-10 sm:w-10">
            <Activity className="h-4 w-4 text-cyan-400 sm:h-5 sm:w-5" />
          </div>

          <div>
            <div className="text-base font-bold text-white">
              NeuroVoice
            </div>

            <div className="hidden text-[10px] font-medium tracking-[0.18em] text-slate-500 sm:block">
              VOICE INTELLIGENCE
            </div>
          </div>
        </Link>

        {/* Desktop navigation */}
        <div className="hidden items-center gap-8 md:flex">

          <Link
            to="/"
            className="text-sm text-slate-400 transition hover:text-white"
          >
            Home
          </Link>

          <a
            href="/#how-it-works"
            className="text-sm text-slate-400 transition hover:text-white"
          >
            How It Works
          </a>

          <a
            href="/#research"
            className="text-sm text-slate-400 transition hover:text-white"
          >
            Research
          </a>

          <a
            href="/#about"
            className="text-sm text-slate-400 transition hover:text-white"
          >
            About
          </a>

        </div>

        {/* Desktop actions */}
        <div className="hidden items-center gap-4 md:flex">

          <a
            href="https://github.com/AbhayPratap01"
            target="_blank"
            rel="noreferrer"
            className="text-slate-500 transition hover:text-white"
            aria-label="GitHub"
          >
            <GitFork className="h-5 w-5" />
          </a>

          <Link
            to="/detect"
            className="rounded-xl bg-cyan-400 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
          >
            Start Analysis
          </Link>

        </div>

        {/* Mobile menu */}
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="rounded-lg p-2 text-slate-300 md:hidden"
          aria-label="Toggle menu"
        >
          {open ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>

      </nav>

      {/* Mobile navigation */}
      {open && (
        <div className="border-t border-white/10 bg-[#07111f] px-4 py-5 md:hidden">
          <div className="flex flex-col gap-5">

            <Link
              to="/"
              onClick={closeMenu}
              className="text-sm text-slate-300"
            >
              Home
            </Link>

            <a
              href="/#how-it-works"
              onClick={closeMenu}
              className="text-sm text-slate-300"
            >
              How It Works
            </a>

            <a
              href="/#research"
              onClick={closeMenu}
              className="text-sm text-slate-300"
            >
              Research
            </a>

            <a
              href="/#about"
              onClick={closeMenu}
              className="text-sm text-slate-300"
            >
              About
            </a>

            <Link
              to="/detect"
              onClick={closeMenu}
              className="rounded-xl bg-cyan-400 px-5 py-3 text-center text-sm font-semibold text-slate-950"
            >
              Start Analysis
            </Link>

          </div>
        </div>
      )}
    </header>
  );
}