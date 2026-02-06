import { useMemo } from 'react';
import { COLLECTIONS, createPuzzleForLevel } from '../lib/puzzle.js';

// 퍼즐의 solution 그리드를 캐시해서 반복 생성 방지
const puzzleCache = {};
function getPuzzleSolution(level) {
  if (!puzzleCache[level]) {
    puzzleCache[level] = createPuzzleForLevel(level);
  }
  return puzzleCache[level].solution;
}

function MiniGrid({ solution, completed, size = 40 }) {
  const gridSize = solution.length;
  const cellSize = size / gridSize;

  return (
    <div
      className="mini-grid"
      style={{
        width: size,
        height: size,
        display: 'grid',
        gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
        gap: 0,
        borderRadius: 4,
        overflow: 'hidden',
        opacity: completed ? 1 : 0.3,
        filter: completed ? 'none' : 'grayscale(1)',
      }}
    >
      {solution.flat().map((cell, idx) => (
        <div
          key={idx}
          style={{
            width: '100%',
            aspectRatio: '1',
            backgroundColor: cell === 1
              ? (completed ? '#191f28' : '#b0b8c1')
              : (completed ? '#f2f4f6' : '#e5e8eb'),
          }}
        />
      ))}
    </div>
  );
}

export default function CollectionView({ completedLevels }) {
  const completedSet = useMemo(() => new Set(completedLevels), [completedLevels]);

  return (
    <div className="collection-view">
      {COLLECTIONS.map((collection) => {
        const completedCount = collection.levels.filter(l => completedSet.has(l)).length;
        const totalCount = collection.levels.length;
        const isCollectionComplete = completedCount === totalCount;
        const progress = Math.round((completedCount / totalCount) * 100);

        return (
          <div className="collection-card" key={collection.id}>
            <div className="collection-card-header">
              <div className="collection-card-info">
                <span className="collection-emoji">{collection.emoji}</span>
                <div>
                  <h3 className="collection-name">{collection.name}</h3>
                  <p className="collection-desc">{collection.description}</p>
                </div>
              </div>
              {isCollectionComplete && (
                <span className="collection-badge">완료!</span>
              )}
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
                {completedCount}/{totalCount}
              </span>
            </div>

            {/* Grid of mini puzzles */}
            <div
              className="collection-grid"
              style={{
                gridTemplateColumns: `repeat(${collection.gridCols}, 1fr)`,
              }}
            >
              {collection.levels.map((level) => {
                const solution = getPuzzleSolution(level);
                const isCompleted = completedSet.has(level);

                return (
                  <div className="collection-tile" key={level}>
                    <MiniGrid
                      solution={solution}
                      completed={isCompleted}
                      size={solution.length <= 5 ? 48 : solution.length <= 8 ? 44 : 40}
                    />
                    <span className="collection-tile-level">Lv.{level}</span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
