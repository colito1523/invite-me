
import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { useNavigation } from '@react-navigation/native';

export default function PushNotificationHandler() {
  const navigation = useNavigation();

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      
      // Navigate to Notifications screen for all notification types
      navigation.navigate('Notifications');
    });
    
    return () => subscription.remove();
  }, [navigation]);

  return null; // No renderiza nada visual
}
