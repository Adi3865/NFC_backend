const Joi = require('joi');

const registerSchema = Joi.object({
  name: Joi.string().required().min(3).max(50),
  email: Joi.string().email().required(),
  phone: Joi.string().pattern(/^[0-9]{10}$/).required(),
  password: Joi.string().min(6).required(),
  confirmPassword: Joi.string().valid(Joi.ref('password')).required()
    .messages({ 'any.only': 'Passwords do not match' })
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

const resourceRequestSchema = Joi.object({
  resourceId: Joi.string().required(),
  isPrimary: Joi.boolean().default(false)
});

module.exports = {
  registerSchema,
  loginSchema,
  resourceRequestSchema
};