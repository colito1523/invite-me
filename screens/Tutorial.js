import React, { useRef, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity, 
  FlatList, 
  Dimensions 
} from 'react-native';
import { Video } from 'expo-av';
import { Image } from 'expo-image';
import { auth, database } from '../config/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { AntDesign } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');

export default function Tutorial() {
  const flatListRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const navigation = useNavigation();
  const { t } = useTranslation();

  const slides = [
    { 
      id: '1', 
      type: 'info',
      video: require('../assets/tutorial/videos/0.mp4'),
      videoStyle: styles.imageStyle2,
      topTextStyle: { fontSize: 14 },      // Estilo específico para el texto superior
      bottomTextStyle: { fontSize: 14 },   // Estilo específico para el texto inferior
    },
    { 
      id: '2', 
      type: 'info',
      topText: t('tutorial.slides.2.topText'),
      video: require('../assets/tutorial/videos/1.mp4'),
      videoStyle: styles.imageStyle2,
      topTextStyle: { fontSize: 14 },      // Estilo específico para el texto superior
      bottomTextStyle: { fontSize: 14 },   // Estilo específico para el texto inferior
    },
    { 
      id: '3', 
      type: 'info',
      topText: t('tutorial.slides.3.topText'),
      video: require('../assets/tutorial/videos/2.mp4'),
      videoStyle: styles.imageStyle2,
      topTextStyle: { fontSize: 14 },
      bottomTextStyle: { fontSize: 14 },
    },
    { 
      id: '4', 
      type: 'info',
      topText: t('tutorial.slides.4.topText'),
      video: require('../assets/tutorial/videos/3.mp4'),
      videoStyle: styles.imageStyle3,
      topTextStyle: { fontSize: 14 },
      bottomTextStyle: { fontSize: 14 },
    },
    { 
      id: '5', 
      type: 'info',
      topText: t('tutorial.slides.5.topText'),
      video: require('../assets/tutorial/videos/4.mp4'),
      videoStyle: styles.imageStyle4,
      topTextStyle: { fontSize: 14 },
      bottomTextStyle: { fontSize: 14 },
    },
    { 
      id: '6', 
      type: 'info',
      topText: t('tutorial.slides.6.topText'),
      video: require('../assets/tutorial/videos/5.mp4'),
      videoStyle: styles.imageStyle4,
      topTextStyle: { fontSize: 14 },
      bottomTextStyle: { fontSize: 14 },
    },
    { 
      id: '7', 
      type: 'info',
      topText: t('tutorial.slides.7.topText'),
      video: require('../assets/tutorial/videos/6.mp4'),
      videoStyle: styles.imageStyle4,
      topTextStyle: { fontSize: 14 },
      bottomTextStyle: { fontSize: 14 },
    },
    { 
      id: '8', 
      type: 'info',
      topText: t('tutorial.slides.8.topText'),
      video: require('../assets/tutorial/videos/7.mp4'),
      videoStyle: styles.imageStyle4,
      topTextStyle: { fontSize: 14 },
      bottomTextStyle: { fontSize: 14 },
    },
  ];

  const renderItem = ({ item, index }) => (
    <View style={[styles.content, { width, backgroundColor: index === 0 ? 'white' : 'black' }]}>
      {item.type === 'welcome' ? (
        <>
          <Image
            source={item.image}
            style={[styles.logo, item.imageStyle]}
            contentFit="contain"
          />
          <Text style={styles.welcomeText}>{item.text}</Text>
          <Text style={styles.descriptionText}>{item.description}</Text>
        </>
      ) : (
        // Contenedor para slides con video, permitiendo posicionar los textos en la parte superior e inferior.
        <View style={styles.videoContainer}>
          <Video
            source={item.video}
            style={[styles.logo, item.videoStyle]}
            resizeMode="contain"
            shouldPlay    // Inicia la reproducción automáticamente
            isLooping     // Reproduce en loop
            useNativeControls={false}
          />
          <Text style={[styles.overlayText, styles.topOverlayText, item.topTextStyle]}>
            {item.topText}
          </Text>
          {item.bottomText && (
            <Text style={[styles.overlayText, styles.bottomOverlayText, item.bottomTextStyle]}>
              {item.bottomText}
            </Text>
          )}
        </View>
      )}
    </View>
  );

  const handleNavigation = async () => {
    try {
      if (auth.currentUser) {
        const userRef = doc(database, "users", auth.currentUser.uid);
        await updateDoc(userRef, {
          hasSeenTutorial: true
        });
      }
      navigation.reset({
        index: 0,
        routes: [{ name: 'Home' }],
      });
    } catch (error) {
      console.error("Error updating document: ", error);
    }
  };

  const handleScroll = (event) => {
    const contentOffset = event.nativeEvent.contentOffset;
    const viewSize = event.nativeEvent.layoutMeasurement;
    const pageNum = Math.floor(contentOffset.x / viewSize.width);
    setCurrentIndex(pageNum);
  };

  const renderPaginationDots = () => {
    return (
      <View style={styles.paginationContainer}>
        {slides.map((_, index) => (
          <View
            key={index}
            style={[
              styles.paginationDot,
              { backgroundColor: index === currentIndex ? '#000' : '#888' }
            ]}
          />
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.skipContainer}>
        <TouchableOpacity style={styles.skipButton} onPress={handleNavigation}>
          <Text style={styles.skipText}>{t('tutorial.skip')}</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      />
      {renderPaginationDots()}
      {currentIndex === slides.length - 1 && (
        <TouchableOpacity style={styles.understoodButton} onPress={handleNavigation}>
          <Text style={styles.understoodButtonText}>{t('tutorial.understood')}</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // Fondo por defecto en el contenedor; se verán los fondos de cada slide
    backgroundColor: 'black',
  },
  skipContainer: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1,
  },
  skipButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  skipText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginRight: 5,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  logo: {
    width: 250,
    height: 250,
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 24,
    textAlign: 'center',
    color: 'black',
    fontWeight: 'bold',
    marginBottom: 20,
  },
  descriptionText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#4d4d4d',
    paddingHorizontal: 20,
  },
  videoContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayText: {
    position: 'absolute',
    color: '#FFFFFF', // Texto en blanco
    textAlign: 'center',
    width: '100%',
    paddingHorizontal: 10,
    fontWeight: 'bold',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  topOverlayText: {
    top: 20, // Posiciona el texto superior
  },
  bottomOverlayText: {
    bottom: 10, // Posiciona el texto inferior
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 20,
    width: '100%',
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  understoodButton: {
    position: 'absolute',
    bottom: 50,
    right: 20,
    backgroundColor: 'gray',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  understoodButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  imageStyle1: {
    width: 300,
    height: 300,
  },
  imageStyle2: {
    top: 40,
    width: 640,
    height: 640,
    marginBottom: 20,
    borderRadius: 100,
  },
  imageStyle3: {
    top: 40,
    width: 600,
    height: 600,
    marginBottom: 20,
    borderRadius: 100,
  },
  imageStyle4: {
    top: 40,
    width: 647,
    height: 647,
    marginBottom: 20,
    borderRadius: 100,
  },
});
