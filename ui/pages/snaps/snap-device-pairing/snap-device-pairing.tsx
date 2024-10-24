import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
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
} from '../../../components/component-library';
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
} from '../../../helpers/constants/design-system';
import {
  rejectSnapDevicePairing,
  resolveSnapDevicePairing,
  transitionFromFullscreenToPopup,
} from '../../../store/actions';
import { hasAnyDevicePairing } from '../../../selectors/snaps';

export const SnapDevicePairing = () => {
  const dispatch = useDispatch();
  const hasPairing = useSelector(hasAnyDevicePairing);

  // TODO: Allow filters
  const handleConnectNewDevice = () => {
    navigator.hid.requestDevice({ filters: [] }).then((grantedDevices) => {
      const device = grantedDevices[0];
      if (device) {
        const { vendorId, productId, productName } = device;
        const id = `HID-${vendorId}-${productId}`;
        dispatch(resolveSnapDevicePairing(id));
        dispatch(transitionFromFullscreenToPopup());
      }
    });
  };

  const handleClose = () => {
    dispatch(rejectSnapDevicePairing());
    dispatch(transitionFromFullscreenToPopup());
  };

  // TODO: Redirect away if not in pairing mode

  return (
    <>
      <Modal isOpen={true} onClose={handleClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader onClose={handleClose}>
            <Text
              variant={TextVariant.headingSm}
              textAlign={TextAlign.Center}
              ellipsis
            >
              Connect new device
            </Text>
          </ModalHeader>
          <ModalBody>
            Make sure your device is connected and approve the relevant browser
            requests.
          </ModalBody>
          <ModalFooter>
            <Box display={Display.Flex} justifyContent={JustifyContent.center}>
              <ButtonLink onClick={handleConnectNewDevice}>
                Connect device
              </ButtonLink>
            </Box>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};
