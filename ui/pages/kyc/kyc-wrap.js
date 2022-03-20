import React, { Component, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
// import Select from 'react-select'
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
import TextField from '../../components/ui/text-field';
import { getMostRecentOverviewPage } from '../../ducks/history/history';
import { DEFAULT_ROUTE } from '../../helpers/constants/routes';
import Kyc from './kyc.container';
// import { getCurrentChainId, isCustomPriceExcessive } from '../../selectors';
// import { getSendHexDataFeatureFlagState } from '../../ducks/metamask/metamask';
// import { showQrScanner } from '../../store/actions';
// import { useMetricEvent } from '../../hooks/useMetricEvent';
import FormHeader from './form-header';
// import AddRecipient from './form-content/add-recipient';
import FormContent from './form-content';
import FormFooter from './form-footer';
// import EnsInput from './form-content/add-recipient/ens-input';
// import EmailInput from './form-content/add-recipient/email-input';

export default function KycFlowScreen() {
  const history = useHistory();
  const title = 'Account verify';

  return (
    <div>
      <Kyc history={history} />
      {/* <FormHeader history={history} />
      <FormContent
        showHexData={showHexData}
        gasIsExcessive={gasIsExcessive}
      />
      <FormFooter key="form-footer" history={history} /> */}
    </div>
  );
}
