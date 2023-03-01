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
import { TypographyVariant } from '../../../../helpers/constants/design-system';

import SecurityProviderBannerMessage from '../../security-provider-banner-message/security-provider-banner-message';
import { SECURITY_PROVIDER_MESSAGE_SEVERITIES } from '../../security-provider-banner-message/security-provider-banner-message.constants';
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
    ///: BEGIN:ONLY_INCLUDE_IN(flask)
    insightComponent: PropTypes.node,
    ///: END:ONLY_INCLUDE_IN
    errorKey: PropTypes.string,
    errorMessage: PropTypes.string,
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
    submitText: PropTypes.string,
    disabled: PropTypes.bool,
    unapprovedTxCount: PropTypes.number,
    rejectNText: PropTypes.string,
    hideTitle: PropTypes.bool,
    supportsEIP1559: PropTypes.bool,
    hasTopBorder: PropTypes.bool,
    nativeCurrency: PropTypes.string,
    networkName: PropTypes.string,
    toAddress: PropTypes.string,
    transactionType: PropTypes.string,
    isBuyableChain: PropTypes.bool,
    txData: PropTypes.object,
  };

  renderContent() {
    const { detailsComponent, dataComponent } = this.props;

    ///: BEGIN:ONLY_INCLUDE_IN(flask)
    const { insightComponent } = this.props;

    if (insightComponent && (detailsComponent || dataComponent)) {
      return this.renderTabs();
    }
    ///: END:ONLY_INCLUDE_IN

    if (detailsComponent && dataComponent) {
      return this.renderTabs();
    }

    return (
      detailsComponent ||
      ///: BEGIN:ONLY_INCLUDE_IN(flask)
      insightComponent ||
      ///: END:ONLY_INCLUDE_IN
      dataComponent
    );
  }

  renderTabs() {
    const { t } = this.context;
    const {
      detailsComponent,
      dataComponent,
      dataHexComponent,
      ///: BEGIN:ONLY_INCLUDE_IN(flask)
      insightComponent,
      ///: END:ONLY_INCLUDE_IN
    } = this.props;

    return (
      <Tabs>
        <Tab
          className="confirm-page-container-content__tab"
          name={t('details')}
          tabKey="details"
        >
          {detailsComponent}
        </Tab>
        {dataComponent && (
          <Tab
            className="confirm-page-container-content__tab"
            name={t('data')}
            tabKey="data"
          >
            {dataComponent}
          </Tab>
        )}
        {dataHexComponent && (
          <Tab
            className="confirm-page-container-content__tab"
            name={t('dataHex')}
            tabKey="dataHex"
          >
            {dataHexComponent}
          </Tab>
        )}

        {
          ///: BEGIN:ONLY_INCLUDE_IN(flask)
          insightComponent
          ///: END:ONLY_INCLUDE_IN
        }
      </Tabs>
    );
  }

  render() {
    const {
      action,
      errorKey,
      errorMessage,
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
      supportsEIP1559,
      hasTopBorder,
      nativeCurrency,
      networkName,
      toAddress,
      transactionType,
      isBuyableChain,
      txData,
    } = this.props;

    const { t } = this.context;

    const showInsuffienctFundsError =
      supportsEIP1559 &&
      (errorKey || errorMessage) &&
      errorKey === INSUFFICIENT_FUNDS_ERROR_KEY;

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
        {(txData?.securityProviderResponse?.flagAsDangerous !== undefined &&
          txData?.securityProviderResponse?.flagAsDangerous !==
            SECURITY_PROVIDER_MESSAGE_SEVERITIES.NOT_MALICIOUS) ||
        (txData?.securityProviderResponse &&
          Object.keys(txData.securityProviderResponse).length === 0) ? (
          <SecurityProviderBannerMessage
            securityProviderResponse={txData.securityProviderResponse}
          />
        ) : null}
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
        {!supportsEIP1559 && (errorKey || errorMessage) && (
          <div className="confirm-page-container-content__error-container">
            <ErrorMessage errorMessage={errorMessage} errorKey={errorKey} />
          </div>
        )}
        {showInsuffienctFundsError && (
          <div className="confirm-page-container-content__error-container">
            <ActionableMessage
              className="actionable-message--warning"
              message={
                isBuyableChain ? (
                  <Typography variant={TypographyVariant.H7} align="left">
                    {t('insufficientCurrencyBuyOrDeposit', [
                      nativeCurrency,
                      networkName,
                      <Button
                        type="inline"
                        className="confirm-page-container-content__link"
                        onClick={() => {
                          const portfolioUrl = process.env.PORTFOLIO_URL;
                          global.platform.openTab({
                            url: `${portfolioUrl}/buy?metamaskEntry=ext_buy_button`,
                          });
                        }}
                        key={`${nativeCurrency}-buy-button`}
                      >
                        {t('buyAsset', [nativeCurrency])}
                      </Button>,
                    ])}
                  </Typography>
                ) : (
                  <Typography variant={TypographyVariant.H7} align="left">
                    {t('insufficientCurrencyDeposit', [
                      nativeCurrency,
                      networkName,
                    ])}
                  </Typography>
                )
              }
              useIcon
              iconFillColor="var(--color-error-default)"
              type="danger"
            />
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
