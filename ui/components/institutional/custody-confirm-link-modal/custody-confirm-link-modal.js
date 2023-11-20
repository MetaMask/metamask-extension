import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { useSelector, useDispatch } from 'react-redux';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  MetaMetricsEventName,
  MetaMetricsEventCategory,
} from '../../../../shared/constants/metametrics';
import { useI18nContext } from '../../../hooks/useI18nContext';
import withModalProps from '../../../helpers/higher-order-components/with-modal-props';
import { toChecksumHexAddress } from '../../../../shared/modules/hexstring-utils';
import { mmiActionsFactory } from '../../../store/institutional/institution-background';
import { setSelectedAddress } from '../../../store/actions';
import { getMetaMaskIdentities } from '../../../selectors';
import {
  getMMIAddressFromModalOrAddress,
  getCustodyAccountDetails,
  getMMIConfiguration,
} from '../../../selectors/institutional/selectors';
import {
  AlignItems,
  Display,
  FlexDirection,
  JustifyContent,
  TextAlign,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import {
  Button,
  BUTTON_VARIANT,
  Modal,
  ModalHeader,
  ModalContent,
  ModalOverlay,
  Text,
  Box,
} from '../../component-library';

const CustodyConfirmLink = ({ hideModal }) => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const mmiActions = mmiActionsFactory();
  const trackEvent = useContext(MetaMetricsContext);
  const mmiAccounts = useSelector(getMetaMaskIdentities);
  const address = useSelector(getMMIAddressFromModalOrAddress);
  const custodyAccountDetails = useSelector(getCustodyAccountDetails);
  const { custodians } = useSelector(getMMIConfiguration);
  const { custodianName } =
    custodyAccountDetails[toChecksumHexAddress(address)] || {};
  const { displayName, iconUrl } =
    custodians.find((item) => item.envName === custodianName) || {};
  const { url, ethereum, text, action } = useSelector(
    (state) => state.appState.modal.modalState.props.link || {},
  );

  const onClick = () => {
    if (url) {
      global.platform.openTab({ url });
    }

    if (ethereum) {
      const ethAccount = Object.keys(mmiAccounts).find((account) =>
        ethereum.accounts.includes(account.toLowerCase()),
      );

      ethAccount && dispatch(setSelectedAddress(ethAccount.toLowerCase()));
    }

    trackEvent({
      category: MetaMetricsEventCategory.MMI,
      event: MetaMetricsEventName.DeeplinkClicked,
    });
    dispatch(mmiActions.setWaitForConfirmDeepLinkDialog(false));
    hideModal();
  };

  return (
    <Modal isOpen onClose={hideModal}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader onClose={hideModal}>{t('awaitingApproval')}</ModalHeader>
        <Box display={Display.Flex} flexDirection={FlexDirection.Column}>
          {iconUrl ? (
            <Box
              display={Display.Flex}
              alignItems={AlignItems.center}
              justifyContent={JustifyContent.center}
              paddingTop={5}
            >
              <img
                className="custody-confirm-link__img"
                src="/images/logo/mmi-logo.svg"
                alt="MMI logo"
              />
              {'>'}
              <img
                className="custody-confirm-link__img"
                src={iconUrl}
                alt={custodianName}
              />
            </Box>
          ) : (
            <Box
              display={Display.Flex}
              alignItems={AlignItems.center}
              justifyContent={JustifyContent.center}
              paddingTop={5}
            >
              <span>{custodianName}</span>
            </Box>
          )}
          <Text
            as="p"
            paddingTop={4}
            paddingRight={5}
            paddingLeft={5}
            paddingBottom={10}
            textAlign={TextAlign.Center}
            color={TextColor.textDefault}
            variant={TextVariant.bodySm}
            className="custody-confirm-link__description"
          >
            {text || t('custodyDeeplinkDescription', [displayName])}
          </Text>
          <Button
            data-testid="custody-confirm-link__btn"
            variant={BUTTON_VARIANT.PRIMARY}
            className="custody-confirm-link__btn"
            onClick={onClick}
          >
            {action ||
              (action ? t('openCustodianApp', [displayName]) : t('close'))}
          </Button>
        </Box>
      </ModalContent>
    </Modal>
  );
};

CustodyConfirmLink.propTypes = {
  hideModal: PropTypes.func.isRequired,
};

export default withModalProps(CustodyConfirmLink);
