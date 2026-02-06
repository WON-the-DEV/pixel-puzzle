/**
 * 소셜 공유 이미지 생성 — Canvas API
 * 1080×1080 정사각형 이미지로 SNS 최적화
 */

/**
 * 공유 이미지 생성
 * @param {object} opts
 * @param {number[][]} opts.solution - 퍼즐 솔루션 (0=빈, 1=채움 또는 color index)
 * @param {number} opts.size - 퍼즐 사이즈
 * @param {string} opts.puzzleName - 퍼즐 이름
 * @param {number} opts.time - 클리어 시간 (ms)
 * @param {number} opts.stars - 별점 (0-3)
 * @param {string[]} [opts.palette] - 컬러 팔레트 (컬렉션용)
 * @param {boolean} [opts.isDaily] - 일일 챌린지 여부
 * @param {number} [opts.streak] - 연속 클리어 일수
 * @returns {Promise<Blob>} PNG Blob
 */
export async function generateShareImage({ solution, size, puzzleName, time, stars, palette, isDaily, streak }) {
  const W = 1080;
  const H = 1080;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  // ── 배경 그라데이션 ──
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, '#6c5ce7');
  grad.addColorStop(1, '#a855f7');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // subtle pattern overlay
  ctx.fillStyle = 'rgba(255,255,255,0.03)';
  for (let i = 0; i < 20; i++) {
    const x = (i * 73) % W;
    const y = (i * 97) % H;
    ctx.beginPath();
    ctx.arc(x, y, 40 + (i * 17) % 60, 0, Math.PI * 2);
    ctx.fill();
  }

  // ── 상단 로고 ──
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.font = 'bold 52px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('Pixel Puzzle 🧩', W / 2, 100);

  // ── 중앙 픽셀 아트 ──
  const artMaxSize = 560;
  const cellPx = Math.floor(artMaxSize / size);
  const artSize = cellPx * size;
  const artX = (W - artSize) / 2;
  const artY = (H - artSize) / 2 - 40;

  // art background (rounded rect)
  const artPad = 20;
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  roundRect(ctx, artX - artPad, artY - artPad, artSize + artPad * 2, artSize + artPad * 2, 24);
  ctx.fill();

  // default fill color
  const defaultColor = '#E2E8F0';

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const val = solution[r][c];
      if (val > 0) {
        if (palette && palette.length > 0) {
          ctx.fillStyle = palette[val - 1] || defaultColor;
        } else {
          ctx.fillStyle = defaultColor;
        }
        ctx.fillRect(artX + c * cellPx, artY + r * cellPx, cellPx - 1, cellPx - 1);
      }
    }
  }

  // grid lines (subtle)
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= size; i++) {
    ctx.beginPath();
    ctx.moveTo(artX + i * cellPx, artY);
    ctx.lineTo(artX + i * cellPx, artY + artSize);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(artX, artY + i * cellPx);
    ctx.lineTo(artX + artSize, artY + i * cellPx);
    ctx.stroke();
  }

  // ── 하단 정보 ──
  const bottomY = artY + artSize + artPad + 50;

  // 퍼즐 이름
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.font = 'bold 40px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(puzzleName || 'Puzzle', W / 2, bottomY);

  // 별점
  if (stars > 0) {
    const starStr = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
    ctx.font = '36px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(starStr, W / 2, bottomY + 52);
  }

  // 클리어 시간
  const timeStr = formatTime(time);
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.font = '600 32px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(`⏱ ${timeStr}`, W / 2, bottomY + (stars > 0 ? 100 : 52));

  // 일일 챌린지 스트릭
  if (isDaily && streak && streak > 0) {
    ctx.fillStyle = 'rgba(255,200,50,0.95)';
    ctx.font = 'bold 34px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(`🔥 ${streak}일 연속 클리어!`, W / 2, bottomY + (stars > 0 ? 148 : 100));
  }

  // URL
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.font = '500 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('won-the-dev.github.io/pixel-puzzle/', W / 2, H - 50);

  // ── blob 반환 ──
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png');
  });
}

/**
 * 공유 실행 (Web Share API or download)
 */
export async function sharePuzzleResult(opts) {
  const blob = await generateShareImage(opts);
  const file = new File([blob], 'pixel-puzzle-result.png', { type: 'image/png' });

  const shareText = opts.isDaily
    ? `📅 오늘의 퍼즐 클리어! ${'⭐'.repeat(opts.stars || 0)} (${formatTime(opts.time)})${opts.streak ? `\n🔥 ${opts.streak}일 연속!` : ''}\n\nhttps://won-the-dev.github.io/pixel-puzzle/`
    : `🧩 ${opts.puzzleName || 'Puzzle'} 클리어! ${'⭐'.repeat(opts.stars || 0)} (${formatTime(opts.time)})\n\nhttps://won-the-dev.github.io/pixel-puzzle/`;

  // Web Share API (모바일)
  if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        text: shareText,
        files: [file],
      });
      return 'shared';
    } catch (e) {
      if (e.name === 'AbortError') return 'cancelled';
      // fallback to download
    }
  }

  // 다운로드 fallback
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'pixel-puzzle-result.png';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return 'downloaded';
}

// ── Helpers ──

function formatTime(ms) {
  const seconds = Math.floor(ms / 1000);
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
