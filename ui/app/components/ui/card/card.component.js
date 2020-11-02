import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'

export default class Card extends PureComponent {
  static propTypes = {
    className: PropTypes.string,
    overrideClassName: PropTypes.bool,
    title: PropTypes.string,
    children: PropTypes.node,
  }

  render() {
    const { className, overrideClassName, title } = this.props

    return (
      <div className={classnames({ card: !overrideClassName }, className)}>
        <div className="card__title">{title}</div>
        {this.props.children}
      </div>
    )
  }
}
