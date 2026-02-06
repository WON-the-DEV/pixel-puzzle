import { useMemo, useRef, useEffect } from 'react';
import { COLLECTION_DATA } from '../lib/collections.js';
import { LockIcon, CheckIcon, DifficultyBadge } from './icons/Icons.jsx';

/**
 * 큰 그림 미리보기 (Canvas 기반)
 * 완료된 타일은 컬러로, 미완료는 어두운 실루엣
 */
function BigPicturePreview({ collection, completedTiles, size = 200 }) {
  const canvasRef = useRef(null);
  const { bigPicture, palette, tileRows, tileCols, tileSize } = collection;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const totalRows = bigPicture.length;
    const totalCols = bigPicture[0].length;
    const cellSize = Math.floor(size / Math.max(totalRows, totalCols));
    const width = totalCols * cellSize;
    const height = totalRows * cellSize;
    
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    
    // 배경
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    ctx.fillStyle = isDark ? '#1E2A45' : '#F8F9FA';
    ctx.fillRect(0, 0, width, height);
    
    // 각 셀 그리기
    for (let r = 0; r < totalRows; r++) {
      for (let c = 0; c < totalCols; c++) {
        const colorIdx = bigPicture[r][c];
        if (colorIdx === 0) continue;
        
        const tileRow = Math.floor(r / tileSize);
        const tileCol = Math.floor(c / tileSize);
        const tileKey = `${collection.id}-${tileRow}-${tileCol}`;
        const isCompleted = completedTiles.has(tileKey);
        
        const x = c * cellSize;
        const y = r * cellSize;
        
        if (isCompleted) {
          ctx.fillStyle = palette[colorIdx - 1] || '#888';
        } else {
          // 미완료 타일은 그리지 않음 (완성 전까지 형태 숨김)
          continue;
        }
        
        ctx.fillRect(x, y, cellSize, cellSize);
      }
    }
    
    // 타일 경계선
    ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)';
    ctx.lineWidth = 1;
    for (let tr = 0; tr <= tileRows; tr++) {
      const y = tr * tileSize * cellSize;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    for (let tc = 0; tc <= tileCols; tc++) {
      const x = tc * tileSize * cellSize;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
  }, [bigPicture, palette, tileRows, tileCols, tileSize, completedTiles, size]);

  return (
    <canvas
      ref={canvasRef}
      className="big-picture-canvas"
      style={{ borderRadius: 'var(--radius-md)' }}
    />
  );
}

/**
 * 타일 그리드 — 클릭 가능한 타일들
 */
function TileGrid({ collection, completedTiles, onStartTile }) {
  const { id, tileRows, tileCols, tileSize, bigPicture, palette } = collection;
  
  return (
    <div
      className="tile-grid"
      style={{
        gridTemplateColumns: `repeat(${tileCols}, 1fr)`,
        gridTemplateRows: `repeat(${tileRows}, 1fr)`,
      }}
    >
      {Array.from({ length: tileRows * tileCols }, (_, idx) => {
        const row = Math.floor(idx / tileCols);
        const col = idx % tileCols;
        const tileKey = `${id}-${row}-${col}`;
        const isCompleted = completedTiles.has(tileKey);
        
        // 타일에 실제 콘텐츠가 있는지 확인
        const startR = row * tileSize;
        const startC = col * tileSize;
        let hasFilled = false;
        for (let r = startR; r < startR + tileSize && r < bigPicture.length; r++) {
          for (let c = startC; c < startC + tileSize && c < bigPicture[0].length; c++) {
            if (bigPicture[r][c] > 0) {
              hasFilled = true;
              break;
            }
          }
          if (hasFilled) break;
        }
        
        // 비어있는 타일은 클릭 불가
        if (!hasFilled) {
          return (
            <div key={tileKey} className="tile-cell tile-empty" />
          );
        }
        
        return (
          <button
            key={tileKey}
            className={`tile-cell ${isCompleted ? 'tile-completed' : 'tile-available'}`}
            onClick={() => !isCompleted && onStartTile(id, row, col)}
          >
            {isCompleted ? (
              <TileMiniPreview
                bigPicture={bigPicture}
                palette={palette}
                tileSize={tileSize}
                tileRow={row}
                tileCol={col}
              />
            ) : (
              <div className="tile-locked-content">
                <span className="tile-number">{idx + 1}</span>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

/**
 * 완료된 타일의 미니 미리보기
 */
function TileMiniPreview({ bigPicture, palette, tileSize, tileRow, tileCol }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const cellSize = 4;
    const w = tileSize * cellSize;
    const h = tileSize * cellSize;
    const dpr = window.devicePixelRatio || 1;
    
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    
    const startR = tileRow * tileSize;
    const startC = tileCol * tileSize;
    
    for (let r = 0; r < tileSize; r++) {
      for (let c = 0; c < tileSize; c++) {
        const pr = startR + r;
        const pc = startC + c;
        const val = (pr < bigPicture.length && pc < bigPicture[0].length) ? bigPicture[pr][pc] : 0;
        
        if (val > 0) {
          ctx.fillStyle = palette[val - 1] || '#888';
          ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
        }
      }
    }
  }, [bigPicture, palette, tileSize, tileRow, tileCol]);

  return <canvas ref={canvasRef} className="tile-mini-canvas" />;
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
        const totalTiles = collection.tileRows * collection.tileCols;
        // Count only tiles that have actual content
        let filledTiles = 0;
        let completedCount = 0;
        for (let r = 0; r < collection.tileRows; r++) {
          for (let c = 0; c < collection.tileCols; c++) {
            const startR = r * collection.tileSize;
            const startC = c * collection.tileSize;
            let hasFilled = false;
            for (let pr = startR; pr < startR + collection.tileSize && pr < collection.bigPicture.length; pr++) {
              for (let pc = startC; pc < startC + collection.tileSize && pc < collection.bigPicture[0].length; pc++) {
                if (collection.bigPicture[pr][pc] > 0) {
                  hasFilled = true;
                  break;
                }
              }
              if (hasFilled) break;
            }
            if (hasFilled) {
              filledTiles++;
              const key = `${collection.id}-${r}-${c}`;
              if (completedTiles.has(key)) completedCount++;
            }
          }
        }
        
        const isCollectionComplete = completedCount >= filledTiles && filledTiles > 0;
        const progress = filledTiles > 0 ? Math.round((completedCount / filledTiles) * 100) : 0;
        const diffColor = DIFF_COLORS[collection.difficulty] || collection.color;

        return (
          <div className="collection-card" key={collection.id}>
            <div className="collection-card-header">
              <div className="collection-card-info">
                <span className="collection-emoji">{collection.emoji}</span>
                <div>
                  <h3 className="collection-name">{collection.name}</h3>
                  <p className="collection-desc">{collection.description}</p>
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

            {/* Big picture preview */}
            <div className="collection-preview-wrapper">
              <BigPicturePreview
                collection={collection}
                completedTiles={completedTiles}
                size={Math.min(280, window.innerWidth - 80)}
              />
            </div>

            {/* Progress */}
            <div className="collection-progress">
              <div className="collection-progress-bar">
                <div
                  className="collection-progress-fill"
                  style={{
                    width: `${progress}%`,
                    backgroundColor: collection.color,
                  }}
                />
              </div>
              <span className="collection-progress-text" style={{ color: collection.color }}>
                {completedCount}/{filledTiles}
              </span>
            </div>

            {/* Tile grid */}
            <TileGrid
              collection={collection}
              completedTiles={completedTiles}
              onStartTile={onStartTile}
            />
          </div>
        );
      })}
    </div>
  );
}
