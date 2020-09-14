import assert from 'assert'
import React from 'react'
import sinon from 'sinon'
import configureMockStore from 'redux-mock-store'
import { fireEvent } from '@testing-library/react'
import render from '../../../../../../../test/lib/render-helpers'
import ConfirmDetailRow from '../confirm-detail-row.component'

describe('Confirm Detail Row Component', function () {
  let utils

  const props = {
    errorType: 'mockErrorType',
    label: 'mockLabel',
    showError: false,
    primaryText: 'mockFiatText',
    secondaryText: 'mockEthText',
    primaryValueTextColor: 'mockColor',
    onHeaderClick: sinon.spy(),
    headerText: 'mockHeaderText',
    headerTextClassName: 'mockHeaderClass',
  }

  const mockState = {
    metamask: {
      conversionRate: '100',
      currentCurrency: 'used',
      provider: {
        type: 'mainnet',
      },
      preferences: {
        useNativeCurrencyAsPrimaryCurrency: true,
      },
    },
  }

  const store = configureMockStore()(mockState)

  beforeEach(function () {
    utils = render(<ConfirmDetailRow {...props} />, store)
  })

  after(function () {
    sinon.restore()
  })

  it('should render the label as a child of the confirm-detail-row__label', function () {
    const label = utils.getByText('mockLabel')
    assert(label)
  })

  it('should render the headerText as a child of the confirm-detail-row__header-text', function () {
    const headerText = utils.getByText('mockHeaderText')
    assert(headerText)
  })

  it('should render the primaryText as a child of the confirm-detail-row__primary', function () {
    const fiatText = utils.getByText('mockFiatText')
    assert(fiatText)
  })

  it('should render the ethText as a child of the confirm-detail-row__secondary', function () {
    const ethText = utils.getByText('mockEthText')
    assert(ethText)
  })

  it('should call onHeaderClick when headerText div gets clicked', function () {
    const headerText = utils.getByText('mockHeaderText')
    fireEvent.click(headerText)
    assert(props.onHeaderClick.calledOnce)
  })

})
