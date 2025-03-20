// AgeSelector.js
import React, { useState, useRef, useEffect } from "react";
import { View, Text, ScrollView, Dimensions } from "react-native";
import { useTranslation } from "react-i18next";
import styles from "./styles";

const ITEM_WIDTH = Dimensions.get("window").width / 5;
const ages = Array.from({ length: 85 }, (_, i) => i + 16);

function AgeSelector({ onAgeChange, initialAge }) {
  const [selectedAge, setSelectedAge] = useState(initialAge);
  const scrollViewRef = useRef(null);
  const { t } = useTranslation();

  useEffect(() => {
    const initialIndex = ages.indexOf(initialAge);
    if (initialIndex !== -1) {
      scrollViewRef.current?.scrollTo({
        x: initialIndex * ITEM_WIDTH,
        animated: false,
      });
    }
  }, [initialAge]);

  const handleScroll = (event) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / ITEM_WIDTH);
    const newAge = ages[index];
    setSelectedAge(newAge);
    onAgeChange(newAge);
  };

  const renderAgeItem = (age, index) => {
    const isSelected = age === selectedAge;
    return (
      <View
        key={`${age}-${index}`}
        style={[
          styles.ageItem,
          isSelected && styles.selectedItem,
          { justifyContent: "center", alignItems: "center", flex: 1 },
        ]}
      >
        <Text style={[styles.ageText, isSelected && styles.selectedText]}>
          {age}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.ageSelectorContainer}>
      <View style={styles.selectedOverlayAge} pointerEvents="none" />
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={ITEM_WIDTH}
        decelerationRate="fast"
        onMomentumScrollEnd={handleScroll}
        contentContainerStyle={styles.scrollViewContent}
        nestedScrollEnabled={true}
      >
        {ages.map((age, index) => renderAgeItem(age, index))}
      </ScrollView>
    </View>
  );
}

export default AgeSelector;