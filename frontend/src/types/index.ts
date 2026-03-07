export interface User {
  userId: string
  email: string
  firstName: string
  lastName: string
  phoneNumber?: string
  address?: string
  planId?: string
  createdAt: string
  updatedAt: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  firstName: string
  lastName: string
  phoneNumber?: string
}

export interface ConfirmRequest {
  email: string
  confirmationCode: string
}

export interface LoginResponse {
  accessToken: string
  refreshToken: string
  idToken: string
  expiresIn: number
  tokenType: string
}

export interface UpdateProfileRequest {
  firstName?: string
  lastName?: string
  phoneNumber?: string
  address?: string
}

export interface Plan {
  planId: string
  name: string
  description: string
  pricePerMonth: number
  dataGB: number
  features: string[]
}

export interface CreateOrderRequest {
  planId: string
}

export interface OrderResponse {
  orderId: string
  userId: string
  planId: string
  planName: string
  pricePerMonth: number
  status: string
  createdAt: string
  updatedAt: string
}
