import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { Tabs, Tab } from '../../../ui/tabs';
import Button from '../../../ui/button';
import ActionableMessage from '../../../ui/actionable-message/actionable-message';
import { PageContainerFooter } from '../../../ui/page-container';
import ErrorMessage from '../../../ui/error-message';
import { INSUFFICIENT_FUNDS_ERROR_KEY } from '../../../../helpers/constants/error-keys';
import Typography from '../../../ui/typography';
import { TYPOGRAPHY } from '../../../../helpers/constants/design-system';
import { TRANSACTION_TYPES } from '../../../../../shared/constants/transaction';
import { MAINNET_CHAIN_ID } from '../../../../../shared/constants/network';

import { ConfirmPageContainerSummary, ConfirmPageContainerWarning } from '.';

export default class ConfirmPageContainerContent extends Component {
  static contextTypes = {
    t: PropTypes.func.isRequired,
  };

  static propTypes = {
    action: PropTypes.string,
    dataComponent: PropTypes.node,
    dataHexComponent: PropTypes.node,
    detailsComponent: PropTypes.node,
    errorKey: PropTypes.string,
    errorMessage: PropTypes.string,
    hasSimulationError: PropTypes.bool,
    hideSubtitle: PropTypes.bool,
    tokenAddress: PropTypes.string,
    nonce: PropTypes.string,
    subtitleComponent: PropTypes.node,
    title: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    image: PropTypes.string,
    titleComponent: PropTypes.node,
    warning: PropTypes.string,
    origin: PropTypes.string.isRequired,
    ethGasPriceWarning: PropTypes.string,
    // Footer
    onCancelAll: PropTypes.func,
    onCancel: PropTypes.func,
    cancelText: PropTypes.string,
    onSubmit: PropTypes.func,
    setUserAcknowledgedGasMissing: PropTypes.func,
    submitText: PropTypes.string,
    disabled: PropTypes.bool,
    hideUserAcknowledgedGasMissing: PropTypes.bool,
    unapprovedTxCount: PropTypes.number,
    rejectNText: PropTypes.string,
    hideTitle: PropTypes.bool,
    supportsEIP1559V2: PropTypes.bool,
    hasTopBorder: PropTypes.bool,
    currentTransaction: PropTypes.string,
    nativeCurrency: PropTypes.string,
    networkName: PropTypes.string,
    showBuyModal: PropTypes.func,
    toAddress: PropTypes.string,
    transactionType: PropTypes.string,
  };

  renderContent() {
    const { detailsComponent, dataComponent } = this.props;

    if (detailsComponent && dataComponent) {
      return this.renderTabs();
    }
    return detailsComponent || dataComponent;
  }

  renderTabs() {
    const { t } = this.context;
    const { detailsComponent, dataComponent, dataHexComponent } = this.props;

    return (
      <Tabs>
        <Tab
          className="confirm-page-container-content__tab"
          name={t('details')}
        >
          {detailsComponent}
        </Tab>
        <Tab className="confirm-page-container-content__tab" name={t('data')}>
          {dataComponent}
        </Tab>
        {dataHexComponent && (
          <Tab
            className="confirm-page-container-content__tab"
            name={t('dataHex')}
          >
            {dataHexComponent}
          </Tab>
        )}
      </Tabs>
    );
  }

  render() {
    const {
      action,
      errorKey,
      errorMessage,
      hasSimulationError,
      title,
      image,
      titleComponent,
      subtitleComponent,
      hideSubtitle,
      tokenAddress,
      nonce,
      detailsComponent,
      dataComponent,
      warning,
      onCancelAll,
      onCancel,
      cancelText,
      onSubmit,
      submitText,
      disabled,
      unapprovedTxCount,
      rejectNText,
      origin,
      ethGasPriceWarning,
      hideTitle,
      setUserAcknowledgedGasMissing,
      hideUserAcknowledgedGasMissing,
      supportsEIP1559V2,
      hasTopBorder,
      currentTransaction,
      nativeCurrency,
      networkName,
      showBuyModal,
      toAddress,
      transactionType,
    } = this.props;

    const primaryAction = hideUserAcknowledgedGasMissing
      ? null
      : {
          label: this.context.t('tryAnywayOption'),
          onClick: setUserAcknowledgedGasMissing,
        };
    const { t } = this.context;

    const showInsuffienctFundsError =
      supportsEIP1559V2 &&
      !hasSimulationError &&
      (errorKey || errorMessage) &&
      errorKey === INSUFFICIENT_FUNDS_ERROR_KEY &&
      currentTransaction.type === TRANSACTION_TYPES.SIMPLE_SEND;

    return (
      <div
        className={classnames('confirm-page-container-content', {
          'confirm-page-container-content--with-top-border': hasTopBorder,
        })}
      >
        {warning ? <ConfirmPageContainerWarning warning={warning} /> : null}
        {ethGasPriceWarning && (
          <ConfirmPageContainerWarning warning={ethGasPriceWarning} />
        )}
        {hasSimulationError && (
          <div className="confirm-page-container-content__error-container">
            <ActionableMessage
              type="danger"
              primaryAction={primaryAction}
              message={t('simulationErrorMessage')}
            />
          </div>
        )}
        <ConfirmPageContainerSummary
          className={classnames({
            'confirm-page-container-summary--border':
              !detailsComponent || !dataComponent,
          })}
          action={action}
          title={title}
          image={image}
          titleComponent={titleComponent}
          subtitleComponent={subtitleComponent}
          hideSubtitle={hideSubtitle}
          tokenAddress={tokenAddress}
          nonce={nonce}
          origin={origin}
          hideTitle={hideTitle}
          toAddress={toAddress}
          transactionType={transactionType}
        />
        {this.renderContent()}
        {!supportsEIP1559V2 &&
          !hasSimulationError &&
          (errorKey || errorMessage) &&
          currentTransaction.type !== TRANSACTION_TYPES.SIMPLE_SEND && (
            <div className="confirm-page-container-content__error-container">
              <ErrorMessage errorMessage={errorMessage} errorKey={errorKey} />
            </div>
          )}
        {showInsuffienctFundsError && (
          <div className="confirm-page-container-content__error-container">
            {currentTransaction.chainId === MAINNET_CHAIN_ID ? (
              <ActionableMessage
                className="actionable-message--warning"
                message={
                  <Typography variant={TYPOGRAPHY.H7} align="left">
                    {t('insufficientCurrency', [nativeCurrency, networkName])}
                    <Button
                      key="link"
                      type="secondary"
                      className="confirm-page-container-content__link"
                      onClick={showBuyModal}
                    >
                      {t('buyEth')}
                    </Button>

                    {t('orDeposit')}
                  </Typography>
                }
                useIcon
                iconFillColor="#d73a49"
                type="danger"
              />
            ) : (
              <ActionableMessage
                className="actionable-message--warning"
                message={
                  <Typography variant={TYPOGRAPHY.H7} align="left">
                    {t('insufficientCurrency', [nativeCurrency, networkName])}
                    {t('buyOther', [nativeCurrency])}
                  </Typography>
                }
                useIcon
                iconFillColor="#d73a49"
                type="danger"
              />
            )}
          </div>
        )}

        <PageContainerFooter
          onCancel={onCancel}
          cancelText={cancelText}
          onSubmit={onSubmit}
          submitText={submitText}
          disabled={disabled}
        >
          {unapprovedTxCount > 1 ? (
            <a onClick={onCancelAll}>{rejectNText}</a>
          ) : null}
        </PageContainerFooter>
      </div>
    );
  }
}
