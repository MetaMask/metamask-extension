import React, {Component, PropTypes} from 'react'
import {connect} from 'react-redux';
import Identicon from '../../../../ui/app/components/identicon'
import Breadcrumbs from './breadcrumbs'

class UniqueImageScreen extends Component {
  static propTypes = {
    address: PropTypes.string,
    next: PropTypes.func.isRequired
  }

  render() {
    return (
      <div className="unique-image">
        <Identicon address={this.props.address} diameter={70} />
        <div className="unique-image__title">You unique account image</div>
        <div className="unique-image__body-text">
          This image was programmatically generated for you by your new account number.
        </div>
        <div className="unique-image__body-text">
          You’ll see this image everytime you need to confirm a transaction.
        </div>
        <button
          className="first-time-flow__button"
          onClick={this.props.next}
        >
          Next
        </button>
        <Breadcrumbs total={3} currentIndex={1} />
      </div>
    )
  }
}

export default connect(
  ({ metamask: { selectedAddress } }) => ({
    address: selectedAddress
  })
)(UniqueImageScreen)
