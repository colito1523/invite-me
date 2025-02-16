// ViewersModal.js
import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  TextInput,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import styles from "./StoryViewStyles"; // Usa los mismos estilos
import { handleSearch } from "./storyUtils"; // Para poder llamar a handleSearch si lo necesitas

export default function ViewersModal({
  visible,
  onClose,
  filteredViewers,
  searchQuery,
  setSearchQuery,
  onDeleteStory,
  renderViewerItem,
  t,
}) {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={styles.viewersModalContainer}>
              <View style={styles.viewersModalContent}>
                <View style={styles.viewersModalHeader}>
                  <View style={styles.searchContainer}>
                    <Ionicons
                      name="search"
                      size={20}
                      color="black"
                      style={styles.searchIcon}
                    />
                    <TextInput
                      style={styles.searchInput}
                      placeholder={t("storyViewer.searchPlaceholder")}
                      placeholderTextColor="black"
                      value={searchQuery}
                      onChangeText={(query) => {
                        // Si deseas usar tu handleSearch original, puedes llamarlo
                        handleSearch({ query, setSearchQuery });
                      }}
                    />
                    <View style={styles.searchInputDivider} />
                    <Text style={styles.searchInputCount}>
                      {filteredViewers.length}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={onDeleteStory}
                  >
                    <Ionicons name="trash-outline" size={20} color="black" />
                  </TouchableOpacity>
                </View>

                <Text style={styles.viewersTitle}>
                  {t("storyViewer.viewers")}
                </Text>

                <FlatList
                  data={filteredViewers}
                  renderItem={renderViewerItem}
                  keyExtractor={(item) => item.uid}
                />
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}
