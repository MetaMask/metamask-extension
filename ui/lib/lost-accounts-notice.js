const summary = require('../app/util').addressSummary

module.exports = function (lostAccounts) {
  return {
    date: new Date().toDateString(),
    title: 'Account Problem Caught',
    body: `MetaMask has fixed a bug where some accounts were previously mis-generated. This was a rare issue, but you were affected!

We have successfully imported the accounts that were mis-generated, but they will no longer be recovered with your normal seed phrase.

We have marked the affected accounts as "Loose", and recommend you transfer ether and tokens away from those accounts, or export & back them up elsewhere.

Your affected accounts are:
${lostAccounts.map(acct => ` - ${summary(acct)}`).join('\n')}

These accounts have been marked as "Loose" so they will be easy to recognize in the account list.

For more information, please read [our blog post.][1]

[1]: https://medium.com/metamask/metamask-3-migration-guide-914b79533cdd#.7d8ktj4h3
    `
  }
}
