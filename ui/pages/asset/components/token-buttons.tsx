import React, { useContext, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';

import { I18nContext } from '../../../contexts/i18n';
import {
  SEND_ROUTE,
  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  PREPARE_SWAP_ROUTE,
  ///: END:ONLY_INCLUDE_IF
} from '../../../helpers/constants/routes';
import { startNewDraftTransaction } from '../../../ducks/send';
///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
import { isHardwareKeyring } from '../../../helpers/utils/hardware';
import { setSwapsFromToken } from '../../../ducks/swaps/swaps';
import useRamps from '../../../hooks/ramps/useRamps/useRamps';
///: END:ONLY_INCLUDE_IF
import {
  getIsSwapsChain,
  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  getIsBridgeChain,
  getCurrentKeyring,
  ///: END:ONLY_INCLUDE_IF
  getNetworkConfigurationIdByChainId,
} from '../../../selectors';
import { getCurrentChainId } from '../../../../shared/modules/selectors/networks';
///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
import useBridging from '../../../hooks/bridge/useBridging';
///: END:ONLY_INCLUDE_IF

import { INVALID_ASSET_TYPE } from '../../../helpers/constants/error-keys';
import {
  showModal,
  setSwitchedNetworkDetails,
  setActiveNetworkWithError,
} from '../../../store/actions';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  MetaMetricsSwapsEventSource,
} from '../../../../shared/constants/metametrics';
import { AssetType } from '../../../../shared/constants/transaction';
import {
  Display,
  IconColor,
  JustifyContent,
} from '../../../helpers/constants/design-system';
import IconButton from '../../../components/ui/icon-button/icon-button';
import {
  Box,
  Icon,
  IconName,
  IconSize,
} from '../../../components/component-library';
///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
import { getIsNativeTokenBuyable } from '../../../ducks/ramps';
///: END:ONLY_INCLUDE_IF
import { Asset } from './asset-page';

