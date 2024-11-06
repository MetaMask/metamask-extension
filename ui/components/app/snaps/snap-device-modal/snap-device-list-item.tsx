import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Box,
  Button,
  ButtonSize,
  Checkbox,
  Icon,
  IconName,
  IconSize,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  ButtonLink,
} from '../../../component-library';
import {
  BackgroundColor,
  BlockSize,
  BorderRadius,
  Display,
  FlexDirection,
  IconColor,
  TextAlign,
  TextVariant,
  JustifyContent,
} from '../../../../helpers/constants/design-system';
import {
  hasDevicePairing,
  getPairedDevices,
} from '../../../../selectors/snaps';
import {
  rejectSnapDevicePairing,
  resolveSnapDevicePairing,
} from '../../../../store/actions';
import { getEnvironmentType } from '../../../../../app/scripts/lib/util';
import { ENVIRONMENT_TYPE_FULLSCREEN } from '../../../../../shared/constants/app';
import { SNAPS_DEVICE_ROUTE } from '../../../../helpers/constants/routes';

export const SnapDeviceListItem = ({ device }) => {
  const dispatch = useDispatch();

  const handleDeviceSelected = () => {
    dispatch(resolveSnapDevicePairing(device.id));
  };

  return (
    <Box className="snap-device-list-item" padding={2} onClick={handleDeviceSelected}>
      <Text key={device.name}>{device.name}</Text>
    </Box>
  );
};
