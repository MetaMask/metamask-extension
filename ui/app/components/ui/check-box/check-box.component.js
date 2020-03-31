import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'

export default class CheckBox extends PureComponent {
  static propTypes = {
    className: PropTypes.string,
    checked: PropTypes.bool,
    onClick: PropTypes.func.isRequired,
  }

  static defaultProps = {
    className: '',
    checked: false,
  }

  render () {
    const { className, checked, onClick } = this.props

    return (
      <div
        onClick={ () => onClick() }
        className={classnames('check-box', className, {
          'check-box--checked': checked,
          'check-box--un-checked': !checked,
        })}
      >
        {
          checked
            ? <i className="fa fa-check" />
            : null
        }
      </div>
    )
  }
}
