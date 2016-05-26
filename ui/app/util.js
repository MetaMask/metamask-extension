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
  isAllOneCase: isAllOneCase,
  isValidAddress: isValidAddress,
  numericBalance: numericBalance,
  parseBalance: parseBalance,
  formatBalance: formatBalance,
  dataSize: dataSize,
  readableDate: readableDate,
  ethToWei: ethToWei,
  weiToEth: weiToEth,
  normalizeToWei: normalizeToWei,
  normalizeEthStringToWei: normalizeEthStringToWei,
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
  if (!address) return ''
  var checked = ethUtil.toChecksumAddress(address)
  return checked ? checked.slice(0,2+8)+'...'+checked.slice(-4) : '...'
}

function isValidAddress(address) {
  var prefixed = ethUtil.addHexPrefix(address)
  return isAllOneCase(prefixed) && ethUtil.isValidAddress(prefixed) || ethUtil.isValidChecksumAddress(prefixed)
}

function isAllOneCase(address) {
  if (!address) return true
  var lower = address.toLowerCase()
  var upper = address.toUpperCase()
  return address === lower || address === upper
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

// Takes  hex, returns [beforeDecimal, afterDecimal]
function parseBalance(balance) {
  if (!balance || balance === '0x0') return ['0', '0']
  var wei = numericBalance(balance).toString(10)
  var eth = String(wei/valueTable['wei'])
  var beforeDecimal = String(Math.floor(eth))
  var afterDecimal
  if(eth.indexOf('.') > -1){
    afterDecimal = eth.slice(eth.indexOf('.') + 1)
  }else{
    afterDecimal = '0'
  }
  return [beforeDecimal, afterDecimal]
}

// Takes wei hex, returns "None" or "${formattedAmount} ETH"
function formatBalance(balance, decimalsToKeep) {
  var parsed = parseBalance(balance)
  var beforeDecimal = parsed[0]
  var afterDecimal = parsed[1]
  var formatted = "None"
  if(decimalsToKeep === undefined){
    if(beforeDecimal === '0'){
      if(afterDecimal !== '0'){
        var sigFigs = afterDecimal.match(/^0*(.{2})/) //default: grabs 2 most significant digits
        if(sigFigs){afterDecimal = sigFigs[0]}
        formatted = '0.' + afterDecimal + ' ETH'
      }
    }else{
      formatted = beforeDecimal + "." + afterDecimal.slice(0,3) + ' ETH'
    }
  }else{
    afterDecimal += Array(decimalsToKeep).join("0")
    formatted = beforeDecimal + "." + afterDecimal.slice(0,decimalsToKeep) + ' ETH'
  }
  return formatted
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

function normalizeEthStringToWei(str) {
  const parts = str.split('.')
  let eth = new ethUtil.BN(parts[0], 10).mul(bnTable.wei)
  if (parts[1]) {
    var decimal = parts[1]
    while(decimal.length < 18) {
      decimal += '0'
    }
    const decimalBN = new ethUtil.BN(decimal, 10)
    eth = eth.add(decimalBN)
  }
  return eth
}

var multiple = new ethUtil.BN('10000', 10)
function normalizeNumberToWei(n, currency) {
  var enlarged = n * 10000
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
