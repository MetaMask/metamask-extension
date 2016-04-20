/*
transactions
:
Array[3]
0
:
Object
id
:
1461025348948185
status
:
"confirmed"
time
:
1461025348948
txParams
:
Object
data
:
"0x90b98a11000000000000000000000000c5b8dbac4c1d3f152cdeb400e2313f309c410acb00000000000000000000000000000000000000000000000000000000000003e8"
from
:
"0xfdea65c8e26263f6d9a1b5de9555d2931a33b825"
to
:
"0xcd1ca6275b45065c4db4ec024859f8fd9d8d44ba"
__proto__
:
Object
*/
const h = require('react-hyperscript')
const formatBalance = require('../util').formatBalance

module.exports = function(transactions) {
  return h('details', [

    h('summary', [
      h('div.font-small', {style: {display: 'inline'}}, 'Transaction Summary'),
    ]),

    h('.flex-row.flex-space-around', [
      h('div.font-small','Transaction'),
      h('div.font-small','Amount'),
    ]),

    h('.tx-list', {
        style: {
          overflowY: 'auto',
          height: '180px',
        },
      },

      transactions.map((transaction) => {
        return h('.tx.flex-row.flex-space-around', [
          h('a.font-small',
          {
            href: 'http://testnet.etherscan.io/tx/0xfc37bda95ce571bd0a393e8e7f6da394f1420a57b7d53f7c93821bff61f9b580',
            target: '_blank',
          },
          '0xfc37bda...b580'),
          h('div.font-small', formatBalance(transaction.txParams.value))
        ])
      })
    )

  ])
}
