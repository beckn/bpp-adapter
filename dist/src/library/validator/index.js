"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequest = void 0;
const http_status_1 = __importDefault(require("http-status"));
const logger_1 = __importDefault(require("../logger"));
const validateRequest = (schema) => (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield schema.parseAsync(request.body);
        next();
    }
    catch (validationError) {
        try {
            logger_1.default.error(validationError);
            const parsedError = JSON.parse(validationError);
            const result = {
                success: false,
                error: parsedError.length
                    ? parsedError[0].message
                    : "Something went wrong",
            };
            response.status(http_status_1.default.BAD_REQUEST).send(result);
        }
        catch (error) {
            next(validationError);
        }
    }
});
exports.validateRequest = validateRequest;
//# sourceMappingURL=index.js.map