"use strict";
/* istanbul ignore file */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createModuleLogger = exports.incomingTransactionsLogger = exports.projectLogger = void 0;
const utils_1 = require("@metamask/utils");
Object.defineProperty(exports, "createModuleLogger", { enumerable: true, get: function () { return utils_1.createModuleLogger; } });
exports.projectLogger = (0, utils_1.createProjectLogger)('transaction-controller');
exports.incomingTransactionsLogger = (0, utils_1.createModuleLogger)(exports.projectLogger, 'incoming-transactions');
//# sourceMappingURL=logger.js.map