import { getVoices, generateAudio } from 'edge-tts-universal';

async function run() {
  const voices = await getVoices();
  console.log(voices.slice(0, 3));
}

run();
