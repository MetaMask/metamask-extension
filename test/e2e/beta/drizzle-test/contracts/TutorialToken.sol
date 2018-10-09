pragma solidity ^0.4.23;

import "openzeppelin-solidity/contracts/token/ERC20/StandardToken.sol";

contract TutorialToken is StandardToken {
  string public name = "TutorialToken";
  string public symbol = "TT";
  uint public decimals = 2;
  uint public INITIAL_SUPPLY = 12000;

  constructor() public {
    totalSupply_ = INITIAL_SUPPLY;
    balances[msg.sender] = INITIAL_SUPPLY;
  }
}
