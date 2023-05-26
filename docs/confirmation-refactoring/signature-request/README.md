# Refactoring - Signature Request Pages

This document details the plan to refactor and cleanup Signature Request pages in Metamask.

## The current structure of Signature Request pages look like:

1. Simple ETH Signature

   <img src="https://raw.githubusercontent.com/MetaMask/metamask-extension/develop/docs/confirmation-refactoring/signature-request/eth_sign.png" width="150"/>

1. Personal Signature

   <img src="https://raw.githubusercontent.com/MetaMask/metamask-extension/develop/docs/confirmation-refactoring/signature-request/personal_sign.png" width="150"/>

1. Typed Data - V1

   <img src="https://raw.githubusercontent.com/MetaMask/metamask-extension/develop/docs/confirmation-refactoring/signature-request/v1.png" width="150"/>

1. Typed Data - V3

   <img src="https://raw.githubusercontent.com/MetaMask/metamask-extension/develop/docs/confirmation-refactoring/signature-request/v3.png" width="150"/>

1. Typed Data - V4

   <img src="https://raw.githubusercontent.com/MetaMask/metamask-extension/develop/docs/confirmation-refactoring/signature-request/v4.png" width="150"/>

1. SIWE Signature

   <img src="https://raw.githubusercontent.com/MetaMask/metamask-extension/develop/docs/confirmation-refactoring/signature-request/siwe.png" width="150"/>

## The current flow of control for Signature Request looks like:

