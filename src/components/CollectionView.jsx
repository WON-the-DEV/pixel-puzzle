import { useMemo, useRef, useEffect, useCallback, useState } from 'react';
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
          // Show completed tile in full color
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
          // Bug 6: No silhouette — just grey block with number, hiding the picture
          ctx.fillStyle = isDark ? '#253355' : '#E0E2E8';
          ctx.fillRect(tx + 1, ty + 1, tileW - 2, tileH - 2);

          // Show "?" instead of number to hide content
          const num = tr * tileCols + tc + 1;
          ctx.fillStyle = isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.15)';
          ctx.font = `bold ${Math.max(12, tileW * 0.25)}px -apple-system, system-ui, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(num.toString(), tx + tileW / 2, ty + tileH / 2);
        }
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
    if (isCompleted) return;
    if (!tileHasContent(tr, tc)) return;

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

/**
 * 미니 프리뷰 — 카드에 작은 컬렉션 프리뷰 표시
 */
function MiniPreview({ collection, completedTiles }) {
  const canvasRef = useRef(null);
  const { id, bigPicture, palette, tileRows, tileCols, tileSize } = collection;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

    const previewSize = 52;
    const totalCols = bigPicture[0].length;
    const totalRows = bigPicture.length;
    const cellSize = previewSize / Math.max(totalRows, totalCols);
    const width = totalCols * cellSize;
    const height = totalRows * cellSize;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = previewSize * dpr;
    canvas.height = previewSize * dpr;
    canvas.style.width = `${previewSize}px`;
    canvas.style.height = `${previewSize}px`;

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    const ox = (previewSize - width) / 2;
    const oy = (previewSize - height) / 2;

    ctx.fillStyle = isDark ? '#1E2A45' : '#F0F1F5';
    ctx.fillRect(0, 0, previewSize, previewSize);

    // Bug 6: Only show completed tiles in color, hide silhouettes for incomplete tiles
    for (let r = 0; r < totalRows; r++) {
      for (let c = 0; c < totalCols; c++) {
        const val = bigPicture[r][c];
        const tr = Math.floor(r / tileSize);
        const tc = Math.floor(c / tileSize);
        const tileKey = `${id}-${tr}-${tc}`;
        const isCompleted = completedTiles.has(tileKey);

        if (isCompleted && val > 0) {
          // Completed tile: show in full color
          ctx.fillStyle = palette[val - 1] || '#888';
          ctx.fillRect(ox + c * cellSize, oy + r * cellSize, cellSize, cellSize);
        }
        // Incomplete tiles: show nothing (no silhouette)
      }
    }
  }, [bigPicture, palette, completedTiles, id, tileSize, tileRows, tileCols]);

  return <canvas ref={canvasRef} style={{ borderRadius: 6, border: '1px solid var(--border-light)' }} />;
}

const DIFF_COLORS = {
  '입문': '#10B981',
  '초급': '#6C5CE7',
  '중급': '#8B5CF6',
  '고급': '#F97316',
};

export default function CollectionView({ collectionProgress, onStartTile }) {
  const [expandedId, setExpandedId] = useState(null);

  const completedTiles = useMemo(
    () => new Set(collectionProgress?.completedTiles || []),
    [collectionProgress]
  );

  // 컬렉션별 진행 데이터 계산
  const collectionStats = useMemo(() => {
    return COLLECTION_DATA.map((collection) => {
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
      return { filledTiles, completedCount, isCollectionComplete, progress };
    });
  }, [completedTiles]);

  return (
    <div className="collection-view">
      {/* 2열 그리드 카드 */}
      <div className="collection-grid-compact">
        {COLLECTION_DATA.map((collection, idx) => {
          const stats = collectionStats[idx];
          const diffColor = DIFF_COLORS[collection.difficulty] || collection.color;
          const isExpanded = expandedId === collection.id;

          return (
            <div key={collection.id}>
              {/* 컴팩트 카드 */}
              <div
                className={`collection-compact-card ${stats.isCollectionComplete ? 'completed' : ''} ${isExpanded ? 'expanded' : ''}`}
                onClick={() => setExpandedId(isExpanded ? null : collection.id)}
                style={{ '--collection-color': collection.color }}
              >
                <MiniPreview collection={collection} completedTiles={completedTiles} />
                <div className="collection-compact-info">
                  <div className="collection-compact-top">
                    <span className="collection-compact-name">
                      {collection.emoji} {collection.name}
                    </span>
                    {stats.isCollectionComplete && (
                      <span className="collection-compact-badge">✅</span>
                    )}
                  </div>
                  <div className="collection-compact-meta">
                    <DifficultyBadge color={diffColor} label={collection.difficulty} size={7} />
                    <span style={{ fontSize: 11, color: 'var(--text-tertiary)', marginLeft: 4 }}>
                      {collection.tileSize}×{collection.tileSize}
                    </span>
                  </div>
                  {/* 진행률 바 */}
                  <div className="collection-compact-progress">
                    <div className="collection-compact-progress-bar">
                      <div
                        className="collection-compact-progress-fill"
                        style={{ width: `${stats.progress}%`, backgroundColor: collection.color }}
                      />
                    </div>
                    <span className="collection-compact-progress-text" style={{ color: collection.color }}>
                      {stats.completedCount}/{stats.filledTiles}
                    </span>
                  </div>
                </div>
              </div>

              {/* 확장 뷰: 큰 그림 */}
              {isExpanded && (
                <div className="collection-expanded-view">
                  <div className="collection-preview-wrapper" style={{ display: 'flex', justifyContent: 'center' }}>
                    <InteractiveBigPicture
                      collection={collection}
                      completedTiles={completedTiles}
                      onStartTile={onStartTile}
                    />
                  </div>
                  <p className="collection-expanded-desc">{collection.description}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
