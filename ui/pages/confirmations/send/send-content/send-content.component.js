import React, { Component } from 'react';
import PropTypes from 'prop-types';
import PageContainerContent from '../../../../components/ui/page-container/page-container-content.component';
import Dialog from '../../../../components/ui/dialog';
import ActionableMessage from '../../../../components/ui/actionable-message';
import { AssetType } from '../../../../../shared/constants/transaction';
import { CONTRACT_ADDRESS_LINK } from '../../../../helpers/constants/common';
import SendAmountRow from './send-amount-row';
import SendHexDataRow from './send-hex-data-row';
import SendAssetRow from './send-asset-row';

export default class SendContent extends Component {
  static contextTypes = {
    t: PropTypes.func,
  };

  static propTypes = {
    showHexData: PropTypes.bool,
    warning: PropTypes.string,
    error: PropTypes.string,
    asset: PropTypes.object,
    assetError: PropTypes.string,
    recipient: PropTypes.object,
    acknowledgeRecipientWarning: PropTypes.func,
    recipientWarningAcknowledged: PropTypes.bool,
  };

  render() {
    const {
      warning,
      error,
      asset,
      assetError,
      recipient,
      recipientWarningAcknowledged,
    } = this.props;
    const showHexData =
      this.props.showHexData &&
      asset.type !== AssetType.token &&
      asset.type !== AssetType.NFT;

    const showKnownRecipientWarning =
      recipient.warning === 'knownAddressRecipient';

    return (
      <PageContainerContent>
        <div className="send-v2__form">
          {assetError ? this.renderError(assetError) : null}
          {error ? this.renderError(error) : null}
          {showKnownRecipientWarning && !recipientWarningAcknowledged
            ? this.renderRecipientWarning()
            : null}
          <SendAssetRow />
          <SendAmountRow />
          {showHexData ? <SendHexDataRow /> : null}
        </div>
      </PageContainerContent>
    );
  }

  renderRecipientWarning() {
    const { acknowledgeRecipientWarning } = this.props;
    const { t } = this.context;
    return (
      <div className="send__warning-container" data-testid="send-warning">
        <ActionableMessage
          type="danger"
          useIcon
          iconFillColor="var(--color-error-default)"
          primaryActionV2={{
            label: t('tooltipApproveButton'),
            onClick: acknowledgeRecipientWarning,
          }}
          message={t('sendingToTokenContractWarning', [
            <a
              key="contractWarningSupport"
              target="_blank"
              rel="noopener noreferrer"
              className="send__warning-container__link"
              href={CONTRACT_ADDRESS_LINK}
            >
              {t('learnMoreUpperCase')}
            </a>,
          ])}
          roundedButtons
        />
      </div>
    );
  }

  renderError(error) {
    const { t } = this.context;
    return (
      <Dialog type="error" className="send__error-dialog">
        {t(error)}
      </Dialog>
    );
  }
}
