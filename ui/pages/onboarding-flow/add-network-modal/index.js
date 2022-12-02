import React from 'react';
import { useDispatch } from 'react-redux';
import { useI18nContext } from '../../../hooks/useI18nContext';

import { hideModal } from '../../../store/actions';

import Typography from '../../../components/ui/typography/typography';
import {
  TEXT_ALIGN,
  TYPOGRAPHY,
  FONT_WEIGHT,
} from '../../../helpers/constants/design-system';

import NetworksForm from '../../settings/networks-tab/networks-form/networks-form';

export default function AddNetworkModal() {
  const dispatch = useDispatch();
  const t = useI18nContext();

  const closeCallback = () =>
    dispatch(hideModal({ name: 'ONBOARDING_ADD_NETWORK' }));

  return (
    <>
      <Typography
        variant={TYPOGRAPHY.H4}
        align={TEXT_ALIGN.CENTER}
        fontWeight={FONT_WEIGHT.BOLD}
        paddingTop={4}
      >
        {t('onboardingMetametricsModalTitle')}
      </Typography>
      <NetworksForm
        addNewNetwork
        networksToRender={[]}
        cancelCallback={closeCallback}
        submitCallback={closeCallback}
      />
    </>
  );
}
