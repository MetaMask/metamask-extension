const path = require('path')

module.exports = {
  accounts: [{
    balance: 12345,
  }],
  db_path: path.resolve(__dirname, './db'),
  default_balance_ether: 5000,
}
