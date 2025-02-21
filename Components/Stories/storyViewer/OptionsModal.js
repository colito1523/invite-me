// OptionsModal.js
import React from "react";
import {
  Modal,
  View,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Text,
} from "react-native";

const OptionsModal = ({
  isVisible,
  onClose,
  isCurrentUserStory,
  auth,
  database,
  currentStory,
  toggleHideStories,
  localUnseenStories,
  t,
  setIsComplaintsVisible,
  onDeleteStory, // ✅ Ahora sí lo pasamos correctamente
  styles,
}) => {


  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={styles.optionsModalContainer}>
              {isCurrentUserStory ? (
                // Opción solo para el dueño de la historia
                <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => {
                  onClose(); // Cierra el modal de opciones
                  onDeleteStory(); // ⬅ Se asegura de eliminar la historia y cerrar el visor
                }}
              >
                <Text style={styles.deleteButtonText}>
                  {t("storyViewer.Delete")}
                </Text>
              </TouchableOpacity>
              
              
              ) : (
                // Opciones para otros usuarios
                <>
                  <TouchableOpacity
                    style={styles.optionButton}
                    onPress={() => {
                      toggleHideStories({
                        user: auth.currentUser,
                        currentStory,
                        database,
                        onClose,
                        localUnseenStories,
                        t,
                      });
                      onClose();
                    }}
                  >
                    <Text style={styles.optionButtonText}>
                      {t("storyViewer.DontSeeMore")}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.optionButton}
                    onPress={() => {
                      onClose();
                      setIsComplaintsVisible(true);
                    }}
                  >
                    <Text style={styles.optionButtonText}>
                      {t("storyViewer.Report")}
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

export default OptionsModal;
