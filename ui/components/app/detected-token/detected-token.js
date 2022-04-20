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

  const [tokensListDetected, setTokensListDetected] = useState(() =>
    detectedTokens.reduce((tokenObj, token) => {
      tokenObj[token.address] = { token, selected: true };
      return tokenObj;
    }, {}),
  );
  const [
    showDetectedTokenIgnoredPopover,
    setShowDetectedTokenIgnoredPopover,
  ] = useState(false);

  const handleClearTokensSelection = async () => {
    const selectedTokens = Object.values(tokensListDetected)
      .filter(({ selected }) => {
        return selected;
      })
      .map(({ token }) => {
        return token;
      });
    const unSelectedTokens = Object.values(tokensListDetected)
      .filter(({ selected }) => {
        return !selected;
      })
      .map(({ token }) => {
        return token;
      });

    if (unSelectedTokens.length < detectedTokens.length) {
      await dispatch(ignoreTokens(unSelectedTokens));
      await dispatch(importTokens(selectedTokens));
      const tokenSymbols = selectedTokens.map(({ symbol }) => symbol);
      dispatch(setNewTokensImported(tokenSymbols.join(', ')));
    } else {
      await dispatch(ignoreTokens(unSelectedTokens));
    }
    setShowDetectedTokens(false);
  };

  const handleTokenSelection = (token) => {
    const newTokensListDetected = { ...tokensListDetected };

    if (tokensListDetected[token.address].selected) {
      newTokensListDetected[token.address].selected = false;
    } else {
      newTokensListDetected[token.address].selected = true;
    }

    setTokensListDetected(newTokensListDetected);
  };

  const onImport = async () => {
    const selectedTokens = Object.values(tokensListDetected)
      .filter(({ selected }) => {
        return selected;
      })
      .map(({ token }) => {
        return token;
      });

    if (selectedTokens.length < detectedTokens.length) {
      setShowDetectedTokenIgnoredPopover(true);
    } else {
      const tokenSymbols = selectedTokens.map(({ symbol }) => symbol);
      await dispatch(importTokens(selectedTokens));
      dispatch(setNewTokensImported(tokenSymbols.join(', ')));
      setShowDetectedTokens(false);
    }
  };

  const onIgnoreAll = () => {
    const newTokensListDetected = { ...tokensListDetected };
    for (const tokenAddress of Object.keys(tokensListDetected)) {
      newTokensListDetected[tokenAddress].selected = false;
    }

    setTokensListDetected(newTokensListDetected);
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
        tokensListDetected={tokensListDetected}
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
