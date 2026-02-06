import { useMemo, useRef, useEffect, useCallback } from 'react';
import { COLLECTION_DATA } from '../lib/collections.js';
import { DifficultyBadge } from './icons/Icons.jsx';

/**
 * 인터랙티브 큰 그림 — 타일 탭하면 바로 게임 시작
 * 완료된 타일만 컬러로, 미완료는 빈 그리드
 */
function InteractiveBigPicture({ collection, completedTiles, onStartTile }) {
  const canvasRef = useRef(null);
  const layoutRef = useRef(null);
  const { id, bigPicture, palette, tileRows, tileCols, tileSize } = collection;

  // 타일에 실제 채워진 셀이 있는지 체크
  const tileHasContent = useCallback((tileRow, tileCol) => {
    const startR = tileRow * tileSize;
    const startC = tileCol * tileSize;
    for (let r = startR; r < startR + tileSize && r < bigPicture.length; r++) {
      for (let c = startC; c < startC + tileSize && c < bigPicture[0].length; c++) {
        if (bigPicture[r][c] > 0) return true;
      }
    }
    return false;
  }, [bigPicture, tileSize]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const maxWidth = Math.min(window.innerWidth - 48, 400);
    const totalCols = bigPicture[0].length;
    const totalRows = bigPicture.length;
    const cellSize = Math.floor(maxWidth / Math.max(totalRows, totalCols));
    const width = totalCols * cellSize;
    const height = totalRows * cellSize;
    const tileW = tileSize * cellSize;
    const tileH = tileSize * cellSize;

    layoutRef.current = { cellSize, width, height, tileW, tileH };

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    // 배경
    ctx.fillStyle = isDark ? '#1E2A45' : '#F0F1F5';
    ctx.fillRect(0, 0, width, height);

    // 각 타일 그리기
    for (let tr = 0; tr < tileRows; tr++) {
      for (let tc = 0; tc < tileCols; tc++) {
        const tileKey = `${id}-${tr}-${tc}`;
        const isCompleted = completedTiles.has(tileKey);
        const hasContent = tileHasContent(tr, tc);
        const tx = tc * tileW;
        const ty = tr * tileH;

        if (isCompleted) {
          // 완료된 타일: 컬러로 각 셀 그리기
          const startR = tr * tileSize;
          const startC = tc * tileSize;
          for (let r = 0; r < tileSize; r++) {
            for (let c = 0; c < tileSize; c++) {
              const pr = startR + r;
              const pc = startC + c;
              if (pr < bigPicture.length && pc < bigPicture[0].length) {
                const colorIdx = bigPicture[pr][pc];
                if (colorIdx > 0) {
                  ctx.fillStyle = palette[colorIdx - 1] || '#888';
                  ctx.fillRect(tx + c * cellSize, ty + r * cellSize, cellSize, cellSize);
                }
              }
            }
          }
        } else if (hasContent) {
          // 미완료 타일: 약간 밝은 배경 + 번호 표시
          ctx.fillStyle = isDark ? '#253355' : '#E8E9EE';
          ctx.fillRect(tx + 1, ty + 1, tileW - 2, tileH - 2);

          // 타일 번호
          const num = tr * tileCols + tc + 1;
          ctx.fillStyle = isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.2)';
          ctx.font = `bold ${Math.max(12, tileW * 0.25)}px -apple-system, system-ui, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(num.toString(), tx + tileW / 2, ty + tileH / 2);
        }
        // 콘텐츠 없는 타일: 배경만 (빈 공간)
      }
    }

    // 타일 경계선
    ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)';
    ctx.lineWidth = 1;
    for (let tr = 0; tr <= tileRows; tr++) {
      const y = tr * tileH;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
    }
    for (let tc = 0; tc <= tileCols; tc++) {
      const x = tc * tileW;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
    }
  }, [bigPicture, palette, tileRows, tileCols, tileSize, completedTiles, id, tileHasContent]);

  useEffect(() => { render(); }, [render]);
  useEffect(() => {
    const h = () => render();
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, [render]);
  useEffect(() => {
    const ob = new MutationObserver(() => render());
    ob.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => ob.disconnect();
  }, [render]);

  // 클릭 → 타일 찾기 → 게임 시작
  const handleClick = useCallback((e) => {
    const canvas = canvasRef.current;
    const layout = layoutRef.current;
    if (!canvas || !layout) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const tc = Math.floor(x / layout.tileW);
    const tr = Math.floor(y / layout.tileH);

    if (tr < 0 || tr >= tileRows || tc < 0 || tc >= tileCols) return;

    const tileKey = `${id}-${tr}-${tc}`;
    const isCompleted = completedTiles.has(tileKey);
    if (isCompleted) return; // 이미 완료
    if (!tileHasContent(tr, tc)) return; // 빈 타일

    onStartTile(id, tr, tc);
  }, [id, tileRows, tileCols, completedTiles, tileHasContent, onStartTile]);

  return (
    <canvas
      ref={canvasRef}
      className="big-picture-canvas interactive"
      style={{ borderRadius: 'var(--radius-md)', cursor: 'pointer' }}
      onClick={handleClick}
    />
  );
}

const DIFF_COLORS = {
  '입문': '#10B981',
  '초급': '#6C5CE7',
  '중급': '#8B5CF6',
  '고급': '#F97316',
};

export default function CollectionView({ collectionProgress, onStartTile }) {
  const completedTiles = useMemo(
    () => new Set(collectionProgress?.completedTiles || []),
    [collectionProgress]
  );

  return (
    <div className="collection-view">
      {COLLECTION_DATA.map((collection) => {
        // 콘텐츠 있는 타일 수 & 완료 수 계산
        let filledTiles = 0;
        let completedCount = 0;
        for (let r = 0; r < collection.tileRows; r++) {
          for (let c = 0; c < collection.tileCols; c++) {
            const startR = r * collection.tileSize;
            const startC = c * collection.tileSize;
            let hasFilled = false;
            for (let pr = startR; pr < startR + collection.tileSize && pr < collection.bigPicture.length; pr++) {
              for (let pc = startC; pc < startC + collection.tileSize && pc < collection.bigPicture[0].length; pc++) {
                if (collection.bigPicture[pr][pc] > 0) { hasFilled = true; break; }
              }
              if (hasFilled) break;
            }
            if (hasFilled) {
              filledTiles++;
              if (completedTiles.has(`${collection.id}-${r}-${c}`)) completedCount++;
            }
          }
        }

        const isCollectionComplete = completedCount >= filledTiles && filledTiles > 0;
        const progress = filledTiles > 0 ? Math.round((completedCount / filledTiles) * 100) : 0;
        const diffColor = DIFF_COLORS[collection.difficulty] || collection.color;

        return (
          <div className="collection-card" key={collection.id}>
            {/* 헤더 */}
            <div className="collection-card-header">
              <div className="collection-card-info">
                <span className="collection-emoji">{collection.emoji}</span>
                <div>
                  <h3 className="collection-name">{collection.name}</h3>
                  <span className="collection-diff-badge" style={{ color: diffColor }}>
                    <DifficultyBadge color={diffColor} label={collection.difficulty} size={8} />
                    <span style={{ marginLeft: 4, fontSize: 11, color: 'var(--text-tertiary)' }}>
                      {collection.tileSize}×{collection.tileSize}
                    </span>
                  </span>
                </div>
              </div>
              {isCollectionComplete && (
                <span className="collection-badge">완료!</span>
              )}
            </div>

            {/* 통합 그리드 (미리보기 + 스테이지 선택 합침) */}
            <div className="collection-preview-wrapper" style={{ display: 'flex', justifyContent: 'center' }}>
              <InteractiveBigPicture
                collection={collection}
                completedTiles={completedTiles}
                onStartTile={onStartTile}
              />
            </div>

            {/* 진행률 */}
            <div className="collection-progress">
              <div className="collection-progress-bar">
                <div
                  className="collection-progress-fill"
                  style={{ width: `${progress}%`, backgroundColor: collection.color }}
                />
              </div>
              <span className="collection-progress-text" style={{ color: collection.color }}>
                {completedCount}/{filledTiles}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
