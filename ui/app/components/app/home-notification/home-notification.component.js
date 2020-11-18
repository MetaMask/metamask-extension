import React, { PureComponent } from 'react'
import classnames from 'classnames'
import { Tooltip as ReactTippy } from 'react-tippy'
import PropTypes from 'prop-types'
import Button from '../../ui/button'

export default class HomeNotification extends PureComponent {
  static contextTypes = {
    metricsEvent: PropTypes.func,
  }

  static defaultProps = {
    onAccept: null,
    ignoreText: null,
    onIgnore: null,
    infoText: null,
  }

  static propTypes = {
    acceptText: PropTypes.node.isRequired,
    onAccept: PropTypes.func,
    ignoreText: PropTypes.node,
    onIgnore: PropTypes.func,
    descriptionText: PropTypes.node.isRequired,
    infoText: PropTypes.node,
    classNames: PropTypes.array,
  }

  handleAccept = () => {
    this.props.onAccept()
  }

  handleIgnore = () => {
    this.props.onIgnore()
  }

  render() {
    const {
      descriptionText,
      acceptText,
      onAccept,
      ignoreText,
      onIgnore,
      infoText,
      classNames = [],
    } = this.props

    return (
      <div className={classnames('home-notification', ...classNames)}>
        <div className="home-notification__header">
          <div className="home-notification__header-container">
            <img
              className="home-notification__icon"
              alt=""
              src="images/icons/connect.svg"
            />
            <div className="home-notification__text">{descriptionText}</div>
          </div>
          {infoText ? (
            <ReactTippy
              style={{
                display: 'flex',
              }}
              html={
                <p className="home-notification-tooltip__content">{infoText}</p>
              }
              offset={-36}
              distance={36}
              animation="none"
              position="top"
              arrow
              theme="tippy-tooltip-home"
            >
              <img alt="" src="images/icons/info.svg" />
            </ReactTippy>
          ) : null}
        </div>
        <div className="home-notification__buttons">
          {onAccept && acceptText ? (
            <Button
              type="primary"
              className="home-notification__accept-button"
              onClick={this.handleAccept}
            >
              {acceptText}
            </Button>
          ) : null}
          {onIgnore && ignoreText ? (
            <Button
              type="secondary"
              className="home-notification__ignore-button"
              onClick={this.handleIgnore}
            >
              {ignoreText}
            </Button>
          ) : null}
        </div>
      </div>
    )
  }
}
