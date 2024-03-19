import React, { useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import {
  Box,
  ButtonPrimary,
  ButtonSecondary,
} from '../../../../components/component-library';
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

const AssetSwapButton = ({
  asset,
  primary,
}: {
  asset: Asset;
  primary?: boolean;
}) => {
  const dispatch = useDispatch();
  const history = useHistory();
  const trackEvent = useContext(MetaMetricsContext);

  const isSwapsChain = useSelector(getIsSwapsChain);
  const defaultSwapsToken = useSelector(getSwapsDefaultToken);
  const keyring = useSelector(getCurrentKeyring);
  const usingHardwareWallet = isHardwareKeyring(keyring?.type);

  const Button = primary ? ButtonPrimary : ButtonSecondary;
  return (
    <Box width={BlockSize.Full}>
      <Tooltip
        disabled={isSwapsChain}
        title={t('currentlyUnavailable')}
        position="top"
      >
        <Button
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
        </Button>
      </Tooltip>
    </Box>
  );
};

export default AssetSwapButton;
