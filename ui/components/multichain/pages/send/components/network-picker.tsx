import React from 'react';
import { useSelector } from 'react-redux';
import { getCurrentNetwork } from '../../../../../selectors';
import { PickerNetwork } from '../../../../component-library';
import { SendPageRow } from '.';

export const SendPageNetworkPicker = () => {
  const currentNetwork = useSelector(getCurrentNetwork);

  return (
    <SendPageRow>
      <PickerNetwork
        label={currentNetwork?.nickname}
        src={currentNetwork?.rpcPrefs?.imageUrl}
      />
    </SendPageRow>
  );
};
