const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://127.0.0.1:8000";

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

export async function predictVoice(audioFile) {
  if (!audioFile) {
    throw new Error(
      "No audio file provided."
    );
  }

  if (
    !audioFile.name
      .toLowerCase()
      .endsWith(".wav")
  ) {
    throw new Error(
      "The prediction API requires a WAV file."
    );
  }

  const formData = new FormData();

  formData.append(
    "file",
    audioFile,
    audioFile.name
  );

  const response = await fetch(
    `${API_BASE_URL}/predict`,
    {
      method: "POST",
      body: formData,
    }
  );

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
      backendError
    );
  }

  return data;
}