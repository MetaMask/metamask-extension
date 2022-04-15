import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useSelector, useDispatch } from 'react-redux';

import {
  importTokens,
  ignoreTokens,
  setNewTokensImported,
} from '../../../store/actions';
import { getDetectedTokensInCurrentNetwork } from '../../../selectors';

import DetectedTokenSelectionPopover from './detected-token-selection-popover/detected-token-selection-popover';
import DetectedTokenIgnoredPopover from './detected-token-ignored-popover/detected-token-ignored-popover';

const DetectedToken = ({ setShowDetectedTokens }) => {
  const dispatch = useDispatch();

  const detectedTokens = useSelector(getDetectedTokensInCurrentNetwork);

  const [selectedTokens, setSelectedTokens] = useState(() =>
    detectedTokens.reduce((tokenObj, token) => {
      tokenObj[token.address] = token;
      return tokenObj;
    }, {}),
  );
  const [
    showDetectedTokenIgnoredPopover,
    setShowDetectedTokenIgnoredPopover,
  ] = useState(false);

  const handleClearTokensSelection = async () => {
    const selectedTokensList = Object.values(selectedTokens);
    const unSelectedTokensList = detectedTokens.filter(
      (token) => !Object.keys(selectedTokens).includes(token.address),
    );

    if (selectedTokensList.length < detectedTokens.length) {
      await dispatch(ignoreTokens(unSelectedTokensList));
      await dispatch(importTokens(selectedTokensList));
      const tokenSymbols = selectedTokensList.map(({ symbol }) => symbol);
      dispatch(setNewTokensImported(tokenSymbols.join(', ')));
    } else {
      await dispatch(ignoreTokens(unSelectedTokensList));
    }
    setShowDetectedTokens(false);
  };

  const handleTokenSelection = (token) => {
    const newSelectedTokens = { ...selectedTokens };

    if (selectedTokens[token.address]) {
      delete newSelectedTokens[token.address];
    } else {
      newSelectedTokens[token.address] = token;
    }
    setSelectedTokens(newSelectedTokens);
  };

  const onImport = async () => {
    const selectedTokensList = Object.values(selectedTokens);

    if (selectedTokensList.length < detectedTokens.length) {
      setShowDetectedTokenIgnoredPopover(true);
    } else {
      const tokenSymbols = selectedTokensList.map(({ symbol }) => symbol);
      await dispatch(importTokens(selectedTokensList));
      dispatch(setNewTokensImported(tokenSymbols.join(', ')));
      setShowDetectedTokens(false);
    }
  };

  const onIgnoreAll = () => {
    setSelectedTokens({});
    setShowDetectedTokenIgnoredPopover(true);
  };

  const onCancelIgnore = () => {
    setShowDetectedTokenIgnoredPopover(false);
  };

  return (
    <>
      {showDetectedTokenIgnoredPopover && (
        <DetectedTokenIgnoredPopover
          onCancelIgnore={onCancelIgnore}
          handleClearTokensSelection={handleClearTokensSelection}
        />
      )}
      <DetectedTokenSelectionPopover
        detectedTokens={detectedTokens}
        selectedTokens={selectedTokens}
        handleTokenSelection={handleTokenSelection}
        onImport={onImport}
        onIgnoreAll={onIgnoreAll}
        setShowDetectedTokens={setShowDetectedTokens}
      />
    </>
  );
};

DetectedToken.propTypes = {
  setShowDetectedTokens: PropTypes.func.isRequired,
};

export default DetectedToken;
