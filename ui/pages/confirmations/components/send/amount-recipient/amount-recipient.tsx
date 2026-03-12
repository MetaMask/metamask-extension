import React, { useCallback, useState } from 'react';

import {
  Box,
  Button,
  ButtonSize,
  BoxFlexDirection,
  BoxJustifyContent,
} from '@metamask/design-system-react';
import LoadingScreen from '../../../../../components/ui/loading-screen';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { Asset } from '../../../types/send';
import { useAmountSelectionMetrics } from '../../../hooks/send/metrics/useAmountSelectionMetrics';
import { useSendActions } from '../../../hooks/send/useSendActions';
import { useSendContext } from '../../../context/send';
import { useRecipientValidation } from '../../../hooks/send/useRecipientValidation';
import { useRecipientSelectionMetrics } from '../../../hooks/send/metrics/useRecipientSelectionMetrics';
import { useAmountValidation } from '../../../hooks/send/useAmountValidation';
import { useSendType } from '../../../hooks/send/useSendType';
import { SendHero } from '../../UI/send-hero';
import { Amount } from '../amount/amount';
import { Recipient } from '../recipient';
import { HexData } from '../hex-data';
import { SendAlertModal } from '../send-alert-modal';

export const AmountRecipient = () => {
  const t = useI18nContext();
  const [hexDataError, setHexDataError] = useState<string>();
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const { asset, toResolved, nonEVMSubmitError } = useSendContext();
  const { amountError, validateNonEvmAmountAsync } = useAmountValidation();
  const { isNonEvmSendType } = useSendType();
  const { handleSubmit } = useSendActions();
  const { captureAmountSelected } = useAmountSelectionMetrics();
  const { captureRecipientSelected } = useRecipientSelectionMetrics();
  const recipientValidationResult = useRecipientValidation();

  const { recipientErrorAllowAcknowledge, acknowledgeError } =
    recipientValidationResult;

  const hasBlockingError =
    Boolean(amountError) ||
    (Boolean(recipientValidationResult.recipientError) &&
      !recipientErrorAllowAcknowledge) ||
    Boolean(hexDataError) ||
    Boolean(nonEVMSubmitError);
  const isDisabled = hasBlockingError || !toResolved;

  const [shouldSubmitOnAcknowledge, setShouldSubmitOnAcknowledge] =
    useState(false);

  const openAlertModal = useCallback(() => {
    setShouldSubmitOnAcknowledge(false);
    setIsAlertModalOpen(true);
  }, []);

  const handleAlertModalClose = useCallback(() => {
    setIsAlertModalOpen(false);
  }, []);

  const proceedWithSubmit = useCallback(async () => {
    if (isNonEvmSendType) {
      // Non EVM flows need an extra validation because "value" can be empty dependent on the blockchain (e.g it's fine for Solana but not for Bitcoin)
      // Hence we do a call for `validateNonEvmAmountAsync` here to raise UI validation errors if exists
      const nonEvmAmountError = await validateNonEvmAmountAsync();
      if (nonEvmAmountError) {
        return;
      }
    }
    handleSubmit();
    captureAmountSelected();
    captureRecipientSelected();
  }, [
    captureAmountSelected,
    captureRecipientSelected,
    handleSubmit,
    isNonEvmSendType,
    validateNonEvmAmountAsync,
  ]);

  const handleAlertModalAcknowledge = useCallback(async () => {
    setIsAlertModalOpen(false);
    acknowledgeError();
    if (shouldSubmitOnAcknowledge) {
      await proceedWithSubmit();
    }
  }, [acknowledgeError, shouldSubmitOnAcknowledge, proceedWithSubmit]);

  const onClick = useCallback(async () => {
    if (recipientErrorAllowAcknowledge) {
      setShouldSubmitOnAcknowledge(true);
      setIsAlertModalOpen(true);
      return;
    }
    await proceedWithSubmit();
  }, [recipientErrorAllowAcknowledge, proceedWithSubmit]);

  if (!asset) {
    return <LoadingScreen />;
  }

  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      justifyContent={BoxJustifyContent.Between}
      padding={4}
      className="flex-1 h-full"
    >
      <Box>
        <SendHero asset={asset as Asset} />
        <Recipient
          recipientValidationResult={recipientValidationResult}
          onAlertIconClick={openAlertModal}
        />
        <Amount amountError={amountError} />
        <HexData setHexDataError={setHexDataError} />
      </Box>
      <Button
        data-testid="send-continue-button"
        disabled={isDisabled}
        onClick={onClick}
        size={ButtonSize.Lg}
        className={`mb-4 ${hasBlockingError ? 'bg-error-default' : ''}`}
      >
        {amountError ?? hexDataError ?? nonEVMSubmitError ?? t('continue')}
      </Button>
      <SendAlertModal
        isOpen={isAlertModalOpen}
        title={t('smartContractAddress')}
        errorMessage={t('smartContractAddressWarning')}
        onAcknowledge={handleAlertModalAcknowledge}
        onClose={handleAlertModalClose}
      />
    </Box>
  );
};
