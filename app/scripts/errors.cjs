"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransportError = exports.MultichainApiError = void 0;
class MultichainApiError extends Error {
    constructor(error) {
        super(error.message);
        this.name = this.constructor.name;
        this.cause = error;
        Object.setPrototypeOf(this, this.constructor.prototype);
    }
}
exports.MultichainApiError = MultichainApiError;
class TransportError extends Error {
    constructor(message, originalError) {
        super(message);
        this.name = this.constructor.name;
        this.cause = originalError;
        Object.setPrototypeOf(this, this.constructor.prototype);
    }
}
exports.TransportError = TransportError;
//# sourceMappingURL=errors.cjs.map