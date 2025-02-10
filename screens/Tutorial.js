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
      type: 'welcome',
      text: t('tutorial.slides.1.text'),
      description: t('tutorial.slides.1.description'),
      image: require('../assets/Logo_Invite_Me.png'),
      imageStyle: styles.imageStyle1
    },
    { 
      id: '2', 
      type: 'info',
      topText: t('tutorial.slides.2.topText'),
      video: require('../assets/tutorial/videos/1.mp4'),
      videoStyle: styles.imageStyle2,
      textStyle: styles.textStyle2,
      bottomText: t('tutorial.slides.2.bottomText')
    },
    { 
      id: '3', 
      type: 'info',
      topText: t('tutorial.slides.2.topText'),
      video: require('../assets/tutorial/videos/2.mp4'),
      videoStyle: styles.imageStyle2,
      textStyle: styles.textStyle2,
      bottomText: t('tutorial.slides.2.bottomText')
    },
    { 
      id: '4', 
      type: 'info',
      topText: t('tutorial.slides.3.topText'),
      video: require('../assets/tutorial/videos/3.mp4'),
      videoStyle: styles.imageStyle3,
      textStyle: styles.textStyle3,
      bottomText: t('tutorial.slides.3.bottomText')
    },
    { 
      id: '5', 
      type: 'info',
      topText: t('tutorial.slides.4.topText'),
      video: require('../assets/tutorial/videos/4.mp4'),
      videoStyle: styles.imageStyle4,
      textStyle: styles.textStyle4,
      bottomText: t('tutorial.slides.4.bottomText')
    },
    { 
      id: '6', 
      type: 'info',
      topText: t('tutorial.slides.4.topText'),
      video: require('../assets/tutorial/videos/5.mp4'),
      videoStyle: styles.imageStyle4,
      textStyle: styles.textStyle4,
      bottomText: t('tutorial.slides.4.bottomText')
    },
    { 
      id: '7', 
      type: 'info',
      topText: t('tutorial.slides.4.topText'),
      video: require('../assets/tutorial/videos/6.mp4'),
      videoStyle: styles.imageStyle4,
      textStyle: styles.textStyle4,
      bottomText: t('tutorial.slides.4.bottomText')
    },
    { 
      id: '8', 
      type: 'info',
      topText: t('tutorial.slides.4.topText'),
      video: require('../assets/tutorial/videos/7.mp4'),
      videoStyle: styles.imageStyle4,
      textStyle: styles.textStyle4,
      bottomText: t('tutorial.slides.4.bottomText')
    },
  ];

  const renderItem = ({ item }) => (
    <View style={[styles.content, { width }]}>
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
        // Para slides con video: se crea un contenedor para posicionar los textos encima del video.
        <View style={styles.videoContainer}>
          <Video
            source={item.video}
            style={[styles.logo, item.videoStyle]}
            resizeMode="contain"
            shouldPlay    // Inicia la reproducción automáticamente
            isLooping     // Reproduce en loop
            useNativeControls={false}
          />
          <Text style={[styles.overlayText, styles.topOverlayText, item.textStyle]}>
            {item.topText}
          </Text>
          {item.bottomText && (
            <Text style={[styles.overlayText, styles.bottomOverlayText, item.textStyle]}>
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
          <AntDesign name="close" size={24} color="#4d4d4d" />
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
    backgroundColor: 'b',
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
    color: '#4d4d4d',
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
    // Sombra para mejorar la legibilidad sobre el video
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  topOverlayText: {
    top: 10, // Ajusta el espacio desde arriba según necesites
  },
  bottomOverlayText: {
    bottom: 10, // Ajusta el espacio desde abajo según necesites
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
    backgroundColor: 'black',
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
    // Personaliza el estilo de la imagen de bienvenida si lo requieres
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
  textStyle2: {
    top: 60,
    fontSize: 14,
  },
  textStyle3: {
    top: 40,
    fontSize: 14,
  },
  textStyle4: {
    top: 50,
    fontSize: 14,
  },
});
