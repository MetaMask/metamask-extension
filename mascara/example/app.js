const EthQuery = require('ethjs-query')

window.addEventListener('load', loadProvider)
window.addEventListener('message', console.warn)

async function loadProvider() {
  const ethereumProvider = window.metamask.createDefaultProvider({ host: 'http://localhost:9001' })
  const ethQuery = new EthQuery(ethereumProvider)
  const accounts = await ethQuery.accounts()
  logToDom(accounts.length ? accounts[0] : 'LOCKED or undefined')
  setupButton(ethQuery)
}


function logToDom(message){
  document.getElementById('account').innerText = message
  console.log(message)
}

function setupButton (ethQuery) {
  const button = document.getElementById('action-button-1')
  button.addEventListener('click', async () => {
    const accounts = await ethQuery.accounts()
    logToDom(accounts.length ? accounts[0] : 'LOCKED or undefined')
  })
}