import React from 'react';
import { useHistory } from 'react-router-dom';
import Box from '../../../components/ui/box';
import Typography from '../../../components/ui/typography';
import Button from '../../../components/ui/button';
import {
  FONT_WEIGHT,
  TEXT_ALIGN,
  TYPOGRAPHY,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  ONBOARDING_PIN_EXTENSION_ROUTE,
  ONBOARDING_PRIVACY_SETTINGS_ROUTE,
} from '../../../helpers/constants/routes';

export default function CreationSuccessful() {
  const history = useHistory();
  const t = useI18nContext();
  return (
    <div className="creation-successful">
      <Box textAlign={TEXT_ALIGN.CENTER} margin={6}>
        <img src="./images/tada.png" />
        <Typography
          variant={TYPOGRAPHY.H2}
          fontWeight={FONT_WEIGHT.BOLD}
          margin={6}
        >
          {t('walletCreationSuccessTitle')}
        </Typography>
        <Typography variant={TYPOGRAPHY.H4}>
          {t('walletCreationSuccessDetail')}
        </Typography>
      </Box>
      <Typography variant={TYPOGRAPHY.H4}>{t('remember')}</Typography>
      <ul>
        <li>
          <Typography variant={TYPOGRAPHY.H4}>
            {t('walletCreationSuccessReminder1')}
          </Typography>
        </li>
        <li>
          <Typography variant={TYPOGRAPHY.H4}>
            {t('walletCreationSuccessReminder2')}
          </Typography>
        </li>
        <li>
          <Typography variant={TYPOGRAPHY.H4}>
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
            {t('learnMore')}
          </Button>
        </li>
      </ul>
      <Box marginTop={6} className="creation-successful__actions">
        <Button
          type="link"
          onClick={() => history.push(ONBOARDING_PRIVACY_SETTINGS_ROUTE)}
        >
          {t('setAdvancedPrivacySettings')}
        </Button>
        <Button
          type="primary"
          large
          rounded
          onClick={() => history.push(ONBOARDING_PIN_EXTENSION_ROUTE)}
        >
          {t('done')}
        </Button>
      </Box>
    </div>
  );
}
