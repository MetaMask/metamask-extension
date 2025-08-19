import React, { useCallback, useContext } from 'react';
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
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../../../shared/constants/metametrics';
import { shortenAddress } from '../../../../../helpers/utils/util';
import { toChecksumHexAddress } from '../../../../../../shared/modules/hexstring-utils';
import { SendPageRow } from './send-page-row';

export const SendPageRecipientInput = () => {
  const t = useContext(I18nContext);
  const dispatch = useDispatch();
  const { trackEvent } = useContext(MetaMetricsContext);

  const recipient = useSelector(getRecipient);
  const userInput = useSelector(getRecipientUserInput);
  const isUsingMyAccountsForRecipientSearch = useSelector(
    getIsUsingMyAccountForRecipientSearch,
  );

  const onChange = useCallback(
    (address: string) => {
      dispatch(updateRecipientUserInput(address));
    },
    [dispatch],
  );

  const onValidAddressTyped = useCallback(
    async (address: string) => {
      dispatch(addHistoryEntry(`sendFlow - Valid address typed ${address}`));
      await dispatch(updateRecipientUserInput(address));
      trackEvent(
        {
          event: MetaMetricsEventName.sendRecipientSelected,
          category: MetaMetricsEventCategory.Send,
          properties: {
            location: 'send page recipient input',
            inputType: 'user input',
          },
        },
        { excludeMetaMetricsId: false },
      );
      dispatch(updateRecipient({ address, nickname: '' }));
    },
    [dispatch, trackEvent],
  );

  const onPaste = useCallback(
    (text: string) => {
      dispatch(
        addHistoryEntry(`sendFlow - User pasted ${text} into address field`),
      );
    },
    [dispatch],
  );

  const scanQrCode = useCallback(() => {
    trackEvent({
      event: 'Used QR scanner',
      category: MetaMetricsEventCategory.Transactions,
      properties: {
        action: 'Edit Screen',
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        legacy_event: true,
      },
    });
    dispatch(showQrScanner());
  }, [dispatch, trackEvent]);

  const onReset = useCallback(() => {
    dispatch(resetRecipientInput());
  }, [dispatch]);

  return (
    <SendPageRow>
      <Label paddingBottom={2}>{t('to')}</Label>
      <DomainInput
        userInput={userInput}
        onChange={onChange}
        onValidAddressTyped={onValidAddressTyped}
        internalSearch={isUsingMyAccountsForRecipientSearch}
        selectedAddress={recipient.address}
        selectedName={
          recipient.nickname === recipient.address
            ? shortenAddress(toChecksumHexAddress(recipient.address))
            : recipient.nickname
        }
        onPaste={onPaste}
        onReset={onReset}
        scanQrCode={scanQrCode}
      />
    </SendPageRow>
  );
};
