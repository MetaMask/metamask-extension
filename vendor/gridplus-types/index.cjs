"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  DEFAULT_ETH_DERIVATION: () => DEFAULT_ETH_DERIVATION,
  HARDENED_OFFSET: () => HARDENED_OFFSET,
  LatticeEncDataSchema: () => LatticeEncDataSchema,
  LatticeGetAddressesFlag: () => LatticeGetAddressesFlag,
  LatticeMsgType: () => LatticeMsgType,
  LatticeProtocolVersion: () => LatticeProtocolVersion,
  LatticeResponseCode: () => LatticeResponseCode,
  LatticeSecureEncryptedRequestType: () => LatticeSecureEncryptedRequestType,
  LatticeSecureMsgType: () => LatticeSecureMsgType,
  LatticeSignBlsDst: () => LatticeSignBlsDst,
  LatticeSignCurve: () => LatticeSignCurve,
  LatticeSignEncoding: () => LatticeSignEncoding,
  LatticeSignHash: () => LatticeSignHash,
  LatticeSignSchema: () => LatticeSignSchema,
  ProtocolConstants: () => ProtocolConstants,
  getResponseCode: () => getResponseCode,
  getUpdatedClientState: () => getUpdatedClientState,
  isLatticeError: () => isLatticeError,
  parseLatticeResponseMessage: () => parseLatticeResponseMessage
});
module.exports = __toCommonJS(index_exports);

// src/derivation.ts
var HARDENED_OFFSET = 2147483648;
var DEFAULT_ETH_DERIVATION = [HARDENED_OFFSET + 44, HARDENED_OFFSET + 60, HARDENED_OFFSET, 0, 0];

