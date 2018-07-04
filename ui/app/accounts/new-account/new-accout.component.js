import React, { Component } from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import NewAccountCreateForm from '../../components/pages/create-account'
import NewAccountImportForm from '../../components/pages/create-account/import-account'


export default class AccountDetailsModal extends Component {

  static propTypes = {
    displayedForm: PropTypes.string,
    displayForm: PropTypes.func,
  }

  static contextTypes = {
    t: PropTypes.func,
  }

  render () {
    const { displayedForm, displayForm } = this.props

    return (
      <div className={'new-account'}>
        <div className={'new-account__header'}>
          <div className={'new-account__title'}>
            {this.context.t('newAccount')}
          </div>
          <div className={'new-account__tabs'}>
            <div
              className={classnames('new-account__tabs__tab', {
                'new-account__tabs__selected': displayedForm === 'CREATE',
                'new-account__tabs__unselected cursor-pointer': displayedForm !== 'CREATE',
              })}
              onClick={() => displayForm('CREATE')}
            >
              {this.context.t('createDen')}
            </div>
            <div
              className={classnames('new-account__tabs__tab', {
                'new-account__tabs__selected': displayedForm === 'IMPORT',
                'new-account__tabs__unselected cursor-pointer': displayedForm !== 'IMPORT',
              })}
              onClick={() => displayForm('IMPORT')}
            >
              {this.context.t('import')}
            </div>
          </div>
        </div>
        <div className={'new-account__form'}>
          {
            displayedForm === 'CREATE'
            ? <NewAccountCreateForm/>
            : <NewAccountImportForm/>
          }
        </div>
      </div>
    )
  }

}
