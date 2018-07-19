const extension = require('extensionizer')

// Confirmed tx
// Transaction ${tx.nonce} confirmed! View on Etherscan

// Failed tx
// Transaction ${tx.nonce} failed. (Maybe append tx.error.message)

// Dropped tx
// A Transaction ${tx.nonce} was dropped, because another transaction with that number was successfully processed.

function showConfirmedNotification (txMeta) {
  extension.notifications.create({
    "type": "basic",
    "title": "Confirmed transaction",
    "iconUrl": extension.extension.getURL('../../../../images/icon-64.png'),
    "message": JSON.stringify(txMeta)
  });
}


/**
@module
*/
module.exports = {
  showConfirmedNotification
}