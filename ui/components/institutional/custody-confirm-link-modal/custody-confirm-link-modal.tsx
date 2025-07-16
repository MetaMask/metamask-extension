import React, { useContext } from 'react';
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
import { setSelectedInternalAccount } from '../../../store/actions';
import { getInternalAccounts } from '../../../selectors';
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
  Modal,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
  Box,
  ButtonVariant,
} from '../../component-library';

type CustodyConfirmLinkProps = {
  hideModal: () => void;
};

type ModalStateProps = {
  url?: string;
  ethereum?: {
    accounts: string[];
  };
  text?: string;
  action?: string;
};

type State = {
  appState: {
    modal: {
      modalState: {
        props: {
          link: ModalStateProps;
        };
      };
    };
  };
};

const CustodyConfirmLink: React.FC<CustodyConfirmLinkProps> = ({
  hideModal,
}) => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const mmiActions = mmiActionsFactory();
  const trackEvent = useContext(MetaMetricsContext);
  const mmiAccounts = useSelector(getInternalAccounts);
  const address = useSelector(getMMIAddressFromModalOrAddress);
  const custodyAccountDetails = useSelector(getCustodyAccountDetails) || {};
  const { url, ethereum, text, action } = useSelector(
    (state: State) => state.appState.modal.modalState.props.link || {},
  );
  const { custodians } = useSelector(getMMIConfiguration) || {};
  const { custodianName } =
    custodyAccountDetails[toChecksumHexAddress(address)] || {};
  const { displayName, iconUrl } =
    custodians?.find((item) => item.envName === custodianName) || {};

  const onClick = () => {
    if (url) {
      global.platform.openTab({ url });
    }

    if (ethereum) {
      const ethAccount = Object.values(mmiAccounts)
        .map((internalAccount: { address: string }) => internalAccount.address)
        .find((account: string) =>
          ethereum.accounts.includes(account.toLowerCase()),
        );

      ethAccount && dispatch(setSelectedInternalAccount(ethAccount));
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
                alt={custodianName as string}
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
            variant={ButtonVariant.Primary}
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

export default withModalProps(CustodyConfirmLink);
