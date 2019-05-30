const path = require('path')

module.exports = {
  port: 8545,
  accounts: [{
    balance: 12345,
  }],
  db_path: path.resolve(__dirname, './db'),
  default_balance_ether: 5000,
}
