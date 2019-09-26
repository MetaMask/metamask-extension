
import React from 'react'
import assert from 'assert'
// import sinon from 'sinon'
import { shallow } from 'enzyme'
import ProviderPageContainer from '../provider-page-container-content/index'

describe('Provider Page', () => {
  let wrapper

  const props = {
    origin: 'Website URL',
    selectedIdentity: '0xAddress',
    siteImage: 'Image',
    siteTitle: 'Site Title',
  }

  beforeEach(() => {
    wrapper = shallow(
      <ProviderPageContainer.WrappedComponent {...props} />, {
        context: {
          t: str => str,
          metricsEvent: () => {},
        },
        childContextTypes: {
          t: React.PropTypes.func,
          metricsEvent: React.PropTypes.func,
        },
      }
    )
  })

  it('renders site titles', () => {
    const siteTitle = wrapper.find('.provider-approval-visual section h1')
    assert.equal(siteTitle.first().text(), props.siteTitle)
  })

  it('renders website url', () => {
    const siteTitle = wrapper.find('.provider-approval-visual section h2')
    assert.equal(siteTitle.first().text(), props.origin)
  })
})
