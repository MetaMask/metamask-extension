import React, { Component } from 'react'
import ReactTooltip from 'react-tooltip'
import PropTypes from 'prop-types'

class Tooltip extends Component {

  static propTypes = {
    position: PropTypes.any,
    title: PropTypes.string,
    id: PropTypes.any,
    children: PropTypes.any,
  }

    render () {
      const props = this.props
      const { position, title, children, id } = props

      return (<React.Fragment>
      {children}
      <ReactTooltip
        id={id}
        place={position || 'left'}
        type="dark"
      >
        {title}
      </ReactTooltip>
      </React.Fragment>)
    }

}

module.exports = Tooltip
