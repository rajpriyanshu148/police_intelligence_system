import { apiClient } from '@/lib/api-client'
import type { ApiResponse, AuthTokens, Officer } from '@/types'

export const authService = {
  /**
   * Authenticate officer with username/password credentials.
   */
  login: async (username: string, password: string): Promise<AuthTokens> => {
    const { data } = await apiClient.post<ApiResponse<AuthTokens>>('/auth/login', {
      username,
      password,
    })
    return data.data
  },

  /**
   * Revoke active session tokens.
   */
  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout')
  },

  /**
   * Rotate access token using a valid refresh token.
   */
  refresh: async (refreshToken: string): Promise<Pick<AuthTokens, 'access_token' | 'refresh_token'>> => {
    const { data } = await apiClient.post<ApiResponse<Pick<AuthTokens, 'access_token' | 'refresh_token'>>>(
      '/auth/refresh',
      { refresh_token: refreshToken }
    )
    return data.data
  },

  /**
   * Fetch the authenticated officer's own profile.
   */
  me: async (): Promise<Officer> => {
    const { data } = await apiClient.get<ApiResponse<Officer>>('/auth/me')
    return data.data
  },

  /**
   * Change officer password.
   */
  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    await apiClient.post('/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
    })
  },
}
