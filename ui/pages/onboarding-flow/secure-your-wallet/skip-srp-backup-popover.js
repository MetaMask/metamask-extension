import PropTypes from 'prop-types';
import React, { useState, useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';

import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import {
  Text,
  Icon,
  IconName,
  IconSize,
} from '../../../components/component-library';
import Box from '../../../components/ui/box';
import Button from '../../../components/ui/button';
import Checkbox from '../../../components/ui/check-box';
import Popover from '../../../components/ui/popover';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  AlignItems,
  IconColor,
  FLEX_DIRECTION,
  JustifyContent,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { ONBOARDING_COMPLETION_ROUTE } from '../../../helpers/constants/routes';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getHDEntropyIndex } from '../../../selectors/selectors';
import { setSeedPhraseBackedUp } from '../../../store/actions';

export default function SkipSRPBackup({ handleClose }) {
  const [checked, setChecked] = useState(false);
  const t = useI18nContext();
  const history = useHistory();
  const dispatch = useDispatch();
  const hdEntropyIndex = useSelector(getHDEntropyIndex);
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
                properties: {
                  hd_entropy_index: hdEntropyIndex,
                },
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
                properties: {
                  hd_entropy_index: hdEntropyIndex,
                },
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
        <Text variant={TextVariant.headingMd}>{t('skipAccountSecurity')}</Text>
        <Box justifyContent={JustifyContent.center} margin={3}>
          <label className="skip-srp-backup-popover__label">
            <Checkbox
              className="skip-srp-backup-popover__checkbox"
              onClick={() => setChecked(!checked)}
              checked={checked}
              dataTestId="skip-srp-backup-popover-checkbox"
            />
            <Text className="skip-srp-backup-popover__details">
              {t('skipAccountSecurityDetails')}
            </Text>
          </label>
        </Box>
      </Box>
    </Popover>
  );
}

SkipSRPBackup.propTypes = {
  handleClose: PropTypes.func,
};
