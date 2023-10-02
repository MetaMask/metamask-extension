import React, { useContext } from 'react';
import { useDispatch } from 'react-redux';
import PropTypes from 'prop-types';

import { I18nContext } from '../../../contexts/i18n';
import { BannerAlert } from '../../../components/component-library/banner-alert';
import Box from '../../../components/ui/box';
import {
  AlignItems,
  SEVERITIES,
  TextVariant,
} from '../../../helpers/constants/design-system';
import {
  ButtonLink,
  ButtonLinkSize,
  Text,
} from '../../../components/component-library';

import {
  QUOTES_EXPIRED_ERROR,
  SWAP_FAILED_ERROR,
  ERROR_FETCHING_QUOTES,
  QUOTES_NOT_AVAILABLE_ERROR,
  CONTRACT_DATA_DISABLED_ERROR,
  OFFLINE_FOR_MAINTENANCE,
  SLIPPAGE_VERY_HIGH_ERROR,
  SLIPPAGE_HIGH_ERROR,
  SLIPPAGE_LOW_ERROR,
  SLIPPAGE_NEGATIVE_ERROR,
} from '../../../../shared/constants/swaps';
import { setTransactionSettingsOpened } from '../../../ducks/swaps/swaps';

export default function SwapsBannerAlert({
  swapsErrorKey,
  showTransactionSettingsLink,
  currentSlippage,
}) {
  const t = useContext(I18nContext);
  const dispatch = useDispatch();
  let severity = SEVERITIES.DANGER;
  let title;
  let description;

  const transactionSettingsLink = (
    <Text variant={TextVariant.bodyMd}>
      <ButtonLink
        onClick={(e) => {
          e.preventDefault();
          dispatch(setTransactionSettingsOpened(true));
        }}
        size={ButtonLinkSize.Inherit}
      >
        {t('swapAdjustSlippage')}
      </ButtonLink>
    </Text>
  );

  switch (swapsErrorKey) {
    case SLIPPAGE_VERY_HIGH_ERROR:
      title = t('swapSlippageOverLimitTitle');
      description = (
        <Box>
          <Text variant={TextVariant.bodyMd} as="h6">
            {t('swapSlippageOverLimitDescription')}
          </Text>
          {transactionSettingsLink}
        </Box>
      );
      break;
    case SLIPPAGE_HIGH_ERROR:
      severity = SEVERITIES.WARNING;
      title = t('swapSlippageHighTitle');
      description = (
        <Box>
          <Text variant={TextVariant.bodyMd} as="h6">
            {t('swapSlippageHighDescription', [currentSlippage])}
          </Text>
          {showTransactionSettingsLink && transactionSettingsLink}
        </Box>
      );
      break;
    case SLIPPAGE_LOW_ERROR:
      severity = SEVERITIES.WARNING;
      title = t('swapSlippageLowTitle');
      description = (
        <Box>
          <Text variant={TextVariant.bodyMd} as="h6">
            {t('swapSlippageLowDescription', [currentSlippage])}
          </Text>
          {showTransactionSettingsLink && transactionSettingsLink}
        </Box>
      );
      break;
    case SLIPPAGE_NEGATIVE_ERROR:
      title = t('swapSlippageNegativeTitle');
      description = (
        <Box>
          <Text variant={TextVariant.bodyMd} as="h6">
            {t('swapSlippageNegativeDescription')}
          </Text>
          {transactionSettingsLink}
        </Box>
      );
      break;
    case QUOTES_NOT_AVAILABLE_ERROR:
      title = t('swapQuotesNotAvailableErrorTitle');
      description = (
        <Box>
          <Text variant={TextVariant.bodyMd} as="h6">
            {t('swapQuotesNotAvailableDescription')}
          </Text>
          <ButtonLink
            size={ButtonLinkSize.Inherit}
            textProps={{
              variant: TextVariant.bodyMd,
              alignItems: AlignItems.flexStart,
            }}
            as="a"
            href="https://support.metamask.io/hc/en-us/articles/4405093054363-User-Guide-Swaps"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t('swapLearnMore')}
          </ButtonLink>
        </Box>
      );
      break;
    case ERROR_FETCHING_QUOTES:
      title = t('swapFetchingQuotesErrorTitle');
      description = (
        <Text variant={TextVariant.bodyMd} as="h6">
          {t('swapFetchingQuotesErrorDescription')}
        </Text>
      );
      break;
    case CONTRACT_DATA_DISABLED_ERROR:
      title = t('swapContractDataDisabledErrorTitle');
      description = (
        <Text variant={TextVariant.bodyMd} as="h6">
          {t('swapContractDataDisabledErrorDescription')}
        </Text>
      );
      break;
    case QUOTES_EXPIRED_ERROR:
      title = t('swapQuotesExpiredErrorTitle');
      description = (
        <Text variant={TextVariant.bodyMd} as="h6">
          {t('swapQuotesExpiredErrorDescription')}
        </Text>
      );
      break;
    case OFFLINE_FOR_MAINTENANCE:
      title = t('offlineForMaintenance');
      description = (
        <Text variant={TextVariant.bodyMd} as="h6">
          {t('metamaskSwapsOfflineDescription')}
        </Text>
      );
      break;
    case SWAP_FAILED_ERROR:
      title = t('swapFailedErrorTitle');
      break;
    default:
  }

  return (
    <BannerAlert
      severity={severity}
      title={title}
      titleProps={{ 'data-testid': 'swaps-banner-title' }}
    >
      {description}
    </BannerAlert>
  );
}

SwapsBannerAlert.propTypes = {
  swapsErrorKey: PropTypes.string,
  showTransactionSettingsLink: PropTypes.bool,
  currentSlippage: PropTypes.number,
};
