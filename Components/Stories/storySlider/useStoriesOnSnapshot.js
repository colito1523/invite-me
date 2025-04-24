// useStoriesOnSnapshot.js
// Hook que sustituye las llamadas manuales a loadExistingStories por listeners en tiempo real.
// Mantiene el mismo shape de datos que StorySlider espera, por lo que el cambio en el componente es mínimo.

import { useEffect, useRef, useState } from "react";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { auth, database } from "../../../config/firebase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { calculateHoursAgo } from "../storyViewer/storyUtils";
import { Image as ExpoImage } from "expo-image";


// 🔧 Utilidad para obtener la lista de amigos
async function getFriendsList(userId) {
  const friendsRef = collection(database, "users", userId, "friends");
  const friendsSnapshot = await getDocs(friendsRef);
  return friendsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

/**
 * Hook que provee historias en tiempo real usando onSnapshot.
 * Devuelve stories, unseenStories y una función opcional reload() por compatibilidad.
 */
export default function useStoriesOnSnapshot(t) {
    const allStoriesRef = useRef({});
    const unsubscribesRef = useRef([]);
    const validFriendIdsRef = useRef([]); // <--- ✅ Moverlo aquí
  const [stories, setStories] = useState([]);
  const [unseenStories, setUnseenStories] = useState({});
  const [forceReloadFlag, setForceReloadFlag] = useState(false);
  

  // 👉 Evitamos recrear funciones en cada render
  const processStoriesSnapshot = async (uid, snapshot) => {
    const now = new Date();
    const docs = snapshot.docs
      .map((d) => ({ id: d.id, ...d.data(), hoursAgo: calculateHoursAgo(d.data().createdAt) }))
      .filter((s) => new Date(s.expiresAt.toDate()) > now);

    // Si es el usuario actual necesitamos username y profileImage
    let username = "";
    let lastName = "";
    let profileImage = "https://via.placeholder.com/150";

    if (uid === auth.currentUser.uid) {
      const userData = (await getDoc(doc(database, "users", uid))).data();
      username = userData.firstName || t("storySlider.currentUser");
      lastName = userData.lastName || "";
      profileImage = userData.photoUrls?.[0] || profileImage;
    } else {
      const friendDoc = await getDoc(doc(database, "users", uid));
      if (friendDoc.exists()) {
        const data = friendDoc.data();
        username = data.firstName || t("storySlider.friend");
        lastName = data.lastName || "";
        profileImage = data.photoUrls?.[0] || profileImage;
      }
    }

    // Pre‑cache primera imagen para render rápido
    if (docs.length > 0) {
      ExpoImage.prefetch(docs[0].storyUrl).catch(() => {});
    }

    if (docs.length === 0) {
        delete allStoriesRef.current[uid];
        await AsyncStorage.removeItem("cachedStories");
      
        setUnseenStories((prev) => {
          const { [uid]: _, ...rest } = prev;
          const all = Object.values(allStoriesRef.current);
          const sorted = sortStories(all, rest);
          setStories(sorted);
          return rest;
        });
      
        return;
      }
      
      // ✅ Guardamos historias activas
      allStoriesRef.current[uid] = {
        uid,
        username,
        lastName,
        profileImage,
        userStories: docs,
      };
      
      // ✅ Solo una llamada a setUnseenStories
      setUnseenStories((prev) => {
        const newUnseen = {
          ...prev,
          [uid]: docs.filter((d) => !d.viewers?.some((v) => v.uid === auth.currentUser.uid)),
        };
      
        const all = Object.values(allStoriesRef.current);
        const sorted = sortStories(all, newUnseen);
        setStories(sorted);
      
        return newUnseen;
      });
      
      
      

  };

  const init = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const cached = await AsyncStorage.getItem("cachedStories");
    if (cached) setStories(JSON.parse(cached));

    const userDoc = await getDoc(doc(database, "users", user.uid));
    const userData = userDoc.data();
    const hidden = userData.hiddenStories || [];
    const hideFrom = userData.hideStoriesFrom || [];
    const blocked = userData.blockedUsers || [];

    const friends = await getFriendsList(user.uid);
    const validFriends = friends.filter(
      (f) => !hidden.includes(f.friendId) && !hideFrom.includes(f.friendId) && !blocked.includes(f.friendId),
    );

    const userColRef = collection(database, "users", user.uid, "stories");
    unsubscribesRef.current.push(onSnapshot(userColRef, (snap) => processStoriesSnapshot(user.uid, snap)));

    validFriends.forEach((friend) => {
      const ref = collection(database, "users", friend.friendId, "stories");
      unsubscribesRef.current.push(onSnapshot(ref, (snap) => processStoriesSnapshot(friend.friendId, snap)));
    });
  };

  useEffect(() => {
    init();
    return () => {
      unsubscribesRef.current.forEach((unsub) => unsub && unsub());
      unsubscribesRef.current = [];
    };
  }, [forceReloadFlag]); // 👈 se vuelve a ejecutar si cambia forceReloadFlag

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
  
    const userDocRef = doc(database, "users", user.uid);
  
    const unsubscribeUser = onSnapshot(userDocRef, async (userDoc) => {
      if (userDoc.exists()) {
        const data = userDoc.data();
        const hidden = data.hiddenStories || [];
        const hideFrom = data.hideStoriesFrom || [];
        const blocked = data.blockedUsers || [];
  
        const friends = await getFriendsList(user.uid);
        const validFriends = friends.filter(
          (f) =>
            !hidden.includes(f.friendId) &&
            !hideFrom.includes(f.friendId) &&
            !blocked.includes(f.friendId)
        );
  
        const newValidIds = validFriends.map((f) => f.friendId).sort();
        const prevValidIds = validFriendIdsRef.current.sort();
  
        const isSame = JSON.stringify(newValidIds) === JSON.stringify(prevValidIds);
        if (isSame) return; // ✅ No hay cambios reales, no hacemos nada
  
        validFriendIdsRef.current = newValidIds; // 🧠 Guardamos la nueva lista
        allStoriesRef.current = {};
  
        // 🔁 Reiniciamos todos los listeners
        unsubscribesRef.current.forEach((u) => u && u());
        unsubscribesRef.current = [];
  
        // Listener propio
        const userStoriesRef = collection(database, "users", user.uid, "stories");
        unsubscribesRef.current.push(
          onSnapshot(userStoriesRef, (snap) => processStoriesSnapshot(user.uid, snap))
        );
  
        // Listeners de amigos válidos actualizados
        validFriends.forEach((friend) => {
          const ref = collection(database, "users", friend.friendId, "stories");
          unsubscribesRef.current.push(
            onSnapshot(ref, (snap) => processStoriesSnapshot(friend.friendId, snap))
          );
        });
      }
    });
  
    return () => {
      unsubscribeUser();
      unsubscribesRef.current.forEach((u) => u && u());
      unsubscribesRef.current = [];
    };
  }, []);
  
  


  // 🪄 Mantener orden: propias → no vistas → vistas
  const sortStories = (arr, unseen) => {
    return arr.sort((a, b) => {
      const me = auth.currentUser.uid;
      if (a.uid === me) return -1;
      if (b.uid === me) return 1;

      const aUnseen = unseen[a.uid]?.length > 0;
      const bUnseen = unseen[b.uid]?.length > 0;
      if (aUnseen && !bUnseen) return -1;
      if (!aUnseen && bUnseen) return 1;
      return 0;
    });
  };

  const reload = () => {
    unsubscribesRef.current.forEach((u) => u && u());
    unsubscribesRef.current = [];
    setStories([]);
    setUnseenStories({});
    setForceReloadFlag(prev => !prev); // 👈 fuerza que el useEffect se dispare de nuevo
  };

  return { stories, unseenStories, reload, setUnseenStories };

}
