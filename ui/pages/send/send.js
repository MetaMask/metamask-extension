import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory, useLocation } from 'react-router-dom';
import {
  getIsUsingMyAccountForRecipientSearch,
  getRecipient,
  getRecipientUserInput,
  getSendStage,
  initializeSendState,
  resetRecipientInput,
  resetSendState,
  SEND_STAGES,
  updateRecipient,
  updateRecipientUserInput,
} from '../../ducks/send';
import { getCurrentChainId, isCustomPriceExcessive } from '../../selectors';
import { getSendHexDataFeatureFlagState } from '../../ducks/metamask/metamask';
import { showQrScanner } from '../../store/actions';
import { useMetricEvent } from '../../hooks/useMetricEvent';
import SendHeader from './send-header';
import AddRecipient from './send-content/add-recipient';
import SendContent from './send-content';
import SendFooter from './send-footer';
import EnsInput from './send-content/add-recipient/ens-input';

const sendSliceIsCustomPriceExcessive = (state) =>
  isCustomPriceExcessive(state, true);

export default function SendTransactionScreen() {
  const history = useHistory();
  const chainId = useSelector(getCurrentChainId);
  const stage = useSelector(getSendStage);
  const gasIsExcessive = useSelector(sendSliceIsCustomPriceExcessive);
  const isUsingMyAccountsForRecipientSearch = useSelector(
    getIsUsingMyAccountForRecipientSearch,
  );
  const recipient = useSelector(getRecipient);
  const showHexData = useSelector(getSendHexDataFeatureFlagState);
  const userInput = useSelector(getRecipientUserInput);
  const location = useLocation();
  const trackUsedQRScanner = useMetricEvent({
    eventOpts: {
      category: 'Transactions',
      action: 'Edit Screen',
      name: 'Used QR scanner',
    },
  });

  const dispatch = useDispatch();
  useEffect(() => {
    if (chainId !== undefined) {
      dispatch(initializeSendState());
    }
  }, [chainId, dispatch]);

  useEffect(() => {
    if (location.search === '?scan=true') {
      dispatch(showQrScanner());

      // Clear the queryString param after showing the modal
      const cleanUrl = window.location.href.split('?')[0];
      window.history.pushState({}, null, `${cleanUrl}`);
      window.location.hash = '#send';
    }
  }, [location, dispatch]);

  useEffect(() => {
    return () => {
      dispatch(resetSendState());
    };
  }, [dispatch]);

  let content;

  if ([SEND_STAGES.EDIT, SEND_STAGES.DRAFT].includes(stage)) {
    content = (
      <>
        <SendContent
          showHexData={showHexData}
          gasIsExcessive={gasIsExcessive}
        />
        <SendFooter key="send-footer" history={history} />
      </>
    );
  } else {
    content = <AddRecipient />;
  }

  return (
    <div className="page-container">
      <SendHeader history={history} />
      <EnsInput
        userInput={userInput}
        className="send__to-row"
        onChange={(address) => dispatch(updateRecipientUserInput(address))}
        onValidAddressTyped={(address) =>
          dispatch(updateRecipient({ address, nickname: '' }))
        }
        internalSearch={isUsingMyAccountsForRecipientSearch}
        selectedAddress={recipient.address}
        selectedName={recipient.nickname}
        onPaste={(text) => updateRecipient({ address: text, nickname: '' })}
        onReset={() => dispatch(resetRecipientInput())}
        scanQrCode={() => {
          trackUsedQRScanner();
          dispatch(showQrScanner());
        }}
      />
      {content}
    </div>
  );
}
