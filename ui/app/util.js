const ethUtil = require('ethereumjs-util')

var valueTable = {
  wei:   '1000000000000000000',
  kwei:  '1000000000000000',
  mwei:  '1000000000000',
  gwei:  '1000000000',
  szabo: '1000000',
  finney:'1000',
  ether: '1',
  kether:'0.001',
  mether:'0.000001',
  gether:'0.000000001',
  tether:'0.000000000001',
}
var bnTable = {}
for (var currency in valueTable) {
  bnTable[currency] = new ethUtil.BN(valueTable[currency], 10)
}

module.exports = {
  valuesFor: valuesFor,
  addressSummary: addressSummary,
  numericBalance: numericBalance,
  formatBalance: formatBalance,
  dataSize: dataSize,
  readableDate: readableDate,
  ethToWei: ethToWei,
  weiToEth: weiToEth,
  normalizeToWei: normalizeToWei,
  normalizeNumberToWei: normalizeNumberToWei,
  valueTable: valueTable,
  bnTable: bnTable,
}


function valuesFor(obj) {
  if (!obj) return []
  return Object.keys(obj)
    .map(function(key){ return obj[key] })
}

function addressSummary(address) {
  return address ? address.slice(0,2+8)+'...'+address.slice(-4) : '...'
}

// Takes wei Hex, returns wei BN, even if input is null
function numericBalance(balance) {
  if (!balance) return new ethUtil.BN(0, 16)
  var stripped = ethUtil.stripHexPrefix(balance)
  return new ethUtil.BN(stripped, 16)
}

// Takes eth BN, returns BN wei
function ethToWei(bn) {
  var eth = new ethUtil.BN('1000000000000000000')
  var wei = bn.mul(eth)
  return wei
}

// Takes BN in Wei, returns BN in eth
function weiToEth(bn) {
  var diff = new ethUtil.BN('1000000000000000000')
  var eth = bn.div(diff)
  return eth
}

var decimalsToKeep = 4
function formatBalance(balance) {
  if (!balance || balance === '0x0') return 'None'
  var wei = numericBalance(balance)
  var padded = wei.toString(10)
  var len = padded.length
  var nonZeroIndex = padded.match(/[^0]/) && padded.match(/[^0]/).index
  var beforeDecimal = padded.substr(nonZeroIndex ? nonZeroIndex : 0, len - 18) || '0'
  var afterDecimal = padded.substr(len - 18, decimalsToKeep)
  return `${beforeDecimal}.${afterDecimal} ETH`
}

function dataSize(data) {
  var size = data ? ethUtil.stripHexPrefix(data).length : 0
  return size+' bytes'
}

// Takes a BN and an ethereum currency name,
// returns a BN in wei
function normalizeToWei(amount, currency) {
  try {
    return amount.mul(bnTable.wei).div(bnTable[currency])
  } catch (e) {}
  return amount
}

var multiple = new ethUtil.BN('1000', 10)
function normalizeNumberToWei(n, currency) {
  var enlarged = n * 1000
  var amount = new ethUtil.BN(String(enlarged), 10)
  return normalizeToWei(amount, currency).div(multiple)
}

function readableDate(ms) {
  var date = new Date(ms)
  var month = date.getMonth()
  var day = date.getDate()
  var year = date.getFullYear()
  var hours = date.getHours()
  var minutes = "0" + date.getMinutes()
  var seconds = "0" + date.getSeconds()

  var date = `${month}/${day}/${year}`
  var time = `${hours}:${minutes.substr(-2)}:${seconds.substr(-2)}`
  return `${date} ${time}`
}
