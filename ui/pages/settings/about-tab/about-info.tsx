import React from 'react';
import {
  Box,
  Text,
  TextButton,
  TextButtonSize,
  TextVariant,
  TextColor,
  BoxFlexDirection,
  BoxAlignItems,
  Tag,
} from '@metamask/design-system-react';

import { useI18nContext } from '../../../hooks/useI18nContext';
import { isBeta } from '../../../../shared/lib/build-types';
import VisitSupportDataConsentModal, {
  useOpenSupport,
} from '../../../components/app/modals/visit-support-data-consent-modal';
import { Divider } from '../shared';
import { useBoolean } from '../../../hooks/useBoolean';

export default function AboutInfo(): React.ReactElement {
  const t = useI18nContext();

  const {
    value: isVisitSupportDataConsentModalOpen,
    toggle: toggleVisitSupportDataConsentModal,
  } = useBoolean();
  // Both "Visit our support center" and "Contact us" open the same support
  // site, so both go through the data sharing consent flow (as on mobile).
  const openSupport = useOpenSupport(toggleVisitSupportDataConsentModal);

  const version = process.env.METAMASK_VERSION ?? '';

  function renderInfoLinks(): React.ReactElement {
    const privacyUrl = 'https://metamask.io/privacy.html';
    const siteUrl = 'https://metamask.io/';

    const linkProps = {
      size: TextButtonSize.BodyMd,
      className:
        'w-full justify-start text-default !bg-transparent p-0 text-left',
    };

    const linkItemProps = {
      paddingTop: 3 as const,
      paddingBottom: 3 as const,
      className: 'w-full',
    };

    return (
      <Box
        flexDirection={BoxFlexDirection.Column}
        alignItems={BoxAlignItems.Start}
        className="w-full"
      >
        <Box {...linkItemProps}>
          <TextButton asChild {...linkProps}>
            <a href={privacyUrl} target="_blank" rel="noopener noreferrer">
              {t('privacyMsg')}
            </a>
          </TextButton>
        </Box>
        <Box {...linkItemProps}>
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
          <Box {...linkItemProps}>
            <TextButton asChild {...linkProps}>
              <a
                href="https://metamask.io/beta-terms"
                target="_blank"
                rel="noopener noreferrer"
              >
                {t('betaTerms')} <Tag>{t('new')}</Tag>
              </a>
            </TextButton>
          </Box>
        ) : null}
        <Box {...linkItemProps}>
          <TextButton asChild {...linkProps}>
            <a
              href="https://raw.githubusercontent.com/MetaMask/metamask-extension/main/attribution.txt"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('attributions')}
            </a>
          </TextButton>
        </Box>
        <Divider />
        <Box {...linkItemProps}>
          <TextButton onClick={openSupport} {...linkProps}>
            {t('supportCenter')}
          </TextButton>
        </Box>
        <Box {...linkItemProps}>
          <TextButton asChild {...linkProps}>
            <a href={siteUrl} target="_blank" rel="noopener noreferrer">
              {t('visitWebSite')}
            </a>
          </TextButton>
        </Box>
        <Box {...linkItemProps}>
          <TextButton
            onClick={openSupport}
            data-testid="about-tab-contact-us-button"
            {...linkProps}
          >
            {t('contactUs')}
          </TextButton>
        </Box>
      </Box>
    );
  }

  const versionLabel = isBeta()
    ? t('betaMetamaskVersion')
    : t('metamaskVersion');

  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      alignItems={BoxAlignItems.Center}
      paddingTop={3}
      paddingBottom={6}
      gap={4}
      paddingHorizontal={4}
    >
      <Box>
        <img
          src="./images/logo/metamask-fox.svg"
          alt="MetaMask Logo"
          className="info-tab__logo w-24 h-24"
        />
      </Box>
      <Box data-testid="info-tab-version">
        <Text
          variant={TextVariant.BodySm}
          color={TextColor.TextAlternative}
          className="info-tab__version-number"
        >
          {versionLabel} {version}
        </Text>
      </Box>
      {renderInfoLinks()}
      {isVisitSupportDataConsentModalOpen && (
        <VisitSupportDataConsentModal
          isOpen={isVisitSupportDataConsentModalOpen}
          onClose={toggleVisitSupportDataConsentModal}
        />
      )}
    </Box>
  );
}
