
json = methods
var jsonvalues = Object.values(json);
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
 
  
  var eth_protocolVersion = document.getElementById("eth_protocolVersion");
  var eth_sendRawTransaction = document.getElementById("eth_sendRawTransaction");
  var eth_getTransactionReceipt = document.getElementById("eth_getTransactionReceipt");
  
  
  var hexaNumberMethodsArray = Object.values(jsonvalues[0]);
  var booleanMethodsArray = Object.values(jsonvalues[1]);
  var transactionMethodsArray = Object.values(jsonvalues[2]);
  var blockMethodsArray = Object.values(jsonvalues[3]);
  var bytesDataMethodsArray = Object.values(jsonvalues[4])
  
  
  ethblockNumber.addEventListener('click', function (event) {
    
    
    ethereum.sendAsync({
      method: hexaNumberMethodsArray[0][0],
      params: hexaNumberMethodsArray[0][1],
      from: web3.eth.accounts[0] // Provide the user's account to use.
    }, function (err, result) {
      if (err) {
        console.log(err);
      } else {
       document.getElementById('results').innerHTML = JSON.stringify(result);
      }
    });
  });
  eth_gasPrice.addEventListener('click', function (event) {
    ethereum.sendAsync({
      method: hexaNumberMethodsArray[1][0],
      params: hexaNumberMethodsArray[1][1],
      from: web3.eth.accounts[0] // Provide the user's account to use.
    }, function (err, result) {
      if (err) {
        console.log(err);
      } else {
        document.getElementById('results').innerHTML = JSON.stringify(result);
      }
    });
  });
  eth_newBlockFilter.addEventListener('click', function (event) {
    ethereum.sendAsync({
      method: hexaNumberMethodsArray[2][0],
      params: hexaNumberMethodsArray[2][1],
      from: web3.eth.accounts[0] // Provide the user's account to use.
    }, function (err, result) {
      if (err) {
        console.log(err);
      } else {
        document.getElementById('results').innerHTML = JSON.stringify(result);
      }
    });
  });
  eth_newPendingTransactionFilter.addEventListener('click', function (event) {
    ethereum.sendAsync({
      method: hexaNumberMethodsArray[3][0],
      params: hexaNumberMethodsArray[3][1],
      from: web3.eth.accounts[0] // Provide the user's account to use.
    }, function (err, result) {
      if (err) {
        console.log(err);
      } else {
        document.getElementById('results').innerHTML = JSON.stringify(result);
      }
    });
  });
  eth_getUncleCountByBlockHash.addEventListener('click', function (event) {
  
    ethereum.sendAsync({
      method: hexaNumberMethodsArray[4][0],
      params: hexaNumberMethodsArray[4][1],
      from: web3.eth.accounts[0] // Provide the user's account to use.
    }, function (err, result) {
      if (err) {
        console.log(err);
      } else {
        document.getElementById('results').innerHTML = JSON.stringify(result);
      }
    });
  });
  eth_getBlockTransactionCountByHash.addEventListener('click', function (event) {
    
    ethereum.sendAsync({
      method: hexaNumberMethodsArray[5][0],
      params: hexaNumberMethodsArray[5][1],
      from: web3.eth.accounts[0] // Provide the user's account to use.
    }, function (err, result) {
      if (err) {
        console.log(err);
      } else {
        document.getElementById('results').innerHTML = JSON.stringify(result);
      }
    });
  });
  eth_getTransactionCount.addEventListener('click', function (event) {
    
    ethereum.sendAsync({
      method: hexaNumberMethodsArray[6][0],
      params: hexaNumberMethodsArray[6][1],
      from: web3.eth.accounts[0] // Provide the user's account to use.
    }, function (err, result) {
      if (err) {
        console.log(err);
      } else {
        document.getElementById('results').innerHTML = JSON.stringify(result);
      }
    });
  });
  eth_getBalance.addEventListener('click', function (event) {
    ethereum.sendAsync({
      method: hexaNumberMethodsArray[7][0],
      params: hexaNumberMethodsArray[7][1],
      from: web3.eth.accounts[0] // Provide the user's account to use.
    }, function (err, result) {
      if (err) {
        console.log(err);
      } else {
        document.getElementById('results').innerHTML = JSON.stringify(result);
      }
    });
  });
  eth_estimateGas.addEventListener('click', function (event) {
   
    ethereum.sendAsync({
      method: hexaNumberMethodsArray[8][0],
      params: hexaNumberMethodsArray[8][1],
      from :"0xb60e8dd61c5d32be8058bb8eb970870f07233155"
       // Provide the user's account to use.
    }, function (err, result) {
      if (err) {
        console.log(err);
      } else {
        document.getElementById('results').innerHTML = JSON.stringify(result);
      }
    });
  });
  eth_getUncleCountByBlockNumber.addEventListener('click', function (event) {
    
    ethereum.sendAsync({
      method: hexaNumberMethodsArray[9][0],
      params: hexaNumberMethodsArray[9][1],
      from: web3.eth.accounts[0] // Provide the user's account to use.
    }, function (err, result) {
      if (err) {
        console.log(err);
      } else {
        document.getElementById('results').innerHTML = JSON.stringify(result);
      }
    });
  });
  eth_getBlockTransactionCountByNumber.addEventListener('click', function (event) {
   
    ethereum.sendAsync({
      method: hexaNumberMethodsArray[10][0],
      params: hexaNumberMethodsArray[10][1],
      from: web3.eth.accounts[0] // Provide the user's account to use.
    }, function (err, result) {
      if (err) {
        console.log(err);
      } else {
        document.getElementById('results').innerHTML = JSON.stringify(result);
      }
    });
  });

  
  eth_sendRawTransaction.addEventListener('click', function (event) {
    
    ethereum.sendAsync({
      method: hexaNumberMethodsArray[11][0],
      params: hexaNumberMethodsArray[11][1],
      from: web3.eth.accounts[0] // Provide the user's account to use.
    }, function (err, result) {
      if (err) {
        console.log(err);
      } else {
        document.getElementById('results').innerHTML = JSON.stringify(result);
     } });
  });

  eth_protocolVersion.addEventListener('click', function (event) {
    
    ethereum.sendAsync({
      method: hexaNumberMethodsArray[12][0],
      params: hexaNumberMethodsArray[12][1],
      from: web3.eth.accounts[0] // Provide the user's account to use.
    }, function (err, result) {
      if (err) {
        console.log(err);
      } else {
        document.getElementById('results').innerHTML = JSON.stringify(result);
      }
    });
  });


  eth_getCode.addEventListener('click', function (event) {
    
    ethereum.sendAsync({
      method: hexaNumberMethodsArray[13][0],
      params: hexaNumberMethodsArray[13][1],
      from: web3.eth.accounts[0] // Provide the user's account to use.
    }, function (err, result) {
      if (err) {
        console.log(err);
      } else {
        document.getElementById('results').innerHTML = JSON.stringify(result);
      }
    });
  });
 
  eth_uninstallFilter.addEventListener('click', function (event) {
    
    ethereum.sendAsync({
      method: booleanMethodsArray[0][0],
      params: booleanMethodsArray[0][1],
      from: web3.eth.accounts[0] // Provide the user's account to use.
    }, function (err, result) {
      if (err) {
        console.log(err);
      } else {
        document.getElementById('results').innerHTML = JSON.stringify(result);
      }
    });
  });
  
  eth_mining.addEventListener('click', function (event) {
    
    ethereum.sendAsync({
      method: booleanMethodsArray[1][0],
      params: booleanMethodsArray[1][1],
      from: web3.eth.accounts[0] // Provide the user's account to use.
    }, function (err, result) {
      if (err) {
        console.log(err);
      } else {
        document.getElementById('results').innerHTML = JSON.stringify(result);
      }
    });
  });
  
  eth_submitWork.addEventListener('click', function (event) {
    
    ethereum.sendAsync({
      method: booleanMethodsArray[2][0],
      params: booleanMethodsArray[2][1]
       // Provide the user's account to use.
    }, function (err, result) {
      if (err) {
        console.log(err);
      } else {
        document.getElementById('results').innerHTML = JSON.stringify(result);
      }
    });
  });
  
  eth_syncing.addEventListener('click', function (event) {
    
    ethereum.sendAsync({
      method: booleanMethodsArray[3][0],
      params: booleanMethodsArray[3][1],
      from: web3.eth.accounts[0] // Provide the user's account to use.
    }, function (err, result) {
      if (err) {
        console.log(err);
      } else {
        document.getElementById('results').innerHTML = JSON.stringify(result);
      }
    });
  });

  
  eth_getTransactionByHash.addEventListener('click', function (event) {
    
    ethereum.sendAsync({
      method: transactionMethodsArray[0][0],
      params: transactionMethodsArray[0][1],
      from: web3.eth.accounts[0] // Provide the user's account to use.
    }, function (err, result) {
      if (err) {
        console.log(err);
      } else {
        document.getElementById('results').innerHTML = JSON.stringify(result);
      }
    });
  });
  
  eth_getTransactionByBlockHashAndIndex.addEventListener('click', function (event) {
    
    ethereum.sendAsync({
      method: transactionMethodsArray[1][0],
      params: transactionMethodsArray[1][1],
      from: web3.eth.accounts[0] // Provide the user's account to use.
    }, function (err, result) {
      if (err) {
        console.log(err);
      } else {
        document.getElementById('results').innerHTML = JSON.stringify(result);
      }
    });
  });
  
  eth_getTransactionByBlockNumberAndIndex.addEventListener('click', function (event) {
    
    ethereum.sendAsync({
      method: transactionMethodsArray[2][0],
      params: transactionMethodsArray[2][1],
      from: web3.eth.accounts[0] // Provide the user's account to use.
    }, function (err, result) {
      if (err) {
        console.log(err);
      } else {
        document.getElementById('results').innerHTML = JSON.stringify(result);
      }
    });
  });
  eth_getTransactionReceipt.addEventListener('click', function (event) {
    
    ethereum.sendAsync({
      method: transactionMethodsArray[3][0],
      params: transactionMethodsArray[3][1],
      from: web3.eth.accounts[0] // Provide the user's account to use.
    }, function (err, result) {
      if (err) {
        console.log(err);
      } else {
        document.getElementById('results').innerHTML = JSON.stringify(result);
      }
    });
  });

  eth_getUncleByBlockHashAndIndex.addEventListener('click', function (event) {
    
    ethereum.sendAsync({
      method: blockMethodsArray[0][0],
      params: blockMethodsArray[0][1],
      from: web3.eth.accounts[0] // Provide the user's account to use.
    }, function (err, result) {
      if (err) {
        console.log(err);
      } else {
        document.getElementById('results').innerHTML = JSON.stringify(result);
      }
    });
  });

  eth_getUncleByBlockNumberAndIndex.addEventListener('click', function (event) {
    
    ethereum.sendAsync({
      method: blockMethodsArray[1][0],
      params: blockMethodsArray[1][1],
      from: web3.eth.accounts[0] // Provide the user's account to use.
    }, function (err, result) {
      if (err) {
        console.log(err);
      } else {
        document.getElementById('results').innerHTML = JSON.stringify(result);
      }
    });
  });

  eth_getBlockByHash.addEventListener('click', function (event) {
    
    ethereum.sendAsync({
      method: blockMethodsArray[2][0],
      params: blockMethodsArray[2][1],
      from: web3.eth.accounts[0] // Provide the user's account to use.
    }, function (err, result) {
      if (err) {
        console.log(err);
      } else {
        document.getElementById('results').innerHTML = JSON.stringify(result);
      }
    });
  });

  eth_getBlockByNumber.addEventListener('click', function (event) {
    
    ethereum.sendAsync({
      method: blockMethodsArray[3][0],
      params: blockMethodsArray[3][1],
      from: web3.eth.accounts[0] // Provide the user's account to use.
    }, function (err, result) {
      if (err) {
        console.log(err);
      } else {
        document.getElementById('results').innerHTML = JSON.stringify(result);
      }
    });
  });

  

  eth_call.addEventListener('click', function (event) {
    
    ethereum.sendAsync({
      method: bytesDataMethodsArray[0][0],
      params: bytesDataMethodsArray[0][1],
      from: web3.eth.accounts[0] // Provide the user's account to use.
    }, function (err, result) {
      if (err) {
        console.log(err);
      } else {
        document.getElementById('results').innerHTML = JSON.stringify(result);
      }
    });
  });

  eth_getStorageAt.addEventListener('click', function (event) {
    
    ethereum.sendAsync({
      method: bytesDataMethodsArray[1][0],
      params: bytesDataMethodsArray[1][1],
      from: web3.eth.accounts[0] // Provide the user's account to use.
    }, function (err, result) {
      if (err) {
        console.log(err);
      } else {
        document.getElementById('results').innerHTML = JSON.stringify(result);
      }
    });
  });


})





  
