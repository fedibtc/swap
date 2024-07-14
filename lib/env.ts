import { z } from "zod";

const envSchema = z.object({
  FF_API_KEY: z.string(),
  FF_API_SECRET: z.string(),
});

envSchema.parse(process.env);

declare global {
  namespace NodeJS {
    interface ProcessEnv extends z.infer<typeof envSchema> {}
  }
}
