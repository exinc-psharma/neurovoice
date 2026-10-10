# NeuroVoice

### Parkinson's Voice Pattern Classification using Machine Learning

NeuroVoice is a college minor project that explores the use of **voice characteristics and machine learning for Parkinson's-related voice pattern classification**.

The system accepts a sustained vowel voice recording, processes the audio, extracts acoustic features, and uses a trained machine learning pipeline to classify the voice pattern.

> **Disclaimer:** NeuroVoice is an academic research prototype. It is NOT a medical device and does NOT provide a clinical diagnosis.

---

## Overview

Parkinson's disease can be associated with changes in speech and vocal characteristics. These changes may affect properties of the voice that can be analyzed computationally.

NeuroVoice explores whether acoustic information from a sustained vowel recording can be processed and classified using machine learning.

The project is based on a research-oriented workflow involving:

- Sustained vowel voice recording
- Audio preprocessing
- Acoustic feature extraction
- Feature selection
- Machine learning classification
- Probability-based model output
- Web-based visualization of the result

---

## How It Works

```text
User
 │
 │ Record / Upload Voice
 ▼
React Frontend
 │
 │ WAV Audio
 ▼
FastAPI Backend
 │
 ▼
Audio Preprocessing
 │
 ▼
Acoustic Feature Extraction
 │
 ▼
ANOVA-F Feature Selection
 │
 ▼
Logistic Regression Model
 │
 ▼
Prediction + Probability
 │
 ▼
Results Dashboard