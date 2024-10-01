import React, { useContext } from 'react';
import { useHistory } from 'react-router-dom';
import { useSelector } from 'react-redux';

import Box from '../../../components/ui/box';
import { Text } from '../../../components/component-library';
import Button from '../../../components/ui/button';
import {
  FontWeight,
  TextAlign,
  AlignItems,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  ONBOARDING_PIN_EXTENSION_ROUTE,
  ONBOARDING_PRIVACY_SETTINGS_ROUTE,
} from '../../../helpers/constants/routes';
import { isBeta } from '../../../helpers/utils/build-types';
import { getFirstTimeFlowType } from '../../../selectors';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { useCreateSession } from '../../../hooks/metamask-notifications/useCreateSession';
import { selectIsProfileSyncingEnabled } from '../../../selectors/metamask-notifications/profile-syncing';

export default function CreationSuccessful() {
  const history = useHistory();
  const t = useI18nContext();
  const trackEvent = useContext(MetaMetricsContext);
  const firstTimeFlowType = useSelector(getFirstTimeFlowType);

  const { createSession } = useCreateSession();

  const isProfileSyncingEnabled = useSelector(selectIsProfileSyncingEnabled);

  return (
    <div className="creation-successful" data-testid="creation-successful">
      <Box textAlign={TextAlign.Center}>
        <img src="./images/tada.png" />
        <Text
          variant={TextVariant.headingLg}
          fontWeight={FontWeight.Bold}
          margin={6}
        >
          {t('walletCreationSuccessTitle')}
        </Text>
        <Text variant={TextVariant.headingSm} fontWeight={FontWeight.Normal}>
          {t('walletCreationSuccessDetail')}
        </Text>
      </Box>
      <Text
        variant={TextVariant.headingSm}
        alignItems={AlignItems.flexStart}
        fontWeight={FontWeight.Normal}
        marginLeft={12}
      >
        {t('remember')}
      </Text>
      <ul>
        <li>
          <Text variant={TextVariant.headingSm} fontWeight={FontWeight.Normal}>
            {isBeta()
              ? t('betaWalletCreationSuccessReminder1')
              : t('walletCreationSuccessReminder1')}
          </Text>
        </li>
        <li>
          <Text variant={TextVariant.headingSm} fontWeight={FontWeight.Normal}>
            {isBeta()
              ? t('betaWalletCreationSuccessReminder2')
              : t('walletCreationSuccessReminder2')}
          </Text>
        </li>
        <li>
          <Text variant={TextVariant.headingSm} fontWeight={FontWeight.Normal}>
            {t('walletCreationSuccessReminder3', [
              <span
                key="creation-successful__bold"
                className="creation-successful__bold"
              >
                {t('walletCreationSuccessReminder3BoldSection')}
              </span>,
            ])}
          </Text>
        </li>
        <li>
          <Button
            href="https://community.metamask.io/t/what-is-a-secret-recovery-phrase-and-how-to-keep-your-crypto-wallet-secure/3440"
            target="_blank"
            type="link"
            rel="noopener noreferrer"
          >
            {t('learnMoreUpperCase')}
          </Button>
        </li>
      </ul>
      <Box marginTop={6} className="creation-successful__actions">
        <Button
          type="link"
          onClick={() => history.push(ONBOARDING_PRIVACY_SETTINGS_ROUTE)}
        >
          {t('advancedConfiguration')}
        </Button>
        <Button
          data-testid="onboarding-complete-done"
          type="primary"
          large
          rounded
          onClick={() => {
            trackEvent({
              category: MetaMetricsEventCategory.Onboarding,
              event: MetaMetricsEventName.OnboardingWalletCreationComplete,
              properties: {
                method: firstTimeFlowType,
                is_profile_syncing_enabled: isProfileSyncingEnabled,
              },
            });
            createSession();
            history.push(ONBOARDING_PIN_EXTENSION_ROUTE);
          }}
        >
          {t('gotIt')}
        </Button>
      </Box>
    </div>
  );
}
