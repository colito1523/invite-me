import { Ionicons } from '@expo/vector-icons';
import { CameraCapturedPicture } from 'expo-camera';
import { useState } from "react";
import React from 'react';
import { TouchableOpacity, View, Image, StyleSheet, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from "react-i18next";
import { uploadStory } from '../Stories/storySlider/storySliderUtils'; // Importa la función de subida de historias

const PhotoPreviewSection = ({
    photo,
    handleRetakePhoto
}: {
    photo: CameraCapturedPicture;
    handleRetakePhoto: () => void;
}) => {
    const navigation = useNavigation();
    const { t } = useTranslation();
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [stories, setStories] = useState([]);
    const [unseenStories, setUnseenStories] = useState({});

    const handleUploadStory = async () => {
        setIsUploading(true);
        await uploadStory(
            photo.uri,
            () => {}, // Puedes agregar traducción si es necesario
            setIsUploading,
            setUploadProgress,
            setStories,
            setUnseenStories
        );
        setIsUploading(false);
        navigation.goBack();
    };

    return (
        <View style={styles.container}>
            <Image
                style={styles.previewContainer}
                source={{ uri: 'data:image/jpg;base64,' + photo.base64 }}
            />

            {/* Botón para cerrar (volver atrás) */}
            <TouchableOpacity style={styles.closeButton} onPress={handleRetakePhoto}>
                <Ionicons name="close" size={30} color="white" />
            </TouchableOpacity>

            <TouchableOpacity 
    style={styles.uploadButton} 
    onPress={handleUploadStory} 
    disabled={isUploading}
>
    {isUploading ? (
        <Text style={styles.uploadButtonText}>{Math.round(uploadProgress)}%</Text>
    ) : (
        <>
            <Text style={styles.uploadButtonText}> {t("storySlider.addStory")}</Text>
            <Ionicons name="arrow-forward" size={24} color="rgba(0, 0, 0, 0.6)" />
        </>
    )}
</TouchableOpacity>

        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    previewContainer: {
        ...StyleSheet.absoluteFillObject,
        width: '100%',
        height: '100%',
    },
    closeButton: {
        position: 'absolute',
        top: 50,
        left: 20,
        zIndex: 1,
    },
    uploadButton: {
        position: "absolute",
        bottom: 40,
        right: 10,
        backgroundColor: "white",
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 25,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
    },
    uploadButtonText: {
        color: "rgba(0, 0, 0, 0.6)",
        fontSize: 16,
        fontWeight: "bold",
        marginRight: 15,
    },
    
});

export default PhotoPreviewSection;
