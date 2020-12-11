const Joi = require('joi');

module.exports = {
    auth: Joi.object({
        authorization: Joi.string().required()
    }).unknown(),
    signup: Joi.object({
        email: Joi.string().email().required(),
        firstName: Joi.string().required(),
        lastName: Joi.string().required(),
        password: Joi.string().required()
    }),
    login: Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().required()
    }),
    forgetPassword: Joi.object({
        email: Joi.string().email().required()
    }),
    logout: Joi.object({
        email: Joi.string().email().required()
    })
}