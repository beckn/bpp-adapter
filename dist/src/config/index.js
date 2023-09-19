"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Store configuration in a self-explanatory, strongly typed and hierarchical store
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const zod_1 = require("zod");
if (process.env.NODE_ENV === "development") {
    dotenv_1.default.config({ path: path_1.default.join(__dirname, "../../.env") });
}
const envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.union([
        zod_1.z.literal("production"),
        zod_1.z.literal("development"),
        zod_1.z.literal("test"),
    ]),
    PORT: zod_1.z
        .string()
        .default("3000")
        .transform((str) => parseInt(str, 10)),
    DATABASE_URL: zod_1.z.string().describe("mongo db url"),
});
const envVars = envSchema.parse(process.env);
const config = {
    NODE_ENV: envVars.NODE_ENV,
    PORT: envVars.PORT,
    DATABASE_URL: envVars.DATABASE_URL,
};
exports.default = config;
//# sourceMappingURL=index.js.map