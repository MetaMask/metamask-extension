import React from 'react';
import { useSelector } from 'react-redux';
import { selectIsMetamaskNotificationsFeatureSeen } from '../../selectors/metamask-notifications/metamask-notifications';
import { Tag } from '../../components/component-library';
import {
  BackgroundColor,
  BorderRadius,
  BorderStyle,
  TextColor,
  TextVariant,
} from '../../helpers/constants/design-system';
import { useI18nContext } from '../../hooks/useI18nContext';

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export function NewFeatureTag() {
  const t = useI18nContext();

  const isMetamaskNotificationsFeatureSeen = useSelector(
    selectIsMetamaskNotificationsFeatureSeen,
  );

  if (isMetamaskNotificationsFeatureSeen) {
    return null;
  }

  return (
    <Tag
      backgroundColor={BackgroundColor.infoMuted}
      borderStyle={BorderStyle.none}
      borderRadius={BorderRadius.MD}
      label={t('new')}
      labelProps={{
        color: TextColor.primaryDefault,
        variant: TextVariant.bodySm,
      }}
      paddingLeft={2}
      paddingRight={2}
    />
  );
}
