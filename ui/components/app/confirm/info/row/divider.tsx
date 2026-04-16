import React from 'react';

export const ConfirmInfoRowDivider: React.FC = () => {
  return (
    <div style={{ paddingTop: '8px', paddingBottom: '8px' }}>
      <div
        style={{
          height: '1px',
          backgroundColor: 'var(--color-border-muted)',
          // Ignore the padding from the section.
          marginLeft: '-8px',
          marginRight: '-8px',
        }}
      />
    </div>
  );
};
