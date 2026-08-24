import { apiClient, normalizeError } from './client';
import { components } from '@/types/api';

export type Token = components['schemas']['Token'];
export type LoginRequest = components['schemas']['Body_login_access_token_api_v1_auth_login_post'];
export type UserOut = components['schemas']['UserOut'];
export type UserCreate = components['schemas']['UserCreate'];

export const authApi = {
  login: async (data: LoginRequest) => {
    try {
      const params = new URLSearchParams();
      params.append('username', data.username);
      params.append('password', data.password);
      params.append('scope', '');
      
      const response = await apiClient.post<Token>('/api/v1/auth/login', params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      return response.data;
    } catch (error) {
      throw normalizeError(error);
    }
  },
  
  register: async (data: UserCreate) => {
    try {
      const response = await apiClient.post<UserOut>('/api/v1/auth/register', data);
      return response.data;
    } catch (error) {
      throw normalizeError(error);
    }
  },
};
