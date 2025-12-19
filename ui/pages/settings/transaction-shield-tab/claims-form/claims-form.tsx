import React, { useCallback, useMemo, useState } from 'react';
import { isValidHexAddress } from '@metamask/controller-utils';
import {
  Box,
  BoxAlignItems,
  BoxBackgroundColor,
  BoxFlexDirection,
  BoxBorderColor,
  Button,
  ButtonSize,
  ButtonVariant,
  FontWeight,
  IconName,
  Icon,
  Text,
  TextButton,
  TextButtonSize,
  TextColor,
  TextVariant,
  IconSize,
} from '@metamask/design-system-react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import classnames from 'classnames';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { useClaims } from '../../../../contexts/claims/claims';
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
import { useClaimState } from '../../../../hooks/shield/useClaimState';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import { isValidEmail } from '../../../../../app/scripts/lib/util';
import { TRANSACTION_SHIELD_CLAIM_ROUTES } from '../../../../helpers/constants/routes';
import { submitShieldClaim } from '../../../../store/actions';
import LoadingScreen from '../../../../components/ui/loading-screen';
import { setShowClaimSubmitToast } from '../../../../components/app/toast-master/utils';
import { ClaimSubmitToastType } from '../../../../../shared/constants/app-state';
import {
  TRANSACTION_SHIELD_SUPPORT_LINK,
  FIND_TRANSACTION_HASH_LINK,
} from '../../../../helpers/constants/common';
import { FileUploader } from '../../../../components/component-library/file-uploader';
import {
  SUBMIT_CLAIM_ERROR_CODES,
  SUBMIT_CLAIM_FIELDS,
  SubmitClaimField,
} from '../types';
import { SubmitClaimError } from '../claim-error';
import AccountSelector from '../account-selector';
import NetworkSelector from '../network-selector';
import { getValidSubmissionWindowDays } from '../../../../selectors/shield/claims';
import { useSubscriptionMetrics } from '../../../../hooks/shield/metrics/useSubscriptionMetrics';
import {
  ShieldCtaActionClickedEnum,
  ShieldMetricsSourceEnum,
} from '../../../../../shared/constants/subscriptions';
import { getLatestShieldSubscription } from '../../../../selectors/subscription';
import {
  ERROR_MESSAGE_MAP,
  FIELD_ERROR_MESSAGE_KEY_MAP,
  MAX_FILE_SIZE_BYTES,
  MAX_FILE_SIZE_MB,
} from './constants';
import { isValidTransactionHash } from './utils';

