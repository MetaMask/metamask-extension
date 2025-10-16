import React, { useCallback, useMemo, useState } from 'react';
import { isValidHexAddress } from '@metamask/controller-utils';
import { isStrictHexString } from '@metamask/utils';
import {
  Box,
  Button,
  ButtonSize,
  ButtonVariant,
  FontWeight,
  Text,
  TextButton,
  TextButtonSize,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom-v5-compat';
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
import { submitShieldClaim } from '../../../../store/actions';
import LoadingScreen from '../../../../components/ui/loading-screen';
import { setShowClaimSubmitToast } from '../../../../components/app/toast-master/utils';
import { ClaimSubmitToastType } from '../../../../../shared/constants/app-state';
import { TRANSACTION_SHIELD_ROUTE } from '../../../../helpers/constants/routes';
import { FileUploader } from '../../../../components/component-library/file-uploader';

const MAX_FILE_SIZE = 5 * 1024 * 1024;

function isValidTransactionHash(hash: string): boolean {
  // Check if it's exactly 66 characters (0x + 64 hex chars)
  return hash.length === 66 && isStrictHexString(hash);
}

const SubmitClaimForm = () => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [claimSubmitLoading, setClaimSubmitLoading] = useState(false);

  const {
    email,
    setEmail,
    impactedWalletAddress,
    setImpactedWalletAddress,
    impactedTransactionHash,
    setImpactedTransactionHash,
    reimbursementWalletAddress,
    setReimbursementWalletAddress,
    caseDescription,
    setCaseDescription,
    files,
    setFiles,
  } = useClaimState();

  const [errors, setErrors] = useState<
    Record<string, { key: string; msg: string } | undefined>
  >({});

  const validateEmail = useCallback(() => {
    if (email) {
      const isEmailValid = isValidEmail(email);
      setErrors((state) => ({
        ...state,
        email: isEmailValid
          ? undefined
          : { key: 'email', msg: t('shieldClaimInvalidEmail') },
      }));
    } else {
      setErrors((state) => ({
        ...state,
        email: { key: 'email', msg: t('shieldClaimInvalidRequired') },
      }));
    }
  }, [t, email]);

  const validateImpactedWalletAddress = useCallback(() => {
    if (impactedWalletAddress) {
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
    } else {
      setErrors((state) => ({
        ...state,
        impactedWalletAddress: {
          key: 'impactedWalletAddress',
          msg: t('shieldClaimInvalidRequired'),
        },
      }));
    }
  }, [impactedWalletAddress, t]);

  const validateReimbursementWalletAddress = useCallback(() => {
    if (reimbursementWalletAddress) {
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
    } else {
      setErrors((state) => ({
        ...state,
        reimbursementWalletAddress: {
          key: 'reimbursementWalletAddress',
          msg: t('shieldClaimInvalidRequired'),
        },
      }));
    }
  }, [reimbursementWalletAddress, t]);

  const isInvalidData = useMemo(() => {
    return (
      Object.values(errors).some((error) => error !== undefined) ||
      !email ||
      !impactedWalletAddress ||
      !impactedTransactionHash ||
      !reimbursementWalletAddress ||
      !caseDescription
    );
  }, [
    errors,
    email,
    impactedWalletAddress,
    impactedTransactionHash,
    reimbursementWalletAddress,
    caseDescription,
  ]);

  const validateImpactedTxHash = useCallback(() => {
    if (impactedTransactionHash) {
      const isImpactedTxHashValid = isValidTransactionHash(
        impactedTransactionHash,
      );

      setErrors((state) => ({
        ...state,
        impactedTransactionHash: isImpactedTxHashValid
          ? undefined
          : {
              key: 'impactedTransactionHash',
              msg: t('shieldClaimInvalidTxHash'),
            },
      }));
    } else {
      setErrors((state) => ({
        ...state,
        impactedTransactionHash: {
          key: 'impactedTransactionHash',
          msg: t('shieldClaimInvalidRequired'),
        },
      }));
    }
  }, [impactedTransactionHash, t]);

  const validateDescription = useCallback(() => {
    setErrors((state) => ({
      ...state,
      caseDescription: caseDescription
        ? undefined
        : { key: 'caseDescription', msg: t('shieldClaimInvalidRequired') },
    }));
  }, [caseDescription, t]);

  const handleSubmitClaim = useCallback(async () => {
    try {
      setClaimSubmitLoading(true);
      await submitShieldClaim({
        email,
        impactedWalletAddress,
        impactedTransactionHash,
        reimbursementWalletAddress,
        caseDescription,
        files,
      });
      dispatch(setShowClaimSubmitToast(ClaimSubmitToastType.Success));
      navigate(TRANSACTION_SHIELD_ROUTE);
    } catch (error) {
      const { message } = error as Error;
      dispatch(
        setShowClaimSubmitToast(
          message === ClaimSubmitToastType.Errored
            ? ClaimSubmitToastType.Errored
            : message,
        ),
      );
    } finally {
      setClaimSubmitLoading(false);
    }
  }, [
    dispatch,
    email,
    impactedTransactionHash,
    impactedWalletAddress,
    reimbursementWalletAddress,
    caseDescription,
    files,
    navigate,
  ]);

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
          errors.impactedTransactionHash ? (
            errors.impactedTransactionHash?.msg
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
        onChange={(e) => setImpactedTransactionHash(e.target.value)}
        onBlur={() => validateImpactedTxHash()}
        value={impactedTransactionHash}
        error={Boolean(errors.impactedTransactionHash)}
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
          onChange={(e) => setCaseDescription(e.target.value)}
          onBlur={() => validateDescription()}
          value={caseDescription}
          error={Boolean(errors.caseDescription)}
          width={BlockSize.Full}
          rows={4}
          resize={TextareaResize.Vertical}
          borderRadius={BorderRadius.LG}
          paddingTop={3}
          paddingBottom={3}
          maxLength={2000}
        />
        {errors.caseDescription && (
          <Text
            variant={TextVariant.BodySm}
            color={TextColor.ErrorDefault}
            className="mt-0.5"
          >
            {errors.caseDescription.msg}
          </Text>
        )}
      </Box>
      <FileUploader
        id="upload-images-file-uploader"
        data-testid="upload-images-file-uploader"
        label={t('shieldClaimFileUploader')}
        onChange={(inputFiles) => setFiles(inputFiles as FileList)}
        accept={['application/pdf', 'image/png', 'image/jpeg'].join(',')}
        acceptText={t('shieldClaimFileUploaderAcceptText')}
        helpText={t('shieldClaimFileUploaderHelpText')}
        maxFileSize={MAX_FILE_SIZE}
      />
      <Box className="settings-page__content-item-col">
        <Button
          data-testid="shield-claim-submit-button"
          variant={ButtonVariant.Primary}
          size={ButtonSize.Lg}
          disabled={isInvalidData}
          onClick={handleSubmitClaim}
        >
          {t('shieldClaimSubmit')}
        </Button>
      </Box>
      {claimSubmitLoading && <LoadingScreen />}
    </Box>
  );
};

export default SubmitClaimForm;
