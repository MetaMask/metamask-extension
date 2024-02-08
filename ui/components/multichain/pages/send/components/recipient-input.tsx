import React, { useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Label } from '../../../../component-library';
import DomainInput from '../../../../../pages/confirmations/send/send-content/add-recipient/domain-input';
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
import { SendPageRow } from '.';

export const SendPageRecipientInput = () => {
  const t = useContext(I18nContext);
  const dispatch = useDispatch();
  const trackEvent = useContext(MetaMetricsContext);

  const recipient = useSelector(getRecipient);
  const userInput = useSelector(getRecipientUserInput);
  const isUsingMyAccountsForRecipientSearch = useSelector(
    getIsUsingMyAccountForRecipientSearch,
  );

  return (
    <SendPageRow>
      <Label paddingBottom={2}>{t('to')}</Label>
      <DomainInput
        userInput={userInput}
        onChange={(address: string) =>
          dispatch(updateRecipientUserInput(address))
        }
        onValidAddressTyped={async (address: string) => {
          dispatch(
            addHistoryEntry(`sendFlow - Valid address typed ${address}`),
          );
          await dispatch(updateRecipientUserInput(address));
          dispatch(updateRecipient({ address, nickname: '' }));
        }}
        internalSearch={isUsingMyAccountsForRecipientSearch}
        selectedAddress={recipient.address}
        selectedName={recipient.nickname}
        onPaste={(text: string) => {
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
    </SendPageRow>
  );
};
