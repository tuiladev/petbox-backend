import Joi from 'joi'
import { ObjectId } from 'mongodb'
import { GET_DB } from '~/config/mongodb'
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE, EMAIL_RULE, EMAIL_RULE_MESSAGE, PASSWORD_RULE, PASSWORD_RULE_MESSAGE, PHONE_RULE, PHONE_RULE_MESSAGE } from '~/utils/validator'

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
  email: Joi.string().pattern(EMAIL_RULE).message(EMAIL_RULE_MESSAGE),
  phoneNumber: Joi.string().pattern(PHONE_RULE).message(PHONE_RULE_MESSAGE).default(null),
  password: Joi.string().pattern(PASSWORD_RULE).message(PASSWORD_RULE_MESSAGE).default(null),

  // Social ID
  googleID: Joi.string().default(null),
  zaloID: Joi.string().default(null),

  avatar: Joi.string().default(null),
  role: Joi.string().valid(USER_ROLES.CLIENT, USER_ROLES.ADMIN, USER_ROLES.STAFF).default(USER_ROLES.CLIENT),

  petIds: Joi.array().items(Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE)).default(null),

  createdAt: Joi.date().timestamp('javascript').default(Date.now),
  updatedAt: Joi.date().timestamp('javascript').default(null),
  _destroy: Joi.boolean().default(false)
})

// Don't accept update feild
const INVALID_UPDATE_FIELDS = ['_id', 'createdAt']

const validateBeforeCreate = async (data) => {
  return await USER_COLLECTION_SCHEMA.validateAsync(data, { abortEarly: false })
}

const createNew = async (data) => {
  try {
    const validData = await validateBeforeCreate(data)
    const createdUser = await GET_DB().collection(USER_COLLECTION_NAME).insertOne(validData)
    return createdUser
  } catch (error) {
    throw new Error(error)
  }
}

const findOneById = async (userId) => {
  try {
    return await GET_DB()
      .collection(USER_COLLECTION_NAME)
      .findOne({ _id: new ObjectId(userId) })
  } catch (error) {
    throw new Error(error)
  }
}

const findOneByPhone = async (phoneNumber) => {
  try {
    return await GET_DB()
      .collection(USER_COLLECTION_NAME)
      .findOne({ phoneNumber })
  } catch (error) {
    throw new Error(error)
  }
}

const findOrCreateByGGId = async (userData) => {
  try {
    // Find user by googleID
    let user = await GET_DB()
      .collection(USER_COLLECTION_NAME)
      .findOne({ googleID: userData.sub })
    if (user) {
      return user
    }

    // Create new user if not found
    const newUserData = {
      fullName: userData.name,
      email: userData.email,
      googleID: userData.sub,
      avatar: userData.picture
    }

    // Create new user
    const result = await createNew(newUserData)

    // Return to service
    return await GET_DB().collection(USER_COLLECTION_NAME).findOne({ _id: result.insertedId })
  } catch (error) {
    throw new Error(error)
  }
}

const findOrCreateByZLId = async (userData) => {
  try {
    // Find user by zaloID
    let user = await GET_DB()
      .collection(USER_COLLECTION_NAME)
      .findOne({ zaloID: userData.id })
    if (user) {
      return user
    }

    // Create new user if not found
    const newUserData = {
      fullName: userData.name,
      zaloID: userData.id,
      avatar: userData.avatar
    }

    // Create new user
    const result = await createNew(newUserData)

    // Return to service
    return await GET_DB().collection(USER_COLLECTION_NAME).findOne({ _id: result.insertedId })
  } catch (error) {
    throw new Error(error)
  }
}

const update = async (userId, updateData) => {
  try {
    // Filter valid feild
    Object.keys(updateData).forEach((feildName) => {
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
  }
  catch (error) {
    throw new Error(error)
  }
}

export const userModel = {
  USER_COLLECTION_NAME,
  USER_COLLECTION_SCHEMA,
  createNew,
  findOneById,
  findOneByPhone,
  findOrCreateByGGId,
  findOrCreateByZLId,
  update
}
