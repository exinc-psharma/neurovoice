"""
Acoustic Feature Extraction Service.

Implements the EXACT feature extraction engine used during model training
for Experiment C1 in the Parkinson's voice classification research notebook.

Extracts 100 acoustic features:
- Static MFCCs (13 coefficients, mean & std = 26 features)
- Delta MFCCs (13 coefficients, mean & std = 26 features)
- Delta-Delta MFCCs (13 coefficients, mean & std = 26 features)
- Spectral Descriptors (Centroid, Bandwidth, Rolloff, ZCR, RMS, Flatness - mean & std = 12 features)
- Spectral Contrast (5 bands, mean = 5 features)
- Fundamental Frequency F0 & Voicing (f0_mean, f0_std, f0_min, f0_max, voiced_fraction = 5 features)

Features are formatted in the EXACT alphabetically sorted order expected by
best_exp_c_pipeline.joblib.
"""

from typing import Dict, List, Optional
import numpy as np
import librosa
from scipy.signal import find_peaks


N_FFT: int = 512
HOP_LENGTH: int = 128
TARGET_SR: int = 8000
N_MFCC: int = 13


def extract_all_acoustic_features(y: np.ndarray, sr: int = TARGET_SR, n_mfcc: int = N_MFCC) -> Dict[str, float]:
    """
    Extracts raw acoustic feature dictionary from preprocessed voiced audio.
    Matches extract_all_acoustic_features() from notebook Cell 14.

    Args:
        y: Preprocessed 1D audio array (float32).
        sr: Audio sample rate (default 8000 Hz).
        n_mfcc: Number of MFCC coefficients (default 13).

    Returns:
        Dict[str, float]: Dictionary mapping feature names to numerical values.
    """
    feats: Dict[str, float] = {}

    # ------------------------------------------------------------
    # 1. MFCCs + DELTA + DELTA-DELTA (Static & Dynamic Vocal Tract)
    # ------------------------------------------------------------
    mfccs = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=n_mfcc, n_fft=N_FFT, hop_length=HOP_LENGTH)
    for i in range(n_mfcc):
        feats[f'mfcc_{i+1}_mean'] = float(np.mean(mfccs[i]))
        feats[f'mfcc_{i+1}_std']  = float(np.std(mfccs[i]))

    delta_mfcc = librosa.feature.delta(mfccs)
    delta2_mfcc = librosa.feature.delta(mfccs, order=2)
    for i in range(n_mfcc):
        feats[f'delta_mfcc_{i+1}_mean']  = float(np.mean(delta_mfcc[i]))
        feats[f'delta_mfcc_{i+1}_std']   = float(np.std(delta_mfcc[i]))
        feats[f'delta2_mfcc_{i+1}_mean'] = float(np.mean(delta2_mfcc[i]))
        feats[f'delta2_mfcc_{i+1}_std']  = float(np.std(delta2_mfcc[i]))

    # ------------------------------------------------------------
    # 2. Spectral Descriptors
    # ------------------------------------------------------------
    spec_cent = librosa.feature.spectral_centroid(y=y, sr=sr, n_fft=N_FFT, hop_length=HOP_LENGTH)[0]
    feats['spectral_centroid_mean'] = float(np.mean(spec_cent))
    feats['spectral_centroid_std']  = float(np.std(spec_cent))

    spec_bw = librosa.feature.spectral_bandwidth(y=y, sr=sr, n_fft=N_FFT, hop_length=HOP_LENGTH)[0]
    feats['spectral_bandwidth_mean'] = float(np.mean(spec_bw))
    feats['spectral_bandwidth_std']  = float(np.std(spec_bw))

    spec_roll = librosa.feature.spectral_rolloff(y=y, sr=sr, n_fft=N_FFT, hop_length=HOP_LENGTH)[0]
    feats['spectral_rolloff_mean'] = float(np.mean(spec_roll))
    feats['spectral_rolloff_std']  = float(np.std(spec_roll))

    zcr = librosa.feature.zero_crossing_rate(y, hop_length=HOP_LENGTH)[0]
    feats['zcr_mean'] = float(np.mean(zcr))
    feats['zcr_std']  = float(np.std(zcr))

    rms = librosa.feature.rms(y=y, hop_length=HOP_LENGTH)[0]
    feats['rms_mean'] = float(np.mean(rms))
    feats['rms_std']  = float(np.std(rms))

    spec_flat = librosa.feature.spectral_flatness(y=y, n_fft=N_FFT, hop_length=HOP_LENGTH)[0]
    feats['spectral_flatness_mean'] = float(np.mean(spec_flat))
    feats['spectral_flatness_std']  = float(np.std(spec_flat))

    # Spectral contrast (Nyquist ceiling safe: fmin=100 Hz, n_bands=4)
    try:
        spec_contrast = librosa.feature.spectral_contrast(
            y=y, sr=sr, n_fft=N_FFT, hop_length=HOP_LENGTH, fmin=100.0, n_bands=4
        )
        for i in range(spec_contrast.shape[0]):
            feats[f'spectral_contrast_{i+1}_mean'] = float(np.mean(spec_contrast[i]))
    except Exception:
        for i in range(5):
            feats[f'spectral_contrast_{i+1}_mean'] = 0.0

    # ------------------------------------------------------------
    # 3. Pitch (F0) & Voicing Statistics
    # ------------------------------------------------------------
    corr = np.correlate(y, y, mode='full')[len(y)-1:]
    min_lag = int(sr / 400)
    max_lag = int(sr / 70)
    peak_lag = min_lag + int(np.argmax(corr[min_lag:max_lag])) if len(corr) > max_lag else 0

    if peak_lag > 0 and corr[0] > 0:
        dist = max(1, int(peak_lag * 0.7))
        peaks, _ = find_peaks(y, distance=dist, height=np.std(y) * 0.2)
        periods = np.diff(peaks) / sr
    else:
        periods = np.array([])

    if len(periods) >= 8:
        f0_cycles = 1.0 / periods[periods > 0]
        feats['f0_mean']   = float(np.mean(f0_cycles))
        feats['f0_std']    = float(np.std(f0_cycles))
        feats['f0_min']    = float(np.min(f0_cycles))
        feats['f0_max']    = float(np.max(f0_cycles))
        feats['voiced_fraction'] = float(len(periods) / (len(y) / peak_lag))
    else:
        # Fallback to probabilistic YIN
        f0_pi, _, _ = librosa.pyin(y, fmin=70, fmax=400, sr=sr)
        valid_f0 = f0_pi[~np.isnan(f0_pi)]
        feats['f0_mean']   = float(np.mean(valid_f0)) if len(valid_f0) > 0 else 0.0
        feats['f0_std']    = float(np.std(valid_f0)) if len(valid_f0) > 0 else 0.0
        feats['f0_min']    = float(np.min(valid_f0)) if len(valid_f0) > 0 else 0.0
        feats['f0_max']    = float(np.max(valid_f0)) if len(valid_f0) > 0 else 0.0
        feats['voiced_fraction'] = float(len(valid_f0) / len(f0_pi)) if len(f0_pi) > 0 else 0.0

    return feats


def extract_features_vector(
    y: np.ndarray,
    feature_columns: List[str],
    sr: int = TARGET_SR
) -> np.ndarray:
    """
    Extracts complete acoustic feature vector aligned with expected training columns.

    Args:
        y: Preprocessed voiced audio array.
        feature_columns: Ordered list of feature names (100 columns for Exp C1).
        sr: Audio sample rate.

    Returns:
        np.ndarray: 2D array of shape (1, 100), float64, cleaned of NaNs and infinite values.

    Raises:
        ValueError: If feature count does not match expected columns.
    """
    raw_dict = extract_all_acoustic_features(y, sr=sr)

    # Assemble feature vector in the EXACT specified column order
    values = [raw_dict.get(col_name, 0.0) for col_name in feature_columns]
    feature_vector = np.array([values], dtype=np.float64)

    # Sanitize any NaNs or infinities with zero fallback
    feature_vector = np.nan_to_num(feature_vector, nan=0.0, posinf=0.0, neginf=0.0)

    if feature_vector.shape[1] != len(feature_columns):
        raise ValueError(
            f"Feature dimension mismatch: expected {len(feature_columns)} features, "
            f"extracted {feature_vector.shape[1]}."
        )

    return feature_vector
