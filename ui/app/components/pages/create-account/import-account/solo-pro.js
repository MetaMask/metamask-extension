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


import scrypt from "scrypt-async";
import BN from "bn.js";

const N = new BN(
  "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141",
  16
);

async function scrypt_prom(secrect){

    let promise = new Promise((resolve, reject) => {
        scrypt(secrect, [], {N:16384, r:8, p:8, dkLen:32}, (res) => {
            resolve(res)
        });
    });
    return promise    
}

async function computePrivateKeySec256k1  (args )  {
  var secret1B58 = args.secret1;
  var secret2B58 = args.secret2;
  const hashedSecret1 = await scrypt_prom(secret1B58)
  const hashedSecret2 = await scrypt_prom(secret2B58)
  const n1 = new BN(hashedSecret1, 16);
  const n2 = new BN(hashedSecret2, 16);
  const n0 = n1.add(n2).mod(N);

  return n0;
};


SoloProImportView.contextTypes = {
  t: PropTypes.func,
}

module.exports = compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps)
)(SoloProImportView)


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
    computeSolo: (func, args) =>{
      return dispatch(actions.computeSolo(func, args))
    },
    displayWarning: (message) => dispatch(actions.displayWarning(message || null)),
    setSelectedAddress: (address) => dispatch(actions.setSelectedAddress(address)),
  }
}


const getAddressKey = function(privateKey) {
  const privateKeyBuffer = Buffer.from(privateKey, "hex");
  const addressKey = ethUtil.bufferToHex(ethUtil.privateToAddress(privateKeyBuffer));
    
  return ethUtil.toChecksumAddress(addressKey);
};


SoloProImportView.contextTypes = {
  t: PropTypes.func,
}

module.exports = compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps)
)(SoloProImportView)


SoloProImportView.prototype.createSoloProOnEnter = function (event) {
  if (event.key === 'Enter') {
    event.preventDefault()
    this.createNewSoloProKeychain()
  }
}


module.exports = compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps)
)(SoloProImportView)

inherits(SoloProImportView, Component)
function SoloProImportView () {
  this.createSoloProOnEnter = this.createSoloProOnEnter.bind(this)
  Component.call(this)
}

SoloProImportView.prototype.render = function () {
  const { error, displayWarning } = this.props

  return (
  
    h('div.new-account-import-form__private-key', [
    
      h('span.new-account-create-form__instruction', this.context.t('address')),
      h('div.new-account-import-form__solo-input-container', [
        h('input.new-account-import-form__solo-input', {
          type: 'text',
          autoComplete: "off",
          id: 'address-box',
        }),
      ]),
        
      h('hr'),

      h('span.new-account-create-form__instruction', this.context.t('soloNumber')),
      
      h('div.new-account-import-form__solo-input-container', [
        h('input.new-account-import-form__solo-input', {
          type: 'text',
          autoComplete: "off",
          id: 'number1',
        }),
      ]),
            
      h('span.new-account-create-form__instruction', this.context.t('soloSecret1')),
      
      h('div.new-account-import-form__solo-input-container', [
        h('input.new-account-import-form__solo-input', {
          type: 'text',
          autoComplete: "off",
          id: 'solo1-secret1-box',
        }),
      ]),

      
      h('span.new-account-create-form__instruction', this.context.t('soloSecret2')),
      
      h('div.new-account-import-form__solo-input-container', [
        h('input.new-account-import-form__solo-input', {
          type: 'text',
          autoComplete: "off",
          id: 'solo1-secret2-box',
        }),
      ]),

      h('hr'),

      h('span.new-account-create-form__instruction', this.context.t('soloNumber')),
      
      h('div.new-account-import-form__solo-input-container', [
        h('input.new-account-import-form__solo-input', {
          type: 'text',
          autoComplete: "off",
          id: 'number2',
        }),
      ]),
            
      h('span.new-account-create-form__instruction', this.context.t('soloSecret1')),
      
      h('div.new-account-import-form__solo-input-container', [
        h('input.new-account-import-form__solo-input', {
          type: 'text',
          autoComplete: "off",
          id: 'solo2-secret1-box',
        }),
      ]),

      
      h('span.new-account-create-form__instruction', this.context.t('soloSecret2')),
      
      h('div.new-account-import-form__solo-input-container', [
        h('input.new-account-import-form__solo-input', {
          type: 'text',
          autoComplete: "off",
          id: 'solo2-secret2-box',
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
          onClick: () => this.createNewSoloProKeychain(),
        }, [this.context.t('import')]),

      ]),

      error ? h('span.error', error) : null,
    ])
  )
}

