import AudioWaveform from "../components/AudioWaveforms";

import {
  ArrowLeft,
  AudioLines,
  Check,
  CircleAlert,
  FileAudio,
  Info,
  LoaderCircle,
  Mic,
  RotateCcw,
  Upload,
  Waves,
} from "lucide-react";

import { convertBlobToWav } from "../utils/audioUtils";
import { predictVoice } from "../services/api";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  useEffect,
  useRef,
  useState,
} from "react";

export default function Detection() {
  const navigate = useNavigate();

  /* -----------------------------
     Constants
  ------------------------------ */

  const MAX_RECORDING_TIME = 5;
  const MIN_RECORDING_TIME = 1.5;

  /* -----------------------------
     State
  ------------------------------ */

  const [mode, setMode] = useState("upload");

  const [isRecording, setIsRecording] =
    useState(false);

  const [isAnalyzing, setIsAnalyzing] =
    useState(false);

  const [microphoneStream, setMicrophoneStream] =
    useState(null);

  const [recordingTime, setRecordingTime] =
    useState(0);

  const [audioUrl, setAudioUrl] =
    useState(null);

  const [audioFile, setAudioFile] =
    useState(null);

  const [dragActive, setDragActive] =
    useState(false);

  const [error, setError] =
    useState("");

  /* -----------------------------
     Refs
  ------------------------------ */

  const mediaRecorderRef =
    useRef(null);

  const audioChunksRef =
    useRef([]);

  const timerRef =
    useRef(null);

  const recordingStartTimeRef =
    useRef(null);

  const fileInputRef =
    useRef(null);

  /* -----------------------------
     Recording timer
  ------------------------------ */

  useEffect(() => {
    if (!isRecording) {
      clearInterval(timerRef.current);
      return;
    }

    recordingStartTimeRef.current =
      Date.now();

    timerRef.current = setInterval(() => {
      if (!recordingStartTimeRef.current) {
        return;
      }

      const elapsed =
        (Date.now() -
          recordingStartTimeRef.current) /
        1000;

      const clampedElapsed =
        Math.min(
          elapsed,
          MAX_RECORDING_TIME
        );

      setRecordingTime(
        clampedElapsed
      );

      /* Automatically stop at 5 seconds */
      if (
        elapsed >=
        MAX_RECORDING_TIME
      ) {
        clearInterval(
          timerRef.current
        );

        if (
          mediaRecorderRef.current &&
          mediaRecorderRef.current
            .state !== "inactive"
        ) {
          mediaRecorderRef.current.stop();
        }

        setIsRecording(false);
      }
    }, 50);

    return () => {
      clearInterval(
        timerRef.current
      );
    };
  }, [isRecording]);

  /* -----------------------------
     Cleanup
  ------------------------------ */

  useEffect(() => {
    return () => {
      clearInterval(
        timerRef.current
      );

      if (audioUrl) {
        URL.revokeObjectURL(
          audioUrl
        );
      }

      if (
        microphoneStream
      ) {
        microphoneStream
          .getTracks()
          .forEach((track) =>
            track.stop()
          );
      }
    };
  }, [audioUrl, microphoneStream]);

  /* -----------------------------
     Format recording time
  ------------------------------ */

  const formatTime = (seconds) => {
    const safeSeconds =
      Math.min(
        Math.max(seconds, 0),
        MAX_RECORDING_TIME
      );

    const secondsPart =
      Math.floor(safeSeconds);

    const milliseconds =
      Math.floor(
        (safeSeconds % 1) * 10
      );

    return `00:${String(
      secondsPart
    ).padStart(2, "0")}.${milliseconds}`;
  };

  /* -----------------------------
     Start recording
  ------------------------------ */

  const startRecording =
    async () => {
      try {
        setError("");

        /*
         * Clean up any previous stream.
         */
        if (
          microphoneStream
        ) {
          microphoneStream
            .getTracks()
            .forEach((track) =>
              track.stop()
            );
        }

        /*
         * Request raw, unfiltered audio stream for acoustic voice feature analysis.
         * WebRTC speech filters (noise suppression, echo cancellation, auto gain)
         * can alter continuous vowel harmonics. If a browser/device rejects constraints,
         * fall back gracefully to default audio.
         */
        let stream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: false,
              noiseSuppression: false,
              autoGainControl: false,
            },
          });
        } catch (constraintErr) {
          if (
            constraintErr.name === "OverconstrainedError" ||
            constraintErr.name === "TypeError"
          ) {
            console.warn(
              "Microphone constraints rejected, falling back to default audio:",
              constraintErr
            );
            stream = await navigator.mediaDevices.getUserMedia({
              audio: true,
            });
          } else {
            throw constraintErr;
          }
        }

        setMicrophoneStream(stream);

        /*
         * Browser recording is normally
         * WebM/Opus.
         *
         * We convert it to WAV before
         * sending it to the Python backend.
         */
        let recorder;

        try {
          if (
            MediaRecorder.isTypeSupported(
              "audio/webm;codecs=opus"
            )
          ) {
            recorder =
              new MediaRecorder(
                stream,
                {
                  mimeType:
                    "audio/webm;codecs=opus",
                }
              );
          } else {
            recorder =
              new MediaRecorder(
                stream
              );
          }
        } catch {
          recorder =
            new MediaRecorder(
              stream
            );
        }

        mediaRecorderRef.current =
          recorder;

        audioChunksRef.current =
          [];

        recorder.ondataavailable =
          (event) => {
            if (
              event.data &&
              event.data.size > 0
            ) {
              audioChunksRef.current.push(
                event.data
              );
            }
          };

        recorder.onerror =
          (event) => {
            console.error(
              "MediaRecorder error:",
              event
            );

            setError(
              "An error occurred while recording your voice."
            );

            setIsRecording(
              false
            );

            clearInterval(
              timerRef.current
            );
          };

        recorder.onstop =
          () => {
            const elapsed =
              recordingStartTimeRef.current
                ? (Date.now() -
                    recordingStartTimeRef.current) /
                  1000
                : recordingTime;

            /*
             * Reject extremely short recordings.
             */
            if (
              elapsed <
              MIN_RECORDING_TIME
            ) {
              setError(
                "The recording is too short. Please record for at least 1.5 seconds."
              );

              stream
                .getTracks()
                .forEach((track) =>
                  track.stop()
                );

              setMicrophoneStream(
                null
              );

              setRecordingTime(
                0
              );

              recordingStartTimeRef.current =
                null;

              return;
            }

            const mimeType =
              recorder.mimeType ||
              "audio/webm";

            const blob =
              new Blob(
                audioChunksRef.current,
                {
                  type: mimeType,
                }
              );

            const url =
              URL.createObjectURL(
                blob
              );

            /*
             * Keep the browser recording
             * for preview.
             *
             * It will be converted to WAV
             * inside handleAnalyze().
             */
            setAudioUrl(url);

            setAudioFile(
              new File(
                [blob],
                "neurovoice-recording.webm",
                {
                  type: mimeType,
                }
              )
            );

            stream
              .getTracks()
              .forEach((track) =>
                track.stop()
              );

            setMicrophoneStream(
              null
            );

            recordingStartTimeRef.current =
              null;
          };

        recorder.start();

        setRecordingTime(
          0
        );

        setIsRecording(
          true
        );
      } catch (err) {
        console.error(
          "Microphone access error:",
          err
        );

        setIsRecording(
          false
        );

        setMicrophoneStream(
          null
        );

        let userMsg =
          "Microphone access was denied or is unavailable. Please allow microphone permission and try again.";
        if (
          err?.name === "NotAllowedError" ||
          err?.name === "PermissionDeniedError"
        ) {
          userMsg =
            "Microphone permission was denied. Please allow microphone access in your browser settings to record your voice.";
        } else if (
          err?.name === "NotFoundError" ||
          err?.name === "DevicesNotFoundError"
        ) {
          userMsg =
            "No microphone detected on your device. Please connect a microphone or use file upload.";
        } else if (
          err?.name === "NotReadableError" ||
          err?.name === "TrackStartError"
        ) {
          userMsg =
            "Your microphone is in use by another application. Please close other audio apps and try again.";
        }

        setError(userMsg);
      }
    };

  /* -----------------------------
     Stop recording
  ------------------------------ */

  const stopRecording =
    () => {
      clearInterval(
        timerRef.current
      );

      setIsRecording(
        false
      );

      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current
          .state !== "inactive"
      ) {
        mediaRecorderRef.current.stop();
      }
    };

  /* -----------------------------
     Handle uploaded file
  ------------------------------ */

  const handleFile = (
    file
  ) => {
    if (!file) {
      return;
    }

    setError("");

    /*
     * The backend accepts WAV directly.
     *
     * Other browser-supported audio formats
     * can still be selected because our
     * frontend converts them to WAV before
     * prediction.
     */
    const allowedExtensions = [
      ".wav",
      ".mp3",
      ".mpeg",
      ".m4a",
      ".mp4",
      ".webm",
      ".ogg",
    ];

    const fileName =
      file.name.toLowerCase();

    const hasAllowedExtension =
      allowedExtensions.some(
        (extension) =>
          fileName.endsWith(
            extension
          )
      );

    const isAudio =
      file.type.startsWith(
        "audio/"
      ) ||
      hasAllowedExtension;

    if (!isAudio) {
      setError(
        "Please select a valid audio file."
      );

      return;
    }

    /*
     * Backend limit = 25 MB.
     */
    const MAX_FILE_SIZE =
      25 * 1024 * 1024;

    if (
      file.size >
      MAX_FILE_SIZE
    ) {
      setError(
        "The selected file is larger than the 25 MB limit."
      );

      return;
    }

    if (audioUrl) {
      URL.revokeObjectURL(
        audioUrl
      );
    }

    setAudioFile(
      file
    );

    setAudioUrl(
      URL.createObjectURL(
        file
      )
    );

    setMode(
      "upload"
    );
  };

  /* -----------------------------
     File input
  ------------------------------ */

  const handleFileInput =
    (event) => {
      const file =
        event.target.files?.[0];

      handleFile(file);

      /*
       * Allow selecting the same
       * file again later.
       */
      event.target.value = "";
    };

  /* -----------------------------
     Drag & drop
  ------------------------------ */

  const handleDrop =
    (event) => {
      event.preventDefault();

      setDragActive(
        false
      );

      const file =
        event.dataTransfer.files?.[0];

      handleFile(file);
    };

  /* -----------------------------
     Reset
  ------------------------------ */

  const resetRecording =
    () => {
      clearInterval(
        timerRef.current
      );

      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current
          .state !== "inactive"
      ) {
        mediaRecorderRef.current.stop();
      }

      if (microphoneStream) {
        microphoneStream
          .getTracks()
          .forEach((track) =>
            track.stop()
          );
      }

      if (audioUrl) {
        URL.revokeObjectURL(
          audioUrl
        );
      }

      setAudioUrl(
        null
      );

      setAudioFile(
        null
      );

      setMicrophoneStream(
        null
      );

      setRecordingTime(
        0
      );

      setIsRecording(
        false
      );

      setIsAnalyzing(
        false
      );

      setError("");

      recordingStartTimeRef.current =
        null;

      audioChunksRef.current =
        [];

      if (
        fileInputRef.current
      ) {
        fileInputRef.current.value =
          "";
      }
    };

  /* -----------------------------
     Analyze voice
  ------------------------------ */

  const handleAnalyze =
    async () => {
      if (
        !audioFile ||
        isRecording ||
        (mediaRecorderRef.current &&
          mediaRecorderRef.current.state === "recording")
      ) {
        setError(
          "Please wait for recording to finish or select a voice sample first."
        );

        return;
      }

      setError("");

      setIsAnalyzing(
        true
      );

      try {
        /*
         * Backend contract:
         *
         * POST /predict
         * multipart/form-data
         * field = file
         * format = WAV
         *
         * Therefore:
         *
         * WAV upload → send directly
         * WebM/other → convert to WAV
         */

        let wavFile =
          audioFile;

        if (
          !audioFile.name
            .toLowerCase()
            .endsWith(".wav")
        ) {
          const wavBlob =
            await convertBlobToWav(
              audioFile
            );

          wavFile =
            new File(
              [wavBlob],
              "neurovoice-recording.wav",
              {
                type: "audio/wav",
              }
            );
        }

        /*
         * Send the real audio file
         * to the FastAPI ML backend.
         */
        const result =
          await predictVoice(
            wavFile
          );

        console.log(
          "ML prediction result:",
          result
        );

        /*
         * Pass the actual backend
         * response to Results.jsx.
         */
        navigate(
          "/results",
          {
            state: {
              result,
              audioFile:
                wavFile,
            },
          }
        );
      } catch (err) {
        console.error(
          "Voice analysis failed:",
          err
        );

        setError(
          err?.message ||
            "Unable to analyze the voice sample. Please try again."
        );
      } finally {
        setIsAnalyzing(
          false
        );
      }
    };

  /* -----------------------------
     Render
  ------------------------------ */

  return (
    <main className="min-h-screen bg-[#07111f] pt-16 sm:pt-20">

      {/* Background */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute left-1/2 top-32 h-112.5 w-112.5 -translate-x-1/2 rounded-full bg-cyan-400/5 blur-[140px]" />
      </div>

      <div className="relative mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">

        {/* Back */}
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-white sm:mb-10"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        {/* Heading */}
        <div className="text-center">

          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 sm:h-14 sm:w-14">
            <AudioLines className="h-6 w-6 text-cyan-400 sm:h-7 sm:w-7" />
          </div>

          <p className="mt-5 text-xs font-bold tracking-[0.16em] text-cyan-400 uppercase sm:mt-6 sm:text-sm sm:tracking-[0.2em]">
            Voice Analysis
          </p>

          <h1 className="mt-3 break-words text-3xl font-bold tracking-tight text-white sm:mt-4 sm:text-5xl">
            Analyze your voice
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-slate-400 sm:mt-5 sm:text-base sm:leading-7">
            Record a sustained vowel sound or upload an existing voice
            recording for analysis.
          </p>

        </div>

        {/* Main card */}
        <div className="mt-8 rounded-3xl border border-white/10 bg-white/2.5 p-3 shadow-2xl sm:mt-12 sm:p-8">

          {/* Mode selector */}
          <div className="mx-auto flex max-w-md rounded-xl border border-white/10 bg-black/20 p-1">

            <button
              type="button"
              onClick={() => {
                setError("");
                setMode("record");
              }}
              disabled={isAnalyzing}
              className={`flex min-w-0 flex-1 items-center justify-center gap-2 rounded-lg px-2 py-3 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 sm:px-4 ${
                mode === "record"
                  ? "bg-cyan-400 text-slate-950"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Mic className="h-4 w-4" />
              Record
            </button>

            <button
              type="button"
              onClick={() => {
                setError("");
                setMode("upload");
              }}
              disabled={isAnalyzing}
              className={`flex min-w-0 flex-1 items-center justify-center gap-2 rounded-lg px-2 py-3 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 sm:px-4 ${
                mode === "upload"
                  ? "bg-cyan-400 text-slate-950"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Upload className="h-4 w-4" />
              Upload
            </button>

          </div>

          {/* =================================================
              RECORD MODE
          ================================================== */}

          {mode === "record" &&
            !audioUrl && (
              <div className="mt-10">

                <div className="rounded-2xl border border-white/10 bg-[#050d18] p-4 sm:p-12">

                  {/* Instruction */}
                  <div className="text-center">

                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10">
                      <Mic className="h-6 w-6 text-cyan-400" />
                    </div>

                    <h2 className="mt-5 text-lg font-semibold text-white sm:text-xl">
                      {isRecording
                        ? 'Keep saying "AH"...'
                        : "Ready to record"}
                    </h2>

                    <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-500">
                      {isRecording
                        ? "Hold the vowel steadily. Recording will stop automatically after 5 seconds."
                        : 'In a quiet environment, take a breath and sustain the vowel sound "aaaaa" steadily for approximately 3 seconds within the 5-second recording window.'}
                    </p>

                  </div>

                  {/* Waveform */}
                  <div className="mt-8">
                    <AudioWaveform
                      stream={
                        microphoneStream
                      }
                      active={
                        isRecording
                      }
                      height={192}
                    />
                  </div>

                  {/* Timer */}
                  <div className="mt-8 text-center">

                    <div className="text-4xl font-semibold tabular-nums tracking-tight text-white">
                      {formatTime(
                        recordingTime
                      )}
                    </div>

                    <div className="mx-auto mt-4 h-1.5 max-w-xs overflow-hidden rounded-full bg-white/5">
                      <div
                        className="h-full rounded-full bg-cyan-400 transition-[width] duration-100"
                        style={{
                          width: `${
                            Math.min(
                              (recordingTime /
                                MAX_RECORDING_TIME) *
                                100,
                              100
                            )
                          }%`,
                        }}
                      />
                    </div>

                    <p className="mt-3 text-xs text-slate-600">
                      Maximum recording time: 5 seconds
                    </p>

                  </div>

                  {/* Record button */}
                  <div className="mt-8 flex justify-center">

                    {!isRecording ? (
                      <button
                        type="button"
                        onClick={
                          startRecording
                        }
                        disabled={
                          isAnalyzing
                        }
                        className="group flex h-20 w-20 items-center justify-center rounded-full bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-400/10 transition hover:scale-105 hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label="Start recording"
                      >
                        <Mic className="h-8 w-8 transition group-hover:scale-110" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={
                          stopRecording
                        }
                        className="group flex h-20 w-20 items-center justify-center rounded-full border-4 border-cyan-400/20 bg-cyan-400 text-slate-950 transition hover:scale-105 hover:bg-cyan-300"
                        aria-label="Stop recording"
                      >
                        <div className="h-7 w-7 rounded-md bg-slate-950 transition group-hover:scale-90" />
                      </button>
                    )}

                  </div>

                  <p className="mt-5 text-center text-xs text-slate-600">
                    {isRecording
                      ? "Click to stop recording"
                      : "Click the microphone to begin"}
                  </p>

                  {/* Recording guideline */}
                  <div className="mt-8 flex items-start gap-3 rounded-xl border border-white/5 bg-white/1.5 p-4">

                    <Info className="mt-0.5 h-4 w-4 shrink-0 text-slate-600" />

                    <div>
                      <p className="text-xs font-medium text-slate-400">
                        Recording guideline
                      </p>

                      <p className="mt-1 text-xs leading-5 text-slate-600">
                        In a quiet environment, keep the microphone at a
                        consistent distance (about 15-20 cm) and sustain the vowel
                        sound "aaaaa" steadily for approximately 3 seconds within
                        the recording window.
                      </p>
                    </div>

                  </div>

                </div>

              </div>
            )}

          {/* =================================================
              UPLOAD MODE
          ================================================== */}

          {mode === "upload" &&
            !audioUrl && (
              <div className="mt-10">

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*"
                  onChange={
                    handleFileInput
                  }
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() =>
                    fileInputRef.current?.click()
                  }
                  onDragOver={(event) => {
                    event.preventDefault();
                    setDragActive(
                      true
                    );
                  }}
                  onDragLeave={() =>
                    setDragActive(
                      false
                    )
                  }
                  onDrop={
                    handleDrop
                  }
                  disabled={
                    isAnalyzing
                  }
                  className={`flex min-h-80 w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 text-center transition disabled:cursor-not-allowed disabled:opacity-50 ${
                    dragActive
                      ? "border-cyan-400 bg-cyan-400/5"
                      : "border-white/10 bg-[#050d18] hover:border-cyan-400/30 hover:bg-white/2"
                  }`}
                >

                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10">
                    <FileAudio className="h-7 w-7 text-cyan-400" />
                  </div>

                  <h3 className="mt-6 text-lg font-semibold text-white">
                    Upload a voice recording
                  </h3>

                  <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                    Drag and drop your audio file here, or click to browse
                    your device.
                  </p>

                  <span className="mt-5 rounded-lg bg-white/5 px-4 py-2 text-xs font-medium text-slate-400">
                    WAV · MP3 · M4A · WEBM · Max 25 MB
                  </span>

                </button>

              </div>
            )}

          {/* =================================================
              AUDIO PREVIEW
          ================================================== */}

          {audioUrl &&
            audioFile && (
              <div className="mt-10">

                <div className="rounded-2xl border border-cyan-400/10 bg-[#050d18] p-6">

                  {/* Success */}
                  <div className="flex items-center gap-3">

                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-400/10">
                      <Check className="h-5 w-5 text-cyan-400" />
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-white">
                        Voice sample ready
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {audioFile.name}
                      </p>
                    </div>

                  </div>

                  {/* Audio */}
                  <div className="mt-6 rounded-xl border border-white/5 bg-white/2.5 p-4">

                    <audio
                      controls
                      src={audioUrl}
                      className="w-full"
                    />

                  </div>

                  {/* File information */}
                  <div className="mt-5 grid gap-3 sm:grid-cols-3">

                    <div className="rounded-xl border border-white/5 bg-white/2 p-4">

                      <p className="text-xs text-slate-600">
                        File
                      </p>

                      <p className="mt-1 truncate text-sm font-medium text-slate-300">
                        {audioFile.name}
                      </p>

                    </div>

                    <div className="rounded-xl border border-white/5 bg-white/2 p-4">

                      <p className="text-xs text-slate-600">
                        Size
                      </p>

                      <p className="mt-1 text-sm font-medium text-slate-300">
                        {(
                          audioFile.size /
                          1024
                        ).toFixed(1)}{" "}
                        KB
                      </p>

                    </div>

                    <div className="rounded-xl border border-white/5 bg-white/2 p-4">

                      <p className="text-xs text-slate-600">
                        Status
                      </p>

                      <p className="mt-1 text-sm font-medium text-cyan-400">
                        Ready
                      </p>

                    </div>

                  </div>

                  {/* Error */}
                  {error && (
                    <div className="mt-5 flex items-start gap-3 rounded-xl border border-red-400/20 bg-red-400/5 p-4">

                      <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />

                      <div>
                        <p className="text-sm font-medium text-red-300">
                          Analysis failed
                        </p>

                        <p className="mt-1 text-xs leading-5 text-red-300/60">
                          {error}
                        </p>
                      </div>

                    </div>
                  )}

                  {/* Actions */}
                  <div className="mt-6 flex flex-col gap-3 sm:flex-row">

                    <button
                      type="button"
                      onClick={
                        resetRecording
                      }
                      disabled={
                        isAnalyzing
                      }
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 px-5 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Choose Another
                    </button>

                    <button
                      type="button"
                      onClick={
                        handleAnalyze
                      }
                      disabled={
                        isAnalyzing
                      }
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isAnalyzing ? (
                        <>
                          <LoaderCircle className="h-4 w-4 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Waves className="h-4 w-4" />
                          Analyze Voice
                        </>
                      )}
                    </button>

                  </div>

                  {/* Analysis status */}
                  {isAnalyzing && (
                    <div className="mt-5 rounded-xl border border-cyan-400/10 bg-cyan-400/5 p-4">

                      <div className="flex items-center gap-3">

                        <LoaderCircle className="h-4 w-4 animate-spin text-cyan-400" />

                        <div>
                          <p className="text-sm font-medium text-white">
                            Analyzing voice sample
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            Preprocessing audio, extracting acoustic features,
                            and running the research model.
                          </p>
                        </div>

                      </div>

                    </div>
                  )}

                </div>

              </div>
            )}

          {/* Instructions */}
          {!audioUrl &&
            !error && (
              <div className="mt-8 flex items-start gap-3 rounded-xl border border-white/5 bg-white/1.5 p-4">

                <Info className="mt-0.5 h-4 w-4 shrink-0 text-slate-600" />

                <p className="text-xs leading-5 text-slate-600">
                  For the research-based workflow, sustain the vowel sound "aaaaa"
                  clearly for approximately 3 seconds in a quiet room. Minimize
                  background noise and keep a consistent distance from the microphone.
                </p>

              </div>
            )}

          {/* Error before file */}
          {!audioUrl &&
            error && (
              <div className="mt-8 flex items-start gap-3 rounded-xl border border-red-400/20 bg-red-400/5 p-4">

                <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />

                <div>
                  <p className="text-sm font-medium text-red-300">
                    Something went wrong
                  </p>

                  <p className="mt-1 text-xs leading-5 text-red-300/60">
                    {error}
                  </p>
                </div>

              </div>
            )}

        </div>

        {/* Disclaimer */}
        <p className="mx-auto mt-8 max-w-2xl text-center text-xs leading-6 text-slate-600">
          This system is an academic research project. Results are
          experimental and should not be interpreted as a medical diagnosis.
        </p>

      </div>
    </main>
  );
}