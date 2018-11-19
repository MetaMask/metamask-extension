import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import Media from 'react-media'
import MenuBar from '../menu-bar'
import Button from '../button'
const h = require('react-hyperscript')
import { DEPOSIT_LAYER2APP_ROUTE } from '../../routes'

export default class Layer2AppView extends PureComponent {
  static contextTypes = {
    t: PropTypes.func,
    showDepositModal: PropTypes.func,
    history: PropTypes.object,
  }

  renderLayer2Buttons () {
    let elements = []
    const script = this.props.selectedLayer2AppScript
    if (!script) return (	<div>       </div>)
    for (var k = 0; k< script.layer2Abi.actions.length; k++){
      const index = k
      elements.push(<Button
		   key={"button"+k}
		   type="primary"
		   className="layer2App-view__button"
		   onClick={() => {
		     console.log(script.layer2Abi)
		     script.layer2Abi.actions[index].call()}
			   }
		   >
		   {script.layer2Abi.actions[index].name}
		   </Button>)
      for (var i = 0; i< script.layer2Abi.actions[index].params.length; i++){
	console.log(script.layer2Abi.actions[index].params[i])
	elements.push(h('input', {
	  className: 'customize-gas-input',
	  value: "a",
	  placeholder: "temp element",
	  type: 'number',
	  onChange: e => {
	    console.log("changed")
	  },
	  min: 0,
	}))
	
      }
    }
    return elements
  }

  render () {
    const { t } = this.context
    const { history } = this.props

    //the deposit layer2app button should probably also be delegated to the script logic
    //for now it is in the depositLayer2 components
    return (
	<div className="layer2App-view">
	<Button
      type="primary"
      className="layer2App-view__button"
      onClick={() => history.push(DEPOSIT_LAYER2APP_ROUTE)}
        >
        {t("depositLayer2App") }
      </Button>
	{this.renderLayer2Buttons.bind(this)()}

      </div>
    )
  }
}

// const { showDepositModal, history } = this.props
// onClick={() =>{showDepositModal()} }
