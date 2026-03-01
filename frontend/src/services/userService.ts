import api from './api'
import type {
  RegisterRequest,
  LoginRequest,
  LoginResponse,
  ConfirmRequest,
  User,
  UpdateProfileRequest,
} from '../types'

export const userService = {
  register: (data: RegisterRequest) =>
    api.post<User>('/users/register', data).then((r) => r.data),

  login: (data: LoginRequest) =>
    api.post<LoginResponse>('/users/login', data).then((r) => r.data),

  confirm: (data: ConfirmRequest) =>
    api.post<void>('/users/confirm', data),

  getProfile: () =>
    api.get<User>('/users/profile').then((r) => r.data),

  updateProfile: (data: UpdateProfileRequest) =>
    api.put<User>('/users/profile', data).then((r) => r.data),
}
