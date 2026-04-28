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
  Icon,
  IconName,
  IconColor,
  IconSize,
} from '@metamask/design-system-react';
import {
  Text,
  Box,
  Button,
  ButtonVariant,
  ButtonSize,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
} from '../../../component-library';
import {
  AlignItems,
  Display,
  FlexDirection,
  JustifyContent,
  TextAlign,
  TextColor,
  TextVariant,
  BlockSize,
} from '../../../../helpers/constants/design-system';
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
  getHardwareWalletErrorCode,
  isUserRejectedHardwareWalletError,
  isRetryableHardwareWalletError,
  useHardwareWalletActions,
  useHardwareWalletConfig,
} from '../../../../contexts/hardware-wallets';
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
 * @param params - Render parameters.
 * @param params.errorCode - The hardware wallet error code.
 * @param params.onRetry - Callback invoked when the user clicks Continue.
 * @param params.isLoading - Whether the retry action is in progress.
 * @returns The camera-access error content element.
 */
function renderQrCameraFlowContent({
  errorCode,
  onRetry,
  isLoading,
}: {
  errorCode: ErrorCode | undefined;
  onRetry: () => Promise<void>;
  isLoading: boolean;
}): React.JSX.Element {
  const handleOpenSettings = () => {
    globalThis.platform.openTab({
      url: getChromiumExtensionCameraSiteSettingsUrl(),
    });
  };

  if (shouldShowQrCameraBlockedVariant(errorCode)) {
    return (
      <CameraAccessErrorContent
        variant={CameraAccessErrorContentVariant.Blocked}
        isFirefox={isFirefoxBrowser()}
        mozExtensionDisplay={getMozExtensionOriginForDisplay()}
        onOpenSettings={handleOpenSettings}
        onContinue={onRetry}
        continueLoading={isLoading}
        rootPaddingHorizontal={0}
        rootPaddingBottom={0}
      />
    );
  }

  return (
    <CameraAccessErrorContent
      variant={CameraAccessErrorContentVariant.Needed}
      onContinue={onRetry}
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
    const { error, onClose, onCancel, onRetry } = { ...modalProps, ...props };

    const { walletType: selectedAccountWalletType } = useHardwareWalletConfig();
    const { ensureDeviceReady, clearError, setConnectionReady } =
      useHardwareWalletActions();

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
          variant={TextVariant.headingMd}
          textAlign={TextAlign.Center}
          color={TextColor.textDefault}
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
              <Box
                display={Display.Flex}
                alignItems={AlignItems.center}
                justifyContent={JustifyContent.center}
              >
                <Icon
                  name={IconName.Confirmation}
                  color={IconColor.SuccessDefault}
                  size={IconSize.Xl}
                />
              </Box>
            </ModalHeader>
            <ModalBody>
              <Box
                display={Display.Flex}
                flexDirection={FlexDirection.Column}
                alignItems={AlignItems.center}
                gap={4}
              >
                <Text
                  variant={TextVariant.headingSm}
                  textAlign={TextAlign.Center}
                  color={TextColor.textAlternative}
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
              <Box
                display={Display.Flex}
                alignItems={AlignItems.center}
                justifyContent={JustifyContent.center}
              >
                {headerContent}
              </Box>
            )}
          </ModalHeader>

          <ModalBody>
            <Box
              display={Display.Flex}
              flexDirection={FlexDirection.Column}
              alignItems={AlignItems.center}
              gap={4}
            >
              {isQrCameraFlow &&
                renderQrCameraFlowContent({
                  errorCode: error.code,
                  onRetry: handleRetry,
                  isLoading,
                })}
              {!isQrCameraFlow && standardErrorContent ? (
                <>
                  {standardErrorContent.icon && (
                    <Text
                      variant={TextVariant.headingMd}
                      textAlign={TextAlign.Center}
                      color={TextColor.textDefault}
                    >
                      {standardErrorContent.title}
                    </Text>
                  )}
                  {standardErrorContent.variant ===
                    HardwareWalletErrorContentVariant.Description && (
                    <Text
                      variant={TextVariant.bodyMd}
                      textAlign={TextAlign.Center}
                      color={TextColor.textDefault}
                    >
                      {standardErrorContent.description}
                    </Text>
                  )}

                  {standardErrorContent.variant ===
                    HardwareWalletErrorContentVariant.Recovery && (
                    <Box
                      width={BlockSize.Full}
                      display={Display.Flex}
                      flexDirection={FlexDirection.Column}
                      gap={2}
                    >
                      <Text
                        variant={TextVariant.bodyMdMedium}
                        color={TextColor.textDefault}
                      >
                        {t('hardwareWalletErrorRecoveryTitle')}
                      </Text>
                      {standardErrorContent.recoveryInstructions.map(
                        (instruction, index) => (
                          <Box
                            key={index}
                            display={Display.Flex}
                            flexDirection={FlexDirection.Row}
                            gap={2}
                            paddingLeft={4}
                            paddingRight={4}
                            alignItems={AlignItems.flexStart}
                          >
                            <Box as="li" key={index}>
                              <Text
                                variant={TextVariant.bodyMd}
                                color={TextColor.textDefault}
                              >
                                {instruction}
                              </Text>
                            </Box>
                          </Box>
                        ),
                      )}
                    </Box>
                  )}
                </>
              ) : null}
            </Box>
          </ModalBody>

          {!isQrCameraFlow && (
            <ModalFooter>
              <Box
                display={Display.Flex}
                flexDirection={FlexDirection.Row}
                gap={2}
                width={BlockSize.Full}
              >
                {isRetryableHardwareWalletError(error) ? (
                  <Button
                    variant={ButtonVariant.Primary}
                    size={ButtonSize.Lg}
                    block
                    onClick={handleRetry}
                  >
                    {retryButtonContent}
                  </Button>
                ) : (
                  <Button
                    variant={ButtonVariant.Primary}
                    size={ButtonSize.Lg}
                    block
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
