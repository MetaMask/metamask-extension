const inherits = require('util').inherits
const Component = require('react').Component
const h = require('react-hyperscript')
const { withRouter } = require('react-router-dom')
const { compose } = require('recompose')
const PropTypes = require('prop-types')
const connect = require('react-redux').connect
const actions = require('../../../../actions')
const { DEFAULT_ROUTE } = require('../../../../routes')
const { getMetaMaskAccounts } = require('../../../../selectors')
const ethUtil = require('ethereumjs-util')

import Button from '../../../button'


import scrypt from "scrypt.js";
import BN from "bn.js";

const N = new BN(
  "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141",
  16
);

const computePrivateKeySec256k1 = function (secret1B58, secret2B58)  {
  const hashedSecret1 =  scrypt(secret1B58, [], 16384, 8, 8, 32);
  const hashedSecret2 =  scrypt(secret2B58, [], 16384, 8, 8, 32);

  const n1 = new BN(hashedSecret1, 16);
  const n2 = new BN(hashedSecret2, 16);
  const n0 = n1.add(n2).mod(N);

  return n0;
};





SoloImportView.contextTypes = {
  t: PropTypes.func,
}

module.exports = compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps)
)(SoloImportView)


function mapStateToProps (state) {
  return {
    error: state.appState.warning,
    firstAddress: Object.keys(getMetaMaskAccounts(state))[0],
  }
}

function mapDispatchToProps (dispatch) {
  return {
    importNewAccount: (strategy, [ privateKey ]) => {
      return dispatch(actions.importNewAccount(strategy, [ privateKey ]))
    },
    displayWarning: (message) => dispatch(actions.displayWarning(message || null)),
    setSelectedAddress: (address) => dispatch(actions.setSelectedAddress(address)),
  }
}

inherits(SoloImportView, Component)
function SoloImportView () {
  this.createSoloOnEnter = this.createSoloOnEnter.bind(this)
  Component.call(this)
}

SoloImportView.prototype.render = function () {
  const { error, displayWarning } = this.props

  return (
  
    h('div.new-account-import-form__private-key', [
    
      h('span.new-account-create-form__instruction', this.context.t('address')),
      h('div.new-account-import-form__solo-input-container', [
        h('input.new-account-import-form__solo-input', {
          type: 'text',
          autocomplete: "off",
          id: 'address-box',
        }),
      ]),
      
      h('span.new-account-create-form__instruction', this.context.t('soloSecret1')),
      
      h('div.new-account-import-form__solo-input-container', [
        h('input.new-account-import-form__solo-input', {
          type: 'text',
          autocomplete: "off",
          id: 'secret1-box',
        }),
      ]),
      
      h('span.new-account-create-form__instruction', this.context.t('soloSecret2')),
      
      h('div.new-account-import-form__solo-input-container', [
        h('input.new-account-import-form__solo-input', {
          type: 'text',
          autocomplete: "off",
          id: 'secret2-box',
          onKeyPress: e => this.createSoloOnEnter(e),
        }),
      ]),

      h('div.new-account-import-form__buttons', {}, [
        h(Button, {
          type: 'default',
          large: true,
          className: 'new-account-create-form__button',
          onClick: () => {
            displayWarning(null)
            this.props.history.push(DEFAULT_ROUTE)
          },
        }, [this.context.t('cancel')]),

        h(Button, {
          type: 'primary',
          large: true,
          className: 'new-account-create-form__button',
          onClick: () => this.createNewSoloKeychain(),
        }, [this.context.t('import')]),

      ]),

      error ? h('span.error', error) : null,
    ])
  )
}

SoloImportView.prototype.createSoloOnEnter = function (event) {
  if (event.key === 'Enter') {
    event.preventDefault()
    this.createNewSoloKeychain()
  }
}

const getAddressKey = function(privateKey) {
  const privateKeyBuffer = Buffer.from(privateKey, "hex");
  const addressKey = ethUtil.bufferToHex(ethUtil.privateToAddress(privateKeyBuffer));
    
  return ethUtil.toChecksumAddress(addressKey);
};


SoloImportView.prototype.createNewSoloKeychain = function () {
  const address = document.getElementById('address-box').value
  const secret1 = document.getElementById('secret1-box').value
  const secret2 = document.getElementById('secret2-box').value
  
  const privkeyB256 = computePrivateKeySec256k1(secret1, secret2);
  const privateKey = privkeyB256.toArray(256)
  var add = getAddressKey(privateKey)
  const { importNewAccount, history, displayWarning, setSelectedAddress, firstAddress } = this.props
  if (add !== address){
    displayWarning(this.context.t('soloError'))
  }
  else{  

    importNewAccount('Private Key', [ privateKey ])
      .then(({ selectedAddress }) => {
        if (selectedAddress) {
          history.push(DEFAULT_ROUTE)
          displayWarning(null)
        } else {
          displayWarning('Error importing account.')
          setSelectedAddress(firstAddress)
        }
      })
      .catch(err => err && displayWarning(err.message || err))
  }
}





