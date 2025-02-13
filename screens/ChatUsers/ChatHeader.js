import React, { useState, useEffect } from "react";
import { View, TouchableOpacity, Text, Alert, Modal, TouchableWithoutFeedback } from "react-native";
import { Menu } from "react-native-paper";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { Image } from "expo-image"; // Usando expo-image para mejor optimización
import { styles } from "./styles";
import { doc, getDoc } from "firebase/firestore";
import { auth, database } from "../../config/firebase";
import { useTranslation } from "react-i18next";

const ChatHeader = ({ recipient, chatId, handleDeleteChat, handleReport, handleMuteChat }) => {
    const user = auth.currentUser;
    const navigation = useNavigation();
    const [menuVisible, setMenuVisible] = useState(false);
    const [isMuteModalVisible, setIsMuteModalVisible] = useState(false);
    const { t } = useTranslation();

    // Estado para manejar la imagen de perfil
    const [imageUri, setImageUri] = useState(
        recipient?.lowQualityPhotoUrl || recipient?.photoUrls?.[0] || "https://via.placeholder.com/150"
    );

    // Intentar cargar la imagen en baja calidad primero, luego cambiar a la de alta si existe
    useEffect(() => {
        if (recipient?.photoUrls?.[0]) {
            setTimeout(() => {
                setImageUri(recipient.photoUrls[0]); // Cargar imagen en alta calidad después
            }, 500); // Pequeño retraso para mejorar UX
        }
    }, [recipient]);

    const handleUserPress = async () => {
        try {
            if (!chatId) {
                Alert.alert(t("chatUsers.error"), t("chatUsers.chatNotFound"));
                return;
            }

            const chatRef = doc(database, "chats", chatId);
            const chatSnapshot = await getDoc(chatRef);

            if (!chatSnapshot.exists()) {
                console.error("El documento del chat no existe.");
                Alert.alert(t("chatUsers.error"), t("chatUsers.chatNotFound"));
                return;
            }

            const chatData = chatSnapshot.data();

            // Obtener el ID del destinatario desde los participantes
            const otherParticipantId = chatData.participants.find(
                (participantId) => participantId !== user.uid
            );

            if (!otherParticipantId) {
                console.error("No se encontró un ID válido para el destinatario.");
                Alert.alert(t("chatUsers.error"), t("chatUsers.recipientNotFound"));
                return;
            }

            navigation.navigate("UserProfile", {
                selectedUser: { id: otherParticipantId, ...recipient },
            });
        } catch (error) {
            console.error("Error navegando al perfil del usuario:", error);
            Alert.alert(t("chatUsers.error"), t("chatUsers.navigateToProfileError"));
        }
    };

    return (
        <View style={styles.header}>
            {/* Botón de regreso */}
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                <Feather name="arrow-left" size={24} color="white" />
            </TouchableOpacity>

            {/* Información del usuario */}
            <TouchableOpacity onPress={handleUserPress} style={styles.userInfo}>
                <Image
                    source={{
                        uri: imageUri,
                        cache: "force-cache",
                    }}
                    style={{ width: 40, height: 40, borderRadius: 25 }}
                    contentFit="cover"
                    placeholder={{ blurhash: "LEHV6nWB2yk8pyo0adR*.7kCMdnj" }} // Placeholder borroso
                />
                <Text style={styles.username}>{recipient.firstName + " " + recipient.lastName}</Text>
            </TouchableOpacity>

            {/* Menú de opciones */}
            <Menu
                visible={menuVisible}
                onDismiss={() => setMenuVisible(false)}
                anchor={
                    <TouchableOpacity onPress={() => setMenuVisible(true)}>
                        <Feather name="more-vertical" size={24} color="white" />
                    </TouchableOpacity>
                }
                contentStyle={styles.menuContainer}
            >
                <Menu.Item
                    onPress={() => {
                        setMenuVisible(false);
                        Alert.alert(
                            t("chatUsers.deleteChat"),
                            t("chatUsers.deleteChatConfirmation"),
                            [
                                { text: t("chatUsers.cancel"), style: "cancel" },
                                { text: t("chatUsers.delete"), onPress: handleDeleteChat },
                            ]
                        );
                    }}
                    title={t("chatUsers.deleteChat")}
                    titleStyle={styles.menuItemText}
                    style={styles.menuItemContainer}
                />

                <Menu.Item
                    onPress={() => {
                        setMenuVisible(false);
                        setIsMuteModalVisible(true);
                    }}
                    title={t("chatUsers.mute")}
                    titleStyle={styles.menuItemText}
                />

                <Menu.Item
                    onPress={handleReport}
                    title={t("chatUsers.report")}
                    titleStyle={styles.menuItemText}
                    style={styles.menuItemContainer}
                />
            </Menu>

            {/* Modal para seleccionar la duración del silencio */}
            <Modal
                transparent={true}
                visible={isMuteModalVisible}
                animationType="fade"
                onRequestClose={() => setIsMuteModalVisible(false)}
            >
                <TouchableWithoutFeedback onPress={() => setIsMuteModalVisible(false)}>
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>{t("chatUsers.selectMuteDuration")}</Text>
                            <TouchableOpacity
                                style={styles.modalOption}
                                onPress={() => {
                                    handleMuteChat(1);
                                    setIsMuteModalVisible(false);
                                }}
                            >
                                <Text style={styles.modalText}>{t("chatUsers.oneHour")}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.modalOption}
                                onPress={() => {
                                    handleMuteChat(4);
                                    setIsMuteModalVisible(false);
                                }}
                            >
                                <Text style={styles.modalText}>{t("chatUsers.fourHours")}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.modalOption}
                                onPress={() => {
                                    handleMuteChat(8);
                                    setIsMuteModalVisible(false);
                                }}
                            >
                                <Text style={styles.modalText}>{t("chatUsers.eightHours")}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.modalOption}
                                onPress={() => {
                                    handleMuteChat(24);
                                    setIsMuteModalVisible(false);
                                }}
                            >
                                <Text style={styles.modalText}>{t("chatUsers.twentyFourHours")}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </View>
    );
};

export default ChatHeader;
