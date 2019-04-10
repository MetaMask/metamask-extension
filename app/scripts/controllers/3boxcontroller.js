const ObservableStore = require('obs-store')
const extend = require('xtend')
const Web3 = require('web3')
const Box = require('3box')

let ethprovider
let box


class Threeboxcontroller {
  constructor (opts = {}) {
    const initState = extend(
      {
        threebox: false,
      },
      opts.initState
    )

    this.store = new ObservableStore(initState)
    this._selectedAddress = opts.selectedAddress
    ethprovider = opts.provider

    this.createbox = this.createbox.bind(this)
    this.createspace = this.createspace.bind(this)

    this.web3 = new Web3(ethprovider)
  }

  async createbox () {


    try {
      box = await Box.openBox(this._selectedAddress, ethprovider)
       box.onSyncDone(async () => {
         this.createspace()
        })
    } catch (error) {
      console.log(error)
    }
  }


  async createspace () {
    try {
      await box.private.set('Nickname: Sam', 'Address:0x1234')

      const jey = await box.private.get('Nickname: Sam')
     window.alert('the address stored with nickname : Sam in 3box is' + jey)
    } catch (error) {
      console.log(error)
    }
  }
}


module.exports = Threeboxcontroller
