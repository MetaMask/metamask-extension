# Forking Mainnet With Ganache for Testing

If you want to test out mainnet functionality without having to actually use mainnet, you can use Ganache's forking feature and then import ganache network and its generated accounts into MetaMask

1. Get your local dev build running and have MetaMask open in your browser
2. Run `$(yarn bin ganache) --fork https://mainnet.infura.io/v3/INFURA_PROJECT_ID --chain.chainId 1` with `INFURA_PROJECT_ID` replaced by your own Infura project id
3. Ganache will output a list of account addresses, private keys and an "Mnemonic" (aka SRP, aka Secret Recovery Phrase)
4. Import either the private keys or the SRP into MetaMask
5. Add the ganache network as a custom network in MetaMask. The "New RPC URL" will need to be http://127.0.0.1:8545, set the Chain Id as 1, and the currency symbol to ETH

You should now be able to use MetaMask, and many dapps, as if you were using mainnet. Your accounts should each have 1000 ETH which you can use on this simulated local fork. Note that after significant time elapses since when you forked mainnet (i.e. ran step 2 above), interactions with many dapps and smart contracts may begin to have inconsistent behavior or failures.
