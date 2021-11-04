import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { Tabs, Tab } from '../../../ui/tabs';
import ErrorMessage from '../../../ui/error-message';
import Button from '../../../ui/button';
import Typography from '../../../ui/typography';
import ActionableMessage from '../../../ui/actionable-message/actionable-message';
import { PageContainerFooter } from '../../../ui/page-container';
import {
  COLORS,
  FONT_STYLE,
  FONT_WEIGHT,
  TYPOGRAPHY,
} from '../../../../helpers/constants/design-system';
import { ConfirmPageContainerSummary, ConfirmPageContainerWarning } from '.';

export default class ConfirmPageContainerContent extends Component {
  static contextTypes = {
    t: PropTypes.func.isRequired,
  };

  state = {
    confirmAnyways: false,
  };

  static propTypes = {
    action: PropTypes.string,
    dataComponent: PropTypes.node,
    detailsComponent: PropTypes.node,
    errorKey: PropTypes.string,
    errorMessage: PropTypes.string,
    hasSimulationError: PropTypes.bool,
    hideSubtitle: PropTypes.bool,
    identiconAddress: PropTypes.string,
    nonce: PropTypes.string,
    subtitleComponent: PropTypes.node,
    title: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
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
    hideTitle: PropTypes.boolean,
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
    const { detailsComponent, dataComponent } = this.props;

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
      titleComponent,
      subtitleComponent,
      hideSubtitle,
      identiconAddress,
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
    } = this.props;

    const isDisabled = () => {
      return this.state.confirmAnyways ? false : disabled;
    };

    const primaryAction = {
      label: this.context.t('iWillTryAnyway'),
      onClick: () => this.setState({ confirmAnyways: true })
    }

    return (
      <div className="confirm-page-container-content">
        {warning ? <ConfirmPageContainerWarning warning={warning} /> : null}
        {ethGasPriceWarning && (
          <ConfirmPageContainerWarning warning={ethGasPriceWarning} />
        )}
        {hasSimulationError && (
          <div className="confirm-page-container-content__error-container">
            <ActionableMessage
              type="danger"
              primaryAction={primaryAction}
              message={this.context.t('simulationErrorMessage')}
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
          titleComponent={titleComponent}
          subtitleComponent={subtitleComponent}
          hideSubtitle={hideSubtitle}
          identiconAddress={identiconAddress}
          nonce={nonce}
          origin={origin}
          hideTitle={hideTitle}
        />
        {this.renderContent()}
        {(errorKey || errorMessage) && !hasSimulationError && (
          <div className="confirm-page-container-content__error-container">
            <ErrorMessage errorMessage={errorMessage} errorKey={errorKey} />
          </div>
        )}
        <PageContainerFooter
          onCancel={onCancel}
          cancelText={cancelText}
          onSubmit={onSubmit}
          submitText={submitText}
          disabled={isDisabled()}
        >
          {unapprovedTxCount > 1 ? (
            <a onClick={onCancelAll}>{rejectNText}</a>
          ) : null}
        </PageContainerFooter>
      </div>
    );
  }
}
