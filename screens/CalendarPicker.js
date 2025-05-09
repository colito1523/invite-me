import React, { useState, useEffect } from "react";
import { useDate } from "../src/hooks/DateContext"; // Importa el contexto
import { View, Text, TouchableOpacity, Modal, StyleSheet, Dimensions } from "react-native";
import { Calendar } from "react-native-calendars";
import { useTranslation } from 'react-i18next';
import { LocaleConfig } from 'react-native-calendars';
import dayjs from "dayjs";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

const CalendarPicker = ({ onDateChange, setLoading }) => {
  const { selectedDate, setSelectedDate } = useDate(); // Usa el contexto
  const [modalVisible, setModalVisible] = useState(false);
  const [isNightMode, setIsNightMode] = useState(false);
  const { i18n } = useTranslation(); // Obtén el idioma actual

  // Definir las traducciones dentro del componente
  const translations = {
    es: { today: "Hoy" }, // Español
    en: { today: "Today" }, // Inglés
    pt: { today: "Hoje" }, // Portugués
  };

  // Obtener la traducción para "Hoy" según el idioma actual
  const todayText = translations[i18n.language]?.today || "Today"; // Default a "Today" si no se encuentra

  useEffect(() => {
    LocaleConfig.defaultLocale = i18n.language;
  }, [i18n.language]); // Esto actualiza el idioma cuando cambia

  LocaleConfig.locales['es'] = {
    monthNames: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
    monthNamesShort: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
    dayNames: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
    dayNamesShort: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
  };

  LocaleConfig.locales['pt'] = {
    monthNames: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'],
    monthNamesShort: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
    dayNames: ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'],
    dayNamesShort: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
  };

  LocaleConfig.locales['en'] = LocaleConfig.locales[''] = {
    monthNames: ['January', 'February', 'March', 'April', 'May', 'June',
                 'July', 'August', 'September', 'October', 'November', 'December'],
    monthNamesShort: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    dayNames: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    dayNamesShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  };

  useEffect(() => {
    const checkTime = () => {
      const currentHour = new Date().getHours();
      setIsNightMode(currentHour >= 19 || currentHour < 6);
    };

    checkTime();
    const interval = setInterval(checkTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const today = dayjs().format("YYYY-MM-DD");
  const maxDate = dayjs().add(6, "month").format("YYYY-MM-DD");

  const handleDayPress = (day) => {
    const now = dayjs();
    const currentHour = now.hour();
    let formattedDate;

    // Si estamos entre 00:00 y 06:00 y seleccionamos la fecha actual
    if (currentHour >= 0 && currentHour < 6 && dayjs(day.dateString).isSame(now, 'day')) {
      formattedDate = now.subtract(1, 'day').format("D MMM");
    } else {
      formattedDate = dayjs(day.dateString).format("D MMM");
    }

    setSelectedDate(formattedDate);
    setModalVisible(false);
    if (onDateChange) {
      setLoading(true);
      onDateChange(formattedDate);
    }
  };

  // Verifica si la fecha seleccionada es hoy
  const isTodaySelected = () => {
    const now = dayjs();
    const currentHour = now.hour();
    let todayDate;

    // Si estamos entre 00:00 y 06:00, comparar con el día anterior
    if (currentHour >= 0 && currentHour < 6) {
      todayDate = now.subtract(1, 'day').format("D MMM");
    } else {
      todayDate = now.format("D MMM");
    }

    return selectedDate === todayDate;
  };

  const currentStyles = isNightMode ? nightStyles : dayStyles;

  return (
    <View>
      <TouchableOpacity style={currentStyles.dateButton} onPress={() => setModalVisible(true)}>
        <Text style={currentStyles.dateText}>
          {isTodaySelected() ? todayText : selectedDate} {/* Muestra la traducción de "Hoy" */}
        </Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={currentStyles.modalOverlay}
          activeOpacity={1}
          onPressOut={() => setModalVisible(false)}
        >
          <LinearGradient
            colors={isNightMode ? ["#1A1A1A", "#000000"] : ["#FFFFFF", "#F0F0F0"]}
            style={currentStyles.calendarContainer}
          >
            <Calendar
              current={today}
              minDate={today}
              maxDate={maxDate}
              onDayPress={handleDayPress}
              markedDates={{
                [today]: { selected: true, selectedColor: "#DFC8B9" },
              }}
              theme={{
                backgroundColor: "transparent",
                calendarBackground: "transparent",
                textSectionTitleColor: isNightMode ? "#FFFFFF" : "#000000",
                selectedDayBackgroundColor: "black",
                selectedDayTextColor: "#FFFFFF",
                todayTextColor: "black",
                dayTextColor: isNightMode ? "#FFFFFF" : "#000000",
                textDisabledColor: isNightMode ? "#666666" : "#D9E1E8",
                dotColor: "black",
                selectedDotColor: "#FFFFFF",
                arrowColor: "#DFC8B9",
                monthTextColor: isNightMode ? "#FFFFFF" : "#000000",
                textDayFontFamily: "System",
                textMonthFontFamily: "System",
                textDayHeaderFontFamily: "System",
                textDayFontWeight: "300",
                textMonthFontWeight: "bold",
                textDayHeaderFontWeight: "300",
                textDayFontSize: 16,
                textMonthFontSize: 18,
                textDayHeaderFontSize: 14,
              }}
            />
          </LinearGradient>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const baseStyles = StyleSheet.create({
  dateButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
  },
  dateText: {
    fontSize: 14,
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  calendarContainer: {
    width: width * 0.9,
    padding: 20,
    borderRadius: 20,
  },
});

const dayStyles = StyleSheet.create({
  ...baseStyles,
  dateButton: {
    ...baseStyles.dateButton,
    backgroundColor: "#F0F0F0",
  },
  dateText: {
    ...baseStyles.dateText,
    color: "#000000",
  },
});

const nightStyles = StyleSheet.create({
  ...baseStyles,
  dateButton: {
    ...baseStyles.dateButton,
    backgroundColor: "#ebddd5",
  },
  dateText: {
    ...baseStyles.dateText,
    color: "black",
  },
});

export default CalendarPicker;