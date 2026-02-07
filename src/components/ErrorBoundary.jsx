import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100dvh',
          padding: 32,
          textAlign: 'center',
          fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
          background: 'var(--bg, #ffffff)',
          color: 'var(--text, #1A1A2E)',
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>😵</div>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
            오류가 발생했습니다
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text-secondary, #888)', marginBottom: 24, lineHeight: 1.5 }}>
            예상치 못한 문제가 발생했어요.<br />
            새로고침하면 대부분 해결됩니다.
          </p>
          <button
            onClick={this.handleReload}
            style={{
              padding: '12px 32px',
              fontSize: 15,
              fontWeight: 600,
              border: 'none',
              borderRadius: 12,
              background: 'var(--accent, #6C5CE7)',
              color: '#fff',
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(108, 92, 231, 0.3)',
            }}
          >
            새로고침
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
