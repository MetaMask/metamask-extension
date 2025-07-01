import React, { useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import {
  Box,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
} from '../../component-library';
import QrCodeView from '../../ui/qr-code-view';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getInternalAccountByAddress } from '../../../selectors';
import {
  AlignItems,
  Display,
  FlexDirection,
} from '../../../helpers/constants/design-system';
import { endTrace, TraceName } from '../../../../shared/lib/trace';

export const ReceiveModal = ({ address, token, onClose }) => {
  const t = useI18nContext();
  const {
    metadata: { name },
  } = useSelector((state) => getInternalAccountByAddress(state, address));
  const data = useMemo(() => ({ data: address, token }), [address, token]);

  useEffect(() => {
    endTrace({ name: TraceName.ReceiveModal });
    console.log('token', token);
  }, []);

  return (
    <Modal isOpen onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader marginBottom={4} onClose={onClose}>
          {t('receive')}
        </ModalHeader>
        <Box
          display={Display.Flex}
          alignItems={AlignItems.center}
          flexDirection={FlexDirection.Column}
          paddingInlineEnd={4}
          paddingInlineStart={4}
          gap={2}
          style={{ overflowY: 'auto' }}
        >
          <div style={{ textAlign: 'center', fontSize: '20px' }}>
            USDT (ERC-20)
          </div>
          <div
            className="attention"
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              padding: '13px',
              boxSizing: 'border-box',
            }}
          >
            <div className="attention-ico">
              <img src="../images/icons/attention.svg" />
            </div>
            <div className="attention-des">
              <ul>
                <li>
                  At the moment, CryptoBridge only supports ERC-20 transfers.
                  <span>
                    Please double-check that the recipient’s wallet address is
                    an ERC-20 address.
                  </span>
                </li>
                <li>
                  Sending funds to the wrong network{' '}
                  <span>may result in permanent loss of funds.</span>
                </li>
                <li>
                  The system cannot detect network mismatches, and{' '}
                  <span>
                    CryptoBridge is not responsible for loss of funds due to
                    sending funds
                  </span>{' '}
                  to an incompatible blockchain network.
                </li>
              </ul>
            </div>
          </div>
          <div className="attention-tips">
            Send only Ethereum network assets to this address
          </div>
          <QrCodeView Qr={data} accountName={name} />
        </Box>
      </ModalContent>
    </Modal>
  );
};

ReceiveModal.propTypes = {
  address: PropTypes.string.isRequired,
  token: PropTypes.object,
  onClose: PropTypes.func.isRequired,
};
