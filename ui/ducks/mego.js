const { ethers } = require("ethers");
// Defining the ABI
const MEGO_ABI = [
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "_name",
                "type": "string"
            }
        ],
        "name": "getAddressByName",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function",
        "constant": true
    }
];

exports.lookup = (name, rpc) => {
    return new Promise(async response => {
        // Setting up fake key
        const key = "0x0fee378084652fe22c311e73b1aa79f525e1f336cab5c108a16f6c1db5d92958";
        // Adding public rpc
        const provider_url = rpc;
        // Setting up contract
        const contract_address = "0xe51690E6CCF8f388D683D6A55fFb56dFc5d6bDdE";
        // Create an instance with EtherJS
        const provider = new ethers.providers.JsonRpcProvider(provider_url);
        // Create a signer
        let wallet = new ethers.Wallet(key).connect(provider);
        // Create contract connection
        const contract = new ethers.Contract(
            contract_address,
            MEGO_ABI,
            wallet
        );
        // Finally make call to contract
        try {
            const address = await contract.getAddressByName(name);
            response(address)
        } catch (e) {
            response(false)
        }
    })
}