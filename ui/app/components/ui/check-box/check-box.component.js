import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'

export default class CheckBox extends PureComponent {
  static propTypes = {
    className: PropTypes.string,
    checked: PropTypes.bool,
    onClick: PropTypes.func,
  }

  static defaultProps = {
    className: '',
    checked: false,
    onClick: () => {},
  }

  render () {
    const { className, checked, onClick } = this.props

    return (
      <div
        onClick={ () => onClick() }
        className={classnames('check-box', className)}
      >
        {
          checked
            ? <div className="check-box--checked"><i className="fa fa-check" /></div>
            : <div className="check-box--un-checked" />
        }
      </div>
    )
  }
}
