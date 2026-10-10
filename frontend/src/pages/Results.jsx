import {
  Activity,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  RotateCcw,
  ShieldAlert,
} from "lucide-react";

import {
  Link,
  useLocation,
} from "react-router-dom";

export default function Results() {
  const location = useLocation();

  const result =
    location.state?.result;

  if (!result) {
    return (
      <main className="min-h-screen bg-[#07111f] px-6 pt-32">
        <div className="mx-auto max-w-3xl text-center">

          <h1 className="text-3xl font-bold text-white">
            No analysis found
          </h1>

          <p className="mt-4 text-slate-500">
            Please submit a voice sample before viewing results.
          </p>

          <Link
            to="/detect"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-6 py-3 text-sm font-bold text-slate-950"
          >
            <ArrowLeft className="h-4 w-4" />
            Start Analysis
          </Link>

        </div>
      </main>
    );
  }

  const probability =
    Number(
      result.probability_parkinsons
    ) || 0;

  const percentage =
    (probability * 100).toFixed(1);

  const label =
    result.prediction_label ||
    "Unknown";

  const isParkinsons =
    label.toLowerCase().includes(
      "parkinson"
    );

  const processingTime =
    result.processing_time_ms;

  return (
    <main className="min-h-screen bg-[#07111f] px-4 pb-16 pt-24 sm:px-6 sm:pb-20 sm:pt-32">

      <div className="mx-auto max-w-6xl">

        {/* Header */}
        <div className="text-center">

          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10">
            <Activity className="h-7 w-7 text-cyan-400" />
          </div>

          <p className="mt-6 text-sm font-bold tracking-[0.2em] text-cyan-400 uppercase">
            Analysis Complete
          </p>

          <h1 className="mt-4 text-3xl font-bold text-white sm:text-5xl">
            Voice Analysis Results
          </h1>

          <p className="mt-4 text-sm text-slate-500">
            Model-based classification from your submitted voice sample.
          </p>

        </div>

        {/* Main result */}
        <div className="mt-8 grid gap-4 sm:mt-12 sm:gap-6 lg:grid-cols-2">

          {/* Prediction */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-5 sm:p-8">

            <div className="flex items-center justify-between">

              <div className="min-w-0">
                <p className="text-sm text-slate-500">
                  Model Classification
                </p>

                <h2 className="mt-2 break-words text-2xl font-bold text-white">
                  {label}
                </h2>
              </div>

              {isParkinsons ? (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-400/10">
                  <ShieldAlert className="h-6 w-6 text-amber-400" />
                </div>
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cyan-400/10">
                  <CheckCircle2 className="h-6 w-6 text-cyan-400" />
                </div>
              )}

            </div>

            {/* Probability */}
            <div className="mt-12 text-center">

              <div className="text-5xl font-bold tracking-tight text-white sm:text-6xl">
                {percentage}%
              </div>

              <p className="mt-3 text-sm text-slate-500">
                Estimated Parkinson's-pattern probability
              </p>

            </div>

            {/* Meter */}
            <div className="mt-8">

              <div className="h-3 overflow-hidden rounded-full bg-white/5">

                <div
                  className="h-full rounded-full bg-cyan-400 transition-all"
                  style={{
                    width: `${Math.min(
                      probability * 100,
                      100
                    )}%`,
                  }}
                />

              </div>

              <div className="mt-2 flex justify-between text-[11px] text-slate-600">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>

            </div>

          </div>

          {/* Processing */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-5 sm:p-8">

            <p className="text-sm text-slate-500">
              Analysis Details
            </p>

            <h2 className="mt-2 text-2xl font-bold text-white">
              Processing Summary
            </h2>

            <div className="mt-8 space-y-3">

              <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">

                <p className="text-xs text-slate-600">
                  Prediction
                </p>

                <p className="mt-2 text-sm font-semibold text-white">
                  {label}
                </p>

              </div>

              <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">

                <p className="text-xs text-slate-600">
                  Parkinson's Probability
                </p>

                <p className="mt-2 text-sm font-semibold text-cyan-400">
                  {percentage}%
                </p>

              </div>

              <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">

                <div className="flex items-center gap-2">
                  <Clock3 className="h-4 w-4 text-slate-600" />

                  <p className="text-xs text-slate-600">
                    Processing Time
                  </p>
                </div>

                <p className="mt-2 text-sm font-semibold text-white">
                  {processingTime ?? "—"} ms
                </p>

              </div>

              <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">

                <p className="text-xs text-slate-600">
                  Input File
                </p>

                <p className="mt-2 truncate text-sm font-semibold text-white">
                  {result.filename || "Voice recording"}
                </p>

              </div>

            </div>

          </div>

        </div>

        {/* Model information */}
        <div className="mt-4 rounded-3xl border border-cyan-400/10 bg-cyan-400/[0.025] p-5 sm:mt-6 sm:p-8">

          <p className="text-sm font-bold tracking-[0.18em] text-cyan-400 uppercase">
            Research Model
          </p>

          <h2 className="mt-3 text-xl font-semibold text-white">
            Exp C1 — Logistic Regression with ANOVA-F
          </h2>

          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">
            The prediction is generated by the trained research
            pipeline after audio preprocessing and acoustic feature
            extraction.
          </p>

        </div>

        {/* Disclaimer */}
        <div className="mt-6 rounded-2xl border border-white/5 bg-white/[0.015] p-5 text-center">

          <p className="text-xs leading-6 text-slate-600">
            This result is produced by an academic research prototype.
            It is not a medical diagnosis and should not be used as a
            substitute for professional medical evaluation.
          </p>

        </div>

        {/* Actions */}
        <div className="mt-8 flex justify-center">

          <Link
            to="/detect"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 px-5 py-3.5 text-sm font-bold text-slate-950 transition hover:bg-cyan-300 sm:w-auto sm:px-6"
          >
            <RotateCcw className="h-4 w-4" />
            Analyze Another Recording
          </Link>

        </div>

      </div>
    </main>
  );
}