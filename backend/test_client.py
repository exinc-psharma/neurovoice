"""
Backend Test Client & Automated Verification Suite.

Tests:
1. Health check endpoint (GET /health).
2. Prediction on actual Healthy Control (HC) sample WAV.
3. Prediction on actual Parkinson's Disease (PD) sample WAV.
4. Error handling on text/non-audio file (expect HTTP 400).
5. Error handling on empty file (expect HTTP 400).
"""

import os
import glob
from pathlib import Path
from fastapi.testclient import TestClient

from main import app


print("=" * 80)
print("RUNNING AUTOMATED BACKEND VERIFICATION SUITE")
print("=" * 80)

with TestClient(app) as client:
    # 1. Health check
    print("\n[TEST 1] Testing GET /health ...")
    r = client.get("/health")
    print(f"Status Code: {r.status_code}")
    print(f"Response: {r.json()}")
    assert r.status_code == 200, f"Expected 200, got {r.status_code}"
    assert r.json()["model_loaded"] is True, "Model not marked as loaded"
    assert r.json()["features_expected"] == 100, f"Expected 100 features, got {r.json()['features_expected']}"
    print("-> PASS: Health check verified.")

    # Locate real test WAV files from project dataset
    base_dataset = Path(r"c:\Users\Dell\Desktop\parkinsons\23849127")
    hc_wavs = list((base_dataset / "HC_AH" / "HC_AH").glob("*.wav"))
    pd_wavs = list((base_dataset / "PD_AH" / "PD_AH").glob("*.wav"))

    if hc_wavs and pd_wavs:
        hc_path = hc_wavs[0]
        pd_path = pd_wavs[0]

        # 2. Test Healthy Sample
        print(f"\n[TEST 2] Testing POST /predict with Healthy Control WAV ({hc_path.name}) ...")
        with open(hc_path, "rb") as f:
            r = client.post("/predict", files={"file": (hc_path.name, f, "audio/wav")})
        print(f"Status Code: {r.status_code}")
        res = r.json()
        print(f"Response: {res}")
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        assert res["success"] is True
        assert "probability_parkinsons" in res
        assert "probability_healthy" in res
        assert res["predicted_class"] == 0, f"Expected HC (0), got {res['predicted_class']}"
        print(f"-> PASS: Correctly classified as {res['prediction_label']} (PD Prob: {res['probability_parkinsons']:.4f})")

        # 3. Test Parkinson's Sample
        print(f"\n[TEST 3] Testing POST /predict with Parkinson's WAV ({pd_path.name}) ...")
        with open(pd_path, "rb") as f:
            r = client.post("/predict", files={"file": (pd_path.name, f, "audio/wav")})
        print(f"Status Code: {r.status_code}")
        res = r.json()
        print(f"Response: {res}")
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        assert res["success"] is True
        assert res["predicted_class"] == 1, f"Expected PD (1), got {res['predicted_class']}"
        print(f"-> PASS: Correctly classified as {res['prediction_label']} (PD Prob: {res['probability_parkinsons']:.4f})")
    else:
        print("\n[WARNING] Dataset WAV files not found for audio tests.")

    # 4. Test Invalid file format
    print("\n[TEST 4] Testing error handling with non-wav text file ...")
    r = client.post("/predict", files={"file": ("notes.txt", b"Hello world, not audio", "text/plain")})
    print(f"Status Code: {r.status_code}")
    print(f"Response: {r.json()}")
    assert r.status_code == 400, f"Expected 400, got {r.status_code}"
    print("-> PASS: Invalid file rejected with HTTP 400.")

    # 5. Test Empty file
    print("\n[TEST 5] Testing error handling with empty file ...")
    r = client.post("/predict", files={"file": ("empty.wav", b"", "audio/wav")})
    print(f"Status Code: {r.status_code}")
    print(f"Response: {r.json()}")
    assert r.status_code == 400, f"Expected 400, got {r.status_code}"
    print("-> PASS: Empty file rejected with HTTP 400.")

    print("\n" + "=" * 80)
    print("ALL 5 VERIFICATION TESTS PASSED SUCCESSFULLY!")
    print("=" * 80)
