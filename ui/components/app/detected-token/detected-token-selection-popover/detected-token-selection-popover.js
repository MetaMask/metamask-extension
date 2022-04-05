import React, { useState } from 'react';
import PropTypes from 'prop-types';

import { useHistory} from 'react-router-dom';
import { useSelector } from 'react-redux';

import { useI18nContext } from '../../../../hooks/useI18nContext';
import { getDetectedTokensInCurrentNetwork } from '../../../../selectors';

import Popover from '../../../ui/popover';
import Box from '../../../ui/box';
import Button from '../../../ui/button';
import DetectedTokenDetails from '../detected-token-details/detected-token-details';
import { DEFAULT_ROUTE } from '../../../../helpers/constants/routes';

const DetectedTokenSelectionPopover = ({selectedTokens, handleTokenSelection, onIgnoreAll}) => {
  const t = useI18nContext();
  const history = useHistory();
  
  const detectedTokens = useSelector(getDetectedTokensInCurrentNetwork);
  
  // const [selectedTokens, setSelectedTokens] = useState([]);

  const onImport = () => {
    console.log('import tokens', selectedTokens);
  }

  // const onIgnoreAll = () => {
  //   // setSelectedTokens([]);
  //   console.log('ignore tokens', selectedTokens)
  //   history.push(DETECTED_TOKEN_IGNORED_ROUTE);
  // }

  const onClose = () => {
    history.push(DEFAULT_ROUTE)
  }
  // const handleClearTokensSelection = () => {
  //   setSelectedTokens([]);
  // }

  // const handleTokenSelection = (tokenAddress) => {
  //   const newSelectedTokens = new Set(selectedTokens);
  //   if (newSelectedTokens.has(tokenAddress)) {
  //     newSelectedTokens.delete(tokenAddress);
  //   } else {
  //     newSelectedTokens.add(tokenAddress);
  //   }
  //   setSelectedTokens(newSelectedTokens);
  // }
  
  const footer =
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
        {t('import')}
      </Button>
    </>;

  return (
    <Popover
      className="detected-token-selection-popover"
      title={t('tokensFoundTitle', [detectedTokens.length])}
      onClose={onClose}
      footer={footer}
    >
      <Box margin={3}>
        {detectedTokens.map((token, index) => {
          return <DetectedTokenDetails key={index} token={token} handleTokenSelection={handleTokenSelection} />
        })}
      </Box>
    </Popover>
  );
};

DetectedTokenSelectionPopover.propTypes = {
  selectedTokens: PropTypes.array,
  handleTokenSelection: PropTypes.func,
  onIgnoreAll: PropTypes.func,
}

export default DetectedTokenSelectionPopover;
