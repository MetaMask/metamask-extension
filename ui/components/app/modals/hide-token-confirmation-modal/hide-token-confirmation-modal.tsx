import React from 'react';
import type { CaipChainId, Hex } from '@metamask/utils';
import {
  AvatarToken,
  AvatarTokenSize,
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
  ButtonSize,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  TextAlign,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import * as actions from '../../../../store/actions';
import { useDispatch } from '../../../../store/hooks';
import { DEFAULT_ROUTE } from '../../../../helpers/constants/routes';
import { toAssetId } from '../../../../../shared/lib/asset-utils';

export type HideToken = {
  assetId?: string;
  symbol?: string;
  address: string;
  image?: string;
  chainId?: string;
};

type HideTokenConfirmationModalProps = {
  token: HideToken;
  isOpen: boolean;
  onClose: () => void;
  navigate: (path: string) => void;
};

export function HideTokenConfirmationModal({
  token,
  isOpen,
  onClose,
  navigate,
}: HideTokenConfirmationModalProps) {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const { symbol, address, image, chainId: tokenChainId, assetId } = token;

  // EVM uses `address` which is hex, whereas non-EVM uses `assetId` which is a CAIP.
  const assetIdToUse = assetId || address;

  const handleHideToken = async () => {
    const normalizedAssetId = toAssetId(
      assetIdToUse,
      tokenChainId as CaipChainId | Hex | undefined,
    );

    if (normalizedAssetId) {
      try {
        await dispatch(actions.hideAsset(normalizedAssetId));
      } catch (error) {
        console.error('Error hiding asset:', error);
      }
    }

    onClose();
    navigate(DEFAULT_ROUTE);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      data-testid="hide-token-confirmation-modal"
    >
      <ModalOverlay />
      <ModalContent className="items-center">
        <ModalHeader>{t('hideTokenPrompt')}</ModalHeader>
        <ModalBody>
          <Box
            flexDirection={BoxFlexDirection.Column}
            justifyContent={BoxJustifyContent.Center}
            alignItems={BoxAlignItems.Center}
            gap={2}
          >
            <AvatarToken
              size={AvatarTokenSize.Xl}
              name={symbol || assetIdToUse}
              src={image}
            />
            <Text
              variant={TextVariant.BodyMd}
              color={TextColor.TextAlternative}
              textAlign={TextAlign.Center}
            >
              {symbol}
            </Text>
            <Text
              variant={TextVariant.BodyMd}
              color={TextColor.TextAlternative}
              textAlign={TextAlign.Center}
            >
              {t('readdToken')}
            </Text>
          </Box>
        </ModalBody>
        <ModalFooter
          secondaryButtonProps={{
            children: t('cancel'),
            'data-testid': 'hide-token-confirmation__cancel',
            onClick: onClose,
            size: ButtonSize.Lg,
          }}
          primaryButtonProps={{
            children: t('hide'),
            'data-testid': 'hide-token-confirmation__hide',
            onClick: handleHideToken,
            size: ButtonSize.Lg,
          }}
        />
      </ModalContent>
    </Modal>
  );
}

export default HideTokenConfirmationModal;
