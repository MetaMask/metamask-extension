import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'

export default class ConnectedSiteRow extends PureComponent {
  static defaultProps = {
    siteTitle: null,
    siteImage: null,
    onDelete: () => {},
  }

  static propTypes = {
    siteTitle: PropTypes.string,
    siteImage: PropTypes.string,
    origin: PropTypes.string.isRequired,
    onDelete: PropTypes.func,
  }

  render () {
    const {
      origin,
      onDelete,
    } = this.props

    return (
      <div className="connected-site-row">
        <div className="connected-site-row__origin">{origin}</div>
        <div className="connected-site-row__delete" onClick={onDelete}><i className="fa fa-trash" /></div>
      </div>
    )
  }
}
