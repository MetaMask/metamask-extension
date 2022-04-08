import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useHistory } from 'react-router-dom';

import {
  importTokens,
  ignoreTokens,
  setNewTokensImported,
} from '../../../store/actions';
import { getDetectedTokensInCurrentNetwork } from '../../../selectors';

import { isEqualCaseInsensitive } from '../../../../shared/modules/string-utils';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';
import DetectedTokenSelectionPopover from './detected-token-selection-popover/detected-token-selection-popover';
import DetectedTokenIgnoredPopover from './detected-token-ignored-popover/detected-token-ignored-popover';

const DetectedToken = () => {
  const dispatch = useDispatch();
  const history = useHistory();

  const detectedTokens = useSelector(getDetectedTokensInCurrentNetwork);

  const [selectedTokens, setSelectedTokens] = useState(detectedTokens);
  const [unSelectedTokens, setUnSelectedTokens] = useState([]);
  const [
    showDetectedTokenIgnoredPopover,
    setShowDetectedTokenIgnoredPopover,
  ] = useState(false);

  const handleClearTokensSelection = async () => {
    if (unSelectedTokens.length < detectedTokens.length) {
      await dispatch(ignoreTokens(unSelectedTokens));
      await dispatch(importTokens(selectedTokens));
    } else {
      setUnSelectedTokens(detectedTokens);
      setSelectedTokens([]);
      await dispatch(ignoreTokens(unSelectedTokens));
    }
    history.push(DEFAULT_ROUTE);
  };

  const handleTokenSelection = (token) => {
    let newSelectedTokens = [...selectedTokens];
    let newUnSelectedTokens = [...unSelectedTokens];

    if (
      newSelectedTokens.find(({ address }) =>
        isEqualCaseInsensitive(address, token.address),
      )
    ) {
      newSelectedTokens = newSelectedTokens.filter(
        ({ address }) => address !== token.address,
      );
      newUnSelectedTokens.push(token);
    } else {
      newSelectedTokens.push(token);
      newUnSelectedTokens = newUnSelectedTokens.filter(
        ({ address }) => address !== token.address,
      );
    }
    setSelectedTokens(newSelectedTokens);
    setUnSelectedTokens(newUnSelectedTokens);
  };

  const onImport = async () => {
    if (selectedTokens.length < detectedTokens.length) {
      setShowDetectedTokenIgnoredPopover(true);
    } else {
      const tokenSymbols = selectedTokens.map(({ symbol }) => symbol);
      await dispatch(importTokens(selectedTokens));
      console.log(tokenSymbols);
      setNewTokensImported(tokenSymbols);
      history.push(DEFAULT_ROUTE);
    }
  };

  const onIgnoreAll = () => {
    setUnSelectedTokens(detectedTokens);
    setSelectedTokens([]);
    setShowDetectedTokenIgnoredPopover(true);
  };

  const onCancelIgnore = () => {
    setUnSelectedTokens([]);
    setSelectedTokens([]);
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
        selectedTokens={selectedTokens}
        handleTokenSelection={handleTokenSelection}
        onImport={onImport}
        onIgnoreAll={onIgnoreAll}
      />
    </>
  );
};

export default DetectedToken;
