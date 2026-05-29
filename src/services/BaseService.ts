import appConfig from "@/configs/app.config";
import axios, { AxiosError } from "axios";

const BaseService = axios.create({
    baseURL: appConfig.apiPrefix,
    timeout: 50000,
    headers: {
        'Content-Type': 'application/json',
    },
})

const NoAuthService = axios.create({
    baseURL: appConfig.apiPrefix,
    timeout: 50000,
    headers: {
        'Content-Type': 'application/json',
    },
})

BaseService.interceptors.request.use(
    (config) => config,
    (error) => Promise.reject(error),
)

// Auto-logout on 401 — clear Zustand + localStorage, redirect to login
BaseService.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
        if (error.response?.status === 401 && typeof window !== 'undefined') {
            try {
                localStorage.removeItem('auth')
            } catch { /* noop */ }
            window.location.replace('/')
        }
        return Promise.reject(error)
    },
)

export default BaseService
export { NoAuthService }
