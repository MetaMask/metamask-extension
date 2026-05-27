import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { ErrorCode, type HardwareWalletError } from '@metamask/hw-wallet-sdk';
import {
  Box,
  Button,
  ButtonSize,
  ButtonVariant,
  FontWeight,
  Icon,
  IconColor,
  IconName,
  IconSize,
  ModalBody,
  ModalFooter,
  ModalOverlay,
  Text,
  TextButton,
  TextButtonSize,
  TextAlign,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { Modal, ModalContent, ModalHeader } from '../../../component-library';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { useModalProps } from '../../../../hooks/useModalProps';
import { useHardwareWalletRecoveryLocation } from '../../../../hooks/useHardwareWalletRecoveryLocation';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../../shared/constants/metametrics';
import {
  buildHardwareWalletRecoverySegmentProperties,
  getHardwareWalletMetricDeviceModel,
  mapHardwareWalletRecoveryErrorType,
  mapHardwareWalletTypeToMetricDeviceType,
} from '../../../../../shared/lib/hardware-wallet-recovery-metrics';
import { MetaMetricsContext } from '../../../../contexts/metametrics';
import {
  HardwareWalletType,
  handleContinueWithPermissionCheck,
  getHardwareWalletErrorCode,
  isUserRejectedHardwareWalletError,
  isRetryableHardwareWalletError,
  useHardwareWalletActions,
  useHardwareWalletConfig,
} from '../../../../contexts/hardware-wallets';
import { useBridgeRedirectQueryString } from '../../../../contexts/hardware-wallets/useBridgeRedirectQueryString';
import {
  getChromiumExtensionCameraSiteSettingsUrl,
  getMozExtensionOriginForDisplay,
  isFirefoxBrowser,
} from '../../../../../shared/lib/browser-runtime.utils';
import {
  CameraAccessErrorContent,
  CameraAccessErrorContentVariant,
} from '../../camera-access-error-content';
import {
  buildErrorContent,
  HardwareWalletErrorContentVariant,
} from './error-content-builder';

/**
 * Checks whether the error code represents a QR camera permission flow error.
 *
 * @param code - The hardware wallet error code.
 * @returns `true` when the error is camera-denied or camera-prompt-dismissed.
 */
function isQrCameraFlowErrorCode(code: ErrorCode | undefined): boolean {
  return (
    code === ErrorCode.PermissionCameraDenied ||
    code === ErrorCode.PermissionCameraPromptDismissed
  );
}

/**
 * Determines whether the "blocked" (rather than "needed") camera-access
 * variant should be shown, accounting for Firefox's prompt-stays-prompt quirk.
 *
 * @param code - The hardware wallet error code.
 * @returns `true` when the blocked variant is appropriate.
 */
function shouldShowQrCameraBlockedVariant(
  code: ErrorCode | undefined,
): boolean {
  return (
    code === ErrorCode.PermissionCameraDenied ||
    (isFirefoxBrowser() && code === ErrorCode.PermissionCameraPromptDismissed)
  );
}

/**
 * Renders the appropriate `CameraAccessErrorContent` variant for QR camera
 * permission errors (blocked vs. needed).
 *
 * Clicking Continue checks the live permission state before acting:
 * - If granted: retries camera access directly (works in any context).
 * - If prompt + side panel: redirects to fullscreen for native prompt.
 * - If prompt + fullscreen/popup: retries (browser will show native prompt).
 * - If denied: does nothing (user must change settings first).
 *
 * @param params - Render parameters.
 * @param params.errorCode - The hardware wallet error code.
 * @param params.onRetry - Callback invoked when the user clicks Continue.
 * @param params.isLoading - Whether the retry action is in progress.
 * @param params.redirectQueryString - Optional query string forwarded to the
 * fullscreen tab for restoring Swap / Bridge form parameters.
 * @returns The camera-access error content element.
 */
function renderQrCameraFlowContent({
  errorCode,
  onRetry,
  isLoading,
  redirectQueryString,
}: {
  errorCode: ErrorCode | undefined;
  onRetry: () => Promise<void>;
  isLoading: boolean;
  redirectQueryString?: string | null;
}): React.JSX.Element {
  const handleOpenSettings = () => {
    globalThis.platform.openTab({
      url: getChromiumExtensionCameraSiteSettingsUrl(),
    });
  };

  const handleContinue = () =>
    handleContinueWithPermissionCheck(onRetry, redirectQueryString);

  if (shouldShowQrCameraBlockedVariant(errorCode)) {
    return (
      <CameraAccessErrorContent
        variant={CameraAccessErrorContentVariant.Blocked}
        isFirefox={isFirefoxBrowser()}
        mozExtensionDisplay={getMozExtensionOriginForDisplay()}
        onOpenSettings={handleOpenSettings}
        onContinue={handleContinue}
        continueLoading={isLoading}
        rootPaddingHorizontal={0}
        rootPaddingBottom={0}
      />
    );
  }

  return (
    <CameraAccessErrorContent
      variant={CameraAccessErrorContentVariant.Needed}
      onContinue={handleContinue}
      continueLoading={isLoading}
      rootPaddingHorizontal={0}
      rootPaddingBottom={0}
    />
  );
}

type HardwareWalletErrorModalProps = {
  isOpen?: boolean;
  error?: HardwareWalletError;
  onCancel?: () => void;
  onClose?: () => void;
  onRetry?: () => void;
  onRepairDevice?: (walletType: HardwareWalletType) => void;
};

const RECOVERY_SUCCESS_AUTO_DISMISS_MS = 3000;

/**
 * Modal component to display hardware wallet errors with recovery instructions
 *
 * @param props - The component props
 */
export const HardwareWalletErrorModal: React.FC<HardwareWalletErrorModalProps> =
  React.memo((props) => {
    const t = useI18nContext();
    const { trackEvent } = useContext(MetaMetricsContext);
    const recoveryLocation = useHardwareWalletRecoveryLocation();
    const { hideModal, props: modalProps } = useModalProps();
    const [isLoading, setIsLoading] = useState(false);
    const [recovered, setRecovered] = useState(false);
    const recoveredDismissTimeoutRef = useRef<ReturnType<
      typeof setTimeout
    > | null>(null);
    const errorTypeViewCountRef = useRef(0);
    const lastTrackedErrorKeyRef = useRef<string | null>(null);
    const prevNonNullErrorIdentityKeyRef = useRef<string | null>(null);
    const successModalMetricSentRef = useRef(false);
    const { error, onClose, onCancel, onRetry, onRepairDevice } = {
      ...modalProps,
      ...props,
    };

    const { walletType: selectedAccountWalletType } = useHardwareWalletConfig();
    const { ensureDeviceReady, clearError, setConnectionReady } =
      useHardwareWalletActions();
    const getRedirectQueryString = useBridgeRedirectQueryString();

    // Prefer `walletType` from error metadata first (e.g. signature flows where the signing
    // account may differ from the selected account). Read both top-level `metadata` and RPC-style
    // `data.metadata`. Then selected account, then Ledger so copy/icons still resolve if metadata is missing.
    const errorMetadata =
      error === undefined
        ? undefined
        : ((error as { metadata?: { walletType?: HardwareWalletType } })
            .metadata ??
          (
            error as {
              data?: { metadata?: { walletType?: HardwareWalletType } };
            }
          ).data?.metadata);
    const errorWalletType = errorMetadata?.walletType;
    const displayWalletType = useMemo(
      () =>
        errorWalletType ??
        selectedAccountWalletType ??
        HardwareWalletType.Ledger,
      [errorWalletType, selectedAccountWalletType],
    );
    const trackableMetricDeviceType = useMemo(
      () =>
        mapHardwareWalletTypeToMetricDeviceType(
          errorWalletType ?? selectedAccountWalletType,
        ),
      [errorWalletType, selectedAccountWalletType],
    );

    const isUserRejectedError =
      error !== undefined && isUserRejectedHardwareWalletError(error);

    const errorIdentityKey = useMemo(() => {
      if (!error) {
        return null;
      }
      const code = getHardwareWalletErrorCode(error);
      return `${recoveryLocation}:${String(code)}:${mapHardwareWalletRecoveryErrorType(error)}`;
    }, [error, recoveryLocation]);

    useEffect(() => {
      setRecovered(false);
      successModalMetricSentRef.current = false;

      if (errorIdentityKey === null) {
        prevNonNullErrorIdentityKeyRef.current = null;
        return;
      }

      if (
        prevNonNullErrorIdentityKeyRef.current !== null &&
        prevNonNullErrorIdentityKeyRef.current !== errorIdentityKey
      ) {
        errorTypeViewCountRef.current = 0;
      }
      prevNonNullErrorIdentityKeyRef.current = errorIdentityKey;
    }, [errorIdentityKey]);

    useEffect(() => {
      if (error) {
        return;
      }
      lastTrackedErrorKeyRef.current = null;
    }, [error]);

    useEffect(() => {
      if (!error || isUserRejectedError || !errorIdentityKey) {
        return;
      }
      if (!trackableMetricDeviceType) {
        return;
      }
      if (lastTrackedErrorKeyRef.current === errorIdentityKey) {
        return;
      }
      lastTrackedErrorKeyRef.current = errorIdentityKey;
      errorTypeViewCountRef.current += 1;
      const deviceModel = getHardwareWalletMetricDeviceModel(error);
      trackEvent({
        category: MetaMetricsEventCategory.Accounts,
        event: MetaMetricsEventName.HardwareWalletRecoveryModalViewed,
        properties: buildHardwareWalletRecoverySegmentProperties({
          location: recoveryLocation,
          deviceType: trackableMetricDeviceType,
          deviceModel,
          errorType: mapHardwareWalletRecoveryErrorType(error),
          errorTypeViewCount: errorTypeViewCountRef.current,
          error,
        }),
      });
    }, [
      error,
      errorIdentityKey,
      isUserRejectedError,
      recoveryLocation,
      trackableMetricDeviceType,
      trackEvent,
    ]);

    const handleRetry = async () => {
      onRetry?.();
      if (error && trackableMetricDeviceType) {
        const deviceModel = getHardwareWalletMetricDeviceModel(error);
        trackEvent({
          category: MetaMetricsEventCategory.Accounts,
          event: MetaMetricsEventName.HardwareWalletRecoveryCtaClicked,
          properties: buildHardwareWalletRecoverySegmentProperties({
            location: recoveryLocation,
            deviceType: trackableMetricDeviceType,
            deviceModel,
            errorType: mapHardwareWalletRecoveryErrorType(error),
            errorTypeViewCount: errorTypeViewCountRef.current,
            error,
          }),
        });
      }

      setIsLoading(true);
      try {
        const result = await ensureDeviceReady();
        if (result) {
          setConnectionReady();
          setRecovered(true);
        } else if (error && trackableMetricDeviceType) {
          errorTypeViewCountRef.current += 1;
          const deviceModel = getHardwareWalletMetricDeviceModel(error);
          trackEvent({
            category: MetaMetricsEventCategory.Accounts,
            event: MetaMetricsEventName.HardwareWalletRecoveryModalViewed,
            properties: buildHardwareWalletRecoverySegmentProperties({
              location: recoveryLocation,
              deviceType: trackableMetricDeviceType,
              deviceModel,
              errorType: mapHardwareWalletRecoveryErrorType(error),
              errorTypeViewCount: errorTypeViewCountRef.current,
              error,
            }),
          });
        }
      } finally {
        setIsLoading(false);
      }
    };

    const handleClose = useCallback(() => {
      onCancel?.();
      clearError();
      hideModal();
    }, [clearError, hideModal, onCancel]);

    const handleRepairDevice = useCallback(() => {
      if (error && trackableMetricDeviceType) {
        const deviceModel = getHardwareWalletMetricDeviceModel(error);
        trackEvent({
          category: MetaMetricsEventCategory.Accounts,
          event: MetaMetricsEventName.HardwareWalletRecoveryRepairCtaClicked,
          properties: buildHardwareWalletRecoverySegmentProperties({
            location: recoveryLocation,
            deviceType: trackableMetricDeviceType,
            deviceModel,
            errorType: mapHardwareWalletRecoveryErrorType(error),
            errorTypeViewCount: errorTypeViewCountRef.current,
            error,
          }),
        });
      }
      onRepairDevice?.(displayWalletType);
    }, [
      displayWalletType,
      error,
      onRepairDevice,
      recoveryLocation,
      trackableMetricDeviceType,
      trackEvent,
    ]);

    const handleRecoveredClose = useCallback(() => {
      clearError();
      setConnectionReady();
      hideModal();
    }, [clearError, hideModal, setConnectionReady]);

    useEffect(() => {
      if (!recovered) {
        return;
      }

      recoveredDismissTimeoutRef.current = setTimeout(() => {
        handleRecoveredClose();
      }, RECOVERY_SUCCESS_AUTO_DISMISS_MS);

      return () => {
        if (recoveredDismissTimeoutRef.current) {
          clearTimeout(recoveredDismissTimeoutRef.current);
          recoveredDismissTimeoutRef.current = null;
        }
      };
    }, [handleRecoveredClose, recovered]);

    useEffect(() => {
      if (!recovered || !error || successModalMetricSentRef.current) {
        return;
      }
      if (!trackableMetricDeviceType) {
        return;
      }
      successModalMetricSentRef.current = true;
      const deviceModel = getHardwareWalletMetricDeviceModel(error);
      trackEvent({
        category: MetaMetricsEventCategory.Accounts,
        event: MetaMetricsEventName.HardwareWalletRecoverySuccessModalViewed,
        properties: buildHardwareWalletRecoverySegmentProperties({
          location: recoveryLocation,
          deviceType: trackableMetricDeviceType,
          deviceModel,
          errorType: mapHardwareWalletRecoveryErrorType(error),
          errorTypeViewCount: errorTypeViewCountRef.current,
          error,
        }),
      });
      lastTrackedErrorKeyRef.current = null;
      errorTypeViewCountRef.current = 0;
      prevNonNullErrorIdentityKeyRef.current = null;
    }, [
      error,
      recovered,
      recoveryLocation,
      trackEvent,
      trackableMetricDeviceType,
    ]);

    useEffect(() => {
      if (!isUserRejectedError) {
        return;
      }

      handleClose();
    }, [handleClose, isUserRejectedError]);

    useEffect(() => {
      if (error) {
        return;
      }

      onClose?.();
    }, [error, onClose]);

    // If no error, don't render anything
    if (!error) {
      return null;
    }

    // User intentionally rejected on device; this is a cancel path, not an error state.
    if (isUserRejectedError) {
      return null;
    }

    const isQrCameraFlow = isQrCameraFlowErrorCode(error.code);

    const standardErrorContent = isQrCameraFlow
      ? null
      : buildErrorContent(
          error,
          displayWalletType,
          t as (key: string, ...args: unknown[]) => string,
        );

    const headerContent =
      standardErrorContent &&
      (standardErrorContent.icon ? (
        <Icon
          name={standardErrorContent.icon}
          color={standardErrorContent.iconColor}
          size={IconSize.Xl}
        />
      ) : (
        <Text
          variant={TextVariant.HeadingMd}
          textAlign={TextAlign.Center}
          color={TextColor.TextDefault}
        >
          {standardErrorContent.title}
        </Text>
      ));

    const retryButtonText =
      error.code === ErrorCode.DeviceDisconnected
        ? t('hardwareWalletErrorContinueButton')
        : t('hardwareWalletErrorReconnectButton');

    const retryButtonContent = isLoading ? (
      <Icon
        name={IconName.Loading}
        style={{ animation: 'spin 1.2s linear infinite' }}
      />
    ) : (
      retryButtonText
    );

    if (recovered) {
      return (
        <Modal
          isOpen={true}
          onClose={handleRecoveredClose}
          isClosedOnOutsideClick={false}
          isClosedOnEscapeKey
        >
          <ModalOverlay />
          <ModalContent>
            <ModalHeader onClose={handleRecoveredClose}>
              <Box className="flex items-center justify-center">
                <Icon
                  name={IconName.Confirmation}
                  color={IconColor.SuccessDefault}
                  size={IconSize.Xl}
                />
              </Box>
            </ModalHeader>
            <ModalBody>
              <Box className="flex flex-col items-center gap-4">
                <Text
                  variant={TextVariant.HeadingSm}
                  textAlign={TextAlign.Center}
                  color={TextColor.TextAlternative}
                >
                  {t('hardwareWalletTypeConnected', [t(displayWalletType)])}
                </Text>
              </Box>
            </ModalBody>
          </ModalContent>
        </Modal>
      );
    }

    return (
      <Modal
        isOpen={true}
        onClose={handleClose}
        isClosedOnOutsideClick={false}
        isClosedOnEscapeKey
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader onClose={handleClose}>
            {headerContent && (
              <Box className="flex items-center justify-center">
                {headerContent}
              </Box>
            )}
          </ModalHeader>

          <ModalBody>
            <Box className="flex flex-col items-center gap-4">
              {isQrCameraFlow &&
                renderQrCameraFlowContent({
                  errorCode: error.code,
                  onRetry: handleRetry,
                  isLoading,
                  redirectQueryString: getRedirectQueryString(),
                })}
              {!isQrCameraFlow && standardErrorContent ? (
                <>
                  {standardErrorContent.icon && (
                    <Text
                      variant={TextVariant.HeadingMd}
                      textAlign={TextAlign.Center}
                      color={TextColor.TextDefault}
                    >
                      {standardErrorContent.title}
                    </Text>
                  )}
                  {standardErrorContent.variant ===
                    HardwareWalletErrorContentVariant.Description && (
                    <Text
                      variant={TextVariant.BodyMd}
                      textAlign={TextAlign.Center}
                      color={TextColor.TextDefault}
                    >
                      {standardErrorContent.description}
                    </Text>
                  )}

                  {standardErrorContent.variant ===
                    HardwareWalletErrorContentVariant.Recovery && (
                    <Box className="flex w-full flex-col gap-2">
                      <Text
                        variant={TextVariant.BodyMd}
                        fontWeight={FontWeight.Medium}
                        color={TextColor.TextDefault}
                      >
                        {t('hardwareWalletErrorRecoveryTitle')}
                      </Text>
                      <ul className="m-0 flex list-disc flex-col gap-2 pl-4">
                        {standardErrorContent.recoveryInstructions.map(
                          (instruction, index) => (
                            <li key={`${instruction}-${index}`}>
                              <Text
                                variant={TextVariant.BodyMd}
                                color={TextColor.TextDefault}
                              >
                                {instruction}
                              </Text>
                            </li>
                          ),
                        )}
                        {standardErrorContent.showRepairLink &&
                          onRepairDevice && (
                            <li>
                              <TextButton
                                size={TextButtonSize.BodyMd}
                                onClick={handleRepairDevice}
                                className="hover:bg-transparent active:bg-transparent w-fit"
                              >
                                {t('hardwareWalletRepairLink')}
                              </TextButton>
                            </li>
                          )}
                      </ul>
                    </Box>
                  )}
                </>
              ) : null}
            </Box>
          </ModalBody>

          {!isQrCameraFlow && (
            <ModalFooter>
              <Box className="flex w-full flex-row gap-2">
                {isRetryableHardwareWalletError(error) ? (
                  <Button
                    variant={ButtonVariant.Primary}
                    size={ButtonSize.Lg}
                    isFullWidth
                    onClick={handleRetry}
                  >
                    {retryButtonContent}
                  </Button>
                ) : (
                  <Button
                    variant={ButtonVariant.Primary}
                    size={ButtonSize.Lg}
                    isFullWidth
                    onClick={handleClose}
                  >
                    {t('confirm')}
                  </Button>
                )}
              </Box>
            </ModalFooter>
          )}
        </ModalContent>
      </Modal>
    );
  });
