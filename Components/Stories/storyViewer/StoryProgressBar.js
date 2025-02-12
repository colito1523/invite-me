// StoryProgressBar.js
import React from "react";
import { View } from "react-native";
import styles from "./StoryViewStyles"; // Asegúrate de que la ruta sea correcta

/**
 * Props:
 * - userStories: arreglo de historias del usuario (para determinar cuántos segmentos renderizar)
 * - currentStoryIndex: índice de la historia actualmente visible
 * - progress: valor entre 0 y 1 que indica el progreso de la historia actual
 */
const StoryProgressBar = ({ userStories, currentStoryIndex, progress }) => {
  return (
    <View style={styles.progressContainer}>
      {userStories.map((_, index) => {
        let widthValue = "0%";
        if (index < currentStoryIndex) {
          widthValue = "100%";
        } else if (index === currentStoryIndex) {
          widthValue = `${progress * 100}%`;
        }
        return (
          <View key={index} style={styles.progressBar}>
            <View style={[styles.progress, { width: widthValue }]} />
          </View>
        );
      })}
    </View>
  );
};

export default StoryProgressBar;
