import React from 'react';
import classnames from 'classnames';
import PropTypes from 'prop-types';
import { useI18nContext } from '../../../hooks/useI18nContext';
import Box from '../../ui/box';

const stages = {
  PASSWORD_CREATE: 1,
  SEED_PHRASE_VIDEO: 2,
  SEED_PHRASE_REVIEW: 3,
  SEED_PHRASE_CONFIRM: 4,
  ONBOARDING_COMPLETE: 5,
};
export default function StepProgressBar({ stage = 'PASSWORD_CREATE' }) {
  const t = useI18nContext();
  return (
    <Box margin={4}>
      <ul className="progressbar">
        <li
          className={classnames({
            active: stages[stage] >= 1,
            complete: stages[stage] >= 1,
          })}
        >
          {t('createPassword')}
        </li>
        <li
          className={classnames({
            active: stages[stage] >= 2,
            complete: stages[stage] >= 3,
          })}
        >
          {t('secureWallet')}
        </li>
        <li
          className={classnames({
            active: stages[stage] >= 4,
            complete: stages[stage] >= 5,
          })}
        >
          {t('confirmSeedPhrase')}
        </li>
      </ul>
    </Box>
  );
}

StepProgressBar.propTypes = {
  stage: PropTypes.string,
};