![Signature Request Flow -  Current](https://raw.githubusercontent.com/MetaMask/metamask-extension/develop/docs/confirmation-refactoring/signature-request/signature_request_old.png)

## The proposed flow of control:

![Signature Request Flow -  Proposed](https://raw.githubusercontent.com/MetaMask/metamask-extension/develop/docs/confirmation-refactoring/signature-request/signature_request_proposed.png)

## Proposed Refactoring:

There are many areas in above flow where the code can be improved upon to cleanup and make it more extensible:

1. ### Refactor message managers:

   Currently we have 3 different message managers:

   - [MessageManager](https://github.com/MetaMask/metamask-extension/blob/develop/app/scripts/lib/message-manager.js)
   - [PersonalMessageManager](https://github.com/MetaMask/metamask-extension/blob/develop/app/scripts/lib/personal-message-manager.js)
   - [TypedMessageManager](https://github.com/MetaMask/metamask-extension/blob/develop/app/scripts/lib/typed-message-manager.js)

   Above message managers handle different types of message requests sent by DAPP. There is a lot of code duplication between the 3 classes.

   We should migrate to use `MessageManagers` from `@metamask/core` repo [here](https://github.com/MetaMask/core/tree/main/packages/message-manager).

2. ### Refactoring Routing to Signature Request pages:

   Current navigation to Signature Request pages is un-necessarily complicated. It can be simplified to great extent.

   - To the navigation code in [Home](https://github.com/MetaMask/metamask-extension/blob/develop/ui/pages/home/home.component.js#L181) component add condition to check if there are unapproved messages and route to path `/singature-request`.
   - In [Routes](https://github.com/MetaMask/metamask-extension/blob/develop/ui/pages/routes/routes.component.js) component render pages/confirm-signature-request for path `/singature-request`.
   - Refactor out [conf-tx.js](https://github.com/MetaMask/metamask-extension/blob/develop/ui/pages/confirm-transaction/conf-tx.js) into pages/confirm-signature-request component. [#17240](https://github.com/MetaMask/metamask-extension/issues/17240)

3. ### Refactoring in [conf-tx.js](https://github.com/MetaMask/metamask-extension/blob/develop/ui/pages/confirm-transaction/conf-tx.js)

   - [conf-tx.js](https://github.com/MetaMask/metamask-extension/blob/develop/ui/pages/confirm-transaction/conf-tx.js) to be renamed to `pages/confirm-signature-request component`
   - Get rid of [confirm-transaction](https://github.com/MetaMask/metamask-extension/blob/develop/ui/pages/confirm-transaction/confirm-transaction.component.js) component from signature request routing. Thus, we need to ensure that any required logic from the component is extracted into a reusable hook and included in pages/confirm-signature-request.
   - Convert to functional react component and use selectors to get state and get rid of `mapStateToProps`. [#17239](https://github.com/MetaMask/metamask-extension/issues/17239)
   - Various callbacks to `sign message`, `cancel request`, etc for different types of messages can be moved to respective child components.
   - On component `mount/update` if there are no unapproved messages redirect to `mostRecentlyOverviewedPage` as [here](https://github.com/MetaMask/metamask-extension/blob/76a2a9bb8b6ea04025328d36404ac3b59121dfc8/ui/app/pages/confirm-transaction/conf-tx.js#L187).
   - Do not pass values like [these](https://github.com/MetaMask/metamask-extension/blob/76a2a9bb8b6ea04025328d36404ac3b59121dfc8/ui/app/pages/confirm-transaction/conf-tx.js#L260) to child components which can be obtained in child components using selectors.
   - Extract logic [here](https://github.com/MetaMask/metamask-extension/blob/76a2a9bb8b6ea04025328d36404ac3b59121dfc8/ui/app/pages/confirm-transaction/conf-tx.js#L218) to show success modal for previously confirmed transaction into separate hook.

4. ### Refactoring component rendering Signature Request Pages

   There are 3 different signature request components responsible to render different signature request pages:

   1. [signature-request-original](https://github.com/MetaMask/metamask-extension/tree/develop/ui/components/app/signature-request-original) - ETH sign, personal sign, sign typed data V1
   2. [signature-request](https://github.com/MetaMask/metamask-extension/tree/develop/ui/components/app/signature-request) - Sign typed data V3, V4
   3. [signature-request-siwe](https://github.com/MetaMask/metamask-extension/tree/develop/ui/components/app/signature-request-siwe) - SignatureRequestSIWE (Sign-In with Ethereum)

   All, the signature request pages (except SIWE) are very similar, the differing part in these pages is the message section.
   And there is a lot of code duplication between components - [signature-request-original](https://github.com/MetaMask/metamask-extension/tree/develop/ui/components/app/signature-request-original) and [signature-request](https://github.com/MetaMask/metamask-extension/tree/develop/ui/components/app/signature-request).

5. ### Refactoring in signature-request-original

   - Rename, this component takes care of ETH sign, personal sign, sign typed data V1 requests. Let's rename it accordingly.
   - Get rid of container components
   - Migrate other classical components to functional react components.
   - Move this [metrics event](https://github.com/MetaMask/metamask-extension/blob/71a0bc8b3ff94478e61294c815770e6bc12a72f5/ui/app/components/app/signature-request-original/signature-request-original.component.js#L50) to pages/confirm-signature-request as it is applicable to all the signature requests types.
   - Header or we can say upper half of the page of all signature request pages (except SIWE) are very similar, this can be extracted into a reusable component used across both signature-request-original and signature-request:

     <img src="https://raw.githubusercontent.com/MetaMask/metamask-extension/develop/docs/confirmation-refactoring/signature-request/header.png" width="150"/>

   - [LedgerInstructions](https://github.com/MetaMask/metamask-extension/blob/e07ec9dcf3d3f341f83e6b29a29d30edaf7f5b5b/ui/components/app/signature-request-original/signature-request-original.component.js#L312) can also be moved to the header.
   - Create a reuable footer component and use it across all confirmation pages. [#17237](https://github.com/MetaMask/metamask-extension/issues/17237)

     <img src="https://raw.githubusercontent.com/MetaMask/metamask-extension/develop/docs/confirmation-refactoring/signature-request/footer.png" width="150"/>

   - Create a reusable component for Cancel All requests for use across signature request pages [Code](https://github.com/MetaMask/metamask-extension/blob/e07ec9dcf3d3f341f83e6b29a29d30edaf7f5b5b/ui/components/app/signature-request-original/signature-request-original.component.js#L326).
   - Extract [getNetrowkName](https://github.com/MetaMask/metamask-extension/blob/e07ec9dcf3d3f341f83e6b29a29d30edaf7f5b5b/ui/components/app/signature-request-original/signature-request-original.component.js#L60) into a reusable hook / utility method.
   - [msgHexToText](https://github.com/MetaMask/metamask-extension/blob/e07ec9dcf3d3f341f83e6b29a29d30edaf7f5b5b/ui/components/app/signature-request-original/signature-request-original.component.js#L79) to be made a utility method.
   - Extract [renderBody](https://github.com/MetaMask/metamask-extension/blob/e07ec9dcf3d3f341f83e6b29a29d30edaf7f5b5b/ui/components/app/signature-request-original/signature-request-original.component.js#L114) into a reusable component.

6. ### Refactoring in signature-request

   - Get rid of container components and for other components migrate to functional react components.
   - Reuse the Header component created for signature-request pages
   - Reuse the footer component created for confirmation pages.
   - Extract [formatWallet](https://github.com/MetaMask/metamask-extension/blob/e07ec9dcf3d3f341f83e6b29a29d30edaf7f5b5b/ui/components/app/signature-request/signature-request.component.js#L93) into a utility method.

7. ### Refactoring in signature-request-siwe
   - Footer component use `PageContainerFooter` can be used as footer component for all confirmation pages. [#17237](https://github.com/MetaMask/metamask-extension/issues/17237)
