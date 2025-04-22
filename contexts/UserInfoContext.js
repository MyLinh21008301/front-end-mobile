// import { createContext, useContext } from 'react';

// const UserInfoContext = createContext(null);



// export const useUserInfo = () => {
//   const context = useContext(UserInfoContext);

//   if (!context) {
//     throw new Error('useUserInfo must be used within a UserInfoProvider');
//   }
//   return context;
// };
// // Provider Component
// export const UserInfoProvider = ({ children }) => {
//   const [currentConversation, setCurrentConversation] = useState(null);

//   return (
//     <UserInfoContext.Provider value={{ currentConversation, setCurrentConversation }}>
//       {children}
//     </UserInfoContext.Provider>
//   );
// };
// export default UserInfoContext;

import React, { createContext, useContext, useState } from 'react';

const UserInfoContext = createContext(null);

export const UserInfoProvider = ({ children }) => {
  const [userInfo, setUserInfo] = useState(null); // Lưu thông tin người dùng (phoneNumber, name, v.v.)
  const [currentConversation, setCurrentConversation] = useState(null);

  return (
    <UserInfoContext.Provider value={{ userInfo, setUserInfo, currentConversation, setCurrentConversation }}>
      {children}
    </UserInfoContext.Provider>
  );
};

export const useUserInfo = () => {
  const context = useContext(UserInfoContext);
  if (!context) {
    throw new Error('useUserInfo must be used within a UserInfoProvider');
  }
  return context;
};

export default UserInfoContext;