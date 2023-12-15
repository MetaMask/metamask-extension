import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useDispatch } from 'react-redux';
import QRCode from 'qrcode.react';
import { useHistory } from 'react-router-dom';

import { Modal, ModalOverlay } from '../../component-library';
import { ModalContent } from '../../component-library/modal-content/deprecated';
import { ModalHeader } from '../../component-library/modal-header/deprecated';

import { setCompletedOnboarding } from '../../../store/actions';

import { CONFIRM_ADD_CUSTODIAN_TOKEN } from '../../../helpers/constants/routes';

export default function QRCodeModal({ fromOnboarding, onClose }) {
  const [responseData, setResponseData] = useState(null);
  const history = useHistory();
  const dispatch = useDispatch();
  const currentQRCode = 'some-token-will-do';

  useEffect(() => {
    const intervalId = setInterval(async () => {
      try {
        const response = await fetch(
          'https://mmi-qr-server.adaptable.app/connect-requests/latest',
        );
        const data = await response.json();

        if (data) {
          await fetch(
            'https://mmi-qr-server.adaptable.app/connect-requests/latest',
            {
              method: 'DELETE',
            },
          );

          data.custodian = data.environment;
          const tempConnectRequest = JSON.stringify(data);

          // eslint-disable-next-line no-undef
          localStorage.setItem('tempConnectRequest', tempConnectRequest);

          clearInterval(intervalId);
          setResponseData(data);
          console.log(responseData);

          if (fromOnboarding) {
            await dispatch(setCompletedOnboarding());
          }

          history.push(CONFIRM_ADD_CUSTODIAN_TOKEN);
          onClose();
        }
      } catch (error) {
        console.error('Failed to fetch connect request data:', error);
      }
    }, 5000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <Modal isOpen onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader onClose={onClose}>Connect custodian</ModalHeader>

        <div
          style={{
            padding: 20,
            backgroundColor: 'var(--qr-code-white-background)',
          }}
        >
          <QRCode value={currentQRCode.toUpperCase()} size={250} />
        </div>
      </ModalContent>
    </Modal>
  );
}

QRCodeModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  fromOnboarding: PropTypes.bool,
};
