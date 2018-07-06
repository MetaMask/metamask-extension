import React, { Component } from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import { Tabs, Tab } from '../../tabs'
import {
  ConfirmPageContainerSummary,
  ConfirmPageContainerError,
  ConfirmPageContainerWarning,
} from './'

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
    subtitle: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    summaryComponent: PropTypes.node,
    title: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    titleComponent: PropTypes.func,
    warning: PropTypes.string,
  }

  renderContent () {
    const { detailsComponent, dataComponent } = this.props

    if (detailsComponent && dataComponent) {
      return this.renderTabs()
    } else {
      return detailsComponent || dataComponent
    }
  }

  renderTabs () {
    const { detailsComponent, dataComponent } = this.props

    return (
      <Tabs>
        <Tab name="Details">
          { detailsComponent }
        </Tab>
        <Tab name="Data">
          { dataComponent }
        </Tab>
      </Tabs>
    )
  }

  render () {
    const {
      action,
      errorKey,
      errorMessage,
      title,
      subtitle,
      hideSubtitle,
      identiconAddress,
      nonce,
      summaryComponent,
      detailsComponent,
      dataComponent,
      warning,
    } = this.props

    return (
      <div className="confirm-page-container-content">
        {
          warning && (
            <ConfirmPageContainerWarning warning={warning} />
          )
        }
        {
          summaryComponent || (
            <ConfirmPageContainerSummary
              className={classnames({
                'confirm-page-container-summary--border': !detailsComponent || !dataComponent,
              })}
              action={action}
              title={title}
              subtitle={subtitle}
              hideSubtitle={hideSubtitle}
              identiconAddress={identiconAddress}
              nonce={nonce}
            />
          )
        }
        { this.renderContent() }
        {
          (errorKey || errorMessage) && (
            <div className="confirm-page-container-content__error-container">
              <ConfirmPageContainerError
                errorMessage={errorMessage}
                errorKey={errorKey}
              />
            </div>
          )
        }
      </div>
    )
  }
}
