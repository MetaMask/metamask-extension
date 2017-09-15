window.addEventListener('load', web3Detect)
window.addEventListener('message', console.warn)

function web3Detect() {
  if (global.web3) {
    logToDom('web3 detected!')
    startApp()
  } else {
    logToDom('no web3 detected!')
  }
  if (global.metamask) {
    logToDom('metamask detected!')
  } else {
    logToDom('no metamask detected!')
  }
}

function startApp(){
  console.log('app started')

  var primaryAccount
  console.log('getting main account...')
  web3.eth.getAccounts((err, addresses) => {
    if (err) console.error(err)
    console.log('set address', addresses[0])
    primaryAccount = addresses[0]
  })

  document.querySelector('.action-button-1').addEventListener('click', function(){
    console.log('saw click')
    console.log('sending tx')
    primaryAccount
    web3.eth.sendTransaction({
      from: primaryAccount,
      to: primaryAccount,
      value: 0,
    }, function(err, txHash){
      if (err) throw err
      console.log('sendTransaction result:', err || txHash)
    })
  })
  document.querySelector('.action-button-2').addEventListener('click', function(){
    console.log('saw click')
    setTimeout(function(){
      console.log('sending tx')
      web3.eth.sendTransaction({
        from: primaryAccount,
        to: primaryAccount,
        value: 0,
      }, function(err, txHash){
        if (err) throw err
        console.log('sendTransaction result:', err || txHash)
      })
    })
  })

}

function logToDom(message){
  document.body.appendChild(document.createTextNode(message))
  console.log(message)
}
