import React, { Component } from 'react'
import PropTypes from 'prop-types'
import Button from '../../../components/ui/button'
import PluginsList from './plugins-list'

export default class PluginsTab extends Component {

  static propTypes = {
    warning: PropTypes.string,
    plugins: PropTypes.object.isRequired,
    removePlugins: PropTypes.func.isRequired,
    showClearPluginsModal: PropTypes.func.isRequired,
  }

  static contextTypes = {
    t: PropTypes.func,
  }

  renderClearButton (mainMessage, descriptionMessage, clickHandler, isDisabled) {
    return (
      <div className="settings-page__content-row">
        <div className="settings-page__content-item">
          <span>{ mainMessage }</span>
          <span className="settings-page__content-description">
            { descriptionMessage }
          </span>
        </div>
        <div className="settings-page__content-item">
          <div className="settings-page__content-item-col">
            <Button
              type="warning"
              large
              className="settings-tab__button--orange"
              disabled={isDisabled}
              onClick={event => {
                event.preventDefault()
                clickHandler()
              }}
            >
              { mainMessage }
            </Button>
          </div>
        </div>
      </div>
    )
  }

  render () {
    const { t } = this.context
    const { warning } = this.props
    const hasPlugins = Object.keys(this.props.plugins).length > 0

    return (
      <div className="settings-page__body">
        { warning && <div className="settings-tab__error">{ warning }</div> }
        <PluginsList
          plugins={this.props.plugins}
          removePlugins={this.props.removePlugins}
        />
        {
          this.renderClearButton(
            t('clearPlugins'),
            t('clearPluginsDescription'),
            this.props.showClearPluginsModal,
            !hasPlugins
          )
        }
      </div>
    )
  }
}
