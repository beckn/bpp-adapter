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
exports.startAppServer = void 0;
const express_1 = __importDefault(require("express"));
const http_status_1 = __importDefault(require("http-status"));
const config_1 = __importDefault(require("./config"));
const exception_1 = __importDefault(require("./library/exception"));
const logger_1 = __importDefault(require("./library/logger"));
const health_route_1 = __importDefault(require("./resources/health/health.route"));
const bppHandler_route_1 = __importDefault(require("./resources/bppHandler/bppHandler.route"));
let connection;
const startAppServer = () => __awaiter(void 0, void 0, void 0, function* () {
    const expressApp = (0, express_1.default)();
    expressApp.use(express_1.default.urlencoded({ extended: true, limit: "50mb" }));
    expressApp.use(express_1.default.json({ limit: "50mb" }));
    (0, health_route_1.default)(expressApp);
    (0, bppHandler_route_1.default)(expressApp);
    expressApp.use((request, response, next) => {
        try {
            throw new exception_1.default("ROUTE_NOT_FOUND", `Request URL (${request.originalUrl}) is not available`, http_status_1.default.NOT_FOUND);
        }
        catch (error) {
            next(error);
        }
    });
    handleErrorRoute(expressApp);
    const APIAddress = yield openConnection(expressApp);
    return APIAddress;
});
exports.startAppServer = startAppServer;
const openConnection = (expressApp) => __awaiter(void 0, void 0, void 0, function* () {
    return new Promise((resolve) => {
        logger_1.default.info(`Server is about to listen to port ${config_1.default.PORT}`, {
            name: "Application",
        });
        connection = expressApp.listen(config_1.default.PORT, () => {
            // mongoose
            //   .connect(config.DATABASE_URL, {
            //     autoCreate: true,
            //   })
            //   .then(() => {
            //     Logger.info("ENV config::", config);
            //     Logger.info("Mongodb connected", {
            //       name: "Application",
            //     });
            resolve(connection.address());
            // });
        });
    });
});
const handleErrorRoute = (expressApp) => {
    expressApp.use((error, request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
        logger_1.default.error("Error:::", error);
        response
            .status(error instanceof exception_1.default ? error.HTTPStatus : 500)
            .send(error instanceof exception_1.default
            ? {
                success: false,
                error: true,
                errorType: error.name,
                statusCode: error.HTTPStatus,
                message: error.message,
            }
            : {
                success: false,
                error: true,
                errorType: "internal server error",
                message: error.message
                    ? error.message
                    : "internal server error",
                statusCode: 500,
            })
            .end();
    }));
};
//# sourceMappingURL=server.js.map