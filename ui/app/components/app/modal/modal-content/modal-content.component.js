import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'

export default class ModalContent extends PureComponent {
  static propTypes = {
    title: PropTypes.string,
    description: PropTypes.string,
  }

  render() {
    const { title, description } = this.props

    return (
      <div className="modal-content">
        {title && <div className="modal-content__title">{title}</div>}
        {description && (
          <div className="modal-content__description">{description}</div>
        )}
      </div>
    )
  }
}
