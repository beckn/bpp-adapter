"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HandleError = void 0;
const util = __importStar(require("util"));
const logger_1 = __importDefault(require("../logger"));
class AppError extends Error {
    constructor(name, message, HTTPStatus = 500, isTrusted = true) {
        super(message);
        this.name = name;
        this.message = message;
        this.HTTPStatus = HTTPStatus;
        this.isTrusted = isTrusted;
    }
}
const normalizeError = (errorToHandle) => {
    if (errorToHandle instanceof AppError) {
        return errorToHandle;
    }
    if (errorToHandle instanceof Error) {
        const appError = new AppError(errorToHandle.name, errorToHandle.message);
        appError.stack = errorToHandle.stack;
        return appError;
    }
    const inputType = typeof errorToHandle;
    return new AppError("general error", `Error Handler received a none error instance with type - ${inputType}, value - ${util.inspect(errorToHandle)}`);
};
const HandleError = (errorToHandle) => {
    const appError = normalizeError(errorToHandle);
    logger_1.default.info(appError.message);
};
exports.HandleError = HandleError;
exports.default = AppError;
//# sourceMappingURL=index.js.map