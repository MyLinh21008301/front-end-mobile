// import { createContext, useContext } from 'react';
// import useSocket from './useSocket';
// import { getToken } from '../../api/TokenAPI';

// const SocketContext = createContext(null);
// export const useSocket = () => {
//   const context = useContext(SocketContext);
//   if (!context) {
//     throw new Error('useSocket must be used within a SocketProvider');
//   }
//   return context;
// };

// export default SocketContext;
import React, { createContext, useContext } from 'react';
import useSocketIO from '../hooks/useSocket'; // Đổi tên import thành useSocketIO
import { getToken } from '../api/TokenAPI';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [token, setToken] = React.useState(null);

  React.useEffect(() => {
    const fetchToken = async () => {
      try {
        const jwt = await getToken();
        setToken(jwt);
      } catch (error) {
        console.error('Error fetching token:', error);
      }
    };
    fetchToken();
  }, []);

  const socketData = useSocketIO('http://localhost:3002', token); // Sử dụng useSocketIO

  return (
    <SocketContext.Provider value={socketData}>
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