# Human Demo

This demo page shows how to interact with new Metamask API, which uses HCaptcha widget to prove, that transaction was created by human

# API Changes:

* New Metamask RPC endpoint - `metamask_requestCaptcha`
* New Event from Metamask background - `captchaTokenReceived`

# Code examples:

Integrating with new API
```
import detectEthereumProvider from '@metamask/detect-provider';
import Web3 from 'web3';

async function initDeps() {
  const provider = await detectEthereumProvider({ mustBeMetaMask: true });

  return provider;
}

initDeps.then(provider => {
  // triggering the hcaptcha UI page
  const result = provider.request({
    method: 'metamask_requestCaptcha',
    params: []
  });

  web3.subscribe('captchaTokenReceived', token => {
    // initiating contract call with received token
  });
})
```


Example of contract that uses proof of humanity check. We are using chainlink oracles to check the hcaptcha tokens, so each contract which want to use this check need to be prepared and inherited from the ChainlinkClient
```
// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.6.0;


import "https://github.com/smartcontractkit/chainlink/blob/develop/evm-contracts/src/v0.6/ChainlinkClient.sol";

contract BillVotingContract is ChainlinkClient{
    address private oracleAddress;
    bytes32 private jobId;
    uint private fee;
    uint private votesFor;
    uint private votesAgainst;
    uint private nonHumanVotes;

    event VotesForUpdated(uint totalCount);
    event VotesAgainstUpdated(uint totalCount);
    event NonHumanVotesUpdated(uint totalCount);
    
    
    constructor () public{
        setPublicChainlinkToken();
        oracleAddress = 0x534Ce441fa17a6871e84Fb9C7814e328fC7E4309;
        jobId = "82fbcdb54b5c4eb18091ee36f60fb240";
        fee = 0.2 * 10**18; // 0.2 LINK
    }
    
    function isHuman(string memory _token, bytes4 _callback) private returns (bytes32){
        Chainlink.Request memory request = buildChainlinkRequest(jobId, address(this), _callback);
        
        request.add("token", _token);
        request.add("copyPath", "success");
        sendChainlinkRequestTo(oracleAddress, request, fee);
    }

    function voteFor(string memory _token) public {
        bytes4 callbackSignature = this.processVotingFor.selector;
        isHuman(_token, callbackSignature);
    }
    
    function voteAgainst(string memory _token) public {
        bytes4 callbackSignature = this.processVotingAgainst.selector;
        isHuman(_token, callbackSignature);
    }
    
    function processVotingFor(bytes32 _requestId, bool _isHuman) public recordChainlinkFulfillment(_requestId) {
        if(_isHuman == true) {
            votesFor++;
            emit VotesForUpdated(votesFor);
        } else {
            handleNonHumanCall();
        }
    }
    
    function processVotingAgainst(bytes32 _requestId, bool _isHuman) public recordChainlinkFulfillment(_requestId) {
        if(_isHuman == true) {
            votesAgainst++;
            emit VotesAgainstUpdated(votesAgainst);
        } else {
            handleNonHumanCall();
        }
    }
    
    function handleNonHumanCall() private {
        nonHumanVotes++;
        emit NonHumanVotesUpdated(nonHumanVotes);
    }
}
```
