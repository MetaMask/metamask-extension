import React, { useCallback, useEffect, useRef, useState } from 'react';
import log from 'loglevel';
import {
  Box,
  Modal,
  ModalContent,
  ModalOverlay,
} from '@metamask/design-system-react';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useAnalytics } from '../../../hooks/useAnalytics';
import { MarketingMoment } from '../../ui/marketing-moment';
import { MarketingMomentTitle } from '../../ui/marketing-moment-title';
import {
  openUpdateTabAndReload,
  setUpdateModalLastDismissedAt,
} from '../../../store/actions';
import type { ExtensionUpdatePromptType } from '../../../selectors/extension-update-prompt';

const TITLE_ID = 'extension-update-takeover-title';

type VisiblePromptType = Exclude<ExtensionUpdatePromptType, 'none'>;

type ExtensionUpdateTakeoverProps = {
  promptType: VisiblePromptType;
};

/**
 * Full-screen extension update takeover. The modal overlay blocks the page
 * behind it. It has no close icon, and Escape and outside clicks do not
 * dismiss it.
 *
 * @param props - The prompt variant to render.
 * @param props.promptType - Version-update or unsupported-version variant.
 */
export function ExtensionUpdateTakeover({
  promptType,
}: ExtensionUpdateTakeoverProps) {
  const t = useI18nContext();
  const { trackEvent, createEventBuilder } = useAnalytics();
  const [isBusy, setIsBusy] = useState(false);
  const primaryButtonRef = useRef<HTMLButtonElement>(null);
  const viewedPromptType = useRef<VisiblePromptType | null>(null);

  const isUnsupported = promptType === 'unsupportedVersion';

  useEffect(() => {
    if (viewedPromptType.current === promptType) {
      return;
    }
    viewedPromptType.current = promptType;

    const trackView = async () => {
      try {
        await trackEvent(
          createEventBuilder(
            MetaMetricsEventName.ForceUpgradeUpdateNeededPromptViewed,
          )
            .addCategory(MetaMetricsEventCategory.App)
            .build(),
        );
      } catch (error) {
        log.error('[ExtensionUpdateTakeover] view tracking failed', error);
      }
    };

    // The effect cannot await this. The rejection is handled inside trackView.
    trackView().catch((error: unknown) => {
      log.error('[ExtensionUpdateTakeover] view tracking failed', error);
    });
  }, [createEventBuilder, promptType, trackEvent]);

  const handleUpdate = useCallback(async () => {
    if (isBusy) {
      return;
    }
    setIsBusy(true);
    try {
      // Wait for the background to receive the event: the reload that follows
      // discards anything still in flight.
      await trackEvent(
        createEventBuilder(
          MetaMetricsEventName.ForceUpgradeClickedUpdateToLatestVersion,
        )
          .addCategory(MetaMetricsEventCategory.App)
          .build(),
      );
      await openUpdateTabAndReload();
    } catch (error) {
      log.error('[ExtensionUpdateTakeover] update failed', error);
      setIsBusy(false);
    }
  }, [createEventBuilder, isBusy, trackEvent]);

  const handleDismiss = useCallback(async () => {
    if (isBusy) {
      return;
    }
    setIsBusy(true);
    try {
      await trackEvent(
        createEventBuilder(MetaMetricsEventName.ForceUpgradeSkipped)
          .addCategory(MetaMetricsEventCategory.App)
          .build(),
      );
      await setUpdateModalLastDismissedAt(Date.now());
    } catch (error) {
      log.error('[ExtensionUpdateTakeover] dismissal failed', error);
      setIsBusy(false);
    }
  }, [createEventBuilder, isBusy, trackEvent]);

  return (
    <Modal
      isOpen
      autoFocus={false}
      initialFocusRef={primaryButtonRef}
      restoreFocus
      isClosedOnOutsideClick={false}
      isClosedOnEscapeKey={false}
      onClose={() => undefined}
      data-testid="extension-update-takeover"
      data-variant={promptType}
    >
      <ModalOverlay />
      <ModalContent
        className="items-stretch p-0 sm:py-0 md:py-0 [@media(max-height:475px)]:p-0"
        modalDialogProps={{
          borderWidth: 0,
          paddingTop: 0,
          paddingBottom: 0,
          'aria-labelledby': TITLE_ID,
          className:
            'h-full max-h-none w-full max-w-none rounded-none border-0 bg-background-default shadow-none motion-safe:animate-none',
        }}
      >
        <MarketingMoment
          className="mx-auto h-full w-full max-w-[400px] px-6"
          title={
            <Box
              id={TITLE_ID}
              data-testid="extension-update-takeover-title"
              className="w-full px-1 pt-6 pb-2"
            >
              <MarketingMomentTitle className="w-full text-center">
                {isUnsupported
                  ? t('extensionUpdateUnsupportedTitle')
                  : t('extensionUpdateTitle')}
              </MarketingMomentTitle>
            </Box>
          }
          description={
            isUnsupported
              ? t('extensionUpdateUnsupportedDescription')
              : t('extensionUpdateDescription')
          }
          artwork={
            <img
              src="/images/logo/metamask-fox.svg"
              width={160}
              height={160}
              alt=""
            />
          }
          primaryActionRef={primaryButtonRef}
          primaryAction={{
            label: isUnsupported
              ? t('extensionUpdateUnsupportedPrimaryAction')
              : t('extensionUpdatePrimaryAction'),
            onClick: handleUpdate,
            isDisabled: isBusy,
            'data-testid': 'extension-update-takeover-update-button',
          }}
          secondaryAction={{
            label: isUnsupported
              ? t('extensionUpdateUnsupportedSecondaryAction')
              : t('extensionUpdateSecondaryAction'),
            onClick: handleDismiss,
            isDisabled: isBusy,
            'data-testid': 'extension-update-takeover-dismiss-button',
          }}
        />
      </ModalContent>
    </Modal>
  );
}
