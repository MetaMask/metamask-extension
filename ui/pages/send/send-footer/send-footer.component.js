import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { isEqual } from 'lodash';
import PageContainerFooter from '../../../components/ui/page-container/page-container-footer';
import {
  CONFIRM_TRANSACTION_ROUTE,
  DEFAULT_ROUTE,
} from '../../../helpers/constants/routes';
import { MetaMetricsEventCategory } from '../../../../shared/constants/metametrics';
import { SEND_STAGES } from '../../../ducks/send';
import { INSUFFICIENT_FUNDS_ERROR } from '../send.constants';

export default class SendFooter extends Component {
  static propTypes = {
    resetSendState: PropTypes.func,
    disabled: PropTypes.bool.isRequired,
    history: PropTypes.object,
    sign: PropTypes.func,
    sendStage: PropTypes.string,
    sendErrors: PropTypes.object,
    mostRecentOverviewPage: PropTypes.string.isRequired,
    cancelTx: PropTypes.func,
    draftTransactionID: PropTypes.string,
  };

  static contextTypes = {
    t: PropTypes.func,
    trackEvent: PropTypes.func,
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

    if (draftTransactionID) {
      cancelTx({ id: draftTransactionID });
    }
    resetSendState();

    const nextRoute =
      sendStage === SEND_STAGES.EDIT ? DEFAULT_ROUTE : mostRecentOverviewPage;
    history.push(nextRoute);
  }

  async onSubmit(event) {
    event.preventDefault();
    const { sign, history } = this.props;
    const { trackEvent } = this.context;

    const promise = sign();

    Promise.resolve(promise).then(() => {
      trackEvent({
        category: MetaMetricsEventCategory.Transactions,
        event: 'Complete',
        properties: {
          action: 'Edit Screen',
          legacy_event: true,
        },
      });
      history.push(CONFIRM_TRANSACTION_ROUTE);
    });
  }

  componentDidUpdate(prevProps) {
    const { sendErrors } = this.props;
    const { trackEvent } = this.context;
    if (
      Object.keys(sendErrors).length > 0 &&
      isEqual(sendErrors, prevProps.sendErrors) === false
    ) {
      const errorField = Object.keys(sendErrors).find((key) => sendErrors[key]);
      const errorMessage = sendErrors[errorField];

      trackEvent({
        category: MetaMetricsEventCategory.Transactions,
        event: 'Error',
        properties: {
          action: 'Edit Screen',
          legacy_event: true,
          errorField,
          errorMessage,
        },
      });
    }
  }

  render() {
    const { t } = this.context;
    const { sendStage, sendErrors } = this.props;
    return (
      <PageContainerFooter
        onCancel={() => this.onCancel()}
        onSubmit={(e) => this.onSubmit(e)}
        disabled={
          this.props.disabled && sendErrors.gasFee !== INSUFFICIENT_FUNDS_ERROR
        }
        cancelText={sendStage === SEND_STAGES.EDIT ? t('reject') : t('cancel')}
      />
    );
  }
}
