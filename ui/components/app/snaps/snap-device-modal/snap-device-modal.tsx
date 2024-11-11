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
  getDevicePairing,
  getPairedDevices,
} from '../../../../selectors/snaps';
import {
  rejectSnapDevicePairing,
  transitionFromPopupToFullscreen,
} from '../../../../store/actions';
import { getEnvironmentType } from '../../../../../app/scripts/lib/util';
import { ENVIRONMENT_TYPE_FULLSCREEN } from '../../../../../shared/constants/app';
import { SNAPS_DEVICE_ROUTE } from '../../../../helpers/constants/routes';
import { SnapDeviceListItem } from './snap-device-list-item';

export const SnapDeviceModal = ({ snapId }) => {
  const dispatch = useDispatch();
  const devices = useSelector(getPairedDevices);
  const pairing = useSelector((state) => getDevicePairing(state, snapId));
  const hasPairing = pairing !== null;

  const filteredDevices = devices.filter((device) => {
    if (device.type !== pairing?.type) {
      return false;
    }

    if (pairing?.filters) {
      return pairing.filters.some(
        (filter) =>
          filter.vendorId === device.vendorId ||
          filter.productId === device.productId,
      );
    }

    return true;
  });

  const handleClose = () => {
    dispatch(rejectSnapDevicePairing());
  };

  const handleConnectNewDevice = () => {
    if (getEnvironmentType() !== ENVIRONMENT_TYPE_FULLSCREEN) {
      dispatch(transitionFromPopupToFullscreen(SNAPS_DEVICE_ROUTE));
      return;
    }

    /**navigator.hid.requestDevice({ filters: [] }).then((grantedDevices) => {
      const device = grantedDevices[0];
      if (device) {
        dispatch(resolveSnapDevicePairing(device));
      }
    });**/
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

          {filteredDevices.length > 0 ? (
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
              {filteredDevices.map((device) => (
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
