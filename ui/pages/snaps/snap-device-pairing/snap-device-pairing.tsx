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
import { getAnyDevicePairing } from '../../../selectors/snaps';

export const SnapDevicePairing = () => {
  const dispatch = useDispatch();
  const pairing = useSelector(getAnyDevicePairing);

  const handleConnectNewDevice = () => {
    navigator.hid
      .requestDevice({ filters: pairing?.filters ?? [] })
      .then((grantedDevices) => {
        const device = grantedDevices[0];
        if (device) {
          const { vendorId, productId } = device;
          const id = `hid:${vendorId}:${productId}`;
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
