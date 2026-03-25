import React from 'react';

import { Text, TextVariant } from '@metamask/design-system-react';
import { ConfirmInfoRow } from '../../../../../../../components/app/confirm/info/row';
import { useI18nContext } from '../../../../../../../hooks/useI18nContext';
import { DateAndTimeRow } from './date-and-time-row';

/**
 * Component for displaying the expiration date or "Never expires" message.
 * Shows the formatted date if an expiry timestamp is provided, otherwise displays "Never expires".
 *
 * @param props - The component props
 * @param props.expiry - The expiration timestamp in seconds (null if no expiry)
 * @returns JSX element containing the expiration information
 */
export const Expiry: React.FC<{
  expiry: number | null;
}> = ({ expiry }) => {
  const t = useI18nContext();

  if (expiry) {
    return (
      <DateAndTimeRow timestamp={expiry} label={t('confirmFieldExpiration')} />
    );
  }

  return (
    <ConfirmInfoRow label={t('confirmFieldExpiration')}>
      <Text variant={TextVariant.BodyMd}>{t('confirmFieldNeverExpires')}</Text>
    </ConfirmInfoRow>
  );
};
