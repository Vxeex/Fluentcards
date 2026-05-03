export const LANGUAGES = [
  { code: 'en-US', name: 'English (US)', edgeVoice: 'en-US-AriaNeural' },
  { code: 'en-GB', name: 'English (UK)', edgeVoice: 'en-GB-SoniaNeural' },
  { code: 'ja-JP', name: 'Japanese', edgeVoice: 'ja-JP-NanamiNeural' },
  { code: 'es-ES', name: 'Spanish', edgeVoice: 'es-ES-ElviraNeural' },
  { code: 'fr-FR', name: 'French', edgeVoice: 'fr-FR-DeniseNeural' },
  { code: 'de-DE', name: 'German', edgeVoice: 'de-DE-KatjaNeural' },
  { code: 'zh-CN', name: 'Chinese (Simplified)', edgeVoice: 'zh-CN-XiaoxiaoNeural' },
  { code: 'zh-TW', name: 'Chinese (Traditional)', edgeVoice: 'zh-TW-HsiaoChenNeural' },
  { code: 'ko-KR', name: 'Korean', edgeVoice: 'ko-KR-SunHiNeural' },
  { code: 'it-IT', name: 'Italian', edgeVoice: 'it-IT-ElsaNeural' },
  { code: 'ru-RU', name: 'Russian', edgeVoice: 'ru-RU-SvetlanaNeural' },
];

let globalAudio: HTMLAudioElement | null = null;
let isUnlocked = false;

if (typeof window !== 'undefined') {
  globalAudio = new Audio();
  
  const unlockAudio = () => {
    if (globalAudio && !isUnlocked) {
      // Play a short silent MP3 to unlock the audio context for future dynamic plays
      globalAudio.src = 'data:audio/mp3;base64,//NExAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq';
      globalAudio.play().then(() => {
        isUnlocked = true;
        globalAudio?.pause();
      }).catch((e) => {
        console.warn("Audio unlock failed, will retry on next interaction:", e);
      });
    }
    
    if (isUnlocked) {
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('touchstart', unlockAudio);
    }
  };
  
  document.addEventListener('click', unlockAudio);
  document.addEventListener('touchstart', unlockAudio);
}

function speakFallback(text: string, lang: string, rate: number = 1.0) {
  if (!('speechSynthesis' in window)) return;
  
  window.speechSynthesis.cancel();
  
  const msg = new SpeechSynthesisUtterance();
  msg.text = text;
  msg.lang = lang;
  msg.rate = rate;
  
  const voices = window.speechSynthesis.getVoices();
  
  let bestVoice = voices.find(v => (v.lang === lang || v.lang.startsWith(lang.split('-')[0])) && (v.name.includes('Google') || v.name.includes('Premium') || v.name.includes('Natural') || v.name.includes('Online')));
  
  if (!bestVoice) {
    bestVoice = voices.find(v => v.lang === lang || v.lang.startsWith(lang.split('-')[0]));
  }
  
  if (bestVoice) {
    msg.voice = bestVoice;
  }
  
  window.speechSynthesis.speak(msg);
}

export async function speak(text: string, lang: string, rate: number = 1.0) {
  try {
    if (globalAudio) {
      globalAudio.pause();
      globalAudio.currentTime = 0;
    }
    
    const langObj = LANGUAGES.find(l => l.code === lang);
    const edgeVoice = langObj ? langObj.edgeVoice : 'ja-JP-NanamiNeural';
    
    const url = `/api/tts?text=${encodeURIComponent(text.substring(0, 300))}&voice=${edgeVoice}&rate=${rate}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    
    if (!globalAudio) {
       throw new Error("Audio object not available");
    }
    
    const oldUrl = globalAudio.src;
    if (oldUrl && oldUrl.startsWith('blob:')) {
       URL.revokeObjectURL(oldUrl);
    }

    globalAudio.src = objectUrl;
    // Note: Edge TTS rate is adjusted on server, so we just play normally
    globalAudio.playbackRate = 1.0; 
    
    globalAudio.onerror = () => {
      console.warn("Public TTS failed, falling back to browser TTS");
      speakFallback(text, lang, rate);
    };
    
    await globalAudio.play();
  } catch (err) {
    console.warn("Error playing audio, falling back to in-built TTS:", err);
    speakFallback(text, lang, rate);
  }
}

if ('speechSynthesis' in window) {
  window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    window.speechSynthesis.getVoices();
  };
}

