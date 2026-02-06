import { useState, useCallback } from 'react';

const STEPS = [
  {
    emoji: '🧩',
    title: '노노그램에 오신 걸 환영해요',
    description: '숫자 단서를 보고 셀을 채워\n숨겨진 그림을 완성하는 퍼즐이에요',
  },
  {
    emoji: '🔢',
    title: '숫자가 힌트예요',
    description: '행과 열의 숫자는 연속으로\n채워야 할 셀의 개수를 알려줘요',
    example: true,
  },
  {
    emoji: '👆',
    title: '탭으로 색칠해요',
    description: '셀을 탭하면 색칠돼요\n드래그로 여러 셀을 한번에 채울 수도 있어요',
  },
  {
    emoji: '💡',
    title: '도구를 활용해요',
    description: '❌ X표시로 빈 칸을 표시하고\n💡 힌트로 막힐 때 도움받으세요',
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

  return (
    <div className="tutorial-screen">
      <button className="tutorial-skip" onClick={handleSkip}>
        건너뛰기
      </button>

      <div className="tutorial-body">
        <div
          className={`tutorial-card tutorial-slide-${direction}`}
          key={step}
        >
          <div className="tutorial-emoji">{current.emoji}</div>
          <h2 className="tutorial-title">{current.title}</h2>
          <p className="tutorial-desc">{current.description}</p>

          {current.example && (
            <div className="tutorial-example">
              <div className="example-grid">
                {/* A tiny 5-col visual example */}
                <div className="example-header">
                  <span className="example-clue-col">1</span>
                  <span className="example-clue-col">3</span>
                  <span className="example-clue-col">1</span>
                </div>
                <div className="example-row">
                  <span className="example-clue-row">2</span>
                  <span className="example-cell filled" />
                  <span className="example-cell filled" />
                  <span className="example-cell" />
                </div>
                <div className="example-row">
                  <span className="example-clue-row">1</span>
                  <span className="example-cell" />
                  <span className="example-cell filled" />
                  <span className="example-cell" />
                </div>
                <div className="example-row">
                  <span className="example-clue-row">1</span>
                  <span className="example-cell" />
                  <span className="example-cell filled" />
                  <span className="example-cell filled" />
                </div>
              </div>
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
          {isLast ? '시작하기 🎮' : '다음'}
        </button>
      </div>
    </div>
  );
}
