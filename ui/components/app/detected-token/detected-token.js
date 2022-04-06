import React, { useState } from 'react';

import DetectedTokenSelectionPopover from './detected-token-selection-popover/detected-token-selection-popover';
import DetectedTokenIgnoredPopover from './detected-token-ignored-popover/detected-token-ignored-popover';

const DetectedToken = () => {
  // const history= useHistory();
  const [selectedTokens, setSelectedTokens] = useState([]);

  const onImport = () => {
    console.log('import tokens', selectedTokens);
  };

  const handleClearTokensSelection = () => {
    setSelectedTokens([]);
  };

  const handleTokenSelection = (tokenAddress) => {
    const newSelectedTokens = new Set(selectedTokens);
    if (newSelectedTokens.has(tokenAddress)) {
      newSelectedTokens.delete(tokenAddress);
    } else {
      newSelectedTokens.add(tokenAddress);
    }
    setSelectedTokens(newSelectedTokens);
  };
  console.log(`in DetectedToken`);

  const onIgnoreAll = () => {
    console.log('ignore tokens', selectedTokens);
    return (
      <DetectedTokenIgnoredPopover
        handleClearTokensSelection={handleClearTokensSelection}
      />
    );
  };

  return (
    <DetectedTokenSelectionPopover
      selectedTokens={selectedTokens}
      handleTokenSelection={handleTokenSelection}
      onImport={onImport}
      onIgnoreAll={onIgnoreAll}
    />
  );
};

export default DetectedToken;
