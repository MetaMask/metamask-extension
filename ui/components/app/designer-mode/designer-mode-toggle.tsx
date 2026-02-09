/**
 * Designer Mode Toggle Button
 * A floating button to toggle designer mode on/off
 */

import React, { useState } from 'react';
import { useDesignerMode } from './designer-mode-context';

export function DesignerModeToggle() {
  const { isActive, toggleDesignerMode } = useDesignerMode();
  const [isHovered, setIsHovered] = useState(false);

  // Don't show the button when designer mode is active (panel has close button)
  if (isActive) {
    return null;
  }

  const buttonStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: '16px',
    right: '16px',
    width: isHovered ? 'auto' : '44px',
    height: '44px',
    padding: isHovered ? '0 16px' : '0',
    backgroundColor: '#037DD6',
    color: 'white',
    border: 'none',
    borderRadius: '22px',
    cursor: 'pointer',
    boxShadow: '0 4px 16px rgba(3, 125, 214, 0.4)',
    zIndex: 999990,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontSize: '13px',
    fontWeight: 600,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    transition: 'all 0.2s ease-out',
  };

  return (
    <button
      type="button"
      style={buttonStyle}
      onClick={toggleDesignerMode}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title="Toggle Designer Mode (Ctrl+Shift+D)"
      data-designer-mode="toggle"
    >
      <span style={{ fontSize: '20px' }}>🎨</span>
      {isHovered && <span>Designer Mode</span>}
    </button>
  );
}
