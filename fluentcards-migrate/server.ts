import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { EdgeTTS } from "edge-tts-universal";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for TTS
  app.get("/api/tts", async (req, res) => {
    try {
      const text = req.query.text as string;
      const voice = (req.query.voice as string) || "ja-JP-KeitaNeural"; 
      const rateStr = req.query.rate as string;
      
      let rate = 1.0;
      if (rateStr) rate = parseFloat(rateStr);
      let rateAdjust = '+0%';
      if (rate !== 1.0) {
        const pct = Math.round((rate - 1.0) * 100);
        rateAdjust = pct >= 0 ? `+${pct}%` : `${pct}%`;
      }

      if (!text) {
        return res.status(400).json({ error: "Text is required" });
      }

      const tts = new EdgeTTS({ text, voice, rate: rateAdjust });
      const result = await tts.synthesize();
      const audioBuffer = Buffer.from(await result.audio.arrayBuffer());

      res.setHeader('Content-Type', 'audio/mpeg');
      res.send(audioBuffer);
    } catch (error) {
      console.error("TTS error:", error);
      res.status(500).json({ error: String(error) });
    }
  });

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // For Express 4 and 5 compatibility in catching all routes
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(console.error);
