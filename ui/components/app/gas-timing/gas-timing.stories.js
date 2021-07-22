import React from 'react';

import GasTiming from '.';

export default {
  title: 'Gas Timing',
};

export const simple = () => {
  return (
    <div style={{ width: '600px' }}>
      <GasTiming text="Likely within 30 seconds" />
    </div>
  );
};

export const withTooltip = () => {
  return (
    <div style={{ width: '600px' }}>
      <GasTiming
        text="Likely within 30 seconds"
        tooltipText="This is the tooltip text"
      />
    </div>
  );
};

export const withAttitudes = () => {
  return (
    <div style={{ width: '600px' }}>
      <GasTiming text="Likely within 30 seconds" />
      <GasTiming
        text="Likely within 30 seconds"
        tooltipText="This is the tooltip text"
        attitude="negative"
      />
      <GasTiming
        text="Likely within 30 seconds"
        tooltipText="This is the tooltip text"
        attitude="positive"
      />
      <GasTiming
        text="Likely within 30 seconds"
        tooltipText="This is the tooltip text"
        attitude="warning"
      />
    </div>
  );
};
