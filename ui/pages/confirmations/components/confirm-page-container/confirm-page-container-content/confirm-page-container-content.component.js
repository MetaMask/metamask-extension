import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { Tabs, Tab } from '../../../../../components/ui/tabs';
import {
  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  Button,
  BUTTON_SIZES,
  BUTTON_VARIANT,
  ///: END:ONLY_INCLUDE_IF
  BannerAlert,
} from '../../../../../components/component-library';
import { PageContainerFooter } from '../../../../../components/ui/page-container';
import {
  INSUFFICIENT_FUNDS_ERROR_KEY,
  IS_SIGNING_OR_SUBMITTING,
  USER_OP_CONTRACT_DEPLOY_ERROR_KEY,
} from '../../../../../helpers/constants/error-keys';
import { Severity } from '../../../../../helpers/constants/design-system';

import { BlockaidResultType } from '../../../../../../shared/constants/security-provider';
import { ConfirmPageContainerSummary, ConfirmPageContainerWarning } from '.';

export default class ConfirmPageContainerContent extends Component {
  static contextTypes = {
    t: PropTypes.func.isRequired,
  };

  static propTypes = {
    action: PropTypes.string,
    dataHexComponent: PropTypes.node,
    detailsComponent: PropTypes.node,
    insightComponent: PropTypes.node,
    errorKey: PropTypes.string,
    errorMessage: PropTypes.string,
    tokenAddress: PropTypes.string,
    nonce: PropTypes.string,
    subtitleComponent: PropTypes.node,
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
    submitText: PropTypes.string,
    disabled: PropTypes.bool,
    unapprovedTxCount: PropTypes.number,
    rejectNText: PropTypes.string,
    supportsEIP1559: PropTypes.bool,
    hasTopBorder: PropTypes.bool,
    nativeCurrency: PropTypes.string,
    networkName: PropTypes.string,
    toAddress: PropTypes.string,
    transactionType: PropTypes.string,
    isBuyableChain: PropTypes.bool,
    ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
    openBuyCryptoInPdapp: PropTypes.func,
    ///: END:ONLY_INCLUDE_IF
    txData: PropTypes.object,
  };

  renderContent() {
    const { detailsComponent, dataHexComponent, insightComponent } = this.props;

    if (insightComponent && (detailsComponent || dataHexComponent)) {
      return this.renderTabs();
    }

    if (detailsComponent && dataHexComponent) {
      return this.renderTabs();
    }

    return detailsComponent || insightComponent;
  }

  renderTabs() {
    const { t } = this.context;
    const { detailsComponent, dataHexComponent, insightComponent } = this.props;

    return (
      <Tabs defaultActiveTabKey="details">
        <Tab
          className="confirm-page-container-content__tab"
          name={t('details')}
          tabKey="details"
        >
          {detailsComponent}
        </Tab>
        {dataHexComponent && (
          <Tab
            className="confirm-page-container-content__tab"
            name={t('dataHex')}
            tabKey="dataHex"
          >
            {dataHexComponent}
          </Tab>
        )}

        {insightComponent}
      </Tabs>
    );
  }

  render() {
    const {
      action,
      errorKey,
      errorMessage,
      image,
      titleComponent,
      subtitleComponent,
      tokenAddress,
      nonce,
      detailsComponent,
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
      supportsEIP1559,
      hasTopBorder,
      nativeCurrency,
      networkName,
      toAddress,
      transactionType,
      isBuyableChain,
      ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
      openBuyCryptoInPdapp,
      ///: END:ONLY_INCLUDE_IF
      txData,
    } = this.props;

    const { t } = this.context;

    const showInsufficientFundsError =
      (errorKey || errorMessage) && errorKey === INSUFFICIENT_FUNDS_ERROR_KEY;

    const showIsSigningOrSubmittingError =
      errorKey === IS_SIGNING_OR_SUBMITTING;

    const showUserOpContractDeployError =
      errorKey === USER_OP_CONTRACT_DEPLOY_ERROR_KEY;

    const submitButtonType =
      txData?.securityAlertResponse?.result_type ===
      BlockaidResultType.Malicious
        ? 'danger-primary'
        : 'primary';

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
        <ConfirmPageContainerSummary
          className={classnames({
            'confirm-page-container-summary--border': !detailsComponent,
          })}
          action={action}
          image={image}
          titleComponent={titleComponent}
          subtitleComponent={subtitleComponent}
          tokenAddress={tokenAddress}
          nonce={nonce}
          origin={origin}
          toAddress={toAddress}
          transactionType={transactionType}
        />
        {this.renderContent()}
        {!supportsEIP1559 &&
          !showInsufficientFundsError &&
          !showIsSigningOrSubmittingError &&
          !showUserOpContractDeployError &&
          (errorKey || errorMessage) && (
            <BannerAlert
              severity={Severity.Danger}
              description={errorKey ? t(errorKey) : errorMessage}
              marginBottom={4}
              marginLeft={4}
              marginRight={4}
            />
          )}
        {showInsufficientFundsError && (
          <BannerAlert
            severity={Severity.Danger}
            marginBottom={4}
            marginLeft={4}
            marginRight={4}
            description={
              isBuyableChain
                ? t('insufficientCurrencyBuyOrDeposit', [
                    nativeCurrency,
                    networkName,
                    ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
                    <Button
                      variant={BUTTON_VARIANT.LINK}
                      size={BUTTON_SIZES.INHERIT}
                      onClick={openBuyCryptoInPdapp}
                      key={`${nativeCurrency}-buy-button`}
                    >
                      {t('buyAsset', [nativeCurrency])}
                    </Button>,
                    ///: END:ONLY_INCLUDE_IF
                  ])
                : t('insufficientCurrencyDeposit', [
                    nativeCurrency,
                    networkName,
                  ])
            }
          />
        )}
        {(showIsSigningOrSubmittingError || showUserOpContractDeployError) && (
          <BannerAlert
            data-testid="confirm-page-container-content-error-banner-2"
            severity={Severity.Danger}
            description={t(errorKey)}
            marginBottom={4}
            marginLeft={4}
            marginRight={4}
          />
        )}
        <PageContainerFooter
          onCancel={onCancel}
          cancelText={cancelText}
          onSubmit={onSubmit}
          submitText={submitText}
          disabled={disabled}
          submitButtonType={submitButtonType}
        >
          {unapprovedTxCount > 1 ? (
            <a onClick={onCancelAll}>{rejectNText}</a>
          ) : null}
        </PageContainerFooter>
      </div>
    );
  }
}
