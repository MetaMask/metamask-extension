import { ethers } from 'ethers';
import Resolution from "@unstoppabledomains/resolution";

export default class Ud{
  constructor({} = {}) {
    const resolution = new Resolution();
    this._resolution = resolution;
  }

  resolve(address) {
    return this._resolution.addr(address, currency);
  }

  reverse(address) {
    return this._resolution.reverse(address);
  }
}

