import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  Box,
  Text,
  TextButton,
  TextButtonSize,
  TextVariant,
  TextColor,
  BoxFlexDirection,
  BoxAlignItems,
} from '@metamask/design-system-react';

import { Tag } from '../../../components/component-library';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { SUPPORT_LINK } from '../../../helpers/constants/common';
import { isBeta } from '../../../../shared/lib/build-types';
import {
  getNumberOfSettingRoutesInTab,
  handleSettingsRefs,
} from '../../../helpers/utils/settings-search';
import {
  MetaMetricsContextProp,
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import VisitSupportDataConsentModal from '../../../components/app/modals/visit-support-data-consent-modal';

export default function InfoTab(): React.ReactElement {
  const t = useI18nContext();
  const { trackEvent } = useContext(MetaMetricsContext);

  const [
    isVisitSupportDataConsentModalOpen,
    setIsVisitSupportDataConsentModalOpen,
  ] = useState(false);

  const version = process.env.METAMASK_VERSION ?? '';

  const n = getNumberOfSettingRoutesInTab(t, t('about'));
  const settingsRefs = useMemo(
    () =>
      Array.from({ length: n }, () =>
        React.createRef<HTMLDivElement>(),
      ) as React.RefObject<HTMLDivElement>[],
    [n],
  );

  useEffect(() => {
    handleSettingsRefs(t, t('about'), settingsRefs);
  }, [t, settingsRefs]);

  const toggleVisitSupportDataConsentModal = useCallback(() => {
    setIsVisitSupportDataConsentModalOpen((prev) => !prev);
  }, []);

  const handleContactUsClick = useCallback(() => {
    trackEvent(
      {
        category: MetaMetricsEventCategory.Settings,
        event: MetaMetricsEventName.SupportLinkClicked,
        properties: {
          url: SUPPORT_LINK,
        },
      },
      {
        contextPropsIntoEventProperties: [MetaMetricsContextProp.PageTitle],
      },
    );
  }, [trackEvent]);

  function renderInfoLinks(): React.ReactElement {
    const privacyUrl = 'https://metamask.io/privacy.html';
    const siteUrl = 'https://metamask.io/';

    const linkProps = {
      size: TextButtonSize.BodyMd,
      className: 'text-default',
    };

    const linkItemProps = {
      paddingTop: 4 as const,
      paddingBottom: 4 as const,
    };

    const separatorBox = (
      <Box className="mt-4 mb-4 border-t border-border-muted" />
    );

    return (
      <Box
        ref={settingsRefs[1]}
        flexDirection={BoxFlexDirection.Column}
        alignItems={BoxAlignItems.Start}
        className="settings-page__content-item settings-page__content-item--without-height w-full px-0"
      >
        <Box ref={settingsRefs[2]} {...linkItemProps}>
          <TextButton asChild {...linkProps}>
            <a href={privacyUrl} target="_blank" rel="noopener noreferrer">
              {t('privacyMsg')}
            </a>
          </TextButton>
        </Box>
        <Box ref={settingsRefs[3]} {...linkItemProps}>
          <TextButton asChild {...linkProps}>
            <a
              href="https://metamask.io/terms.html"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('terms')}
            </a>
          </TextButton>
        </Box>
        {isBeta() ? (
          <Box ref={settingsRefs[8]} {...linkItemProps}>
            <TextButton asChild {...linkProps}>
              <a
                href="https://metamask.io/beta-terms.html"
                target="_blank"
                rel="noopener noreferrer"
              >
                {t('betaTerms')} <Tag label={t('new')} />
              </a>
            </TextButton>
          </Box>
        ) : null}
        <Box ref={settingsRefs[4]} {...linkItemProps}>
          <TextButton asChild {...linkProps}>
            <a
              href={`https://raw.githubusercontent.com/MetaMask/metamask-extension/v${version}/attribution.txt`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('attributions')}
            </a>
          </TextButton>
        </Box>
        {separatorBox}
        <Box ref={settingsRefs[5]} {...linkItemProps}>
          <TextButton
            onClick={toggleVisitSupportDataConsentModal}
            {...linkProps}
          >
            {t('supportCenter')}
          </TextButton>
        </Box>
        <Box ref={settingsRefs[6]} {...linkItemProps}>
          <TextButton asChild {...linkProps}>
            <a href={siteUrl} target="_blank" rel="noopener noreferrer">
              {t('visitWebSite')}
            </a>
          </TextButton>
        </Box>
        {separatorBox}
        <Box ref={settingsRefs[7]} {...linkItemProps}>
          <TextButton asChild {...linkProps}>
            <a
              href={SUPPORT_LINK}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleContactUsClick}
            >
              {t('contactUs')}
            </a>
          </TextButton>
        </Box>
      </Box>
    );
  }

  const versionLabel = isBeta()
    ? t('betaMetamaskVersion')
    : t('metamaskVersion');

  return (
    <Box className="settings-page__body px-0">
      <Box className="settings-page__content-row">
        <Box
          flexDirection={BoxFlexDirection.Column}
          alignItems={BoxAlignItems.Center}
          paddingBottom={6}
          gap={4}
          className="settings-page__content-item settings-page__content-item--without-height w-full px-0"
        >
          <Box>
            <img
              src="./images/logo/metamask-fox.svg"
              alt="MetaMask Logo"
              className="info-tab__logo w-24 h-24"
            />
          </Box>
          <Box ref={settingsRefs[0]} data-testid="info-tab-version">
            <Text
              variant={TextVariant.BodySm}
              color={TextColor.TextAlternative}
              className="info-tab__version-number"
            >
              {versionLabel} {version}
            </Text>
          </Box>
          {renderInfoLinks()}
        </Box>
      </Box>
      {isVisitSupportDataConsentModalOpen && (
        <VisitSupportDataConsentModal
          isOpen={isVisitSupportDataConsentModalOpen}
          onClose={toggleVisitSupportDataConsentModal}
        />
      )}
    </Box>
  );
}
