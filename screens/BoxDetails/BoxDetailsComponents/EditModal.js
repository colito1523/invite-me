import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
} from "react-native";

const EditModal = ({
  visible,
  onClose,
  onSave,
  editedData,
  setEditedData,
  isProcessing,
  styles,
  t,
}) => {
  const [errors, setErrors] = useState({});

  const validateFields = () => {
    const newErrors = {};
    if (!editedData.title || editedData.title.trim() === "." || editedData.title.trim() === "") {
      newErrors.title = t("eventRecommendation.completeAllFields");
    }
    if (!editedData.address || editedData.address.trim() === "." || editedData.address.trim() === "") {
      newErrors.address = t("eventRecommendation.completeAllFields");
    }
    if (!editedData.description || editedData.description.trim() === "." || editedData.description.trim() === "") {
      newErrors.description = t("eventRecommendation.completeAllFields");
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0; // Retorna true si no hay errores
  };

  const handleSave = () => {
    if (validateFields()) {
      onSave();
    } else {
      Alert.alert(t("indexBoxDetails.error"), t("eventRecommendation.completeAllFields"));
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.modalOverlay}>
          <View style={styles.editModalContent}>
            <Text style={styles.editModalTitle}>
              {t("indexBoxDetails.editEvent")}
            </Text>
            {/* Inputs para edición */}
            <TextInput
              style={[
                styles.input,
                errors.title && { borderColor: "red" }, // Destaca el error
              ]}
              value={editedData.title}
              onChangeText={(text) =>
                setEditedData({ ...editedData, title: text })
              }
              placeholder={t("indexBoxDetails.titlePlaceholder")}
            />
            {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}

            <TextInput
              style={[
                styles.input,
                errors.address && { borderColor: "red" },
              ]}
              value={editedData.address}
              onChangeText={(text) =>
                setEditedData({ ...editedData, address: text })
              }
              placeholder={t("indexBoxDetails.addressPlaceholder")}
            />
            {errors.address && <Text style={styles.errorText}>{errors.address}</Text>}

            <TextInput
              style={[
                styles.input,
                errors.description && { borderColor: "red" },
              ]}
              value={editedData.description}
              onChangeText={(text) =>
                setEditedData({ ...editedData, description: text })
              }
              placeholder={t("indexBoxDetails.descriptionPlaceholder")}
              multiline
            />
            {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}

            {/* Botones */}
            <View style={styles.editModalButtons}>
              <TouchableOpacity
                style={[styles.editModalButton, styles.cancelButton]}
                onPress={onClose}
              >
                <Text style={styles.editModalButtonText}>
                  {t("storyViewer.cancel")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.editModalButton, styles.saveButton]}
                onPress={handleSave}
                disabled={isProcessing}
              >
                <Text style={styles.editModalButtonText}>
                  {isProcessing
                    ? t("storyViewer.saving")
                    : t("storyViewer.saver")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

export default EditModal;
