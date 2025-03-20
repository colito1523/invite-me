// components/GenderSelector.js
import React, { useState, useRef, useEffect } from "react";
import { View, Text, ScrollView } from "react-native";
import { useTranslation } from "react-i18next";
import styles from "./styles";

const GENDER_ITEM_HEIGHT = 50;
const genders = ["Male", "Female", "Other", "Prefer not to say"];

const GenderSelector = ({ onGenderChange, initialGender }) => {
  const [selectedGender, setSelectedGender] = useState(initialGender);
  const scrollViewRef = useRef(null);
  const { t } = useTranslation();

  useEffect(() => {
    const initialIndex = genders.indexOf(initialGender);
    if (initialIndex !== -1) {
      scrollViewRef.current?.scrollTo({
        y: initialIndex * GENDER_ITEM_HEIGHT,
        animated: false,
      });
    }
  }, []);

  const handleScroll = (event) => {
    const scrollPosition = event.nativeEvent.contentOffset.y;
    const index =
      Math.round(scrollPosition / GENDER_ITEM_HEIGHT) % genders.length;
    const newGender = genders[index];
    setSelectedGender(newGender);
    onGenderChange(newGender);
  };

  const renderGenderItem = (gender, index) => {
    const isSelected = gender === selectedGender;
    return (
      <View
        key={`${gender}-${index}`}
        style={[
          styles.genderItem,
          isSelected && styles.selectedGenderItem,
          { flex: 1, justifyContent: "center", alignItems: "center" },
        ]}
      >
        <Text style={[styles.genderText, isSelected && styles.selectedText]}>
          {t(`signup.genders.${gender.toLowerCase()}`)}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.genderContainer}>
      <View style={styles.selectedOverlay} pointerEvents="none" />
      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={GENDER_ITEM_HEIGHT}
        decelerationRate="fast"
        onMomentumScrollEnd={handleScroll}
        contentContainerStyle={styles.genderScrollViewContent}
        nestedScrollEnabled={true}
      >
        {genders.map((gender, index) => renderGenderItem(gender, index))}
      </ScrollView>
    </View>
  );
};

export default GenderSelector;