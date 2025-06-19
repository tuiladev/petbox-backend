import { pick } from 'lodash'

// User DTO
export const pickUser = user => {
  if (!user) return {}
  return pick(user, [
    'id',
    'fullName',
    'email',
    'phone',
    'birthDate',
    'avatar',
    'role',
    'createdAt',
    'updatedAt'
  ])
}
