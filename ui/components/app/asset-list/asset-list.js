import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import ImportTokenLink from '../import-token-link';
import TokenList from '../token-list';
import { IMPORT_TOKEN_ROUTE } from '../../../helpers/constants/routes';
import AssetListItem from '../asset-list-item';
import { PRIMARY, SECONDARY } from '../../../helpers/constants/common';
import { useUserPreferencedCurrency } from '../../../hooks/useUserPreferencedCurrency';
import {
  getCurrentAccountWithSendEtherInfo,
  getShouldShowFiat,
  getNativeCurrencyImage,
  getIsMainnet,
} from '../../../selectors';
import { getNativeCurrency } from '../../../ducks/metamask/metamask';
import { useCurrencyDisplay } from '../../../hooks/useCurrencyDisplay';
import Typography from '../../ui/typography/typography';
import Box from '../../ui/box/box';
import {
  COLORS,
  TYPOGRAPHY,
  FONT_WEIGHT,
  JUSTIFY_CONTENT,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { MetaMetricsContext } from '../../../contexts/metametrics';

const AssetList = ({ onClickAsset }) => {
  const t = useI18nContext();
  const history = useHistory();
  const selectedAccountBalance = useSelector(
    (state) => getCurrentAccountWithSendEtherInfo(state).balance,
  );
  const nativeCurrency = useSelector(getNativeCurrency);
  const showFiat = useSelector(getShouldShowFiat);
  const trackEvent = useContext(MetaMetricsContext);

  const {
    currency: primaryCurrency,
    numberOfDecimals: primaryNumberOfDecimals,
  } = useUserPreferencedCurrency(PRIMARY, { ethNumberOfDecimals: 4 });
  const {
    currency: secondaryCurrency,
    numberOfDecimals: secondaryNumberOfDecimals,
  } = useUserPreferencedCurrency(SECONDARY, { ethNumberOfDecimals: 4 });

  const [, primaryCurrencyProperties] = useCurrencyDisplay(
    selectedAccountBalance,
    {
      numberOfDecimals: primaryNumberOfDecimals,
      currency: primaryCurrency,
    },
  );

  const [
    secondaryCurrencyDisplay,
    secondaryCurrencyProperties,
  ] = useCurrencyDisplay(selectedAccountBalance, {
    numberOfDecimals: secondaryNumberOfDecimals,
    currency: secondaryCurrency,
  });

  const primaryTokenImage = useSelector(getNativeCurrencyImage);
  const isMainnet = useSelector(getIsMainnet) || process.env.IN_TEST;

  return (
    <>
      <AssetListItem
        onClick={() => onClickAsset(nativeCurrency)}
        data-testid="wallet-balance"
        primary={
          primaryCurrencyProperties.value ?? secondaryCurrencyProperties.value
        }
        tokenSymbol={primaryCurrencyProperties.suffix}
        secondary={showFiat ? secondaryCurrencyDisplay : undefined}
        tokenImage={primaryTokenImage}
        identiconBorder
      />
      <TokenList
        onTokenClick={(tokenAddress) => {
          onClickAsset(tokenAddress);
          trackEvent({
            event: 'Clicked Token',
            category: 'Navigation',
            properties: {
              action: 'Token Menu',
              legacy_event: true,
            },
          });
        }}
      />
      <Box marginTop={4}>
        <Box justifyContent={JUSTIFY_CONTENT.CENTER}>
          <Typography
            color={COLORS.TEXT_ALTERNATIVE}
            variant={TYPOGRAPHY.H6}
            fontWeight={FONT_WEIGHT.NORMAL}
          >
            {t('missingToken')}
          </Typography>
        </Box>
        <ImportTokenLink
          isMainnet={isMainnet}
          onClick={() => {
            history.push(IMPORT_TOKEN_ROUTE);
            trackEvent({
              event: 'Clicked "Add Token"',
              category: 'Navigation',
              properties: {
                action: 'Token Menu',
                legacy_event: true,
              },
            });
          }}
        />
      </Box>
    </>
  );
};

AssetList.propTypes = {
  onClickAsset: PropTypes.func.isRequired,
};

export default AssetList;
