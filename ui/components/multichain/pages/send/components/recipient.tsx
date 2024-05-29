import React, { useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { I18nContext } from '../../../../../contexts/i18n';
import {
  addHistoryEntry,
  getRecipient,
  getRecipientUserInput,
  updateRecipient,
  updateRecipientUserInput,
} from '../../../../../ducks/send';
import {
  getDomainError,
  getDomainResolutions,
  getDomainType,
  getDomainWarning,
} from '../../../../../ducks/domains';
import {
  BannerAlert,
  BannerAlertSeverity,
  Box,
} from '../../../../component-library';
import { Tab, Tabs } from '../../../../ui/tabs';
import { SendPageAddressBook, SendPageRow, SendPageYourAccounts } from '.';
import DomainInputResolutionCell from '../../../../../pages/confirmations/send/send-content/add-recipient/domain-input-resolution-cell';

const CONTACTS_TAB_KEY = 'contacts';
const ACCOUNTS_TAB_KEY = 'accounts';


export const SendPageRecipient = () => {
  const t = useContext(I18nContext);
  const dispatch = useDispatch();

  const recipient = useSelector(getRecipient);
  const userInput = useSelector(getRecipientUserInput) || '';

  const domainResolutions = useSelector(getDomainResolutions) || [];
  const domainError = useSelector(getDomainError);
  const domainWarning = useSelector(getDomainWarning);
  const domainType = useSelector(getDomainType);

  const showErrorBanner =
    domainError || (recipient.error && recipient.error !== 'required');
  const showWarningBanner =
    !showErrorBanner && (domainWarning || recipient.warning);

  const onClick = (address, nickname, type = 'user input') => {
    dispatch(
      addHistoryEntry(
        `sendFlow - User clicked recipient from ${type}. address: ${address}, nickname ${nickname}`,
      ),
    );
    dispatch(updateRecipient({ address, nickname }));
    dispatch(updateRecipientUserInput(address));
  }

  let contents;
  if (recipient.address) {
    contents = (
      <DomainInputResolutionCell
        domainType={domainType}
        address={recipient.address}
        domainName={recipient.nickname}
        onClick={() => onClick(recipient.address, recipient.nickname)}
      />
    );
  } else if (domainResolutions?.length > 0 && !recipient.error) {
    contents = domainResolutions.map((domainResolution) => {
      const {
        resolvedAddress,
        resolvingSnap,
        addressBookEntryName,
        protocol,
      } = domainResolution;
      return (
        <DomainInputResolutionCell
          key={`${resolvedAddress}${resolvingSnap}${protocol}`}
          domainType={domainType}
          address={resolvedAddress}
          domainName={addressBookEntryName || userInput}
          onClick={() => onClick(resolvedAddress, addressBookEntryName || userInput, 'Domain resolution')}
          protocol={protocol}
          resolvingSnap={resolvingSnap}
        />
      );
    });
  } else {
    contents = (
      <Tabs
        defaultActiveTabKey={userInput.length > 0 ? CONTACTS_TAB_KEY : ACCOUNTS_TAB_KEY}
      >
        {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          <Tab tabKey={ACCOUNTS_TAB_KEY} name={t('yourAccounts')}>
            <SendPageYourAccounts />
          </Tab>
        }
        {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          <Tab
            tabKey={CONTACTS_TAB_KEY}
            name={t('contacts')}
            data-testid="send-contacts-tab"
          >
            <SendPageAddressBook />
          </Tab>
        }
      </Tabs>
    );
  }

  return (
    <>
      {showErrorBanner ? (
        <SendPageRow>
          <BannerAlert
            severity={BannerAlertSeverity.Danger}
            data-testid="send-recipient-error"
          >
            {t(domainError ?? recipient.error)}
          </BannerAlert>
        </SendPageRow>
      ) : null}
      {showWarningBanner ? (
        <SendPageRow>
          <BannerAlert
            severity={BannerAlertSeverity.Warning}
            data-testid="send-recipient-warning"
          >
            {t(domainWarning ?? recipient.warning)}
          </BannerAlert>
        </SendPageRow>
      ) : null}
      <Box className="multichain-send-page__recipient">{contents}</Box>
    </>
  );
};
