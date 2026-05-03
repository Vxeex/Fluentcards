import type { APIRoute } from 'astro';

// Microsoft Edge TTS uses WebSocket to stream audio
// This implementation uses fetch directly to be Cloudflare Worker compatible
async function synthesizeEdgeTTS(text: string, voice: string, rate: string): Promise<ArrayBuffer> {
  // Generate a unique request ID
  const requestId = crypto.randomUUID();

  // Connect to Edge TTS WebSocket
  const wsUrl = `wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=6A5AA1D4EAFF4E9FB37E23D68491D6F4&ConnectionId=${requestId}`;

  const ws = new WebSocket(wsUrl);

  return new Promise((resolve, reject) => {
    const audioChunks: Uint8Array[] = [];
    let hasError = false;

    const timeout = setTimeout(() => {
      if (!hasError) {
        hasError = true;
        ws.close();
        reject(new Error('TTS request timed out'));
      }
    }, 15000);

    ws.addEventListener('open', () => {
      // Send the SSML request
      const ssml = `
        <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="${voice.split('-').slice(0, 2).join('-')}">
          <voice name="${voice}">
            <prosody rate="${rate}">
              ${escapeXml(text)}
            </prosody>
          </voice>
        </speak>
      `.trim();

      const message = `Path: speech.config\r\nX-RequestId: ${requestId}\r\nX-Timestamp: ${new Date().toISOString()}\r\nContent-Type: application/json\r\n\r\n${JSON.stringify({ context: { synthesis: { audio: { metadataoptions: { sentenceBoundaryEnabled: false, wordBoundaryEnabled: false } } } } })}\r\n`;

      ws.send(message);

      // Send the SSML
      const ssmlMessage = `Path: ssml\r\nX-RequestId: ${requestId}\r\nX-Timestamp: ${new Date().toISOString()}\r\nContent-Type: application/ssml+xml\r\n\r\n${ssml}\r\n`;

      ws.send(ssmlMessage);
    });

    ws.addEventListener('message', (event) => {
      if (typeof event.data === 'string') {
        // Text messages contain metadata or turn.end
        if (event.data.includes('Path:turn.end')) {
          clearTimeout(timeout);
          ws.close();
          // Combine all audio chunks
          const totalLength = audioChunks.reduce((sum, chunk) => sum + chunk.byteLength, 0);
          const combined = new Uint8Array(totalLength);
          let offset = 0;
          for (const chunk of audioChunks) {
            combined.set(chunk, offset);
            offset += chunk.byteLength;
          }
          // The binary data has a small header before the actual MP3 data
          resolve(combined.buffer as ArrayBuffer);
        }
      } else if (event.data instanceof ArrayBuffer) {
        // Binary audio data
        // First 2 bytes are the header length, skip them
        const headerLen = new DataView(event.data).getUint16(0, true);
        const audioData = new Uint8Array(event.data, 2 + headerLen);
        audioChunks.push(audioData);
      } else {
        // Handle Blob data (Cloudflare Workers use Blob for binary)
        const reader = new FileReader();
        reader.onload = () => {
          if (reader.result instanceof ArrayBuffer) {
            const headerLen = new DataView(reader.result).getUint16(0, true);
            const audioData = new Uint8Array(reader.result, 2 + headerLen);
            audioChunks.push(audioData);
          }
        };
        reader.readAsArrayBuffer(event.data as Blob);
      }
    });

    ws.addEventListener('error', (err) => {
      clearTimeout(timeout);
      if (!hasError) {
        hasError = true;
        reject(new Error('WebSocket error'));
      }
    });

    ws.addEventListener('close', () => {
      clearTimeout(timeout);
      if (!hasError && audioChunks.length > 0) {
        const totalLength = audioChunks.reduce((sum, chunk) => sum + chunk.byteLength, 0);
        const combined = new Uint8Array(totalLength);
        let offset = 0;
        for (const chunk of audioChunks) {
          combined.set(chunk, offset);
          offset += chunk.byteLength;
        }
        resolve(combined.buffer as ArrayBuffer);
      }
    });
  });
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const text = url.searchParams.get('text');
  const voice = url.searchParams.get('voice') || 'ja-JP-NanamiNeural';
  const rateStr = url.searchParams.get('rate');

  let rate = '0%';
  if (rateStr) {
    const parsedRate = parseFloat(rateStr);
    if (!isNaN(parsedRate) && parsedRate !== 1.0) {
      const pct = Math.round((parsedRate - 1.0) * 100);
      rate = pct >= 0 ? `+${pct}%` : `${pct}%`;
    }
  }

  if (!text) {
    return new Response(JSON.stringify({ error: 'Text is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const audioBuffer = await synthesizeEdgeTTS(text.substring(0, 300), voice, rate);
    return new Response(audioBuffer, {
      status: 200,
      headers: { 'Content-Type': 'audio/mpeg' },
    });
  } catch (error) {
    console.error('TTS error:', error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
