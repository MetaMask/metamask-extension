import React, { Component, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useNavigate, useLocation } from 'react-router-dom-v5-compat';
import Loading from '../../../components/ui/loading-screen';
import {
  CONFIRM_TRANSACTION_ROUTE,
  DECRYPT_MESSAGE_REQUEST_PATH,
  ENCRYPTION_PUBLIC_KEY_REQUEST_PATH,
} from '../../../helpers/constants/routes';
import { MESSAGE_TYPE } from '../../../../shared/constants/app';

const ConfirmTransactionSwitchContent = ({ txData }) => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (txData?.msgParams && txData?.id) {
      let pathname = `${CONFIRM_TRANSACTION_ROUTE}/${txData.id}${DECRYPT_MESSAGE_REQUEST_PATH}`;
      if (txData.type === MESSAGE_TYPE.ETH_GET_ENCRYPTION_PUBLIC_KEY) {
        pathname = `${CONFIRM_TRANSACTION_ROUTE}/${txData.id}${ENCRYPTION_PUBLIC_KEY_REQUEST_PATH}`;
      }

      // Only navigate if we're not already on the correct path
      if (location.pathname !== pathname) {
        navigate(pathname, { replace: true });
      }
    }
  }, [txData, navigate, location.pathname]);

  return <Loading />;
};

ConfirmTransactionSwitchContent.propTypes = {
  txData: PropTypes.object,
};

export default class ConfirmTransactionSwitch extends Component {
  static propTypes = {
    txData: PropTypes.object,
  };

  render() {
    return <ConfirmTransactionSwitchContent txData={this.props.txData} />;
  }
}
