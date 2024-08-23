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
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../../../shared/constants/metametrics';
import { MetaMetricsContext } from '../../../../../contexts/metametrics';
import { DomainInputResolutionCell } from './domain-input-resolution-cell';
import { SendPageAddressBook, SendPageRow, SendPageYourAccounts } from '.';

const CONTACTS_TAB_KEY = 'contacts';
const ACCOUNTS_TAB_KEY = 'accounts';

export const SendPageRecipient = () => {
  const t = useContext(I18nContext);
  const dispatch = useDispatch();
  const trackEvent = useContext(MetaMetricsContext);

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

  type DomainResolution = {
    resolvedAddress: string;
    resolvingSnap?: string;
    protocol: string;
    addressBookEntryName?: string;
    domainName: string;
  };

  const onClick = (
    address: string,
    nickname: string,
    type: string = 'user input',
  ) => {
    dispatch(
      addHistoryEntry(
        `sendFlow - User clicked recipient from ${type}. address: ${address}, nickname ${nickname}`,
      ),
    );
    trackEvent(
      {
        event: MetaMetricsEventName.sendRecipientSelected,
        category: MetaMetricsEventCategory.Send,
        properties: {
          location: 'send page recipient screen',
          inputType: type,
        },
      },
      { excludeMetaMetricsId: false },
    );
    dispatch(updateRecipient({ address, nickname }));
    dispatch(updateRecipientUserInput(address));
  };

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
    contents = domainResolutions.map((domainResolution: DomainResolution) => {
      const {
        resolvedAddress,
        resolvingSnap,
        addressBookEntryName,
        protocol,
        domainName,
      } = domainResolution;
      return (
        <DomainInputResolutionCell
          key={`${resolvedAddress}${resolvingSnap}${protocol}`}
          domainType={domainType}
          address={resolvedAddress}
          domainName={addressBookEntryName ?? domainName}
          onClick={() =>
            onClick(
              resolvedAddress,
              addressBookEntryName ?? domainName,
              'Domain resolution',
            )
          }
          protocol={protocol}
          resolvingSnap={resolvingSnap}
        />
      );
    });
  } else {
    contents = (
      <Tabs
        defaultActiveTabKey={
          userInput.length > 0 ? CONTACTS_TAB_KEY : ACCOUNTS_TAB_KEY
        }
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
