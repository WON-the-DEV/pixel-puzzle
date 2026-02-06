/**
 * 노노그램 메인 엔트리포인트
 */

import { Game } from './game.js';
import { Renderer } from './renderer.js';

class NonogramApp {
  constructor() {
    this.game = new Game();
    this.renderer = null;
    this.timerInterval = null;
    this.isDragging = false;
    this.dragValue = null;
    
    this.init();
  }

  init() {
    // DOM 요소
    this.canvas = document.getElementById('game-canvas');
    this.levelNumber = document.getElementById('level-number');
    this.levelSize = document.getElementById('level-size');
    this.timer = document.getElementById('timer');
    this.hintCount = document.getElementById('hint-count');
    this.modeIcon = document.getElementById('mode-icon');
    this.modeLabel = document.getElementById('mode-label');
    this.completeModal = document.getElementById('complete-modal');
    this.clearTime = document.getElementById('clear-time');
    
    // 게임 콜백 설정
    this.game.onUpdate = () => this.onGameUpdate();
    this.game.onComplete = (result) => this.onGameComplete(result);
    
    // 이벤트 바인딩
    this.bindEvents();
    
    // 저장된 게임 복원 또는 새 게임
    const saved = this.loadSavedGame();
    if (saved) {
      this.game.load(saved);
    } else {
      this.game.startLevel(1);
    }
    
    // 렌더러 초기화
    this.renderer = new Renderer(this.canvas, this.game);
    this.renderer.render();
    
    // 타이머 시작
    this.startTimer();
  }

  bindEvents() {
    // 캔버스 터치/마우스 이벤트
    this.canvas.addEventListener('mousedown', (e) => this.onPointerDown(e));
    this.canvas.addEventListener('mousemove', (e) => this.onPointerMove(e));
    this.canvas.addEventListener('mouseup', () => this.onPointerUp());
    this.canvas.addEventListener('mouseleave', () => this.onPointerUp());
    
    this.canvas.addEventListener('touchstart', (e) => this.onPointerDown(e), { passive: false });
    this.canvas.addEventListener('touchmove', (e) => this.onPointerMove(e), { passive: false });
    this.canvas.addEventListener('touchend', () => this.onPointerUp());
    this.canvas.addEventListener('touchcancel', () => this.onPointerUp());
    
    // 버튼들
    document.getElementById('btn-hint').addEventListener('click', () => this.onHint());
    document.getElementById('btn-undo').addEventListener('click', () => this.game.undo());
    document.getElementById('btn-redo').addEventListener('click', () => this.game.redo());
    document.getElementById('btn-mode').addEventListener('click', () => this.onToggleMode());
    document.getElementById('btn-next').addEventListener('click', () => this.onNextLevel());
    
    // 윈도우 이벤트
    window.addEventListener('resize', () => this.onResize());
    window.addEventListener('beforeunload', () => this.saveGame());
    
    // 가시성 변경 시 저장
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.saveGame();
      }
    });
  }

  getPointerPos(e) {
    const rect = this.canvas.getBoundingClientRect();
    let x, y;
    
    if (e.touches) {
      e.preventDefault();
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }
    
    return { x, y };
  }

  onPointerDown(e) {
    const pos = this.getPointerPos(e);
    const cell = this.renderer.getCellAt(pos.x, pos.y);
    
    if (cell) {
      this.isDragging = true;
      this.game.toggleCell(cell.row, cell.col);
      this.dragValue = this.game.playerGrid[cell.row][cell.col];
    }
  }

  onPointerMove(e) {
    const pos = this.getPointerPos(e);
    const cell = this.renderer.getCellAt(pos.x, pos.y);
    
    if (cell) {
      // 하이라이트 업데이트
      this.renderer.setHighlight(cell.row, cell.col);
      
      // 드래그 중이면 셀 채우기
      if (this.isDragging && this.dragValue !== null) {
        this.game.fillCell(cell.row, cell.col, this.dragValue);
      }
      
      this.renderer.render();
    } else {
      this.renderer.setHighlight(-1, -1);
      this.renderer.render();
    }
  }

  onPointerUp() {
    if (this.isDragging) {
      this.game.endDrag();
      this.isDragging = false;
      this.dragValue = null;
    }
  }

  onHint() {
    if (this.game.useHint()) {
      // 힌트 사용됨
      this.hintCount.textContent = this.game.hints;
    } else {
      // 힌트 없음 - 광고 보여주기 (TODO: 앱인토스 광고 연동)
      alert('힌트가 없습니다! 광고를 보고 힌트를 얻으세요.');
    }
  }

  onToggleMode() {
    this.game.toggleMode();
    this.updateModeButton();
  }

  onNextLevel() {
    this.completeModal.classList.add('hidden');
    this.game.startLevel(this.game.level + 1);
    this.renderer.setupCanvas();
    this.renderer.render();
    this.saveGame();
  }

  onResize() {
    if (this.renderer) {
      this.renderer.setupCanvas();
      this.renderer.render();
    }
  }

  onGameUpdate() {
    this.updateUI();
    this.renderer.render();
  }

  onGameComplete(result) {
    this.clearTime.textContent = this.formatTime(result.time);
    this.completeModal.classList.remove('hidden');
    this.saveGame();
  }

  updateUI() {
    const puzzle = this.game.puzzle;
    
    this.levelNumber.textContent = `Level ${this.game.level}`;
    this.levelSize.textContent = `${puzzle.size}×${puzzle.size}`;
    this.hintCount.textContent = this.game.hints;
    
    this.updateModeButton();
  }

  updateModeButton() {
    if (this.game.mode === 'fill') {
      this.modeIcon.textContent = '✏️';
      this.modeLabel.textContent = '색칠';
    } else {
      this.modeIcon.textContent = '❌';
      this.modeLabel.textContent = 'X표시';
    }
  }

  startTimer() {
    this.timerInterval = setInterval(() => {
      if (!this.game.isComplete) {
        this.timer.textContent = this.formatTime(this.game.getElapsedTime());
      }
    }, 1000);
  }

  formatTime(ms) {
    const seconds = Math.floor(ms / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  saveGame() {
    try {
      const data = this.game.save();
      localStorage.setItem('nonogram_save', JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save game:', e);
    }
  }

  loadSavedGame() {
    try {
      const saved = localStorage.getItem('nonogram_save');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      console.error('Failed to load game:', e);
      return null;
    }
  }
}

// 앱 시작
document.addEventListener('DOMContentLoaded', () => {
  window.app = new NonogramApp();
});
