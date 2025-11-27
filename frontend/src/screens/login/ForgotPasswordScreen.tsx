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
  ActivityIndicator,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../App';
import { requestPasswordReset, verifyPasswordResetCode, resetPassword } from '../../services/passwordResetService';

type ForgotPasswordScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ForgotPassword'>;

export default function ForgotPasswordScreen() {
  const navigation = useNavigation<ForgotPasswordScreenNavigationProp>();
  const [step, setStep] = useState<'email' | 'code' | 'newPassword'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [hideNewPassword, setHideNewPassword] = useState(true);
  const [hideConfirmPassword, setHideConfirmPassword] = useState(true);
  const [authId, setAuthId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validateEmail = (email: string) => {
    const emailRegex = /^[\w-.]+@[\w-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string) => {
    // Mínimo 8 caracteres, 1 maiúscula, 1 minúscula, 1 número, 1 caractere especial
    const minLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return {
      isValid: minLength && hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar,
      minLength,
      hasUpperCase,
      hasLowerCase,
      hasNumber,
      hasSpecialChar,
    };
  };

  const handleRequestCode = async () => {
    if (!validateEmail(email)) {
      setError('Email inválido');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await requestPasswordReset(email);
      setAuthId(String(response.authId));
      setStep('code');
      Alert.alert(
        'Código Enviado',
        'Um código de verificação foi enviado para seu email. Verifique sua caixa de entrada e spam.'
      );
    } catch (err: any) {
      const message = err?.response?.data?.message || err.message || 'Erro ao enviar código';
      setError(message);
      Alert.alert('Erro', message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!authId || code.length !== 6) {
      setError('Digite o código de 6 dígitos');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await verifyPasswordResetCode(authId, code);
      setStep('newPassword');
      Alert.alert('Código Verificado', 'Agora você pode definir sua nova senha.');
    } catch (err: any) {
      const message = err?.response?.data?.message || err.message || 'Código inválido ou expirado';
      setError(message);
      Alert.alert('Erro', message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    const validation = validatePassword(newPassword);

    if (!validation.isValid) {
      setError('A senha não atende aos requisitos de segurança');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    if (!authId || !code) {
      setError('Sessão inválida. Tente novamente.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await resetPassword(authId, code, newPassword);
      Alert.alert(
        'Senha Alterada!',
        'Sua senha foi alterada com sucesso. Faça login com a nova senha.',
        [
          {
            text: 'OK',
            onPress: () => navigation.replace('Login'),
          },
        ]
      );
    } catch (err: any) {
      const message = err?.response?.data?.message || err.message || 'Erro ao redefinir senha';
      setError(message);
      Alert.alert('Erro', message);
    } finally {
      setLoading(false);
    }
  };

  const renderPasswordRequirements = () => {
    const validation = validatePassword(newPassword);
    
    return (
      <View style={styles.requirementsBox}>
        <Text style={styles.requirementsTitle}>Requisitos da senha:</Text>
        <RequirementItem met={validation.minLength} text="Mínimo de 8 caracteres" />
        <RequirementItem met={validation.hasUpperCase} text="Pelo menos 1 letra maiúscula" />
        <RequirementItem met={validation.hasLowerCase} text="Pelo menos 1 letra minúscula" />
        <RequirementItem met={validation.hasNumber} text="Pelo menos 1 número" />
        <RequirementItem met={validation.hasSpecialChar} text="Pelo menos 1 caractere especial (!@#$...)" />
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#fff' }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Back Button */}
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color="#1976D2" />
        </TouchableOpacity>

        {/* Logo */}
        <Text style={styles.logo}>FitLife</Text>

        <Text style={styles.title}>
          {step === 'email' && 'Recuperar Senha'}
          {step === 'code' && 'Verificar Código'}
          {step === 'newPassword' && 'Nova Senha'}
        </Text>

        <Text style={styles.subtitle}>
          {step === 'email' && 'Digite seu email para receber o código de recuperação'}
          {step === 'code' && 'Digite o código de 6 dígitos enviado para seu email'}
          {step === 'newPassword' && 'Digite sua nova senha'}
        </Text>

        {/* Step 1: Email Input */}
        {step === 'email' && (
          <>
            <TextInput
              placeholder="Digite seu email"
              style={styles.input}
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setError(null);
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
            />

            {error && <Text style={styles.error}>{error}</Text>}

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleRequestCode}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Enviar Código</Text>
              )}
            </TouchableOpacity>
          </>
        )}

        {/* Step 2: Code Verification */}
        {step === 'code' && (
          <>
            <View style={styles.emailInfo}>
              <Icon name="mail" size={20} color="#1976D2" />
              <Text style={styles.emailText}>{email}</Text>
            </View>

            <TextInput
              placeholder="Código de 6 dígitos"
              style={styles.input}
              value={code}
              onChangeText={(text) => {
                setCode(text);
                setError(null);
              }}
              keyboardType="numeric"
              maxLength={6}
              editable={!loading}
            />

            {error && <Text style={styles.error}>{error}</Text>}

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleVerifyCode}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Verificar Código</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.resendButton}
              onPress={handleRequestCode}
              disabled={loading}
            >
              <Text style={styles.resendText}>Reenviar código</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Step 3: New Password */}
        {step === 'newPassword' && (
          <>
            <View style={styles.passwordContainer}>
              <TextInput
                placeholder="Nova senha"
                style={styles.inputPassword}
                secureTextEntry={hideNewPassword}
                value={newPassword}
                onChangeText={(text) => {
                  setNewPassword(text);
                  setError(null);
                }}
                editable={!loading}
              />
              <TouchableOpacity onPress={() => setHideNewPassword(!hideNewPassword)}>
                <Icon name={hideNewPassword ? 'eye-off' : 'eye'} size={20} color="gray" />
              </TouchableOpacity>
            </View>

            {newPassword.length > 0 && renderPasswordRequirements()}

            <View style={styles.passwordContainer}>
              <TextInput
                placeholder="Confirmar nova senha"
                style={styles.inputPassword}
                secureTextEntry={hideConfirmPassword}
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  setError(null);
                }}
                editable={!loading}
              />
              <TouchableOpacity onPress={() => setHideConfirmPassword(!hideConfirmPassword)}>
                <Icon name={hideConfirmPassword ? 'eye-off' : 'eye'} size={20} color="gray" />
              </TouchableOpacity>
            </View>

            {error && <Text style={styles.error}>{error}</Text>}

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleResetPassword}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Redefinir Senha</Text>
              )}
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity
          style={styles.backToLoginButton}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.backToLoginText}>Voltar para o login</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const RequirementItem: React.FC<{ met: boolean; text: string }> = ({ met, text }) => (
  <View style={styles.requirementItem}>
    <Icon name={met ? 'check-circle' : 'circle'} size={16} color={met ? '#4CAF50' : '#CCC'} />
    <Text style={[styles.requirementText, met && styles.requirementTextMet]}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 40,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    padding: 8,
    zIndex: 10,
  },
  logo: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#40C4FF',
    alignSelf: 'center',
    marginBottom: 50,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 8,
    alignSelf: 'center',
    color: '#222',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 30,
    lineHeight: 20,
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 14,
    borderRadius: 8,
    marginBottom: 16,
    fontSize: 15,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  inputPassword: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
  },
  button: {
    backgroundColor: '#40C4FF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: '#B0BEC5',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  error: {
    color: '#D32F2F',
    marginBottom: 12,
    fontSize: 14,
  },
  emailInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  emailText: {
    marginLeft: 8,
    color: '#1976D2',
    fontSize: 14,
    fontWeight: '600',
  },
  resendButton: {
    alignSelf: 'center',
    marginTop: 16,
    padding: 8,
  },
  resendText: {
    color: '#40C4FF',
    fontSize: 14,
    fontWeight: '600',
  },
  requirementsBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  requirementsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  requirementText: {
    marginLeft: 8,
    fontSize: 13,
    color: '#666',
  },
  requirementTextMet: {
    color: '#4CAF50',
  },
  backToLoginButton: {
    alignSelf: 'center',
    marginTop: 24,
    padding: 8,
  },
  backToLoginText: {
    color: '#666',
    fontSize: 14,
  },
});
