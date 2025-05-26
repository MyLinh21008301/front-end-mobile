import { createContext, useContext, useState, useEffect } from 'react';
import { getToken } from '../apis/TokenAPI';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [token, setToken] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // Load token on mount
  useEffect(() => {
    const loadToken = async () => {
      const storedToken = await getToken();
      if (storedToken) {
        setToken(storedToken);
        setIsLoggedIn(true);
      }
    };
    
    loadToken();
  }, []);

  return (
    <SocketContext.Provider value={{ token, setToken, isLoggedIn, setIsLoggedIn }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export default SocketContext;