export interface StatsData {
  totalCards: number;
  totalReviews: number;
  retention: number;
  streak: number;
  masteredCards: number;
  studyDays: number;
}

export async function generateProgressCard(stats: StatsData): Promise<Blob | null> {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 630;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const w = canvas.width;
  const h = canvas.height;

  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, '#0fbd4f');
  grad.addColorStop(0.5, '#065f46');
  grad.addColorStop(1, '#022c22');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Decorative circles
  ctx.fillStyle = 'rgba(255,255,255,0.03)';
  ctx.beginPath();
  ctx.arc(w * 0.9, h * 0.1, 200, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(w * 0.1, h * 0.9, 150, 0, Math.PI * 2);
  ctx.fill();

  // Title
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 48px Inter, system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('FluentCards', 60, 80);

  // Subtitle
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.font = '20px Inter, system-ui, sans-serif';
  ctx.fillText('My Study Progress', 60, 120);

  // Stats grid — 4 boxes
  const boxW = 240;
  const boxH = 160;
  const gap = 30;
  const startX = 60;
  const startY = 190;

  const items = [
    { label: 'Cards', value: stats.totalCards.toString(), color: '#4ade80' },
    { label: 'Reviews', value: stats.totalReviews.toString(), color: '#2dd4bf' },
    { label: 'Retention', value: `${Math.round(stats.retention)}%`, color: '#fbbf24' },
    { label: 'Day Streak', value: stats.streak.toString(), color: '#f87171' },
  ];

  items.forEach((item, i) => {
    const x = startX + i * (boxW + gap);
    const y = startY;

    // Box background
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.beginPath();
    ctx.roundRect(x, y, boxW, boxH, 16);
    ctx.fill();

    // Value
    ctx.fillStyle = item.color;
    ctx.font = 'bold 56px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(item.value, x + boxW / 2, y + 85);

    // Label
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = '18px Inter, system-ui, sans-serif';
    ctx.fillText(item.label, x + boxW / 2, y + 125);
  });

  // Footer
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.font = '16px Inter, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('fluentcards.org — Free flashcard app', w / 2, h - 40);

  // Divider line
  ctx.fillStyle = 'rgba(255,255,255,0.1)';
  ctx.fillRect(60, h - 65, w - 120, 1);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png');
  });
}

export async function shareProgress(stats: StatsData) {
  const blob = await generateProgressCard(stats);
  if (!blob) return;

  const file = new File([blob], 'fluentcards-progress.png', { type: 'image/png' });

  if (navigator.share && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        title: 'My FluentCards Progress',
        text: 'Check out my study progress on FluentCards!',
        files: [file],
      });
      return;
    } catch (e) {
      // User cancelled or share not supported
    }
  }

  // Fallback: download the image
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'fluentcards-progress.png';
  a.click();
  URL.revokeObjectURL(url);
}
