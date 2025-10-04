import React, { useCallback, useMemo, useState } from 'react';
import { isValidHexAddress } from '@metamask/controller-utils';
import FileInput from 'react-simple-file-input';
import {
  Box,
  Button,
  ButtonIcon,
  ButtonIconSize,
  ButtonLink,
  ButtonLinkSize,
  ButtonSize,
  ButtonVariant,
  FormTextField,
  FormTextFieldSize,
  Icon,
  IconName,
  IconSize,
  Text,
} from '../../../../components/component-library';
import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  BorderRadius,
  Display,
  FlexDirection,
  IconColor,
  TextColor,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import {
  Textarea,
  TextareaResize,
} from '../../../../components/component-library/textarea';
import { useSubmitClaimFormState } from './submit-claim-form-state';

const MAX_FILE_SIZE = 1 * 1024 * 1024;

const SubmitClaimForm = () => {
  const t = useI18nContext();

  const {
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
    files,
    setFiles,
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
      !email ||
      !impactedWalletAddress ||
      !impactedTxHash ||
      !reimbursementWalletAddress ||
      !description
    );
  }, [
    errors,
    email,
    impactedWalletAddress,
    impactedTxHash,
    reimbursementWalletAddress,
    description,
  ]);

  const addFile = useCallback(
    (newFiles: FileList) => {
      setErrors((state) => ({
        ...state,
        files: undefined,
      }));

      const dt = new DataTransfer();
      // filter out files exceeding 5MB
      Array.from(newFiles).forEach((file) => {
        if (file.size <= MAX_FILE_SIZE) {
          dt.items.add(file);
        } else {
          setErrors((state) => ({
            ...state,
            files: {
              key: 'files',
              msg: t('fileUploaderMaxFileSizeError', [1]),
            },
          }));
        }
      });

      // save file to state
      setFiles(dt.files);
    },
    [setFiles, t],
  );

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
      <Box>
        <Text variant={TextVariant.bodyMdMedium} marginBottom={2}>
          {t('shieldClaimFileUploader')}
        </Text>
        <FileInput
          id="upload-images-file-uploader"
          data-testid="upload-images-file-uploader"
          multiple
          onChange={(inputFiles) => addFile(inputFiles)}
          accept={['application/pdf', 'image/png', 'image/jpeg'].join(',')}
          value={''}
          style={{ color: 'transparent' }}
        />
        <Text
          variant={TextVariant.bodySm}
          color={
            errors.files
              ? TextColor.errorDefault
              : TextColor.textAlternativeSoft
          }
          marginTop={1}
        >
          {errors.files
            ? errors.files.msg
            : t('shieldClaimFileUploaderHelpText')}
        </Text>

        {files && (
          <Box
            display={Display.Flex}
            flexDirection={FlexDirection.Column}
            gap={2}
            marginTop={4}
            className="settings-page__content-item-col"
          >
            {Array.from(files).map((file) => (
              <Box
                key={file.name}
                display={Display.Flex}
                alignItems={AlignItems.center}
                flexDirection={FlexDirection.Row}
                borderRadius={BorderRadius.LG}
                backgroundColor={BackgroundColor.backgroundSection}
                paddingTop={2}
                paddingBottom={2}
                paddingInline={4}
              >
                <Icon
                  name={
                    file.type.includes('image') ? IconName.Image : IconName.File
                  }
                  size={IconSize.Md}
                  color={IconColor.iconAlternative}
                  marginRight={2}
                />
                <Text
                  variant={TextVariant.bodySm}
                  color={TextColor.textAlternative}
                >
                  {file.name}
                </Text>
                <ButtonIcon
                  iconName={IconName.Close}
                  size={ButtonIconSize.Sm}
                  color={IconColor.iconAlternative}
                  ariaLabel={t('delete')}
                  onClick={() => {
                    setFiles(
                      (() => {
                        setErrors((state) => ({
                          ...state,
                          files: undefined,
                        }));

                        const dt = new DataTransfer();
                        Array.from(files)
                          .filter((f) => f.name !== file.name)
                          .forEach((f) => dt.items.add(f));
                        return dt.files;
                      })(),
                    );
                  }}
                  marginLeft="auto"
                />
              </Box>
            ))}
          </Box>
        )}
      </Box>
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
