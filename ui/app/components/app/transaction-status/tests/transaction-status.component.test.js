import assert from 'assert'
import React from 'react'
import { screen, configure } from '@testing-library/react'
import render from '../../../../../../test/lib/render-helpers'
import TransactionStatus from '../transaction-status.component'

describe('TransactionStatus Component', function () {

  it('should render CONFIRMED properly', function () {
    const props = {
      status: 'confirmed',
      date: 'June 1',
    }

    render(<TransactionStatus {...props} />)

    const date = screen.getByText(props.date)
    assert.ok(date)
  })

  it('should render PENDING properly when status is APPROVED', function () {
    const props = {
      status: 'approved',
      isEarliestNonce: true,
      error: { message: 'test-title' },
    }

    render(<TransactionStatus {...props} />)
    configure({ testIdAttribute: 'data-original-title' })

    const pendingText = screen.getByText(/pending/u)
    const title = screen.getByTestId(props.error.message)

    assert.ok(title)
    assert.ok(pendingText)

  })

  it('should render PENDING properly', function () {
    const props = {
      status: 'submitted',
      date: 'June 1',
      isEarliestNonce: true,
    }

    render(<TransactionStatus {...props} />)
    const pending = screen.getByText(/pending/u)

    assert.ok(pending)
  })

  it('should render QUEUED properly', function () {
    const props = {
      status: 'queued',
    }

    render(<TransactionStatus {...props} />)
    const queued = screen.getByText(/queued/u)

    assert.ok(queued)
  })

  it('should render UNAPPROVED properly', function () {
    const props = {
      status: 'unapproved',
    }

    render(<TransactionStatus {...props} />)
    const unapproved = screen.getByText(/unapproved/u)

    assert.ok(unapproved)
  })

})
