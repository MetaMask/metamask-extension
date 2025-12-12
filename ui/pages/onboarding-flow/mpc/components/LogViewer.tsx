import React, { useRef, useEffect } from 'react';

type LogViewerProps = {
  logs: string[];
  maxHeight?: string;
};

export const LogViewer: React.FC<LogViewerProps> = ({
  logs,
  maxHeight = '200px',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs]);

  if (logs.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        marginTop: '20px',
        borderTop: '1px solid #333',
        paddingTop: '16px',
      }}
    >
      <div
        style={{
          fontSize: '13px',
          fontWeight: 600,
          color: '#a0a0a0',
          marginBottom: '10px',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}
      >
        Activity Log
      </div>
      <div
        ref={containerRef}
        style={{
          background: '#0a0a12',
          borderRadius: '8px',
          padding: '12px',
          maxHeight,
          overflowY: 'auto',
          fontFamily: 'JetBrains Mono, Fira Code, Monaco, monospace',
          fontSize: '12px',
          lineHeight: '1.6',
        }}
      >
        {logs.map((log, index) => {
          const isError = log.includes('Error') || log.includes('✗');
          const isSuccess = log.includes('✓') || log.includes('complete');
          const isWarning = log.includes('⚠') || log.includes('Warning');

          let color = '#8b8b9e';
          if (isError) {
            color = '#f87171';
          } else if (isSuccess) {
            color = '#4ade80';
          } else if (isWarning) {
            color = '#fbbf24';
          }

          return (
            <div
              // eslint-disable-next-line react/no-array-index-key
              key={index}
              style={{
                color,
                paddingLeft: '8px',
                borderLeft: `2px solid ${color}33`,
                marginBottom: '4px',
              }}
            >
              {log}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LogViewer;

