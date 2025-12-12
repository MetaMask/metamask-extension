/* eslint-disable @metamask/design-tokens/color-no-hex */
import React, { useEffect, useRef, useState } from 'react';
import * as qrcode from 'qrcode';

type QRCodeDisplayProps = {
  data: string;
  title: string;
  subtitle?: string;
  onCancel: () => void;
  onStart?: () => void;
  status?: 'waiting' | 'connecting' | 'connected' | 'error';
  statusMessage?: string;
  size?: number;
};

export const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({
  data,
  title,
  subtitle,
  onCancel,
  onStart,
  status = 'waiting',
  statusMessage,
  size = 200,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    qrcode
      .toCanvas(canvas, data, {
        width: size,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
        errorCorrectionLevel: 'M',
      })
      .catch((err) => {
        console.error('QR code generation failed:', err);
      });
  }, [data, size]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(data);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const t = document.createElement('textarea');
      t.value = data;
      document.body.appendChild(t);
      t.select();
      document.execCommand('copy');
      document.body.removeChild(t);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const statusColors: Record<string, string> = {
    waiting: '#6366f1',
    connecting: '#f59e0b',
    connected: '#22c55e',
    error: '#ef4444',
  };

  const statusIcons: Record<string, string> = {
    waiting: '📱',
    connecting: '🔄',
    connected: '✓',
    error: '✗',
  };

  const statusMessages: Record<string, string> = {
    waiting: 'Scan QR with mobile app',
    connecting: 'Connecting...',
    connected: 'Mobile connected!',
    error: 'Connection failed',
  };

  const showStartButton = status === 'waiting' && onStart;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.9)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: '#1a1a2e',
          borderRadius: '16px',
          padding: '24px',
          maxWidth: '360px',
          textAlign: 'center',
        }}
      >
        <h3 style={{ margin: '0 0 8px', color: '#fff', fontSize: '18px' }}>
          {title}
        </h3>
        {subtitle && (
          <p style={{ margin: '0 0 16px', color: '#888', fontSize: '13px' }}>
            {subtitle}
          </p>
        )}

        <div
          style={{
            background: '#fff',
            padding: '12px',
            borderRadius: '12px',
            display: 'inline-block',
            marginBottom: '16px',
          }}
        >
          <canvas ref={canvasRef} style={{ display: 'block' }} />
        </div>

        {/* Status indicator */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '12px',
            background: `${statusColors[status]}20`,
            borderRadius: '8px',
            marginBottom: '16px',
            border: `1px solid ${statusColors[status]}40`,
          }}
        >
          <span
            style={{
              fontSize: '16px',
              animation:
                status === 'waiting' || status === 'connecting'
                  ? 'pulse 1.5s infinite'
                  : 'none',
            }}
          >
            {statusIcons[status]}
          </span>
          <span style={{ color: statusColors[status], fontSize: '14px' }}>
            {statusMessage || statusMessages[status]}
          </span>
        </div>

        <style>
          {`
            @keyframes pulse {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.4; }
            }
          `}
        </style>

        {/* Start button */}
        {showStartButton && (
          <button
            type="button"
            onClick={onStart}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '8px',
              border: 'none',
              background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
              color: '#fff',
              fontSize: '16px',
              fontWeight: 600,
              cursor: 'pointer',
              marginBottom: '12px',
            }}
          >
            📱 Mobile Scanned? Connect
          </button>
        )}

        {/* Show QR data */}
        <details style={{ marginBottom: '12px' }}>
          <summary
            style={{ color: '#666', fontSize: '12px', cursor: 'pointer' }}
          >
            Show QR data
          </summary>
          <div
            style={{
              background: '#0a0a12',
              borderRadius: '8px',
              padding: '10px',
              marginTop: '8px',
              maxHeight: '60px',
              overflow: 'auto',
            }}
          >
            <code
              style={{ fontSize: '9px', color: '#666', wordBreak: 'break-all' }}
            >
              {data}
            </code>
          </div>
        </details>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            type="button"
            onClick={handleCopy}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: '8px',
              border: 'none',
              background: '#3a3a4e',
              color: '#fff',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: '8px',
              border: 'none',
              background: '#dc2626',
              color: '#fff',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default QRCodeDisplay;
