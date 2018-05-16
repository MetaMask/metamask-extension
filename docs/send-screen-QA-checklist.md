# Send screen QA checklist:

This checklist can be to guide QA of the send screen. It can also be used to guide e2e tests for the send screen.

Once all of these are QA verified on master, resolutions to any bugs related to the send screen should include and update to this list.

Additional features or functionality on the send screen should include an update to this list.

## Send Eth mode
  - [ ] **Header** _It should:_
    - [ ] have title "Send ETH"
    - [ ] have sub title "Only send ETH to an Ethereum address."
    - [ ] return user to main screen when top right X is clicked
  - [ ] **From row** _It should:_
    - [ ] show the currently selected account by default 
    - [ ] show a dropdown with all of the users accounts
    - [ ] contain the following info for each account: identicon, account name, balance in ETH, balance in current currency
    - [ ] change the account selected in the dropdown (but not the app-wide selected account) when one in the dropdown is clicked
    - [ ] close the dropdown, without changing the dropdown selected account, when the dropdown is open and then a click happens outside it
  - [ ] **To row** _It should:_
    - [ ] Show a placeholder with the text 'Recipient Address' by default
    - [ ] Show, when clicked, a dropdown list of all 'to accounts': the users accounts, plus any other accounts they have previously sent to
    - [ ] Show account address, and account name if it exists, of each item in the dropdown list
    - [ ] Show a dropdown list of all to accounts (see above) whose address matches an address currently being typed in
    - [ ] Set the input text to the address of an account clicked in the dropdown list, and also hide the dropdown
    - [ ] Hide the dropdown without changing what is in the input if the user clicks outside the dropdown list while it is open
    - [ ] Select the text in the input (i.e. the address) if an address is displayed and then clicked
    - [ ] Show a 'required' error if the dropdown is opened but no account is selected
    - [ ] Show an 'invalid address' error if text is entered in the input that cannot be a valid hex address or ens address
    - [ ] Support ens names. (enter dinodan.eth on mainnet) After entering the plain text address, the hex address should appear in the input with a green checkmark beside
    - [ ] Should show a 'no such address' error if a non-existent ens address is entered
  - [ ] **Amount row** _It should:_
    - [ ] allow user to enter any rational number >= 0
    - [ ] allow user to copy and paste into the field
    - [ ] show an insufficient funds error if an amount > balance - gas fee
    - [ ] display 'ETH' after the number amount. The position of 'ETH' should change as the length of the input amount text changes
    - [ ] display the value of the amount of ETH in the current currency, formatted in that currency
    - [ ] show a 'max' but if amount < balance - gas fee
    - [ ] show no max button or error if amount === balance - gas fee
    - [ ] set the amount to balance - gas fee if the 'max' button is clicked
  - [ ] **Gas Fee Display row** _It should:_
    - [ ] Default to the fee given by the estimated gas price
    - [ ] display the fee in ETH and the current currency
    - [ ] update when changes are made using the customize gas modal
  - [ ] **Cancel button** _It should:_
    - [ ] Take the user back to the main screen
  - [ ] **submit button** _It should:_
    - [ ] be disabled if no recipient address is provided or if any field is in error
    - [ ] sign a transaction with the info in the above form, and display the details of that transaction on the confirm screen

## Send token mode
- [ ] **Header** _It should:_
  - [ ] have title "Send Tokens"
  - [ ] have sub title "Only send [token symbol] to an Ethereum address."
  - [ ] return user to main screen when top right X is clicked
- [ ] **From row** _It should:_
  - [ ] Behave the same as 'Send ETH mode' (see above)
- [ ] **To row** _It should:_
  - [ ] Behave the same as 'Send ETH mode' (see above)
- [ ] **Amount row** _It should:_
  - [ ] allow user to enter any rational number >= 0
  - [ ] allow user to copy and paste into the field
  - [ ] show an 'insufficient tokens' error if an amount > token balance
  - [ ] show an 'insufficient funds' error if an gas fee > eth balance
  - [ ] display [token symbol] after the number amount. The position of [token symbol] should change as the length of the input amount text changes
  - [ ] display the value of the amount of tokens in the current currency, formatted in that currency
  - [ ] show a 'max' but if amount < token balance
  - [ ] show no max button or error if amount === token balance
  - [ ] set the amount to token balance if the 'max' button is clicked
- [ ] **Gas Fee Display row** _It should:_
  - [ ] Behave the same as 'Send ETH mode' (see above)
- [ ] **Cancel button** _It should:_
  - [ ] Take the user back to the main screen
- [ ] **submit button** _It should:_
  - [ ] be disabled if no recipient address is provided or if any field is in error
  - [ ] sign a token transaction with the info in the above form, and display the details of that transaction on the confirm screen

## Edit send Eth mode
  - [ ] Say 'Editing transaction' in the header
  - [ ] display a button to go back to the confirmation screen without applying update
  - [ ] say 'update transaction' on the submit button
  - [ ] update the existing transaction, instead of signing a new one, when clicking the submit button
  - [ ] Otherwise, behave the same as 'Send ETH mode' (see above)

## Edit send token mode
  - [ ] Behave the same as 'Edit send Eth mode' (see above)

## Specific cases to test
 - [ ] Send eth to a hex address
 - [ ] Send eth to an ENS address
 - [ ] Donate to the faucet at https://faucet.metamask.io/ and edit the transaction before confirming
 - [ ] Send a token that is available on the 'Add Token' screen search to a hex address
 - [ ] Create a custom token at https://tokenfactory.surge.sh/ and send it to a hex address
 - [ ] Send a token to an ENS address
 - [ ] Create a token transaction using https://tokenfactory.surge.sh/#/, and edit the transaction before confirming
 - [ ] Send each of MKR, EOS and ICON using myetherwallet, and edit the transaction before confirming
