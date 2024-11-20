import { collection, getDocs, doc, getDoc } from "firebase/firestore";

export const fetchStoryResponses = async (user, recipientUser, database, setMessages) => {
  const responses = [];
  if (recipientUser?.id) {
    const recipientStoriesRef = collection(database, "users", recipientUser.id, "stories");
    const recipientStoriesSnapshot = await getDocs(recipientStoriesRef);
    for (const storyDoc of recipientStoriesSnapshot.docs) {
      const responsesRef = collection(recipientStoriesRef, storyDoc.id, "responses");
      const responsesSnapshot = await getDocs(responsesRef);
      responses.push(...responsesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    }
  }
  setMessages((prevMessages) => [...prevMessages, ...responses]);
};
