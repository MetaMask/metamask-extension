import React from 'react';
import { useDispatch } from 'react-redux';
import { Box, Text } from '../../../component-library';
import { resolveSnapDevicePairing } from '../../../../store/actions';

export const SnapDeviceListItem = ({ device }) => {
  const dispatch = useDispatch();

  const handleDeviceSelected = () => {
    dispatch(resolveSnapDevicePairing(device.id));
  };

  return (
    <Box
      className="snap-device-list-item"
      padding={2}
      onClick={handleDeviceSelected}
    >
      <Text key={device.name}>{device.name}</Text>
    </Box>
  );
};
