import React, { Component } from 'react'
import PropTypes from 'prop-types'

export default class PageContainerHeader extends Component {

  static propTypes = {
    title: PropTypes.string,
    subtitle: PropTypes.string,
    onClose: PropTypes.func,
  };

  render () {
    const { title, subtitle, onClose } = this.props

    return (
      <div className="page-container__header">

        <div className="page-container__title">
          {title}
        </div>

        <div className="page-container__subtitle">
          {subtitle}
        </div>

        <div
          className="page-container__header-close"
          onClick={() => onClose()}
        />

      </div>
    )
  }

}
