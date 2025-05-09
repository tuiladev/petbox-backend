import { pick } from 'lodash'

// Return some needed info to frontend
export const pickUser = (user) => {
  if (!user) return {}
  return pick(user, [
    'id',
    'fullName',
    'email',
    'phoneNumber',
    'birthDate',
    'avatar',
    'role',
    'createdAt',
    'updatedAt'
  ])
}