const rawApiUrl =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV
    ? "http://127.0.0.1:8000"
    : "https://neurovoice-api.onrender.com");

const API_BASE_URL = rawApiUrl.trim().replace(/\/+$/, "");

export async function checkBackendHealth() {
  const response = await fetch(
    `${API_BASE_URL}/health`
  );

  if (!response.ok) {
    throw new Error(
      `Backend health check failed (${response.status})`
    );
  }

  return response.json();
}

export async function predictVoice(audioFile, timeoutMs = 60000) {
  if (!audioFile) {
    throw new Error("No audio file provided.");
  }

  if (
    !audioFile.name
      .toLowerCase()
      .endsWith(".wav")
  ) {
    throw new Error("The prediction API requires a WAV file.");
  }

  const formData = new FormData();
  formData.append("file", audioFile, audioFile.name);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  let response;
  try {
    response = await fetch(`${API_BASE_URL}/predict`, {
      method: "POST",
      body: formData,
      signal: controller.signal,
    });
  } catch (fetchErr) {
    clearTimeout(timeoutId);
    if (fetchErr.name === "AbortError") {
      throw new Error(
        "Request timed out waiting for the server to analyze the audio. If the cloud server was sleeping, please wait a moment and try again."
      );
    }
    throw new Error(
      `Unable to reach classification server at ${API_BASE_URL}. (${fetchErr.message})`
    );
  } finally {
    clearTimeout(timeoutId);
  }

  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error(
      `Backend returned an invalid response (${response.status}).`
    );
  }

  if (!response.ok) {
    const backendError =
      data?.detail?.error ||
      data?.detail ||
      data?.error ||
      "Voice analysis failed.";

    throw new Error(
      typeof backendError === "string" ? backendError : JSON.stringify(backendError)
    );
  }

  return data;
}