/**
 * Designer Mode Panel
 * Displays detailed information about the selected element
 */

import React, { useState } from 'react';
import { useDesignerMode } from './designer-mode-context';
import { extractDesignTokensFromClasses } from './designer-mode.utils';

type TabId = 'component' | 'styles' | 'tokens';

export function DesignerModePanel() {
  const {
    isActive,
    hoveredElement,
    selectedElement,
    isLocked,
    toggleDesignerMode,
    clearSelection,
    copyToClipboard,
  } = useDesignerMode();

  const [activeTab, setActiveTab] = useState<TabId>('component');
  const [copySuccess, setCopySuccess] = useState(false);

  if (!isActive) {
    return null;
  }

  const elementInfo = isLocked ? selectedElement : hoveredElement;
  const designTokens = elementInfo
    ? extractDesignTokensFromClasses(elementInfo.component.classNames)
    : [];

  const handleCopy = async () => {
    await copyToClipboard();
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const panelStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: '16px',
    right: '16px',
    width: '380px',
    maxHeight: '500px',
    backgroundColor: '#1a1a1a',
    color: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
    fontFamily:
      'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    fontSize: '12px',
    zIndex: 1000000,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  };

  const headerStyle: React.CSSProperties = {
    padding: '12px 16px',
    backgroundColor: '#037DD6',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  };

  const tabBarStyle: React.CSSProperties = {
    display: 'flex',
    borderBottom: '1px solid #333',
    backgroundColor: '#252525',
  };

  const tabStyle = (isActive: boolean): React.CSSProperties => ({
    padding: '10px 16px',
    cursor: 'pointer',
    backgroundColor: isActive ? '#1a1a1a' : 'transparent',
    color: isActive ? '#037DD6' : '#888',
    border: 'none',
    borderBottom: isActive ? '2px solid #037DD6' : '2px solid transparent',
    fontSize: '11px',
    fontWeight: 500,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  });

  const contentStyle: React.CSSProperties = {
    padding: '16px',
    overflowY: 'auto',
    maxHeight: '350px',
    flex: 1,
  };

  const buttonStyle: React.CSSProperties = {
    padding: '6px 12px',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '11px',
    fontWeight: 500,
  };

  const sectionStyle: React.CSSProperties = {
    marginBottom: '16px',
  };

  const labelStyle: React.CSSProperties = {
    color: '#888',
    fontSize: '10px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '4px',
  };

  const valueStyle: React.CSSProperties = {
    color: '#fff',
    wordBreak: 'break-word',
  };

  const styleRowStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '4px 0',
    borderBottom: '1px solid #333',
  };

  const renderComponentTab = () => {
    if (!elementInfo) {
      return <div style={{ color: '#888' }}>Hover over an element to inspect it</div>;
    }

    return (
      <>
        <div style={sectionStyle}>
          <div style={labelStyle}>Component Name</div>
          <div style={{ ...valueStyle, fontSize: '14px', fontWeight: 600 }}>
            {elementInfo.component.componentName || 'Unknown'}
          </div>
        </div>

        <div style={sectionStyle}>
          <div style={labelStyle}>Component Path</div>
          <div style={valueStyle}>
            {elementInfo.componentPath.join(' → ') || 'N/A'}
          </div>
        </div>

        {elementInfo.component.testId && (
          <div style={sectionStyle}>
            <div style={labelStyle}>Test ID</div>
            <div style={valueStyle}>{elementInfo.component.testId}</div>
          </div>
        )}

        <div style={sectionStyle}>
          <div style={labelStyle}>Props</div>
          <pre
            style={{
              ...valueStyle,
              backgroundColor: '#252525',
              padding: '8px',
              borderRadius: '4px',
              overflow: 'auto',
              maxHeight: '150px',
              fontSize: '10px',
            }}
          >
            {JSON.stringify(elementInfo.component.props, null, 2) || '{}'}
          </pre>
        </div>

        <div style={sectionStyle}>
          <div style={labelStyle}>Classes</div>
          <div
            style={{
              ...valueStyle,
              fontSize: '10px',
              maxHeight: '100px',
              overflow: 'auto',
            }}
          >
            {elementInfo.component.classNames.join('\n') || 'None'}
          </div>
        </div>
      </>
    );
  };

  const renderStylesTab = () => {
    if (!elementInfo) {
      return <div style={{ color: '#888' }}>Hover over an element to inspect it</div>;
    }

    const categories = [
      { name: 'Layout', styles: elementInfo.styles.layout },
      { name: 'Typography', styles: elementInfo.styles.typography },
      { name: 'Colors', styles: elementInfo.styles.colors },
      { name: 'Spacing', styles: elementInfo.styles.spacing },
      { name: 'Borders', styles: elementInfo.styles.borders },
    ];

    return (
      <>
        {categories.map(
          ({ name, styles }) =>
            styles.length > 0 && (
              <div key={name} style={sectionStyle}>
                <div style={labelStyle}>{name}</div>
                {styles.map(({ property, value }) => (
                  <div key={property} style={styleRowStyle}>
                    <span style={{ color: '#9cdcfe' }}>{property}</span>
                    <span style={{ color: '#ce9178' }}>{value}</span>
                  </div>
                ))}
              </div>
            ),
        )}
      </>
    );
  };

  const renderTokensTab = () => {
    if (!elementInfo) {
      return <div style={{ color: '#888' }}>Hover over an element to inspect it</div>;
    }

    if (designTokens.length === 0) {
      return (
        <div style={{ color: '#888' }}>
          No design tokens detected from class names.
          <br />
          <br />
          The element may be using:
          <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
            <li>Inline styles</li>
            <li>Custom CSS classes</li>
            <li>Legacy styling patterns</li>
          </ul>
        </div>
      );
    }

    const groupedTokens = designTokens.reduce(
      (acc, token) => {
        if (!acc[token.category]) {
          acc[token.category] = [];
        }
        acc[token.category].push(token);
        return acc;
      },
      {} as Record<string, typeof designTokens>,
    );

    return (
      <>
        {Object.entries(groupedTokens).map(([category, tokens]) => (
          <div key={category} style={sectionStyle}>
            <div style={labelStyle}>{category}</div>
            {tokens.map((token, index) => (
              <div key={index} style={styleRowStyle}>
                <span style={{ color: '#4ec9b0' }}>{token.token}</span>
              </div>
            ))}
          </div>
        ))}
      </>
    );
  };

  return (
    <div
      className="designer-mode-panel"
      data-designer-mode="panel"
      style={panelStyle}
    >
      {/* Header */}
      <div style={headerStyle}>
        <span style={{ fontWeight: 600, fontSize: '13px' }}>
          🎨 Designer Mode
        </span>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            style={{
              ...buttonStyle,
              backgroundColor: copySuccess ? '#28a745' : buttonStyle.backgroundColor,
            }}
            onClick={handleCopy}
            disabled={!elementInfo}
          >
            {copySuccess ? '✓ Copied!' : 'Copy for AI'}
          </button>
          <button type="button" style={buttonStyle} onClick={toggleDesignerMode}>
            ✕ Close
          </button>
        </div>
      </div>

      {/* Status bar */}
      {isLocked && (
        <div
          style={{
            padding: '8px 16px',
            backgroundColor: '#2d5a27',
            fontSize: '11px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>Selection locked</span>
          <button
            type="button"
            onClick={clearSelection}
            style={{
              background: 'none',
              border: 'none',
              color: '#fff',
              cursor: 'pointer',
              textDecoration: 'underline',
              fontSize: '11px',
            }}
          >
            Unlock
          </button>
        </div>
      )}

      {/* Tab bar */}
      <div style={tabBarStyle}>
        <button
          type="button"
          style={tabStyle(activeTab === 'component')}
          onClick={() => setActiveTab('component')}
        >
          Component
        </button>
        <button
          type="button"
          style={tabStyle(activeTab === 'styles')}
          onClick={() => setActiveTab('styles')}
        >
          Styles
        </button>
        <button
          type="button"
          style={tabStyle(activeTab === 'tokens')}
          onClick={() => setActiveTab('tokens')}
        >
          Tokens
        </button>
      </div>

      {/* Content */}
      <div style={contentStyle}>
        {activeTab === 'component' && renderComponentTab()}
        {activeTab === 'styles' && renderStylesTab()}
        {activeTab === 'tokens' && renderTokensTab()}
      </div>

      {/* Footer with shortcuts */}
      <div
        style={{
          padding: '8px 16px',
          backgroundColor: '#252525',
          fontSize: '10px',
          color: '#888',
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <span>
          <kbd style={{ backgroundColor: '#333', padding: '2px 4px', borderRadius: '2px' }}>
            Click
          </kbd>{' '}
          to lock
        </span>
        <span>
          <kbd style={{ backgroundColor: '#333', padding: '2px 4px', borderRadius: '2px' }}>
            C
          </kbd>{' '}
          to copy
        </span>
        <span>
          <kbd style={{ backgroundColor: '#333', padding: '2px 4px', borderRadius: '2px' }}>
            Esc
          </kbd>{' '}
          to exit
        </span>
      </div>
    </div>
  );
}
