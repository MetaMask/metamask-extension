"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParsedMessage = void 0;
const DOMAIN = '(?<domain>([^?#]*)) wants you to sign in with your Ethereum account:';
const ADDRESS = '\\n(?<address>0x[a-zA-Z0-9]{40})\\n\\n';
const STATEMENT = '((?<statement>[^\\n]+)\\n)?';
const URI = '(([^:?#]+):)?(([^?#]*))?([^?#]*)(\\?([^#]*))?(#(.*))';
const URI_LINE = `\\nURI: (?<uri>${URI}?)`;
const VERSION = '\\nVersion: (?<version>1)';
const CHAIN_ID = '\\nChain ID: (?<chainId>[0-9]+)';
const NONCE = '\\nNonce: (?<nonce>[a-zA-Z0-9]{8,})';
const DATETIME = `([0-9]+)-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[01])[Tt]([01][0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9]|60)(\.[0-9]+)?(([Zz])|([\+|\-]([01][0-9]|2[0-3]):[0-5][0-9]))`;
const ISSUED_AT = `\\nIssued At: (?<issuedAt>${DATETIME})`;
const EXPIRATION_TIME = `(\\nExpiration Time: (?<expirationTime>${DATETIME}))?`;
const NOT_BEFORE = `(\\nNot Before: (?<notBefore>${DATETIME}))?`;
const REQUEST_ID = "(\\nRequest ID: (?<requestId>[-._~!$&'()*+,;=:@%a-zA-Z0-9]*))?";
const RESOURCES = `(\\nResources:(?<resources>(\\n- ${URI}?)+))?`;
const MESSAGE = `^${DOMAIN}${ADDRESS}${STATEMENT}${URI_LINE}${VERSION}${CHAIN_ID}${NONCE}${ISSUED_AT}${EXPIRATION_TIME}${NOT_BEFORE}${REQUEST_ID}${RESOURCES}$`;
class ParsedMessage {
    constructor(msg) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
        const REGEX = new RegExp(MESSAGE, 'g');
        let match = REGEX.exec(msg);
        if (!match) {
            throw new Error('Message did not match the regular expression.');
        }
        this.match = match;
        this.domain = (_a = match === null || match === void 0 ? void 0 : match.groups) === null || _a === void 0 ? void 0 : _a.domain;
        this.address = (_b = match === null || match === void 0 ? void 0 : match.groups) === null || _b === void 0 ? void 0 : _b.address;
        this.statement = (_c = match === null || match === void 0 ? void 0 : match.groups) === null || _c === void 0 ? void 0 : _c.statement;
        this.uri = (_d = match === null || match === void 0 ? void 0 : match.groups) === null || _d === void 0 ? void 0 : _d.uri;
        this.version = (_e = match === null || match === void 0 ? void 0 : match.groups) === null || _e === void 0 ? void 0 : _e.version;
        this.nonce = (_f = match === null || match === void 0 ? void 0 : match.groups) === null || _f === void 0 ? void 0 : _f.nonce;
        this.chainId = parseInt((_g = match === null || match === void 0 ? void 0 : match.groups) === null || _g === void 0 ? void 0 : _g.chainId);
        this.issuedAt = (_h = match === null || match === void 0 ? void 0 : match.groups) === null || _h === void 0 ? void 0 : _h.issuedAt;
        this.expirationTime = (_j = match === null || match === void 0 ? void 0 : match.groups) === null || _j === void 0 ? void 0 : _j.expirationTime;
        this.notBefore = (_k = match === null || match === void 0 ? void 0 : match.groups) === null || _k === void 0 ? void 0 : _k.notBefore;
        this.requestId = (_l = match === null || match === void 0 ? void 0 : match.groups) === null || _l === void 0 ? void 0 : _l.requestId;
        this.resources = (_o = (_m = match === null || match === void 0 ? void 0 : match.groups) === null || _m === void 0 ? void 0 : _m.resources) === null || _o === void 0 ? void 0 : _o.split('\n- ').slice(1);
    }
}
exports.ParsedMessage = ParsedMessage;
