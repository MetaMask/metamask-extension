import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import Media from 'react-media'
import MenuBar from '../menu-bar'
import Button from '../button'
const h = require('react-hyperscript')
import { DEPOSIT_PLUGIN_ROUTE } from '../../routes'

const BN = require('ethereumjs-util').BN

export default class PluginView extends PureComponent {
  static contextTypes = {
    t: PropTypes.func,
    showDepositModal: PropTypes.func,
    history: PropTypes.object,
  }

  constructor (props) {
    super(props)
    this.paramValues = []
  }

  renderPluginButtons () {
    if (!this.props.selectedPluginScript){ return }
    let elements = []
    const script = this.props.selectedPluginScript

    for (var k = 0; k < script.pluginInterface.actions.length; k++){
      const index = k
      if (!this.paramValues[index]){
	this.paramValues.push([])
	console.log("def paramValues")
      }
      for (var i = 0; i < script.pluginInterface.actions[index].params.length; i++){
	const subIndex = i
	const param = script.pluginInterface.actions[index].params[subIndex]
	elements.push(h('input', {
	  key: "input" + index + subIndex,
	  className: 'customize-gas-input',
	  placeholder: param.name,
	  type: param.type,
	  onChange: e => {
	    console.log("changed")
	    this.paramValues[index][subIndex] = e.target.value
	  },
	}))
	
      }

      elements.push(<Button
		   key={"button"+k}
		   type="primary"
		   className="plugin-view__button"
		   onClick={() => {
		     console.log(script.pluginInterface)
		     script.pluginInterface.actions[index].call(this.paramValues[index])}
			   }
		   >
		   {script.pluginInterface.actions[index].name}
		    </Button>)

    }
    return elements
  }

  renderDelegatedUI(){
    if (this.props.selectedPluginScript){    
      return this.props.selectedPluginScript.renderUI()
    }
  }

  render () {
    console.log("PROPS in plugin view", this.props)
    if (this.props.selectedPluginScript){
      console.log(this.props.selectedPluginScript.pluginInterface)
    }
    return (
	<div>
	<div> ------------------------------------------------------------------------------   Plugin view  ---------------------------------------------------------------------------------  </div>
	<div> {this.props.selectedPluginUid}    </div>
	<div> {this.props.selectedPluginScript.balaynce}    </div>	
	<div> {this.renderPluginButtons.bind(this)()} </div>
	<div> {this.renderDelegatedUI.bind(this)()} </div>	
	</div>	
    )    

  }
}

