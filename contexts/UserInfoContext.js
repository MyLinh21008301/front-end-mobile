import { createContext, useContext } from 'react';

const UserInfoContext = createContext(null);

export const useUserInfo = () => {
  const context = useContext(UserInfoContext);
  if (!context) {
    throw new Error('useUserInfo must be used within a UserInfoProvider');
  }
  return context;
};

export default UserInfoContext;