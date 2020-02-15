import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'

export default class ModalContent extends PureComponent {
  static propTypes = {
    title: PropTypes.string,
    description: PropTypes.string,
    ContentSubComponent: PropTypes.element,
  }

  render () {
    const { title, description, ContentSubComponent } = this.props

    return (
      <div className="modal-content">
        {
          title && (
            <div className="modal-content__title">
              { title }
            </div>
          )
        }
        {
          description && (
            <div className="modal-content__description">
              { description }
            </div>
          )
        }
        {
          ContentSubComponent && (
            <div className="modal-content__description">
              { ContentSubComponent }
            </div>
          )
        }
      </div>
    )
  }
}
