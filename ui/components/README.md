# Component Development Guide

This document attempts to explain the different types of components that make up MetaMask Browser Extension

## Component Types

There are 2 type of components that make up the app

- **UI components** [`ui/components/ui`](https://github.com/MetaMask/metamask-extension/tree/develop/ui/components/ui)
- **App components** [`ui/components/app`](https://github.com/MetaMask/metamask-extension/tree/develop/ui/components/app)

### UI Components

Components that live in the [`ui/components/ui`](https://github.com/MetaMask/metamask-extension/tree/develop/ui/components/ui) should be reusable, light weight and as simple as possible. They should not require any external dependencies to render other than a handful of props.

[Read more](./ui/README.md)

### App Components

Components that live in [`ui/components/app`](https://github.com/MetaMask/metamask-extension/tree/develop/ui/components/app) have a unique purpose and usually contain business or state logic. These components should utilize as many UI components as necessary. They should also contain a reduced amount of styling.

### Building Locally and Contributing

Please take a look at the MetaMask Browser Extension [README.md](https://github.com/MetaMask/metamask-extension) for contribution guidelines and how to get the extension up and running locally.
