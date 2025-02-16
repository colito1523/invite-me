// StoryNavigationButtons.js
import React from 'react';
import { TouchableOpacity } from 'react-native';
import styles from './StoryViewStyles';

export default function StoryNavigationButtons({
  isFirstStory,
  isLastStory,
  onPrevious,
  onNext,
}) {
  return (
    <>
      {!isFirstStory && (
        <TouchableOpacity
          style={[styles.navButton, styles.leftButton]}
          onPress={onPrevious}
        />
      )}
      {!isLastStory && (
        <TouchableOpacity
          style={[styles.navButton, styles.rightButton]}
          onPress={onNext}
        />
      )}
    </>
  );
}
