import React, { useCallback, useMemo, useState } from 'react';
import { isValidHexAddress } from '@metamask/controller-utils';
import { isStrictHexString } from '@metamask/utils';
import {
  Box,
  BoxBorderColor,
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
import {
  submitShieldClaim,
  setDefaultHomeActiveTabName,
} from '../../../../store/actions';
import LoadingScreen from '../../../../components/ui/loading-screen';
import { setShowClaimSubmitToast } from '../../../../components/app/toast-master/utils';
import { ClaimSubmitToastType } from '../../../../../shared/constants/app-state';
import {
  TRANSACTION_SHIELD_ROUTE,
  DEFAULT_ROUTE,
} from '../../../../helpers/constants/routes';
import { TRANSACTION_SHIELD_LINK } from '../../../../helpers/constants/common';
import { FileUploader } from '../../../../components/component-library/file-uploader';
import {
  SUBMIT_CLAIM_ERROR_CODES,
  SUBMIT_CLAIM_FIELDS,
  SubmitClaimErrorCode,
  SubmitClaimField,
} from '../types';
import { SubmitClaimError } from '../claim-error';
import AccountSelector from '../account-selector';
import NetworkSelector from '../network-selector';

const VALID_SUBMISSION_WINDOW_DAYS = 21;
const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const ERROR_MESSAGE_MAP: Partial<
  Record<
    SubmitClaimErrorCode,
    { message: string; params?: (string | number)[]; field?: SubmitClaimField }
  >
> = {
  [SUBMIT_CLAIM_ERROR_CODES.TRANSACTION_NOT_ELIGIBLE]: {
    message: 'shieldClaimImpactedTxHashNotEligible',
    field: SUBMIT_CLAIM_FIELDS.IMPACTED_TRANSACTION_HASH,
  },
  [SUBMIT_CLAIM_ERROR_CODES.SUBMISSION_WINDOW_EXPIRED]: {
    message: 'shieldClaimSubmissionWindowExpired',
    params: [VALID_SUBMISSION_WINDOW_DAYS.toString()],
  },
  [SUBMIT_CLAIM_ERROR_CODES.MAX_CLAIMS_LIMIT_EXCEEDED]: {
    message: 'shieldClaimMaxClaimsLimitExceeded',
  },
  [SUBMIT_CLAIM_ERROR_CODES.DUPLICATE_CLAIM_EXISTS]: {
    message: 'shieldClaimDuplicateClaimExists',
  },
  [SUBMIT_CLAIM_ERROR_CODES.INVALID_WALLET_ADDRESSES]: {
    message: 'shieldClaimSameWalletAddressesError',
    field: SUBMIT_CLAIM_FIELDS.REIMBURSEMENT_WALLET_ADDRESS,
  },
  [SUBMIT_CLAIM_ERROR_CODES.FILES_SIZE_EXCEEDED]: {
    message: 'shieldClaimFileErrorSizeExceeded',
  },
  [SUBMIT_CLAIM_ERROR_CODES.FILES_COUNT_EXCEEDED]: {
    message: 'shieldClaimFileErrorCountExceeded',
  },
  [SUBMIT_CLAIM_ERROR_CODES.INVALID_FILES_TYPE]: {
    message: 'shieldClaimFileErrorInvalidType',
  },
  [SUBMIT_CLAIM_ERROR_CODES.FIELD_REQUIRED]: {
    message: 'shieldClaimInvalidRequired',
  },
};

const SUBMIT_CLAIM_FIELD_ERROR_MESSAGE_MAP: Partial<
  Record<SubmitClaimField, string>
> = {
  [SUBMIT_CLAIM_FIELDS.CHAIN_ID]: 'shieldClaimInvalidChainId',
  [SUBMIT_CLAIM_FIELDS.EMAIL]: 'shieldClaimInvalidEmail',
  [SUBMIT_CLAIM_FIELDS.IMPACTED_WALLET_ADDRESS]:
    'shieldClaimInvalidWalletAddress',
  [SUBMIT_CLAIM_FIELDS.IMPACTED_TRANSACTION_HASH]: 'shieldClaimInvalidTxHash',
  [SUBMIT_CLAIM_FIELDS.REIMBURSEMENT_WALLET_ADDRESS]:
    'shieldClaimInvalidWalletAddress',
};

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
    chainId,
    setChainId,
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
    Partial<
      Record<
        SubmitClaimField,
        { key: SubmitClaimField; msg: string } | undefined
      >
    >
  >({});

  const setErrorMessage = useCallback(
    (field: SubmitClaimField, message: string | undefined) => {
      setErrors((state) => ({
        ...state,
        [field]: message ? { key: field, msg: message } : undefined,
      }));
    },
    [setErrors],
  );

  const validateEmail = useCallback(() => {
    if (email) {
      const isEmailValid = isValidEmail(email);
      setErrorMessage(
        SUBMIT_CLAIM_FIELDS.EMAIL,
        isEmailValid ? undefined : t('shieldClaimInvalidEmail'),
      );
    } else {
      setErrorMessage(
        SUBMIT_CLAIM_FIELDS.EMAIL,
        t('shieldClaimInvalidRequired'),
      );
    }
  }, [email, setErrorMessage, t]);

  const validateReimbursementEqualsImpactedWalletAddress = useCallback(
    (newImpactedWalletAddress?: string) => {
      const addressToCompare =
        newImpactedWalletAddress ?? impactedWalletAddress;

      if (!reimbursementWalletAddress || !addressToCompare) {
        setErrorMessage(
          SUBMIT_CLAIM_FIELDS.REIMBURSEMENT_WALLET_ADDRESS,
          undefined,
        );
        return;
      }

      const isReimbursementEqualsImpactedWalletAddress =
        reimbursementWalletAddress.toLowerCase() ===
        addressToCompare.toLowerCase();

      setErrorMessage(
        SUBMIT_CLAIM_FIELDS.REIMBURSEMENT_WALLET_ADDRESS,
        isReimbursementEqualsImpactedWalletAddress
          ? t('shieldClaimSameWalletAddressesError')
          : undefined,
      );
    },
    [reimbursementWalletAddress, impactedWalletAddress, setErrorMessage, t],
  );

  const validateReimbursementWalletAddress = useCallback(() => {
    if (reimbursementWalletAddress) {
      const isReimbursementWalletAddressValid = isValidHexAddress(
        reimbursementWalletAddress,
      );

      if (isReimbursementWalletAddressValid) {
        validateReimbursementEqualsImpactedWalletAddress();
      } else {
        setErrorMessage(
          SUBMIT_CLAIM_FIELDS.REIMBURSEMENT_WALLET_ADDRESS,
          t('shieldClaimInvalidWalletAddress'),
        );
      }
    } else {
      setErrorMessage(
        SUBMIT_CLAIM_FIELDS.REIMBURSEMENT_WALLET_ADDRESS,
        t('shieldClaimInvalidRequired'),
      );
    }
  }, [
    reimbursementWalletAddress,
    setErrorMessage,
    t,
    validateReimbursementEqualsImpactedWalletAddress,
  ]);

  const validateImpactedTxHash = useCallback(() => {
    if (impactedTransactionHash) {
      const isImpactedTxHashValid = isValidTransactionHash(
        impactedTransactionHash,
      );

      setErrorMessage(
        SUBMIT_CLAIM_FIELDS.IMPACTED_TRANSACTION_HASH,
        isImpactedTxHashValid ? undefined : t('shieldClaimInvalidTxHash'),
      );
    } else {
      setErrorMessage(
        SUBMIT_CLAIM_FIELDS.IMPACTED_TRANSACTION_HASH,
        t('shieldClaimInvalidRequired'),
      );
    }
  }, [impactedTransactionHash, setErrorMessage, t]);

  const validateDescription = useCallback(() => {
    setErrorMessage(
      SUBMIT_CLAIM_FIELDS.CASE_DESCRIPTION,
      caseDescription ? undefined : t('shieldClaimInvalidRequired'),
    );
  }, [caseDescription, setErrorMessage, t]);

  const isInvalidData = useMemo(() => {
    return (
      Object.values(errors).some((error) => error !== undefined) ||
      !chainId ||
      !email ||
      !impactedWalletAddress ||
      !impactedTransactionHash ||
      !reimbursementWalletAddress ||
      !caseDescription
    );
  }, [
    errors,
    chainId,
    email,
    impactedWalletAddress,
    impactedTransactionHash,
    reimbursementWalletAddress,
    caseDescription,
  ]);

  const handleSubmitClaimError = useCallback(
    (error: SubmitClaimError) => {
      const { message, data } = error;
      if (data?.errorsDetails) {
        data?.errorsDetails.forEach((detailError) => {
          let errorMessage = '';
          if (
            SUBMIT_CLAIM_ERROR_CODES.FIELD_REQUIRED === detailError.errorCode
          ) {
            // if error code is field required, set the error message for the field
            errorMessage = 'shieldClaimInvalidRequired';
          } else {
            // if error is format error get error per field
            errorMessage =
              SUBMIT_CLAIM_FIELD_ERROR_MESSAGE_MAP[detailError.field] ?? '';
          }

          if (errorMessage) {
            setErrorMessage(detailError.field, t(errorMessage));
          } else {
            // if error is not on message map, use message coming from backend
            setErrorMessage(detailError.field, detailError.error);
          }
        });
      } else {
        // if no error details, show error using toast message
        let toastMessage = '';
        if (message === ClaimSubmitToastType.Errored) {
          toastMessage = ClaimSubmitToastType.Errored;
        } else {
          const messageFromErrorMap = data
            ? ERROR_MESSAGE_MAP[data.errorCode]
            : undefined;
          toastMessage = messageFromErrorMap
            ? t(messageFromErrorMap.message, messageFromErrorMap.params)
            : message;

          // if error message has field, set error message for the field instead of showing toast message
          if (messageFromErrorMap?.field) {
            setErrorMessage(
              messageFromErrorMap.field,
              t(messageFromErrorMap.message, messageFromErrorMap.params),
            );
            return;
          }
        }
        dispatch(setShowClaimSubmitToast(toastMessage));
      }
    },
    [dispatch, setErrorMessage, t],
  );

  const handleOpenActivityTab = useCallback(async () => {
    dispatch(setDefaultHomeActiveTabName('activity'));
    navigate(DEFAULT_ROUTE);
  }, [dispatch, navigate]);

  const handleSubmitClaim = useCallback(async () => {
    if (isInvalidData) {
      return;
    }
    try {
      setClaimSubmitLoading(true);
      const chainIdNumber = Number(chainId);
      await submitShieldClaim({
        chainId: chainIdNumber.toString(),
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
      handleSubmitClaimError(error as SubmitClaimError);
    } finally {
      setClaimSubmitLoading(false);
    }
  }, [
    isInvalidData,
    chainId,
    email,
    impactedWalletAddress,
    impactedTransactionHash,
    reimbursementWalletAddress,
    caseDescription,
    files,
    dispatch,
    navigate,
    handleSubmitClaimError,
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
          VALID_SUBMISSION_WINDOW_DAYS,
          <TextButton key="here-link" className="min-w-0" asChild>
            <a
              href={TRANSACTION_SHIELD_LINK}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('here')}
            </a>
          </TextButton>,
        ])}
      </Text>

      {/* Personal details */}
      <Box>
        <Text variant={TextVariant.HeadingSm}>
          {t('shieldClaimPersonalDetails')}
        </Text>
        <Text
          variant={TextVariant.BodySm}
          color={TextColor.TextAlternative}
          className="mb-2"
        >
          {t('shieldClaimPersonalDetailsDescription')}
        </Text>
        <Box
          borderColor={BoxBorderColor.BorderMuted}
          className="w-full h-[1px] border border-b-0"
        ></Box>
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

      {/* Incident details */}
      <Box className="mt-4">
        <Text variant={TextVariant.HeadingSm}>
          {t('shieldClaimIncidentDetails')}
        </Text>
        <Text
          variant={TextVariant.BodySm}
          color={TextColor.TextAlternative}
          className="mb-2"
        >
          {t('shieldClaimIncidentDetailsDescription')}
        </Text>

        <Box
          borderColor={BoxBorderColor.BorderMuted}
          className="w-full h-[1px] border border-b-0"
        ></Box>
      </Box>

      <AccountSelector
        label={`${t('shieldClaimImpactedWalletAddress')}*`}
        modalTitle={t('shieldClaimSelectAccount')}
        impactedWalletAddress={impactedWalletAddress}
        onAccountSelect={(address) => {
          setImpactedWalletAddress(address);
          // only validate equality if reimbursement wallet address is set and valid format
          if (
            reimbursementWalletAddress &&
            (!errors.reimbursementWalletAddress ||
              errors.reimbursementWalletAddress.msg ===
                t('shieldClaimSameWalletAddressesError'))
          ) {
            validateReimbursementEqualsImpactedWalletAddress(address);
          }
        }}
      />

      <NetworkSelector
        label={`${t('shieldClaimNetwork')}*`}
        modalTitle={t('shieldClaimSelectNetwork')}
        selectedChainId={chainId}
        onNetworkSelect={(selectedChainId) => {
          setChainId(selectedChainId);
        }}
      />

      <FormTextField
        label={`${t('shieldClaimImpactedTxHash')}*`}
        placeholder={'e.g. a1084235686add...q46q8wurgw'}
        inputProps={{
          'data-testid': 'shield-claim-impacted-tx-hash-input',
        }}
        helpText={
          errors.impactedTxHash ? (
            <Text variant={TextVariant.BodySm} color={TextColor.Inherit}>
              {`${errors.impactedTxHash?.msg}. `}
              <TextButton
                size={TextButtonSize.BodySm}
                className="min-w-0"
                onClick={handleOpenActivityTab}
              >
                {t('shieldClaimImpactedTxHashHelpTextLink')}
              </TextButton>
            </Text>
          ) : (
            <Text
              variant={TextVariant.BodySm}
              color={TextColor.TextAlternative}
            >
              {t('shieldClaimImpactedTxHashHelpText')}{' '}
              <TextButton
                size={TextButtonSize.BodySm}
                className="min-w-0"
                onClick={handleOpenActivityTab}
              >
                {t('shieldClaimImpactedTxHashHelpTextLink')}
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
        error={Boolean(errors.impactedTxHash)}
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
          data-testid="shield-claim-description-textarea"
          placeholder={t('shieldClaimDescriptionPlaceholder')}
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
            data-testid="shield-claim-description-error"
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
        acceptText={t('shieldClaimFileUploaderAcceptText', [MAX_FILE_SIZE_MB])}
        helpText={t('shieldClaimFileUploaderHelpText')}
        maxFileSize={MAX_FILE_SIZE_BYTES}
      />
      <Box className="settings-page__content-item-col">
        <Button
          data-testid="shield-claim-submit-button"
          variant={ButtonVariant.Primary}
          size={ButtonSize.Lg}
          disabled={isInvalidData || claimSubmitLoading}
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
