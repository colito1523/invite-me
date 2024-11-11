import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, database } from '../../config/firebase';  // Asegúrate de tener tu configuración de Firebase
import { collection, getDocs } from 'firebase/firestore';

const BlockContext = createContext();

// Proveedor de contexto para manejar los bloqueos
export const BlockProvider = ({ children }) => {
  const [blockedUsers, setBlockedUsers] = useState([]);

  useEffect(() => {
    const fetchBlockedUsers = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      const blockedRef = collection(database, 'users', currentUser.uid, 'blockedUsers');
      const blockedSnapshot = await getDocs(blockedRef);
      const blockedIds = blockedSnapshot.docs.map(doc => doc.data().blockedId);

      setBlockedUsers(blockedIds);
    };

    fetchBlockedUsers();
  }, []);

  return (
    <BlockContext.Provider value={blockedUsers}>
      {children}
    </BlockContext.Provider>
  );
};

// Hook para acceder al contexto
export const useBlockedUsers = () => {
  return useContext(BlockContext);
};
