import React from 'react';

type StatusType = 'info' | 'success' | 'error' | 'warning';

type StatusDisplayProps = {
  status: string;
  type: StatusType;
  isLoading?: boolean;
};

const STATUS_STYLES: Record<StatusType, React.CSSProperties> = {
  info: {
    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
    borderColor: '#4a69bd',
    color: '#74b9ff',
  },
  success: {
    background: 'linear-gradient(135deg, #0a3d2e 0%, #145a32 100%)',
    borderColor: '#27ae60',
    color: '#58d68d',
  },
  error: {
    background: 'linear-gradient(135deg, #3d0a0a 0%, #5a1414 100%)',
    borderColor: '#c0392b',
    color: '#f1948a',
  },
  warning: {
    background: 'linear-gradient(135deg, #3d2e0a 0%, #5a4314 100%)',
    borderColor: '#f39c12',
    color: '#f9e79f',
  },
};

const STATUS_ICONS: Record<StatusType, string> = {
  info: '○',
  success: '✓',
  error: '✗',
  warning: '!',
};

export const StatusDisplay: React.FC<StatusDisplayProps> = ({
  status,
  type,
  isLoading = false,
}) => {
  const styles = STATUS_STYLES[type];
  const icon = STATUS_ICONS[type];

  return (
    <div
      style={{
        ...styles,
        padding: '16px 20px',
        borderRadius: '12px',
        border: `2px solid ${styles.borderColor}`,
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        fontSize: '15px',
        fontWeight: 500,
        letterSpacing: '0.3px',
        boxShadow: `0 4px 20px ${styles.borderColor}33`,
      }}
    >
      <span
        style={{
          width: '28px',
          height: '28px',
          borderRadius: '50%',
          background: styles.borderColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '14px',
          fontWeight: 700,
          color: '#fff',
          flexShrink: 0,
          animation: isLoading ? 'pulse 1.5s infinite' : 'none',
        }}
      >
        {isLoading ? '...' : icon}
      </span>
      <span>{status}</span>
      <style>
        {`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}
      </style>
    </div>
  );
};

export default StatusDisplay;

