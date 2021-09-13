import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { isEqual } from 'lodash';
import PageContainerFooter from '../../../components/ui/page-container/page-container-footer';
import {
  CONFIRM_TRANSACTION_ROUTE,
  DEFAULT_ROUTE,
} from '../../../helpers/constants/routes';
import { SEND_STAGES } from '../../../ducks/send';

export default class SendFooter extends Component {
  static propTypes = {
    addToAddressBookIfNew: PropTypes.func,
    resetSendState: PropTypes.func,
    disabled: PropTypes.bool.isRequired,
    history: PropTypes.object,
    sign: PropTypes.func,
    to: PropTypes.string,
    toAccounts: PropTypes.array,
    sendStage: PropTypes.string,
    sendErrors: PropTypes.object,
    gasEstimateType: PropTypes.string,
    mostRecentOverviewPage: PropTypes.string.isRequired,
    cancelTx: PropTypes.func,
    draftTransactionID: PropTypes.string,
  };

  static contextTypes = {
    t: PropTypes.func,
    metricsEvent: PropTypes.func,
  };

  onCancel() {
    const {
      cancelTx,
      draftTransactionID,
      history,
      mostRecentOverviewPage,
      resetSendState,
      sendStage,
    } = this.props;

    if (draftTransactionID) cancelTx({ id: draftTransactionID });
    resetSendState();

    const nextRoute =
      sendStage === SEND_STAGES.EDIT ? DEFAULT_ROUTE : mostRecentOverviewPage;
    history.push(nextRoute);
  }

  async onSubmit(event) {
    event.preventDefault();
    const {
      addToAddressBookIfNew,
      sign,
      to,
      toAccounts,
      history,
      gasEstimateType,
    } = this.props;
    const { metricsEvent } = this.context;

    // TODO: add nickname functionality
    await addToAddressBookIfNew(to, toAccounts);
    const promise = sign();

    Promise.resolve(promise).then(() => {
      metricsEvent({
        eventOpts: {
          category: 'Transactions',
          action: 'Edit Screen',
          name: 'Complete',
        },
        customVariables: {
          gasChanged: gasEstimateType,
        },
      });
      history.push(CONFIRM_TRANSACTION_ROUTE);
    });
  }

  componentDidUpdate(prevProps) {
    const { sendErrors } = this.props;
    const { metricsEvent } = this.context;
    if (
      Object.keys(sendErrors).length > 0 &&
      isEqual(sendErrors, prevProps.sendErrors) === false
    ) {
      const errorField = Object.keys(sendErrors).find((key) => sendErrors[key]);
      const errorMessage = sendErrors[errorField];

      metricsEvent({
        eventOpts: {
          category: 'Transactions',
          action: 'Edit Screen',
          name: 'Error',
        },
        customVariables: {
          errorField,
          errorMessage,
        },
      });
    }
  }

  render() {
    const { t } = this.context;
    const { sendStage } = this.props;
    return (
      <PageContainerFooter
        onCancel={() => this.onCancel()}
        onSubmit={(e) => this.onSubmit(e)}
        disabled={this.props.disabled}
        cancelText={sendStage === SEND_STAGES.EDIT ? t('reject') : t('cancel')}
      />
    );
  }
}
