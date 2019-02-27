import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import Button from '../../../button'
import {
  INITIALIZE_CREATE_PASSWORD_ROUTE,
  INITIALIZE_NOTICE_ROUTE,
  INITIALIZE_IMPORT_WITH_SEED_PHRASE_ROUTE,
} from '../../../../routes'

export default class SelectAction extends PureComponent {
  static propTypes = {
    history: PropTypes.object,
    isInitialized: PropTypes.bool,
  }

  static contextTypes = {
    t: PropTypes.func,
  }

  componentDidMount () {
    const { history, isInitialized } = this.props

    if (isInitialized) {
      history.push(INITIALIZE_NOTICE_ROUTE)
    }
  }

  handleCreate = () => {
    this.props.history.push(INITIALIZE_CREATE_PASSWORD_ROUTE)
  }

  handleImport = () => {
    this.props.history.push(INITIALIZE_IMPORT_WITH_SEED_PHRASE_ROUTE)
  }

  render () {
    const { t } = this.context

    return (
       <div className="select-action">
        <div className="app-header__logo-container">
          <img
            className="app-header__metafox-logo app-header__metafox-logo--horizontal"
            src="/images/logo/metamask-logo-horizontal.svg"
            height={30}
          />
          <img
            className="app-header__metafox-logo app-header__metafox-logo--icon"
            src="/images/logo/metamask-fox.svg"
            height={42}
            width={42}
          />
        </div>

        <div className="select-action__wrapper">


          <div className="select-action__body">
            <div className="select-action__body-header">
              { t('newToMetaMask') }
            </div>
            <div className="select-action__select-buttons">
              <div className="select-action__select-button">
                <div className="select-action__button-content">
                  <div className="select-action__button-symbol">
                    <img src="/images/download-alt.svg" />
                  </div>
                  <div className="select-action__button-text-big">
                    { t('noAlreadyHaveSeed') }
                  </div>
                </div>
                <Button
                  type="primary"
                  className="first-time-flow__button"
                  onClick={this.handleImport}
                >
                  { t('importWallet') }
                </Button>
              </div>
              <div className="select-action__select-button">
                <div className="select-action__button-content">
                  <div className="select-action__button-symbol">
                    <img src="/images/thin-plus.svg" />
                  </div>
                  <div className="select-action__button-text-big">
                    { t('letsGoSetUp') }
                  </div>
                </div>
                <Button
                  type="confirm"
                  className="first-time-flow__button"
                  onClick={this.handleCreate}
                >
                  { t('createAWallet') }
                </Button>
              </div>
            </div>
          </div>

        </div>
       </div>
    )
  }
}
