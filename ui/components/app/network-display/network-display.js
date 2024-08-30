import React from 'react';
import { useSelector } from 'react-redux';

import {
  BorderColor,
  BackgroundColor,
} from '../../../helpers/constants/design-system';
import {
  getCurrentNetwork,
  getNetworkConfigurationsByChainId,
} from '../../../selectors';
import { PickerNetwork, AvatarNetworkSize } from '../../component-library';

export default function NetworkDisplay() {
  const networkConfigurationsByChainId = useSelector(
    getNetworkConfigurationsByChainId,
  );

  const { chainId, rpcPrefs } = useSelector(getCurrentNetwork);
  const networkName = networkConfigurationsByChainId?.[chainId]?.name ?? '';

  return (
    <PickerNetwork
      className="network-display"
      label={networkName}
      labelProps={{ 'data-testid': 'network-display' }}
      src={rpcPrefs?.imageUrl}
      iconProps={{ display: 'none' }} // do not show the dropdown icon
      avatarNetworkProps={{ size: AvatarNetworkSize.Xs }}
      as="div" // do not render as a button
      backgroundColor={BackgroundColor.transparent}
      borderWidth={0}
      borderColor={BorderColor.borderMuted}
    />
  );
}
