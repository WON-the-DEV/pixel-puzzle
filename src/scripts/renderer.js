/**
 * Canvas 기반 노노그램 렌더러
 */

export class Renderer {
  constructor(canvas, game) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.game = game;
    
    // 스타일 설정
    this.styles = {
      cellSize: 36,
      clueWidth: 60,
      clueHeight: 60,
      padding: 16,
      
      colors: {
        bg: '#ffffff',
        grid: '#e5e8eb',
        gridBold: '#8b95a1',
        cellEmpty: '#ffffff',
        cellFilled: '#191f28',
        cellMarked: '#e5e8eb',
        clueText: '#191f28',
        clueComplete: '#8b95a1',
        highlight: '#3182f6'
      },
      
      fonts: {
        clue: 'bold 14px -apple-system, sans-serif',
        clueSmall: 'bold 11px -apple-system, sans-serif'
      }
    };
    
    this.highlightRow = -1;
    this.highlightCol = -1;
    
    this.setupCanvas();
  }

  /**
   * Canvas 크기 설정
   */
  setupCanvas() {
    const puzzle = this.game.puzzle;
    if (!puzzle) return;
    
    const size = puzzle.size;
    const { cellSize, clueWidth, clueHeight, padding } = this.styles;
    
    // DPR 대응
    const dpr = window.devicePixelRatio || 1;
    
    const width = clueWidth + size * cellSize + padding * 2;
    const height = clueHeight + size * cellSize + padding * 2;
    
    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    
    this.ctx.scale(dpr, dpr);
    
    // 오프셋 계산
    this.offsetX = padding + clueWidth;
    this.offsetY = padding + clueHeight;
  }

  /**
   * 전체 렌더링
   */
  render() {
    const { ctx, styles } = this;
    const puzzle = this.game.puzzle;
    if (!puzzle) return;
    
    // 배경 클리어
    ctx.fillStyle = styles.colors.bg;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.renderClues();
    this.renderGrid();
    this.renderCells();
  }

  /**
   * 단서 렌더링
   */
  renderClues() {
    const { ctx, styles, game } = this;
    const puzzle = game.puzzle;
    const { cellSize, clueWidth, clueHeight, padding } = styles;
    
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // 행 단서 (왼쪽)
    puzzle.rowClues.forEach((clues, i) => {
      const isComplete = game.isRowComplete(i);
      const y = this.offsetY + i * cellSize + cellSize / 2;
      
      ctx.font = clues.length > 3 ? styles.fonts.clueSmall : styles.fonts.clue;
      ctx.fillStyle = isComplete ? styles.colors.clueComplete : styles.colors.clueText;
      
      const clueText = clues.join(' ');
      const x = padding + clueWidth / 2;
      
      // 하이라이트
      if (i === this.highlightRow) {
        ctx.fillStyle = styles.colors.highlight;
      }
      
      ctx.fillText(clueText, x, y);
    });
    
    // 열 단서 (위쪽)
    puzzle.colClues.forEach((clues, j) => {
      const isComplete = game.isColComplete(j);
      const x = this.offsetX + j * cellSize + cellSize / 2;
      
      ctx.font = clues.length > 3 ? styles.fonts.clueSmall : styles.fonts.clue;
      ctx.fillStyle = isComplete ? styles.colors.clueComplete : styles.colors.clueText;
      
      // 하이라이트
      if (j === this.highlightCol) {
        ctx.fillStyle = styles.colors.highlight;
      }
      
      // 세로로 쌓기
      clues.forEach((clue, k) => {
        const y = padding + clueHeight - (clues.length - k) * 16 + 8;
        ctx.fillText(clue.toString(), x, y);
      });
    });
  }

  /**
   * 그리드 렌더링
   */
  renderGrid() {
    const { ctx, styles, game } = this;
    const puzzle = game.puzzle;
    const { cellSize } = styles;
    const size = puzzle.size;
    
    ctx.strokeStyle = styles.colors.grid;
    ctx.lineWidth = 1;
    
    // 가로선
    for (let i = 0; i <= size; i++) {
      const y = this.offsetY + i * cellSize;
      ctx.beginPath();
      ctx.moveTo(this.offsetX, y);
      ctx.lineTo(this.offsetX + size * cellSize, y);
      ctx.stroke();
      
      // 5칸마다 굵은 선
      if (i % 5 === 0) {
        ctx.strokeStyle = styles.colors.gridBold;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.offsetX, y);
        ctx.lineTo(this.offsetX + size * cellSize, y);
        ctx.stroke();
        ctx.strokeStyle = styles.colors.grid;
        ctx.lineWidth = 1;
      }
    }
    
    // 세로선
    for (let j = 0; j <= size; j++) {
      const x = this.offsetX + j * cellSize;
      ctx.beginPath();
      ctx.moveTo(x, this.offsetY);
      ctx.lineTo(x, this.offsetY + size * cellSize);
      ctx.stroke();
      
      // 5칸마다 굵은 선
      if (j % 5 === 0) {
        ctx.strokeStyle = styles.colors.gridBold;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, this.offsetY);
        ctx.lineTo(x, this.offsetY + size * cellSize);
        ctx.stroke();
        ctx.strokeStyle = styles.colors.grid;
        ctx.lineWidth = 1;
      }
    }
  }

  /**
   * 셀 렌더링
   */
  renderCells() {
    const { ctx, styles, game } = this;
    const puzzle = game.puzzle;
    const { cellSize } = styles;
    const size = puzzle.size;
    
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        const cell = game.playerGrid[i][j];
        const x = this.offsetX + j * cellSize;
        const y = this.offsetY + i * cellSize;
        
        if (cell === 1) {
          // 채워진 셀
          ctx.fillStyle = styles.colors.cellFilled;
          ctx.fillRect(x + 2, y + 2, cellSize - 4, cellSize - 4);
        } else if (cell === 2) {
          // X 표시
          ctx.strokeStyle = styles.colors.clueComplete;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x + 8, y + 8);
          ctx.lineTo(x + cellSize - 8, y + cellSize - 8);
          ctx.moveTo(x + cellSize - 8, y + 8);
          ctx.lineTo(x + 8, y + cellSize - 8);
          ctx.stroke();
        }
        
        // 하이라이트
        if (i === this.highlightRow || j === this.highlightCol) {
          ctx.fillStyle = 'rgba(49, 130, 246, 0.1)';
          ctx.fillRect(x, y, cellSize, cellSize);
        }
      }
    }
  }

  /**
   * 터치/클릭 좌표를 셀 좌표로 변환
   */
  getCellAt(x, y) {
    const { cellSize } = this.styles;
    const puzzle = this.game.puzzle;
    if (!puzzle) return null;
    
    const col = Math.floor((x - this.offsetX) / cellSize);
    const row = Math.floor((y - this.offsetY) / cellSize);
    
    if (row >= 0 && row < puzzle.size && col >= 0 && col < puzzle.size) {
      return { row, col };
    }
    return null;
  }

  /**
   * 하이라이트 설정
   */
  setHighlight(row, col) {
    this.highlightRow = row;
    this.highlightCol = col;
  }
}
