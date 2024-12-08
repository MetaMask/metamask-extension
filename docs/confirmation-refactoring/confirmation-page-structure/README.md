# Confirmation Pages Structure

### Current Implementation

Currently we have following confirmation pages mapping to confirmation routes:

1. `pages/confirm-deploy-contract`
2. `pages/confirm-send-ether`
3. `pages/confirm-send-token`
4. `pages/confirm-approve`
5. `pages/confirm-token-transaction-base`
6. `pages/confirm-contract-interaction`

![Confirmation Pages structure](https://raw.githubusercontent.com/MetaMask/metamask-extension/main/docs/confirmation-refactoring/confirmation-page-structure/current.png)

`confirm-page-container` component helps to define a structure for confirmation pages it includes:

1.  `header`
2.  `content` - transaction details and tabs for hexdata and insights if available
3.  `footer`
4.  `warnings`

`confirm-transaction-base` component is responsible for checking transaction details and pass required details like `gas-details`, `hex-data`, etc and passing over to `confirm-page-container`.

Other confirmation components listed above map to different types of transactions and are responsible for passing over to `confirm-transaction-base` values / components specific to their transaction type. For instance, `confirm-deploy-contract` passes data section to `confirm-transaction-base`.

## Areas of Refactoring:

1. ### [confirm-transaction-base](https://github.com/MetaMask/metamask-extension/tree/main/ui/pages/confirm-transaction-base/confirm-transaction-base.component.js) cleanup:
   The `confirm-transaction-base` component is huge 1200 lines component taking care of lot of complexity. We need to break it down into smaller components and move logic to hooks or utility classes. Layout related part can be moved to `confirm-page-container`.
   - Extract out code to render data into separate component from [here](https://github.com/MetaMask/metamask-extension/blob/e07ec9dcf3d3f341f83e6b29a29d30edaf7f5b5b/ui/pages/confirm-transaction-base/confirm-transaction-base.component.js#L641).
   - Extract out component to render hex data from [here](https://github.com/MetaMask/metamask-extension/blob/e07ec9dcf3d3f341f83e6b29a29d30edaf7f5b5b/ui/pages/confirm-transaction-base/confirm-transaction-base.component.js#L675).
   - Extract out code to render title [here](https://github.com/MetaMask/metamask-extension/blob/e07ec9dcf3d3f341f83e6b29a29d30edaf7f5b5b/ui/pages/confirm-transaction-base/confirm-transaction-base.component.js#L894) into separate component.
   - Extract out code to render sub-title [here](https://github.com/MetaMask/metamask-extension/blob/e07ec9dcf3d3f341f83e6b29a29d30edaf7f5b5b/ui/pages/confirm-transaction-base/confirm-transaction-base.component.js#L921). It should return null if hideSubtitle is true.
   - Extract out code to render gas details [here](https://github.com/MetaMask/metamask-extension/blob/e07ec9dcf3d3f341f83e6b29a29d30edaf7f5b5b/ui/pages/confirm-transaction-base/confirm-transaction-base.component.js#L444), this code can be used [here](https://github.com/MetaMask/metamask-extension/blob/e07ec9dcf3d3f341f83e6b29a29d30edaf7f5b5b/ui/pages/confirm-approve/confirm-approve-content/confirm-approve-content.component.js#L171) and [here](https://github.com/MetaMask/metamask-extension/blob/e07ec9dcf3d3f341f83e6b29a29d30edaf7f5b5b/ui/pages/send/gas-display/gas-display.js#L161) also.
   - Extract renderDetails from [here](https://github.com/MetaMask/metamask-extension/blob/e07ec9dcf3d3f341f83e6b29a29d30edaf7f5b5b/ui/pages/confirm-transaction-base/confirm-transaction-base.component.js#L309) into a separate component. Function `setUserAcknowledgedGasMissing` can also be moved to it.
   - Code to get error key [getErrorKey](https://github.com/MetaMask/metamask-extension/blob/e07ec9dcf3d3f341f83e6b29a29d30edaf7f5b5b/ui/pages/confirm-transaction-base/confirm-transaction-base.component.js#L230) can be moved to a util function.
   - As new component for gas selection popups is created this code [handleEditGas, handleCloseEditGas](https://github.com/MetaMask/metamask-extension/blob/e07ec9dcf3d3f341f83e6b29a29d30edaf7f5b5b/ui/pages/confirm-transaction-base/confirm-transaction-base.component.js#L276) can be moved to it.
   - Convert `confirm-transaction-base` into a functional components and extract out all of these functions into a hook - `handleEdit`, `handleCancelAll`, `handleCancel`, `handleSubmit`, `handleSetApprovalForAll`, etc.
2. ### [confirm-transaction-base-container](https://github.com/MetaMask/metamask-extension/tree/main/ui/pages/confirm-transaction-base/confirm-transaction-base.container.js) cleanup:
   This container is doing much work to query and get required transaction related values from state and pass over to `confirm-transaction-base` component. As we refactor state we should get rid of this component.
   - remove the use of `state.confirmTransaction` from the component
   - create hook to get values derived from metamask state and active transaction.
     State cleanup is detailed more in a separate document [here](https://github.com/MetaMask/metamask-extension/tree/main/docs/confirmation-refactoring/confirmation-state-management).
3. ### [confirm-page-container](https://github.com/MetaMask/metamask-extension/tree/03ccc5366cf31c9fa0fedc2fac533ebc64e6f2b4/ui/components/app/confirm-page-container) cleanup:
   As described we should continue to have `confirm-page-container` components taking care of layout. Also wherever possible more re-usable smaller layout components for different part of confirmation page like gas details, gas selection popover, etc should be added.
   `confirm-page-container` defines a layout which is used by most comfirmation pages, but some pages like new token allowance implementation for `ERC20` differ from this layout. We will be able to use more and more of these re-usable components for other confirmation pages layouts also.
   - Move code specific to transaction to their confirmation component, for instance code related to `ApproveForAll` should be moved to `/pages/confirm-approve`, code related to `hideTitle` can be moved to `/pages/confirm-contract-interaction` etc.
   - All header related code [here](https://github.com/MetaMask/metamask-extension/blob/03ccc5366cf31c9fa0fedc2fac533ebc64e6f2b4/ui/components/app/confirm-page-container/confirm-page-container.component.js#L191) should be moved to [confirm-page-container-header](https://github.com/MetaMask/metamask-extension/tree/03ccc5366cf31c9fa0fedc2fac533ebc64e6f2b4/ui/components/app/confirm-page-container/confirm-page-container-header)
   - All warnings related code can be moved to a new child component.
   - Props passing to `confirm-page-component` should be reduced. A lot of passed props like `origin`, `supportEIP1559` can be obtained directly using selectors. Props passing from `confirm-page-container` down to its child components should also be reduced.
4. ### Edit gas popovers:

   There are 2 different versions popovers for gas editing:

   - Legacy gas popover - [component](https://github.com/MetaMask/metamask-extension/tree/main/ui/components/app/edit-gas-popover)
   - EIP-1559 V2 gas popover - [component1](https://github.com/MetaMask/metamask-extension/tree/main/ui/components/app/edit-gas-fee-popover), [component2](https://github.com/MetaMask/metamask-extension/tree/main/ui/components/app/advanced-gas-fee-popover).
     Context [transaction-modal-context](https://github.com/MetaMask/metamask-extension/blob/main/ui/contexts/transaction-modal.js) is used to show hide EIP-1559 gas popovers.

     A parent component can be created for gas editing popover which will wrap both the legacy and EIP-1559 gas popover. Depending on the type of transaction appropriate gas popover can be shown. `transaction-modal-context` can be used to take care to open/close both popovers.
     This parent component can be added to `confirm-transaction-base` and `token-allowance` components and thus will be available on all confirmation pages using gas editing.
     Code [handleEditGas, handleCloseEditGas](https://github.com/MetaMask/metamask-extension/blob/e07ec9dcf3d3f341f83e6b29a29d30edaf7f5b5b/ui/pages/confirm-transaction-base/confirm-transaction-base.component.js#L276) can be moved to this new component.

5. ### Gas polling
   Gas polling related code in `/pages/confirm-transaction` can be moved into a hook and included in `pages/confirm-transaction-base`, `/app/token-allowance` as only those confirmation pages need gas estimates.

**Note:** This document **does not cover signature request pages** which are covered separately.
