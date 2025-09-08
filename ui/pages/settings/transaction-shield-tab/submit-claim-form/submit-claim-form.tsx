import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  ButtonLink,
  ButtonLinkSize,
  ButtonSize,
  ButtonVariant,
  FormTextField,
  FormTextFieldSize,
  Text,
} from '../../../../components/component-library';
import {
  BlockSize,
  Display,
  FlexDirection,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import {
  Textarea,
  TextareaResize,
} from '../../../../components/component-library/textarea';
import { useSubmitClaimFormState } from './submit-claim-form-state';
import { isValidHexAddress } from '@metamask/controller-utils';

const SubmitClaimForm = () => {
  const t = useI18nContext();

  const {
    firstName,
    setFirstName,
    lastName,
    setLastName,
    email,
    setEmail,
    lossAmount,
    setLossAmount,
    impactedWalletAddress,
    setImpactedWalletAddress,
    impactedTxHash,
    setImpactedTxHash,
    reimbursementWalletAddress,
    setReimbursementWalletAddress,
    description,
    setDescription,
  } = useSubmitClaimFormState();

  const [errors, setErrors] = useState<
    Record<string, { key: string; msg: string } | undefined>
  >({});

  const validateAndSetEmail = useCallback((value: string) => {
    const isEmailValid = value.match(/^([\w.%+-]+)@([\w-]+\.)+([\w]{2,})$/i);
    setErrors((state) => ({
      ...state,
      email: isEmailValid
        ? undefined
        : { key: 'email', msg: t('shieldClaimInvalidEmail') },
    }));
    setEmail(value);
  }, []);

  const validateAndSetImpactedWalletAddress = useCallback((value: string) => {
    const isImpactedWalletAddressValid = isValidHexAddress(value);
    setErrors((state) => ({
      ...state,
      impactedWalletAddress: isImpactedWalletAddressValid
        ? undefined
        : {
            key: 'impactedWalletAddress',
            msg: t('shieldClaimInvalidImpactedWalletAddress'),
          },
    }));
    setImpactedWalletAddress(value);
  }, []);

  const validateAndSetReimbursementWalletAddress = useCallback(
    (value: string) => {
      const isReimbursementWalletAddressValid = isValidHexAddress(value);
      setErrors((state) => ({
        ...state,
        reimbursementWalletAddress: isReimbursementWalletAddressValid
          ? undefined
          : {
              key: 'reimbursementWalletAddress',
              msg: t('shieldClaimInvalidReimbursementWalletAddress'),
            },
      }));
      setReimbursementWalletAddress(value);
    },
    [],
  );

  const isInvalidData = useMemo(() => {
    return (
      Object.values(errors).some((error) => error !== undefined) ||
      !firstName ||
      !lastName ||
      !email ||
      !lossAmount ||
      !impactedWalletAddress ||
      !impactedTxHash ||
      !reimbursementWalletAddress ||
      !description
    );
  }, [
    errors,
    firstName,
    lastName,
    email,
    lossAmount,
    impactedWalletAddress,
    impactedTxHash,
    reimbursementWalletAddress,
    description,
  ]);

  return (
    <Box
      className="submit-claim-page"
      data-testid="submit-claim-page"
      width={BlockSize.Full}
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      padding={4}
      gap={4}
    >
      <Text variant={TextVariant.bodyMdMedium}>
        {t('shieldClaimDetails', [
          <ButtonLink
            key="here-link"
            size={ButtonLinkSize.Inherit}
            externalLink
            href="#"
          >
            {t('here')}
          </ButtonLink>,
        ])}
      </Text>
      <Box display={Display.Flex} gap={4} width={BlockSize.Full}>
        <FormTextField
          label={`${t('shieldClaimFirstName')}*`}
          placeholder={t('shieldClaimFirstNamePlaceholder')}
          id="first-name"
          name="first-name"
          size={FormTextFieldSize.Lg}
          onChange={(e) => setFirstName(e.target.value)}
          value={firstName}
          required
          width={BlockSize.Full}
        />
        <FormTextField
          label={`${t('shieldClaimLastName')}*`}
          placeholder={t('shieldClaimLastNamePlaceholder')}
          id="last-name"
          name="last-name"
          size={FormTextFieldSize.Lg}
          onChange={(e) => setLastName(e.target.value)}
          value={lastName}
          required
          width={BlockSize.Full}
        />
      </Box>
      <FormTextField
        label={`${t('shieldClaimEmail')}*`}
        placeholder="johncarpenter@sample.com"
        inputProps={{ 'data-testid': 'shield-claim-email-input' }}
        helpText={
          errors.email ? errors.email.msg : t('shieldClaimEmailHelpText')
        }
        helpTextProps={{ 'data-testid': 'shield-claim-help-text' }}
        id="email"
        name="email"
        size={FormTextFieldSize.Lg}
        onChange={(e) => validateAndSetEmail(e.target.value)}
        value={email}
        error={Boolean(errors.email)}
        required
        width={BlockSize.Full}
      />
      <FormTextField
        label={`${t('shieldClaimLossAmount')}*`}
        placeholder="$10,000 USDT"
        helpText={t('shieldClaimLossAmountHelpText')}
        id="loss-amount"
        name="loss-amount"
        size={FormTextFieldSize.Lg}
        onChange={(e) => setLossAmount(e.target.value)}
        value={lossAmount}
        required
        width={BlockSize.Full}
      />
      <FormTextField
        label={`${t('shieldClaimImpactedWalletAddress')}*`}
        placeholder={'e.g. 0x71C...B5f6d'}
        inputProps={{
          'data-testid': 'shield-claim-impacted-wallet-address-input',
        }}
        helpTextProps={{
          'data-testid': 'shield-claim-impacted-wallet-address-help-text',
        }}
        helpText={
          errors.impactedWalletAddress
            ? errors.impactedWalletAddress.msg
            : undefined
        }
        id="impacted-wallet-address"
        name="impacted-wallet-address"
        size={FormTextFieldSize.Lg}
        onChange={(e) => validateAndSetImpactedWalletAddress(e.target.value)}
        value={impactedWalletAddress}
        error={Boolean(errors.impactedWalletAddress)}
        required
        width={BlockSize.Full}
      />
      <FormTextField
        label={`${t('shieldClaimImpactedTxHash')}*`}
        placeholder={'e.g. a1084235686add...q46q8wurgw'}
        helpText={
          <Text variant={TextVariant.inherit}>
            {t('shieldClaimImpactedTxHashHelpText')}{' '}
            <ButtonLink size={ButtonLinkSize.Inherit} externalLink href="#">
              {t('shieldClaimImpactedTxHashHelpTextLink')}
            </ButtonLink>
          </Text>
        }
        id="impacted-tx-hash"
        name="impacted-tx-hash"
        size={FormTextFieldSize.Lg}
        onChange={(e) => setImpactedTxHash(e.target.value)}
        value={impactedTxHash}
        required
        width={BlockSize.Full}
      />
      <FormTextField
        label={`${t('shieldClaimReimbursementWalletAddress')}*`}
        placeholder={'e.g. 0x71C...B5f6d'}
        inputProps={{
          'data-testid': 'shield-claim-reimbursement-wallet-address-input',
        }}
        helpTextProps={{
          'data-testid': 'shield-claim-reimbursement-wallet-address-help-text',
        }}
        helpText={
          errors.reimbursementWalletAddress
            ? errors.reimbursementWalletAddress.msg
            : t('shieldClaimReimbursementWalletAddressHelpText')
        }
        id="reimbursement-wallet-address"
        name="reimbursement-wallet-address"
        size={FormTextFieldSize.Lg}
        onChange={(e) =>
          validateAndSetReimbursementWalletAddress(e.target.value)
        }
        value={reimbursementWalletAddress}
        error={Boolean(errors.reimbursementWalletAddress)}
        required
        width={BlockSize.Full}
      />
      <Box>
        <Text variant={TextVariant.bodyMdMedium} marginBottom={2}>
          {`${t('shieldClaimDescription')}*`}
        </Text>
        <Textarea
          placeholder={t('shieldClaimDescriptionPlaceholder')}
          id="description"
          name="description"
          onChange={(e) => setDescription(e.target.value)}
          value={description}
          width={BlockSize.Full}
          rows={4}
          resize={TextareaResize.Vertical}
        />
      </Box>
      <Button
        data-testid="shield-claim-submit-button"
        variant={ButtonVariant.Primary}
        size={ButtonSize.Lg}
        disabled={isInvalidData}
      >
        {t('shieldClaimSubmit')}
      </Button>
    </Box>
  );
};

export default SubmitClaimForm;
