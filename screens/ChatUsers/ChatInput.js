import React from "react";
import { View, TextInput, TouchableOpacity } from "react-native";
import { Ionicons, FontAwesome } from "@expo/vector-icons";
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
    navigation.navigate("Camera", {
      mode: "chat",
      onCapture: (photo) => {
        // Aquí envías la imagen en el chat, pasando el valor de isViewOnce que definió el usuario en PhotoPreviewSection
        handleSend(photo.type, photo.uri, photo.isViewOnce);
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

      {/* Contenedor del input, cámara y enviar mensaje */}
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
        ) : null}
      </View>
    </View>
  );
}
