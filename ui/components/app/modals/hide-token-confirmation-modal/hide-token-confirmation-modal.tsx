import React from 'react';
import { connect } from 'react-redux';
import type { InternalAccount } from '@metamask/keyring-internal-api';
import type { NetworkConfiguration } from '@metamask/network-controller';
import {
  formatChainIdToCaip,
  isNonEvmChainId,
} from '@metamask/bridge-controller';
import type { CaipChainId, Hex } from '@metamask/utils';
import {
  AvatarToken,
  AvatarTokenSize,
  Box,
  BoxAlignItems,
  BoxJustifyContent,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import * as actions from '../../../../store/actions';
import {
  type MetaMaskReduxDispatch,
  type MetaMaskReduxState,
} from '../../../../store/store';
import { Button, ButtonVariant } from '../../../component-library';
import { DEFAULT_ROUTE } from '../../../../helpers/constants/routes';
import {
  getCurrentChainId,
  getNetworkConfigurationsByChainId,
} from '../../../../../shared/lib/selectors/networks';
import { getInternalAccountBySelectedAccountGroupAndCaip } from '../../../../selectors/multichain-accounts/account-tree';
import { toAssetId } from '../../../../../shared/lib/asset-utils';
import { getIsAssetsUnifyStateEnabled } from '../../../../selectors/assets-unify-state/feature-flags';
import {
  getAssetsControllerCustomAssets,
  isAssetInAccountCustomAssets,
  type CustomAssetsState,
} from '../../../../selectors/assets-unify-state/asset-preferences';

type HideToken = {
  symbol?: string;
  address: string;
  image?: string;
  chainId?: string;
};

type HideTokenConfirmationModalProps = {
  chainId: string;
  token: HideToken;
  hideToken: (
    address: string,
    networkClientId: string | undefined,
    chainId: string,
    getAccountForChain: (
      caipChainId: CaipChainId,
    ) => InternalAccount | null | undefined,
    assetsUnifyStateFeatureEnabled: boolean,
    customAssets?: CustomAssetsState,
  ) => void;
  hideModal: () => void;
  navigate: (path: string) => void;
  networkConfigurationsByChainId: Record<string, NetworkConfiguration>;
  getAccountForChain: (
    caipChainId: CaipChainId,
  ) => InternalAccount | null | undefined;
  assetsUnifyStateFeatureEnabled: boolean;
  customAssets?: CustomAssetsState;
};

function mapStateToProps(state: MetaMaskReduxState) {
  const modalProps = state.appState.modal.modalState.props as {
    token: HideToken;
    navigate: (path: string) => void;
  };

  return {
    chainId: getCurrentChainId(state),
    token: modalProps.token,
    navigate: modalProps.navigate,
    networkConfigurationsByChainId: getNetworkConfigurationsByChainId(state),
    getAccountForChain: (caipChainId: CaipChainId) =>
      getInternalAccountBySelectedAccountGroupAndCaip(state, caipChainId),
    assetsUnifyStateFeatureEnabled: getIsAssetsUnifyStateEnabled(state),
    customAssets: getAssetsControllerCustomAssets(
      state as Parameters<typeof getAssetsControllerCustomAssets>[0],
    ),
  };
}

function mapDispatchToProps(dispatch: MetaMaskReduxDispatch) {
  return {
    hideModal: () => dispatch(actions.hideModal()),
    hideToken: async (
      address: string,
      networkClientId: string | undefined,
      chainId: string,
      getAccountForChain: (
        caipChainId: CaipChainId,
      ) => InternalAccount | null | undefined,
      assetsUnifyStateFeatureEnabled: boolean,
      customAssets?: CustomAssetsState,
    ) => {
      const isNonEvm = isNonEvmChainId(chainId);

      if (assetsUnifyStateFeatureEnabled) {
        const assetId = toAssetId(address, chainId as Hex);
        const caipChainId = isNonEvmChainId(chainId)
          ? (chainId as CaipChainId)
          : formatChainIdToCaip(chainId as Hex);
        const accountForChain = getAccountForChain(caipChainId);
        const isInCustomAssets =
          accountForChain &&
          assetId &&
          isAssetInAccountCustomAssets(
            customAssets,
            accountForChain.id,
            assetId,
          );

        try {
          if (isInCustomAssets) {
            await dispatch(
              actions.removeCustomAsset(accountForChain.id, assetId),
            );
          } else if (assetId) {
            await dispatch(actions.hideAsset(assetId));
          }
        } catch (error) {
          console.error('Error hiding/removing asset:', error);
          return;
        }
      }

      if (isNonEvm) {
        const accountForChain = getAccountForChain(chainId as CaipChainId);

        if (!accountForChain) {
          console.warn(`No account found for chain ${chainId}`);
          return;
        }

        await dispatch(
          actions.multichainIgnoreAssets([address], accountForChain.id),
        );
      } else {
        await dispatch(
          actions.ignoreTokens({
            tokensToIgnore: [address],
            networkClientId,
          }),
        );
      }

      dispatch(actions.hideModal());
    },
  };
}

export function HideTokenConfirmationModal({
  chainId,
  token,
  hideToken,
  hideModal,
  navigate,
  networkConfigurationsByChainId,
  getAccountForChain,
  assetsUnifyStateFeatureEnabled,
  customAssets,
}: HideTokenConfirmationModalProps) {
  const t = useI18nContext();
  const { symbol, address, image, chainId: tokenChainId } = token;
  const chainIdToUse = tokenChainId || chainId;

  return (
    <div className="hide-token-confirmation__container">
      <div className="hide-token-confirmation__title">
        {t('hideTokenPrompt')}
      </div>
      <AvatarToken
        className="hide-token-confirmation__identicon"
        size={AvatarTokenSize.Xl}
        name={symbol || address}
        src={image}
      />
      <div className="hide-token-confirmation__symbol">{symbol}</div>
      <div className="hide-token-confirmation__copy">{t('readdToken')}</div>
      <Box
        className="flex w-full"
        justifyContent={BoxJustifyContent.Center}
        alignItems={BoxAlignItems.Center}
        gap={4}
        marginTop={4}
      >
        <Button
          variant={ButtonVariant.Secondary}
          block
          data-testid="hide-token-confirmation__cancel"
          onClick={() => hideModal()}
        >
          {t('cancel')}
        </Button>
        <Button
          variant={ButtonVariant.Primary}
          block
          data-testid="hide-token-confirmation__hide"
          onClick={() => {
            if (isNonEvmChainId(chainIdToUse)) {
              hideToken(
                address,
                undefined,
                chainIdToUse,
                getAccountForChain,
                assetsUnifyStateFeatureEnabled,
                customAssets,
              );
            } else {
              const chainConfig = networkConfigurationsByChainId[chainIdToUse];
              const { defaultRpcEndpointIndex } = chainConfig;
              const { networkClientId: networkInstanceId } =
                chainConfig.rpcEndpoints[defaultRpcEndpointIndex];
              hideToken(
                address,
                networkInstanceId,
                chainIdToUse,
                getAccountForChain,
                assetsUnifyStateFeatureEnabled,
                customAssets,
              );
            }
            navigate(DEFAULT_ROUTE);
          }}
        >
          {t('hide')}
        </Button>
      </Box>
    </div>
  );
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(HideTokenConfirmationModal);
