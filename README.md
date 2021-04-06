# MetaMask Filecoin Developer Preview

## Hey, we're hiring JavaScript Engineers! [Apply Here](https://boards.greenhouse.io/consensys/jobs/2572388).

Welcome to the MetaMask Filecoin Developer Preview.
This is a special distribution of the MetaMask extension intended for developers only.
It uses a prototype of the [MetaMask Snaps plugin system](https://medium.com/metamask/introducing-the-next-evolution-of-the-web3-wallet-4abdf801a4ee) to include a preinstalled version of a Filecoin plugin, called a _snap_.

For [general questions](https://community.metamask.io/c/learn/26), [feature requests](https://community.metamask.io/c/feature-requests-ideas/13), or [developer questions](https://community.metamask.io/c/developer-questions/11), visit our [Community Forum](https://community.metamask.io/).

For the latest version, please see [Releases](https://github.com/MetaMask/metamask-extension/releases).
Builds can be installed using [these instructions](./docs/add-to-chrome.md).
We recommend creating a new browser profile where you install the Filecoin developer preview.
This distribution of the MetaMask extension may not receive all features and bug fixes added to the official, browser store distribution.

## Usage

The Filecoin Developer Preview only supports the preinstalled Filecoin snap, and can only be used on Chromium browsers.
You can try it out with [this dapp](https://metamask.github.io/filsnap).

The Filecoin snap (a.k.a. `filsnap`) runs within a [Secure EcmaScript](https://github.com/endojs/endo/tree/master/packages/ses) Compartment inside a [Web Worker](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API).
The snap can be toggled on and off and reinstalled via the Filecoin dropdown in the main MetaMask menu bar.

The snap _manages its own Filecoin keys_ generated from the user's MetaMask seed phrase according to the BIP-32 and SLIP-44 standards.
The snap cannot access the user's seed phrase or any keys other than Filecoin.

To communicate with dapps, the snap extends its own RPC API to sites that connect to it, allowing websites to check the balance of the user's Filecoin address, and send transactions.
It's the dapp's responsibility to display the user's FIL balance, send and receive transactions and messages, etc.
There is no UI representation of FIL in MetaMask at this prototype stage.

To understand how to connect to and talk to the snap, see the [source code](https://github.com/MetaMask/filsnap/blob/00db7483afb686545aefe00d244d5eedca78918d/packages/adapter/src/index.ts/#L46-L53) of the [example dapp](https://metamask.github.io/filsnap).

In short, to connect to the snap, you make the following call over MetaMask's `window.ethereum` API:

```javascript
await window.ethereum.request({
  method: "wallet_enable",
  params: [{
    filsnap: {}
  }]
});
```

If that call succeeds, you can communicate with the plugin as follows:

```javascript
await window.ethereum.request({
  method: "wallet_invokePlugin",
  params: ['filsnap', {
    method: 'fil_getBalance',
  }]
});
```

For a list of available methods, see [here](https://github.com/MetaMask/filsnap/blob/00db7483afb686545aefe00d244d5eedca78918d/packages/snap/src/snap.ts/#L41-L67).

Note that some methods take parameters, for example:

```javascript
const mesage = // Your message

await window.ethereum.request({
  method: "wallet_invokePlugin",
  params: ['filsnap', {
    method: 'fil_signMessage',
    params: { message }
  }]
});
```

For related repositories and documentation, please see:

- [The Filecoin snap](https://github.com/MetaMask/filsnap/tree/master/packages/snap)
- [The prototype Snaps system](https://github.com/MetaMask/snaps-skunkworks)

> Kudos to our friends at [NodeFactory](https://github.com/NodeFactoryIo) for the original implementation of the Filecoin snap and dapp.

## About MetaMask

You can find the latest version of MetaMask on [our official website](https://metamask.io/).
We do not offer customer support for the Filecoin Developer Preview, but please open an issue if anything is amiss.

For the regular MetaMask extension repository, go [here](https://github.com/MetaMask/metamask-extension).
