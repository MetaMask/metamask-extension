const identitiesUrl = 'https://alpha.metamask.io/identities/'
const messagingChannelName = 'metamask'

var unconfirmedTxs = {}

// setup badge click handler
chrome.browserAction.onClicked.addListener(function(activeTab) {
  chrome.tabs.create({ url: identitiesUrl })
})

// setup content-background messaging
chrome.runtime.onConnect.addListener(function(port) {
  port.onMessage.addListener(handleMessage)
})

// listen to storage changes
chrome.storage.onChanged.addListener(function(changes, namespace) {
  for (key in changes) {
    var storageChange = changes[key]
    console.log('Storage key "%s" in namespace "%s" changed. ' +
                'Old value was "%s", new value is:',
                key,
                namespace,
                storageChange.oldValue,
                storageChange.newValue)
    if (storageChange.oldValue && !storageChange.newValue) {
      // was removed
      removeTransaction(storageChange.oldValue)
    } else if (!storageChange.oldValue && storageChange.newValue) {
      // was added
      addTransaction(deserializeTx(storageChange.newValue))
    }
  }
})

// setup badge text
updateBadge()

function handleMessage(msg){
  console.log('got message!', msg.type)
  switch(msg.type){
    
    case 'addUnconfirmedTx':
      addTransaction(msg.payload)
      return

    case 'removeUnconfirmedTx':
      removeTransaction(msg.payload)
      return

  }
}

function addTransaction(tx){
  var serialized = serializeTx(tx)
  var hash = simpleHash(serialized)
  console.log('add tx: ', tx.id, hash, serializeTx(tx), tx)
  unconfirmedTxs[hash] = tx
  var data = {}
  data[hash] = serialized
  chrome.storage.sync.set(data)
  // trigger ui changes
  updateBadge()
}

function removeTransaction(serialized){
  var hash = simpleHash(serialized)
  delete unconfirmedTxs[hash]
  var data = {}
  data[hash] = undefined
  chrome.storage.sync.set(data)
  // trigger ui changes
  updateBadge()
}

function updateBadge(){
  var label = ''
  var count = Object.keys(unconfirmedTxs).length
  if (count) {
    label = String(count)
  }
  chrome.browserAction.setBadgeText({text: label})
  chrome.browserAction.setBadgeBackgroundColor({color: '#506F8B'})
}

function simpleHash(input) {
  var hash = 0, i, chr, len
  if (input.length == 0) return hash
  for (i = 0, len = input.length; i < len; i++) {
    chr   = input.charCodeAt(i)
    hash  = ((hash << 5) - hash) + chr
    hash |= 0 // Convert to 32bit integer
  }
  return hash
}

function serializeTx(tx){
  return JSON.stringify(tx)
}

function deserializeTx(tx){
  return JSON.parse(tx)
}