import React from 'react';
import { useSelector } from 'react-redux';

import {
  BorderColor,
  BackgroundColor,
} from '../../../helpers/constants/design-system';
import { getCurrentNetwork } from '../../../selectors';
import { PickerNetwork, AvatarNetworkSize } from '../../component-library';

export default function NetworkDisplay() {
  const currentNetwork = useSelector(getCurrentNetwork);

  return (
    <PickerNetwork
      className="network-display"
      label={currentNetwork?.nickname}
      labelProps={{ 'data-testid': 'network-display' }}
      src={currentNetwork?.rpcPrefs?.imageUrl}
      iconProps={{ display: 'none' }} // do not show the dropdown icon
      avatarNetworkProps={{ size: AvatarNetworkSize.Xs }}
      as="div" // do not render as a button
      backgroundColor={BackgroundColor.transparent}
      borderWidth={0}
      borderColor={BorderColor.borderMuted}
    />
  );
}
