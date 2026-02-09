/**
 * Designer Mode Panel — Figma-like inspector with editable values
 *
 * Provides a right-side floating panel that displays element information
 * organized into collapsible sections. All style values are editable inline,
 * and changes are applied directly to the DOM element for rapid prototyping.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useDesignerMode } from './designer-mode-context';
import { extractDesignTokensFromClasses } from './designer-mode.utils';
import type { ComputedStyleInfo } from './designer-mode.types';

// ═══════════════════════════════════════════════════════════════════
// Theme constants (Figma-inspired dark palette)
// ═══════════════════════════════════════════════════════════════════

const C = {
  bg: '#2c2c2c',
  surface: '#383838',
  surfaceHover: '#404040',
  input: '#1e1e1e',
  inputHover: '#2a2a2a',
  inputFocus: '#0d99ff',
  text: '#ffffff',
  textSecondary: '#adadad',
  textTertiary: '#777777',
  accent: '#0d99ff',
  accentDim: 'rgba(13, 153, 255, 0.15)',
  success: '#30d158',
  divider: '#404040',
  chevron: '#888888',
} as const;

const FONT =
  'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
const MONO =
  'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, monospace';

// ═══════════════════════════════════════════════════════════════════
// Sub-component: EditableValue
// Click-to-edit inline value with Enter/Escape/Blur handling
// ═══════════════════════════════════════════════════════════════════

type EditableValueProps = {
  value: string;
  onApply: (newValue: string) => void;
  isColor?: boolean;
  mono?: boolean;
  placeholder?: string;
  multiline?: boolean;
};

function EditableValue({
  value,
  onApply,
  isColor = false,
  mono = false,
  placeholder,
  multiline = false,
}: EditableValueProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const colorRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    if (!isEditing) {
      setEditValue(value);
    }
  }, [value, isEditing]);

  const handleApply = useCallback(() => {
    if (editValue !== value) {
      onApply(editValue);
    }
    setIsEditing(false);
  }, [editValue, value, onApply]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !multiline) {
        handleApply();
      } else if (e.key === 'Escape') {
        setEditValue(value);
        setIsEditing(false);
      }
      e.stopPropagation();
    },
    [handleApply, multiline, value],
  );

  const handleColorChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onApply(e.target.value);
    },
    [onApply],
  );

  const inputStyles: React.CSSProperties = {
    width: '100%',
    backgroundColor: C.input,
    color: C.text,
    border: `1px solid ${C.inputFocus}`,
    borderRadius: 4,
    padding: multiline ? '6px 8px' : '2px 6px',
    fontSize: 11,
    fontFamily: mono ? MONO : FONT,
    outline: 'none',
    boxSizing: 'border-box',
    resize: multiline ? 'vertical' : 'none',
    minHeight: multiline ? 48 : undefined,
  };

  const displayStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '2px 6px',
    borderRadius: 4,
    cursor: 'pointer',
    fontSize: 11,
    fontFamily: mono ? MONO : FONT,
    color: C.text,
    backgroundColor: 'transparent',
    border: '1px solid transparent',
    transition: 'background-color 0.1s, border-color 0.1s',
    minHeight: 22,
    wordBreak: 'break-word',
    width: '100%',
    boxSizing: 'border-box',
  };

  if (isEditing) {
    if (multiline) {
      return (
        <textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleApply}
          onKeyDown={handleKeyDown}
          style={inputStyles}
        />
      );
    }
    return (
      <input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleApply}
        onKeyDown={handleKeyDown}
        style={inputStyles}
      />
    );
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.backgroundColor = C.inputHover;
        (e.currentTarget as HTMLElement).style.borderColor = C.divider;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
        (e.currentTarget as HTMLElement).style.borderColor = 'transparent';
      }}
      style={displayStyles}
      title="Click to edit"
    >
      {isColor && (
        <>
          <span
            onClick={(e) => {
              e.stopPropagation();
              colorRef.current?.click();
            }}
            style={{
              display: 'inline-block',
              width: 14,
              height: 14,
              borderRadius: 3,
              backgroundColor: value,
              border: '1px solid rgba(255,255,255,0.2)',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          />
          <input
            ref={colorRef}
            type="color"
            value={toHexColor(value)}
            onChange={handleColorChange}
            style={{
              position: 'absolute',
              opacity: 0,
              width: 0,
              height: 0,
              pointerEvents: 'none',
            }}
          />
        </>
      )}
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {value || placeholder || '—'}
      </span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Sub-component: CollapsibleSection
// ═══════════════════════════════════════════════════════════════════

type CollapsibleSectionProps = {
  title: string;
  icon?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
};

function CollapsibleSection({
  title,
  icon,
  defaultOpen = true,
  children,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div style={{ borderBottom: `1px solid ${C.divider}` }}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          width: '100%',
          padding: '8px 12px',
          backgroundColor: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: C.textSecondary,
          fontSize: 11,
          fontWeight: 600,
          fontFamily: FONT,
          letterSpacing: 0.3,
          textTransform: 'uppercase',
        }}
      >
        <span
          style={{
            fontSize: 8,
            transition: 'transform 0.15s',
            transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
            color: C.chevron,
          }}
        >
          ▶
        </span>
        {icon && <span style={{ fontSize: 12 }}>{icon}</span>}
        {title}
      </button>
      {isOpen && (
        <div style={{ padding: '0 12px 10px 12px' }}>{children}</div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Sub-component: PropertyRow
// Label–value pair arranged horizontally
// ═══════════════════════════════════════════════════════════════════

type PropertyRowProps = {
  label: string;
  value: string;
  onApply?: (newValue: string) => void;
  isColor?: boolean;
  mono?: boolean;
};

function PropertyRow({
  label,
  value,
  onApply,
  isColor = false,
  mono = true,
}: PropertyRowProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 8,
        minHeight: 26,
      }}
    >
      <span
        style={{
          fontSize: 11,
          color: C.textTertiary,
          flexShrink: 0,
          width: 90,
          paddingTop: 3,
          fontFamily: FONT,
        }}
      >
        {label}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        {onApply ? (
          <EditableValue
            value={value}
            onApply={onApply}
            isColor={isColor}
            mono={mono}
          />
        ) : (
          <span
            style={{
              fontSize: 11,
              color: C.text,
              fontFamily: mono ? MONO : FONT,
              wordBreak: 'break-word',
              padding: '2px 6px',
              display: 'block',
            }}
          >
            {value || '—'}
          </span>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Sub-component: SpacingEditor
// Visual cross-layout for margin/padding (Figma-like)
// ═══════════════════════════════════════════════════════════════════

type SpacingEditorProps = {
  label: string;
  top: string;
  right: string;
  bottom: string;
  left: string;
  onApply: (side: string, value: string) => void;
  color: string;
};

function SpacingEditor({
  label,
  top,
  right,
  bottom,
  left,
  onApply,
  color,
}: SpacingEditorProps) {
  const miniInputStyle: React.CSSProperties = {
    width: 40,
    textAlign: 'center' as const,
    fontSize: 10,
    fontFamily: MONO,
    color: C.text,
    backgroundColor: 'transparent',
    border: `1px solid transparent`,
    borderRadius: 3,
    padding: '2px 2px',
    cursor: 'pointer',
    transition: 'border-color 0.1s, background-color 0.1s',
    outline: 'none',
  };

  const MiniInput = ({
    val,
    side,
  }: {
    val: string;
    side: string;
  }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editVal, setEditVal] = useState(val);
    const ref = useRef<HTMLInputElement>(null);

    useEffect(() => {
      if (isEditing && ref.current) {
        ref.current.focus();
        ref.current.select();
      }
    }, [isEditing]);

    useEffect(() => {
      if (!isEditing) {
        setEditVal(val);
      }
    }, [val, isEditing]);

    if (isEditing) {
      return (
        <input
          ref={ref}
          value={editVal}
          onChange={(e) => setEditVal(e.target.value)}
          onBlur={() => {
            if (editVal !== val) {
              onApply(side, editVal);
            }
            setIsEditing(false);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              if (editVal !== val) {
                onApply(side, editVal);
              }
              setIsEditing(false);
            } else if (e.key === 'Escape') {
              setEditVal(val);
              setIsEditing(false);
            }
            e.stopPropagation();
          }}
          style={{
            ...miniInputStyle,
            borderColor: C.inputFocus,
            backgroundColor: C.input,
          }}
        />
      );
    }

    return (
      <span
        onClick={() => setIsEditing(true)}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.backgroundColor = C.inputHover;
          (e.currentTarget as HTMLElement).style.borderColor = C.divider;
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.backgroundColor =
            'transparent';
          (e.currentTarget as HTMLElement).style.borderColor = 'transparent';
        }}
        style={miniInputStyle}
        title={`Click to edit ${label}-${side}`}
      >
        {shortenValue(val)}
      </span>
    );
  };

  return (
    <div style={{ marginBottom: 8 }}>
      <div
        style={{
          fontSize: 10,
          color,
          fontWeight: 600,
          fontFamily: FONT,
          marginBottom: 4,
          textTransform: 'uppercase',
          letterSpacing: 0.3,
        }}
      >
        {label}
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
          padding: '4px 8px',
          backgroundColor: C.input,
          borderRadius: 6,
          border: `1px solid ${C.divider}`,
        }}
      >
        <MiniInput val={top} side="top" />
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            width: '100%',
            justifyContent: 'center',
          }}
        >
          <MiniInput val={left} side="left" />
          <div
            style={{
              width: 36,
              height: 18,
              borderRadius: 3,
              backgroundColor: color,
              opacity: 0.15,
              flexShrink: 0,
            }}
          />
          <MiniInput val={right} side="right" />
        </div>
        <MiniInput val={bottom} side="bottom" />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════

function shortenValue(val: string): string {
  return val.replace('px', '').trim() || '0';
}

function toHexColor(cssColor: string): string {
  if (cssColor.startsWith('#')) {
    return cssColor;
  }
  // Try to parse rgb/rgba to hex
  const rgbMatch = cssColor.match(
    /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/u,
  );
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1], 10);
    const g = parseInt(rgbMatch[2], 10);
    const b = parseInt(rgbMatch[3], 10);
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  }
  return '#000000';
}

function getDirectTextContent(element: HTMLElement): string {
  return Array.from(element.childNodes)
    .filter((node) => node.nodeType === Node.TEXT_NODE)
    .map((node) => node.textContent || '')
    .join('')
    .trim();
}

function findStyleValue(
  styles: ComputedStyleInfo[],
  property: string,
): string {
  return styles.find((s) => s.property === property)?.value ?? '';
}

// ═══════════════════════════════════════════════════════════════════
// Main Panel Component
// ═══════════════════════════════════════════════════════════════════

export function DesignerModePanel() {
  const {
    isActive,
    hoveredElement,
    selectedElement,
    isLocked,
    toggleDesignerMode,
    clearSelection,
    copyToClipboard,
    applyStyleChange,
    applyTextChange,
  } = useDesignerMode();

  const [copySuccess, setCopySuccess] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  // ── Drag-to-move state ──────────────────────────────────────
  const [position, setPosition] = useState({ x: 8, y: 8 }); // offset from bottom-right
  const dragRef = useRef<{
    isDragging: boolean;
    startX: number;
    startY: number;
    startPosX: number;
    startPosY: number;
  } | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const handleDragStart = useCallback(
    (e: React.MouseEvent) => {
      // Only drag from the header area, not from buttons
      if ((e.target as HTMLElement).closest('button')) {
        return;
      }
      e.preventDefault();
      dragRef.current = {
        isDragging: true,
        startX: e.clientX,
        startY: e.clientY,
        startPosX: position.x,
        startPosY: position.y,
      };
    },
    [position],
  );

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragRef.current?.isDragging) {
        return;
      }
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      setPosition({
        x: Math.max(0, dragRef.current.startPosX - dx),
        y: Math.max(0, dragRef.current.startPosY - dy),
      });
    };

    const handleMouseUp = () => {
      if (dragRef.current) {
        dragRef.current.isDragging = false;
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  if (!isActive) {
    return null;
  }

  const elementInfo = isLocked ? selectedElement : hoveredElement;
  const designTokens = elementInfo
    ? extractDesignTokensFromClasses(elementInfo.component.classNames)
    : [];

  const textContent = elementInfo
    ? getDirectTextContent(elementInfo.element)
    : '';

  const handleCopy = async () => {
    await copyToClipboard();
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleStyleApply = (property: string, newValue: string) => {
    applyStyleChange(property, newValue);
  };

  // ── Panel styles ───────────────────────────────────────────────

  const panelStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: position.y,
    right: position.x,
    width: 340,
    maxHeight: isMinimized
      ? 'none'
      : isLocked
        ? 'min(680px, calc(100vh - 80px))'
        : 'min(280px, calc(100vh - 80px))',
    backgroundColor: C.bg,
    color: C.text,
    borderRadius: 8,
    boxShadow:
      '0 0 0 1px rgba(255,255,255,0.06), 0 12px 40px rgba(0,0,0,0.55)',
    fontFamily: FONT,
    fontSize: 12,
    zIndex: 1000000,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    userSelect: 'none',
    transition: dragRef.current?.isDragging
      ? 'none'
      : 'max-height 0.2s ease',
  };

  // ── Render ─────────────────────────────────────────────────────

  return (
    <div
      ref={panelRef}
      className="designer-mode-panel"
      data-designer-mode="panel"
      style={panelStyle}
    >
      {/* ── Header (draggable) ───────────────────────────────── */}
      <div
        onMouseDown={handleDragStart}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          backgroundColor: C.surface,
          borderBottom: isMinimized ? 'none' : `1px solid ${C.divider}`,
          flexShrink: 0,
          cursor: 'grab',
        }}
      >
        <span
          style={{
            fontWeight: 600,
            fontSize: 12,
            color: C.accent,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <span
            style={{
              color: C.textTertiary,
              fontSize: 10,
              letterSpacing: 1,
            }}
          >
            ⠿
          </span>
          Designer Mode
        </span>
        <div style={{ display: 'flex', gap: 2 }}>
          <button
            type="button"
            onClick={handleCopy}
            disabled={!elementInfo}
            title="Copy element info for AI"
            style={{
              padding: '4px 8px',
              backgroundColor: copySuccess ? C.success : C.accentDim,
              color: copySuccess ? '#fff' : C.accent,
              border: 'none',
              borderRadius: 4,
              cursor: elementInfo ? 'pointer' : 'not-allowed',
              fontSize: 10,
              fontWeight: 600,
              fontFamily: FONT,
              opacity: elementInfo ? 1 : 0.4,
              transition: 'background-color 0.15s',
            }}
          >
            {copySuccess ? '✓ Copied' : 'Copy for AI'}
          </button>
          <button
            type="button"
            onClick={() => setIsMinimized(!isMinimized)}
            title={isMinimized ? 'Expand panel' : 'Minimize panel'}
            style={{
              width: 24,
              height: 24,
              backgroundColor: 'transparent',
              color: C.textTertiary,
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: MONO,
            }}
          >
            {isMinimized ? '▢' : '▁'}
          </button>
          <button
            type="button"
            onClick={toggleDesignerMode}
            title="Close Designer Mode"
            style={{
              width: 24,
              height: 24,
              backgroundColor: 'transparent',
              color: C.textTertiary,
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: 14,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: FONT,
            }}
          >
            ×
          </button>
        </div>
      </div>

      {/* ── Collapsible body (hidden when minimized) ─────────── */}
      {!isMinimized && (
        <>
      {/* ── Lock status bar ──────────────────────────────────── */}
      {isLocked && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '4px 12px',
            backgroundColor: C.accentDim,
            fontSize: 10,
            color: C.accent,
            flexShrink: 0,
          }}
        >
          <span style={{ fontWeight: 500 }}>
            Selection locked
          </span>
          <button
            type="button"
            onClick={clearSelection}
            style={{
              background: 'none',
              border: 'none',
              color: C.accent,
              cursor: 'pointer',
              fontSize: 10,
              fontWeight: 600,
              fontFamily: FONT,
              textDecoration: 'underline',
            }}
          >
            Unlock
          </button>
        </div>
      )}

      {/* ── Scrollable content ───────────────────────────────── */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        {!elementInfo ? (
          /* ── Empty state ─────────────────────────────────── */
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '40px 24px',
              color: C.textTertiary,
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.4 }}>
              ◎
            </div>
            <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 4 }}>
              Hover over any element
            </div>
            <div style={{ fontSize: 11 }}>
              Click to lock selection and edit values
            </div>
          </div>
        ) : (
          <>
            {/* ── Element header ───────────────────────────── */}
            <div
              style={{
                padding: '10px 12px',
                borderBottom: `1px solid ${C.divider}`,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  marginBottom: 4,
                }}
              >
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: C.text,
                  }}
                >
                  {elementInfo.component.componentName || 'Unknown'}
                </span>
                {elementInfo.component.testId && (
                  <span
                    style={{
                      fontSize: 10,
                      color: C.accent,
                      backgroundColor: C.accentDim,
                      padding: '1px 6px',
                      borderRadius: 3,
                      fontFamily: MONO,
                    }}
                  >
                    {elementInfo.component.testId}
                  </span>
                )}
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: C.textTertiary,
                  lineHeight: 1.4,
                  maxHeight: 32,
                  overflow: 'hidden',
                }}
              >
                {elementInfo.componentPath.slice(-3).join(' › ') || '—'}
              </div>
            </div>

            {/* ── Text Content ─────────────────────────────── */}
            {textContent && (
              <div
                style={{
                  padding: '8px 12px',
                  borderBottom: `1px solid ${C.divider}`,
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    color: C.textTertiary,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: 0.3,
                    marginBottom: 4,
                  }}
                >
                  Text Content
                </div>
                <EditableValue
                  value={textContent}
                  onApply={applyTextChange}
                  mono={false}
                />
              </div>
            )}

            {/* ── Layout section ───────────────────────────── */}
            <CollapsibleSection title="Layout" icon="⊞">
              <PropertyRow
                label="Display"
                value={findStyleValue(
                  elementInfo.styles.layout,
                  'display',
                )}
                onApply={(v) => handleStyleApply('display', v)}
              />
              <PropertyRow
                label="Position"
                value={findStyleValue(
                  elementInfo.styles.layout,
                  'position',
                )}
                onApply={(v) => handleStyleApply('position', v)}
              />
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 4,
                }}
              >
                <PropertyRow
                  label="W"
                  value={findStyleValue(
                    elementInfo.styles.layout,
                    'width',
                  )}
                  onApply={(v) => handleStyleApply('width', v)}
                />
                <PropertyRow
                  label="H"
                  value={findStyleValue(
                    elementInfo.styles.layout,
                    'height',
                  )}
                  onApply={(v) => handleStyleApply('height', v)}
                />
              </div>
              {findStyleValue(
                elementInfo.styles.layout,
                'flex-direction',
              ) && (
                <>
                  <PropertyRow
                    label="Direction"
                    value={findStyleValue(
                      elementInfo.styles.layout,
                      'flex-direction',
                    )}
                    onApply={(v) =>
                      handleStyleApply('flex-direction', v)
                    }
                  />
                  <PropertyRow
                    label="Align"
                    value={findStyleValue(
                      elementInfo.styles.layout,
                      'align-items',
                    )}
                    onApply={(v) =>
                      handleStyleApply('align-items', v)
                    }
                  />
                  <PropertyRow
                    label="Justify"
                    value={findStyleValue(
                      elementInfo.styles.layout,
                      'justify-content',
                    )}
                    onApply={(v) =>
                      handleStyleApply('justify-content', v)
                    }
                  />
                  <PropertyRow
                    label="Gap"
                    value={findStyleValue(
                      elementInfo.styles.layout,
                      'gap',
                    )}
                    onApply={(v) => handleStyleApply('gap', v)}
                  />
                </>
              )}
              <PropertyRow
                label="Overflow"
                value={findStyleValue(
                  elementInfo.styles.layout,
                  'overflow',
                )}
                onApply={(v) => handleStyleApply('overflow', v)}
              />
            </CollapsibleSection>

            {/* ── Spacing section ──────────────────────────── */}
            <CollapsibleSection title="Spacing" icon="⬜">
              <SpacingEditor
                label="Margin"
                top={findStyleValue(
                  elementInfo.styles.spacing,
                  'margin-top',
                )}
                right={findStyleValue(
                  elementInfo.styles.spacing,
                  'margin-right',
                )}
                bottom={findStyleValue(
                  elementInfo.styles.spacing,
                  'margin-bottom',
                )}
                left={findStyleValue(
                  elementInfo.styles.spacing,
                  'margin-left',
                )}
                onApply={(side, v) =>
                  handleStyleApply(`margin-${side}`, v)
                }
                color={C.accent}
              />
              <SpacingEditor
                label="Padding"
                top={findStyleValue(
                  elementInfo.styles.spacing,
                  'padding-top',
                )}
                right={findStyleValue(
                  elementInfo.styles.spacing,
                  'padding-right',
                )}
                bottom={findStyleValue(
                  elementInfo.styles.spacing,
                  'padding-bottom',
                )}
                left={findStyleValue(
                  elementInfo.styles.spacing,
                  'padding-left',
                )}
                onApply={(side, v) =>
                  handleStyleApply(`padding-${side}`, v)
                }
                color={C.success}
              />
            </CollapsibleSection>

            {/* ── Typography section ───────────────────────── */}
            <CollapsibleSection title="Typography" icon="T">
              <PropertyRow
                label="Font"
                value={findStyleValue(
                  elementInfo.styles.typography,
                  'font-family',
                )}
                onApply={(v) => handleStyleApply('font-family', v)}
              />
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 4,
                }}
              >
                <PropertyRow
                  label="Size"
                  value={findStyleValue(
                    elementInfo.styles.typography,
                    'font-size',
                  )}
                  onApply={(v) => handleStyleApply('font-size', v)}
                />
                <PropertyRow
                  label="Weight"
                  value={findStyleValue(
                    elementInfo.styles.typography,
                    'font-weight',
                  )}
                  onApply={(v) => handleStyleApply('font-weight', v)}
                />
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 4,
                }}
              >
                <PropertyRow
                  label="Line H."
                  value={findStyleValue(
                    elementInfo.styles.typography,
                    'line-height',
                  )}
                  onApply={(v) => handleStyleApply('line-height', v)}
                />
                <PropertyRow
                  label="Align"
                  value={findStyleValue(
                    elementInfo.styles.typography,
                    'text-align',
                  )}
                  onApply={(v) => handleStyleApply('text-align', v)}
                />
              </div>
              <PropertyRow
                label="Color"
                value={findStyleValue(
                  elementInfo.styles.typography,
                  'color',
                )}
                onApply={(v) => handleStyleApply('color', v)}
                isColor
              />
            </CollapsibleSection>

            {/* ── Fill & Stroke section ────────────────────── */}
            <CollapsibleSection title="Fill & Stroke" icon="◉" defaultOpen={false}>
              <PropertyRow
                label="Background"
                value={findStyleValue(
                  elementInfo.styles.colors,
                  'background-color',
                )}
                onApply={(v) =>
                  handleStyleApply('background-color', v)
                }
                isColor
              />
              <PropertyRow
                label="Opacity"
                value={findStyleValue(
                  elementInfo.styles.colors,
                  'opacity',
                )}
                onApply={(v) => handleStyleApply('opacity', v)}
              />
              <PropertyRow
                label="Border"
                value={findStyleValue(
                  elementInfo.styles.borders,
                  'border',
                )}
                onApply={(v) => handleStyleApply('border', v)}
              />
              <PropertyRow
                label="Radius"
                value={findStyleValue(
                  elementInfo.styles.borders,
                  'border-radius',
                )}
                onApply={(v) =>
                  handleStyleApply('border-radius', v)
                }
              />
              {findStyleValue(
                elementInfo.styles.borders,
                'box-shadow',
              ) && (
                <PropertyRow
                  label="Shadow"
                  value={findStyleValue(
                    elementInfo.styles.borders,
                    'box-shadow',
                  )}
                  onApply={(v) => handleStyleApply('box-shadow', v)}
                />
              )}
            </CollapsibleSection>

            {/* ── Component Info section ───────────────────── */}
            <CollapsibleSection
              title="Component"
              icon="⚛"
              defaultOpen={false}
            >
              <PropertyRow
                label="Name"
                value={
                  elementInfo.component.componentName || 'Unknown'
                }
                mono={false}
              />
              <PropertyRow
                label="Test ID"
                value={elementInfo.component.testId || '—'}
                mono={false}
              />
              <div style={{ marginTop: 4 }}>
                <div
                  style={{
                    fontSize: 10,
                    color: C.textTertiary,
                    marginBottom: 4,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: 0.3,
                  }}
                >
                  Path
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: C.textSecondary,
                    fontFamily: MONO,
                    backgroundColor: C.input,
                    padding: '6px 8px',
                    borderRadius: 4,
                    lineHeight: 1.5,
                    maxHeight: 60,
                    overflowY: 'auto',
                    wordBreak: 'break-word',
                  }}
                >
                  {elementInfo.componentPath.join(' › ') || '—'}
                </div>
              </div>
              <div style={{ marginTop: 8 }}>
                <div
                  style={{
                    fontSize: 10,
                    color: C.textTertiary,
                    marginBottom: 4,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: 0.3,
                  }}
                >
                  Props
                </div>
                <pre
                  style={{
                    fontSize: 10,
                    color: C.textSecondary,
                    fontFamily: MONO,
                    backgroundColor: C.input,
                    padding: '6px 8px',
                    borderRadius: 4,
                    lineHeight: 1.5,
                    maxHeight: 120,
                    overflowY: 'auto',
                    margin: 0,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {JSON.stringify(
                    elementInfo.component.props,
                    null,
                    2,
                  ) || '{}'}
                </pre>
              </div>
            </CollapsibleSection>

            {/* ── Design Tokens section ────────────────────── */}
            {designTokens.length > 0 && (
              <CollapsibleSection
                title="Design Tokens"
                icon="◆"
                defaultOpen={false}
              >
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 4,
                  }}
                >
                  {designTokens.map((token, index) => (
                    <span
                      key={`${token.token}-${index}`}
                      style={{
                        fontSize: 10,
                        color: C.accent,
                        backgroundColor: C.accentDim,
                        padding: '2px 8px',
                        borderRadius: 3,
                        fontFamily: MONO,
                      }}
                    >
                      {token.token}
                    </span>
                  ))}
                </div>
              </CollapsibleSection>
            )}

            {/* ── Classes section ──────────────────────────── */}
            {elementInfo.component.classNames.length > 0 && (
              <CollapsibleSection
                title="Classes"
                icon="{ }"
                defaultOpen={false}
              >
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 4,
                  }}
                >
                  {elementInfo.component.classNames.map(
                    (cls, index) => (
                      <span
                        key={`${cls}-${index}`}
                        style={{
                          fontSize: 10,
                          color: C.textSecondary,
                          backgroundColor: C.input,
                          padding: '2px 6px',
                          borderRadius: 3,
                          fontFamily: MONO,
                          border: `1px solid ${C.divider}`,
                        }}
                      >
                        {cls}
                      </span>
                    ),
                  )}
                </div>
              </CollapsibleSection>
            )}
          </>
        )}
      </div>

      {/* ── Footer ───────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 12px',
          backgroundColor: C.surface,
          borderTop: `1px solid ${C.divider}`,
          fontSize: 10,
          color: C.textTertiary,
          flexShrink: 0,
        }}
      >
        <span>
          <Kbd>Click</Kbd> lock
        </span>
        <span>
          <Kbd>C</Kbd> copy
        </span>
        <span>
          <Kbd>Esc</Kbd> exit
        </span>
      </div>
        </>
      )}
    </div>
  );
}

// Small keyboard shortcut badge
function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd
      style={{
        display: 'inline-block',
        backgroundColor: C.input,
        color: C.textSecondary,
        padding: '1px 4px',
        borderRadius: 3,
        fontSize: 9,
        fontFamily: MONO,
        border: `1px solid ${C.divider}`,
        marginRight: 3,
      }}
    >
      {children}
    </kbd>
  );
}
