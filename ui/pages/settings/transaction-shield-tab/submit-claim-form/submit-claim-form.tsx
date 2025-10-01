import React, { useCallback, useMemo, useState } from 'react';
import { isValidHexAddress } from '@metamask/controller-utils';
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
  BorderRadius,
  Display,
  FlexDirection,
  TextColor,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import {
  Textarea,
  TextareaResize,
} from '../../../../components/component-library/textarea';
import { FileUploader } from '../../../../components/component-library/components-temp/file-uploader';
import { useSubmitClaimFormState } from './submit-claim-form-state';

const SubmitClaimForm = () => {
  const t = useI18nContext();

  const {
    firstName,
    setFirstName,
    lastName,
    setLastName,
    email,
    setEmail,
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

  const validateEmail = useCallback(() => {
    const isEmailValid = email.match(/^([\w.%+-]+)@([\w-]+\.)+([\w]{2,})$/iu);
    setErrors((state) => ({
      ...state,
      email: isEmailValid
        ? undefined
        : { key: 'email', msg: t('shieldClaimInvalidEmail') },
    }));
  }, [t, email]);

  const validateImpactedWalletAddress = useCallback(() => {
    const isImpactedWalletAddressValid = isValidHexAddress(
      impactedWalletAddress,
    );
    setErrors((state) => ({
      ...state,
      impactedWalletAddress: isImpactedWalletAddressValid
        ? undefined
        : {
            key: 'impactedWalletAddress',
            msg: t('shieldClaimInvalidWalletAddress'),
          },
    }));
  }, [impactedWalletAddress, t]);

  const validateReimbursementWalletAddress = useCallback(() => {
    const isReimbursementWalletAddressValid = isValidHexAddress(
      reimbursementWalletAddress,
    );
    setErrors((state) => ({
      ...state,
      reimbursementWalletAddress: isReimbursementWalletAddressValid
        ? undefined
        : {
            key: 'reimbursementWalletAddress',
            msg: t('shieldClaimInvalidWalletAddress'),
          },
    }));
  }, [reimbursementWalletAddress, t]);

  const isInvalidData = useMemo(() => {
    return (
      Object.values(errors).some((error) => error !== undefined) ||
      !firstName ||
      !lastName ||
      !email ||
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
        helpTextProps={{
          'data-testid': 'shield-claim-help-text',
          color: TextColor.textAlternativeSoft,
        }}
        id="email"
        name="email"
        size={FormTextFieldSize.Lg}
        onChange={(e) => setEmail(e.target.value)}
        onBlur={() => validateEmail()}
        value={email}
        error={Boolean(errors.email)}
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
          color: TextColor.textAlternativeSoft,
        }}
        helpText={
          errors.impactedWalletAddress
            ? errors.impactedWalletAddress.msg
            : undefined
        }
        id="impacted-wallet-address"
        name="impacted-wallet-address"
        size={FormTextFieldSize.Lg}
        onChange={(e) => setImpactedWalletAddress(e.target.value)}
        onBlur={() => validateImpactedWalletAddress()}
        value={impactedWalletAddress}
        error={Boolean(errors.impactedWalletAddress)}
        required
        width={BlockSize.Full}
      />
      <FormTextField
        label={`${t('shieldClaimImpactedTxHash')}*`}
        placeholder={'e.g. a1084235686add...q46q8wurgw'}
        helpText={
          <Text
            variant={TextVariant.inherit}
            color={TextColor.textAlternativeSoft}
          >
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
          color: TextColor.textAlternativeSoft,
        }}
        helpText={
          errors.reimbursementWalletAddress
            ? errors.reimbursementWalletAddress.msg
            : t('shieldClaimReimbursementWalletAddressHelpText')
        }
        id="reimbursement-wallet-address"
        name="reimbursement-wallet-address"
        size={FormTextFieldSize.Lg}
        onChange={(e) => setReimbursementWalletAddress(e.target.value)}
        onBlur={() => validateReimbursementWalletAddress()}
        value={reimbursementWalletAddress}
        error={Boolean(errors.reimbursementWalletAddress)}
        required
        width={BlockSize.Full}
      />
      <Box display={Display.Flex} flexDirection={FlexDirection.Column} gap={2}>
        <Text variant={TextVariant.bodyMdMedium}>
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
          borderRadius={BorderRadius.LG}
          paddingTop={3}
          paddingBottom={3}
        />
      </Box>
      <FileUploader
        id="upload-images-file-uploader"
        label={t('shieldClaimFileUploader')}
        acceptText={t('shieldClaimFileUploaderMaxFileSize')}
        helpText={t('shieldClaimFileUploaderHelpText')}
        helpTextProps={{
          'data-testid': 'shield-claim-file-uploader-help-text',
          color: TextColor.textAlternativeSoft,
        }}
        maxFileSize={5 * 1024 * 1024}
        filesProps={{
          className: 'settings-page__content-item-col',
        }}
        accept={['application/pdf', 'image/png', 'image/jpg'].join(',')}
        onChange={(files) => {
          console.log('check: onChange', files);
        }}
      />
      <Box className="settings-page__content-item-col">
        <Button
          data-testid="shield-claim-submit-button"
          variant={ButtonVariant.Primary}
          size={ButtonSize.Lg}
          disabled={isInvalidData}
        >
          {t('shieldClaimSubmit')}
        </Button>
      </Box>
    </Box>
  );
};

export default SubmitClaimForm;
