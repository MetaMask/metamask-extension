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

      let paramValues = []      
      for (var i = 0; i< script.layer2Abi.actions[index].params.length; i++){
	const subIndex = i
	const param = script.layer2Abi.actions[index].params[subIndex]
	elements.push(h('input', {
	  key: "input"+index+subIndex,
	  className: 'customize-gas-input',
	  value: paramValues[subIndex],
	  placeholder: param.name,
	  type: param.type,
	  onChange: e => {
	    console.log("changed")
	    paramValues[subIndex] = e.target.value
	  },
	}))
	
      }

      elements.push(<Button
		   key={"button"+k}
		   type="primary"
		   className="layer2App-view__button"
		   onClick={() => {
		     console.log(script.layer2Abi)
		     script.layer2Abi.actions[index].call(paramValues)}
			   }
		   >
		   {script.layer2Abi.actions[index].name}
		    </Button>)

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
