import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'

// Load backend API URL from environment variables
const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1'

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Send cookies for refresh tokens if backend uses HttpOnly cookies
})

let isRefreshing = false
let failedQueue: Array<{
  resolve: (token: string) => void
  reject: (error: any) => void
}> = []

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (token) {
      prom.resolve(token)
    } else {
      prom.reject(error)
    }
  })
  failedQueue = []
}

// Request Interceptor: Attach access token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('aipas_access_token')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response Interceptor: Handle 401 & Silent Token Refresh Rotation
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }
    
    if (!originalRequest) {
      return Promise.reject(error)
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`
            }
            return apiClient(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const refreshToken = localStorage.getItem('aipas_refresh_token')
        if (!refreshToken) {
          throw new Error('No refresh token available')
        }

        // Perform refresh call to FastAPI backend
        const refreshResponse = await axios.post(`${API_URL}/auth/refresh`, {
          refresh_token: refreshToken,
        })

        const { access_token, refresh_token: new_refresh_token } = refreshResponse.data.data
        
        localStorage.setItem('aipas_access_token', access_token)
        if (new_refresh_token) {
          localStorage.setItem('aipas_refresh_token', new_refresh_token)
        }

        processQueue(null, access_token)
        isRefreshing = false

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${access_token}`
        }
        return apiClient(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        isRefreshing = false
        
        // Clear local storage and dispatch logout event or redirect
        localStorage.removeItem('aipas_access_token')
        localStorage.removeItem('aipas_refresh_token')
        window.dispatchEvent(new Event('aipas_logout'))
        
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)
