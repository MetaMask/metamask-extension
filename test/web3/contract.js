var json = require('./schema.js');

  web3.currentProvider.enable().then(() => {

  var ethblockNumber = document.getElementById("ethblockNumber");
  var eth_gasPrice = document.getElementById("eth_gasPrice");
  var eth_newBlockFilter = document.getElementById("eth_newBlockFilter");
  var eth_newPendingTransactionFilter = document.getElementById("eth_newPendingTransactionFilter");
  var eth_getUncleCountByBlockHash = document.getElementById("eth_getUncleCountByBlockHash");
  var eth_getBlockTransactionCountByHash = document.getElementById("eth_getBlockTransactionCountByHash");
  var eth_getTransactionCount = document.getElementById("eth_getTransactionCount");
  var eth_getBalance = document.getElementById("eth_getBalance");
  var eth_estimateGas = document.getElementById("eth_estimateGas");
  var eth_getUncleCountByBlockNumber = document.getElementById("eth_getUncleCountByBlockNumber");
  var eth_getBlockTransactionCountByNumber = document.getElementById("eth_getBlockTransactionCountByNumber");
  var eth_uninstallFilter = document.getElementById("eth_uninstallFilter");
  var eth_mining = document.getElementById("eth_mining");
  var eth_submitWork = document.getElementById("eth_submitWork");
  var eth_syncing = document.getElementById("eth_syncing");
  var eth_getTransactionByHash = document.getElementById("eth_getTransactionByHash");
  var eth_getTransactionByBlockHashAndIndex = document.getElementById("eth_getTransactionByBlockHashAndIndex");
  var eth_getTransactionByBlockNumberAndIndex  = document.getElementById("eth_getTransactionByBlockNumberAndIndex");
  var eth_getUncleByBlockHashAndIndex = document.getElementById("eth_getUncleByBlockHashAndIndex");
  var eth_getUncleByBlockNumberAndIndex = document.getElementById("eth_getUncleByBlockNumberAndIndex");
  var eth_getBlockByHash = document.getElementById("eth_getBlockByHash");
  var eth_getBlockByNumber = document.getElementById("eth_getBlockByNumber");
  
  var eth_call = document.getElementById("eth_call");
  var eth_getStorageAt = document.getElementById("eth_getStorageAt");
  var eth_getCode = document.getElementById("eth_getCode")
  var eth_getFilterChanges = document.getElementById("eth_getFilterChanges");
  var eth_getLogs = document.getElementById("eth_getLogs");
  var eth_accounts = document.getElementById("eth_accounts");
  var eth_protocolVersion = document.getElementById("eth_protocolVersion");
  var eth_sendRawTransaction = document.getElementById("eth_sendRawTransaction");
  var eth_getTransactionReceipt = document.getElementById("eth_getTransactionReceipt");
  

  ethblockNumber.addEventListener('click', function (event) {
    ethereum.sendAsync({
      method: json.hexaNumberMethodsArray[0][0],
      params: json.hexaNumberMethodsArray[0][1],
      from: web3.eth.accounts[0] // Provide the user's account to use.
    }, function (err, result) {
      if (err) {
        console.log(err);
      } else {
        console.log(result);
      }
    });
  });
  eth_gasPrice.addEventListener('click', function (event) {
    ethereum.sendAsync({
      method: json.hexaNumberMethodsArray[1][0],
      params: json.hexaNumberMethodsArray[1][1],
      from: web3.eth.accounts[0] // Provide the user's account to use.
    }, function (err, result) {
      if (err) {
        console.log(err);
      } else {
        console.log(result);
      }
    });
  });
  eth_newBlockFilter.addEventListener('click', function (event) {
    ethereum.sendAsync({
      method: json.hexaNumberMethodsArray[2][0],
      params: json.hexaNumberMethodsArray[2][1],
      from: web3.eth.accounts[0] // Provide the user's account to use.
    }, function (err, result) {
      if (err) {
        console.log(err);
      } else {
        console.log(result);
      }
    });
  });
  eth_newPendingTransactionFilter.addEventListener('click', function (event) {
    ethereum.sendAsync({
      method: json.hexaNumberMethodsArray[3][0],
      params: json.hexaNumberMethodsArray[3][1],
      from: web3.eth.accounts[0] // Provide the user's account to use.
    }, function (err, result) {
      if (err) {
        console.log(err);
      } else {
        console.log(result);
      }
    });
  });
  eth_getUncleCountByBlockHash.addEventListener('click', function (event) {
  
    ethereum.sendAsync({
      method: json.hexaNumberMethodsArray[4][0],
      params: json.hexaNumberMethodsArray[4][1],
      from: web3.eth.accounts[0] // Provide the user's account to use.
    }, function (err, result) {
      if (err) {
        console.log(err);
      } else {
        console.log(result);
      }
    });
  });
  eth_getBlockTransactionCountByHash.addEventListener('click', function (event) {
    
    ethereum.sendAsync({
      method: json.hexaNumberMethodsArray[5][0],
      params: json.hexaNumberMethodsArray[5][1],
      from: web3.eth.accounts[0] // Provide the user's account to use.
    }, function (err, result) {
      if (err) {
        console.log(err);
      } else {
        console.log(result);
      }
    });
  });
  eth_getTransactionCount.addEventListener('click', function (event) {
    
    ethereum.sendAsync({
      method: json.hexaNumberMethodsArray[6][0],
      params: json.hexaNumberMethodsArray[6][1],
      from: web3.eth.accounts[0] // Provide the user's account to use.
    }, function (err, result) {
      if (err) {
        console.log(err);
      } else {
        console.log(result);
      }
    });
  });
  eth_getBalance.addEventListener('click', function (event) {
    ethereum.sendAsync({
      method: json.hexaNumberMethodsArray[7][0],
      params: json.hexaNumberMethodsArray[7][1],
      from: web3.eth.accounts[0] // Provide the user's account to use.
    }, function (err, result) {
      if (err) {
        console.log(err);
      } else {
        console.log(result);
      }
    });
  });
  eth_estimateGas.addEventListener('click', function (event) {
   
    ethereum.sendAsync({
      method: json.hexaNumberMethodsArray[8][0],
      params: json.hexaNumberMethodsArray[8][1],
      from :"0xb60e8dd61c5d32be8058bb8eb970870f07233155"
       // Provide the user's account to use.
    }, function (err, result) {
      if (err) {
        console.log(err);
      } else {
        console.log(result);
      }
    });
  });
  eth_getUncleCountByBlockNumber.addEventListener('click', function (event) {
    
    ethereum.sendAsync({
      method: json.hexaNumberMethodsArray[9][0],
      params: json.hexaNumberMethodsArray[9][1],
      from: web3.eth.accounts[0] // Provide the user's account to use.
    }, function (err, result) {
      if (err) {
        console.log(err);
      } else {
        console.log(result);
      }
    });
  });
  eth_getBlockTransactionCountByNumber.addEventListener('click', function (event) {
   
    ethereum.sendAsync({
      method: json.hexaNumberMethodsArray[10][0],
      params: json.hexaNumberMethodsArray[10][1],
      from: web3.eth.accounts[0] // Provide the user's account to use.
    }, function (err, result) {
      if (err) {
        console.log(err);
      } else {
        console.log(result);
      }
    });
  });

  eth_getUncleCountByBlockNumber.addEventListener('click', function (event) {
    
    ethereum.sendAsync({
      method: json.hexaNumberMethodsArray[9][0],
      params: json.hexaNumberMethodsArray[9][1],
      from: web3.eth.accounts[0] // Provide the user's account to use.
    }, function (err, result) {
      if (err) {
        console.log(err);
      } else {
        console.log(result);
      }
    });
  });
  
  eth_uninstallFilter.addEventListener('click', function (event) {
    
    ethereum.sendAsync({
      method: json.booleanMethodsArray[0][0],
      params: json.booleanMethodsArray[0][1],
      from: web3.eth.accounts[0] // Provide the user's account to use.
    }, function (err, result) {
      if (err) {
        console.log(err);
      } else {
        console.log(result);
      }
    });
  });
  
  eth_mining.addEventListener('click', function (event) {
    
    ethereum.sendAsync({
      method: json.booleanMethodsArray[1][0],
      params: json.booleanMethodsArray[1][1],
      from: web3.eth.accounts[0] // Provide the user's account to use.
    }, function (err, result) {
      if (err) {
        console.log(err);
      } else {
        console.log(result);
      }
    });
  });
  
  eth_submitWork.addEventListener('click', function (event) {
    
    ethereum.sendAsync({
      method: json.booleanMethodsArray[2][0],
      params: json.booleanMethodsArray[2][1]
       // Provide the user's account to use.
    }, function (err, result) {
      if (err) {
        console.log(err);
      } else {
        console.log(result);
      }
    });
  });
  
  eth_syncing.addEventListener('click', function (event) {
    
    ethereum.sendAsync({
      method: json.booleanMethodsArray[3][0],
      params: json.booleanMethodsArray[3][1],
      from: web3.eth.accounts[0] // Provide the user's account to use.
    }, function (err, result) {
      if (err) {
        console.log(err);
      } else {
        console.log(result);
      }
    });
  });
  
  eth_getTransactionByHash.addEventListener('click', function (event) {
    
    ethereum.sendAsync({
      method: json.transactionMethodsArray[0][0],
      params: json.transactionMethodsArray[0][1],
      from: web3.eth.accounts[0] // Provide the user's account to use.
    }, function (err, result) {
      if (err) {
        console.log(err);
      } else {
        console.log(result);
      }
    });
  });
  
  eth_getTransactionByBlockHashAndIndex.addEventListener('click', function (event) {
    
    ethereum.sendAsync({
      method: json.transactionMethodsArray[1][0],
      params: json.transactionMethodsArray[1][1],
      from: web3.eth.accounts[0] // Provide the user's account to use.
    }, function (err, result) {
      if (err) {
        console.log(err);
      } else {
        console.log(result);
      }
    });
  });
  
  eth_getTransactionByBlockNumberAndIndex.addEventListener('click', function (event) {
    
    ethereum.sendAsync({
      method: json.transactionMethodsArray[2][0],
      params: json.transactionMethodsArray[2][1],
      from: web3.eth.accounts[0] // Provide the user's account to use.
    }, function (err, result) {
      if (err) {
        console.log(err);
      } else {
        console.log(result);
      }
    });
  });

  eth_getUncleByBlockHashAndIndex.addEventListener('click', function (event) {
    
    ethereum.sendAsync({
      method: json.blockMethodsArray[0][0],
      params: json.blockMethodsArray[0][1],
      from: web3.eth.accounts[0] // Provide the user's account to use.
    }, function (err, result) {
      if (err) {
        console.log(err);
      } else {
        console.log(result);
      }
    });
  });

  eth_getUncleByBlockNumberAndIndex.addEventListener('click', function (event) {
    
    ethereum.sendAsync({
      method: json.blockMethodsArray[1][0],
      params: json.blockMethodsArray[1][1],
      from: web3.eth.accounts[0] // Provide the user's account to use.
    }, function (err, result) {
      if (err) {
        console.log(err);
      } else {
        console.log(result);
      }
    });
  });

  eth_getBlockByHash.addEventListener('click', function (event) {
    
    ethereum.sendAsync({
      method: json.blockMethodsArray[2][0],
      params: json.blockMethodsArray[2][1],
      from: web3.eth.accounts[0] // Provide the user's account to use.
    }, function (err, result) {
      if (err) {
        console.log(err);
      } else {
        console.log(result);
      }
    });
  });

  eth_getBlockByNumber.addEventListener('click', function (event) {
    
    ethereum.sendAsync({
      method: json.blockMethodsArray[3][0],
      params: json.blockMethodsArray[3][1],
      from: web3.eth.accounts[0] // Provide the user's account to use.
    }, function (err, result) {
      if (err) {
        console.log(err);
      } else {
        console.log(result);
      }
    });
  });

  

  eth_call.addEventListener('click', function (event) {
    
    ethereum.sendAsync({
      method: json.bytesDataMethodsArray[0][0],
      params: json.bytesDataMethodsArray[0][1],
      from: web3.eth.accounts[0] // Provide the user's account to use.
    }, function (err, result) {
      if (err) {
        console.log(err);
      } else {
        console.log(result);
      }
    });
  });

  eth_getStorageAt.addEventListener('click', function (event) {
    
    ethereum.sendAsync({
      method: json.bytesDataMethodsArray[1][0],
      params: json.bytesDataMethodsArray[1][1],
      from: web3.eth.accounts[0] // Provide the user's account to use.
    }, function (err, result) {
      if (err) {
        console.log(err);
      } else {
        console.log(result);
      }
    });
  });


  eth_getCode.addEventListener('click', function (event) {
    
    ethereum.sendAsync({
      method: json.bytesDataMethodsArray[2][0],
      params: json.bytesDataMethodsArray[2][1],
      from: web3.eth.accounts[0] // Provide the user's account to use.
    }, function (err, result) {
      if (err) {
        console.log(err);
      } else {
        console.log(result);
      }
    });
  });

  eth_getFilterChanges.addEventListener('click', function (event) {
    
    ethereum.sendAsync({
      method: json.filterChangeMethodsArray[0][0],
      params: json.filterChangeMethodsArray[0][1],
      from: web3.eth.accounts[0] // Provide the user's account to use.
    }, function (err, result) {
      if (err) {
        console.log(err);
      } else {
        console.log(result);
      }
    });
  });

  eth_getLogs.addEventListener('click', function (event) {
    
    ethereum.sendAsync({
      method: json.filterChangeMethodsArray[1][0],
      params: json.filterChangeMethodsArray[1][1],
      from: web3.eth.accounts[0] // Provide the user's account to use.
    }, function (err, result) {
      if (err) {
        console.log(err);
      } else {
        console.log(result);
      }
    });
  });

  eth_accounts.addEventListener('click', function (event) {
    
    ethereum.sendAsync({
      method: json.methodsArray[0][0],
      params: json.methodsArray[0][1],
      from: web3.eth.accounts[0] // Provide the user's account to use.
    }, function (err, result) {
      if (err) {
        console.log(err);
      } else {
        console.log(result);
      }
    });
  });

  eth_protocolVersion.addEventListener('click', function (event) {
    
    ethereum.sendAsync({
      method: json.methodsArray[1][0],
      params: json.methodsArray[1][1],
      from: web3.eth.accounts[0] // Provide the user's account to use.
    }, function (err, result) {
      if (err) {
        console.log(err);
      } else {
        console.log(result);
      }
    });
  });

  eth_sendRawTransaction.addEventListener('click', function (event) {
    
    ethereum.sendAsync({
      method: json.methodsArray[2][0],
      params: json.methodsArray[2][1],
      from: web3.eth.accounts[0] // Provide the user's account to use.
    }, function (err, result) {
      if (err) {
        console.log(err);
      } else {
        console.log(result);
      }
    });
  });

 
  eth_getTransactionReceipt.addEventListener('click', function (event) {
    
    ethereum.sendAsync({
      method: json.methodsArray[3][0],
      params: json.methodsArray[3][1],
      from: web3.eth.accounts[0] // Provide the user's account to use.
    }, function (err, result) {
      if (err) {
        console.log(err);
      } else {
        console.log(result);
      }
    });
  });

  


})





  
