import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getCurrentNetwork } from '../../../../../selectors';
import { PickerNetwork } from '../../../../component-library';
import { toggleNetworkMenu } from '../../../../../store/actions';
import { SendPageRow } from '.';

export const SendPageNetworkPicker = () => {
  const currentNetwork = useSelector(getCurrentNetwork);
  const dispatch = useDispatch();

  return (
    <SendPageRow>
      <PickerNetwork
        label={currentNetwork?.nickname}
        src={currentNetwork?.rpcPrefs?.imageUrl}
        onClick={() => dispatch(toggleNetworkMenu())}
        data-testid="send-page-network-picker"
      />
    </SendPageRow>
  );
};
