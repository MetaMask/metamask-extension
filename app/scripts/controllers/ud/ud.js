import Resolution from "@unstoppabledomains/resolution";

export default class Ud{
  constructor({} = {}) {
    const resolution = new Resolution();
    this._resolution = resolution;
  }

  resolve(address) {
    return this._resolution
      .addr(address, currency)
      .catch((error) => {
        if (error.code === 'UnregisteredDomain') {
            console.log('Domain is not registered')
        }
        if (error.code === 'RecordNotFound') {
            console.log('Crypto record is not found (or empty)')
        }
        if (error.code === 'UnspecifiedResolver') {
            console.log('Domain is not configured (empty resolver)')
        }
        if (error.code === 'UnsupportedDomain') {
            console.log('Domain is not supported')
        }
        if (error.code === 'ResolutionError') {
          console.log('Domain is not supported')
      }
    });
  }

  reverse(address) {
    return this._resolution.reverse(address);
  }
}

