import React, { useContext } from 'react';
import { useDispatch } from 'react-redux';
import PropTypes from 'prop-types';

import { I18nContext } from '../../../contexts/i18n';
import { BannerAlert } from '../../../components/component-library/banner-alert';
import Box from '../../../components/ui/box';
import {
  AlignItems,
  SEVERITIES,
  Size,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { ButtonLink, Text } from '../../../components/component-library';
import {
  QUOTES_EXPIRED_ERROR,
  SWAP_FAILED_ERROR,
  ERROR_FETCHING_QUOTES,
  QUOTES_NOT_AVAILABLE_ERROR,
  CONTRACT_DATA_DISABLED_ERROR,
  OFFLINE_FOR_MAINTENANCE,
  SLIPPAGE_OVER_LIMIT_ERROR,
  SLIPPAGE_VERY_HIGH_ERROR,
  SLIPPAGE_TOO_LOW_ERROR,
  SLIPPAGE_NEGATIVE_ERROR,
} from '../../../../shared/constants/swaps';
import { setTransactionSettingsOpened } from '../../../ducks/swaps/swaps';

export default function SwapsBannerAlert({ swapsErrorKey }) {
  const t = useContext(I18nContext);
  const dispatch = useDispatch();
  let severity = SEVERITIES.DANGER;
  let title;
  let description;
  switch (swapsErrorKey) {
    case SLIPPAGE_OVER_LIMIT_ERROR:
      title = t('swapSlippageOverLimitTitle');
      description = (
        <Box>
          <Text variant={TextVariant.bodyMd} as="h6">
            {t('swapSlippageOverLimitDescription')}
          </Text>
          <ButtonLink
            size={Size.INHERIT}
            textProps={{
              variant: TextVariant.bodyMd,
              alignItems: AlignItems.flexStart,
            }}
            onClick={(e) => {
              e.preventDefault();
              dispatch(setTransactionSettingsOpened(true));
            }}
          >
            {t('swapEditTransactionSettings')}
          </ButtonLink>
        </Box>
      );
      break;
    case SLIPPAGE_VERY_HIGH_ERROR:
      severity = SEVERITIES.WARNING;
      title = t('swapSlippageVeryHighTitle');
      description = (
        <Text variant={TextVariant.bodyMd} as="h6">
          {t('swapSlippageVeryHighDescription')}
        </Text>
      );
      break;
    case SLIPPAGE_TOO_LOW_ERROR:
      severity = SEVERITIES.WARNING;
      title = t('swapSlippageTooLowTitle');
      description = (
        <Text variant={TextVariant.bodyMd} as="h6">
          {t('swapSlippageTooLowDescription')}
        </Text>
      );
      break;
    case SLIPPAGE_NEGATIVE_ERROR:
      title = t('swapSlippageNegativeTitle');
      description = (
        <Box>
          <Text variant={TextVariant.bodyMd} as="h6">
            {t('swapSlippageNegativeDescription')}
          </Text>
          <ButtonLink
            size={Size.INHERIT}
            textProps={{
              variant: TextVariant.bodyMd,
              alignItems: AlignItems.flexStart,
            }}
            onClick={(e) => {
              e.preventDefault();
              dispatch(setTransactionSettingsOpened(true));
            }}
          >
            {t('swapEditTransactionSettings')}
          </ButtonLink>
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
            size={Size.INHERIT}
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
      description = t('swapContractDataDisabledErrorDescription');
      description = (
        <Text variant={TextVariant.bodyMd} as="h6">
          {t('swapSlippageNegativeDescription')}
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
    <BannerAlert severity={severity} title={title}>
      {description}
    </BannerAlert>
  );
}

SwapsBannerAlert.propTypes = {
  swapsErrorKey: PropTypes.string,
};
