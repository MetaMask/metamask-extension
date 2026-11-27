/* eslint-disable @metamask/design-tokens/color-no-hex */
/* eslint-disable no-nested-ternary */
/* eslint-disable react/no-unknown-property */
import React, { useEffect, useState } from 'react';

export const InterestforDiagnostic = () => {
  const [polyfillInstalled, setPolyfillInstalled] = useState<boolean | null>(
    null,
  );

  useEffect(() => {
    const checkPolyfill = () => {
      const installed =
        'interestForElement' in document.createElement('button');
      setPolyfillInstalled(installed);
      console.info('[diagnostic] interestfor polyfill check:', installed);
    };

    checkPolyfill();
    setTimeout(checkPolyfill, 100);
    setTimeout(checkPolyfill, 500);
    setTimeout(checkPolyfill, 1000);
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        top: '10px',
        right: '10px',
        padding: '10px',
        background: '#ffeb3b',
        border: '2px solid #000',
        zIndex: 9999,
        fontSize: '12px',
        fontFamily: 'monospace',
      }}
    >
      <div>
        <strong>Interestfor Diagnostic (DO NOT MERGE)</strong>
      </div>
      <div>
        Polyfill installed:{' '}
        {polyfillInstalled === null ? '...' : polyfillInstalled ? 'YES' : 'NO'}
      </div>
      <div style={{ marginTop: '8px' }}>
        <button interestfor="mm-if-test" style={{ padding: '4px 8px' }}>
          hover me (interestfor test)
        </button>
      </div>
      <div id="mm-if-test" popover="hint">
        ✅ polyfill works!
      </div>
    </div>
  );
};
