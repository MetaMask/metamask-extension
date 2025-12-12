import type React from 'react';

export const containerStyle: React.CSSProperties = {
  minHeight: '100vh',
  background: 'linear-gradient(180deg, #0f0f1a 0%, #1a1a2e 100%)',
  color: '#e0e0e0',
  padding: '32px 20px',
};

export const contentStyle: React.CSSProperties = {
  maxWidth: '520px',
  margin: '0 auto',
};

export const headerStyle: React.CSSProperties = {
  textAlign: 'center',
  marginBottom: '32px',
};

export const titleStyle: React.CSSProperties = {
  fontSize: '28px',
  fontWeight: 700,
  margin: 0,
  background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
};

export const subtitleStyle: React.CSSProperties = {
  color: '#888',
  fontSize: '14px',
  marginTop: '8px',
};

export const detailsStyle: React.CSSProperties = {
  marginBottom: '24px',
  background: '#1a1a2e',
  borderRadius: '12px',
  padding: '4px',
};

export const summaryStyle: React.CSSProperties = {
  padding: '12px 16px',
  cursor: 'pointer',
  color: '#888',
  fontSize: '13px',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
};

export const buttonBaseStyle: React.CSSProperties = {
  width: '100%',
  padding: '14px 20px',
  borderRadius: '10px',
  border: 'none',
  fontSize: '15px',
  fontWeight: 600,
  marginBottom: '12px',
  transition: 'all 0.2s ease',
};

export const primaryButtonStyle: React.CSSProperties = {
  ...buttonBaseStyle,
  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
  color: '#fff',
  boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)',
  cursor: 'pointer',
};

export const secondaryButtonStyle: React.CSSProperties = {
  ...buttonBaseStyle,
  background: 'linear-gradient(135deg, #3a3a4e 0%, #4a4a5e 100%)',
  color: '#e0e0e0',
  cursor: 'pointer',
};

export const disabledButtonStyle: React.CSSProperties = {
  ...buttonBaseStyle,
  background: '#2a2a3e',
  color: '#666',
  opacity: 0.6,
  cursor: 'not-allowed',
};

export function getButtonStyle(
  variant: 'primary' | 'secondary' | 'disabled',
): React.CSSProperties {
  switch (variant) {
    case 'primary':
      return primaryButtonStyle;
    case 'secondary':
      return secondaryButtonStyle;
    default:
      return disabledButtonStyle;
  }
}
