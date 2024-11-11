import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  SafeAreaView
} from 'react-native';
import { useTranslation } from 'react-i18next';

const { width, height } = Dimensions.get('window');

export default function TermsAndConditionsModal() {
  const [modalVisible, setModalVisible] = useState(false);
  const { t } = useTranslation();

  const openModal = () => setModalVisible(true);
  const closeModal = () => setModalVisible(false);

  return (
    <View>
      <TouchableOpacity onPress={openModal}>
        <Text style={styles.link}>{t('termsAndConditions.link')}</Text>
      </TouchableOpacity>

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <SafeAreaView style={styles.centeredView}>
          <View style={styles.modalView}>
            <ScrollView 
              style={styles.scrollView}
              contentContainerStyle={styles.scrollViewContent}
            >
              <Text style={styles.modalTitle}>{t('termsAndConditions.title')}</Text>
              
              <Text style={styles.updateDate}>
                {t('termsAndConditions.lastUpdated', { date: '07-11-2024' })}
              </Text>

              <Text style={styles.paragraph}>
                {t('termsAndConditions.welcome')}
              </Text>

              <Text style={styles.sectionTitle}>{t('termsAndConditions.sections.generalInfo.title')}</Text>
              <Text style={styles.paragraph}>
                {t('termsAndConditions.sections.generalInfo.content')}
              </Text>

              <Text style={styles.sectionTitle}>{t('termsAndConditions.sections.dataCollection.title')}</Text>
              <Text style={styles.paragraph}>
                {t('termsAndConditions.sections.dataCollection.content')}
              </Text>
              <View style={styles.bulletList}>
                <Text style={styles.bulletItem}>{t('termsAndConditions.sections.dataCollection.bullets.registration')}</Text>
                <Text style={styles.bulletItem}>{t('termsAndConditions.sections.dataCollection.bullets.photos')}</Text>
                <Text style={styles.bulletItem}>{t('termsAndConditions.sections.dataCollection.bullets.location')}</Text>
                <Text style={styles.bulletItem}>{t('termsAndConditions.sections.dataCollection.bullets.notifications')}</Text>
              </View>

              <Text style={styles.sectionTitle}>{t('termsAndConditions.sections.dataProtection.title')}</Text>
              <Text style={styles.paragraph}>
                {t('termsAndConditions.sections.dataProtection.content')}
              </Text>

              <Text style={styles.sectionTitle}>{t('termsAndConditions.sections.acceptableUse.title')}</Text>
              <Text style={styles.paragraph}>
                {t('termsAndConditions.sections.acceptableUse.content')}
              </Text>
              <View style={styles.bulletList}>
                <Text style={styles.bulletItem}>{t('termsAndConditions.sections.acceptableUse.bullets.language')}</Text>
                <Text style={styles.bulletItem}>{t('termsAndConditions.sections.acceptableUse.bullets.harassment')}</Text>
                <Text style={styles.bulletItem}>{t('termsAndConditions.sections.acceptableUse.bullets.content')}</Text>
              </View>

              <Text style={styles.sectionTitle}>{t('termsAndConditions.sections.reporting.title')}</Text>
              <Text style={styles.paragraph}>
                {t('termsAndConditions.sections.reporting.content')}
              </Text>

              <Text style={styles.sectionTitle}>{t('termsAndConditions.sections.userRights.title')}</Text>
              <Text style={styles.paragraph}>
                {t('termsAndConditions.sections.userRights.content')}
              </Text>
              <View style={styles.bulletList}>
                <Text style={styles.bulletItem}>{t('termsAndConditions.sections.userRights.bullets.access')}</Text>
                <Text style={styles.bulletItem}>{t('termsAndConditions.sections.userRights.bullets.deletion')}</Text>
                <Text style={styles.bulletItem}>{t('termsAndConditions.sections.userRights.bullets.permissions')}</Text>
              </View>

              <Text style={styles.sectionTitle}>{t('termsAndConditions.sections.intellectualProperty.title')}</Text>
              <Text style={styles.paragraph}>
                {t('termsAndConditions.sections.intellectualProperty.content')}
              </Text>

              <Text style={styles.sectionTitle}>{t('termsAndConditions.sections.liability.title')}</Text>
              <Text style={styles.paragraph}>
                {t('termsAndConditions.sections.liability.content')}
              </Text>

              <Text style={styles.sectionTitle}>{t('termsAndConditions.sections.modifications.title')}</Text>
              <Text style={styles.paragraph}>
                {t('termsAndConditions.sections.modifications.content')}
              </Text>

              <Text style={styles.sectionTitle}>{t('termsAndConditions.sections.contact.title')}</Text>
              <Text style={styles.paragraph}>
                {t('termsAndConditions.sections.contact.content')}
              </Text>

              <Text style={styles.paragraph}>
                {t('termsAndConditions.agreement')}
              </Text>
            </ScrollView>
            <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
              <Text style={styles.closeButtonText}>{t('termsAndConditions.close')}</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    width: width * 0.9,
    height: height * 0.8,
    backgroundColor: 'white',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    padding: 20,
    paddingBottom: 80,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#333',
  },
  updateDate: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    color: '#333',
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 15,
    color: '#333',
  },
  bulletList: {
    marginLeft: 10,
    marginBottom: 15,
  },
  bulletItem: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 5,
    color: '#333',
  },
  link: {
    color: 'black',
    textDecorationLine: 'underline',
  },
  closeButton: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'black',
    padding: 20,
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});