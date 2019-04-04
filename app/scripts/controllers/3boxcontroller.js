const ObservableStore = require("obs-store");
const extend = require("xtend");
const log = require("loglevel");

const Box = require("3box");
const POLLING_INTERVAL = 600000

class Threeboxcontroller {
  constructor(opts ={}) {
    const initState = extend({
        threebox: false
      },opts.initState);
    this.store = new ObservableStore(initState);
  }

  async createbox() {
    try {
  
      await Box.openBox(
        '0x92F8786Ca4BC530baA35bea19bfAa8028A84693E',
        window.ethereum,
        {}
      ).then(box => {
        box.onSyncDone(() => {
        log.warn("hello")
        this.store.updateState({
            threebox:true
        })
        }
        );
        window.box = box;
        log.warn(box);
      });
 
    } catch (error) {
      log.error(error);
    }
  }

  schedulethreebox () {
    if (this.store.getState().threebox) {
      clearInterval(this.threebox)
      log.warn('hurrya')
    }
    this.conversionInterval = setInterval(() => {
    }, POLLING_INTERVAL)
  }
}

module.exports = Threeboxcontroller;