const ClaimsForm = ({ isView = false }: { isView?: boolean }) => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { refetchClaims } = useClaims();
  const validSubmissionWindowDays = useSelector(getValidSubmissionWindowDays);
  const latestShieldSubscription = useSelector(getLatestShieldSubscription);
  const { captureShieldCtaClickedEvent, captureShieldClaimSubmissionEvent } =
    useSubscriptionMetrics();
  const [isSubmittingClaim, setIsSubmittingClaim] = useState(false);

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
    uploadedFiles,
    claimSignature,
  } = useClaimState(isView);

  const [errors, setErrors] = useState<
    Partial<
      Record<
        SubmitClaimField,
        | { key: SubmitClaimField; msg: string; params?: (string | number)[] }
        | undefined
      >
    >
  >({});

  const setErrorMessage = useCallback(
    (
      field: SubmitClaimField,
      messageKey: string | undefined,
      params?: (string | number)[],
    ) => {
      setErrors((state) => ({
        ...state,
        [field]: messageKey
          ? { key: field, msg: messageKey, params }
          : undefined,
      }));
    },
    [setErrors],
  );

  const validateEmail = useCallback(() => {
    if (email) {
      const isEmailValid = isValidEmail(email);
      setErrorMessage(
        SUBMIT_CLAIM_FIELDS.EMAIL,
        isEmailValid
          ? undefined
          : FIELD_ERROR_MESSAGE_KEY_MAP[SUBMIT_CLAIM_FIELDS.EMAIL],
      );
    } else {
      setErrorMessage(
        SUBMIT_CLAIM_FIELDS.EMAIL,
        ERROR_MESSAGE_MAP[SUBMIT_CLAIM_ERROR_CODES.FIELD_REQUIRED]?.messageKey,
      );
    }
  }, [email, setErrorMessage]);

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
          ? ERROR_MESSAGE_MAP[SUBMIT_CLAIM_ERROR_CODES.INVALID_WALLET_ADDRESSES]
              ?.messageKey
          : undefined,
      );
    },
    [reimbursementWalletAddress, impactedWalletAddress, setErrorMessage],
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
          FIELD_ERROR_MESSAGE_KEY_MAP[
            SUBMIT_CLAIM_FIELDS.REIMBURSEMENT_WALLET_ADDRESS
          ],
        );
      }
    } else {
      setErrorMessage(
        SUBMIT_CLAIM_FIELDS.REIMBURSEMENT_WALLET_ADDRESS,
        ERROR_MESSAGE_MAP[SUBMIT_CLAIM_ERROR_CODES.FIELD_REQUIRED]?.messageKey,
      );
    }
  }, [
    reimbursementWalletAddress,
    setErrorMessage,
    validateReimbursementEqualsImpactedWalletAddress,
  ]);

  const validateImpactedTxHash = useCallback(() => {
    if (impactedTransactionHash) {
      const isImpactedTxHashValid = isValidTransactionHash(
        impactedTransactionHash,
      );

      setErrorMessage(
        SUBMIT_CLAIM_FIELDS.IMPACTED_TRANSACTION_HASH,
        isImpactedTxHashValid
          ? undefined
          : FIELD_ERROR_MESSAGE_KEY_MAP[
              SUBMIT_CLAIM_FIELDS.IMPACTED_TRANSACTION_HASH
            ],
      );
    } else {
      setErrorMessage(
        SUBMIT_CLAIM_FIELDS.IMPACTED_TRANSACTION_HASH,
        ERROR_MESSAGE_MAP[SUBMIT_CLAIM_ERROR_CODES.FIELD_REQUIRED]?.messageKey,
      );
    }
  }, [impactedTransactionHash, setErrorMessage]);

  const validateDescription = useCallback(() => {
    setErrorMessage(
      SUBMIT_CLAIM_FIELDS.CASE_DESCRIPTION,
      caseDescription
        ? undefined
        : ERROR_MESSAGE_MAP[SUBMIT_CLAIM_ERROR_CODES.FIELD_REQUIRED]
            ?.messageKey,
    );
  }, [caseDescription, setErrorMessage]);

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
            errorMessage =
              ERROR_MESSAGE_MAP[SUBMIT_CLAIM_ERROR_CODES.FIELD_REQUIRED]
                ?.messageKey ?? '';
          } else {
            // if error is format error get error per field
            errorMessage = FIELD_ERROR_MESSAGE_KEY_MAP[detailError.field] ?? '';
          }

          if (errorMessage) {
            setErrorMessage(detailError.field, errorMessage);
          } else {
            // if error is not on message map, use message coming from backend
            setErrorMessage(detailError.field, detailError.error);
          }
        });
      } else {
        const messageFromErrorMap = data
          ? ERROR_MESSAGE_MAP[data?.errorCode]
          : undefined;

        let params;
        switch (data?.errorCode) {
          case SUBMIT_CLAIM_ERROR_CODES.SUBMISSION_WINDOW_EXPIRED:
            params = [validSubmissionWindowDays];
            break;
          default:
            break;
        }

        // if error message has field, set error message for the field instead of showing toast message
        if (messageFromErrorMap?.field) {
          setErrorMessage(
            messageFromErrorMap.field,
            messageFromErrorMap.messageKey,
            params,
          );
          return;
        }

        // if no error details, show error using toast message
        let toastMessage = '';
        if (message === ClaimSubmitToastType.Errored) {
          toastMessage = ClaimSubmitToastType.Errored;
        } else {
          toastMessage = messageFromErrorMap
            ? t(messageFromErrorMap.messageKey, params)
            : message;
        }
        // if message is not mapped we use toast
        dispatch(setShowClaimSubmitToast(toastMessage));
      }
    },
    [dispatch, setErrorMessage, t, validSubmissionWindowDays],
  );

  const onClickFindTransactionHash = useCallback(async () => {
    window.open(FIND_TRANSACTION_HASH_LINK, '_blank', 'noopener,noreferrer');
    captureShieldCtaClickedEvent({
      source: ShieldMetricsSourceEnum.Settings,
      ctaActionClicked: ShieldCtaActionClickedEnum.FindingTxHash,
      redirectToUrl: FIND_TRANSACTION_HASH_LINK,
    });
  }, [captureShieldCtaClickedEvent]);

  const handleSubmitClaim = useCallback(async () => {
    if (isInvalidData) {
      return;
    }

    const trackClaimSubmissionEvent = (
      submissionStatus: 'started' | 'completed' | 'failed',
      errorMessage?: string,
    ) => {
      if (!latestShieldSubscription) {
        return;
      }
      captureShieldClaimSubmissionEvent({
        subscriptionStatus: latestShieldSubscription.status,
        attachmentsCount: files?.length ?? 0,
        submissionStatus,
        errorMessage,
      });
    };

    try {
      setIsSubmittingClaim(true);
      const chainIdNumber = Number(chainId);
      // track the event when the claim submission is started
      trackClaimSubmissionEvent('started');

      await submitShieldClaim({
        chainId: chainIdNumber.toString(),
        email,
        impactedWalletAddress: impactedWalletAddress as `0x${string}`,
        impactedTxHash: impactedTransactionHash as `0x${string}`,
        reimbursementWalletAddress: reimbursementWalletAddress as `0x${string}`,
        description: caseDescription,
        signature: claimSignature as `0x${string}`,
        files,
      });

      // track the event when the claim submission is completed
      trackClaimSubmissionEvent('completed');

      dispatch(setShowClaimSubmitToast(ClaimSubmitToastType.Success));
      // update claims
      await refetchClaims();
      navigate(TRANSACTION_SHIELD_CLAIM_ROUTES.BASE);
    } catch (error) {
      handleSubmitClaimError(error as SubmitClaimError);
      const errorMessage =
        error instanceof SubmitClaimError ? error.message : undefined;

      // track the event when the claim submission fails
      trackClaimSubmissionEvent('failed', errorMessage);
    } finally {
      setIsSubmittingClaim(false);
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
    refetchClaims,
    claimSignature,
    handleSubmitClaimError,
    captureShieldClaimSubmissionEvent,
    latestShieldSubscription,
  ]);

  return (
    <Box
      className="submit-claim-page flex flex-col pt-4 px-4 pb-4"
      data-testid="submit-claim-page"
      gap={4}
    >
      <Text variant={TextVariant.BodyMd} fontWeight={FontWeight.Medium}>
        {isView
          ? t('shieldClaimDetailsViewClaims', [
              <TextButton key="here-link" className="min-w-0" asChild>
                <a
                  href={TRANSACTION_SHIELD_SUPPORT_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t('here')}
                </a>
              </TextButton>,
            ])
          : t('shieldClaimDetails', [
              validSubmissionWindowDays,
              <TextButton key="here-link" className="min-w-0" asChild>
                <a
                  href={TRANSACTION_SHIELD_SUPPORT_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t('shieldClaimViewGuidelines')}
                </a>
              </TextButton>,
            ])}
      </Text>
      {/* Personal details */}
      <Box>
        <Text variant={TextVariant.HeadingSm} className="mb-2">
          {t('shieldClaimPersonalDetails')}
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
          errors.email
            ? t(errors.email.msg, errors.email.params)
            : t('shieldClaimEmailHelpText')
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
        disabled={isView}
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
            ? t(
                errors.reimbursementWalletAddress.msg,
                errors.reimbursementWalletAddress.params,
              )
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
        disabled={isView}
      />
      {/* Incident details */}
      <Box className="mt-4">
        <Text variant={TextVariant.HeadingSm} className="mb-2">
          {t('shieldClaimIncidentDetails')}
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
          const sameWalletAddressErrorKey =
            ERROR_MESSAGE_MAP[SUBMIT_CLAIM_ERROR_CODES.INVALID_WALLET_ADDRESSES]
              ?.messageKey ?? '';

          // only validate equality if reimbursement wallet address is set and valid format
          if (
            reimbursementWalletAddress &&
            (!errors.reimbursementWalletAddress ||
              errors.reimbursementWalletAddress.msg ===
                sameWalletAddressErrorKey)
          ) {
            validateReimbursementEqualsImpactedWalletAddress(address);
          }
        }}
        disabled={isView}
      />
      {/* Custom network selector: existing ones are either embedded in containers or too feature-rich for this use case. */}
      <NetworkSelector
        label={`${t('shieldClaimNetwork')}*`}
        modalTitle={t('shieldClaimSelectNetwork')}
        selectedChainId={chainId}
        onNetworkSelect={(selectedChainId) => {
          setChainId(selectedChainId);
        }}
        disabled={isView}
      />
      <FormTextField
        label={`${t('shieldClaimImpactedTxHash')}*`}
        placeholder={'e.g. a1084235686add...q46q8wurgw'}
        inputProps={{
          'data-testid': 'shield-claim-impacted-tx-hash-input',
        }}
        helpText={
          errors.impactedTxHash ? (
            <Text
              variant={TextVariant.BodySm}
              color={TextColor.Inherit}
              data-testid="shield-claim-impacted-tx-hash-error"
            >
              {`${t(errors.impactedTxHash?.msg, errors.impactedTxHash?.params)} `}
              <TextButton
                size={TextButtonSize.BodySm}
                className="min-w-0"
                onClick={onClickFindTransactionHash}
              >
                {t('shieldClaimImpactedTxHashHelpTextLink')}
              </TextButton>
            </Text>
          ) : (
            <Text
              variant={TextVariant.BodySm}
              color={TextColor.TextAlternative}
            >
              {`${t('shieldClaimImpactedTxHashHelpText')} `}
              <TextButton
                size={TextButtonSize.BodySm}
                className="min-w-0"
                onClick={onClickFindTransactionHash}
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
        disabled={isView}
      />
      <Box className="flex flex-col gap-1">
        <Text
          variant={TextVariant.BodyMd}
          fontWeight={FontWeight.Medium}
          className={classnames({
            'opacity-50': isView,
          })}
        >
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
          disabled={isView}
        />
        {errors.caseDescription && (
          <Text
            variant={TextVariant.BodySm}
            color={TextColor.ErrorDefault}
            className="mt-0.5"
            data-testid="shield-claim-description-error"
          >
            {t(errors.caseDescription.msg, errors.caseDescription.params)}
          </Text>
        )}
      </Box>
      {isView ? (
        <Box flexDirection={BoxFlexDirection.Column} gap={1}>
          <Text variant={TextVariant.BodyMd} fontWeight={FontWeight.Medium}>
            {t('shieldClaimFileUploader')}
          </Text>
          <Box flexDirection={BoxFlexDirection.Column} gap={2}>
            {uploadedFiles.map((file, index) => (
              <Box
                asChild
                key={file.originalname || index}
                alignItems={BoxAlignItems.Center}
                flexDirection={BoxFlexDirection.Row}
                backgroundColor={BoxBackgroundColor.BackgroundSection}
                paddingTop={2}
                paddingBottom={2}
                paddingLeft={4}
                paddingRight={4}
                gap={2}
                className="rounded-lg"
              >
                <a
                  href={file.publicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Icon
                    name={
                      file.contentType?.includes('image')
                        ? IconName.Image
                        : IconName.File
                    }
                    size={IconSize.Lg}
                  />
                  <Text variant={TextVariant.BodySm}>{file.originalname}</Text>
                </a>
              </Box>
            ))}
          </Box>
        </Box>
      ) : (
        <FileUploader
          id="upload-images-file-uploader"
          data-testid="upload-images-file-uploader"
          label={t('shieldClaimFileUploader')}
          onChange={(inputFiles) => setFiles(inputFiles as FileList)}
          accept={['application/pdf', 'image/png', 'image/jpeg'].join(',')}
          acceptText={t('shieldClaimFileUploaderAcceptText', [
            MAX_FILE_SIZE_MB,
          ])}
          helpText={t('shieldClaimFileUploaderHelpText')}
          maxFileSize={MAX_FILE_SIZE_BYTES}
        />
      )}

      {!isView && (
        <Box className="settings-page__content-item-col">
          <Button
            data-testid="shield-claim-submit-button"
            variant={ButtonVariant.Primary}
            size={ButtonSize.Lg}
            disabled={isInvalidData || isSubmittingClaim}
            onClick={handleSubmitClaim}
          >
            {t('shieldClaimSubmit')}
          </Button>
        </Box>
      )}
      {isSubmittingClaim && <LoadingScreen />}
    </Box>
  );
};

export default ClaimsForm;
