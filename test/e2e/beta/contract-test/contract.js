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

var piggybankContract = web3.eth.contract([{'constant': false, 'inputs': [{'name': 'withdrawAmount', 'type': 'uint256'}], 'name': 'withdraw', 'outputs': [{'name': 'remainingBal', 'type': 'uint256'}], 'payable': false, 'stateMutability': 'nonpayable', 'type': 'function'}, {'constant': true, 'inputs': [], 'name': 'owner', 'outputs': [{'name': '', 'type': 'address'}], 'payable': false, 'stateMutability': 'view', 'type': 'function'}, {'constant': false, 'inputs': [], 'name': 'deposit', 'outputs': [{'name': '', 'type': 'uint256'}], 'payable': true, 'stateMutability': 'payable', 'type': 'function'}, {'inputs': [], 'payable': false, 'stateMutability': 'nonpayable', 'type': 'constructor'}])
const deployButton = document.getElementById('deployButton')
const depositButton = document.getElementById('depositButton')
const withdrawButton = document.getElementById('withdrawButton')
const sendButton = document.getElementById('sendButton')
const createToken = document.getElementById('createToken')
const transferTokens = document.getElementById('transferTokens')
const approveTokens = document.getElementById('approveTokens')

deployButton.addEventListener('click', async function (event) {
  var piggybank = await piggybankContract.new(
    {
      from: web3.eth.accounts[0],
      data: '0x608060405234801561001057600080fd5b5033600160006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055506000808190555061023b806100686000396000f300608060405260043610610057576000357c0100000000000000000000000000000000000000000000000000000000900463ffffffff1680632e1a7d4d1461005c5780638da5cb5b1461009d578063d0e30db0146100f4575b600080fd5b34801561006857600080fd5b5061008760048036038101908080359060200190929190505050610112565b6040518082815260200191505060405180910390f35b3480156100a957600080fd5b506100b26101d0565b604051808273ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200191505060405180910390f35b6100fc6101f6565b6040518082815260200191505060405180910390f35b6000600160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff1614151561017057600080fd5b8160008082825403925050819055503373ffffffffffffffffffffffffffffffffffffffff166108fc839081150290604051600060405180830381858888f193505050501580156101c5573d6000803e3d6000fd5b506000549050919050565b600160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b60003460008082825401925050819055506000549050905600a165627a7a72305820f237db3ec816a52589d82512117bc85bc08d3537683ffeff9059108caf3e5d400029',
      gas: '4700000',
    }, function (e, contract) {
      console.log(e, contract)
      if (typeof contract.address !== 'undefined') {
        console.log('Contract mined! address: ' + contract.address + ' transactionHash: ' + contract.transactionHash)

        console.log(`contract`, contract)

        document.getElementById('contractStatus').innerHTML = 'Deployed'

        depositButton.addEventListener('click', function (event) {
          document.getElementById('contractStatus').innerHTML = 'Deposit initiated'
          contract.deposit({ from: web3.eth.accounts[0], value: '0x3782dace9d900000' }, function (result) {
            console.log(result)
            document.getElementById('contractStatus').innerHTML = 'Deposit completed'
          })
        })

        withdrawButton.addEventListener('click', function (event) {
          contract.withdraw('0xde0b6b3a7640000', { from: web3.eth.accounts[0] }, function (result) {
            console.log(result)
            document.getElementById('contractStatus').innerHTML = 'Withdrawn'
          })
        })
      }
  })

  console.log(piggybank)
})

