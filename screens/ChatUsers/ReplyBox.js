import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { Image } from 'expo-image';
import { Ionicons } from "@expo/vector-icons"; // Asegúrate de tener esta importación
import { useTranslation } from "react-i18next";

function ReplyBox({ text, mediaUrl, isViewOnce, onClose }) {
    const [imageLoading, setImageLoading] = useState(true);
    const [showFallbackIcon, setShowFallbackIcon] = useState(false);
    const { t } = useTranslation();

    useEffect(() => {
        if (mediaUrl) {
          setImageLoading(true);
          setShowFallbackIcon(false);
        }
      }, [mediaUrl]);

    if (!text && !mediaUrl) return null;

    return (
        <View style={styles.replyContainer}>
            <View style={styles.replyIndicator} />
            <View style={styles.contentContainer}>
                <Text style={styles.replyingToText}>{t("chatUsers.ReplyTo")}</Text>
                {mediaUrl && (
  <View style={styles.imageContainer}>
    {imageLoading && !isViewOnce && (
      <ActivityIndicator style={styles.loader} size="small" color="#8E8E8E" />
    )}

    {isViewOnce ? (
      <Ionicons name="eye-off-outline" size={20} color="#8E8E8E" />
    ) : (
      <Image
        source={{ uri: mediaUrl }}
        style={styles.replyImagePreview}
        cachePolicy="memory-disk"
        contentFit="cover"
        onLoadStart={() => setImageLoading(true)}
        onLoadEnd={() => setImageLoading(false)}
        onError={() => {
          setImageLoading(false);
          setShowFallbackIcon(true);
        }}
        transition={300}
      />
    )}

    {/* Fallback por si falla la carga de imagen (probablemente sea video) */}
    {!imageLoading && showFallbackIcon && !isViewOnce && (
      <Ionicons
        name="videocam-outline"
        size={24}
        color="#8E8E8E"
        style={{ position: 'absolute' }}
      />
    )}
  </View>
)}
                {text && (
                    <Text style={styles.replyText} numberOfLines={1} ellipsizeMode="tail">
                        {text}
                    </Text>
                )}
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButtonContainer}>
                <Text style={styles.closeButton}>×</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    replyContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#F8F8F8",
        borderRadius: 12,
        marginBottom: 10,
        paddingVertical: 10,
        paddingHorizontal: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
        borderWidth: 0.5,
        borderColor: "#EFEFEF",
    },
    replyIndicator: {
        width: 2.5,
        height: "70%",
        backgroundColor: "#ebddd5", // Instagram blue
        borderRadius: 4,
        marginRight: 10,
    },
    contentContainer: {
        flex: 1,
        justifyContent: "center",
    },
    replyingToText: {
        fontSize: 11,
        color: "#8E8E8E",
        marginBottom: 2,
    },
    replyText: {
        color: "#262626",
        fontSize: 13,
        fontWeight: "500",
    },
    imageContainer: {
        position: 'relative',
        width: 50,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    replyImagePreview: {
        width: '100%',
        height: '100%',
        borderRadius: 5,
    },
    loader: {
        position: 'absolute',
        zIndex: 1,
    },
    closeButtonContainer: {
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        marginLeft: 8,
    },
    closeButton: {
        color: "#8E8E8E",
        fontSize: 18,
        fontWeight: "bold",
        lineHeight: 22,
    },
});

export default ReplyBox;
