import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalContentSize,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
} from '@metamask/design-system-react';
import { NETWORKS_ROUTE } from '../../../../helpers/constants/routes';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import {
  getSafeNativeCurrencySymbol,
  type SafeChain,
} from '../../../multichain/networks-form/use-safe-chains';
import { setEditedNetwork } from '../../../../store/actions';
import { useDispatch } from '../../../../store/hooks';
import { type TokenWithFiatAmount } from '../types';

type NativeTokenScamWarningModalProps = {
  token: Pick<TokenWithFiatAmount, 'chainId' | 'symbol'>;
  safeChains?: SafeChain[];
  onClose: () => void;
};

/**
 * Warns that a native token's symbol doesn't match the one expected for its
 * network, and offers to fix the network.
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
      <ModalContent size={ModalContentSize.Sm}>
        <ModalHeader
          onClose={onClose}
          closeButtonProps={{ ariaLabel: t('close') }}
        >
          {t('nativeTokenScamWarningTitle')}
        </ModalHeader>
        <ModalBody className="py-4">
          {t('nativeTokenScamWarningDescription', [
            token.symbol,
            nativeCurrencySymbol ||
              t('nativeTokenScamWarningDescriptionExpectedTokenFallback'),
          ])}
        </ModalBody>
        <ModalFooter
          secondaryButtonProps={{
            children: t('nativeTokenScamWarningConversion'),
            isFullWidth: true,
            onClick: () => {
              dispatch(setEditedNetwork({ chainId: token.chainId }));
              navigate(NETWORKS_ROUTE);
            },
          }}
        />
      </ModalContent>
    </Modal>
  );
};
