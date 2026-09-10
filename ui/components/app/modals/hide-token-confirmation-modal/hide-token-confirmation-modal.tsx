import React from 'react';
import { connect } from 'react-redux';
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
import { toAssetId } from '../../../../../shared/lib/asset-utils';

type HideToken = {
  assetId?: string;
  symbol?: string;
  address: string;
  image?: string;
  chainId?: string;
};

type HideTokenConfirmationModalProps = {
  token: HideToken;
  hideToken: (address: string, chainId?: string) => void;
  hideModal: () => void;
  navigate: (path: string) => void;
};

function mapStateToProps(state: MetaMaskReduxState) {
  const modalProps = state.appState.modal.modalState.props as {
    token: HideToken;
    navigate: (path: string) => void;
  };

  return {
    token: modalProps.token,
    navigate: modalProps.navigate,
  };
}

function mapDispatchToProps(dispatch: MetaMaskReduxDispatch) {
  return {
    hideModal: () => dispatch(actions.hideModal()),
    hideToken: async (addressOrAssetId: string, chainId?: string) => {
      const assetId = toAssetId(
        addressOrAssetId,
        chainId as CaipChainId | Hex | undefined,
      );

      if (assetId) {
        try {
          await dispatch(actions.hideAsset(assetId));
        } catch (error) {
          console.error('Error hiding asset:', error);
        }
      }

      dispatch(actions.hideModal());
    },
  };
}

export function HideTokenConfirmationModal({
  token,
  hideToken,
  hideModal,
  navigate,
}: HideTokenConfirmationModalProps) {
  const t = useI18nContext();
  const { symbol, address, image, chainId: tokenChainId, assetId } = token;

  // EVM uses `address` which is hex, whereas non-EVM uses `assetId` which is a CAIP.
  const assetIdToUse = assetId || address;
  const chainIdToUse = tokenChainId;

  return (
    <div className="hide-token-confirmation__container">
      <div className="hide-token-confirmation__title">
        {t('hideTokenPrompt')}
      </div>
      <AvatarToken
        className="hide-token-confirmation__identicon"
        size={AvatarTokenSize.Xl}
        name={symbol || assetIdToUse}
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
            hideToken(assetIdToUse, chainIdToUse);
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
