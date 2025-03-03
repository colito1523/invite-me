
import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { useNavigation } from '@react-navigation/native';

export default function PushNotificationHandler() {
  const navigation = useNavigation();

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      
      // Comprobar si es una notificación de chat para navegar a ChatUsers
      if (data.chatId) {
        navigation.navigate('ChatUsers', { 
          currentChatId: data.chatId,
          recipientUser: {
            id: data.senderName ? data.senderId : null,
            firstName: data.senderName ? data.senderName.split(' ')[0] : '',
            lastName: data.senderName ? data.senderName.split(' ')[1] || '' : '',
            photoUrls: data.senderPhoto ? [data.senderPhoto] : null
          }
        });
      } else {
        // Para otros tipos de notificaciones, navegar a la pantalla Notifications
        navigation.navigate('Notifications');
      }
    });
    
    return () => subscription.remove();
  }, [navigation]);

  return null; // No renderiza nada visual
}
