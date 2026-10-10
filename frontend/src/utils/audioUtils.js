export async function convertBlobToWav(blob) {
  const arrayBuffer = await blob.arrayBuffer();

  const audioContext = new (
    window.AudioContext ||
    window.webkitAudioContext
  )();

  try {
    const audioBuffer = await audioContext.decodeAudioData(
      arrayBuffer
    );

    const wavBuffer = audioBufferToWav(audioBuffer);

    return new Blob([wavBuffer], {
      type: "audio/wav",
    });
  } finally {
    await audioContext.close();
  }
}

function audioBufferToWav(audioBuffer) {
  const numberOfChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;

  const channelData = [];

  for (let channel = 0; channel < numberOfChannels; channel++) {
    channelData.push(
      audioBuffer.getChannelData(channel)
    );
  }

  /*
   * Convert stereo/multi-channel audio to mono.
   * The ML backend works with a single voice signal.
   */
  const monoData = new Float32Array(
    audioBuffer.length
  );

  for (let i = 0; i < audioBuffer.length; i++) {
    let sum = 0;

    for (let channel = 0; channel < numberOfChannels; channel++) {
      sum += channelData[channel][i];
    }

    monoData[i] =
      sum / numberOfChannels;
  }

  const bytesPerSample = 2;
  const blockAlign = bytesPerSample;
  const dataSize =
    monoData.length * bytesPerSample;

  const buffer = new ArrayBuffer(
    44 + dataSize
  );

  const view = new DataView(buffer);

  writeString(view, 0, "RIFF");
  view.setUint32(
    4,
    36 + dataSize,
    true
  );

  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");

  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);

  view.setUint32(
    24,
    sampleRate,
    true
  );

  view.setUint32(
    28,
    sampleRate * blockAlign,
    true
  );

  view.setUint16(
    32,
    blockAlign,
    true
  );

  view.setUint16(
    34,
    16,
    true
  );

  writeString(view, 36, "data");

  view.setUint32(
    40,
    dataSize,
    true
  );

  floatTo16BitPCM(
    view,
    44,
    monoData
  );

  return buffer;
}

function floatTo16BitPCM(
  view,
  offset,
  input
) {
  for (let i = 0; i < input.length; i++) {
    const sample = Math.max(
      -1,
      Math.min(1, input[i])
    );

    const value =
      sample < 0
        ? sample * 0x8000
        : sample * 0x7fff;

    view.setInt16(
      offset + i * 2,
      value,
      true
    );
  }
}

function writeString(
  view,
  offset,
  string
) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(
      offset + i,
      string.charCodeAt(i)
    );
  }
}