const TokenButtons = ({
  token,
}: {
  token: Asset & { type: AssetType.token };
}) => {
  const dispatch = useDispatch();
  const t = useContext(I18nContext);
  const trackEvent = useContext(MetaMetricsContext);
  const history = useHistory();
  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  const keyring = useSelector(getCurrentKeyring);
  // @ts-expect-error keyring type is wrong maybe?
  const usingHardwareWallet = isHardwareKeyring(keyring.type);
  ///: END:ONLY_INCLUDE_IF

  const currentChainId = useSelector(getCurrentChainId);
  const networks = useSelector(getNetworkConfigurationIdByChainId) as Record<
    string,
    string
  >;
  const isSwapsChain = useSelector(getIsSwapsChain);
  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  const isBridgeChain = useSelector(getIsBridgeChain);
  const isBuyableChain = useSelector(getIsNativeTokenBuyable);
  const { openBuyCryptoInPdapp } = useRamps();
  const { openBridgeExperience } = useBridging();
  ///: END:ONLY_INCLUDE_IF

  useEffect(() => {
    if (token.isERC721) {
      dispatch(
        showModal({
          name: 'CONVERT_TOKEN_TO_NFT',
          tokenAddress: token.address,
        }),
      );
    }
  }, [token.isERC721, token.address, dispatch]);

  const setCorrectChain = async () => {
    // If we aren't presently on the chain of the asset, change to it
    if (currentChainId !== token.chainId) {
      try {
        const networkConfigurationId = networks[token.chainId];
        await dispatch(setActiveNetworkWithError(networkConfigurationId));
        await dispatch(
          setSwitchedNetworkDetails({
            networkClientId: networkConfigurationId,
          }),
        );
      } catch (err) {
        console.error(`Failed to switch chains.
        Target chainId: ${token.chainId}, Current chainId: ${currentChainId}.
        ${err}`);
        throw err;
      }
    }
  };

  return (
    <Box display={Display.Flex} justifyContent={JustifyContent.spaceEvenly}>
      {
        ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
        <IconButton
          className="token-overview__button"
          Icon={
            <Icon
              name={IconName.PlusMinus}
              color={IconColor.primaryInverse}
              size={IconSize.Sm}
            />
          }
          label={t('buyAndSell')}
          data-testid="token-overview-buy"
          onClick={() => {
            openBuyCryptoInPdapp();
            trackEvent({
              event: MetaMetricsEventName.NavBuyButtonClicked,
              category: MetaMetricsEventCategory.Navigation,
              properties: {
                location: 'Token Overview',
                text: 'Buy',
                chain_id: currentChainId,
                token_symbol: token.symbol,
              },
            });
          }}
          disabled={token.isERC721 || !isBuyableChain}
          tooltipRender={null}
        />
        ///: END:ONLY_INCLUDE_IF
      }

      <IconButton
        className="token-overview__button"
        onClick={async () => {
          trackEvent(
            {
              event: MetaMetricsEventName.NavSendButtonClicked,
              category: MetaMetricsEventCategory.Navigation,
              properties: {
                token_symbol: token.symbol,
                location: MetaMetricsSwapsEventSource.TokenView,
                text: 'Send',
                chain_id: token.chainId,
              },
            },
            { excludeMetaMetricsId: false },
          );
          try {
            await setCorrectChain();
            await dispatch(
              startNewDraftTransaction({
                type: AssetType.token,
                details: token,
              }),
            );
            history.push(SEND_ROUTE);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } catch (err: any) {
            if (!err.message.includes(INVALID_ASSET_TYPE)) {
              throw err;
            }
          }
        }}
        Icon={
          <Icon
            name={IconName.Arrow2UpRight}
            color={IconColor.primaryInverse}
            size={IconSize.Sm}
          />
        }
        label={t('send')}
        data-testid="eth-overview-send"
        disabled={token.isERC721}
        tooltipRender={null}
      />
      {isSwapsChain && (
        <IconButton
          className="token-overview__button"
          Icon={
            <Icon
              name={IconName.SwapHorizontal}
              color={IconColor.primaryInverse}
              size={IconSize.Sm}
            />
          }
          onClick={async () => {
            await setCorrectChain();

            ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
            trackEvent({
              event: MetaMetricsEventName.NavSwapButtonClicked,
              category: MetaMetricsEventCategory.Swaps,
              properties: {
                token_symbol: token.symbol,
                location: MetaMetricsSwapsEventSource.TokenView,
                text: 'Swap',
                chain_id: currentChainId,
              },
            });
            dispatch(
              setSwapsFromToken({
                ...token,
                address: token.address?.toLowerCase(),
                iconUrl: token.image,
                balance: token?.balance?.value,
                string: token?.balance?.display,
              }),
            );
            if (usingHardwareWallet) {
              global.platform.openExtensionInBrowser?.(
                PREPARE_SWAP_ROUTE,
                undefined,
                false,
              );
            } else {
              history.push(PREPARE_SWAP_ROUTE);
            }
            ///: END:ONLY_INCLUDE_IF
          }}
          label={t('swap')}
          tooltipRender={null}
        />
      )}

      {
        ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
        isBridgeChain && (
          <IconButton
            className="token-overview__button"
            data-testid="token-overview-bridge"
            Icon={
              <Icon
                name={IconName.Bridge}
                color={IconColor.primaryInverse}
                size={IconSize.Sm}
              />
            }
            label={t('bridge')}
            onClick={async () => {
              await setCorrectChain();
              openBridgeExperience(
                MetaMetricsSwapsEventSource.TokenView,
                {
                  ...token,
                  iconUrl: token.image,
                  balance: token?.balance?.value,
                  string: token?.balance?.display,
                  name: token.name ?? '',
                },
                false,
              );
            }}
            tooltipRender={null}
          />
        )
        ///: END:ONLY_INCLUDE_IF
      }
    </Box>
  );
};

export default TokenButtons;
