# Human Demo

This demo page shows how to interact with new Metamask API, which uses HCaptcha widget to prove, that transaction was created by human

# API Changes:

* New Metamask RPC endpoint - `metamask_requestCaptcha`
* New Event from Metamask background - `captchaTokenReceived`

# Code examples:

```
import detectEthereumProvider from '@metamask/detect-provider';
import Web3 from 'web3';

async function initDeps() {
  const provider = await detectEthereumProvider({ mustBeMetaMask: true });

  return provider;
}

initDeps.then(provider => {
  // triggering the hcaptcha UI page
  const result = provider.request({
    method: 'metamask_requestCaptcha',
    params: []
  });

  web3.subscribe('captchaTokenReceived', token => {
    // initiating contract call with received token
  });
})
```
