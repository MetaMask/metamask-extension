import React, { useContext } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { MetaMetricsContext } from '../../../../../contexts/metametrics';
import {
  MetaMetricsEventName,
  MetaMetricsEventCategory,
} from '../../../../../../shared/constants/metametrics';
import Button from '../../../../ui/button';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import withModalProps from '../../../../../helpers/higher-order-components/with-modal-props';
import { toChecksumHexAddress } from '../../../../../../shared/modules/hexstring-utils';
import { mmiActionsFactory } from '../../../../../store/institutional/institution-background';
import { showAccountDetail } from '../../../../../store/institutional/institution-actions';
import { hideModal } from '../../../../../store/actions';
import { getMetaMaskAccountsRaw } from '../../../../../selectors';
import {
  getMMIAddressFromModalOrAddress,
  getCustodyAccountDetails,
  getMMIConfiguration,
} from '../../../../../selectors/institutional/selectors';

const CustodyConfirmLink = () => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const mmiActions = mmiActionsFactory();
  const trackEvent = useContext(MetaMetricsContext);
  const mmiAccounts = useSelector(getMetaMaskAccountsRaw);
  const address = useSelector(getMMIAddressFromModalOrAddress);
  const { custodians } = useSelector(getCustodyAccountDetails);
  const custodyAccountDetails = useSelector(getMMIConfiguration);
  const link = useSelector(
    (state) => state.appState.modal.modalState.props.link,
  );
  const { custodianName } =
    custodyAccountDetails[toChecksumHexAddress(address)] || {};

  const renderCustodyInfo = (custodian, deepLink) => {
    let img;

    if (custodian.iconUrl) {
      img = (
        <div className="custody-confirm-link__img-container">
          <img
            className="custody-confirm-link__img"
            src="/images/logo/mmi-logo.svg"
            alt="MMI logo"
          />
          {'>'}
          <img
            className="custody-confirm-link__img"
            src={custodian.iconUrl}
            alt={custodian.displayName}
          />
        </div>
      );
    } else {
      img = (
        <div className="custody-confirm-link__img">
          <span>{custodian.displayName}</span>
        </div>
      );
    }

    return (
      <>
        {img}
        <p className="custody-confirm-link__title">{t('awaitingApproval')}</p>
        <p className="custody-confirm-link__description">
          {deepLink && deepLink.text
            ? deepLink.text
            : t('custodyDeeplinkDescription', [custodian.displayName])}
        </p>
      </>
    );
  };

  const renderCustodyButton = (custodian, deepLink) => {
    if (!deepLink) {
      return t('close');
    }

    if (deepLink.action) {
      return deepLink.action;
    }

    return t('openCustodianApp', [custodian.displayName]);
  };

  const custodian = custodians.find((item) => item.name === custodianName);

  return (
    <div className="custody-confirm-link">
      {renderCustodyInfo(custodian, link)}
      <Button
        type="primary"
        className="custody-confirm-link__btn"
        onClick={() => {
          if (link && link.url) {
            global.platform.openTab({
              url: link.url,
            });
          }

          if (link && link.ethereum) {
            const mmiAccountsList = Object.keys(mmiAccounts);
            const ethAccounts = link.ethereum.accounts;

            const ethAccount = mmiAccountsList.find((account) => {
              return ethAccounts.find(
                (value) => value.toLowerCase() === account.toLowerCase(),
              );
            });

            ethAccount && dispatch(showAccountDetail(ethAccount.toLowerCase()));
          }

          trackEvent({
            category: MetaMetricsEventCategory.MMI,
            event: MetaMetricsEventName.UserClickedDeepLink,
          });
          dispatch(mmiActions.setWaitForConfirmDeepLinkDialog(false));
          dispatch(hideModal());
        }}
      >
        {renderCustodyButton(custodian, link)}
      </Button>
    </div>
  );
};

export default withModalProps(CustodyConfirmLink);
