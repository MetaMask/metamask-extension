// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
import React from 'react';

export const ConfirmInfoRowDivider: React.FC = () => {
  return (
    <div
      style={{
        height: '1px',
        backgroundColor: 'var(--color-border-muted)',
        // Ignore the padding from the section.
        marginLeft: '-8px',
        marginRight: '-8px',
      }}
    ></div>
  );
};
