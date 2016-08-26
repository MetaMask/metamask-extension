
window.addEventListener('load', web3Detect)

function web3Detect() {
  if (global.web3) {
    document.body.innerHTML += 'web3 detected!'
  } else {
    document.body.innerHTML += 'no web3 detected!'
  }
  startApp()
}

var primaryAccount = null
web3.eth.getAccounts(function(err, addresses){
  if (err) throw err
  primaryAccount = addresses[0]
})


function startApp(){
  document.querySelector('.action-button-1').addEventListener('click', function(){
    web3.eth.sendTransaction({
      from: primaryAccount,
      value: 0,
    }, function(err, txHash){
      if (err) throw err
      console.log('sendTransaction result:', err || txHash)
    })
  })
  document.querySelector('.action-button-2').addEventListener('click', function(){
    setTimeout(function(){
      web3.eth.sendTransaction({
        from: primaryAccount,
        value: 0,
      }, function(err, txHash){
        if (err) throw err
        console.log('sendTransaction result:', err || txHash)
      })
    })
  })

}
