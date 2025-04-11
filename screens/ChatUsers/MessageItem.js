import React, { useState, useRef, useEffect } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { Image } from "expo-image";
import { Video } from "expo-av";
import { Ionicons } from "@expo/vector-icons";
import { styles } from "./styles";
import {
  GestureHandlerRootView,
  TapGestureHandler,
  State,
} from "react-native-gesture-handler";
import Swipeable from "react-native-gesture-handler/Swipeable";
import * as Haptics from "expo-haptics";
import { handleDoubleTap as handleDoubleTapUtil } from "./utils";

// Si tienes un AudioPlayer definido/importado en otro archivo, asegúrate de importarlo.
// Por ejemplo: import AudioPlayer from "./AudioPlayer";
// (Si no lo tienes, créalo o quita la parte de audio.)

/* ----------------------------------
   1) SUBCOMPONENTE: Mensaje de Story
   ---------------------------------- */
function StoryMessage({
  item,
  isOwnMessage,
  isSameDay,
  currentMessageDate,
  renderDate,
  swipeableRef,
  handleReply,
  handleLongPressMessage,
  t,
}) {
  return (
    <>
      {/* Render de fecha si cambió de día */}
      {!isSameDay && renderDate(currentMessageDate)}

      <GestureHandlerRootView>
        <Swipeable
          ref={swipeableRef}
          renderLeftActions={() => (
            <TouchableOpacity
              style={styles.replyAction}
              onPress={() => handleReply(item)}
            />
          )}
          gestureHandlerProps={{
            hitSlop: { left: 0 },
            activeOffsetX: [-30, 30],
            enabled: true,
            failOffsetX: [-10, 10],
            waitFor: [],
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
                ]}
              >
                {isOwnMessage
                  ? t("chatUsers.youAnswered")
                  : t("chatUsers.Answered")}
              </Text>

              <Image
                source={{ uri: item.storyUrl }}
                cachePolicy="disk"
                style={[
                  styles.storyResponseImage,
                  { alignSelf: isOwnMessage ? "flex-end" : "flex-start" },
                ]}
              />

              <Text
                style={[
                  styles.messageText,
                  { alignSelf: isOwnMessage ? "flex-end" : "flex-start" },
                ]}
              >
                {item.text}
              </Text>

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

/* ----------------------------------
   2) SUBCOMPONENTE: Mensaje de Note
   ---------------------------------- */
function NoteMessage({
  item,
  isOwnMessage,
  isSameDay,
  currentMessageDate,
  renderDate,
  swipeableRef,
  handleReply,
  handleLongPressMessage,
  t,
}) {
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
            activeOffsetX: [-30, 30],
            enabled: true,
            failOffsetX: [-10, 10],
            waitFor: [],
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
                cachePolicy="disk"
                style={[
                  styles.arrowImage,
                  isOwnMessage
                    ? styles.arrowImageSent
                    : styles.arrowImageReceived,
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

/* -------------------------------------------
   3) SUBCOMPONENTE: Mensaje mientras sube (isUploading)
   ------------------------------------------- */
function UploadingMessage() {
  return (
    <View style={[styles.message, styles.sent, styles.uploadingMessage]}>
      <ActivityIndicator size="large" color="black" />
    </View>
  );
}

/* -------------------------------------------
   4) SUBCOMPONENTE: Mensaje Regular (default)
   ------------------------------------------- */
function RegularMessage({
  item,
  isOwnMessage,
  isSameDay,
  currentMessageDate,
  renderDate,
  swipeableRef,
  handleReply,
  handleLongPressMessage,
  t,
  // Extras que se usan en el "mensaje regular"
  database,
  chatId,
  user,
  setSelectedImage,
  setIsModalVisible,
  handleMediaPress,
  imageLoading,
  setImageLoading,
  onReferencePress,
}) {
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
            />
          )}
          gestureHandlerProps={{
            hitSlop: { left: 0 },
            activeOffsetX: [-30, 30],
            enabled: true,
            failOffsetX: [-10, 10],
            waitFor: [],
          }}
          onSwipeableOpen={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            handleReply(item);
          }}
        >
          <TapGestureHandler
            numberOfTaps={2}
            onHandlerStateChange={({ nativeEvent }) => {
              if (nativeEvent.state === State.ACTIVE) {
                handleDoubleTapUtil({ msg: item, database, chatId, user });
              }
            }}
          >
            <TouchableOpacity onLongPress={() => handleLongPressMessage(item)}>
              <View
                style={[
                  styles.message,
                  isOwnMessage ? styles.sent : styles.received,
                ]}
              >
                {item.likedBy?.length > 0 && (
  <View
    style={{
      alignSelf: isOwnMessage ? "flex-start" : "flex-end",
      marginBottom: 4,
      paddingHorizontal: 6,
      flexDirection: "row",
      alignItems: "center",
    }}
  >
    <Ionicons name="heart" size={16} color="red" />
  </View>
)}
                {/* Respuesta (Reply) a un mensaje anterior */}
                {(item.replyTo || item.replyToMediaUrl) && (
                  <TouchableOpacity
                    onPress={() => onReferencePress(item.replyToId)}
                  >
                    <View style={styles.replyBoxContainer}>
                      <View style={styles.replyIndicator} />
                      <View style={styles.contentContainer}>
                        <Text style={styles.replyingToText}>
                          {t("chatUsers.ReplyTo")}
                        </Text>
                        {item.replyToMediaUrl ? (
                          item.replyToIsViewOnce ? (
                            <View style={styles.imageContainer}>
                              <Ionicons
                                name="eye-off-outline"
                                size={20}
                                color="#8E8E8E"
                              />
                            </View>
                          ) : (
                            <Image
                              cachePolicy="disk"
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
                )}

                {/* Texto normal */}
                {item.text && (
                  <Text style={styles.messageText}>{item.text}</Text>
                )}

                {/* Imagen */}
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

                        // Lógica para marcar como vista
                        setTimeout(() => {
                          handleMediaPress(
                            database,
                            chatId,
                            user,
                            item.mediaUrl,
                            "image",
                            item.id,
                            item.isViewOnce,
                            () => {},
                            () => {},
                            t
                          );
                        }, 100);
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
                      <View
                        style={{
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                      >
                        {imageLoading && (
                          <ActivityIndicator
                            size="small"
                            color="gray"
                            style={{ position: "absolute", zIndex: 1 }}
                          />
                        )}
                        <Image
                          cachePolicy="disk"
                          source={{ uri: item.mediaUrl }}
                          style={styles.messageImage}
                          onLoadStart={() => setImageLoading(true)}
                          onLoadEnd={() => setImageLoading(false)}
                        />
                      </View>
                    </TouchableOpacity>
                  ))}

                {/* Video */}
                {item.mediaType === "video" && (
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedImage({
                        uri: item.mediaUrl,
                        mediaType: item.mediaType,
                      });
                      setIsModalVisible(true);
                    }}
                    onLongPress={() => handleLongPressMessage(item)}
                    delayLongPress={300}
                    style={styles.videoThumbnailContainer}
                  >
                    <Video
                      source={{ uri: item.mediaUrl }}
                      style={styles.messageVideo}
                      posterSource={{
                        uri: item.mediaUrl,
                        cache: "force-cache",
                      }}
                      usePoster={true}
                      resizeMode="cover"
                    />
                    <View style={styles.playIconOverlay}>
                      <Ionicons name="play-circle" size={40} color="white" />
                    </View>
                  </TouchableOpacity>
                )}

                {/* Audio (si tienes un componente AudioPlayer) */}
                {item.mediaType === "audio" && (
                  // Asegúrate de tener un AudioPlayer o cambiarlo
                  <AudioPlayer uri={item.mediaUrl} />
                )}

                {/* Footer con hora y check de leído */}
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
          </TapGestureHandler>
        </Swipeable>
      </GestureHandlerRootView>
    </>
  );
}

/* -------------------------------------------
   5) COMPONENTE PRINCIPAL: MessageItem
   ------------------------------------------- */
export default function MessageItem({
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
}) {
  // HOOKS:
  const [imageLoading, setImageLoading] = useState(true);
  const swipeableRef = useRef(null);

  // FECHAS / MENSAJES ANTERIORES:
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

  // Prefetch de imágenes (si es "ver una vez")
  useEffect(() => {
    if (item.isViewOnce && item.mediaType === "image") {
      Image.prefetch(item.mediaUrl).catch(() => {
        // Falla silenciosa
      });
    }
  }, [item.isViewOnce, item.mediaType, item.mediaUrl]);

  // RENDERIZAR FECHA
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

  // REPLY: Al deslizar
  const handleReply = (msg) => {
    onReply?.({
      text: msg.text,
      mediaUrl: msg.mediaUrl,
      isViewOnce: msg.isViewOnce,
      id: msg.id,
    });
    swipeableRef.current?.close();
  };

  /* ÚNICO return con condicional:
     - Si está borrado: null
     - Si es story: <StoryMessage />
     - Si es note: <NoteMessage />
     - Si se está subiendo: <UploadingMessage />
     - Si no, <RegularMessage />
  */
  return (
    <>
      {item.deletedFor?.[user.uid] ? null : item.isStoryResponse ? (
        <StoryMessage
          item={item}
          isOwnMessage={isOwnMessage}
          isSameDay={isSameDay}
          currentMessageDate={currentMessageDate}
          renderDate={renderDate}
          swipeableRef={swipeableRef}
          handleReply={handleReply}
          handleLongPressMessage={handleLongPressMessage}
          t={t}
        />
      ) : item.isNoteResponse ? (
        <NoteMessage
          item={item}
          isOwnMessage={isOwnMessage}
          isSameDay={isSameDay}
          currentMessageDate={currentMessageDate}
          renderDate={renderDate}
          swipeableRef={swipeableRef}
          handleReply={handleReply}
          handleLongPressMessage={handleLongPressMessage}
          t={t}
        />
      ) : item.isUploading ? (
        <UploadingMessage />
      ) : (
        <RegularMessage
          item={item}
          isOwnMessage={isOwnMessage}
          isSameDay={isSameDay}
          currentMessageDate={currentMessageDate}
          renderDate={renderDate}
          swipeableRef={swipeableRef}
          handleReply={handleReply}
          handleLongPressMessage={handleLongPressMessage}
          t={t}
          // Props extra que necesita el mensaje regular:
          database={database}
          chatId={chatId}
          user={user}
          setSelectedImage={setSelectedImage}
          setIsModalVisible={setIsModalVisible}
          handleMediaPress={handleMediaPress}
          imageLoading={imageLoading}
          setImageLoading={setImageLoading}
          onReferencePress={onReferencePress}
        />
      )}
    </>
  );
}