sendButton.addEventListener('click', function (event) {
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


createToken.addEventListener('click', async function (event) {
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
       data: '0x60806040526040805190810160405280600481526020017f48302e3100000000000000000000000000000000000000000000000000000000815250600690805190602001906200005192919062000143565b503480156200005f57600080fd5b50604051620011f3380380620011f383398101806040528101908080519060200190929190805182019291906020018051906020019092919080518201929190505050836000803373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020819055508360028190555082600390805190602001906200010492919062000143565b5081600460006101000a81548160ff021916908360ff16021790555080600590805190602001906200013892919062000143565b5050505050620001f2565b828054600181600116156101000203166002900490600052602060002090601f016020900481019282601f106200018657805160ff1916838001178555620001b7565b82800160010185558215620001b7579182015b82811115620001b657825182559160200191906001019062000199565b5b509050620001c69190620001ca565b5090565b620001ef91905b80821115620001eb576000816000905550600101620001d1565b5090565b90565b610ff180620002026000396000f3006080604052600436106100af576000357c0100000000000000000000000000000000000000000000000000000000900463ffffffff16806306fdde03146100c1578063095ea7b31461015157806318160ddd146101b657806323b872dd146101e1578063313ce5671461026657806354fd4d501461029757806370a082311461032757806395d89b411461037e578063a9059cbb1461040e578063cae9ca5114610473578063dd62ed3e1461051e575b3480156100bb57600080fd5b50600080fd5b3480156100cd57600080fd5b506100d6610595565b6040518080602001828103825283818151815260200191508051906020019080838360005b838110156101165780820151818401526020810190506100fb565b50505050905090810190601f1680156101435780820380516001836020036101000a031916815260200191505b509250505060405180910390f35b34801561015d57600080fd5b5061019c600480360381019080803573ffffffffffffffffffffffffffffffffffffffff16906020019092919080359060200190929190505050610633565b604051808215151515815260200191505060405180910390f35b3480156101c257600080fd5b506101cb610725565b6040518082815260200191505060405180910390f35b3480156101ed57600080fd5b5061024c600480360381019080803573ffffffffffffffffffffffffffffffffffffffff169060200190929190803573ffffffffffffffffffffffffffffffffffffffff1690602001909291908035906020019092919050505061072b565b604051808215151515815260200191505060405180910390f35b34801561027257600080fd5b5061027b6109a4565b604051808260ff1660ff16815260200191505060405180910390f35b3480156102a357600080fd5b506102ac6109b7565b6040518080602001828103825283818151815260200191508051906020019080838360005b838110156102ec5780820151818401526020810190506102d1565b50505050905090810190601f1680156103195780820380516001836020036101000a031916815260200191505b509250505060405180910390f35b34801561033357600080fd5b50610368600480360381019080803573ffffffffffffffffffffffffffffffffffffffff169060200190929190505050610a55565b6040518082815260200191505060405180910390f35b34801561038a57600080fd5b50610393610a9d565b6040518080602001828103825283818151815260200191508051906020019080838360005b838110156103d35780820151818401526020810190506103b8565b50505050905090810190601f1680156104005780820380516001836020036101000a031916815260200191505b509250505060405180910390f35b34801561041a57600080fd5b50610459600480360381019080803573ffffffffffffffffffffffffffffffffffffffff16906020019092919080359060200190929190505050610b3b565b604051808215151515815260200191505060405180910390f35b34801561047f57600080fd5b50610504600480360381019080803573ffffffffffffffffffffffffffffffffffffffff16906020019092919080359060200190929190803590602001908201803590602001908080601f0160208091040260200160405190810160405280939291908181526020018383808284378201915050505050509192919290505050610ca1565b604051808215151515815260200191505060405180910390f35b34801561052a57600080fd5b5061057f600480360381019080803573ffffffffffffffffffffffffffffffffffffffff169060200190929190803573ffffffffffffffffffffffffffffffffffffffff169060200190929190505050610f3e565b6040518082815260200191505060405180910390f35b60038054600181600116156101000203166002900480601f01602080910402602001604051908101604052809291908181526020018280546001816001161561010002031660029004801561062b5780601f106106005761010080835404028352916020019161062b565b820191906000526020600020905b81548152906001019060200180831161060e57829003601f168201915b505050505081565b600081600160003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020819055508273ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff167f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925846040518082815260200191505060405180910390a36001905092915050565b60025481565b6000816000808673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002054101580156107f7575081600160008673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000205410155b80156108035750600082115b1561099857816000808573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008282540192505081905550816000808673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000206000828254039250508190555081600160008673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020600082825403925050819055508273ffffffffffffffffffffffffffffffffffffffff168473ffffffffffffffffffffffffffffffffffffffff167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef846040518082815260200191505060405180910390a36001905061099d565b600090505b9392505050565b600460009054906101000a900460ff1681565b60068054600181600116156101000203166002900480601f016020809104026020016040519081016040528092919081815260200182805460018160011615610100020316600290048015610a4d5780601f10610a2257610100808354040283529160200191610a4d565b820191906000526020600020905b815481529060010190602001808311610a3057829003601f168201915b505050505081565b60008060008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020549050919050565b60058054600181600116156101000203166002900480601f016020809104026020016040519081016040528092919081815260200182805460018160011615610100020316600290048015610b335780601f10610b0857610100808354040283529160200191610b33565b820191906000526020600020905b815481529060010190602001808311610b1657829003601f168201915b505050505081565b6000816000803373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000205410158015610b8b5750600082115b15610c9657816000803373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008282540392505081905550816000808573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020600082825401925050819055508273ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef846040518082815260200191505060405180910390a360019050610c9b565b600090505b92915050565b600082600160003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020819055508373ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff167f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925856040518082815260200191505060405180910390a38373ffffffffffffffffffffffffffffffffffffffff1660405180807f72656365697665417070726f76616c28616464726573732c75696e743235362c81526020017f616464726573732c627974657329000000000000000000000000000000000000815250602e01905060405180910390207c01000000000000000000000000000000000000000000000000000000009004338530866040518563ffffffff167c0100000000000000000000000000000000000000000000000000000000028152600401808573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020018481526020018373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001828051906020019080838360005b83811015610ee2578082015181840152602081019050610ec7565b50505050905090810190601f168015610f0f5780820380516001836020036101000a031916815260200191505b509450505050506000604051808303816000875af1925050501515610f3357600080fd5b600190509392505050565b6000600160008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020549050929150505600a165627a7a723058200052919e0bc22b5adcd3d320be977df3a1dcc35d1a0160287383ba371900a1c50029',
       gas: '4700000',
       gasPrice: '20000000000',
     }, function (e, contract) {
      console.log(e, contract)
      if (typeof contract.address !== 'undefined') {
        console.log('Contract mined! address: ' + contract.address + ' transactionHash: ' + contract.transactionHash)

        document.getElementById('tokenAddress').innerHTML = contract.address

        transferTokens.addEventListener('click', function (event) {
          console.log(`event`, event)
          contract.transfer('0x2f318C334780961FB129D2a6c30D0763d9a5C970', '7', {
            from: web3.eth.accounts[0],
            to: contract.address,
            data: '0xa9059cbb0000000000000000000000002f318C334780961FB129D2a6c30D0763d9a5C970000000000000000000000000000000000000000000000000000000000000000a',
            gas: 60000,
            gasPrice: '20000000000',
          }, function (result) {
            console.log('result', result)
          })
        })

        approveTokens.addEventListener('click', function (event) {
          contract.approve('0x2f318C334780961FB129D2a6c30D0763d9a5C970', '7', {
            from: web3.eth.accounts[0],
            to: contract.address,
            data: '0x095ea7b30000000000000000000000002f318C334780961FB129D2a6c30D0763d9a5C9700000000000000000000000000000000000000000000000000000000000000005',
            gas: 60000,
            gasPrice: '20000000000',
          }, function (result) {
            console.log(result)
          })
        })
      }
   })

})

