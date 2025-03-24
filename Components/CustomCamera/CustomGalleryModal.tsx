// CustomGalleryModal.tsx
import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  FlatList,
  Image,
  TouchableOpacity,
  Text,
  StyleSheet,
  Button,
  Platform
} from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import { Video } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';


type MediaItem = {
  uri: string;
  type: 'image' | 'video';
};

type Props = {
  visible: boolean;
  onClose: () => void;
  onSelect: (item: MediaItem) => void;
};

export default function CustomGalleryModal({ visible, onClose, onSelect }: Props) {
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      setIsLoading(true);
      loadMedia();
    }
  }, [visible]);

const loadMedia = async () => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      setHasPermission(status === 'granted');

      if (status !== 'granted') return;

      const media = await MediaLibrary.getAssetsAsync({
        mediaType: ['photo', 'video'],
        sortBy: [MediaLibrary.SortBy.creationTime],
        first: 100,
      });

      const items = await Promise.all(media.assets.map(async (asset) => {
        const uri = asset.uri;
        return {
          uri: uri,
          type: asset.mediaType === 'video' ? 'video' : 'image'
        };
      }));

      setMediaList(items);
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading media:', error);
      setIsLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.modal}>
        <Text style={styles.title}>Tu galería</Text>
        
        {hasPermission === false ? (
          <View style={styles.permissionContainer}>
            <Text style={styles.permissionText}>Permiso requerido para acceder a la galería</Text>
            <Button title="Otorgar permiso" onPress={loadMedia} />
          </View>
        ) : isLoading ? (
          <Text style={styles.loadingText}>Cargando...</Text>
        ) : (
          <FlatList
            data={mediaList}
            numColumns={3}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={styles.item} 
                onPress={() => onSelect(item)}
              >
                {item.type === 'image' ? (
                  <Image 
                    source={{ uri: item.uri }} 
                    style={styles.media} 
                  />
                ) : (
                    <Video
                    source={{ uri: item.uri }}
                    style={styles.media}
                    resizeMode="cover"
                    isMuted
                    shouldPlay={false}
                    useNativeControls={false}
                  />
                )}
              </TouchableOpacity>
            )}
          />
        )}

        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <Text style={styles.closeText}>Cerrar</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modal: { 
    flex: 1, 
    backgroundColor: 'black', 
    paddingTop: 40 
  },
  title: { 
    color: 'white', 
    fontSize: 20, 
    textAlign: 'center', 
    marginBottom: 10 
  },
  item: { 
    margin: 5 
  },
  media: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: '#333',
    resizeMode: 'cover',
  },
  closeBtn: { 
    alignSelf: 'center', 
    marginTop: 10 
  },
  closeText: { 
    color: 'white', 
    fontSize: 16 
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  permissionText: {
    color: 'white',
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center'
  },
  loadingText: {
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
    marginTop: '50%'
  }
});