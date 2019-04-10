import PropTypes from 'prop-types'
import React, {PureComponent} from 'react'
const Box = require('3box')

export default class AddThreeboxbutton extends PureComponent {
 
  static defaultProps = {
    onClick: async () => {
    }
  }

  static propTypes = {
    onClick: PropTypes.func,
  }

  render () {
    const { t } = this.context
    const { onClick } = this.props

    return (
      <div className="add-token-button">
       
       <div
          className="add-token-button__button"
          onClick={onClick}
        >
         Add Threebox
        </div>
      </div>
    )
  }
}
