import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import styles from "./styles";
import { chunkArray } from "./utils";

const InterestsSelector = ({
  group, // "group1" o "group2"
  keys,  // array de claves de intereses para el grupo
  answers,
  handleAnswer,
  handleInterestSelection,
  t,
}) => {
  // Función para determinar si una clave está seleccionada (se comparan con los 4 intereses posibles)
  const isInterestSelected = (key) =>
    key === answers.interest1 ||
    key === answers.interest2 ||
    key === answers.interest3 ||
    key === answers.interest4;

  // Usamos el grupo para determinar el prefijo de traducción
  const translationPrefix =
    group === "group1" ? "signup.interestsGroup1" : "signup.interestsGroup2";

  return (
    <View>
      {chunkArray(keys, 2).map((row, rowIndex) => (
        <View style={styles.rowInputs} key={`${group}-row-${rowIndex}`}>
          {row.map((key) => (
            <TouchableOpacity
              key={key}
              style={[
                styles.halfInput,
                isInterestSelected(key) ? { backgroundColor: "#e0dcd7" } : null,
              ]}
              onPress={() =>
                handleInterestSelection(key, answers, handleAnswer, t)
              }
            >
              <Text>{t(`${translationPrefix}.${key}`)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ))}
    </View>
  );
};

export default InterestsSelector;
