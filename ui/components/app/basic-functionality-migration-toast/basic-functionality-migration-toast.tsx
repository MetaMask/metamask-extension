import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Text,
  TextButton,
  TextButtonSize,
  TextColor,
  TextVariant,
  Toast,
} from '@metamask/design-system-react';
import { ENVIRONMENT_TYPE_NOTIFICATION } from '../../../../shared/constants/app';
import { MetaMetricsEventName } from '../../../../shared/constants/metametrics';
import { getEnvironmentType } from '../../../../shared/lib/environment-type';
import { PRIVACY_ROUTE } from '../../../helpers/constants/routes';
import { useAnalytics } from '../../../hooks/useAnalytics';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getUseExternalServices } from '../../../selectors';
import { getShouldShowBasicFunctionalityMigrationToast } from '../../../selectors/multichain/feature-flags';
import { hideMigrationToast } from '../../../store/actions';
import { useDispatch } from '../../../store/hooks';
import { BASIC_FUNCTIONALITY_MIGRATION_BLOG_POST_LINK } from '../basic-functionality-migration-modal/constants';
import {
  BASIC_FUNCTIONALITY_MIXED_TOAST_NOTICE_NAME,
  BasicFunctionalityMixedToastAction,
} from './constants';

export function BasicFunctionalityMigrationToast() {
  const t = useI18nContext();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { trackEvent, createEventBuilder } = useAnalytics();
  const shouldShow = useSelector(getShouldShowBasicFunctionalityMigrationToast);
  const isBasicFunctionalityEnabled = useSelector(getUseExternalServices);
  const hasTrackedView = useRef(false);
  const [isHiding, setIsHiding] = useState(false);

  const trackNoticeAction = useCallback(
    (action: BasicFunctionalityMixedToastAction) => {
      trackEvent(
        createEventBuilder(MetaMetricsEventName.NoticeUpdateDisplayed)
          .addProperties({
            name: BASIC_FUNCTIONALITY_MIXED_TOAST_NOTICE_NAME,
            action,
          })
          .build(),
      );
    },
    [createEventBuilder, trackEvent],
  );

  useEffect(() => {
    if (!shouldShow || hasTrackedView.current) {
      return;
    }
    hasTrackedView.current = true;
    trackNoticeAction(BasicFunctionalityMixedToastAction.Viewed);
  }, [shouldShow, trackNoticeAction]);

  const hideToast = useCallback(async () => {
    setIsHiding(true);
    await dispatch(hideMigrationToast());
  }, [dispatch]);

  if (!shouldShow || isHiding) {
    return null;
  }

  const dismissToast = async () => {
    trackNoticeAction(BasicFunctionalityMixedToastAction.Dismiss);
    await hideToast();
  };

  const openPrivacySettings = async () => {
    trackNoticeAction(BasicFunctionalityMixedToastAction.OpenSettings);
    await hideToast();
    // Notification windows are too small for Settings; open the full extension
    // UI instead. Popup and other surfaces navigate in-app.
    if (getEnvironmentType() === ENVIRONMENT_TYPE_NOTIFICATION) {
      globalThis.platform?.openExtensionInBrowser?.(PRIVACY_ROUTE);
      return;
    }
    navigate(PRIVACY_ROUTE);
  };

  return (
    <Toast
      data-testid="basic-functionality-migration-toast"
      className="relative w-full max-w-[432px] self-center p-3 [&>button:last-child]:absolute [&>button:last-child]:right-3 [&>button:last-child]:top-3"
      title={t('basicFunctionalityMigrationModalTitle')}
      titleProps={{ variant: TextVariant.BodyMd, className: 'pr-10' }}
      description={
        <div className="pt-0.5">
          <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
            {t('basicFunctionalityMigrationToastDescription', [
              isBasicFunctionalityEnabled
                ? t('basicFunctionalityMigrationToastEnabled')
                : t('basicFunctionalityMigrationToastDisabled'),
              <TextButton
                key="basic-functionality-migration-settings-link"
                size={TextButtonSize.BodySm}
                className="inline-flex p-0 align-baseline"
                data-testid="basic-functionality-migration-settings-link"
                onClick={openPrivacySettings}
              >
                {t('basicFunctionalityMigrationToastSettingsLink')}
              </TextButton>,
              <TextButton
                asChild
                key="basic-functionality-migration-blog-post"
                size={TextButtonSize.BodySm}
                className="inline-flex p-0 align-baseline"
              >
                <a
                  href={BASIC_FUNCTIONALITY_MIGRATION_BLOG_POST_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t('basicFunctionalityMigrationToastLearnMore')}
                </a>
              </TextButton>,
            ])}
          </Text>
        </div>
      }
      closeButtonProps={{ ariaLabel: t('close') }}
      onClose={dismissToast}
    />
  );
}
