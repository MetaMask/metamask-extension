# Delegation Toolkit

This directory contains code extracted directly from the [Delegation Toolkit](https://github.com/metamask/delegator-sdk/) repository.
The reason for extracting this code is to avoid bringing any dependencies that are not needed for the MetaMask extension.
In addition, the code has been modified so it doesn't rely on `viem` utilities.
Instead, we've created the necessary utilities in `utils.ts`, which leverage the utilities currently available in the MetaMask extension.

## TODO

In the future, we would like to consider replacing this code with the official Delegation Toolkit package.
However, we need to initiate discussions with the Delegation Team to restructure their packages in a way that makes it lighter of a dependency.
