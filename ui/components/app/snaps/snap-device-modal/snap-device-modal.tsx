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
  transitionFromPopupToFullscreen,
} from '../../../../store/actions';
import { getEnvironmentType } from '../../../../../app/scripts/lib/util';
import { ENVIRONMENT_TYPE_FULLSCREEN } from '../../../../../shared/constants/app';
import { SNAPS_DEVICE_ROUTE } from '../../../../helpers/constants/routes';
import { SnapDeviceListItem } from './snap-device-list-item';

export const SnapDeviceModal = ({ snapId }) => {
  const dispatch = useDispatch();
  const hasPairing = useSelector((state) => hasDevicePairing(state, snapId));

  const devices = useSelector(getPairedDevices);

  const handleClose = () => {
    dispatch(rejectSnapDevicePairing());
  };

  // TODO: Allow filters

  const handleConnectNewDevice = () => {
    if (getEnvironmentType() !== ENVIRONMENT_TYPE_FULLSCREEN) {
      dispatch(transitionFromPopupToFullscreen(SNAPS_DEVICE_ROUTE));
      return;
    }

    navigator.hid.requestDevice({ filters: [] }).then((grantedDevices) => {
      console.log(grantedDevices);
      const device = grantedDevices[0];
      if (device) {
        dispatch(resolveSnapDevicePairing(device));
      }
    });
  };

  return (
    <Modal isOpen={hasPairing} onClose={handleClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader onClose={handleClose}>
          <Text
            variant={TextVariant.headingSm}
            textAlign={TextAlign.Center}
            ellipsis
          >
            Choose a device
          </Text>
        </ModalHeader>
        <ModalBody>
          <Text variant={TextVariant.bodyMd}>
            Select a previously used device or connect a new device to use with
            MetaMask.
          </Text>

          {devices.length > 0 ? (
            <Box
              display={Display.Flex}
              justifyContent={JustifyContent.center}
              flexDirection={FlexDirection.Column}
              backgroundColor={BackgroundColor.backgroundAlternative}
              padding={2}
              borderRadius={BorderRadius.SM}
              marginTop={2}
              gap={2}
            >
              {devices.map((device) => (
                <SnapDeviceListItem key={device.name} device={device} />
              ))}
            </Box>
          ) : (
            <Box display={Display.Flex} justifyContent={JustifyContent.center}>
              No devices found
            </Box>
          )}
        </ModalBody>
        <ModalFooter>
          <Box display={Display.Flex} justifyContent={JustifyContent.center}>
            <ButtonLink onClick={handleConnectNewDevice}>
              Connect new device
            </ButtonLink>
          </Box>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
