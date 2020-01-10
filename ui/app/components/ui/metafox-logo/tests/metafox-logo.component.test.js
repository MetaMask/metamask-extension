import React from 'react'
import assert from 'assert'
import { mount } from 'enzyme'
import MetaFoxLogo from '..'

describe('MetaFoxLogo', () => {

  it('sets icon height and width to 42 by default', () => {
    const wrapper = mount(
      <MetaFoxLogo />
    )

    assert.equal(wrapper.find('img.app-header__metafox-logo--icon').prop('width'), 42)
    assert.equal(wrapper.find('img.app-header__metafox-logo--icon').prop('height'), 42)
  })

  it('does not set icon height and width when unsetIconHeight is true', () => {
    const wrapper = mount(
      <MetaFoxLogo unsetIconHeight />
    )

    assert.equal(wrapper.find('img.app-header__metafox-logo--icon').prop('width'), null)
    assert.equal(wrapper.find('img.app-header__metafox-logo--icon').prop('height'), null)
  })
})
