import { config } from "dotenv";
import { resolve } from "path";

// Explicitly load .env from the backend directory
config({ path: resolve(process.cwd(), ".env") });

export default {
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL,
  },
};
