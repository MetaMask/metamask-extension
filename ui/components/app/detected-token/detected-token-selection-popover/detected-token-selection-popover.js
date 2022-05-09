import React from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';

import { useI18nContext } from '../../../../hooks/useI18nContext';
import { getDetectedTokensInCurrentNetwork } from '../../../../selectors';

import Popover from '../../../ui/popover';
import Box from '../../../ui/box';
import Button from '../../../ui/button';
import DetectedTokenDetails from '../detected-token-details/detected-token-details';

const DetectedTokenSelectionPopover = ({
  tokensListDetected,
  handleTokenSelection,
  onImport,
  onIgnoreAll,
  setShowDetectedTokens,
  sortingBasedOnTokenSelection,
}) => {
  const t = useI18nContext();

  const detectedTokens = useSelector(getDetectedTokensInCurrentNetwork);
  const { selected: selectedTokens = [] } = sortingBasedOnTokenSelection(
    tokensListDetected,
  );
  const numOfTokensImporting =
    selectedTokens.length === detectedTokens.length
      ? `All`
      : `(${selectedTokens.length})`;

  const onClose = () => {
    setShowDetectedTokens(false);
  };

  const footer = (
    <>
      <Button
        className="detected-token-selection-popover__ignore-button"
        type="secondary"
        onClick={() => onIgnoreAll()}
      >
        {t('ignoreAll')}
      </Button>
      <Button
        className="detected-token-selection-popover__import-button"
        type="primary"
        onClick={onImport}
      >
        {t('importWithCount', [numOfTokensImporting])}
      </Button>
    </>
  );

  return (
    <Popover
      className="detected-token-selection-popover"
      title={t('tokensFoundTitle', [detectedTokens.length])}
      onClose={onClose}
      footer={footer}
    >
      <Box margin={3}>
        {detectedTokens.map((token, index) => {
          return (
            <DetectedTokenDetails
              key={index}
              token={token}
              handleTokenSelection={handleTokenSelection}
              tokensListDetected={tokensListDetected}
            />
          );
        })}
      </Box>
    </Popover>
  );
};

DetectedTokenSelectionPopover.propTypes = {
  tokensListDetected: PropTypes.object,
  handleTokenSelection: PropTypes.func.isRequired,
  onIgnoreAll: PropTypes.func.isRequired,
  onImport: PropTypes.func.isRequired,
  setShowDetectedTokens: PropTypes.func.isRequired,
  sortingBasedOnTokenSelection: PropTypes.func.isRequired,
};

export default DetectedTokenSelectionPopover;
