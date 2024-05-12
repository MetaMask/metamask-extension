import React, { useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
// import { captureException } from '@sentry/browser';
import SnapListItem from '../snaps/snap-list-item';
import {
  Box,
  ButtonPrimary,
  ButtonPrimarySize,
  Modal,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  ModalFooter,
  Text,
} from '../../component-library';
import {
  Display,
  FlexDirection,
  TextAlign,
  TextColor,
} from '../../../helpers/constants/design-system';
import { getSnapsList } from '../../../selectors';
import { getFaucetProviderTestToken } from '../../../store/actions';
import { BUYABLE_TEST_CHAINS_IDS } from '../../../../app/scripts/controllers/faucets/faucet';

type ModalFaucetProps = {
  accountAddress: string;
  chainId: BUYABLE_TEST_CHAINS_IDS;
  faucetSnapSourceIds: string[];
  onClose: () => void;
};

const ModalFaucet: React.FC<ModalFaucetProps> = ({
  accountAddress,
  chainId,
  faucetSnapSourceIds,
  onClose,
}) => {
  const dispatch = useDispatch();

  const [selectedSnapId, setSelectedSnapId] = useState(null);
  // const [error, setError] = useState<string>('');

  const snapsList = useSelector((state) =>
    getSnapsList(state, faucetSnapSourceIds),
  );

  const handleClose = useCallback(async () => {
    onClose();
  }, [dispatch, onClose]);

  // const handleError = useCallback(
  //   (message: string, e: Error) => {
  //     const errorMessage = `${message} Please try again or contact support if the problem persists.`;
  //     console.error(message, e);
  //     setError(errorMessage);
  //     captureException(e);
  //   },
  //   [setError],
  // );

  return (
    <Modal
      className="wallet-overview__modal-faucet"
      isOpen
      onClose={handleClose}
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader onClose={handleClose}>Faucet</ModalHeader>
        {/* {error && <Text color={TextColor.errorDefault}>{error}</Text>} */}
        <Text
          as="p"
          paddingRight={2}
          paddingLeft={2}
          color={TextColor.textDefault}
          textAlign={TextAlign.Center}
        >
          Select a MetaMask Snap Faucet
        </Text>
        <Box
          padding={4}
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
        >
          {snapsList.map((snap) => {
            const isSelected = selectedSnapId === snap.id;

            let className = '';
            if (selectedSnapId) {
              className = isSelected ? 'is-selected' : 'is-notSelected';
            }

            return (
              <SnapListItem
                className={className}
                key={snap.key}
                packageName={snap.packageName}
                name={snap.name}
                onClick={() => {
                  setSelectedSnapId(snap.id);
                }}
                snapId={snap.id}
                showUpdateDot={isSelected}
              />
            );
          })}
        </Box>
        <ModalFooter>
          <ButtonPrimary
            onClick={() => {
              if (!selectedSnapId) {
                return;
              }

              // FIXME: we could add back in await here and handle response
              dispatch(
                getFaucetProviderTestToken({
                  chainId,
                  sourceId: selectedSnapId,
                  address: accountAddress,
                }),
              );
              onClose();
            }}
            size={ButtonPrimarySize.Lg}
            block
            disabled={!selectedSnapId}
          >
            Receive ETH
          </ButtonPrimary>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ModalFaucet;
