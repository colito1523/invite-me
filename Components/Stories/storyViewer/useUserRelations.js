// useUserRelations.js

import { useState, useEffect } from "react";
import { fetchBlockedUsers, fetchPinnedViewers } from "./storyUtils";

export default function useUserRelations({ auth, database }) {
  // Estados locales para bloqueados y pineados
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [pinnedViewers, setPinnedViewers] = useState([]);

  useEffect(() => {
    // 1. Cargar usuarios bloqueados
    fetchBlockedUsers({ auth, database, setBlockedUsers });

    // 2. Cargar viewers “pineados”
    fetchPinnedViewers({ auth, database, setPinnedViewers });
  }, [auth?.currentUser?.uid, database]);

  // Retornamos los estados y sus setters
  return { blockedUsers, pinnedViewers, setBlockedUsers, setPinnedViewers };
}
