import Kuroshiro from "kuroshiro";
import KuromojiAnalyzer from "kuroshiro-analyzer-kuromoji";

async function test() {
  const K = (Kuroshiro as any).default || Kuroshiro;
  const kuroshiro = new K();
  
  const Analyzer = (KuromojiAnalyzer as any).default || KuromojiAnalyzer;
  await kuroshiro.init(new Analyzer({ dictPath: "https://unpkg.com/kuromoji@0.1.2/dict" }));
  
  const result = await kuroshiro.convert("感じ取れたら手を繋ごう", { mode: "furigana", to: "hiragana" });
  console.log(result);
}

test().catch(console.error);
