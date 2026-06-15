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
import { useAddressPoisoningDetection } from '../../../hooks/send/useAddressPoisoningDetection';
import { useSendType } from '../../../hooks/send/useSendType';
import { useUnreliableNetworkRpc } from '../../../hooks/send/useUnreliableNetworkRpc';
import { SendHero } from '../../UI/send-hero';
import { Amount } from '../amount/amount';
import { Recipient } from '../recipient';
import { HexData } from '../hex-data';
import { SendAlerts } from '../send-alerts';

export const AmountRecipient = () => {
  const t = useI18nContext();
  const [hexDataError, setHexDataError] = useState<string>();
  const [isSmartContractAlertOpen, setIsSmartContractAlertOpen] =
    useState(false);
  const [shouldSubmitOnAcknowledge, setShouldSubmitOnAcknowledge] =
    useState(false);
  const { asset, to, toResolved, nonEVMSubmitError } = useSendContext();
  const { amountError, validateNonEvmAmountAsync } = useAmountValidation();
  const { isNonEvmSendType } = useSendType();
  const { handleSubmit } = useSendActions();
  const { captureAmountSelected } = useAmountSelectionMetrics();
  const { captureRecipientSelected } = useRecipientSelectionMetrics();
  const recipientValidationResult = useRecipientValidation();
  const { isUnreliable: isNetworkUnreliable } = useUnreliableNetworkRpc();

  const { recipientErrorAllowAcknowledge, acknowledgeError } =
    recipientValidationResult;
  const recipientHasHardError =
    Boolean(recipientValidationResult.recipientError) &&
    !recipientErrorAllowAcknowledge;
  const recipientCandidateAddress =
    to && to === recipientValidationResult.toAddressValidated
      ? toResolved
      : undefined;
  const addressPoisoningDetectionResult = useAddressPoisoningDetection(
    recipientHasHardError ? undefined : recipientCandidateAddress,
  );

  const hasBlockingError =
    Boolean(amountError) ||
    recipientHasHardError ||
    Boolean(hexDataError) ||
    Boolean(nonEVMSubmitError) ||
    addressPoisoningDetectionResult.pending;
  const isDisabled = hasBlockingError || !toResolved || isNetworkUnreliable;

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

  const openSmartContractAlert = useCallback(() => {
    setShouldSubmitOnAcknowledge(false);
    setIsSmartContractAlertOpen(true);
  }, []);

  const handleSmartContractClose = useCallback(() => {
    setIsSmartContractAlertOpen(false);
  }, []);

  const handleSmartContractAcknowledge = useCallback(async () => {
    setIsSmartContractAlertOpen(false);
    acknowledgeError();
    if (shouldSubmitOnAcknowledge) {
      await proceedWithSubmit();
    }
  }, [acknowledgeError, shouldSubmitOnAcknowledge, proceedWithSubmit]);

  const onClick = useCallback(async () => {
    if (recipientErrorAllowAcknowledge) {
      setShouldSubmitOnAcknowledge(true);
      setIsSmartContractAlertOpen(true);
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
          addressPoisoningDetectionResult={addressPoisoningDetectionResult}
          recipientCandidateAddress={recipientCandidateAddress}
          recipientValidationResult={recipientValidationResult}
          onAlertIconClick={openSmartContractAlert}
        />
        <Amount amountError={amountError} />
        <HexData setHexDataError={setHexDataError} />
      </Box>
      <Button
        data-testid="send-continue-button"
        disabled={isDisabled}
        onClick={onClick}
        size={ButtonSize.Lg}
        className={`mb-4 min-h-12 ${hasBlockingError ? 'bg-error-default' : ''}`}
      >
        {amountError ?? hexDataError ?? nonEVMSubmitError ?? t('continue')}
      </Button>
      <SendAlerts
        isSmartContractAlertOpen={isSmartContractAlertOpen}
        onSmartContractClose={handleSmartContractClose}
        onSmartContractAcknowledge={handleSmartContractAcknowledge}
      />
    </Box>
  );
};
