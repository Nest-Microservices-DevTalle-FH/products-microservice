import 'dotenv/config';
import * as joi from 'joi';

// Interfaz que define la estructura de las variables de entorno requeridas
interface EnvVars {
  PORT: number;
  DATABASE_URL: string;
}

// Esquema de validación de Joi para las variables de entorno
// unknown(true) permite variables adicionales que no están definidas en el esquema
const envsSchema = joi
  .object({
    PORT: joi.number().required(),
    DATABASE_URL: joi.string().required(),
  })
  .unknown(true);

// Valida las variables de entorno contra el esquema definido
const validationResult = envsSchema.validate(process.env);

// Si hay errores de validación, lanza una excepción
if (validationResult.error) {
  throw new Error(`Config validation error: ${validationResult.error.message}`);
}

// Asigna los valores validados con el tipo correcto
// Se utiliza 'as EnvVars' para asegurar el tipado después de la validación
const envVars: EnvVars = validationResult.value as EnvVars;

// Exporta las variables de entorno validadas en un objeto de configuración
export const envs = {
  port: envVars.PORT,
  databaseUrl: envVars.DATABASE_URL,
};
