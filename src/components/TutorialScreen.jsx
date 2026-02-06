import { useState, useCallback } from 'react';
import { NumbersIllust, ControllerIcon } from './icons/Icons.jsx';

/* ── Mini grid examples (CSS-based) ── */
function RuleExample() {
  // 1×5 row: clue "3" → ■■■□□
  return (
    <div className="tutorial-mini-grid">
      <div className="mini-grid-row">
        <span className="mini-clue">3</span>
        <span className="mini-cell filled" />
        <span className="mini-cell filled" />
        <span className="mini-cell filled" />
        <span className="mini-cell" />
        <span className="mini-cell" />
      </div>
      <p className="mini-caption">"3" = 연속 3칸을 채워요</p>
    </div>
  );
}

function CrossExample() {
  // 3×3 grid showing row+col intersection
  return (
    <div className="tutorial-mini-grid">
      <div className="mini-grid-cross">
        <div className="cross-header">
          <span className="cross-spacer" />
          <span className="mini-clue-col">1</span>
          <span className="mini-clue-col">2</span>
          <span className="mini-clue-col">1</span>
        </div>
        <div className="mini-grid-row">
          <span className="mini-clue">2</span>
          <span className="mini-cell filled" />
          <span className="mini-cell filled" />
          <span className="mini-cell" />
        </div>
        <div className="mini-grid-row">
          <span className="mini-clue">1</span>
          <span className="mini-cell" />
          <span className="mini-cell filled highlight-cross" />
          <span className="mini-cell" />
        </div>
        <div className="mini-grid-row">
          <span className="mini-clue">1</span>
          <span className="mini-cell" />
          <span className="mini-cell filled" />
          <span className="mini-cell filled" />
        </div>
      </div>
      <p className="mini-caption">행과 열이 만나는 곳을 찾아요</p>
    </div>
  );
}

function XMarkExample() {
  // 1×4 row showing X marks
  return (
    <div className="tutorial-mini-grid">
      <div className="mini-grid-row">
        <span className="mini-clue">2</span>
        <span className="mini-cell filled" />
        <span className="mini-cell filled" />
        <span className="mini-cell x-mark">✕</span>
        <span className="mini-cell x-mark">✕</span>
      </div>
      <p className="mini-caption">확실히 빈 칸엔 X 표시!</p>
    </div>
  );
}

function ControllerExample() {
  return (
    <div className="tutorial-mini-grid controller-preview">
      <div className="ctrl-preview-dpad">
        <div className="ctrl-row">
          <span /><span className="ctrl-key">▲</span><span />
        </div>
        <div className="ctrl-row">
          <span className="ctrl-key">◀</span>
          <span className="ctrl-dot" />
          <span className="ctrl-key">▶</span>
        </div>
        <div className="ctrl-row">
          <span /><span className="ctrl-key">▼</span><span />
        </div>
      </div>
      <div className="ctrl-preview-actions">
        <span className="ctrl-action fill">채우기</span>
        <span className="ctrl-action mark">X표시</span>
      </div>
    </div>
  );
}

const STEPS = [
  {
    Illust: NumbersIllust,
    title: '숫자는 연속으로 채울 칸 수',
    description: '행·열 옆 숫자가 연속으로\n채워야 할 셀의 개수예요',
    MiniExample: RuleExample,
  },
  {
    Illust: null,
    title: '행과 열을 동시에 만족시키세요',
    description: '같은 칸이 행 단서와 열 단서를\n모두 만족해야 해요',
    MiniExample: CrossExample,
  },
  {
    Illust: null,
    title: 'X로 빈 칸을 표시하면 편해요',
    description: '확실히 비어야 할 칸에 X를 찍으면\n실수를 줄일 수 있어요',
    MiniExample: XMarkExample,
  },
  {
    Illust: null,
    title: '컨트롤러 모드로 정밀 조작!',
    description: '십자 키로 이동, 버튼으로 채우기·X표시\n작은 퍼즐에서 특히 편리해요',
    MiniExample: ControllerExample,
  },
];

export default function TutorialScreen({ onComplete }) {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState('next');

  const handleNext = useCallback(() => {
    if (step < STEPS.length - 1) {
      setDirection('next');
      setStep((s) => s + 1);
    } else {
      onComplete();
    }
  }, [step, onComplete]);

  const handlePrev = useCallback(() => {
    if (step > 0) {
      setDirection('prev');
      setStep((s) => s - 1);
    }
  }, [step]);

  const handleSkip = useCallback(() => {
    onComplete();
  }, [onComplete]);

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const IllustComponent = current.Illust;

  return (
    <div className="tutorial-screen">
      <button className="tutorial-skip" onClick={handleSkip} aria-label="튜토리얼 건너뛰기">
        건너뛰기
      </button>

      <div className="tutorial-body">
        <div
          className={`tutorial-card tutorial-slide-${direction}`}
          key={step}
        >
          {current.Illust && (
            <div className="tutorial-illust">
              <current.Illust size={100} />
            </div>
          )}
          <h2 className="tutorial-title">{current.title}</h2>
          <p className="tutorial-desc">{current.description}</p>

          {current.MiniExample && (
            <div className="tutorial-example">
              <current.MiniExample />
            </div>
          )}
        </div>
      </div>

      {/* Dots */}
      <div className="tutorial-dots">
        {STEPS.map((_, i) => (
          <span
            key={i}
            className={`tutorial-dot${i === step ? ' active' : ''}`}
          />
        ))}
      </div>

      {/* Navigation */}
      <div className="tutorial-nav">
        {step > 0 ? (
          <button className="tutorial-btn-secondary" onClick={handlePrev}>
            이전
          </button>
        ) : (
          <div />
        )}
        <button className="tutorial-btn-primary" onClick={handleNext}>
          {isLast ? '시작하기' : '다음'}
        </button>
      </div>
    </div>
  );
}
