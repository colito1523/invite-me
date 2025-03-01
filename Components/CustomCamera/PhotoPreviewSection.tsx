import { Ionicons } from '@expo/vector-icons';
import { CameraCapturedPicture } from 'expo-camera';
import { useState, useEffect } from "react";
import { ActivityIndicator } from "react-native";
import React from "react";
import { TouchableOpacity, View, Image, StyleSheet, Text, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from "react-i18next";
import { uploadStory } from '../Stories/storySlider/storySliderUtils'; 
import * as ImageManipulator from 'expo-image-manipulator';
import * as MediaLibrary from 'expo-media-library';

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
    const [hasMediaLibraryPermission, setHasMediaLibraryPermission] = useState(null);
    const [downloadStatus, setDownloadStatus] = useState<'default' | 'loading' | 'success'>('default');

    useEffect(() => {
        (async () => {
            const { status } = await MediaLibrary.requestPermissionsAsync();
            setHasMediaLibraryPermission(status === 'granted');
        })();
    }, []);

    const handleUploadStory = async () => {
        setIsUploading(true);
        try {
            const manipulatedResult = await ImageManipulator.manipulateAsync(
                photo.uri,
                [{ resize: { width: 1080 } }],
                { compress: 0.50, format: ImageManipulator.SaveFormat.JPEG }
            );

            await uploadStory(
                manipulatedResult.uri,
                () => {}, 
                setIsUploading,
                setUploadProgress,
                setStories,
                setUnseenStories
            );

            await new Promise(resolve => setTimeout(resolve, 500));

            navigation.navigate('Home', { 
                forceStoryUpdate: true,
                timestamp: Date.now()
            });
        } catch (error) {
            console.error('Error al comprimir la imagen:', error);
        }
        setIsUploading(false);
    };

    const handleDownloadPhoto = async () => {
        if (!hasMediaLibraryPermission) return;
        setDownloadStatus('loading');

        try {
            const asset = await MediaLibrary.createAssetAsync(photo.uri);
            const albumName = "Historias Guardadas";
            let album = await MediaLibrary.getAlbumAsync(albumName);
            
            if (!album) {
                album = await MediaLibrary.createAlbumAsync(albumName, asset, false);
            } else {
                await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
            }
            
            setDownloadStatus('success');
            setTimeout(() => setDownloadStatus('default'), 2000);
        } catch (error) {
            console.error('Error al descargar la imagen:', error);
            setDownloadStatus('default');
        }
    };

    let rotation = 0;
    if (photo.width > photo.height) {
        rotation = photo.exif?.Orientation === 3 ? 270 : 90;
    } else {
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

            <TouchableOpacity style={styles.closeButton} onPress={handleRetakePhoto}>
                <Ionicons name="close" size={30} color="white" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.downloadButton} onPress={handleDownloadPhoto}>
                {downloadStatus === 'loading' ? (
                    <ActivityIndicator size="small" color="white" />
                ) : downloadStatus === 'success' ? (
                    <Ionicons name="checkmark" size={30} color="white" />
                ) : (
                    <Ionicons name="download" size={30} color="white" />
                )}
            </TouchableOpacity>

            <TouchableOpacity 
                style={styles.uploadButton} 
                onPress={handleUploadStory} 
                disabled={isUploading}
            >
                {isUploading ? (
                    <ActivityIndicator size="small" color="black" />
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
    downloadButton: {
        position: 'absolute',
        top: 50,
        right: 20,
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
