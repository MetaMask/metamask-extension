import React, { useCallback, useContext, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import classnames from 'classnames';
import {
  Box,
  Text,
  ButtonBase,
  IconName,
  ButtonIconSize,
  ButtonIcon,
} from '../../component-library';
import {
  BorderRadius,
  Display,
  FlexDirection,
  IconColor,
  JustifyContent,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  getMultichainDefaultToken,
  getMultichainCurrentNetwork,
} from '../../../selectors/multichain';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import useRamps, {
  RampsMetaMaskEntry,
} from '../../../hooks/ramps/useRamps/useRamps';
import { ORIGIN_METAMASK } from '../../../../shared/constants/app';
import { getCurrentLocale } from '../../../ducks/locale/locale';
import { submitRequestToBackground } from '../../../store/background-connection';

const darkenGradient =
  'linear-gradient(rgba(0, 0, 0, 0.12),rgba(0, 0, 0, 0.12))';

export const RAMPS_CARD_VARIANT_TYPES = {
  TOKEN: 'token',
  ACTIVITY: 'activity',
  BTC: 'btc',
};

export const RAMPS_CARD_VARIANTS = {
  [RAMPS_CARD_VARIANT_TYPES.TOKEN]: {
    illustrationSrc: './images/ramps-card-token-illustration.png',
    gradient:
      // eslint-disable-next-line @metamask/design-tokens/color-no-hex
      'linear-gradient(90deg, #0189EC 0%, #4B7AED 35%, #6774EE 58%, #706AF4 80.5%, #7C5BFC 100%)',
    title: 'tipsForUsingAWallet',
    body: 'tipsForUsingAWalletDescription',
  },
  [RAMPS_CARD_VARIANT_TYPES.ACTIVITY]: {
    illustrationSrc: './images/ramps-card-activity-illustration.png',
    gradient:
      // eslint-disable-next-line @metamask/design-tokens/color-no-hex
      'linear-gradient(90deg, #57C5DC 0%, #06BFDD 49.39%, #35A9C7 100%)',

    title: 'tipsForUsingAWallet',
    body: 'tipsForUsingAWalletDescription',
  },
  [RAMPS_CARD_VARIANT_TYPES.BTC]: {
    illustrationSrc: './images/ramps-card-btc-illustration.png',
    gradient:
      // eslint-disable-next-line @metamask/design-tokens/color-no-hex
      'linear-gradient(90deg, #017ED9 0%, #446FD9 35%, #5E6AD9 58%, #635ED9 80.5%, #6855D9 92.5%, #6A4FD9 100%)',
    title: 'tipsForUsingAWallet',
    body: 'tipsForUsingAWalletDescription',
  },
};

const metamaskEntryMap = {
  [RAMPS_CARD_VARIANT_TYPES.TOKEN]: RampsMetaMaskEntry.TokensBanner,
  [RAMPS_CARD_VARIANT_TYPES.ACTIVITY]: RampsMetaMaskEntry.ActivityBanner,
  [RAMPS_CARD_VARIANT_TYPES.BTC]: RampsMetaMaskEntry.BtcBanner,
};

export const RampsCard = ({ variant, handleOnClick }) => {
  const t = useI18nContext();
  const { gradient, illustrationSrc, title, body } =
    RAMPS_CARD_VARIANTS[variant];
  const { openBuyCryptoInPdapp } = useRamps(metamaskEntryMap[variant]);
  const { trackEvent } = useContext(MetaMetricsContext);
  const currentLocale = useSelector(getCurrentLocale);
  const { chainId, nickname } = useSelector(getMultichainCurrentNetwork);
  const { symbol } = useSelector(getMultichainDefaultToken);

  const isRampsCardClosed = useSelector(
    (state) => state.metamask.isRampCardClosed,
  );

  useEffect(() => {
    trackEvent({
      event: MetaMetricsEventName.EmptyBuyBannerDisplayed,
      category: MetaMetricsEventCategory.Navigation,
      properties: {
        // FIXME: This might not be a number for non-EVM networks
        chain_id: chainId,
        locale: currentLocale,
        network: nickname,
        referrer: ORIGIN_METAMASK,
      },
    });
  }, [currentLocale, chainId, nickname, trackEvent]);

  const onClick = useCallback(() => {
    openBuyCryptoInPdapp(chainId);
    trackEvent({
      event: MetaMetricsEventName.NavBuyButtonClicked,
      category: MetaMetricsEventCategory.Navigation,
      properties: {
        location: `${variant} tab`,
        text: `Token Marketplace`,
        // FIXME: This might not be a number for non-EVM networks
        chain_id: chainId,
        token_symbol: symbol,
      },
    });
  }, [chainId, openBuyCryptoInPdapp, symbol, trackEvent, variant]);

  const onClose = useCallback(() => {
    trackEvent({
      event: MetaMetricsEventName.EmptyBuyBannerClosed,
      category: MetaMetricsEventCategory.Navigation,
      properties: {
        location: `${variant} tab`,
        chain_id: chainId,
        token_symbol: symbol,
      },
    });

    submitRequestToBackground('setRampCardClosed')?.catch((error) => {
      console.error(
        'Error caught in setRampCardClosed submitRequestToBackground',
        error,
      );
    });
  }, [chainId, symbol, trackEvent, variant]);

  if (isRampsCardClosed) {
    return null;
  }

  return (
    <Box
      className={classnames('ramps-card', `ramps-card-${variant}`)}
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      gap={2}
      borderRadius={BorderRadius.LG}
      margin={2}
      style={{
        background: `url(${illustrationSrc}) no-repeat right bottom / contain,
            ${darkenGradient}, ${gradient}`,
      }}
    >
      <Box display={Display.Flex} justifyContent={JustifyContent.spaceBetween}>
        <Text className="ramps-card__title" variant={TextVariant.headingSm}>
          {t(title)}
        </Text>
        <ButtonIcon
          data-testid="ramp-card-close-btn"
          color={IconColor.infoInverse}
          iconName={IconName.Close}
          size={ButtonIconSize.Sm}
          ariaLabel={t('close')}
          onClick={onClose}
        />
      </Box>
      <Text className="ramps-card__body">{t(body)}</Text>
      <ButtonBase
        className="ramps-card__cta-button"
        onClick={handleOnClick ?? onClick}
      >
        {t('tokenMarketplace')}
      </ButtonBase>
    </Box>
  );
};

RampsCard.propTypes = {
  variant: PropTypes.oneOf(Object.values(RAMPS_CARD_VARIANT_TYPES)),
  handleOnClick: PropTypes.func,
};
