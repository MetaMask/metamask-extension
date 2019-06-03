import React, { Component } from 'react'
import PropTypes from 'prop-types'
import Button from '../../../components/ui/button'
import Identicon from '../../../components/ui/identicon'
import { addressSlicer } from '../../../helpers/utils/util'
import { CONTACT_EDIT_ROUTE, CONTACT_ADD_ROUTE } from '../../../helpers/constants/routes'

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
       { Object.keys(addressBook).map((address) => {
          return (
            <div className="address-book__entry" key= { address }
              onClick={() => {
                history.push(`${CONTACT_EDIT_ROUTE}/${address}`)
              }}>
              <Identicon address= { address } diameter={ 25 }/>
              <div className="address-book__name"> { addressBook[address].name !== '' ? addressBook[address].name : addressSlicer(address) } </div>
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
      <div className="settings-page__header">
        { this.context.t('addressBook') }
      </div>
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
