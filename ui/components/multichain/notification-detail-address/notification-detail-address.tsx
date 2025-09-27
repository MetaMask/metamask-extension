import React from 'react';
import type { FC } from 'react';
import { NotificationDetail } from '../notification-detail';
import { NotificationDetailCopyButton } from '../notification-detail-copy-button';
import { Text } from '../../component-library';
import {
  FontWeight,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { shortenAddress } from '../../../helpers/utils/util';
import { PreferredAvatar } from '../../app/preferred-avatar';
import { toChecksumHexAddress } from '../../../../shared/modules/hexstring-utils';

export type NotificationDetailAddressProps = {
  side: string;
  address: string;
};

const SideText: FC<{ side: string }> = ({ side }) => (
  <Text variant={TextVariant.bodyLgMedium} fontWeight={FontWeight.Medium}>
    {side}
  </Text>
);

/**
 * A component to display a side text.
 *
 * @param props - The component props.
 * @param props.side - The side text to display.
 * @param props.address - The address to display.
 * @returns The rendered component.
 */
export const NotificationDetailAddress: FC<NotificationDetailAddressProps> = ({
  side,
  address,
}): JSX.Element => {
  const checksummedAddress = toChecksumHexAddress(address);
  const displayAddress = shortenAddress(checksummedAddress);

  return (
    <NotificationDetail
      icon={<PreferredAvatar address={address} />}
      primaryTextLeft={<SideText side={side} />}
      secondaryTextLeft={
        <NotificationDetailCopyButton
          text={address}
          displayText={displayAddress}
        />
      }
    />
  );
};
