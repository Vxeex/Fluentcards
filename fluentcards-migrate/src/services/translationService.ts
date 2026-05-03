export async function generateTranslation(text: string, fromLangCode: string, toLangCode: string): Promise<string> {
  try {
    // MyMemory Translation API (Free, no key required for basic usage)
    // Rate limit: 500 requests/day
    const from = fromLangCode;
    const to = toLangCode;
    
    const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${from}|${to}`);
    const data = await response.json();
    
    if (data && data.responseData && data.responseData.translatedText) {
      // MyMemory sometimes returns "MYMEMORY WARNING..." when rate limited or unsupported
      if (!data.responseData.translatedText.startsWith("MYMEMORY WARNING")) {
          return data.responseData.translatedText;
      }
    }
    
    throw new Error("Translation failed or not supported.");
  } catch (error) {
    console.error("Translation API error:", error);
    throw error;
  }
}
