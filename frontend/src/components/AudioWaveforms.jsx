import { useEffect, useRef } from "react";

export default function AudioWaveform({
  stream,
  active = false,
  height = 220,
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    const context = canvas.getContext("2d");

    let animationFrame;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();

      const dpr = window.devicePixelRatio || 1;

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;

      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resizeCanvas();

    window.addEventListener("resize", resizeCanvas);

    /*
     * --------------------------------------------------
     * No microphone stream
     * --------------------------------------------------
     */

    if (!stream || !active) {
      context.clearRect(
        0,
        0,
        canvas.clientWidth,
        canvas.clientHeight
      );

      context.fillStyle = "#050d18";

      context.fillRect(
        0,
        0,
        canvas.clientWidth,
        canvas.clientHeight
      );

      // Center line
      context.strokeStyle = "rgba(100, 116, 139, 0.15)";
      context.lineWidth = 1;

      context.beginPath();

      context.moveTo(
        0,
        canvas.clientHeight / 2
      );

      context.lineTo(
        canvas.clientWidth,
        canvas.clientHeight / 2
      );

      context.stroke();

      return () => {
        window.removeEventListener("resize", resizeCanvas);
      };
    }

    /*
     * --------------------------------------------------
     * Web Audio API
     * --------------------------------------------------
     */

    const audioContext = new (
      window.AudioContext ||
      window.webkitAudioContext
    )();

    const analyser = audioContext.createAnalyser();

    analyser.fftSize = 2048;

    analyser.smoothingTimeConstant = 0.75;

    const source =
      audioContext.createMediaStreamSource(stream);

    source.connect(analyser);

    const bufferLength = analyser.fftSize;

    const dataArray = new Uint8Array(bufferLength);

    /*
     * --------------------------------------------------
     * Draw waveform
     * --------------------------------------------------
     */

    const draw = () => {
      animationFrame =
        requestAnimationFrame(draw);

      analyser.getByteTimeDomainData(dataArray);

      const width = canvas.clientWidth;
      const canvasHeight = canvas.clientHeight;

      context.clearRect(
        0,
        0,
        width,
        canvasHeight
      );

      context.fillStyle = "#050d18";

      context.fillRect(
        0,
        0,
        width,
        canvasHeight
      );

      /*
       * Center line
       */

      context.strokeStyle =
        "rgba(100, 116, 139, 0.12)";

      context.lineWidth = 1;

      context.beginPath();

      context.moveTo(
        0,
        canvasHeight / 2
      );

      context.lineTo(
        width,
        canvasHeight / 2
      );

      context.stroke();

      /*
       * Waveform
       */

      context.beginPath();

      const sliceWidth =
        width / bufferLength;

      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const normalized =
          dataArray[i] / 128.0;

        const y =
          (normalized * canvasHeight) / 2;

        if (i === 0) {
          context.moveTo(x, y);
        } else {
          context.lineTo(x, y);
        }

        x += sliceWidth;
      }

      context.strokeStyle = "#22d3ee";

      context.lineWidth = 2;

      context.lineCap = "round";

      context.lineJoin = "round";

      context.stroke();
    };

    draw();

    /*
     * --------------------------------------------------
     * Cleanup
     * --------------------------------------------------
     */

    return () => {
      cancelAnimationFrame(animationFrame);

      source.disconnect();

      analyser.disconnect();

      audioContext.close();

      window.removeEventListener(
        "resize",
        resizeCanvas
      );
    };
  }, [stream, active]);

  return (
    <div
      className="relative overflow-hidden rounded-xl border border-white/5 bg-[#050d18]"
      style={{ height }}
    >
      <canvas
        ref={canvasRef}
        className="block h-full w-full"
      />

      {active && (
        <div className="pointer-events-none absolute left-4 top-4 flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5">
          <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-400" />

          <span className="text-[11px] font-medium text-cyan-300">
            LIVE
          </span>
        </div>
      )}
    </div>
  );
}