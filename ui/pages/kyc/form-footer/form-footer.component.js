import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { isEqual } from 'lodash';
import PageContainerFooter from '../../../components/ui/page-container/page-container-footer';
import {
  CONFIRM_TRANSACTION_ROUTE,
  DEFAULT_ROUTE,
} from '../../../helpers/constants/routes';
import { SEND_STAGES } from '../../../ducks/send';

export default class FormFooter extends Component {
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
    const { history } = this.props;

    history.push(DEFAULT_ROUTE);
  }

  async onSubmit(event) {
    event.preventDefault();
    console.log('on submit');
    // console.log(this.props);

    const { to, toAccounts } = this.props;
    const { address } = toAccounts[0];
    console.log('address:', address);
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
        cancelText={t('cancel')}
        submitText={t('submit')}
      />
    );
  }
}
