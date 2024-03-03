import React, { useContext } from 'react';
import { useHistory } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  BackgroundColor,
  BlockSize,
  Display,
} from '../../../helpers/constants/design-system';
import {
  Box,
  ButtonPrimary,
  ButtonSecondary,
  ButtonSecondarySize,
} from '../../../components/component-library';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { BUILD_QUOTE_ROUTE } from '../../../helpers/constants/routes';
import {
  getCurrentKeyring,
  getIsBuyableChain,
  getIsSwapsChain,
  getSwapsDefaultToken,
} from '../../../selectors';
import Tooltip from '../../../components/ui/tooltip';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  MetaMetricsSwapsEventSource,
} from '../../../../shared/constants/metametrics';
import { AssetType } from '../../../../shared/constants/transaction';
import { setSwapsFromToken } from '../../../ducks/swaps/swaps';
import { isHardwareKeyring } from '../../../helpers/utils/hardware';
import useRamps from '../../../hooks/experiences/useRamps';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { Asset } from './asset-v2';

const AssetFooter = ({asset}: {asset: Asset}) => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const history = useHistory();
  const { openBuyCryptoInPdapp } = useRamps();
  const trackEvent = useContext(MetaMetricsContext);

  const isSwapsChain = useSelector(getIsSwapsChain);
  const isBuyableChain = useSelector(getIsBuyableChain);
  const defaultSwapsToken = useSelector(getSwapsDefaultToken);
  const keyring = useSelector(getCurrentKeyring);

  const usingHardwareWallet = isHardwareKeyring(keyring?.type);

  return (
    <Box
      display={Display.Flex}
      gap={[4, 12]}
      className="asset-footer"
      padding={4}
      paddingLeft={[4, 12]}
      paddingRight={[4, 12]}
      backgroundColor={BackgroundColor.backgroundDefault}
    >
      <Box width={BlockSize.Full}>
        <Tooltip
          disabled={isBuyableChain}
          title={t('currentlyUnavailable')}
          position="top"
        >
          <ButtonSecondary
            disabled={!isBuyableChain}
            size={ButtonSecondarySize.Md}
            padding={5}
            width={BlockSize.Full}
            onClick={() => {
              openBuyCryptoInPdapp();
              trackEvent({
                event: MetaMetricsEventName.NavBuyButtonClicked,
                category: MetaMetricsEventCategory.Navigation,
                properties: {
                  location: 'Token Overview',
                  text: 'Buy',
                  chain_id: asset.chainId,
                  token_symbol: asset.symbol,
                },
              });
            }}
          >
            {t('buy')}
          </ButtonSecondary>
        </Tooltip>
      </Box>
      <Box width={BlockSize.Full}>
        <Tooltip
          disabled={isSwapsChain}
          title={t('currentlyUnavailable')}
          position="top"
        >
          <ButtonPrimary
            disabled={!isSwapsChain}
            padding={5}
            width={BlockSize.Full}
            onClick={() => {
              trackEvent({
                event: MetaMetricsEventName.NavSwapButtonClicked,
                category: MetaMetricsEventCategory.Swaps,
                properties: {
                  token_symbol: asset.symbol,
                  location: MetaMetricsSwapsEventSource.TokenView,
                  text: 'Swap',
                  chain_id: asset.chainId,
                },
              });
              dispatch(
                setSwapsFromToken(
                  asset.type === AssetType.native
                    ? defaultSwapsToken
                    : {
                        symbol: asset.symbol,
                        name: asset.name,
                        address: asset.address,
                        decimals: asset.decimals,
                        iconUrl: asset.image,
                        balance: asset.balance.value,
                        string: asset.balance.display,
                      },
                ),
              );

              if (usingHardwareWallet) {
                // @ts-expect-error not sure why this doesn't exist on type 'Platform'
                global.platform.openExtensionInBrowser(BUILD_QUOTE_ROUTE);
              } else {
                history.push(BUILD_QUOTE_ROUTE);
              }
            }}
          >
            {t('swap')}
          </ButtonPrimary>
        </Tooltip>
      </Box>
    </Box>
  );
};

export default AssetFooter;
