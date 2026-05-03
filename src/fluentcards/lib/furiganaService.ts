import Kuroshiro from "kuroshiro";
import KuromojiAnalyzer from "kuroshiro-analyzer-kuromoji";

let kuroshiroInstance: any = null;
let initPromise: Promise<void> | null = null;

export async function addFurigana(text: string): Promise<string> {
  if (!kuroshiroInstance) {
    if (!initPromise) {
      initPromise = (async () => {
        const K = (Kuroshiro as any).default || Kuroshiro;
        kuroshiroInstance = new K();
        const Analyzer = (KuromojiAnalyzer as any).default || KuromojiAnalyzer;
        await kuroshiroInstance.init(new Analyzer({ dictPath: "https://unpkg.com/kuromoji@0.1.2/dict/" }));
      })();
    }
    await initPromise;
  }
  
  if (/[一-龯々]/.test(text)) {
    const result = await kuroshiroInstance.convert(text, { mode: "furigana", to: "hiragana" });
    
    // Parse the <ruby> tags and convert to Kanji[furigana] syntax
    // Pattern: <ruby>Kanji<rp>(</rp><rt>furigana</rt><rp>)</rp></ruby>
    // Note: Kuroshiro sometimes wraps just the kanji, sometimes the okurigana is outside
    return result.replace(/<ruby>(.*?)<rp>\(<\/rp><rt>(.*?)<\/rt><rp>\)<\/rp><\/ruby>/g, '$1[$2]');
  }
  
  return text;
}
