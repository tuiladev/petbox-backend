import Joi from 'joi'
import { ObjectId } from 'mongodb'
import { GET_DB } from '~/config/mongodb'
import {
  EMAIL_RULE,
  EMAIL_RULE_MESSAGE,
  OBJECT_ID_RULE,
  OBJECT_ID_RULE_MESSAGE,
  PHONE_RULE,
  PHONE_RULE_MESSAGE
} from '~/utils/validator'

// Define Collection (Name & Schema)
const STORE_COLLECTION_NAME = 'stores'
const STORE_COLLECTION_SCHEMA = Joi.object({
  code: Joi.string().trim().required(),
  name: Joi.string().trim().required(),
  address: Joi.string().trim().required(),
  phone: Joi.string()
    .pattern(PHONE_RULE)
    .message(PHONE_RULE_MESSAGE)
    .required(),
  email: Joi.string()
    .pattern(EMAIL_RULE)
    .message(EMAIL_RULE_MESSAGE)
    .required(),

  manager: Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE),

  lat: Joi.number().min(-90).max(90).required(),
  lng: Joi.number().min(-180).max(180).required(),

  weeklySchedule: Joi.array()
    .items(
      Joi.object({
        day: Joi.number().integer().min(0).max(6).required(),
        isClosed: Joi.boolean().required(),
        sessions: Joi.array()
          .items(
            Joi.object({
              start: Joi.string()
                .pattern(/^\d{2}:\d{2}$/)
                .required(), // e.g. 09:00
              end: Joi.string()
                .pattern(/^\d{2}:\d{2}$/)
                .required()
            })
          )
          .required()
      })
    )
    .length(7)
    .required(),

  createdAt: Joi.date().timestamp('javascript').default(Date.now),
  updatedAt: Joi.date().timestamp('javascript').default(null),
  deletedAt: Joi.date().timestamp('javascript').default(null)
})

// Don't accept update feild
const INVALID_UPDATE_FIELDS = ['_id', 'createdAt']

const validateBeforeCreate = async data => {
  return await STORE_COLLECTION_SCHEMA.validateAsync(data, {
    abortEarly: false
  })
}

export const storeModel = {
  STORE_COLLECTION_NAME,
  STORE_COLLECTION_SCHEMA
}
