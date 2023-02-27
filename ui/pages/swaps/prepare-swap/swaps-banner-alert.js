import React, { useContext } from 'react';
import { useDispatch } from 'react-redux';
import PropTypes from 'prop-types';

import { I18nContext } from '../../../contexts/i18n';
import { BannerAlert } from '../../../components/component-library/banner-alert';
import Box from '../../../components/ui/box';
import Typography from '../../../components/ui/typography';
import Button from '../../../components/ui/button';
import {
  TypographyVariant,
  DISPLAY,
  FLEX_DIRECTION,
  FONT_WEIGHT,
  TextColor,
  JustifyContent,
  AlignItems,
  SEVERITIES,
  Size,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { ButtonLink } from '../../../components/component-library';
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
          <Typography variant={TypographyVariant.H6}>
            {t('swapSlippageOverLimitDescription')}
          </Typography>
          <ButtonLink
            size={Size.SM}
            textProps={{
              variant: TextVariant.bodySm,
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
        <Typography variant={TypographyVariant.H6}>
          {t('swapSlippageVeryHighDescription')}
        </Typography>
      );
      break;
    case SLIPPAGE_TOO_LOW_ERROR:
      severity = SEVERITIES.WARNING;
      title = t('swapSlippageTooLowTitle');
      description = (
        <Typography variant={TypographyVariant.H6}>
          {t('swapSlippageTooLowDescription')}
        </Typography>
      );
      break;
    case SLIPPAGE_NEGATIVE_ERROR:
      title = t('swapSlippageNegativeTitle');
      description = (
        <Box>
          <Typography variant={TypographyVariant.H6}>
            {t('swapSlippageNegativeDescription')}
          </Typography>
          <ButtonLink
            size={Size.SM}
            textProps={{
              variant: TextVariant.bodySm,
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
          <Typography variant={TypographyVariant.H6}>
            {t('swapQuotesNotAvailableDescription')}
          </Typography>
          <ButtonLink
            size={Size.SM}
            textProps={{
              variant: TextVariant.bodySm,
              alignItems: AlignItems.flexStart,
            }}
            as="a"
            href="https://metamask.io/swaps/"
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
        <Typography variant={TypographyVariant.H6}>
          {t('swapFetchingQuotesErrorDescription')}
        </Typography>
      );
      break;
    case CONTRACT_DATA_DISABLED_ERROR:
      title = t('swapContractDataDisabledErrorTitle');
      description = t('swapContractDataDisabledErrorDescription');
      description = (
        <Typography variant={TypographyVariant.H6}>
          {t('swapSlippageNegativeDescription')}
        </Typography>
      );
      break;
    case QUOTES_EXPIRED_ERROR:
      title = t('swapQuotesExpiredErrorTitle');
      description = (
        <Typography variant={TypographyVariant.H6}>
          {t('swapQuotesExpiredErrorDescription')}
        </Typography>
      );
      break;
    case OFFLINE_FOR_MAINTENANCE:
      title = t('offlineForMaintenance');
      description = (
        <Typography variant={TypographyVariant.H6}>
          {t('metamaskSwapsOfflineDescription')}
        </Typography>
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
