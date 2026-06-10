import axios from 'axios';
import config from '../shared/config';
import logger from '../shared/logger';

export interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
}

export const getUserById = async (userId: string): Promise<UserData | null> => {
  try {
    const response = await axios.get(`${config.services.user}/api/users/${userId}`);
    
    if (response.data.status === 'success' && response.data.data?.user) {
      return response.data.data.user;
    }
    
    return null;
  } catch (error) {
    logger.error(`Failed to fetch user ${userId} from user-service:`, error);
    return null;
  }
};
