import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Audio } from 'expo-av';
import { Feather } from '@expo/vector-icons';

const AudioPlayer = ({ uri }) => {
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  const loadSound = async () => {
    setIsLoading(true);
    try {
      const { sound: soundObject, status } = await Audio.Sound.createAsync(
        { uri },
        { 
          shouldPlay: false, 
          staysActiveInBackground: true,  // Asegura que el sonido siga activo en segundo plano si necesario
        },
        onPlaybackStatusUpdate
      );
      setSound(soundObject);
      setDuration(status.durationMillis);
    } catch (error) {
      console.error("Error cargando el sonido:", error);
    } finally {
      setIsLoading(false);
    }
  };
  

  const onPlaybackStatusUpdate = (status) => {
    console.log('Playback Status:', status); // Añade este log para depurar
    if (status.isLoaded) {
      setPosition(status.positionMillis);
  
      if (status.didJustFinish && !status.isPlaying) {
        setIsPlaying(false);
        sound.setPositionAsync(0);
      }
    }
  };

  const handlePlayPause = async () => {
    if (isLoading) {
      console.warn("El sonido aún se está cargando...");
      return;
    }

    if (!sound) {
      await loadSound();
    }

    if (sound) {
      if (isPlaying) {
        await sound.pauseAsync();
        setIsPlaying(false);
      } else {
        // Si el audio ha terminado, reinícialo y reprodúcelo desde el principio
        if (position >= duration) {
          await sound.setPositionAsync(0);
        }
        await sound.playAsync();
        setIsPlaying(true);
      }
    }
  };

  const formatTime = (millis) => {
    const totalSeconds = millis / 1000;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <View style={audioStyles.container}>
      {isLoading ? (
        <Text>Cargando...</Text> // Aquí puedes usar un spinner o un icono de carga
      ) : (
        <TouchableOpacity onPress={handlePlayPause}>
          <Feather name={isPlaying ? 'pause' : 'play'} size={24} color="#007bff" />
        </TouchableOpacity>
      )}
      <View style={audioStyles.progressContainer}>
        <Text style={audioStyles.timeText}>{formatTime(position)}</Text>
        <View style={audioStyles.progressBar}>
          <View
            style={{
              ...audioStyles.progress,
              width: duration ? `${(position / duration) * 100}%` : '0%',
            }}
          />
        </View>
        
        <Text style={audioStyles.timeText}>{formatTime(duration)}</Text>
      </View>
    </View>
  );
};

const audioStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#f7f7f7', // Color de fondo para visibilidad
    borderRadius: 10, // Bordes redondeados
    marginVertical: 5, // Espacio entre mensajes
    flex: 1, // Ajusta el ancho al contenido
  },
  progressContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#ccc',
    marginHorizontal: 10,
    borderRadius: 2,
  },
  progress: {
    height: 4,
    backgroundColor: '#007bff',
    borderRadius: 2,
  },
  timeText: {
    fontSize: 12,
    color: '#333',
  },
});

export default AudioPlayer;
