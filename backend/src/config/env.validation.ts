import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  PORT: Joi.number().port().default(3012),
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),
  DATABASE_URL: Joi.string()
    .pattern(/^postgres(ql)?:\/\//)
    .required(),
  JWT_SECRET: Joi.string().min(16).required(),
  JWT_EXPIRES_IN: Joi.string().default('1d'),
  UPLOAD_DIR: Joi.string().default('uploads'),
  APP_URL: Joi.string().uri().required(),
  FRONTEND_URL: Joi.string().uri().required(),
});
