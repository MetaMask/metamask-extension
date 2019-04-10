import PropTypes from 'prop-types'
import React, {PureComponent} from 'react'


export default class AddThreeboxbutton extends PureComponent {

  static defaultProps = {
    onClick: async () => {
    },
  }

  static propTypes = {
    onClick: PropTypes.func,
  }

  render () {
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
