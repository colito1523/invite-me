import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, FlatList, Dimensions } from 'react-native';
import { Image } from 'expo-image';
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
      description: t('tutorial.slides.1.description')
    },
    { 
      id: '2', 
      type: 'info',
      topText: t('tutorial.slides.2.topText'),
      bottomText: t('tutorial.slides.2.bottomText')
    },
    { 
      id: '3', 
      type: 'info',
      topText: t('tutorial.slides.3.topText'),
      bottomText: t('tutorial.slides.3.bottomText')
    },
    { 
      id: '4', 
      type: 'info',
      topText: t('tutorial.slides.4.topText'),
      bottomText: t('tutorial.slides.4.bottomText')
    },
    { 
      id: '5', 
      type: 'info',
      topText: t('tutorial.slides.5.topText'),
    },
    { 
      id: '6', 
      type: 'info',
      topText: t('tutorial.slides.6.topText'),
    },
    { 
      id: '7', 
      type: 'info',
      topText: t('tutorial.slides.7.topText'),
      bottomText: t('tutorial.slides.7.bottomText')
    },
    { 
      id: '8', 
      type: 'info',
      topText: t('tutorial.slides.8.topText'),
      bottomText: t('tutorial.slides.8.bottomText')
    },
  ];

  const renderItem = ({ item }) => (
    <View style={[styles.content, { width }]}>
      {item.type === 'welcome' ? (
        <>
          <Image
            source={require('../assets/Logo_Invite_Me.png')}
            style={styles.logo}
            contentFit="contain"
          />
          <Text style={styles.welcomeText}>{item.text}</Text>
          <Text style={styles.descriptionText}>{item.description}</Text>
        </>
      ) : (
        <>
          <Text style={styles.infoText}>{item.topText}</Text>
          <Image
            source={require('../assets/Logo_Invite_Me.png')}
            style={styles.logo}
            contentFit="contain"
          />
          <Text style={styles.infoText}>{item.bottomText}</Text>
        </>
      )}
    </View>
  );

  const handleNavigation = () => {
    navigation.navigate('Home');
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
    backgroundColor: '#FFFFFF',
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
  infoText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#4d4d4d',
    paddingHorizontal: 20,
    marginVertical: 20,
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
});