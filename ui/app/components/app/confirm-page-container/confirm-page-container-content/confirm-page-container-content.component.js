import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { Tabs, Tab } from '../../../ui/tabs';
import ErrorMessage from '../../../ui/error-message';
import { PageContainerFooter } from '../../../ui/page-container';
import { ConfirmPageContainerSummary, ConfirmPageContainerWarning } from '.';

export default class ConfirmPageContainerContent extends Component {
  static propTypes = {
    action: PropTypes.string,
    dataComponent: PropTypes.node,
    detailsComponent: PropTypes.node,
    errorKey: PropTypes.string,
    errorMessage: PropTypes.string,
    hideSubtitle: PropTypes.bool,
    identiconAddress: PropTypes.string,
    nonce: PropTypes.string,
    assetImage: PropTypes.string,
    subtitleComponent: PropTypes.node,
    title: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    titleComponent: PropTypes.node,
    warning: PropTypes.string,
    origin: PropTypes.string.isRequired,
    // Footer
    onCancelAll: PropTypes.func,
    onCancel: PropTypes.func,
    cancelText: PropTypes.string,
    onSubmit: PropTypes.func,
    submitText: PropTypes.string,
    disabled: PropTypes.bool,
    unapprovedTxCount: PropTypes.number,
    rejectNText: PropTypes.string,
  };

  renderContent() {
    const { detailsComponent, dataComponent } = this.props;

    if (detailsComponent && dataComponent) {
      return this.renderTabs();
    }
    return detailsComponent || dataComponent;
  }

  renderTabs() {
    const { detailsComponent, dataComponent } = this.props;

    return (
      <Tabs>
        <Tab className="confirm-page-container-content__tab" name="Details">
          {detailsComponent}
        </Tab>
        <Tab className="confirm-page-container-content__tab" name="Data">
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
      title,
      titleComponent,
      subtitleComponent,
      hideSubtitle,
      identiconAddress,
      nonce,
      assetImage,
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
    } = this.props;

    return (
      <div className="confirm-page-container-content">
        {warning && <ConfirmPageContainerWarning warning={warning} />}
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
          assetImage={assetImage}
          origin={origin}
        />
        {this.renderContent()}
        {(errorKey || errorMessage) && (
          <div className="confirm-page-container-content__error-container">
            <ErrorMessage errorMessage={errorMessage} errorKey={errorKey} />
          </div>
        )}
        <PageContainerFooter
          onCancel={onCancel}
          cancelText={cancelText}
          onSubmit={onSubmit}
          submitText={submitText}
          submitButtonType="confirm"
          disabled={disabled}
        >
          {unapprovedTxCount > 1 && <a onClick={onCancelAll}>{rejectNText}</a>}
        </PageContainerFooter>
      </div>
    );
  }
}
