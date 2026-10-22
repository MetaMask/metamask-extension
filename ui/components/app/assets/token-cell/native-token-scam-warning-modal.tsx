import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, ButtonVariant } from '@metamask/design-system-react';
import { NETWORKS_ROUTE } from '../../../../helpers/constants/routes';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import {
  getSafeNativeCurrencySymbol,
  type SafeChain,
} from '../../../multichain/networks-form/use-safe-chains';
import { setEditedNetwork } from '../../../../store/actions';
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
} from '../../../component-library';
import { useDispatch } from '../../../../store/hooks';
import { type TokenWithFiatAmount } from '../types';

type NativeTokenScamWarningModalProps = {
  token: Pick<TokenWithFiatAmount, 'chainId' | 'symbol'>;
  safeChains?: SafeChain[];
  onClose: () => void;
};

/**
 * Warns that a native token's symbol doesn't match the one expected for its
 * network, and offers to fix the network. Shared by the token list and table.
 *
 * @param props - The component props.
 * @param props.token - The native token with the unexpected symbol.
 * @param props.safeChains - Known chains, used to look up the expected symbol.
 * @param props.onClose - Called when the modal is dismissed.
 */
export const NativeTokenScamWarningModal = ({
  token,
  safeChains,
  onClose,
}: NativeTokenScamWarningModalProps) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const t = useI18nContext();
  const nativeCurrencySymbol = useMemo(
    () => getSafeNativeCurrencySymbol(safeChains, token.chainId),
    [safeChains, token.chainId],
  );

  return (
    <Modal isOpen onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader onClose={onClose}>
          {t('nativeTokenScamWarningTitle')}
        </ModalHeader>
        <ModalBody marginTop={4} marginBottom={4}>
          {t('nativeTokenScamWarningDescription', [
            token.symbol,
            nativeCurrencySymbol ||
              t('nativeTokenScamWarningDescriptionExpectedTokenFallback'),
          ])}
        </ModalBody>
        <ModalFooter>
          <Button
            variant={ButtonVariant.Secondary}
            onClick={() => {
              dispatch(setEditedNetwork({ chainId: token.chainId }));
              navigate(NETWORKS_ROUTE);
            }}
            isFullWidth
          >
            {t('nativeTokenScamWarningConversion')}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
