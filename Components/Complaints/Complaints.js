import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

const reportReasons = [
  'Spam',
  'Contenido inapropiado',
  'Acoso o intimidación',
  'Lenguaje abusivo',
  'Violencia o amenazas',
  'Otros motivos',
];

export default function Complaints({ isVisible, onClose, onSubmit }) {
  const [selectedReason, setSelectedReason] = useState('');
  const [description, setDescription] = useState('');
  const { t } = useTranslation();

  const handleSubmit = () => {
    if (selectedReason) {
      onSubmit(selectedReason, selectedReason === 'Otros motivos' ? description : '');
      setSelectedReason('');
      setDescription('');
    } else {
      Alert.alert(t('errorTitle'), t('selectReasonError'));
    }
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <TouchableOpacity style={styles.modalContainer} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity style={styles.modalContent} activeOpacity={1}>
          <Text style={styles.title}>{t('reportUser')}</Text>
          <Text style={styles.subtitle}>{t('reportUserConfirmation')}</Text>
          <ScrollView style={styles.reasonsContainer}>
            {reportReasons.map((reason) => (
              <TouchableOpacity
                key={reason}
                style={[
                  styles.reasonButton,
                  selectedReason === reason && styles.selectedReason,
                ]}
                onPress={() => setSelectedReason(reason)}
              >
                <Text style={styles.reasonText}>{t(`reportReasons.${reason}`)}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {selectedReason === 'Otros motivos' && (
            <TextInput
              style={styles.descriptionInput}
              placeholder={t('describeReasonPlaceholder')}
              multiline
              maxLength={500}
              value={description}
              onChangeText={setDescription}
            />
          )}
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>{t('sendReport')}</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}
const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 50,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    marginVertical: 20,
    textAlign: 'center',
    fontWeight: "bold",
    color: '#666',
  },
  reasonsContainer: {
    marginBottom: 20,
  },
  reasonButton: {
    padding: 10,
    borderRadius: 70,
    marginVertical: 10,
    width: '80%',  // Cambia este valor según el tamaño que desees
    alignSelf: 'center',  // Asegura que el botón esté centrado
  },
  selectedReason: {
    backgroundColor: '#e0e0e0',
  },
  reasonText: {
    fontSize: 16,
     textAlign: 'center',
    fontWeight: "bold"
  },
  descriptionInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
    maxHeight: 100,
  },
  submitButton: {
    backgroundColor: '#e0e0e0',
    padding: 10,
    borderRadius: 70,
    alignItems: 'center',
    width: '60%',  // Cambia este valor según el tamaño que desees
    alignSelf: 'center',
  },
  submitButtonText: {
    color: 'black',
    fontSize: 16,
    fontWeight: 'bold',
  },
});