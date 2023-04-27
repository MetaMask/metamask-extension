import React, { useContext } from 'react';
import { useHistory } from 'react-router-dom';
import { useSelector } from 'react-redux';

import Box from '../../../components/ui/box';
import Typography from '../../../components/ui/typography';
import Button from '../../../components/ui/button';
import {
  FONT_WEIGHT,
  TEXT_ALIGN,
  TypographyVariant,
  AlignItems,
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

export default function CreationSuccessful() {
  const history = useHistory();
  const t = useI18nContext();
  const trackEvent = useContext(MetaMetricsContext);
  const firstTimeFlowType = useSelector(getFirstTimeFlowType);

  return (
    <div className="creation-successful" data-testid="creation-successful">
      <Box textAlign={TEXT_ALIGN.CENTER}>
        <img src="./images/tada.png" />
        <Typography
          variant={TypographyVariant.H2}
          fontWeight={FONT_WEIGHT.BOLD}
          margin={6}
        >
          {t('walletCreationSuccessTitle')}
        </Typography>
        <Typography variant={TypographyVariant.H4}>
          {t('walletCreationSuccessDetail')}
        </Typography>
      </Box>
      <Typography
        variant={TypographyVariant.H4}
        boxProps={{ align: AlignItems.flexStart }}
        marginLeft={12}
      >
        {t('remember')}
      </Typography>
      <ul>
        <li>
          <Typography variant={TypographyVariant.H4}>
            {isBeta()
              ? t('betaWalletCreationSuccessReminder1')
              : t('walletCreationSuccessReminder1')}
          </Typography>
        </li>
        <li>
          <Typography variant={TypographyVariant.H4}>
            {isBeta()
              ? t('betaWalletCreationSuccessReminder2')
              : t('walletCreationSuccessReminder2')}
          </Typography>
        </li>
        <li>
          <Typography variant={TypographyVariant.H4}>
            {t('walletCreationSuccessReminder3', [
              <span
                key="creation-successful__bold"
                className="creation-successful__bold"
              >
                {t('walletCreationSuccessReminder3BoldSection')}
              </span>,
            ])}
          </Typography>
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
              },
            });
            history.push(ONBOARDING_PIN_EXTENSION_ROUTE);
          }}
        >
          {t('gotIt')}
        </Button>
      </Box>
    </div>
  );
}