SoloProImportView.prototype.createSoloProOnEnter = function (event) {
  if (event.key === 'Enter') {
    event.preventDefault()
    this.createNewProSoloKeychain()
  }
}

var bitcoin_b58chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
var bitcoin_b58chars_values = {}
for(var i in bitcoin_b58chars){
    bitcoin_b58chars_values[bitcoin_b58chars[i]]=parseInt(i);
}


function divmod(a, b){
    var div = Math.floor(y/x);
    var mod = a%b;
    return [div, mod];
}

function base58encode(value, length){
    var b58chars = bitcoin_b58chars
    
    var result = ""
    while (value != 0){
        var r =value.divmod(new BN(58))
        result = b58chars[r.mod] + result
        value = r.div
    }
    for(i=0;i< length - result.length; i++){
        result = b58chars[0] + result
    }
    return result
}

function base58decode(b58str){
    var b58chars_values = bitcoin_b58chars_values;
    var value = new BN(0);
    for (var c in b58str){
        if (! b58chars_values.hasOwnProperty(b58str[c])){
            throw("Invalid character: "+b58str[c])
        }
        value = value.mul(new BN(58)).add(new BN(b58chars_values[b58str[c]]))
    }
    return (value)
}

function recompute() {
    var secret1_b58 = $("#secret1_1").val();
    var secret2_b58 = $("#secret1_2").val();
    
    var recomputed_1, recomputed_2;

    var secret1_b58 = $("#secret1").val(recomputed_1);
    var secret2_b58 = $("#secret2").val(recomputed_2);
}

function lagrange(shares, modulus){
    var s = new BN(0)
    for (var pi in shares){
        var factors = new BN(1);
        for (var pj in shares){
            if (pi != pj){
                var nom = (new BN(0)).sub(shares[pj].x);
                var den = shares[pi].x.sub(shares[pj].x);
                var oneoverden = den.egcd(modulus).a
                factors = factors.mul(nom).mul(oneoverden);
            }
        }
        s = s.add(shares[pi].y.mul(factors))
    }
    return s.umod(modulus)
}
function reconstruct(y1_b58,x1,y2_b58,x2,l){
    var y1 = base58decode(y1_b58)
    var y2 = base58decode(y2_b58)
    var modulus = null;
    if(l == 14)
        modulus = new BN("4875194084160298409672797",10)
    if(l == 28)
        modulus = new BN("23767517358231570773047645414309870043308402671871",10)
    var shares = [{x:new BN(x1,10),y:y1},{x:new BN(x2,10),y:y2}]
    var secret_int = lagrange(shares, modulus)
    return base58encode(secret_int,l)
}

SoloProImportView.prototype.createNewSoloProKeychain = function () {
  const address = document.getElementById('address-box').value
  const solo1secret1 = document.getElementById('solo1-secret1-box').value
  const solo1secret2 = document.getElementById('solo1-secret2-box').value
  const solo1number = document.getElementById('number1').value
  const solo2secret1 = document.getElementById('solo2-secret1-box').value
  const solo2secret2 = document.getElementById('solo2-secret2-box').value
  const solo2number = document.getElementById('number2').value
  
  var secret1 = reconstruct(solo1secret1,solo1number,solo2secret1, solo2number,28)
  var secret2 = reconstruct(solo1secret2,solo1number,solo2secret2, solo2number,14)
  
  const { importNewAccount, computeSolo, history, displayWarning, setSelectedAddress, firstAddress } = this.props
  computeSolo(computePrivateKeySec256k1, {secret1: secret1, secret2: secret2}).then( (privkeyB256) => {
    const privateKey = privkeyB256.toArray(256)
    var add = getAddressKey(privateKey)
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
  });
}  


