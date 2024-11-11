import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useTranslation } from 'react-i18next';

const BusinessHours = ({ hours, isCustomEvent }) => {
  const { t } = useTranslation();
  const [showAll, setShowAll] = useState(false);
  const [isNightMode, setIsNightMode] = useState(false);
  const currentStyles = isNightMode ? nightStyles : dayStyles;

  useEffect(() => {
    const checkTime = () => {
      const currentHour = new Date().getHours();
      if (currentHour >= 19 || currentHour < 6) {
        setIsNightMode(true);
      } else {
        setIsNightMode(false);
      }
    };

    checkTime();
    const interval = setInterval(checkTime, 60000);

    return () => clearInterval(interval);
  }, []);

  if (isCustomEvent) {
    const entries = Object.entries(hours);
    
    if (entries.length === 0) {
      return (
        <View style={currentStyles.container}>
          <View style={currentStyles.hr} />
          <Text style={currentStyles.title}>{t('businessHours.noHoursFound')}</Text>
          <View style={currentStyles.hr} />
        </View>
      );
    }

    const [day, time] = entries[0];
    return (
      <View style={currentStyles.container}>
        <View style={currentStyles.hr} />
        <Text style={currentStyles.title}>{t('businessHours.customEvent')}</Text>
        <View style={currentStyles.row}>
          <Text style={currentStyles.day}>{t(`days.${day}`)}:</Text>
          <Text style={currentStyles.time}>{time}</Text>
        </View>
        <View style={currentStyles.hr} />
      </View>
    );
  }

  const initialDays = [t('days.Saturday'), t('days.Sunday')];
  const otherDays = Object.entries(hours).filter(([day]) => !initialDays.includes(t(`days.${day}`)));

  const handleShowMore = () => {
    setShowAll(!showAll);
  };

  return (
    <View style={currentStyles.container}>
      <View style={currentStyles.hr} />
      
      <Text style={currentStyles.title}>{t('businessHours.operatingHours')}</Text>
      
      {initialDays.map((day) => (
        <View key={day} style={currentStyles.row}>
          <Text style={currentStyles.day}>{day}:</Text>
          <Text style={currentStyles.time}>{hours[day.split('.')[1]]}</Text>
        </View>
      ))}
      
      {showAll &&
        otherDays.map(([day, time]) => (
          <View key={day} style={currentStyles.row}>
            <Text style={currentStyles.day}>{t(`days.${day}`)}:</Text>
            <Text style={currentStyles.time}>{time}</Text>
          </View>
        ))
      }
      
      <TouchableOpacity onPress={handleShowMore}>
        <Text style={currentStyles.showMoreButton}>
          {showAll ? t('businessHours.showLess') : t('businessHours.showMore')}
        </Text>
      </TouchableOpacity>
      
      <View style={currentStyles.hr} />
    </View>
  );
};

const dayStyles = StyleSheet.create({
  hr: {
    borderBottomColor: 'black',
    borderBottomWidth: 1,
    marginVertical: 10,
  },
  container: {
    width: "100%",
  },
  title: {
    fontSize: 15,
    color: "black",
    fontWeight: "bold",
    marginVertical: 20,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 15,
  },
  day: {
    fontSize: 13,
    fontWeight: "bold",
    color: "black",
  },
  time: {
    fontSize: 13,
    fontWeight: "bold",
    color: "black",
  },
  showMoreButton: {
    fontSize: 15,
    color: 'black',
    fontWeight: "bold",
    textAlign: 'center',
    marginVertical: 10,
  },
});

const nightStyles = StyleSheet.create({
  hr: {
    borderBottomColor: '#ccc',
    borderBottomWidth: 1,
    marginVertical: 10,
  },
  container: {
    width: "100%",
  },
  title: {
    fontSize: 15,
    color: "white",
    fontWeight: "bold",
    marginVertical: 20,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 15,
  },
  day: {
    fontSize: 13,
    fontWeight: "bold",
    color: "white",
  },
  time: {
    fontSize: 13,
    fontWeight: "bold",
    color: "white",
  },
  showMoreButton: {
    fontSize: 15,
    color: 'white',
    fontWeight: "bold",
    textAlign: 'center',
    marginVertical: 10,
  },
});

export default BusinessHours;