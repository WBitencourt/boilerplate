import { z } from 'zod';
//import 'dotenv/config'; // a partir da versao do node 22.11.0, o dotenv nao é mais necessario

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  DATABASE_URL: z.string('DATABASE_URL is required'),
  PORT: z.coerce.number().default(3000).describe('Port to run the server'),
  HOSTNAME: z
    .string()
    .default('0.0.0.0')
    .describe('Hostname to run the server'),
});

console.log(envSchema.safeParse(process.env));

export type Env = z.infer<typeof envSchema>;

// Isso vai lançar um erro e parar o app se faltar alguma variável crítica
export const env: Env = envSchema.parse(process.env);
