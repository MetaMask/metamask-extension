import React, { useState, useContext } from 'react';
import PropTypes from 'prop-types';
import { useHistory } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useI18nContext } from '../../../hooks/useI18nContext';
import Button from '../../../components/ui/button';
import Popover from '../../../components/ui/popover';
import Box from '../../../components/ui/box';
import Typography from '../../../components/ui/typography';
import {
  AlignItems,
  IconColor,
  FLEX_DIRECTION,
  FONT_WEIGHT,
  JustifyContent,
  TypographyVariant,
} from '../../../helpers/constants/design-system';
import { setSeedPhraseBackedUp } from '../../../store/actions';
import Checkbox from '../../../components/ui/check-box';
import { ONBOARDING_COMPLETION_ROUTE } from '../../../helpers/constants/routes';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  Icon,
  IconName,
  IconSize,
} from '../../../components/component-library';

export default function SkipSRPBackup({ handleClose }) {
  const [checked, setChecked] = useState(false);
  const t = useI18nContext();
  const history = useHistory();
  const dispatch = useDispatch();
  const trackEvent = useContext(MetaMetricsContext);

  return (
    <Popover
      className="skip-srp-backup-popover"
      footer={
        <Box
          className="skip-srp-backup-popover__footer"
          justifyContent={JustifyContent.center}
          alignItems={AlignItems.center}
        >
          <Button
            onClick={() => {
              trackEvent({
                category: MetaMetricsEventCategory.Onboarding,
                event:
                  MetaMetricsEventName.OnboardingWalletSecuritySkipCanceled,
              });
              handleClose();
            }}
            type="secondary"
            rounded
          >
            {t('goBack')}
          </Button>
          <Button
            data-testid="skip-srp-backup"
            disabled={!checked}
            type="primary"
            rounded
            onClick={async () => {
              await dispatch(setSeedPhraseBackedUp(false));
              trackEvent({
                category: MetaMetricsEventCategory.Onboarding,
                event:
                  MetaMetricsEventName.OnboardingWalletSecuritySkipConfirmed,
              });
              history.push(ONBOARDING_COMPLETION_ROUTE);
            }}
          >
            {t('skip')}
          </Button>
        </Box>
      }
    >
      <Box
        flexDirection={FLEX_DIRECTION.COLUMN}
        alignItems={AlignItems.center}
        justifyContent={JustifyContent.center}
        margin={4}
      >
        <Icon
          name={IconName.Danger}
          size={IconSize.Xl}
          className="skip-srp-backup-popover__icon"
          color={IconColor.errorDefault}
        />
        <Typography
          variant={TypographyVariant.H3}
          fontWeight={FONT_WEIGHT.BOLD}
        >
          {t('skipAccountSecurity')}
        </Typography>
        <Box justifyContent={JustifyContent.center} margin={3}>
          <label className="skip-srp-backup-popover__label">
            <Checkbox
              className="skip-srp-backup-popover__checkbox"
              onClick={() => setChecked(!checked)}
              checked={checked}
              dataTestId="skip-srp-backup-popover-checkbox"
            />
            <Typography
              className="skip-srp-backup-popover__details"
              variant={TypographyVariant.H7}
            >
              {t('skipAccountSecurityDetails')}
            </Typography>
          </label>
        </Box>
      </Box>
    </Popover>
  );
}

SkipSRPBackup.propTypes = {
  handleClose: PropTypes.func,
};
