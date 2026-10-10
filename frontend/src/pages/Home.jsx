import {
  Activity,
  ArrowRight,
  AudioWaveform,
  Brain,
  CheckCircle2,
  Mic,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { Link } from "react-router-dom";

export default function Home() {
  return (
    <main id="home">

      {/* =====================================================
          HERO
      ====================================================== */}

      <section className="relative min-h-screen overflow-hidden pt-20">

        {/* Background glow */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-20 h-125 w-125 -translate-x-1/2 rounded-full bg-cyan-400/10 blur-[140px]" />

          <div className="absolute right-0 top-1/3 h-87.5 w-87.5 rounded-full bg-blue-500/10 blur-[120px]" />
        </div>

        {/* Background grid */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.7) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.7) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        <div className="relative mx-auto grid min-h-[calc(100vh-64px)] max-w-7xl items-center gap-12 px-4 py-12 sm:min-h-[calc(100vh-80px)] sm:gap-16 sm:px-6 sm:py-20 lg:grid-cols-2 lg:px-8">

          {/* LEFT SIDE */}
          <div className="min-w-0">

            {/* Badge */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/5 px-3 py-2 sm:mb-7 sm:px-4">
              <Sparkles className="h-4 w-4 text-cyan-400" />

              <span className="text-xs font-semibold tracking-wide text-cyan-300">
                AI-ASSISTED VOICE ANALYSIS
              </span>
            </div>

            {/* Heading */}
            <h1 className="max-w-3xl break-words text-4xl font-bold leading-[1.08] tracking-tight text-white sm:text-6xl lg:text-7xl">
              Detecting Parkinson's
              <span className="mt-2 block text-cyan-400">
                through voice.
              </span>
            </h1>

            {/* Description */}
            <p className="mt-6 max-w-xl text-base leading-7 text-slate-400 sm:mt-7 sm:text-lg sm:leading-8">
              NeuroVoice analyzes voice characteristics using machine
              learning and deep learning techniques to estimate
              Parkinson's disease risk.
            </p>

            {/* Buttons */}
            <div className="mt-8 flex flex-col gap-3 sm:mt-9 sm:flex-row sm:gap-4">

              <Link
            to="/detect"
            className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 px-5 py-3.5 text-sm font-bold text-slate-950 transition hover:bg-cyan-300 sm:w-auto sm:px-6"
          >
            Start Voice Analysis
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
          </Link>
              

              <a
                href="#research"
                className="inline-flex w-full items-center justify-center rounded-xl border border-white/10 bg-white/3 px-5 py-3.5 text-sm font-medium text-slate-200 transition hover:bg-white/[0.07] sm:w-auto sm:px-6"
              >
                Explore Research
              </a>

            </div>

            {/* Features */}
            <div className="mt-8 flex flex-wrap gap-x-5 gap-y-3 sm:mt-9 sm:gap-x-6">

              <div className="flex items-center gap-2 text-sm text-slate-500">
                <ShieldCheck className="h-4 w-4 text-cyan-400" />
                Non-invasive
              </div>

              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Brain className="h-4 w-4 text-cyan-400" />
                ML-powered
              </div>

              <div className="flex items-center gap-2 text-sm text-slate-500">
                <AudioWaveform className="h-4 w-4 text-cyan-400" />
                Voice-based
              </div>

            </div>
          </div>

          {/* RIGHT SIDE */}
          <div className="relative min-w-0">

            {/* Glow */}
            <div className="absolute -inset-10 rounded-full bg-cyan-400/5 blur-3xl" />

            <div className="relative rounded-3xl border border-white/10 bg-white/[0.035] p-3 shadow-2xl backdrop-blur-xl sm:p-5">

              {/* Card header */}
              <div className="mb-6 flex items-center justify-between">

                <div>
                  <p className="text-sm font-semibold text-white">
                    Voice Signal
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Sustained vowel analysis
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10">
                  <Mic className="h-5 w-5 text-cyan-400" />
                </div>

              </div>

              {/* Waveform */}
              <div className="flex h-44 items-center justify-center gap-0.75 overflow-hidden rounded-2xl border border-white/5 bg-[#050d18] px-3 sm:h-60 sm:px-5">

                {Array.from({ length: 85 }).map((_, index) => {

                  const height =
                    15 +
                    Math.abs(Math.sin(index * 0.42) * 55) +
                    Math.abs(Math.sin(index * 0.13) * 25);

                  return (
                    <div
                      key={index}
                      className="w-0.75 rounded-full bg-cyan-400/70"
                      style={{
                        height: `${Math.min(height, 90)}%`,
                      }}
                    />
                  );
                })}

              </div>

              {/* Signal data */}
              <div className="mt-5 grid grid-cols-1 gap-3 min-[380px]:grid-cols-3">

                <div className="min-w-0 rounded-xl border border-white/5 bg-white/2.5 p-3 sm:p-4">
                  <p className="text-xs text-slate-500">
                    Duration
                  </p>

                  <p className="mt-1 text-sm font-semibold text-white">
                    1.5 sec
                  </p>
                </div>

                <div className="min-w-0 rounded-xl border border-white/5 bg-white/2.5 p-3 sm:p-4">
                  <p className="text-xs text-slate-500">
                    Signal
                  </p>

                  <p className="mt-1 text-sm font-semibold text-cyan-400">
                    Ready
                  </p>
                </div>

                <div className="min-w-0 rounded-xl border border-white/5 bg-white/2.5 p-3 sm:p-4">
                  <p className="text-xs text-slate-500">
                    Analysis
                  </p>

                  <p className="mt-1 text-sm font-semibold text-white">
                    AI
                  </p>
                </div>

              </div>
            </div>
          </div>
        </div>
      </section>


      {/* =====================================================
          HOW IT WORKS
      ====================================================== */}

      <section
        id="how-it-works"
        className="border-t border-white/5 py-20 sm:py-28"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

          <div className="max-w-2xl">

            <p className="text-sm font-bold tracking-[0.2em] text-cyan-400 uppercase">
              Methodology
            </p>

            <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              From voice signal to prediction
            </h2>

            <p className="mt-5 leading-7 text-slate-400">
              The system transforms a voice recording into measurable
              acoustic information and spectrogram representations before
              applying machine-learning models.
            </p>

          </div>

          {/* Steps */}
          <div className="mt-14 grid gap-5 md:grid-cols-5">

            {[
              {
                number: "01",
                title: "Record",
                text: "Capture a short voice sample.",
              },
              {
                number: "02",
                title: "Process",
                text: "Remove silence and unwanted noise.",
              },
              {
                number: "03",
                title: "Extract",
                text: "Calculate acoustic and spectral features.",
              },
              {
                number: "04",
                title: "Analyze",
                text: "Apply ML and CNN-based models.",
              },
              {
                number: "05",
                title: "Assess",
                text: "Generate a model-based risk result.",
              },
            ].map((step) => (

              <div
                key={step.number}
                className="group rounded-2xl border border-white/10 bg-white/2.5 p-6 transition duration-300 hover:-translate-y-1 hover:border-cyan-400/20 hover:bg-white/4.5"
              >

                <span className="text-sm font-bold text-cyan-400">
                  {step.number}
                </span>

                <h3 className="mt-8 text-lg font-semibold text-white">
                  {step.title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {step.text}
                </p>

              </div>

            ))}

          </div>
        </div>
      </section>


      {/* =====================================================
          RESEARCH
      ====================================================== */}

      <section
        id="research"
        className="border-t border-white/5 py-28"
      >
        <div className="mx-auto max-w-7xl px-6 lg:px-8">

          <div className="rounded-3xl border border-cyan-400/10 bg-cyan-400/2.5 p-8 sm:p-12">

            <div className="flex items-start gap-5">

              <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10 sm:flex">
                <Activity className="h-6 w-6 text-cyan-400" />
              </div>

              <div>

                <p className="text-sm font-bold tracking-[0.2em] text-cyan-400 uppercase">
                  Research Foundation
                </p>

                <h2 className="mt-4 max-w-3xl text-3xl font-bold text-white sm:text-4xl">
                  Voice characteristics can provide measurable signals
                  for Parkinson's research.
                </h2>

                <p className="mt-5 max-w-3xl leading-7 text-slate-400">
                  Our project is inspired by research investigating
                  machine-learning methods for distinguishing Parkinson's
                  disease from healthy controls using sustained vowel
                  recordings, acoustic features and spectrogram-based
                  deep learning.
                </p>

                {/* Research features */}
                <div className="mt-8 flex flex-wrap gap-3">

                  {[
                    "F0 / Pitch",
                    "Jitter",
                    "Shimmer",
                    "HNR",
                    "MFCC",
                    "Spectrograms",
                    "Transfer Learning",
                  ].map((item) => (

                    <span
                      key={item}
                      className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-slate-300"
                    >
                      {item}
                    </span>

                  ))}

                </div>

              </div>
            </div>
          </div>
        </div>
      </section>


      {/* =====================================================
          ABOUT / DISCLAIMER
      ====================================================== */}

      <section
        id="about"
        className="border-t border-white/5 py-20"
      >
        <div className="mx-auto max-w-4xl px-6 text-center">

          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-cyan-400/20 bg-cyan-400/10">
            <CheckCircle2 className="h-5 w-5 text-cyan-400" />
          </div>

          <h2 className="mt-5 text-xl font-semibold text-white">
            Academic Research Project
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-500">
            NeuroVoice is developed as an academic machine-learning
            project. Its predictions are experimental and are not intended
            to provide medical diagnosis or replace evaluation by a
            qualified healthcare professional.
          </p>

        </div>
      </section>

    </main>
  );
}