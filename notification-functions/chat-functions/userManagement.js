import { Alert } from "react-native";

export const checkBlockedUsers = (blockedUsers, recipientUser, navigation) => {
  if (blockedUsers.includes(recipientUser.id)) {
    Alert.alert("Error", "No puedes interactuar con este usuario.");
    navigation.goBack();
    return true;
  }
  return false;
};
