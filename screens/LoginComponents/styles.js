import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  logoContainer: {
    width: width * 0.4,         // 80% del ancho de la pantalla
    height: width * 0.4,        // Ajusta la altura para mantener la proporción, o defínela según necesites
    marginBottom: 30,
    alignSelf: 'center',        // Esto centra el contenedor dentro del padre
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 40,
    letterSpacing: 1,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: '#f5f5f5',
    borderRadius: 25,
    paddingHorizontal: 20,
    marginBottom: 15,
    fontSize: 16,
    color: '#333',
  
  },
  loginButton: {
    width: '50%',
    height: 50,
    backgroundColor: '#f5f5f5',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  loginButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  forgotPasswordButton: {
    marginBottom: 15,
  },
  forgotPasswordText: {
    fontSize: 12,
  },
  createAccountButton: {
    marginTop: 10,
  },
  createAccountTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  createAccountTextSmall: {
    fontSize: 12,
    fontWeight: '400',
  },
  createAccountTextLarge: {
    fontSize: 16,
    fontWeight: '600',
  },
  languageContainer: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 1,
  },
  languageSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 5,
  },
  selectedLanguage: {
    marginHorizontal: 2,
    fontSize: 14,
    color: '#333',
  },
  languageOptions: {
    position: 'absolute',
    top: '100%',
    right: 0,
    backgroundColor: 'white',
    borderRadius: 10,
    marginTop: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    width: 150,
  },
  languageOption: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  languageOptionText: {
    fontSize: 16,
    color: '#333',
  },
  selectedLanguageText: {
    fontWeight: 'bold',
    color: '#000',
  },
  previewIcon: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#f0f0f0',
    borderRadius: 25,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});

export const lightTheme = {
  background: '#fff',
  text: '#333',
  inputBackground: '#f5f5f5',
  placeholder: '#999',
  icon: 'black',
  buttonBackground: '#f5f5f5',
  link: 'black',
};

export const darkTheme = {
  background: '#000',
  text: '#fff',
  inputBackground: '#1a1a1a',
  placeholder: '#666',
  icon: 'black',
  buttonBackground: '#f5f5f5',
  link: 'black',
};
