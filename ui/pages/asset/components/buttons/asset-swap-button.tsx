import React, { useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { Box, ButtonPrimary } from '../../../../components/component-library';
import { MetaMetricsContext } from '../../../../contexts/metametrics';
import { BlockSize } from '../../../../helpers/constants/design-system';
import { t } from '../../../../../app/scripts/translate';
import {
  MetaMetricsEventName,
  MetaMetricsEventCategory,
  MetaMetricsSwapsEventSource,
} from '../../../../../shared/constants/metametrics';
import { AssetType } from '../../../../../shared/constants/transaction';
import {
  getCurrentKeyring,
  getIsSwapsChain,
  getSwapsDefaultToken,
} from '../../../../selectors';
import { Asset } from '../asset-v2';
import Tooltip from '../../../../components/ui/tooltip';
import { setSwapsFromToken } from '../../../../ducks/swaps/swaps';
import { isHardwareKeyring } from '../../../../helpers/utils/hardware';
import { BUILD_QUOTE_ROUTE } from '../../../../helpers/constants/routes';

const AssetSwapButton = ({ asset }: { asset: Asset }) => {
  const dispatch = useDispatch();
  const history = useHistory();
  const trackEvent = useContext(MetaMetricsContext);

  const isSwapsChain = useSelector(getIsSwapsChain);
  const defaultSwapsToken = useSelector(getSwapsDefaultToken);
  const keyring = useSelector(getCurrentKeyring);
  const usingHardwareWallet = isHardwareKeyring(keyring?.type);

  return (
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
  );
};

export default AssetSwapButton;
