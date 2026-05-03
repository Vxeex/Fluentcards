import Kuroshiro from "kuroshiro";
import KuromojiAnalyzer from "kuroshiro-analyzer-kuromoji";
(async () => {
  const K = Kuroshiro.default || Kuroshiro;
  const kuroshiroInstance = new K();
  const Analyzer = KuromojiAnalyzer.default || KuromojiAnalyzer;
  await kuroshiroInstance.init(new Analyzer({ dictPath: "https://unpkg.com/kuromoji@0.1.2/dict/" }));
  console.log("kuro init");
  console.log(await kuroshiroInstance.convert("感じ取れたら手を繋ごう", { mode: "furigana", to: "hiragana" }));
})();
