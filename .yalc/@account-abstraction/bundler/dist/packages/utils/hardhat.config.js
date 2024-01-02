"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// import '@nomiclabs/hardhat-ethers'
require("@nomicfoundation/hardhat-toolbox");
const config = {
    typechain: {
        outDir: 'src/types',
        target: 'ethers-v5'
    },
    solidity: {
        version: '0.8.15',
        settings: {
            optimizer: { enabled: true }
        }
    }
};
exports.default = config;
//# sourceMappingURL=hardhat.config.js.map