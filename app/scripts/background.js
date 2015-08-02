const identitiesUrl = 'https://alpha.metamask.io/identities/'
const messagingChannelName = 'metamask'

var pendingTxs = []

// setup badge click handler
chrome.browserAction.onClicked.addListener(function(activeTab) {
  chrome.tabs.create({ url: identitiesUrl })
})

// setup page<->plugin messaging
chrome.runtime.onConnect.addListener(function(port) {
  console.assert(port.name == messagingChannelName)
  port.onMessage.addListener(function(msg) {
    addTransaction(msg.payload)
  })
})

// listen to storage changes
// chrome.storage.onChanged.addListener(function(changes, namespace) {
//   for (key in changes) {
//     var storageChange = changes[key]
//     console.log('Storage key "%s" in namespace "%s" changed. ' +
//                 'Old value was "%s", new value is "%s".',
//                 key,
//                 namespace,
//                 storageChange.oldValue,
//                 storageChange.newValue)
//   }
// })

// // Save it using the Chrome extension storage API.
// chrome.storage.sync.set({'zzz': 22}, function() {
//   // Notify that we saved.
//   console.log('Settings saved')
// })

// update badge text
updateBadge()


function addTransaction(tx){
  pendingTxs.push(tx)
  updateBadge()
}

function updateBadge(){
  var label = ''
  if (pendingTxs.length) {
    label = String(pendingTxs.length)
  }
  chrome.browserAction.setBadgeText({text: label})
}