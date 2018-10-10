import React, { Component } from 'react'
import PropTypes from 'prop-types'

export default class Breadcrumbs extends Component {

  static propTypes = {
    total: PropTypes.number,
    currentIndex: PropTypes.number,
  };

  render () {
    const {total, currentIndex} = this.props
    return (
      <div className="breadcrumbs">
        {Array(total).fill().map((_, i) => (
          <div
            key={i}
            className="breadcrumb"
            style={{backgroundColor: i === currentIndex ? '#D8D8D8' : '#FFFFFF'}}
          />
        ))}
      </div>
    )
  }

}