// src/protocol/lattice-constants.ts
var LatticeResponseCode = /* @__PURE__ */ ((LatticeResponseCode2) => {
  LatticeResponseCode2[LatticeResponseCode2["success"] = 0] = "success";
  LatticeResponseCode2[LatticeResponseCode2["invalidMsg"] = 128] = "invalidMsg";
  LatticeResponseCode2[LatticeResponseCode2["unsupportedVersion"] = 129] = "unsupportedVersion";
  LatticeResponseCode2[LatticeResponseCode2["deviceBusy"] = 130] = "deviceBusy";
  LatticeResponseCode2[LatticeResponseCode2["userTimeout"] = 131] = "userTimeout";
  LatticeResponseCode2[LatticeResponseCode2["userDeclined"] = 132] = "userDeclined";
  LatticeResponseCode2[LatticeResponseCode2["pairFailed"] = 133] = "pairFailed";
  LatticeResponseCode2[LatticeResponseCode2["pairDisabled"] = 134] = "pairDisabled";
  LatticeResponseCode2[LatticeResponseCode2["permissionDisabled"] = 135] = "permissionDisabled";
  LatticeResponseCode2[LatticeResponseCode2["internalError"] = 136] = "internalError";
  LatticeResponseCode2[LatticeResponseCode2["gceTimeout"] = 137] = "gceTimeout";
  LatticeResponseCode2[LatticeResponseCode2["wrongWallet"] = 138] = "wrongWallet";
  LatticeResponseCode2[LatticeResponseCode2["deviceLocked"] = 139] = "deviceLocked";
  LatticeResponseCode2[LatticeResponseCode2["disabled"] = 140] = "disabled";
  LatticeResponseCode2[LatticeResponseCode2["already"] = 141] = "already";
  LatticeResponseCode2[LatticeResponseCode2["invalidEphemId"] = 142] = "invalidEphemId";
  return LatticeResponseCode2;
})(LatticeResponseCode || {});
var LatticeSecureMsgType = /* @__PURE__ */ ((LatticeSecureMsgType2) => {
  LatticeSecureMsgType2[LatticeSecureMsgType2["connect"] = 1] = "connect";
  LatticeSecureMsgType2[LatticeSecureMsgType2["encrypted"] = 2] = "encrypted";
  return LatticeSecureMsgType2;
})(LatticeSecureMsgType || {});
var LatticeProtocolVersion = /* @__PURE__ */ ((LatticeProtocolVersion2) => {
  LatticeProtocolVersion2[LatticeProtocolVersion2["v1"] = 1] = "v1";
  return LatticeProtocolVersion2;
})(LatticeProtocolVersion || {});
var LatticeMsgType = /* @__PURE__ */ ((LatticeMsgType2) => {
  LatticeMsgType2[LatticeMsgType2["response"] = 0] = "response";
  LatticeMsgType2[LatticeMsgType2["secure"] = 2] = "secure";
  return LatticeMsgType2;
})(LatticeMsgType || {});
var LatticeSecureEncryptedRequestType = /* @__PURE__ */ ((LatticeSecureEncryptedRequestType2) => {
  LatticeSecureEncryptedRequestType2[LatticeSecureEncryptedRequestType2["finalizePairing"] = 0] = "finalizePairing";
  LatticeSecureEncryptedRequestType2[LatticeSecureEncryptedRequestType2["getAddresses"] = 1] = "getAddresses";
  LatticeSecureEncryptedRequestType2[LatticeSecureEncryptedRequestType2["sign"] = 3] = "sign";
  LatticeSecureEncryptedRequestType2[LatticeSecureEncryptedRequestType2["getWallets"] = 4] = "getWallets";
  LatticeSecureEncryptedRequestType2[LatticeSecureEncryptedRequestType2["getKvRecords"] = 7] = "getKvRecords";
  LatticeSecureEncryptedRequestType2[LatticeSecureEncryptedRequestType2["addKvRecords"] = 8] = "addKvRecords";
  LatticeSecureEncryptedRequestType2[LatticeSecureEncryptedRequestType2["removeKvRecords"] = 9] = "removeKvRecords";
  LatticeSecureEncryptedRequestType2[LatticeSecureEncryptedRequestType2["getDecoders"] = 10] = "getDecoders";
  LatticeSecureEncryptedRequestType2[LatticeSecureEncryptedRequestType2["removeDecoders"] = 11] = "removeDecoders";
  LatticeSecureEncryptedRequestType2[LatticeSecureEncryptedRequestType2["fetchEncryptedData"] = 12] = "fetchEncryptedData";
  LatticeSecureEncryptedRequestType2[LatticeSecureEncryptedRequestType2["test"] = 13] = "test";
  LatticeSecureEncryptedRequestType2[LatticeSecureEncryptedRequestType2["event"] = 14] = "event";
  LatticeSecureEncryptedRequestType2[LatticeSecureEncryptedRequestType2["getTrackedAssets"] = 15] = "getTrackedAssets";
  LatticeSecureEncryptedRequestType2[LatticeSecureEncryptedRequestType2["setTrackedAssets"] = 16] = "setTrackedAssets";
  return LatticeSecureEncryptedRequestType2;
})(LatticeSecureEncryptedRequestType || {});
var LatticeGetAddressesFlag = /* @__PURE__ */ ((LatticeGetAddressesFlag2) => {
  LatticeGetAddressesFlag2[LatticeGetAddressesFlag2["none"] = 0] = "none";
  LatticeGetAddressesFlag2[LatticeGetAddressesFlag2["secp256k1Pubkey"] = 3] = "secp256k1Pubkey";
  LatticeGetAddressesFlag2[LatticeGetAddressesFlag2["ed25519Pubkey"] = 4] = "ed25519Pubkey";
  LatticeGetAddressesFlag2[LatticeGetAddressesFlag2["bls12_381Pubkey"] = 5] = "bls12_381Pubkey";
  LatticeGetAddressesFlag2[LatticeGetAddressesFlag2["secp256k1Xpub"] = 6] = "secp256k1Xpub";
  return LatticeGetAddressesFlag2;
})(LatticeGetAddressesFlag || {});
var LatticeSignSchema = /* @__PURE__ */ ((LatticeSignSchema2) => {
  LatticeSignSchema2[LatticeSignSchema2["bitcoin"] = 0] = "bitcoin";
  LatticeSignSchema2[LatticeSignSchema2["ethereum"] = 1] = "ethereum";
  LatticeSignSchema2[LatticeSignSchema2["ethereumMsg"] = 3] = "ethereumMsg";
  LatticeSignSchema2[LatticeSignSchema2["extraData"] = 4] = "extraData";
  LatticeSignSchema2[LatticeSignSchema2["generic"] = 5] = "generic";
  return LatticeSignSchema2;
})(LatticeSignSchema || {});
var LatticeSignHash = /* @__PURE__ */ ((LatticeSignHash2) => {
  LatticeSignHash2[LatticeSignHash2["none"] = 0] = "none";
  LatticeSignHash2[LatticeSignHash2["keccak256"] = 1] = "keccak256";
  LatticeSignHash2[LatticeSignHash2["sha256"] = 2] = "sha256";
  LatticeSignHash2[LatticeSignHash2["sha512half"] = 3] = "sha512half";
  LatticeSignHash2[LatticeSignHash2["blake2b256"] = 4] = "blake2b256";
  return LatticeSignHash2;
})(LatticeSignHash || {});
var LatticeSignCurve = /* @__PURE__ */ ((LatticeSignCurve2) => {
  LatticeSignCurve2[LatticeSignCurve2["secp256k1"] = 0] = "secp256k1";
  LatticeSignCurve2[LatticeSignCurve2["ed25519"] = 1] = "ed25519";
  LatticeSignCurve2[LatticeSignCurve2["bls12_381"] = 2] = "bls12_381";
  LatticeSignCurve2[LatticeSignCurve2["ed25519_cardano"] = 3] = "ed25519_cardano";
  return LatticeSignCurve2;
})(LatticeSignCurve || {});
var LatticeSignEncoding = /* @__PURE__ */ ((LatticeSignEncoding2) => {
  LatticeSignEncoding2[LatticeSignEncoding2["none"] = 1] = "none";
  LatticeSignEncoding2[LatticeSignEncoding2["solana"] = 2] = "solana";
  LatticeSignEncoding2[LatticeSignEncoding2["cosmos"] = 3] = "cosmos";
  LatticeSignEncoding2[LatticeSignEncoding2["evm"] = 4] = "evm";
  LatticeSignEncoding2[LatticeSignEncoding2["eth_deposit"] = 5] = "eth_deposit";
  LatticeSignEncoding2[LatticeSignEncoding2["eip7702_auth"] = 6] = "eip7702_auth";
  LatticeSignEncoding2[LatticeSignEncoding2["eip7702_auth_list"] = 7] = "eip7702_auth_list";
  LatticeSignEncoding2[LatticeSignEncoding2["xrp"] = 8] = "xrp";
  LatticeSignEncoding2[LatticeSignEncoding2["cardano"] = 9] = "cardano";
  return LatticeSignEncoding2;
})(LatticeSignEncoding || {});
var LatticeSignBlsDst = /* @__PURE__ */ ((LatticeSignBlsDst2) => {
  LatticeSignBlsDst2[LatticeSignBlsDst2["NUL"] = 1] = "NUL";
  LatticeSignBlsDst2[LatticeSignBlsDst2["POP"] = 2] = "POP";
  return LatticeSignBlsDst2;
})(LatticeSignBlsDst || {});
var LatticeEncDataSchema = /* @__PURE__ */ ((LatticeEncDataSchema2) => {
  LatticeEncDataSchema2[LatticeEncDataSchema2["eip2335"] = 0] = "eip2335";
  return LatticeEncDataSchema2;
})(LatticeEncDataSchema || {});
var ProtocolConstants = {
  aesIv: [109, 121, 115, 101, 99, 114, 101, 116, 112, 97, 115, 115, 119, 111, 114, 100],
  addrStrLen: 129,
  pairingStatus: {
    notPaired: 0,
    paired: 1
  },
  responseMsg: {
    [0 /* success */]: "",
    [128 /* invalidMsg */]: "Invalid Request",
    [129 /* unsupportedVersion */]: "Unsupported Version",
    [130 /* deviceBusy */]: "Device Busy",
    [131 /* userTimeout */]: "Timeout waiting for user",
    [132 /* userDeclined */]: "Request declined by user",
    [133 /* pairFailed */]: "Pairing failed",
    [134 /* pairDisabled */]: "Pairing is currently disabled",
    [135 /* permissionDisabled */]: "Automated signing is currently disabled",
    [136 /* internalError */]: "Device Error",
    [137 /* gceTimeout */]: "Device Timeout",
    [138 /* wrongWallet */]: "Active wallet does not match request",
    [139 /* deviceLocked */]: "Device Locked",
    [140 /* disabled */]: "Feature Disabled",
    [141 /* already */]: "Record already exists on device",
    [142 /* invalidEphemId */]: "Request failed - needs resync"
  },
  msgSizes: {
    header: 8,
    checksum: 4,
    secure: {
      payload: {
        request: {
          connect: 66,
          encrypted: 1733
        },
        response: {
          connect: 215,
          encrypted: 3457
        }
      },
      data: {
        request: {
          connect: 65,
          encrypted: {
            encryptedData: 1728,
            [0 /* finalizePairing */]: 99,
            [1 /* getAddresses */]: 54,
            [3 /* sign */]: 1680,
            [4 /* getWallets */]: 0,
            [7 /* getKvRecords */]: 9,
            [8 /* addKvRecords */]: 1391,
            [9 /* removeKvRecords */]: 405,
            [15 /* getTrackedAssets */]: 1,
            [16 /* setTrackedAssets */]: 1722,
            [12 /* fetchEncryptedData */]: 1025,
            [13 /* test */]: 506,
            [14 /* event */]: 1722
          }
        },
        response: {
          encrypted: {
            encryptedData: 1728,
            [0 /* finalizePairing */]: 0,
            [1 /* getAddresses */]: 1290,
            [3 /* sign */]: 1090,
            [4 /* getWallets */]: 142,
            [7 /* getKvRecords */]: 1395,
            [8 /* addKvRecords */]: 0,
            [9 /* removeKvRecords */]: 0,
            [15 /* getTrackedAssets */]: 1658,
            [16 /* setTrackedAssets */]: 33,
            [12 /* fetchEncryptedData */]: 1608,
            [13 /* test */]: 1646,
            [14 /* event */]: 1
          }
        }
      }
    }
  }
};

