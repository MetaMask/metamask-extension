pragma solidity ^0.4.24;

contract SimpleStorage {
  event StorageSet(
    string _message
  );

  uint public storedData;

  function set(uint x) public {
    storedData = x;

    emit StorageSet("Data stored successfully!");
  }
}
