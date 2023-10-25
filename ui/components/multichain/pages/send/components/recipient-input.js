import React, { useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  BannerAlert,
  BannerAlertSeverity,
  Box,
  Label,
} from '../../../../component-library';
import DomainInput from '../../../../../pages/send/send-content/add-recipient/domain-input';
import { I18nContext } from '../../../../../contexts/i18n';
import {
  addHistoryEntry,
  getIsUsingMyAccountForRecipientSearch,
  getRecipient,
  getRecipientUserInput,
  resetRecipientInput,
  updateRecipient,
  updateRecipientUserInput,
} from '../../../../../ducks/send';
import { showQrScanner } from '../../../../../store/actions';
import { MetaMetricsContext } from '../../../../../contexts/metametrics';
import { MetaMetricsEventCategory } from '../../../../../../shared/constants/metametrics';
import {
  getDomainError,
  getDomainResolution,
  getDomainWarning,
} from '../../../../../ducks/domains';
import { getAddressBookEntry } from '../../../../../selectors';
import { ellipsify } from '../../../../../pages/send/send.utils';
import Confusable from '../../../../ui/confusable';
import Identicon from '../../../../ui/identicon';
import { SendPageAddressBook, SendPageRow, SendPageYourAccount } from '.';

const renderExplicitAddress = (address, nickname, type, dispatch) => {
  return (
    <div
      key={address}
      className="send__select-recipient-wrapper__group-item"
      onClick={() => {
        dispatch(
          addHistoryEntry(
            `sendFlow - User clicked recipient from ${type}. address: ${address}, nickname ${nickname}`,
          ),
        );
        dispatch(updateRecipient({ address, nickname }));
        dispatch(updateRecipientUserInput(address));
      }}
    >
      <Identicon address={address} diameter={28} />
      <div className="send__select-recipient-wrapper__group-item__content">
        <div className="send__select-recipient-wrapper__group-item__title">
          {nickname ? <Confusable input={nickname} /> : ellipsify(address)}
        </div>
        {nickname && (
          <div className="send__select-recipient-wrapper__group-item__subtitle">
            {ellipsify(address)}
          </div>
        )}
      </div>
    </div>
  );
};

export const SendPageRecipientInput = () => {
  const t = useContext(I18nContext);
  const dispatch = useDispatch();
  const trackEvent = useContext(MetaMetricsContext);

  const recipient = useSelector(getRecipient);
  const userInput = useSelector(getRecipientUserInput);
  const isUsingMyAccountsForRecipientSearch = useSelector(
    getIsUsingMyAccountForRecipientSearch,
  );

  const domainResolution = useSelector(getDomainResolution);
  const domainError = useSelector(getDomainError);
  const domainWarning = useSelector(getDomainWarning);

  let addressBookEntryName = '';
  const entry = useSelector((state) =>
    getAddressBookEntry(state, domainResolution),
  );
  if (domainResolution && entry?.name) {
    addressBookEntryName = entry.name;
  }

  const showErrorBanner =
    domainError || (recipient.error && recipient.error !== 'required');
  const showWarningBanner =
    !showErrorBanner && (domainWarning || recipient.warning);

  let contents;
  if (recipient.address) {
    contents = renderExplicitAddress(
      recipient.address,
      recipient.nickname,
      'validated user input',
      dispatch,
    );
  } else if (domainResolution && !recipient.error) {
    contents = renderExplicitAddress(
      domainResolution,
      addressBookEntryName || userInput,
      'ENS resolution',
      dispatch,
    );
  } else {
    contents = (
      <>
        {userInput ? null : <SendPageYourAccount />}
        <SendPageAddressBook />
      </>
    );
  }

  return (
    <SendPageRow>
      <Label paddingBottom={2}>{t('to')}</Label>
      <DomainInput
        userInput={userInput}
        onChange={(address) => dispatch(updateRecipientUserInput(address))}
        onValidAddressTyped={async (address) => {
          dispatch(
            addHistoryEntry(`sendFlow - Valid address typed ${address}`),
          );
          await dispatch(updateRecipientUserInput(address));
          dispatch(updateRecipient({ address, nickname: '' }));
        }}
        internalSearch={isUsingMyAccountsForRecipientSearch}
        selectedAddress={recipient.address}
        selectedName={recipient.nickname}
        onPaste={(text) => {
          dispatch(
            addHistoryEntry(
              `sendFlow - User pasted ${text} into address field`,
            ),
          );
        }}
        onReset={() => dispatch(resetRecipientInput())}
        scanQrCode={() => {
          trackEvent({
            event: 'Used QR scanner',
            category: MetaMetricsEventCategory.Transactions,
            properties: {
              action: 'Edit Screen',
              legacy_event: true,
            },
          });
          dispatch(showQrScanner());
        }}
      />
      {showErrorBanner ? (
        <BannerAlert severity={BannerAlertSeverity.Danger} marginTop={6}>
          {t(domainError ?? recipient.error)}
        </BannerAlert>
      ) : null}
      {showWarningBanner ? (
        <BannerAlert severity={BannerAlertSeverity.Warning} marginTop={6}>
          {t(domainWarning ?? recipient.warning)}
        </BannerAlert>
      ) : null}
      <Box marginTop={6}>{contents}</Box>
    </SendPageRow>
  );
};
