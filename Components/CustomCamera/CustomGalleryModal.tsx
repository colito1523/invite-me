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
    Dimensions,
    ActivityIndicator,
    TouchableWithoutFeedback,
    PanResponder,
    GestureResponderEvent,
    PanResponderGestureState,
  } from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import { Video } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import * as VideoThumbnails from 'expo-video-thumbnails';
import * as FileSystem from 'expo-file-system';

const screenWidth = Dimensions.get('window').width;
const numColumns = 3;
const itemSpacing = 10;
const itemSize = (screenWidth - itemSpacing * (numColumns + 1)) / numColumns;
const screenHeight = Dimensions.get('window').height;



type MediaItem = {
  uri: string;
  type: 'image' | 'video';
  thumbnail?: string;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  onSelect: (item: MediaItem) => void;
  allowVideos?: boolean; // <- nuevo
};

export default function CustomGalleryModal({ visible, onClose, onSelect, allowVideos = false }: Props) {
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [endCursor, setEndCursor] = useState<string | null>(null);
const [hasNextPage, setHasNextPage] = useState(true);
const [isFetchingMore, setIsFetchingMore] = useState(false);



const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_: GestureResponderEvent, gestureState: PanResponderGestureState) => {
      return gestureState.dy > 20; // detecta si se desliza hacia abajo
    },
    onPanResponderRelease: (_: GestureResponderEvent, gestureState: PanResponderGestureState) => {
      if (gestureState.dy > 50) {
        onClose();
      }
    },
  });


  useEffect(() => {
    if (visible) {
      setIsLoading(true);
      loadMedia();
    }
  }, [visible]);

  const loadMedia = async (after?: string) => {
    try {
      if (after) setIsFetchingMore(true);
      else setIsLoading(true);
  
      const { status: libraryStatus } = await MediaLibrary.requestPermissionsAsync();
      const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  
      const hasAllPermissions = libraryStatus === 'granted' && mediaStatus === 'granted';
      setHasPermission(hasAllPermissions);
      if (!hasAllPermissions) {
        alert('Se necesitan permisos para acceder a la galería');
        return;
      }
  
      const media = await MediaLibrary.getAssetsAsync({
        mediaType: allowVideos ? MediaLibrary.MediaType.all : MediaLibrary.MediaType.photo,
        first: 50,
        sortBy: ['creationTime'],
        after,
      });
  
      const items = await Promise.all(
        media.assets.map(async (asset) => {
          const assetInfo = await MediaLibrary.getAssetInfoAsync(asset);
      
          // Filtrar videos que duren más de 2 minutos (120 segundos)
          if (asset.mediaType === 'video' && asset.duration && asset.duration > 120) {
            return null;
          }
      
          let thumbnailUri = assetInfo.localUri || assetInfo.uri;
      
          if (asset.mediaType === 'video') {
            try {
              const videoOriginalUri = assetInfo.localUri || assetInfo.uri;

              try {
                const fileName = videoOriginalUri.split('/').pop() || `temp_video_${Date.now()}.mov`;
                const tempPath = FileSystem.cacheDirectory + fileName;
              
                // Copiamos el video al cache si no está ya ahí
                await FileSystem.copyAsync({
                  from: videoOriginalUri,
                  to: tempPath,
                });
              
                const { uri: thumb } = await VideoThumbnails.getThumbnailAsync(tempPath, {
                  time: 10,
                });
                thumbnailUri = thumb;
              } catch (err) {
                console.warn('Error generando miniatura de video:', err);
                thumbnailUri = videoOriginalUri; // fallback
              }
            } catch (err) {
              console.warn('Error generando miniatura de video:', err);
            }
          }
      
          return {
            uri: assetInfo.localUri || assetInfo.uri, // esto convierte el ph:// en file://
            type: asset.mediaType === 'video' ? 'video' : 'image',
            thumbnail: thumbnailUri,
          };
          
          
        })
      );
      
      // Eliminar los `null` de los videos descartados
      const filteredItems = items.filter((item) => item !== null) as MediaItem[];
      
  
      if (after) {
        setMediaList((prev) => [...prev, ...filteredItems]);
      } else {
        setMediaList(filteredItems);
      }
  
      setEndCursor(media.endCursor || null);
      setHasNextPage(media.hasNextPage ?? false);
      setIsLoading(false);
      setIsFetchingMore(false);
    } catch (error) {
      console.error('Error loading media:', error);
      setIsLoading(false);
      setIsFetchingMore(false);
    }
  };

  const loadMoreMedia = () => {
    if (!hasNextPage || isFetchingMore || isLoading || !endCursor) return;
    console.log('Cargando más contenido...');
    loadMedia(endCursor);
  };
  
  

  return (
<Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
  <View style={styles.modalOverlay}>

    {/* Capa exterior invisible que detecta toques fuera del modal */}
    <TouchableWithoutFeedback onPress={onClose}>
      <View style={StyleSheet.absoluteFill} />
    </TouchableWithoutFeedback>

    {/* Contenedor principal del modal */}
    <View style={styles.modal} {...panResponder.panHandlers}>
      <View style={styles.dragHandle}>
        <View style={styles.dragIndicator} />
      </View>

      {hasPermission === false ? (
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>Permiso requerido para acceder a la galería</Text>
          <Button title="Otorgar permiso" onPress={loadMedia} />
        </View>
      ) : isLoading ? (
        <View style={styles.footerLoader}>
          <ActivityIndicator size="small" color="#fff" />
        </View>
      ) : (
        <FlatList
          data={mediaList}
          numColumns={3}
          keyExtractor={(item, index) => index.toString()}
          contentContainerStyle={styles.galleryContainer}
          onEndReached={loadMoreMedia}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            isFetchingMore ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color="#fff" />
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.item} onPress={() => onSelect(item)}>
              <Image
                source={{ uri: item.thumbnail }}
                style={styles.media}
                resizeMode="cover"
              />
              {item.type === 'video' && (
                <View style={styles.videoOverlay}>
                  <Text style={styles.videoIcon}>▶</Text>
                </View>
              )}
            </TouchableOpacity>
          )}
        />
      )}
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
        width: '100%',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
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
  },
  footerLoader: {
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dragHandle: {
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 5,
  },
  
  dragIndicator: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#555',
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  
  videoIcon: {
    color: 'white',
    fontSize: 30,
    fontWeight: 'bold',
  },
  
});