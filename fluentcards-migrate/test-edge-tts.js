import WebSocket from 'ws'; // Node.js test
import crypto from 'crypto';

const WSS_URL = "wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=6A5AA1D4EAFF4E9FB37E23D68491D6F4"

function generateId() {
  return crypto.randomBytes(16).toString('hex');
}

const ws = new WebSocket(WSS_URL, {
  headers: {
    'Origin': 'chrome-extension://jdiccldimpdaepmpppepodehcpmvbgfb'
  }
});

ws.on('open', () => {
    console.log('Connected');
    
    const connectionId = generateId();
    
    const configMsg = `X-Timestamp: ${new Date().toUTCString()}\r\n` + 
    `Content-Type: application/json; charset=utf-8\r\n` +
    `Path: speech.config\r\n\r\n` +
    `{"context":{"synthesis":{"audio":{"metadataoptions":{"sentenceBoundaryEnabled":"false","wordBoundaryEnabled":"true"},"outputFormat":"audio-24khz-48kbitrate-mono-mp3"}}}}`;

    ws.send(configMsg);

    const reqId = generateId();
    const payload = `X-RequestId: ${reqId}\r\n` +
    `Content-Type: application/ssml+xml\r\n` +
    `X-Timestamp: ${new Date().toUTCString()}Z\r\n` +
    `Path: ssml\r\n\r\n` +
    `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='ja-JP'><voice name='Microsoft Server Speech Text to Speech Voice (ja-JP, KeitaNeural)'><prosody pitch='+0Hz' rate='+0%' volume='+0%'>こんにちは世界</prosody></voice></speak>`;
    
    ws.send(payload);
});
ws.on('message', (data) => {
    if (typeof data === 'string') {
        console.log('Text Msg:', data.substring(0, 50));
    } else {
        console.log('Binary Msg size:', data.length);
        ws.close();
    }
});
ws.on('error', (e) => {
    console.error('Error', e);
});
