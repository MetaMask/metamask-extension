import React, { useCallback } from 'react';
import {
  Box,
  Icon,
  IconName,
  IconSize,
  Modal,
  ModalBody,
  ModalContent,
  ModalContentSize,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
} from '../../../../../../../components/component-library';
import {
  AlignItems,
  Display,
  FlexDirection,
  IconColor,
  JustifyContent,
  TextAlign,
  TextColor,
  TextVariant,
} from '../../../../../../../helpers/constants/design-system';
import Identicon from '../../../../../../../components/ui/identicon';
import { GasFeeToken, TransactionMeta } from '@metamask/transaction-controller';
import { useConfirmContext } from '../../../../../context/confirm';
import BigNumber from 'bignumber.js';
import { updateGasFeeToken } from '../../../../../../../store/actions';

const SYMBOL = 'USDC';
const DECIMALS = 6;

function Token({
  gasFeeToken,
  onClick,
}: {
  gasFeeToken: GasFeeToken;
  onClick?: (token: GasFeeToken) => void;
}) {
  const { amount, balance, contractAddress } = gasFeeToken;
  const balanceFormatted = new BigNumber(balance).shift(-DECIMALS).toString();
  const amountFormatted = new BigNumber(amount).shift(-DECIMALS).toString();

  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Row}
      justifyContent={JustifyContent.spaceBetween}
      onClick={() => onClick?.(gasFeeToken)}
    >
      <Box display={Display.Flex} flexDirection={FlexDirection.Row}>
        <Identicon address={contractAddress} diameter={32} />
        <Box textAlign={TextAlign.Left} marginLeft={4}>
          <Text variant={TextVariant.bodyMdBold}>{SYMBOL}</Text>
          <Text color={TextColor.textAlternative}>
            Bal: {balanceFormatted} {SYMBOL}
          </Text>
        </Box>
      </Box>
      <Box textAlign={TextAlign.Right}>
        <Text variant={TextVariant.bodyMdBold}>$1.23</Text>
        <Text color={TextColor.textAlternative}>{amountFormatted} {SYMBOL}</Text>
      </Box>
    </Box>
  );
}

export function TokenGasFeeModal({ onClose }: { onClose: () => void }) {
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const { gasFeeTokens } = currentConfirmation;
  const { id: transactionId } = currentConfirmation;

  const handleTokenClick = useCallback(
    async (token: GasFeeToken) => {
      await updateGasFeeToken(transactionId, token.contractAddress);
      onClose();
    },
    [transactionId, onClose],
  );

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      isClosedOnOutsideClick={false}
      isClosedOnEscapeKey={false}
    >
      <ModalOverlay data-testid="modal-overlay" />
      <ModalContent size={ModalContentSize.Md}>
        <ModalHeader onClose={onClose}>Select a token</ModalHeader>
        <ModalBody>
          <Text
            textAlign={TextAlign.Center}
            as="p"
            data-testid="confirmation-text"
          >
            {gasFeeTokens?.map((token) => (
              <Token
                key={token.contractAddress}
                gasFeeToken={token}
                onClick={handleTokenClick}
              />
            ))}
          </Text>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
