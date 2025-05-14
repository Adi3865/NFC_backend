const Joi = require('joi');

// Broadcast validation schema
const broadcastSchema = Joi.object({
  title: Joi.string().required().min(3).max(100),
  message: Joi.string().required().min(5).max(1000),
  broadcastType: Joi.string().valid('emergency', 'announcement', 'maintenance', 'general'),
  notificationChannels: Joi.object({
    app: Joi.boolean(),
    sms: Joi.boolean()
  }),
  targetUsers: Joi.string().valid('all', 'residents', 'staff', 'admins'),
  targetDepartments: Joi.array().items(Joi.string()),
  scheduledAt: Joi.date().min('now').allow(null),
  expiresAt: Joi.date().min(Joi.ref('scheduledAt')).allow(null),
  priority: Joi.string().valid('low', 'medium', 'high', 'critical'),
  status: Joi.string().valid('draft', 'scheduled', 'sent')
});

// Poll validation schema
const pollSchema = Joi.object({
  title: Joi.string().required().min(3).max(100),
  description: Joi.string().max(500),
  question: Joi.string().required().min(5).max(200),
  options: Joi.array().items(
    Joi.alternatives().try(
      Joi.string(),
      Joi.object({
        optionText: Joi.string().required()
      })
    )
  ).min(2).required(),
  allowMultipleSelections: Joi.boolean(),
  targetUsers: Joi.string().valid('all', 'residents', 'staff', 'admins'),
  targetDepartments: Joi.array().items(Joi.string()),
  startDate: Joi.date().min('now'),
  endDate: Joi.date().min(Joi.ref('startDate')).required(),
  status: Joi.string().valid('draft', 'active'),
  isAnonymous: Joi.boolean()
});

// Poll response validation schema
const pollResponseSchema = Joi.object({
  selectedOptions: Joi.array().items(Joi.string()).min(1).required(),
  responseText: Joi.string().max(500)
});

module.exports = {
  broadcastSchema,
  pollSchema,
  pollResponseSchema
};