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
  Dimensions 
} from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import { Video } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';

const screenWidth = Dimensions.get('window').width;
const numColumns = 3;
const itemSpacing = 10;
const itemSize = (screenWidth - itemSpacing * (numColumns + 1)) / numColumns;
const screenHeight = Dimensions.get('window').height;


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
      console.log('Solicitando permisos...');
      
      // Solicitar permiso de MediaLibrary
      const { status: libraryStatus } = await MediaLibrary.requestPermissionsAsync();
      console.log('Estado permiso MediaLibrary:', libraryStatus);
      
      // Solicitar permiso de ImagePicker
      const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log('Estado permiso ImagePicker:', mediaStatus);
      
      const hasAllPermissions = libraryStatus === 'granted' && mediaStatus === 'granted';
      setHasPermission(hasAllPermissions);
      console.log('¿Tiene todos los permisos?:', hasAllPermissions);

      if (!hasAllPermissions) {
        console.log('Permisos denegados:', { libraryStatus, mediaStatus });
        alert('Se necesitan permisos para acceder a la galería');
        return;
      }

      const media = await MediaLibrary.getAssetsAsync({
        mediaType: [MediaLibrary.MediaType.photo, MediaLibrary.MediaType.video],
        first: 40, // valor alto para traer todos (límite interno de Expo ~10k)
        sortBy: ['creationTime'],
        album: undefined
      });

      console.log('Media loaded:', media.assets.length, 'items');

      const items = await Promise.all(
        media.assets.map(async (asset) => {
          // Asegurarse de que la URI sea accesible
          const assetInfo = await MediaLibrary.getAssetInfoAsync(asset);
          return {
            uri: assetInfo.localUri || assetInfo.uri,
            type: asset.mediaType === 'video' ? 'video' : 'image'
          };
        })
      );

      console.log('Primer item URI:', items[0]?.uri);
      setMediaList(items);
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading media:', error);
      setIsLoading(false);
    }
  };

  return (
<Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
  <View style={styles.modalOverlay}>
    <View style={styles.modal}>

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
          contentContainerStyle={styles.galleryContainer}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.item} onPress={() => onSelect(item)}>
              {item.type === 'image' ? (
                <Image
                  source={{ uri: item.uri }}
                  style={styles.media}
                  resizeMode="cover"
                  onError={(e) => console.log('Error loading image:', e.nativeEvent.error)}
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
  </View>
</Modal>

  );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: "transparent",
        justifyContent: 'flex-end',
      },
      modal: {
        height: screenHeight * 0.8,
        backgroundColor: 'black',
        paddingTop: 40,
        width: '100%',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
      },
  title: { 
    color: 'white', 
    fontSize: 20, 
    textAlign: 'center', 
    marginBottom: 10 
  },
  galleryContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 20,
    paddingHorizontal: itemSpacing,
  },
  item: {
    width: itemSize,
    height: itemSize,
    margin: itemSpacing / 2,
  },
  media: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    backgroundColor: '#333',
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