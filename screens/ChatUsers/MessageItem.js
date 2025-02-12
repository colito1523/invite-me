import React, { useState } from "react";
import { View, Text, TouchableOpacity, Image, ActivityIndicator } from "react-native";
import { Video } from "expo-av";
import { Ionicons } from "@expo/vector-icons";
import AudioPlayer from "../AudioPlayer";
import { styles } from "./styles";

const MessageItem = ({
  item,
  index,
  messages,
  user,
  database,
  chatId,
  setSelectedImage,
  setIsModalVisible,
  handleLongPressMessage,
  handleMediaPress,
  recipient,
  t,
}) => {
  // Estado para controlar la carga de la imagen (se utiliza solo si el mensaje es de imagen)
  const [imageLoading, setImageLoading] = useState(true);

  // Cálculo de la fecha y comparación con el mensaje anterior
  const previousMessage = messages[index - 1];
  const currentMessageDate = item.createdAt
    ? new Date(item.createdAt.seconds * 1000)
    : new Date();
  const previousMessageDate =
    previousMessage && previousMessage.createdAt
      ? new Date(previousMessage.createdAt.seconds * 1000)
      : null;
  const isSameDay =
    previousMessageDate &&
    currentMessageDate.toDateString() === previousMessageDate.toDateString();
  const isOwnMessage = item.senderId === user.uid;

  // Si el mensaje está marcado como eliminado para el usuario actual, no se renderiza
  if (item.deletedFor?.[user.uid]) return null;

  // Función para renderizar la fecha cuando el día cambia
  const renderDate = (date) => (
    <View style={styles.dateContainer}>
      <Text style={styles.dateText}>
        {date.toLocaleDateString([], {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </Text>
    </View>
  );

  // Caso: respuesta a historia
  if (item.isStoryResponse) {
    return (
      <>
        {!isSameDay && renderDate(currentMessageDate)}
        <TouchableOpacity onLongPress={() => handleLongPressMessage(item)}>
          <View
            style={[
              styles.message,
              isOwnMessage ? styles.sent : styles.received,
              styles.storyResponseContainer,
            ]}
          >
            <Text style={styles.storyResponseText}>
              {isOwnMessage ? t("chatUsers.youAnswered") : t("chatUsers.Answered")}
            </Text>
            <Image
              source={{ uri: item.storyUrl }}
              style={styles.storyResponseImage}
            />
            <Text style={styles.messageText}>{item.text}</Text>
            {isOwnMessage && item.seen && (
              <View style={styles.messageFooter}>
                <Text style={styles.timeText}>
                  {currentMessageDate.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
                <Ionicons
                  name="checkmark-done-sharp"
                  size={16}
                  color="black"
                  style={styles.seenIcon}
                />
              </View>
            )}
          </View>
        </TouchableOpacity>
      </>
    );
  }

  // Caso: respuesta a nota
  if (item.isNoteResponse) {
    return (
      <>
        {!isSameDay && renderDate(currentMessageDate)}
        <TouchableOpacity onLongPress={() => handleLongPressMessage(item)}>
          <View
            style={[
              styles.message,
              isOwnMessage ? styles.sent : styles.received,
              styles.noteResponseContainer,
            ]}
          >
            <Text style={styles.noteResponseText}>
              {isOwnMessage
                ? t("chatUsers.youAnsweredNote")
                : t("chatUsers.AnsweredNote")}
            </Text>
            <Image
              source={require("../../assets/flecha-curva.png")}
              style={[
                styles.arrowImage,
                isOwnMessage ? styles.arrowImageSent : styles.arrowImageReceived,
              ]}
            />
            <View>
              <Text style={styles.originalNoteText}>
                {item.noteText || "Nota no disponible"}
              </Text>
            </View>
            <Text style={styles.messageTextNotas}>{item.text}</Text>
            <View style={styles.messageFooter}>
              <Text style={styles.timeText}>
                {currentMessageDate.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
              {isOwnMessage && item.seen && (
                <Ionicons
                  name="checkmark-done-sharp"
                  size={16}
                  color="black"
                  style={styles.seenIcon}
                />
              )}
            </View>
          </View>
        </TouchableOpacity>
      </>
    );
  }

  // Caso: mensaje en proceso de subida
  if (item.isUploading) {
    return (
      <View style={[styles.message, styles.sent, styles.uploadingMessage]}>
        <ActivityIndicator size="large" color="black" />
      </View>
    );
  }

  // Renderizado por defecto del mensaje
  return (
    <>
      {!isSameDay && renderDate(currentMessageDate)}

      <TouchableOpacity onLongPress={() => handleLongPressMessage(item)}>
        <View style={[styles.message, isOwnMessage ? styles.sent : styles.received]}>
          {item.text && <Text style={styles.messageText}>{item.text}</Text>}

          {item.mediaType === "image" &&
            (item.isViewOnce ? (
              // Caso: imagen de tipo "ver una vez" (se muestra un placeholder en vez de la imagen)
              <TouchableOpacity
                onPress={() =>
                  handleMediaPress(
                    database,
                    chatId,
                    user,
                    item.mediaUrl,
                    "image",
                    item.id,
                    item.isViewOnce,
                    setSelectedImage,
                    setIsModalVisible,
                    t
                  )
                }
                style={[
                  styles.viewOnceImagePlaceholder,
                  item.viewedBy?.includes(user.uid)
                    ? styles.imageViewed
                    : styles.imageNotViewed,
                ]}
                disabled={item.viewedBy?.includes(user.uid)}
              >
                <Text style={styles.imageStatusText}>
                  {item.viewedBy?.includes(user.uid)
                    ? t("chatUsers.alreadyViewed")
                    : t("chatUsers.view")}
                </Text>
              </TouchableOpacity>
            ) : (
              // Caso: imagen normal con ActivityIndicator mientras carga
              <TouchableOpacity
                onPress={() =>
                  handleMediaPress(
                    database,
                    chatId,
                    user,
                    item.mediaUrl,
                    "image",
                    item.id,
                    false,
                    setSelectedImage,
                    setIsModalVisible,
                    t
                  )
                }
                style={styles.normalImageContainer}
                onLongPress={() => handleLongPressMessage(item)}
              >
                <View style={{ justifyContent: "center", alignItems: "center" }}>
                  {imageLoading && (
                    <ActivityIndicator
                      size="small"
                      color="gray"
                      style={{ position: "absolute", zIndex: 1 }}
                    />
                  )}
                  <Image
                    source={{ uri: item.mediaUrl }}
                    style={styles.messageImage}
                    onLoadStart={() => setImageLoading(true)}
                    onLoadEnd={() => setImageLoading(false)}
                  />
                </View>
              </TouchableOpacity>
            ))}

          {item.mediaType === "video" && (
            <>
              <TouchableOpacity
                onPress={() => {
                  setSelectedImage({
                    uri: item.mediaUrl,
                    mediaType: item.mediaType,
                  });
                  setIsModalVisible(true);
                }}
                style={styles.videoThumbnailContainer}
              >
                <Video
                  source={{ uri: item.mediaUrl }}
                  style={styles.messageVideo}
                  posterSource={{ uri: item.mediaUrl }}
                  usePoster={true}
                  resizeMode="cover"
                />
                <View style={styles.playIconOverlay}>
                  <Ionicons name="play-circle" size={40} color="white" />
                </View>
              </TouchableOpacity>
              {isOwnMessage && item.viewedBy?.includes(recipient.uid) && (
                <Ionicons
                  name="checkmark-done-sharp"
                  size={16}
                  color="black"
                  style={styles.seenIcon}
                />
              )}
            </>
          )}

          {item.mediaType === "audio" && <AudioPlayer uri={item.mediaUrl} />}

          <View style={styles.messageFooter}>
            <Text style={styles.timeText}>
              {currentMessageDate.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
            {isOwnMessage && item.seen && (
              <Ionicons
                name="checkmark-done-sharp"
                size={16}
                color="black"
                style={styles.seenIcon}
              />
            )}
          </View>
        </View>
      </TouchableOpacity>
    </>
  );
};

export default MessageItem;
