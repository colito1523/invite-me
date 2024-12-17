import { PanResponder } from "react-native";

export const createStoryPanResponder = ({
  handleCloseViewer,
  handleOpenViewersModal,
  handleNextUser,
  handlePreviousUser,
  isCurrentUserStory,
}) => {
  return PanResponder.create({
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      // Detecta movimientos verticales y horizontales
      return Math.abs(gestureState.dy) > 20 || Math.abs(gestureState.dx) > 20;
    },
    onPanResponderRelease: (evt, gestureState) => {
      if (gestureState.dy > 50) {
        handleCloseViewer(); // Deslizar hacia abajo
      } else if (gestureState.dy < -50 && isCurrentUserStory) {
        handleOpenViewersModal(); // Deslizar hacia arriba
      } else if (gestureState.dx > 50) {
        handlePreviousUser(); // Deslizar a la derecha
      } else if (gestureState.dx < -50) {
        handleNextUser(); // Deslizar a la izquierda
      }
    },
  });
};

export const handleNextUser = ({
  currentIndex,
  setCurrentIndex,
  setStoryIndex,
  setProgress,
  stories,
  onClose,
  localUnseenStories,
}) => {
  if (currentIndex < stories.length - 1) {
    setCurrentIndex((prev) => prev + 1);
    setStoryIndex(0); // Reinicia al primer índice de la siguiente historia
    setProgress(0);
  } else {
    onClose(localUnseenStories); // Cierra si no hay más usuarios
  }
};

export const handlePreviousUser = ({
  currentIndex,
  setCurrentIndex,
  setStoryIndex,
  setProgress,
}) => {
  if (currentIndex > 0) {
    setCurrentIndex((prev) => prev - 1);
    setStoryIndex(0); // Reinicia al primer índice de la historia anterior
    setProgress(0);
  }
};