// src/protocol/lattice-response.ts
var parseLatticeResponseMessage = (code) => {
  return ProtocolConstants.responseMsg[code];
};
var isLatticeError = (error) => {
  return error instanceof Error && "responseCode" in error;
};
var getResponseCode = (error) => {
  if (typeof error === "object" && error !== null && "responseCode" in error) {
    const code = error.responseCode;
    return typeof code === "number" ? code : void 0;
  }
  return void 0;
};
var getUpdatedClientState = (error) => {
  if (typeof error === "object" && error !== null && "updatedClientState" in error) {
    const state = error.updatedClientState;
    return typeof state === "string" && state.length > 0 ? state : void 0;
  }
  return void 0;
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  DEFAULT_ETH_DERIVATION,
  HARDENED_OFFSET,
  LatticeEncDataSchema,
  LatticeGetAddressesFlag,
  LatticeMsgType,
  LatticeProtocolVersion,
  LatticeResponseCode,
  LatticeSecureEncryptedRequestType,
  LatticeSecureMsgType,
  LatticeSignBlsDst,
  LatticeSignCurve,
  LatticeSignEncoding,
  LatticeSignHash,
  LatticeSignSchema,
  ProtocolConstants,
  getResponseCode,
  getUpdatedClientState,
  isLatticeError,
  parseLatticeResponseMessage
});
//# sourceMappingURL=index.cjs.map