import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Redirect } from 'react-router-dom';
import Loading from '../../../components/ui/loading-screen';
import {
  CONFIRM_TRANSACTION_ROUTE,
  DECRYPT_MESSAGE_REQUEST_PATH,
  ENCRYPTION_PUBLIC_KEY_REQUEST_PATH,
} from '../../../helpers/constants/routes';
import { MESSAGE_TYPE } from '../../../../shared/constants/app';

export default class ConfirmTransactionSwitch extends Component {
  static propTypes = {
    txData: PropTypes.object,
  };

  render() {
    const { txData } = this.props;
    if (txData.msgParams) {
      let pathname = `${CONFIRM_TRANSACTION_ROUTE}/${txData.id}${DECRYPT_MESSAGE_REQUEST_PATH}`;
      if (txData.type === MESSAGE_TYPE.ETH_GET_ENCRYPTION_PUBLIC_KEY) {
        pathname = `${CONFIRM_TRANSACTION_ROUTE}/${txData.id}${ENCRYPTION_PUBLIC_KEY_REQUEST_PATH}`;
      }
      return <Redirect to={{ pathname }} />;
    }

    return <Loading />;
  }
}
