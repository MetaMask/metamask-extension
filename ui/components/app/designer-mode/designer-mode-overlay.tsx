/**
 * Designer Mode Overlay
 * Handles mouse tracking and element selection
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useDesignerMode } from './designer-mode-context';

// Elements to ignore when hovering
const IGNORED_SELECTORS = [
  '[data-designer-mode]',
  '.designer-mode-overlay',
  '.designer-mode-panel',
  '.designer-mode-highlight',
];

function shouldIgnoreElement(element: HTMLElement): boolean {
  return IGNORED_SELECTORS.some(
    (selector) => element.matches(selector) || element.closest(selector),
  );
}

export function DesignerModeOverlay() {
  const {
    isActive,
    hoveredElement,
    selectedElement,
    isLocked,
    setHoveredElement,
    toggleSelection,
  } = useDesignerMode();

  const overlayRef = useRef<HTMLDivElement>(null);
  const [highlightStyle, setHighlightStyle] = useState<React.CSSProperties>({});

  // Update highlight position based on hovered/selected element
  useEffect(() => {
    const elementInfo = isLocked ? selectedElement : hoveredElement;
    if (!elementInfo) {
      setHighlightStyle({ display: 'none' });
      return;
    }

    const rect = elementInfo.boundingRect;
    setHighlightStyle({
      display: 'block',
      position: 'fixed',
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
      pointerEvents: 'none',
      border: isLocked ? '2px solid #037DD6' : '2px dashed #037DD6',
      backgroundColor: isLocked
        ? 'rgba(3, 125, 214, 0.1)'
        : 'rgba(3, 125, 214, 0.05)',
      borderRadius: '4px',
      zIndex: 999998,
      transition: 'all 0.1s ease-out',
    });
  }, [hoveredElement, selectedElement, isLocked]);

  // Handle mouse move to track hovered elements
  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      if (!isActive || isLocked) {
        return;
      }

      const target = event.target as HTMLElement;
      if (shouldIgnoreElement(target)) {
        return;
      }

      setHoveredElement(target);
    },
    [isActive, isLocked, setHoveredElement],
  );

  // Handle click to lock selection
  const handleClick = useCallback(
    (event: MouseEvent) => {
      if (!isActive) {
        return;
      }

      const target = event.target as HTMLElement;
      if (shouldIgnoreElement(target)) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      toggleSelection(target);
    },
    [isActive, toggleSelection],
  );

  // Attach global event listeners when active
  useEffect(() => {
    if (!isActive) {
      return;
    }

    // Use capture phase to intercept events before they reach components
    document.addEventListener('mousemove', handleMouseMove, { capture: true });
    document.addEventListener('click', handleClick, { capture: true });

    return () => {
      document.removeEventListener('mousemove', handleMouseMove, {
        capture: true,
      });
      document.removeEventListener('click', handleClick, { capture: true });
    };
  }, [isActive, handleMouseMove, handleClick]);

  // Clear hovered element when mouse leaves the window
  useEffect(() => {
    if (!isActive) {
      return;
    }

    const handleMouseLeave = () => {
      if (!isLocked) {
        setHoveredElement(null);
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);
    return () => document.removeEventListener('mouseleave', handleMouseLeave);
  }, [isActive, isLocked, setHoveredElement]);

  if (!isActive) {
    return null;
  }

  const elementInfo = isLocked ? selectedElement : hoveredElement;

  return (
    <>
      {/* Highlight box around selected/hovered element */}
      <div
        className="designer-mode-highlight"
        data-designer-mode="highlight"
        style={highlightStyle}
      />

      {/* Overlay to show element name tooltip */}
      {elementInfo && (
        <div
          ref={overlayRef}
          className="designer-mode-overlay"
          data-designer-mode="overlay"
          style={{
            position: 'fixed',
            top: Math.max(
              0,
              elementInfo.boundingRect.top - 28,
            ),
            left: Math.max(0, elementInfo.boundingRect.left),
            zIndex: 999999,
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              backgroundColor: '#037DD6',
              color: 'white',
              fontSize: '11px',
              fontFamily:
                'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
              padding: '4px 8px',
              borderRadius: '4px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
              maxWidth: '400px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {elementInfo.component.componentName || 'Unknown'}{' '}
            {elementInfo.component.testId && (
              <span style={{ opacity: 0.7 }}>
                [{elementInfo.component.testId}]
              </span>
            )}
            {isLocked && (
              <span style={{ marginLeft: '8px', opacity: 0.8 }}>
                (locked - press C to copy, Esc to unlock)
              </span>
            )}
          </div>
        </div>
      )}
    </>
  );
}
