import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import Media from 'react-media'
import MenuBar from '../menu-bar'
import Button from '../button'
import { DEPOSIT_LAYER2APP_ROUTE } from '../../routes'

export default class Layer2AppView extends PureComponent {
  static contextTypes = {
    t: PropTypes.func,
    showDepositModal: PropTypes.func,
    history: PropTypes.object,
  }

  render () {
    const { t } = this.context
    const { history } = this.props
    const script = this.props.selectedLayer2AppScript    
    return (
	<div className="layer2App-view">
	<Button
      type="primary"
      className="layer2App-view__button"
      onClick={() => history.push(DEPOSIT_LAYER2APP_ROUTE)}
        >
        {t("depositLayer2App") }
      </Button>
	<Button
      type="primary"
      className="layer2App-view__button"
      onClick={() => console.log("action1", script.layer2Abi)}
        >
        {t("layer2-action1") }
      </Button>
	<Button
      type="primary"
      className="layer2App-view__button"
      onClick={() => console.log("action2", script.layer2Abi.actions, script.layer2Abi.getters)}
        >
        {t("layer2-action2") }
      </Button>

      </div>
    )
  }
}

// const { showDepositModal, history } = this.props
// onClick={() =>{showDepositModal()} }
