// ChatInput.js
import React from "react";
import { View, TextInput, TouchableOpacity } from "react-native";
import { Ionicons, FontAwesome } from "@expo/vector-icons";
import { pickMedia } from "./utils";
import ReplyBox from "./ReplyBox";
import { styles } from "./styles";
import { useNavigation } from "@react-navigation/native";

export default function ChatInput({
  message,
  setMessage,
  handleSend,
  t,
  replyMessage,
  setReplyMessage,
}) {
  const navigation = useNavigation();

  const handleCameraForChat = () => {
    navigation.navigate("Camera",  {
        mode: "chat",
      onCapture: (photo) => {
        // Aquí envías la imagen en el chat
        // Por ejemplo, usando la función handleSend del chat:
        handleSend("image", photo.uri, false);
      },
    });
  };

  return (
    <View style={{ paddingHorizontal: 8 }}>
      {/* Caja de respuesta */}
      <ReplyBox
        text={replyMessage?.text}
        mediaUrl={replyMessage?.mediaUrl}
        isViewOnce={replyMessage?.isViewOnce}
        onClose={() => setReplyMessage(null)}
      />

      {/* Contenedor del input, cámara y galería */}
      <View style={styles.containerIg}>
        <TouchableOpacity
          onPress={handleCameraForChat}
          style={styles.iconButtonCamera}
        >
          <Ionicons name="camera-outline" size={20} color="white" />
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          value={message}
          onChangeText={setMessage}
          placeholder={t("chatUsers.writeMessage")}
          placeholderTextColor="#999"
          multiline
          numberOfLines={1}
          textAlignVertical="center"
        />

        {message.trim() ? (
          <TouchableOpacity
            onPress={() => handleSend("text")}
            style={styles.sendButton}
          >
            <FontAwesome name="send" size={20} color="white" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={() => pickMedia(handleSend, t)}
            style={styles.iconButtonGaleria}
          >
            <Ionicons name="image-outline" size={30} color="#000" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
