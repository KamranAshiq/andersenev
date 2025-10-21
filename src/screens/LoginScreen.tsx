import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ImageBackground,
} from 'react-native';
import { useAuth } from '../context/AuthContext';

const LoginScreen: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const { login, register } = useAuth();

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!username.trim()) {
      newErrors.username = 'Username field is required';
    }
    
    if (!password.trim()) {
      newErrors.password = 'Password field is required';
    }
    
    if (isRegistering) {
      if (!email.trim()) {
        newErrors.email = 'Email field is required';
      } else if (!/\S+@\S+\.\S+/.test(email)) {
        newErrors.email = 'Please enter a valid email address';
      }
      
      if (password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    const success = await login(username.trim(), password);
    if (!success) {
      setErrors({ general: 'Invalid username or password' });
    }
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    const success = await register(username.trim(), email.trim(), password);
    if (!success) {
      setErrors({ general: 'Username already exists' });
    }
  };

  const clearError = (field: string) => {
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleUsernameChange = (text: string) => {
    setUsername(text);
    clearError('username');
  };

  const handleEmailChange = (text: string) => {
    setEmail(text);
    clearError('email');
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    clearError('password');
  };

  return (
    <ImageBackground
      source={require('../assets/auth_bg.jpg')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.header}>
            <Text style={styles.logo}>ANDERSEN</Text>
            <Text style={styles.subtitle}>SMART CHARGING</Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.title}>
              {isRegistering ? 'Create Account' : 'Sign In'}
            </Text>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Username</Text>
              <TextInput
                style={[
                  styles.input,
                  errors.username && styles.inputError
                ]}
                value={username}
                onChangeText={handleUsernameChange}
                placeholder="Enter username"
                placeholderTextColor="rgba(255, 255, 255, 0.7)"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {errors.username && (
                <Text style={styles.errorText}>{errors.username}</Text>
              )}
            </View>

            {isRegistering && (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={[
                    styles.input,
                    errors.email && styles.inputError
                  ]}
                  value={email}
                  onChangeText={handleEmailChange}
                  placeholder="Enter email"
                  placeholderTextColor="rgba(255, 255, 255, 0.7)"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {errors.email && (
                  <Text style={styles.errorText}>{errors.email}</Text>
                )}
              </View>
            )}

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={[
                  styles.input,
                  errors.password && styles.inputError
                ]}
                value={password}
                onChangeText={handlePasswordChange}
                placeholder="Enter password"
                placeholderTextColor="rgba(255, 255, 255, 0.7)"
                secureTextEntry
              />
              {errors.password && (
                <Text style={styles.errorText}>{errors.password}</Text>
              )}
            </View>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={isRegistering ? handleRegister : handleLogin}
            >
              <Text style={styles.primaryButtonText}>
                {isRegistering ? 'Create Account' : 'Sign In'}
              </Text>
            </TouchableOpacity>

            {errors.general && (
              <Text style={styles.generalErrorText}>{errors.general}</Text>
            )}

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => {
                setIsRegistering(!isRegistering);
                setErrors({}); 
              }}
            >
              <Text style={styles.secondaryButtonText}>
                {isRegistering
                  ? 'Already have an account? Sign In'
                  : "Don't have an account? Register"}
              </Text>
            </TouchableOpacity>

            {!isRegistering && (
              <View style={styles.demoContainer}>
                <Text style={styles.demoText}>Demo Credentials:</Text>
                <Text style={styles.demoCredentials}>Username: demo</Text>
                <Text style={styles.demoCredentials}>Password: demo123</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 64,
  },
  logo: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  subtitle: {
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  form: {
    backgroundColor: 'rgba(30, 30, 30, 0.7)',
    borderRadius: 16,
    padding: 32,
    marginHorizontal: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 0,
  },
  inputError: {
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  primaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    alignItems: 'center',
    padding: 8,
  },
  secondaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  demoContainer: {
    marginTop: 32,
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6', 
  },
  demoText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF', 
    marginBottom: 4,
  },
  demoCredentials: {
    fontSize: 14,
    color: '#FFFFFF',
    fontFamily: 'monospace',
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
    marginLeft: 4,
  },
  generalErrorText: {
    fontSize: 14,
    color: '#EF4444', 
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
});

export default LoginScreen;
