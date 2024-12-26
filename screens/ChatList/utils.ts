
import { Timestamp } from "firebase/firestore";

export const formatTime = (timestamp: Timestamp): string => {
  if (!(timestamp instanceof Timestamp)) {
    console.error("Invalid timestamp:", timestamp);
    return "";
  }

  const now = new Date();
  const messageDate = timestamp.toDate();
  const diff = now.getTime() - messageDate.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const weeks = Math.floor(days / 7);

  if (days === 0) {
    return messageDate.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } else if (days === 1) {
    return "Ayer";
  } else if (days < 7) {
    return `${days} días`;
  } else if (weeks === 1) {
    return "1 sem";
  } else {
    return `${weeks} sem`;
  }
};

export const truncateMessage = (message: string, maxLength: number = 10): string => {
  if (message.length <= maxLength) return message;
  return message.substring(0, maxLength) + "...";
};

export const areChatsDifferent = (oldChats: any[], newChats: any[]): boolean => {
  return JSON.stringify(oldChats) !== JSON.stringify(newChats);
};

export const checkNightMode = (): boolean => {
  const currentHour = new Date().getHours();
  return currentHour >= 19 || currentHour < 6;
};
