import React, { Component, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
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
import FormHeader from './form-header';
import FormContent from './form-content';
import FormFooter from './form-footer';

export default function KycFlowScreen() {
  const history = useHistory();
  const title = 'Account verify';

  return (
    <div>
      <Kyc history={history} />
    </div>
  );
}
