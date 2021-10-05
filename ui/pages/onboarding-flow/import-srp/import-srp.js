import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import StepProgressBar from '../../../components/app/step-progress-bar';
import Box from '../../../components/ui/box';
import Button from '../../../components/ui/button';
import Typography from '../../../components/ui/typography';
import {
  FONT_WEIGHT,
  TEXT_ALIGN,
  TYPOGRAPHY,
} from '../../../helpers/constants/design-system';
import { ONBOARDING_CREATE_PASSWORD_ROUTE } from '../../../helpers/constants/routes';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { SRPTextArea } from './srp-text-area';

export default function ImportSRP({ setSecretRecoveryPhrase }) {
  const t = useI18nContext();
  const history = useHistory();
  return (
    <div className="import-srp">
      <StepProgressBar stage={1} />
      <div className="import-srp__header">
        {/* <Box
        margin={4}
        textAlign={TEXT_ALIGN.CENTER}
        justifyContent={JUSTIFY_CONTENT.CENTER}
        alignItems={ALIGN_ITEMS.CENTER}
    > */}
        <Typography variant={TYPOGRAPHY.H2} fontWeight={FONT_WEIGHT.BOLD}>
          {t('importExistingWalletTitle')}
        </Typography>
        <Typography variant={TYPOGRAPHY.H4}>
          {t('importExistingWalletDescription', [
            <a type="link">{t('learnMore')}</a>,
          ])}
        </Typography>
        {/* </Box> */}
      </div>
      <div className="import-srp__actions">
        <Box textAlign={TEXT_ALIGN.LEFT}>
          <Typography variant={TYPOGRAPHY.H4}>
            {t('secretRecoveryPhrase')}
          </Typography>
          <SRPTextArea setSecretRecoveryPhrase={setSecretRecoveryPhrase} />
          <Button
            type="primary"
            rouded
            large
            onClick={() => history.push(ONBOARDING_CREATE_PASSWORD_ROUTE)}
          >
            {t('confirmSeedPhrase')}
          </Button>
        </Box>
      </div>
    </div>
  );
}
