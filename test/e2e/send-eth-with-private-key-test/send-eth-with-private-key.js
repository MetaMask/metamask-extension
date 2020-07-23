/* eslint-disable */
var Tx = ethereumjs.Tx
var privateKey = ethereumjs.Buffer.Buffer.from('53CB0AB5226EEBF4D872113D98332C1555DC304443BEE1CF759D15798D3C55A9', 'hex')

const web3 = new Web3(new Web3.providers.HttpProvider(`http://localhost:8545`))

const sendButton = document.getElementById('send')

sendButton.addEventListener('click', function () {
  var rawTx = {
    nonce: '0x00',
    gasPrice: '0x09184e72a000', 
    gasLimit: '0x22710',
    value: '0xde0b6b3a7640000',
    r: '0x25a1bc499cd8799a2ece0fcba0df6e666e54a6e2b4e18c09838e2b621c10db71',
    s: '0x6cf83e6e8f6e82a0a1d7bd10bc343fc0ae4b096c1701aa54e6389d447f98ac6f',
    v: '0x2d46',
    to: document.getElementById('address').value,
  }
  var tx = new Tx(rawTx);
  tx.sign(privateKey);

  var serializedTx = tx.serialize();

  web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex')).on('receipt', (transactionResult) => {
    document.getElementById('success').innerHTML = `Successfully sent transaction: ${transactionResult.transactionHash}`
  })
})
