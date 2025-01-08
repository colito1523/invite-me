const loadExistingStories = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;
  
      const now = new Date().getTime();
  
      // Obtener datos del usuario
      const userDoc = await getDoc(doc(database, "users", user.uid));
      const userData = userDoc.data();
      const hiddenStories = userData.hiddenStories || [];
      const hideStoriesFrom = userData.hideStoriesFrom || [];
      const blockedUsers = userData.blockedUsers || [];
      const mutedUsers = userData.mutedUsers || [];
  
      const friendsList = await getFriendsList(user.uid);
      const unseenStoriesTemp = {};
  
      const filterStories = (stories) =>
        stories.filter(
          (story) =>
            !hiddenStories.includes(story.uid) &&
            !hideStoriesFrom.includes(story.uid) &&
            !blockedUsers.includes(story.uid) &&
            !mutedUsers.includes(story.uid)
        );
  
      // Revisar caché
      const cachedStories = await AsyncStorage.getItem(`stories_${user.uid}`);
      if (cachedStories) {
        const { stories, timestamp } = JSON.parse(cachedStories);
  
        if (now - timestamp < 60 * 60 * 1000) {
          // Aplicar filtros a la caché antes de cargar
          const filteredCachedStories = filterStories(stories);
          setStories(filteredCachedStories);
          return;
        }
      }
  
      const loadedStories = [];
  
      // Cargar historias propias
      const userStoriesRef = collection(database, "users", user.uid, "stories");
      const userStoriesSnapshot = await getDocs(userStoriesRef);
      const userStories = userStoriesSnapshot.docs
        .map((doc) => ({
          ...doc.data(),
          createdAt: doc.data().createdAt.toDate(),
          expiresAt: doc.data().expiresAt.toDate(),
        }))
        .filter((story) => story.expiresAt > new Date());
  
      if (userStories.length > 0 || isUploading) {
        loadedStories.unshift({
          uid: user.uid,
          username: userData.firstName || t("storySlider.currentUser"),
          lastName: userData.lastName || "",
          profileImage: userData.photoUrls?.[0] || "https://via.placeholder.com/150",
          userStories,
        });
  
        unseenStoriesTemp[user.uid] = userStories.filter(
          (story) =>
            !story.viewers?.some(
              (viewer) => viewer.uid === auth.currentUser.uid,
            ),
        );
      }
  
      // Cargar historias de amigos
      for (let friend of friendsList) {
        if (
          hiddenStories.includes(friend.friendId) ||
          hideStoriesFrom.includes(friend.friendId) ||
          blockedUsers.includes(friend.friendId) ||
          mutedUsers.includes(friend.friendId)
        ) {
          continue;
        }
  
        const friendStoriesRef = collection(database, "users", friend.friendId, "stories");
        const friendStoriesSnapshot = await getDocs(friendStoriesRef);
        const friendStories = friendStoriesSnapshot.docs
          .map((doc) => ({
            ...doc.data(),
            createdAt: doc.data().createdAt.toDate(),
            expiresAt: doc.data().expiresAt.toDate(),
          }))
          .filter((story) => story.expiresAt > new Date());
  
        if (friendStories.length > 0) {
          const friendDocRef = doc(database, "users", friend.friendId);
          const friendDoc = await getDoc(friendDocRef);
  
          if (friendDoc.exists()) {
            const friendData = friendDoc.data();
  
            unseenStoriesTemp[friend.friendId] = friendStories.filter(
              (story) =>
                !story.viewers?.some(
                  (viewer) => viewer.uid === auth.currentUser.uid,
                ),
            );
  
            loadedStories.push({
              uid: friend.friendId,
              username: friendData.firstName || t("storySlider.friend"),
              lastName: friendData.lastName || "",
              profileImage: friendData.photoUrls?.[0] || "https://via.placeholder.com/150",
              userStories: friendStories,
            });
          }
        }
      }
  
      // Aplicar filtros a las historias cargadas
      const filteredStories = filterStories(loadedStories);
  
      // Ordenar por historias no vistas
      const sortedStories = filteredStories.sort((a, b) => {
        const aHasUnseen = unseenStoriesTemp[a.uid]?.length > 0;
        const bHasUnseen = unseenStoriesTemp[b.uid]?.length > 0;
  
        if (aHasUnseen && !bHasUnseen) return -1;
        if (!aHasUnseen && bHasUnseen) return 1;
        return 0;
      });
  
      setStories(sortedStories);
      setUnseenStories(unseenStoriesTemp);
  
      // Guardar historias filtradas en la caché
      await AsyncStorage.setItem(
        `stories_${user.uid}`,
        JSON.stringify({ stories: sortedStories, timestamp: now }),
      );
    } catch (error) {
      console.error(t("storySlider.loadStoriesError"), error);
    }
  };