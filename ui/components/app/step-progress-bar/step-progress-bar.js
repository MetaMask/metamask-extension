import React from 'react';
import classnames from 'classnames';
import PropTypes from 'prop-types';
import { capitalize } from 'lodash';
import { useI18nContext } from '../../../hooks/useI18nContext';
import Box from '../../ui/box';
import { BLOCK_SIZES } from '../../../helpers/constants/design-system';

export const threeStepStages = {
  PASSWORD_CREATE: 1,
  RECOVERY_PHRASE_VIDEO: 2,
  RECOVERY_PHRASE_REVIEW: 3,
  RECOVERY_PHRASE_CONFIRM: 4,
  ONBOARDING_COMPLETE: 5,
};

export const twoStepStages = {
  RECOVERY_PHRASE_CONFIRM: 1,
  PASSWORD_CREATE: 2,
};

export function ThreeStepProgressBar({ stage, ...boxProps }) {
  const t = useI18nContext();
  return (
    <Box {...boxProps}>
      <ul className="progressbar">
        <li
          className={classnames({
            active: stage >= 1,
            complete: stage > 1,
          })}
        >
          {capitalize(t('createPassword'))}
        </li>
        <li
          className={classnames({
            active: stage >= 2,
            complete: stage > 3,
          })}
        >
          {capitalize(t('secureWallet'))}
        </li>
        <li
          className={classnames({
            active: stage >= 4,
            complete: stage > 5,
          })}
        >
          {capitalize(t('confirmRecoveryPhrase'))}
        </li>
      </ul>
    </Box>
  );
}

export function TwoStepProgressBar({ stage, ...boxProps }) {
  const t = useI18nContext();
  return (
    <Box width={BLOCK_SIZES.FULL} {...boxProps}>
      <ul className="progressbar two-steps">
        <li
          className={classnames({
            active: stage >= 1,
            complete: stage > 1,
          })}
        >
          {capitalize(t('confirmRecoveryPhrase'))}
        </li>
        <li
          className={classnames('two-steps', {
            active: stage >= 2,
            complete: stage > 2,
          })}
        >
          {capitalize(t('createPassword'))}
        </li>
      </ul>
    </Box>
  );
}

ThreeStepProgressBar.propTypes = {
  stage: PropTypes.number,
  ...Box.propTypes,
};

TwoStepProgressBar.propTypes = {
  stage: PropTypes.number,
  ...Box.propTypes,
};
