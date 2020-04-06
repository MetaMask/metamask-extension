import proxyquire from 'proxyquire'
import assert from 'assert'
import sinon from 'sinon'

describe('Get First Time Language Code', function () {

  it('returns en when extension i18n api is not provided', function () {
    const getDefaultLangCode = proxyquire('../../../app/scripts/lib/get-default-lang-code.js', {
      'extensionizer': {},
    }).default

    assert.equal(getDefaultLangCode(), 'en')
  })

  it('returns en when getUILanguage returns a locale that is not in our list', function () {

    const getDefaultLangCode = proxyquire('../../../app/scripts/lib/get-default-lang-code.js', {
      'extensionizer': {
        'i18n': {
          getUILanguage: sinon.stub().returns('test'),
        },
      },
    }).default

    assert.equal(getDefaultLangCode(), 'en')
  })

  it('returns correct locale in MetaMask _locales/index from browser i18n.getUILanguage()', function () {

    const getDefaultLangCode = proxyquire('../../../app/scripts/lib/get-default-lang-code.js', {
      'extensionizer': {
        'i18n': {
          getUILanguage: sinon.stub().returns('pt-BR'),
        },
      },
    }).default

    assert.equal(getDefaultLangCode(), 'pt_BR')
  })
})
