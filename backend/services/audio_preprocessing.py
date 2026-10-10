"""
Audio Preprocessing Service.

Implements the EXACT audio preprocessing protocol established during training
in the Parkinson's voice classification research notebook:
1. Load audio as mono, 32-bit floating point.
2. Resample to target sample rate (8,000 Hz native).
3. Peak amplitude normalization ([-1.0, 1.0]).
4. Silence trimming (25 dB below reference peak).
5. Minimum active voiced duration check (minimum 1.0 second).
6. Signal validity and silence verification (RMS >= 1e-4).
"""

import io
from pathlib import Path
from typing import Tuple, Union
import numpy as np
import soundfile as sf
import librosa


# Global Constants matched to Notebook Training Configuration
TARGET_SAMPLE_RATE: int = 8000
TRIM_TOP_DB: float = 25.0
MIN_DURATION_SECONDS: float = 1.0
MIN_RMS_ENERGY: float = 1e-4


class AudioValidationError(Exception):
    """Raised when an uploaded audio recording fails validation."""
    pass


def validate_audio_signal(y: np.ndarray, sr: int = TARGET_SAMPLE_RATE, min_rms: float = MIN_RMS_ENERGY) -> Tuple[bool, str]:
    """
    Validates that the audio signal is non-empty and contains measurable acoustic energy.
    Matches validate_audio() in notebook Cell 13.
    """
    if y is None or len(y) == 0:
        return False, "Audio signal is null or contains 0 samples."
    rms = float(np.sqrt(np.mean(y**2)))
    if rms < min_rms:
        return False, f"Audio signal is near-silent (RMS energy = {rms:.2e} < {min_rms:.2e})."
    return True, "Valid signal"


def preprocess_audio(
    audio_source: Union[str, Path, bytes, io.BytesIO],
    target_sr: int = TARGET_SAMPLE_RATE,
    trim_db: float = TRIM_TOP_DB,
    min_duration: float = MIN_DURATION_SECONDS
) -> np.ndarray:
    """
    Preprocesses audio for feature-based Machine Learning.
    Matches preprocess_audio(..., for_ml=True) in notebook Cell 13.

    Args:
        audio_source: File path (str/Path), raw audio bytes, or BytesIO buffer.
        target_sr: Target sampling rate (8000 Hz).
        trim_db: Silence trimming threshold in dB below peak (25.0 dB).
        min_duration: Minimum required duration of trimmed speech in seconds (1.0s).

    Returns:
        np.ndarray: Active trimmed voiced signal (1D float32 array, no zero-padding).

    Raises:
        AudioValidationError: If decoding fails, duration is under min_duration,
                              or audio is silent/corrupt.
    """
    try:
        if isinstance(audio_source, bytes):
            audio_buffer = io.BytesIO(audio_source)
            y, sr = sf.read(audio_buffer, dtype='float32')
        elif isinstance(audio_source, io.BytesIO):
            audio_source.seek(0)
            y, sr = sf.read(audio_source, dtype='float32')
        else:
            y, sr = sf.read(str(audio_source), dtype='float32')
    except Exception as exc:
        raise AudioValidationError(f"Failed to decode audio file. Ensure valid WAV format. Details: {exc}") from exc

    # 1. Downmix stereo to mono
    if y.ndim > 1:
        y = np.mean(y, axis=1)

    # 2. Resample if necessary
    if sr != target_sr:
        try:
            y = librosa.resample(y, orig_sr=sr, target_sr=target_sr)
        except Exception as exc:
            raise AudioValidationError(f"Failed to resample audio from {sr} Hz to {target_sr} Hz: {exc}") from exc

    # 3. Peak amplitude normalization
    peak = float(np.max(np.abs(y)))
    if peak > 0:
        y = y / peak
    else:
        raise AudioValidationError("Audio signal contains all zeros (pure silence).")

    # 4. Silence trimming (top_db = 25 dB below reference peak)
    try:
        y_trimmed, _ = librosa.effects.trim(y, top_db=trim_db)
    except Exception as exc:
        raise AudioValidationError(f"Silence trimming failed: {exc}") from exc

    # 5. Duration check
    duration = len(y_trimmed) / target_sr
    if duration < min_duration:
        raise AudioValidationError(
            f"Active voiced speech duration ({duration:.2f}s) is below the minimum required "
            f"threshold of {min_duration:.1f}s. Please provide a sustained vowel of at least 3-5 seconds."
        )

    # 6. RMS energy validation
    is_valid, msg = validate_audio_signal(y_trimmed, sr=target_sr, min_rms=MIN_RMS_ENERGY)
    if not is_valid:
        raise AudioValidationError(f"Signal validation failed: {msg}")

    return y_trimmed
