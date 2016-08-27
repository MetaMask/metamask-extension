
window.addEventListener('load', web3Detect)

function web3Detect() {
  if (global.web3) {
    document.body.innerHTML += 'web3 detected!'
    console.log('web3 detected!')
  } else {
    document.body.innerHTML += 'no web3 detected!'
    console.log('no web3 detected!')
  }
  startApp()
}

var primaryAccount = null
web3.eth.getAccounts(function(err, addresses){
  if (err) throw err
  console.log('set address')
  primaryAccount = addresses[0]
})


function startApp(){
  console.log('app started')

  document.querySelector('.action-button-1').addEventListener('click', function(){
    console.log('saw click')
    console.log('sending tx')
    web3.eth.sendTransaction({
      from: primaryAccount,
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
        value: 0,
      }, function(err, txHash){
        if (err) throw err
        console.log('sendTransaction result:', err || txHash)
      })
    })
  })

}
