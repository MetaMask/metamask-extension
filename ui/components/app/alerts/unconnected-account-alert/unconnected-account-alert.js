import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { ALERT_STATE } from '../../../../ducks/alerts';
import {
  connectAccount,
  dismissAlert,
  dismissAndDisableAlert,
  getAlertState,
  switchToAccount,
} from '../../../../ducks/alerts/unconnected-account';
import {
  getOriginOfCurrentTab,
  getOrderedConnectedAccountsForActiveTab,
  getSelectedAddress,
  getSelectedIdentity,
} from '../../../../selectors';
import { isExtensionUrl, getURLHost } from '../../../../helpers/utils/util';

import Tooltip from '../../../ui/tooltip';
import ConnectedAccountsList from '../../connected-accounts-list';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import {
  Box,
  Icon,
  IconName,
  Checkbox,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  Text,
  BannerAlert,
  BannerAlertSeverity,
  ButtonSize,
} from '../../../component-library';
import {
  AlignItems,
  Display,
  FlexDirection,
  IconColor,
} from '../../../../helpers/constants/design-system';

const { ERROR, LOADING } = ALERT_STATE;

const UnconnectedAccountAlert = () => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const alertState = useSelector(getAlertState);
  const connectedAccounts = useSelector(
    getOrderedConnectedAccountsForActiveTab,
  );
  const origin = useSelector(getOriginOfCurrentTab);
  const selectedIdentity = useSelector(getSelectedIdentity);
  const selectedAddress = useSelector(getSelectedAddress);
  const [dontShowThisAgain, setDontShowThisAgain] = useState(false);

  const onClose = async () => {
    return dontShowThisAgain
      ? await dispatch(dismissAndDisableAlert())
      : dispatch(dismissAlert());
  };

  return (
    <Modal className="unconnected-account-alert" isOpen>
      <ModalOverlay />
      <ModalContent
        modalDialogProps={{
          display: Display.Flex,
          flexDirection: FlexDirection.Column,
          gap: 4,
          paddingLeft: 0,
          paddingRight: 0,
        }}
      >
        <ModalHeader onClose={onClose} paddingLeft={4} paddingRight={4}>
          {isExtensionUrl(origin) ? t('currentExtension') : getURLHost(origin)}
        </ModalHeader>
        <Text paddingLeft={4} paddingRight={4}>
          {t('currentAccountNotConnected')}
        </Text>
        <ConnectedAccountsList
          accountToConnect={selectedIdentity}
          connectAccount={() => dispatch(connectAccount(selectedAddress))}
          connectedAccounts={connectedAccounts}
          selectedAddress={selectedAddress}
          setSelectedAddress={(address) => dispatch(switchToAccount(address))}
          shouldRenderListOptions={false}
        />

        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          gap={4}
          paddingLeft={4}
          paddingRight={4}
        >
          {/* {alertState === ERROR ? ( */}
          <BannerAlert
            severity={BannerAlertSeverity.Danger}
            description={t('failureMessage')}
          />
          {/* ) : null} */}

          <Checkbox
            isChecked={dontShowThisAgain}
            onClick={() => setDontShowThisAgain((checked) => !checked)}
            label={
              <>
                {t('dontShowThisAgain')}
                <Tooltip position="top" title={t('alertDisableTooltip')}>
                  <Icon
                    name={IconName.Info}
                    color={IconColor.iconAlternative}
                  />
                </Tooltip>
              </>
            }
            labelProps={{
              display: Display.Flex,
              alignItems: AlignItems.center,
              gap: 1,
            }}
          />
          <Button
            disabled={alertState === LOADING}
            onClick={onClose}
            size={ButtonSize.Lg}
          >
            {t('dismiss')}
          </Button>
        </Box>
      </ModalContent>
    </Modal>
  );
};

export default UnconnectedAccountAlert;
