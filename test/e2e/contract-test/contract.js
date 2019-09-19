/*global ethereum*/

/*
The `piggybankContract` is compiled from:

  pragma solidity ^0.4.0;
  contract PiggyBank {

      uint private balance;
      address public owner;

      function PiggyBank() public {
          owner = msg.sender;
          balance = 0;
      }

      function deposit() public payable returns (uint) {
          balance += msg.value;
          return balance;
      }

      function withdraw(uint withdrawAmount) public returns (uint remainingBal) {
          require(msg.sender == owner);
          balance -= withdrawAmount;

          msg.sender.transfer(withdrawAmount);

          return balance;
      }
  }
*/

web3.currentProvider.enable().then(() => {
  var piggybankContract = web3.eth.contract([{'constant': false, 'inputs': [{'name': 'withdrawAmount', 'type': 'uint256'}], 'name': 'withdraw', 'outputs': [{'name': 'remainingBal', 'type': 'uint256'}], 'payable': false, 'stateMutability': 'nonpayable', 'type': 'function'}, {'constant': true, 'inputs': [], 'name': 'owner', 'outputs': [{'name': '', 'type': 'address'}], 'payable': false, 'stateMutability': 'view', 'type': 'function'}, {'constant': false, 'inputs': [], 'name': 'deposit', 'outputs': [{'name': '', 'type': 'uint256'}], 'payable': true, 'stateMutability': 'payable', 'type': 'function'}, {'inputs': [], 'payable': false, 'stateMutability': 'nonpayable', 'type': 'constructor'}])
  const deployButton = document.getElementById('deployButton')
  const depositButton = document.getElementById('depositButton')
  const withdrawButton = document.getElementById('withdrawButton')
  const sendButton = document.getElementById('sendButton')
  const createToken = document.getElementById('createToken')
  const transferTokens = document.getElementById('transferTokens')
  const approveTokens = document.getElementById('approveTokens')
  const transferTokensWithoutGas = document.getElementById('transferTokensWithoutGas')
  const approveTokensWithoutGas = document.getElementById('approveTokensWithoutGas')

  deployButton.addEventListener('click', async function () {
    document.getElementById('contractStatus').innerHTML = 'Deploying'

    var piggybank = await piggybankContract.new(
      {
        from: web3.eth.accounts[0],
        data: '0x608060405234801561001057600080fd5b5033600160006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055506000808190555061023b806100686000396000f300608060405260043610610057576000357c0100000000000000000000000000000000000000000000000000000000900463ffffffff1680632e1a7d4d1461005c5780638da5cb5b1461009d578063d0e30db0146100f4575b600080fd5b34801561006857600080fd5b5061008760048036038101908080359060200190929190505050610112565b6040518082815260200191505060405180910390f35b3480156100a957600080fd5b506100b26101d0565b604051808273ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200191505060405180910390f35b6100fc6101f6565b6040518082815260200191505060405180910390f35b6000600160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff1614151561017057600080fd5b8160008082825403925050819055503373ffffffffffffffffffffffffffffffffffffffff166108fc839081150290604051600060405180830381858888f193505050501580156101c5573d6000803e3d6000fd5b506000549050919050565b600160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b60003460008082825401925050819055506000549050905600a165627a7a72305820f237db3ec816a52589d82512117bc85bc08d3537683ffeff9059108caf3e5d400029',
        gas: '4700000',
      }, function (e, contract) {
        if (e) {
          throw e
        }
        if (typeof contract.address !== 'undefined') {
          console.log('Contract mined! address: ' + contract.address + ' transactionHash: ' + contract.transactionHash)

          document.getElementById('contractStatus').innerHTML = 'Deployed'

          depositButton.addEventListener('click', function () {
            document.getElementById('contractStatus').innerHTML = 'Deposit initiated'
            contract.deposit({ from: web3.eth.accounts[0], value: '0x3782dace9d900000' }, function (result) {
              console.log(result)
              document.getElementById('contractStatus').innerHTML = 'Deposit completed'
            })
          })

          withdrawButton.addEventListener('click', function () {
            contract.withdraw('0xde0b6b3a7640000', { from: web3.eth.accounts[0] }, function (result) {
              console.log(result)
              document.getElementById('contractStatus').innerHTML = 'Withdrawn'
            })
          })
        }
      })

    console.log(piggybank)
  })

  sendButton.addEventListener('click', function () {
    web3.eth.sendTransaction({
      from: web3.eth.accounts[0],
      to: '0x2f318C334780961FB129D2a6c30D0763d9a5C970',
      value: '0x29a2241af62c0000',
      gas: 21000,
      gasPrice: 20000000000,
    }, (result) => {
      console.log(result)
    })
  })


  createToken.addEventListener('click', async function () {
    var _initialAmount = 100
    var _tokenName = 'TST'
    var _decimalUnits = 0
    var _tokenSymbol = 'TST'
    var humanstandardtokenContract = web3.eth.contract([{'constant': true, 'inputs': [], 'name': 'name', 'outputs': [{'name': '', 'type': 'string'}], 'payable': false, 'stateMutability': 'view', 'type': 'function'}, {'constant': false, 'inputs': [{'name': '_spender', 'type': 'address'}, {'name': '_value', 'type': 'uint256'}], 'name': 'approve', 'outputs': [{'name': 'success', 'type': 'bool'}], 'payable': false, 'stateMutability': 'nonpayable', 'type': 'function'}, {'constant': true, 'inputs': [], 'name': 'totalSupply', 'outputs': [{'name': '', 'type': 'uint256'}], 'payable': false, 'stateMutability': 'view', 'type': 'function'}, {'constant': false, 'inputs': [{'name': '_from', 'type': 'address'}, {'name': '_to', 'type': 'address'}, {'name': '_value', 'type': 'uint256'}], 'name': 'transferFrom', 'outputs': [{'name': 'success', 'type': 'bool'}], 'payable': false, 'stateMutability': 'nonpayable', 'type': 'function'}, {'constant': true, 'inputs': [], 'name': 'decimals', 'outputs': [{'name': '', 'type': 'uint8'}], 'payable': false, 'stateMutability': 'view', 'type': 'function'}, {'constant': true, 'inputs': [], 'name': 'version', 'outputs': [{'name': '', 'type': 'string'}], 'payable': false, 'stateMutability': 'view', 'type': 'function'}, {'constant': true, 'inputs': [{'name': '_owner', 'type': 'address'}], 'name': 'balanceOf', 'outputs': [{'name': 'balance', 'type': 'uint256'}], 'payable': false, 'stateMutability': 'view', 'type': 'function'}, {'constant': true, 'inputs': [], 'name': 'symbol', 'outputs': [{'name': '', 'type': 'string'}], 'payable': false, 'stateMutability': 'view', 'type': 'function'}, {'constant': false, 'inputs': [{'name': '_to', 'type': 'address'}, {'name': '_value', 'type': 'uint256'}], 'name': 'transfer', 'outputs': [{'name': 'success', 'type': 'bool'}], 'payable': false, 'stateMutability': 'nonpayable', 'type': 'function'}, {'constant': false, 'inputs': [{'name': '_spender', 'type': 'address'}, {'name': '_value', 'type': 'uint256'}, {'name': '_extraData', 'type': 'bytes'}], 'name': 'approveAndCall', 'outputs': [{'name': 'success', 'type': 'bool'}], 'payable': false, 'stateMutability': 'nonpayable', 'type': 'function'}, {'constant': true, 'inputs': [{'name': '_owner', 'type': 'address'}, {'name': '_spender', 'type': 'address'}], 'name': 'allowance', 'outputs': [{'name': 'remaining', 'type': 'uint256'}], 'payable': false, 'stateMutability': 'view', 'type': 'function'}, {'inputs': [{'name': '_initialAmount', 'type': 'uint256'}, {'name': '_tokenName', 'type': 'string'}, {'name': '_decimalUnits', 'type': 'uint8'}, {'name': '_tokenSymbol', 'type': 'string'}], 'payable': false, 'stateMutability': 'nonpayable', 'type': 'constructor'}, {'payable': false, 'stateMutability': 'nonpayable', 'type': 'fallback'}, {'anonymous': false, 'inputs': [{'indexed': true, 'name': '_from', 'type': 'address'}, {'indexed': true, 'name': '_to', 'type': 'address'}, {'indexed': false, 'name': '_value', 'type': 'uint256'}], 'name': 'Transfer', 'type': 'event'}, {'anonymous': false, 'inputs': [{'indexed': true, 'name': '_owner', 'type': 'address'}, {'indexed': true, 'name': '_spender', 'type': 'address'}, {'indexed': false, 'name': '_value', 'type': 'uint256'}], 'name': 'Approval', 'type': 'event'}])
    return humanstandardtokenContract.new(
      _initialAmount,
      _tokenName,
      _decimalUnits,
      _tokenSymbol,
      {
        from: web3.eth.accounts[0],
        data: '0x60806040523480156200001157600080fd5b506040516200156638038062001566833981018060405260808110156200003757600080fd5b8101908080516401000000008111156200005057600080fd5b828101905060208101848111156200006757600080fd5b81518560018202830111640100000000821117156200008557600080fd5b50509291906020018051640100000000811115620000a257600080fd5b82810190506020810184811115620000b957600080fd5b8151856001820283011164010000000082111715620000d757600080fd5b5050929190602001805190602001909291908051906020019092919050505083838382600390805190602001906200011192919062000305565b5081600490805190602001906200012a92919062000305565b5080600560006101000a81548160ff021916908360ff1602179055505050506200016433826200016e640100000000026401000000009004565b50505050620003b4565b600073ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff1614151515620001ab57600080fd5b620001d081600254620002e36401000000000262001155179091906401000000009004565b60028190555062000237816000808573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002054620002e36401000000000262001155179091906401000000009004565b6000808473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020819055508173ffffffffffffffffffffffffffffffffffffffff16600073ffffffffffffffffffffffffffffffffffffffff167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef836040518082815260200191505060405180910390a35050565b6000808284019050838110151515620002fb57600080fd5b8091505092915050565b828054600181600116156101000203166002900490600052602060002090601f016020900481019282601f106200034857805160ff191683800117855562000379565b8280016001018555821562000379579182015b82811115620003785782518255916020019190600101906200035b565b5b5090506200038891906200038c565b5090565b620003b191905b80821115620003ad57600081600090555060010162000393565b5090565b90565b6111a280620003c46000396000f3fe6080604052600436106100af576000357c0100000000000000000000000000000000000000000000000000000000900463ffffffff16806306fdde03146100b4578063095ea7b31461014457806318160ddd146101b757806323b872dd146101e2578063313ce5671461027557806339509351146102a657806370a082311461031957806395d89b411461037e578063a457c2d71461040e578063a9059cbb14610481578063dd62ed3e146104f4575b600080fd5b3480156100c057600080fd5b506100c9610579565b6040518080602001828103825283818151815260200191508051906020019080838360005b838110156101095780820151818401526020810190506100ee565b50505050905090810190601f1680156101365780820380516001836020036101000a031916815260200191505b509250505060405180910390f35b34801561015057600080fd5b5061019d6004803603604081101561016757600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff1690602001909291908035906020019092919050505061061b565b604051808215151515815260200191505060405180910390f35b3480156101c357600080fd5b506101cc610748565b6040518082815260200191505060405180910390f35b3480156101ee57600080fd5b5061025b6004803603606081101561020557600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff169060200190929190803573ffffffffffffffffffffffffffffffffffffffff16906020019092919080359060200190929190505050610752565b604051808215151515815260200191505060405180910390f35b34801561028157600080fd5b5061028a61095a565b604051808260ff1660ff16815260200191505060405180910390f35b3480156102b257600080fd5b506102ff600480360360408110156102c957600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff16906020019092919080359060200190929190505050610971565b604051808215151515815260200191505060405180910390f35b34801561032557600080fd5b506103686004803603602081101561033c57600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff169060200190929190505050610ba8565b6040518082815260200191505060405180910390f35b34801561038a57600080fd5b50610393610bf0565b6040518080602001828103825283818151815260200191508051906020019080838360005b838110156103d35780820151818401526020810190506103b8565b50505050905090810190601f1680156104005780820380516001836020036101000a031916815260200191505b509250505060405180910390f35b34801561041a57600080fd5b506104676004803603604081101561043157600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff16906020019092919080359060200190929190505050610c92565b604051808215151515815260200191505060405180910390f35b34801561048d57600080fd5b506104da600480360360408110156104a457600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff16906020019092919080359060200190929190505050610ec9565b604051808215151515815260200191505060405180910390f35b34801561050057600080fd5b506105636004803603604081101561051757600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff169060200190929190803573ffffffffffffffffffffffffffffffffffffffff169060200190929190505050610ee0565b6040518082815260200191505060405180910390f35b606060038054600181600116156101000203166002900480601f0160208091040260200160405190810160405280929190818152602001828054600181600116156101000203166002900480156106115780601f106105e657610100808354040283529160200191610611565b820191906000526020600020905b8154815290600101906020018083116105f457829003601f168201915b5050505050905090565b60008073ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff161415151561065857600080fd5b81600160003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020819055508273ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff167f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925846040518082815260200191505060405180910390a36001905092915050565b6000600254905090565b60006107e382600160008773ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002054610f6790919063ffffffff16565b600160008673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000208190555061086e848484610f89565b3373ffffffffffffffffffffffffffffffffffffffff168473ffffffffffffffffffffffffffffffffffffffff167f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925600160008873ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020546040518082815260200191505060405180910390a3600190509392505050565b6000600560009054906101000a900460ff16905090565b60008073ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff16141515156109ae57600080fd5b610a3d82600160003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000205461115590919063ffffffff16565b600160003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020819055508273ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff167f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925600160003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008773ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020546040518082815260200191505060405180910390a36001905092915050565b60008060008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020549050919050565b606060048054600181600116156101000203166002900480601f016020809104026020016040519081016040528092919081815260200182805460018160011615610100020316600290048015610c885780601f10610c5d57610100808354040283529160200191610c88565b820191906000526020600020905b815481529060010190602001808311610c6b57829003601f168201915b5050505050905090565b60008073ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff1614151515610ccf57600080fd5b610d5e82600160003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002054610f6790919063ffffffff16565b600160003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020819055508273ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff167f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925600160003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008773ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020546040518082815260200191505060405180910390a36001905092915050565b6000610ed6338484610f89565b6001905092915050565b6000600160008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002054905092915050565b6000828211151515610f7857600080fd5b600082840390508091505092915050565b600073ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff1614151515610fc557600080fd5b611016816000808673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002054610f6790919063ffffffff16565b6000808573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020819055506110a9816000808573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000205461115590919063ffffffff16565b6000808473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020819055508173ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef836040518082815260200191505060405180910390a3505050565b600080828401905083811015151561116c57600080fd5b809150509291505056fea165627a7a723058205fcdfea06f4d97b442bc9f444b1e92524bc66398eb4f37ed5a99f2093a8842640029000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000c0000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000186a00000000000000000000000000000000000000000000000000000000000000003545354000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000035453540000000000000000000000000000000000000000000000000000000000',
        gas: '4700000',
        gasPrice: '20000000000',
      }, function (e, contract) {
        console.log(e, contract)
        if (typeof contract.address !== 'undefined') {
          console.log('Contract mined! address: ' + contract.address + ' transactionHash: ' + contract.transactionHash)

          document.getElementById('tokenAddress').innerHTML = contract.address

          transferTokens.addEventListener('click', function (event) {
            console.log(`event`, event)
            contract.transfer('0x2f318C334780961FB129D2a6c30D0763d9a5C970', '15000', {
              from: web3.eth.accounts[0],
              to: contract.address,
              data: '0xa9059cbb0000000000000000000000002f318c334780961fb129d2a6c30d0763d9a5c9700000000000000000000000000000000000000000000000000000000000003a98',
              gas: 60000,
              gasPrice: '20000000000',
            }, function (result) {
              console.log('result', result)
            })
          })

          approveTokens.addEventListener('click', function () {
            contract.approve('0x9bc5baF874d2DA8D216aE9f137804184EE5AfEF4', '70000', {
              from: web3.eth.accounts[0],
              to: contract.address,
              data: '0x095ea7b30000000000000000000000009bc5baF874d2DA8D216aE9f137804184EE5AfEF40000000000000000000000000000000000000000000000000000000000000005',
              gas: 60000,
              gasPrice: '20000000000',
            }, function (result) {
              console.log(result)
            })
          })

          transferTokensWithoutGas.addEventListener('click', function (event) {
            console.log(`event`, event)
            contract.transfer('0x2f318C334780961FB129D2a6c30D0763d9a5C970', '15000', {
              from: web3.eth.accounts[0],
              to: contract.address,
              data: '0xa9059cbb0000000000000000000000002f318c334780961fb129d2a6c30d0763d9a5c9700000000000000000000000000000000000000000000000000000000000003a98',
              gasPrice: '20000000000',
            }, function (result) {
              console.log('result', result)
            })
          })

          approveTokensWithoutGas.addEventListener('click', function () {
            contract.approve('0x2f318C334780961FB129D2a6c30D0763d9a5C970', '70000', {
              from: web3.eth.accounts[0],
              to: contract.address,
              data: '0x095ea7b30000000000000000000000002f318C334780961FB129D2a6c30D0763d9a5C9700000000000000000000000000000000000000000000000000000000000000005',
              gasPrice: '20000000000',
            }, function (result) {
              console.log(result)
            })
          })
        }
      })

  })

  ethereum.autoRefreshOnNetworkChange = false

  const networkDiv = document.getElementById('network')
  const chainIdDiv = document.getElementById('chainId')
  const accountsDiv = document.getElementById('accounts')

  ethereum.on('networkChanged', (networkId) => {
    networkDiv.innerHTML = networkId
  })

  ethereum.on('chainIdChanged', (chainId) => {
    chainIdDiv.innerHTML = chainId
  })

  ethereum.on('accountsChanged', (accounts) => {
    accountsDiv.innerHTML = accounts
  })
})
