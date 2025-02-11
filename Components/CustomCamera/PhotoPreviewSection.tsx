import { Ionicons } from '@expo/vector-icons';
import { CameraCapturedPicture } from 'expo-camera';
import { useState } from "react";
import React from "react";
import { TouchableOpacity, View, Image, StyleSheet, Text, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from "react-i18next";
import { uploadStory } from '../Stories/storySlider/storySliderUtils'; 

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

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
            () => {}, 
            setIsUploading,
            setUploadProgress,
            setStories,
            setUnseenStories
        );
        setIsUploading(false);
        navigation.goBack();
    };

    // Determinar la rotación correcta según la relación de aspecto
    let rotation = 0;
    if (photo.width > photo.height) {
        // Foto en modo apaisado
        rotation = photo.exif?.Orientation === 3 ? 270 : 90;
    } else {
        // Foto en modo vertical
        rotation = 0;
    }

    return (
        <View style={styles.container}>
            <Image
                style={[
                    styles.previewContainer,
                    {
                        width: photo.width > photo.height ? screenHeight : screenWidth,
                        height: photo.width > photo.height ? screenWidth : screenHeight,
                        alignSelf: 'center',
                        position: 'absolute',
                        transform: [{ rotate: `${rotation}deg` }]
                    }
                ]}
                source={{ uri: photo.uri }}
                resizeMode="cover"
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
                        <Text style={styles.uploadButtonText}>{t("storySlider.addStory")}</Text>
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
        backgroundColor: 'black', 
        alignItems: 'center',
        justifyContent: 'center',
    },
    previewContainer: {
        position: 'absolute',
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
