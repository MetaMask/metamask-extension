import React from 'react';
import { useDispatch } from 'react-redux';
import { useI18nContext } from '../../../hooks/useI18nContext';

import { hideModal } from '../../../store/actions';

import { Text } from '../../../components/component-library/text/text';
import Box from '../../../components/ui/box/box';
import {
  TEXT_ALIGN,
  TextVariant,
} from '../../../helpers/constants/design-system';

import NetworksForm from '../../settings/networks-tab/networks-form/networks-form';

export default function AddNetworkModal() {
  const dispatch = useDispatch();
  const t = useI18nContext();

  const closeCallback = () =>
    dispatch(hideModal({ name: 'ONBOARDING_ADD_NETWORK' }));

  return (
    <>
      <Box paddingTop={4}>
        <Text
          variant={TextVariant.headingSm}
          align={TEXT_ALIGN.CENTER}
          fontWeight="bold"
        >
          {t('onboardingMetametricsModalTitle')}
        </Text>
      </Box>
      <NetworksForm
        addNewNetwork
        restrictHeight
        setActiveOnSubmit
        networksToRender={[]}
        cancelCallback={closeCallback}
        submitCallback={closeCallback}
      />
    </>
  );
}
