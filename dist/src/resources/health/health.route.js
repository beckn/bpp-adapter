"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_status_1 = __importDefault(require("http-status"));
function defineHealthRoutes(expressApp) {
    const healthRouter = express_1.default.Router();
    healthRouter.get("/", (req, res) => {
        const healthCheck = {
            sucess: true,
            uptime: process.uptime(),
            responseTime: process.hrtime(),
            date: new Date(),
        };
        try {
            res.status(http_status_1.default.OK).send(healthCheck);
            return undefined;
        }
        catch (error) {
            res.status(http_status_1.default.SERVICE_UNAVAILABLE).send();
            return undefined;
        }
    });
    expressApp.use("/api/v1/health", healthRouter);
}
exports.default = defineHealthRoutes;
//# sourceMappingURL=health.route.js.map