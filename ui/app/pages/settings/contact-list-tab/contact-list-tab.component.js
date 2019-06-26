import React, { Component } from 'react'
import PropTypes from 'prop-types'
import Button from '../../../components/ui/button'
import Identicon from '../../../components/ui/identicon'
import { addressSlicer } from '../../../helpers/utils/util'
import { CONTACT_ADD_ROUTE, CONTACT_VIEW_ROUTE } from '../../../helpers/constants/routes'

export default class ContactListTab extends Component {
  static contextTypes = {
    t: PropTypes.func,
  }

  static propTypes = {
    addressBook: PropTypes.object,
    history: PropTypes.object,
  }

  renderAddresses () {
    const { addressBook, history } = this.props

    return (
      <div>
       { addressBook.map(({address, name}) => {
          return (
            <div className="address-book__entry" key= { address }
              onClick={() => {
                history.push(`${CONTACT_VIEW_ROUTE}/${address}`)
              }}>
              <Identicon address= { address } diameter={ 25 }/>
              <div className="address-book__name"> { name !== '' ? name : addressSlicer(address) } </div>
            </div>
          )
        }
      )}
      </div>
    )
  }

  render () {
    return (
      <div className="address-book-container">
        { this.renderAddresses() }
        { this.renderAddButton() }
      </div>
    )
  }

  renderAddButton () {
    const { history } = this.props
    return <Button
      type="default"
      onClick={() => {
        history.push(CONTACT_ADD_ROUTE)
      }}>
      { this.context.t('add') }
    </Button>
  }
}
