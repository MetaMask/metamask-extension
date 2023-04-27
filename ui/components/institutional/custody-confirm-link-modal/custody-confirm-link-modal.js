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
import { hideModal, setSelectedAddress } from '../../../store/actions';
import { getMetaMaskAccountsRaw } from '../../../selectors';
import {
  getMMIAddressFromModalOrAddress,
  getCustodyAccountDetails,
  getMMIConfiguration,
} from '../../../selectors/institutional/selectors';
import Box from '../../ui/box/box';
import {
  AlignItems,
  DISPLAY,
  FLEX_DIRECTION,
  FontWeight,
  JustifyContent,
  TextAlign,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { Text, Button, BUTTON_VARIANT } from '../../component-library';

const CustodyConfirmLink = () => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const mmiActions = mmiActionsFactory();
  const trackEvent = useContext(MetaMetricsContext);
  const mmiAccounts = useSelector(getMetaMaskAccountsRaw);
  const address = useSelector(getMMIAddressFromModalOrAddress);
  const custodyAccountDetails = useSelector(getCustodyAccountDetails);
  const { custodians } = useSelector(getMMIConfiguration);
  const { custodianName } =
    custodyAccountDetails[toChecksumHexAddress(address)] || {};
  const { displayName, iconUrl } = custodians.find(
    (item) => item.name === custodianName || {},
  );
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
      event: MetaMetricsEventName.UserClickedDeepLink,
    });
    dispatch(mmiActions.setWaitForConfirmDeepLinkDialog(false));
    dispatch(hideModal());
  };

  return (
    <Box display={DISPLAY.FLEX} flexDirection={FLEX_DIRECTION.COLUMN}>
      {iconUrl ? (
        <Box
          display={DISPLAY.FLEX}
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
          display={DISPLAY.FLEX}
          alignItems={AlignItems.center}
          justifyContent={JustifyContent.center}
          paddingTop={5}
        >
          <span>{custodianName}</span>
        </Box>
      )}
      <Text
        as="h4"
        paddingTop={4}
        variant={TextVariant.headingLg}
        textAlign={TextAlign.Center}
        fontWeight={FontWeight.bold}
      >
        {t('awaitingApproval')}
      </Text>
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
        variant={BUTTON_VARIANT.PRIMARY}
        className="custody-confirm-link__btn"
        onClick={onClick}
      >
        {action || (action ? t('openCustodianApp', [displayName]) : t('close'))}
      </Button>
    </Box>
  );
};

export default withModalProps(CustodyConfirmLink);
