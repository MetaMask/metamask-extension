import React, { Component } from 'react'
import ReactTooltip from 'react-tooltip'

class Tooltip extends Component {

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
