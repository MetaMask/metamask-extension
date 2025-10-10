import React, { useCallback, useMemo, useState } from 'react';
import { isValidHexAddress } from '@metamask/controller-utils';
import FileInput from 'react-simple-file-input';
import { isStrictHexString } from '@metamask/utils';
import {
  Box,
  BoxBackgroundColor,
  Button,
  ButtonIcon,
  ButtonIconSize,
  ButtonSize,
  ButtonVariant,
  FontWeight,
  Icon,
  IconColor,
  IconName,
  IconSize,
  Text,
  TextButton,
  TextButtonSize,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import {
  Textarea,
  TextareaResize,
} from '../../../../components/component-library/textarea';
import {
  FormTextField,
  FormTextFieldSize,
} from '../../../../components/component-library';
import {
  BlockSize,
  BorderRadius,
  TextColor as DsTextColor,
} from '../../../../helpers/constants/design-system';
import { useClaimState } from '../../../../hooks/claims/useClaimState';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import { isValidEmail } from '../../../../../app/scripts/lib/util';

const MAX_FILE_SIZE = 5 * 1024 * 1024;

function isValidTransactionHash(hash: string): boolean {
  // Check if it's exactly 66 characters (0x + 64 hex chars)
  return hash.length === 66 && isStrictHexString(hash);
}

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
  } = useClaimState();

  const [errors, setErrors] = useState<
    Record<string, { key: string; msg: string } | undefined>
  >({});

  const validateEmail = useCallback(() => {
    const isEmailValid = isValidEmail(email);
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

  const validateImpactedTxHash = useCallback(() => {
    const isImpactedTxHashValid = isValidTransactionHash(impactedTxHash);

    setErrors((state) => ({
      ...state,
      impactedTxHash: isImpactedTxHashValid
        ? undefined
        : { key: 'impactedTxHash', msg: t('shieldClaimInvalidTxHash') },
    }));
  }, [impactedTxHash, t]);

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
      className="submit-claim-page flex flex-col"
      data-testid="submit-claim-page"
      padding={4}
      gap={4}
    >
      <Text variant={TextVariant.BodyMd} fontWeight={FontWeight.Medium}>
        {t('shieldClaimDetails', [
          <TextButton key="here-link" className="min-w-0" asChild>
            <a href="#">{t('here')}</a>
          </TextButton>,
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
          color: DsTextColor.textAlternative,
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
          color: DsTextColor.textAlternative,
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
          errors.impactedTxHash ? (
            errors.impactedTxHash?.msg
          ) : (
            <Text
              variant={TextVariant.BodySm}
              color={TextColor.TextAlternative}
            >
              {t('shieldClaimImpactedTxHashHelpText')}{' '}
              <TextButton
                size={TextButtonSize.BodySm}
                className="min-w-0"
                asChild
              >
                <a href="#">{t('shieldClaimImpactedTxHashHelpTextLink')}</a>
              </TextButton>
            </Text>
          )
        }
        id="impacted-tx-hash"
        name="impacted-tx-hash"
        size={FormTextFieldSize.Lg}
        onChange={(e) => setImpactedTxHash(e.target.value)}
        onBlur={() => validateImpactedTxHash()}
        value={impactedTxHash}
        error={Boolean(errors.impactedTxHash)}
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
          color: DsTextColor.textAlternative,
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
      <Box gap={2}>
        <Text variant={TextVariant.BodyMd} fontWeight={FontWeight.Medium}>
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
        <Text
          variant={TextVariant.BodyMd}
          fontWeight={FontWeight.Medium}
          className="mb-1"
        >
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
          variant={TextVariant.BodySm}
          color={
            errors.files ? TextColor.ErrorDefault : TextColor.TextAlternative
          }
          className="mt-0.5"
        >
          {errors.files
            ? errors.files.msg
            : t('shieldClaimFileUploaderHelpText')}
        </Text>

        {files && (
          <Box
            gap={2}
            marginTop={4}
            className="settings-page__content-item-col"
          >
            {Array.from(files).map((file) => (
              <Box
                key={file.name}
                className="flex items-center rounded-lg py-1 px-2"
                backgroundColor={BoxBackgroundColor.BackgroundSection}
              >
                <Icon
                  name={
                    file.type.includes('image') ? IconName.Image : IconName.File
                  }
                  size={IconSize.Lg}
                  color={IconColor.IconDefault}
                  className="mr-2"
                />
                <Text
                  variant={TextVariant.BodySm}
                  color={TextColor.TextDefault}
                >
                  {file.name}
                </Text>
                <ButtonIcon
                  iconName={IconName.Close}
                  size={ButtonIconSize.Sm}
                  color={IconColor.IconDefault}
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
                  className="ml-auto"
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
