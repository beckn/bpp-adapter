// Store configuration in a self-explanatory, strongly typed and hierarchical store
import dotenv from "dotenv";
import path from "path";
import { z } from "zod";

if (process.env.NODE_ENV === "development") {
  dotenv.config({ path: path.join(__dirname, "../../.env") });
}

const envSchema = z.object({
  NODE_ENV: z.union([
    z.literal("production"),
    z.literal("development"),
    z.literal("test"),
  ]),
  PORT: z
    .string()
    .default("3000")
    .transform((str) => parseInt(str, 10)),
    STRAPI_API: z.string(),
    API_TOKEN: z.string(),
    ECOMMERCE:z.string(),
    APPOINTMENT:z.string()

 // DATABASE_URL: z.string().describe("mongo db url"),

  
});

const envVars = envSchema.parse(process.env);

const config = {
  NODE_ENV: envVars.NODE_ENV,
  PORT: envVars.PORT,
 STRAPI_API:envVars.STRAPI_API,
 API_TOKEN:envVars.API_TOKEN,
 ECOMMERCE:envVars.ECOMMERCE,
APPOINTMENT:envVars.APPOINTMENT

 };

export default config;