import React, { useMemo } from 'react';
import {
  BannerAlertSeverity,
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  Button,
  ButtonSize,
  ButtonVariant,
  FontWeight,
  Icon,
  IconSize,
  Modal,
  ModalBody,
  ModalContent,
  ModalContentSize,
  ModalHeader,
  ModalOverlay,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { getEnvironmentType } from '../../../../../shared/lib/environment-type';
import {
  ENVIRONMENT_TYPE_POPUP,
  ENVIRONMENT_TYPE_SIDEPANEL,
} from '../../../../../shared/constants/app';
import {
  getFeatureTags,
  getSecurityAlertIconProps,
} from '../../utils/security-utils';
import { SecurityBanner } from './security-banner';
import type { SecurityTrustSheetParams } from './security-trust-sheet-types';

const FEATURE_TAG_MAX = 5;

export type SecurityTrustInfoModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onProceed?: () => void;
  sheetParams: SecurityTrustSheetParams | null;
};

export const SecurityTrustInfoModal = ({
  isOpen,
  onClose,
  onProceed,
  sheetParams,
}: SecurityTrustInfoModalProps) => {
  const t = useI18nContext();

  const environmentType = getEnvironmentType();
  const isCompactSheet =
    environmentType === ENVIRONMENT_TYPE_POPUP ||
    environmentType === ENVIRONMENT_TYPE_SIDEPANEL;

  const modalLayoutProps = useMemo(
    () =>
      isCompactSheet
        ? {
            contentClassName: 'flex justify-end items-stretch p-0',
            dialogStyle: {
              marginTop: 'auto',
              width: '100%',
              maxWidth: '100%',
              borderTopLeftRadius: '20px',
              borderTopRightRadius: '20px',
              borderBottomLeftRadius: 0,
              borderBottomRightRadius: 0,
              overflow: 'hidden',
            },
          }
        : {
            contentClassName: 'flex justify-center items-center p-0',
            dialogStyle: {
              width: '100%',
              maxWidth: '360px',
              borderRadius: '20px',
            },
          },
    [isCompactSheet],
  );

  const severity = sheetParams?.severity;

  const featureTags = useMemo(() => {
    if (
      !severity ||
      (severity !== 'Malicious' &&
        severity !== 'Warning' &&
        severity !== 'Spam')
    ) {
      return [];
    }

    const { tags } = getFeatureTags(
      sheetParams?.features ?? [],
      severity,
      t as (key: string, substitutions?: string[]) => string,
      true,
    );
    return tags.slice(0, FEATURE_TAG_MAX);
  }, [sheetParams?.features, severity, t]);

  if (!isOpen || !sheetParams) {
    return null;
  }

  const {
    securityConfig,
    title,
    description,
    displayIcon,
    displayIconColor,
    tokenSymbol,
  } = sheetParams;

  const alertIconProps = getSecurityAlertIconProps(
    securityConfig.alertSeverity,
  );
  const isMalicious = severity === 'Malicious';
  const showProceedActions = Boolean(onProceed);

  const maliciousSheetBannerDescription = tokenSymbol
    ? t('securityTrustMaliciousTokenBannerDescription', [tokenSymbol])
    : t('securityTrustMaliciousTokenBannerDescriptionNoSymbol');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      autoFocus={false}
      data-testid="security-trust-info-modal"
    >
      <ModalOverlay />
      <ModalContent
        size={ModalContentSize.Sm}
        className={modalLayoutProps.contentClassName}
        modalDialogProps={{
          padding: 0,
          style: modalLayoutProps.dialogStyle,
        }}
      >
        <ModalHeader
          onClose={onClose}
          closeButtonProps={{ ariaLabel: t('close') }}
        />
        <ModalBody className="px-4 pb-4">
          <Box
            flexDirection={BoxFlexDirection.Column}
            alignItems={BoxAlignItems.Center}
            gap={4}
          >
            <Box
              flexDirection={BoxFlexDirection.Column}
              alignItems={BoxAlignItems.Center}
              gap={3}
              className="w-full"
            >
              {severity === 'Verified' ? (
                <Icon
                  name={displayIcon}
                  size={IconSize.Xl}
                  color={displayIconColor}
                  data-testid="security-trust-info-modal-icon"
                />
              ) : (
                <Icon
                  name={alertIconProps?.name ?? displayIcon}
                  size={IconSize.Xl}
                  color={alertIconProps?.color ?? displayIconColor}
                  data-testid="security-trust-info-modal-icon"
                />
              )}
              <Text
                variant={TextVariant.HeadingSm}
                color={TextColor.TextDefault}
                fontWeight={FontWeight.Medium}
                className="text-center"
              >
                {title}
              </Text>
              {isMalicious ? (
                <Box className="w-full" marginTop={2}>
                  <SecurityBanner
                    securityConfig={securityConfig}
                    severity={BannerAlertSeverity.Danger}
                    testId="security-trust-info-modal-malicious-banner"
                    title={t('securityTrustMaliciousTokenTitle')}
                    description={maliciousSheetBannerDescription}
                  />
                </Box>
              ) : (
                <Text
                  variant={TextVariant.BodyMd}
                  color={TextColor.TextAlternative}
                  className="text-center"
                >
                  {description}
                </Text>
              )}
            </Box>

            {featureTags.length > 0 ? (
              <Box
                flexDirection={BoxFlexDirection.Column}
                gap={3}
                className="w-full"
                data-testid="security-trust-info-modal-feature-tags"
              >
                {featureTags.map((tag) => (
                  <Box
                    key={tag.label}
                    flexDirection={BoxFlexDirection.Row}
                    alignItems={BoxAlignItems.Center}
                    gap={3}
                    className="w-full"
                  >
                    {alertIconProps ? (
                      <Icon
                        name={alertIconProps.name}
                        size={IconSize.Md}
                        color={alertIconProps.color}
                      />
                    ) : null}
                    <Text
                      variant={TextVariant.BodyMd}
                      color={TextColor.TextDefault}
                    >
                      {tag.label}
                    </Text>
                  </Box>
                ))}
              </Box>
            ) : null}

            {showProceedActions ? (
              <Box
                flexDirection={BoxFlexDirection.Column}
                gap={3}
                className="w-full"
              >
                <Button
                  variant={ButtonVariant.Secondary}
                  size={ButtonSize.Lg}
                  isFullWidth
                  onClick={onProceed}
                  className={
                    isMalicious
                      ? 'bg-error-default text-primary-inverse hover:bg-error-default-hover active:bg-error-default-pressed'
                      : undefined
                  }
                  data-testid="security-trust-info-modal-continue"
                >
                  {t('securityTrustContinueAnyway')}
                </Button>
                <Button
                  variant={ButtonVariant.Primary}
                  size={ButtonSize.Lg}
                  isFullWidth
                  onClick={onClose}
                  data-testid="security-trust-info-modal-cancel"
                >
                  {t('cancel')}
                </Button>
              </Box>
            ) : (
              <Button
                variant={ButtonVariant.Primary}
                size={ButtonSize.Lg}
                isFullWidth
                onClick={onClose}
                data-testid="security-trust-info-modal-got-it"
              >
                {t('gotIt')}
              </Button>
            )}
          </Box>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
