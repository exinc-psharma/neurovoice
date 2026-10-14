import {
  Activity,
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Info,
  RotateCcw,
  ShieldAlert,
} from "lucide-react";

import {
  Link,
  useLocation,
} from "react-router-dom";

export default function Results() {
  const location = useLocation();

  const result = location.state?.result;

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
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-300"
          >
            <ArrowLeft className="h-4 w-4" />
            Start Analysis
          </Link>
        </div>
      </main>
    );
  }

  const probability =
    Number(result.probability_parkinsons) || 0;

  const percentage = (probability * 100).toFixed(1);

  const label = result.prediction_label || "Unknown";

  const isParkinsons = label.toLowerCase().includes("parkinson");

  // Neutral borderline band for probabilities between 0.40 and 0.60 inclusive
  const isBorderline = probability >= 0.40 && probability <= 0.60;

  const processingTime = result.processing_time_ms;

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
            Voice Pattern Results
          </h1>

          <p className="mt-4 text-sm text-slate-400">
            Statistical acoustic classification from your submitted sustained vowel sample.
          </p>
        </div>

        {/* Borderline Notice Banner (if score is between 0.40 and 0.60 inclusive) */}
        {isBorderline && (
          <div className="mt-8 rounded-3xl border border-amber-400/30 bg-amber-400/[0.05] p-5 sm:p-7">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-400/10 text-amber-400">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-bold text-amber-300">
                    Borderline result — interpretation uncertain
                  </h3>
                  <span className="rounded-full bg-amber-400/20 px-2.5 py-0.5 text-xs font-semibold text-amber-300">
                    Score: {percentage}%
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  The model's estimated probability for the Parkinson's pattern class ({percentage}%) falls within the neutral borderline zone (40.0% – 60.0%) surrounding the 50.0% decision threshold. In this range, acoustic features overlap between natural voice variations and mild dysarthric acoustic patterns, making algorithmic classification uncertain.
                </p>
                <p className="mt-2 text-xs leading-5 text-slate-400">
                  Notice: Repeating a recording is available below, but please note that repeating a recording does not guarantee a more accurate result. Factors such as microphone distance, natural pitch fluctuation, room acoustics, or vocal fatigue can affect measurements.
                </p>
                <div className="mt-4">
                  <Link
                    to="/detect"
                    className="inline-flex items-center gap-2 rounded-xl bg-amber-400/20 px-4 py-2.5 text-xs font-bold text-amber-200 transition hover:bg-amber-400/30"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Optionally Re-record Sample
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main result grid */}
        <div className="mt-8 grid gap-4 sm:mt-10 sm:gap-6 lg:grid-cols-2">
          {/* Prediction card */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-5 sm:p-8">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-sm text-slate-400">
                  Predicted Acoustic Category
                </p>
                <h2 className="mt-2 break-words text-2xl font-bold text-white">
                  {label}
                </h2>
              </div>

              {isParkinsons ? (
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-400/10">
                  <ShieldAlert className="h-6 w-6 text-amber-400" />
                </div>
              ) : (
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-cyan-400/10">
                  <CheckCircle2 className="h-6 w-6 text-cyan-400" />
                </div>
              )}
            </div>

            {/* Numerical probability output */}
            <div className="mt-10 text-center">
              <div className="text-5xl font-bold tracking-tight text-white sm:text-6xl">
                {percentage}%
              </div>

              <p className="mt-3 text-sm font-medium text-slate-300">
                Model's Estimated Probability for Parkinson's Class
              </p>

              <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-slate-500">
                Statistical probability generated by the classification model for the Parkinson's pattern class. This is an algorithmic score based on research data, not a clinically validated personal risk score or medical diagnosis.
              </p>
            </div>

            {/* Meter */}
            <div className="mt-8">
              <div className="h-3 overflow-hidden rounded-full bg-white/5">
                <div
                  className={`h-full rounded-full transition-all ${
                    isBorderline
                      ? "bg-amber-400"
                      : isParkinsons
                      ? "bg-amber-400"
                      : "bg-cyan-400"
                  }`}
                  style={{
                    width: `${Math.min(probability * 100, 100)}%`,
                  }}
                />
              </div>

              <div className="mt-2 flex justify-between text-[11px] text-slate-500">
                <span>0.0% (Lower match)</span>
                <span className="font-semibold text-slate-400">50.0% Threshold</span>
                <span>100.0% (Higher match)</span>
              </div>
            </div>
          </div>

          {/* Processing and details card */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-5 sm:p-8">
            <p className="text-sm text-slate-400">
              Technical Details
            </p>

            <h2 className="mt-2 text-2xl font-bold text-white">
              Analysis Breakdown
            </h2>

            <div className="mt-8 space-y-3">
              <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
                <p className="text-xs text-slate-500">
                  Classification Decision
                </p>
                <p className="mt-2 text-sm font-semibold text-white">
                  {label}
                </p>
              </div>

              <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
                <p className="text-xs text-slate-500">
                  Parkinson's-Class Probability Score
                </p>
                <p className="mt-2 text-sm font-semibold text-cyan-400">
                  {percentage}% ({probability.toFixed(4)})
                </p>
              </div>

              <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
                <div className="flex items-center gap-2">
                  <Clock3 className="h-4 w-4 text-slate-500" />
                  <p className="text-xs text-slate-500">
                    Inference Latency
                  </p>
                </div>
                <p className="mt-2 text-sm font-semibold text-white">
                  {processingTime ?? "—"} ms
                </p>
              </div>

              <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
                <p className="text-xs text-slate-500">
                  Evaluated Audio File
                </p>
                <p className="mt-2 truncate text-sm font-semibold text-white">
                  {result.filename || "Voice recording"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Model info card */}
        <div className="mt-6 rounded-3xl border border-cyan-400/10 bg-cyan-400/[0.025] p-5 sm:p-8">
          <div className="flex items-start gap-3">
            <Info className="mt-1 h-5 w-5 shrink-0 text-cyan-400" />
            <div>
              <p className="text-sm font-bold tracking-[0.18em] text-cyan-400 uppercase">
                Underlying Model Architecture
              </p>
              <h2 className="mt-2 text-xl font-semibold text-white">
                Exp C2 - Random Forest (ANOVA-F, d=4, k=20)
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400">
                The classification is generated from 20 acoustic features selected via ANOVA-F from a 100-feature space (including static, delta, and delta-delta MFCCs, spectral descriptors, and F0 pitch dynamics). An ensemble of 200 regularized decision trees (depth 4) with balanced class weighting provides calibrated probability estimates. The decision boundary is fixed at 0.50 based on training cross-validation.
              </p>
            </div>
          </div>
        </div>

        {/* Mandatory Research & Regulatory Disclaimer */}
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.02] p-6 text-center">
          <p className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
            Educational & Research Prototype Disclaimer
          </p>
          <p className="mx-auto mt-2 max-w-4xl text-xs leading-6 text-slate-400">
            NeuroVoice is an educational and research prototype demonstration exploring acoustic speech patterns. It is NOT a medical device, diagnostic system, or clinical screening instrument. It does not provide medical diagnoses or personal health risk assessments. Clinical diagnosis of Parkinson's disease requires comprehensive, in-person neurological examination by licensed healthcare professionals.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            to="/detect"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 px-6 py-3.5 text-sm font-bold text-slate-950 transition hover:bg-cyan-300 sm:w-auto"
          >
            <RotateCcw className="h-4 w-4" />
            Analyze Another Recording
          </Link>
        </div>
      </div>
    </main>
  );
}