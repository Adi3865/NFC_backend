const Joi = require('joi');

const visitorRequestSchema = Joi.object({
  name: Joi.string().required().min(3).max(50),
  mobileNumber: Joi.string().pattern(/^[0-9]{10}$/).required(),
  photo: Joi.string(),  // Base64 encoded string or URL
  purpose: Joi.string().required().min(5).max(200),
  expectedArrivalTime: Joi.date().required(),
  expectedDuration: Joi.number().min(1).max(48).default(2),  // In hours, max 2 days
  isGroupVisit: Joi.boolean().default(false),
  groupSize: Joi.when('isGroupVisit', {
    is: true,
    then: Joi.number().required().min(2).max(20),
    otherwise: Joi.number().default(1)
  }),
  additionalVisitors: Joi.when('isGroupVisit', {
    is: true,
    then: Joi.array().items(
      Joi.object({
        name: Joi.string().required().min(3).max(50),
        mobileNumber: Joi.string().pattern(/^[0-9]{10}$/),
        photo: Joi.string()
      })
    ).min(1),
    otherwise: Joi.array().optional()
  })
});

const visitorCheckInSchema = Joi.object({
  idCardPhoto: Joi.string().required()  // Base64 encoded string or URL
});

const blacklistSchema = Joi.object({
  mobileNumber: Joi.string().pattern(/^[0-9]{10}$/).required(),
  name: Joi.string().required().min(3).max(50),
  photo: Joi.string(),
  reason: Joi.string().required().min(10).max(500),
  visitorId: Joi.string().optional()
});

module.exports = {
  visitorRequestSchema,
  visitorCheckInSchema,
  blacklistSchema
};