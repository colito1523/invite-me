import React, { useState, useRef, useEffect  } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { Image } from 'expo-image';
import { Video } from "expo-av";
import { Ionicons } from "@expo/vector-icons";
import { styles } from "./styles";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import * as Haptics from 'expo-haptics';


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
  onReferencePress,
  onReply,
  t,
}) => {
  const [imageLoading, setImageLoading] = useState(true);
  const swipeableRef = useRef(null);

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

  if (item.deletedFor?.[user.uid]) return null;
  
  useEffect(() => {
    if (item.isViewOnce && item.mediaType === "image") {
      Image.prefetch(item.mediaUrl)
        .then(() => {
          // Imagen precargada con éxito
          // console.log("Imagen precargada:", item.mediaUrl);
        })
        .catch(() => {
          // Si falla, no pasa nada
        });
    }
  }, []);

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

  const handleReply = (item) => {
    onReply?.({
      text: item.text,
      mediaUrl: item.mediaUrl,
      isViewOnce: item.isViewOnce,
      id: item.id,
    });
    swipeableRef.current?.close();
  };

  if (item.isStoryResponse) {
    return (
      <>
        {!isSameDay && renderDate(currentMessageDate)}
        <GestureHandlerRootView>
          <Swipeable
            ref={swipeableRef}
            renderLeftActions={() => (
              <TouchableOpacity
                style={styles.replyAction}
                onPress={() => handleReply(item)}
              >
              </TouchableOpacity>
            )}
            gestureHandlerProps={{
              hitSlop: { left: 0 },
              activeOffsetX: [-30, 30], // solo reconoce gestos intencionales
              enabled: true,
              failOffsetX: [-10, 10], // más tolerancia para que el sistema recupere el gesto back
              waitFor: [] // explícitamente dejamos libre el gesto
            }}
            onSwipeableOpen={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              handleReply(item);
            }}
          >
            <TouchableOpacity onLongPress={() => handleLongPressMessage(item)}>
              <View
                style={[
                  styles.message,
                  isOwnMessage ? styles.sent : styles.received,
                  styles.storyResponseContainer,
                ]}
              >
                <Text
                  style={[
                    styles.storyResponseText,
                    { alignSelf: isOwnMessage ? "flex-end" : "flex-start" },
                  ]}>
                  {isOwnMessage ? t("chatUsers.youAnswered") : t("chatUsers.Answered")}
                </Text>
                <Image
                  source={{ uri: item.storyUrl }}
                  cachePolicy="disk" // o "memory-disk"
                  style={[
                    styles.storyResponseImage,
                    { alignSelf: isOwnMessage ? "flex-end" : "flex-start" },
                  ]}
                />
                <Text style={[styles.messageText,  { alignSelf: isOwnMessage ? "flex-end" : "flex-start" },]}>{item.text}</Text>
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
          </Swipeable>
        </GestureHandlerRootView>
      </>
    );
  }

  if (item.isNoteResponse) {
    return (
      <>
        {!isSameDay && renderDate(currentMessageDate)}
        <GestureHandlerRootView>
          <Swipeable
            ref={swipeableRef}
            renderLeftActions={() => (
              <TouchableOpacity
                style={styles.replyAction}
                onPress={() => handleReply(item)}
              >
                <Ionicons name="arrow-undo-outline" size={24} color="white" />
              </TouchableOpacity>
            )}
            gestureHandlerProps={{
              hitSlop: { left: 0 },
              activeOffsetX: [-30, 30], // solo reconoce gestos intencionales
              enabled: true,
              failOffsetX: [-10, 10], // más tolerancia para que el sistema recupere el gesto back
              waitFor: [] // explícitamente dejamos libre el gesto
            }}
            onSwipeableOpen={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              handleReply(item);
            }}
          >
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
                  cachePolicy="disk" // o "memory-disk"
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
          </Swipeable>
        </GestureHandlerRootView>
      </>
    );
  }

  if (item.isUploading) {
    return (
      <View style={[styles.message, styles.sent, styles.uploadingMessage]}>
        <ActivityIndicator size="large" color="black" />
      </View>
    );
  }

  return (
    <>
      {!isSameDay && renderDate(currentMessageDate)}
      <GestureHandlerRootView>
        <Swipeable
          ref={swipeableRef}
          renderLeftActions={() => (
            <TouchableOpacity
              style={styles.replyAction}
              onPress={() => handleReply(item)}
            >
            </TouchableOpacity>
          )}
          gestureHandlerProps={{
            hitSlop: { left: 0 },
            activeOffsetX: [-30, 30], // solo reconoce gestos intencionales
            enabled: true,
            failOffsetX: [-10, 10], // más tolerancia para que el sistema recupere el gesto back
            waitFor: [] // explícitamente dejamos libre el gesto
          }}
          onSwipeableOpen={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            handleReply(item);
          }}
        >
          <TouchableOpacity onLongPress={() => handleLongPressMessage(item)}>
            <View style={[styles.message, isOwnMessage ? styles.sent : styles.received]}>
              {item.replyTo || item.replyToMediaUrl ? (
                <TouchableOpacity onPress={() => onReferencePress(item.replyToId)}>
                  <View style={styles.replyBoxContainer}>
                    <View style={styles.replyIndicator} />
                    <View style={styles.contentContainer}>
                      <Text style={styles.replyingToText}>{t("chatUsers.ReplyTo")}</Text>
                      {item.replyToMediaUrl ? (
                        item.replyToIsViewOnce ? (
                          <View style={styles.imageContainer}>
                            <Ionicons name="eye-off-outline" size={20} color="#8E8E8E" />
                          </View>
                        ) : (
                          <Image
                          cachePolicy="disk" // o "memory-disk"
                            source={{ uri: item.replyToMediaUrl }}
                            style={styles.replyImagePreview}
                          />
                        )
                      ) : (
                        <Text style={styles.replyText}>{item.replyTo}</Text>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              ) : null}

              {item.text && <Text style={styles.messageText}>{item.text}</Text>}

              {item.mediaType === "image" &&
                (item.isViewOnce ? (
                  <TouchableOpacity
                  onPress={() => {
                    // Abrir el modal con la imagen
                    setSelectedImage({
                      uri: item.mediaUrl,
                      mediaType: "image",
                    });
                    setIsModalVisible(true);
                
                    // Lógica para marcar como vista sin frenar el modal
                    setTimeout(() => {
                      handleMediaPress(
                        database,
                        chatId,
                        user,
                        item.mediaUrl,
                        "image",
                        item.id,
                        item.isViewOnce,
                        () => {}, // no setea imagen de nuevo
                        () => {}, // no vuelve a abrir modal
                        t
                      );
                    }, 100); // da un pequeño respiro al render antes de correr lógica pesada
                  }}
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
                       cachePolicy="disk" // o "memory-disk"
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
  onLongPress={() => handleLongPressMessage(item)} // 👈 AGREGADO
  delayLongPress={300}
  style={styles.videoThumbnailContainer}
>
  <Video
    source={{ uri: item.mediaUrl }}
    style={styles.messageVideo}
    posterSource={{ uri: item.mediaUrl, cache: "force-cache" }}
    usePoster={true}
    resizeMode="cover"
  />
  <View style={styles.playIconOverlay}>
    <Ionicons name="play-circle" size={40} color="white" />
  </View>
</TouchableOpacity>

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
        </Swipeable>
      </GestureHandlerRootView>
    </>
  );
};

export default MessageItem;
