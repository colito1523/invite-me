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
        mediaType: [MediaLibrary.MediaType.photo, MediaLibrary.MediaType.video],
        first: 50,
        sortBy: ['creationTime'],
        after,
      });
  
      const items = await Promise.all(
        media.assets.map(async (asset) => {
          const assetInfo = await MediaLibrary.getAssetInfoAsync(asset);
          return {
            uri: assetInfo.localUri || assetInfo.uri,
            type: asset.mediaType === 'video' ? 'video' : 'image',
          };
        })
      );
  
      if (after) {
        setMediaList((prev) => [...prev, ...items]);
      } else {
        setMediaList(items);
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
<TouchableWithoutFeedback onPress={onClose}>
  <View style={styles.modalOverlay}>
    <View
      style={styles.modal}
      {...panResponder.panHandlers} // <--- importante para el swipe
    >
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

     
    </View>
  </View>
  </TouchableWithoutFeedback>
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
  },
  footerLoader: {
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
});