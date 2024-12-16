import React, { createContext, useState, useContext } from 'react';

const UnreadMessagesContext = createContext();

export const UnreadMessagesProvider = ({ children }) => {
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);

  return (
    <UnreadMessagesContext.Provider value={{ hasUnreadMessages, setHasUnreadMessages }}>
      {children}
    </UnreadMessagesContext.Provider>
  );
};

export const useUnreadMessages = () => useContext(UnreadMessagesContext);
