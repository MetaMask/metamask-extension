import React, { useContext } from 'react';

import PropTypes from 'prop-types';
import { I18nContext } from '../../../contexts/i18n';

import ToggleButton from '../../ui/toggle-button';
import { Box, Text } from '../../component-library';
import {
  Display,
  FlexDirection,
  JustifyContent,
  TextVariant,
  FontWeight,
  TextColor,
} from '../../../helpers/constants/design-system';

import NetworkToggle from './NetworkToggle';
import { useIncomingTransactionToggle } from './useIncomingTransactionToggle';

const IncomingTransactionToggle = ({
  wrapperRef,
  incomingTransactionsPreferences,
  allNetworks,
  setIncomingTransactionsPreferences,
}) => {
  const t = useContext(I18nContext);

  const {
    networkPreferences,
    isAllEnabled,
    toggleAllEnabled,
    toggleSingleNetwork,
  } = useIncomingTransactionToggle({
    incomingTransactionsPreferences,
    allNetworks,
    setIncomingTransactionsPreferences,
  });

  return (
    <Box ref={wrapperRef}>
      <Text variant={TextVariant.bodyLgMedium} fontWeight={FontWeight.Bold}>
        {t('showIncomingTransactions')}
      </Text>

      <Text variant={TextVariant.bodyMd} color={TextColor.textAlternative}>
        {t('showIncomingTransactionsInformation')}
      </Text>
      <Box
        marginTop={3}
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
        justifyContent={JustifyContent.spaceBetween}
        data-testid="incoming-transaction-toggle-enable-all"
      >
        <Text variant={TextVariant.bodyMd}> {t('enableForAllNetworks')}</Text>
        <ToggleButton
          value={isAllEnabled}
          onToggle={(value) => toggleAllEnabled(!value)}
          offLabel={t('off')}
          onLabel={t('on')}
        />
      </Box>
      {Object.keys(networkPreferences).map((chainId, index) => {
        return (
          <NetworkToggle
            key={index}
            chainId={chainId}
            networkPreferences={networkPreferences[chainId]}
            toggleSingleNetwork={toggleSingleNetwork}
          />
        );
      })}
    </Box>
  );
};

export default IncomingTransactionToggle;

IncomingTransactionToggle.propTypes = {
  wrapperRef: PropTypes.object,
  incomingTransactionsPreferences: PropTypes.object.isRequired,
  allNetworks: PropTypes.array.isRequired,
  setIncomingTransactionsPreferences: PropTypes.func.isRequired,
};
