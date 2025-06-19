import Joi from 'joi'
import { ObjectId } from 'mongodb'
import { GET_DB } from '~/config/mongodb'
import {
  OBJECT_ID_RULE,
  OBJECT_ID_RULE_MESSAGE,
  EMAIL_RULE,
  EMAIL_RULE_MESSAGE,
  PASSWORD_RULE,
  PASSWORD_RULE_MESSAGE,
  PHONE_RULE,
  PHONE_RULE_MESSAGE
} from '~/utils/validator'

// Define temp roles
const USER_ROLES = {
  CLIENT: 'client',
  ADMIN: 'admin',
  STAFF: 'staff'
}

// Define Collection (Name & Schema)
const USER_COLLECTION_NAME = 'users'
const USER_COLLECTION_SCHEMA = Joi.object({
  // Use regex to validate ObjectId (because no Object validate in Joi)
  fullName: Joi.string().required().min(5).max(30).trim().strict(),
  birthDate: Joi.date().default(null),
  gender: Joi.string().valid('male', 'female', 'other').default(null),
  email: Joi.string().pattern(EMAIL_RULE).default(null),
  username: Joi.string().min(5).default(null),
  phone: Joi.string().pattern(PHONE_RULE).default(null),
  password: Joi.string().pattern(PASSWORD_RULE).default(null),

  // Unified social login IDs
  socialIds: Joi.array()
    .items(
      Joi.object({
        provider: Joi.string().valid('google', 'zalo').required(),
        id: Joi.string().required()
      })
    )
    .default([]),

  avatar: Joi.string().default(null),
  role: Joi.string()
    .valid(USER_ROLES.CLIENT, USER_ROLES.ADMIN, USER_ROLES.STAFF)
    .default(USER_ROLES.CLIENT),

  membershipId: Joi.string().pattern(OBJECT_ID_RULE).default(null),

  createdAt: Joi.date().timestamp('javascript').default(Date.now),
  updatedAt: Joi.date().timestamp('javascript').default(null),
  _destroy: Joi.boolean().default(false)
})

// Don't accept update feild
const INVALID_UPDATE_FIELDS = ['_id', 'createdAt']

const validateBeforeCreate = async data => {
  return await USER_COLLECTION_SCHEMA.validateAsync(data, { abortEarly: false })
}

const createNew = async data => {
  try {
    const validData = await validateBeforeCreate(data)
    const createdUser = await GET_DB()
      .collection(USER_COLLECTION_NAME)
      .insertOne(validData)
    return createdUser
  } catch (error) {
    throw new Error(error)
  }
}

const findOneById = async userId => {
  try {
    return await GET_DB()
      .collection(USER_COLLECTION_NAME)
      .findOne({ _id: new ObjectId(userId) })
  } catch (error) {
    throw new Error(error)
  }
}

const findOneByPhone = async phone => {
  try {
    return await GET_DB().collection(USER_COLLECTION_NAME).findOne({ phone })
  } catch (error) {
    throw new Error(error)
  }
}

const findOneByUserName = async userName => {
  try {
    return await GET_DB().collection(USER_COLLECTION_NAME).findOne({ userName })
  } catch (error) {
    throw new Error(error)
  }
}

const findOrCreateBySocial = async (provider, userData) => {
  try {
    const socialId = provider === 'google' ? userData.sub : userData.id

    // Find user by social ID
    let user = await GET_DB()
      .collection(USER_COLLECTION_NAME)
      .findOne({
        socialIds: { $elemMatch: { provider, id: socialId } }
      })
    if (user) return user

    // Create new user if not found
    const newUser = {
      fullName: userData.name,
      email: userData.email || '',
      socialIds: [{ provider, id: socialId }],
      avatar: userData.picture || userData.avatar
    }
    const result = await createNew(newUser)

    // Return to service
    return await GET_DB()
      .collection(USER_COLLECTION_NAME)
      .findOne({ _id: result.insertedId })
  } catch (error) {
    throw new Error(error)
  }
}

const update = async (userId, updateData) => {
  try {
    // Filter valid feild
    Object.keys(updateData).forEach(feildName => {
      if (INVALID_UPDATE_FIELDS.includes(feildName)) {
        delete updateData[feildName]
      }
    })

    const result = await GET_DB()
      .collection(USER_COLLECTION_NAME)
      .findOneAndUpdate(
        { _id: new ObjectId(userId) },
        { $set: updateData },
        { returnDocument: 'after' }
      )
    return result
  } catch (error) {
    throw new Error(error)
  }
}

export const userModel = {
  USER_COLLECTION_NAME,
  USER_COLLECTION_SCHEMA,
  createNew,
  findOneById,
  findOneByPhone,
  findOneByUserName,
  findOrCreateBySocial,
  update
}
