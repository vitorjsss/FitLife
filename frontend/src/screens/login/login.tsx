import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import { useForm, Controller, set, SubmitHandler } from "react-hook-form";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { RootStackParamList } from "../../../App";
import { authService } from '../../services/authService';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useUser } from '../../context/UserContext';
import { validateLoginCredentials, normalizeEmail } from '../../utils/validationRules';

type LoginFormData = {
    email: string;
    password: string;

};

type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "Login">;

export default function LoginScreen() {
    const { refreshUser } = useUser();
    const [hidePassword, setHidePassword] = useState(true);
    const [loading, setLoading] = useState(false);
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
    const navigation = useNavigation<LoginScreenNavigationProp>();

    const { control, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
        defaultValues: {
            email: "",
            password: "",
        },
    });

    const onSubmit: SubmitHandler<LoginFormData> = async (data) => {
        // Validar credenciais com validationRules
        const validation = validateLoginCredentials({
            email: data.email,
            password: data.password
        });

        if (!validation.valid) {
            setValidationErrors(validation.errors);
            return;
        }

        setValidationErrors({});
        setLoading(true);
        try {
            const loginData = {
                email: normalizeEmail(data.email),
                password: data.password,
            };

            // chamada pro back
            const token = await authService.login(loginData);

            if (token) {
                console.log("Login bem-sucedido:", token);

                // Decodifica o token para obter o userRole
                const decoded = authService.decodeToken(token.accessToken);
                const userRole = decoded?.user_type;

                // força o contexto a recarregar os dados do usuário
                if (refreshUser) await refreshUser();

                // Redireciona baseado no tipo de usuário
                if (userRole === 'Nutricionist') {
                    navigation.replace("NutricionistHome");
                } else if (userRole === 'Physical_educator') {
                    navigation.replace("PhysicalEducatorHome");
                } else {
                    // Patient ou qualquer outro tipo
                    navigation.replace("Home");
                }
            } else {
                alert("Credenciais inválidas.");
            }
        } catch (error) {
            console.error("Erro no login:", error);
            alert("Falha no login. Verifique suas credenciais.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1, backgroundColor: "#fff" }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView
                contentContainerStyle={styles.container}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <Text style={styles.logo}>FitLife</Text>
                <Text style={styles.title}>Entrar</Text>

                <Controller
                    control={control}
                    name="email"
                    render={({ field: { onChange, value } }) => (
                        <TextInput
                            placeholder="E-mail ou número de telefone"
                            style={styles.input}
                            value={value}
                            onChangeText={onChange}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                    )}
                />
                {validationErrors.email && <Text style={styles.error}>{validationErrors.email}</Text>}

                <Controller
                    control={control}
                    name="password"
                    render={({ field: { onChange, value } }) => (
                        <View style={styles.passwordContainer}>
                            <TextInput
                                placeholder="Digite sua senha"
                                style={styles.inputPassword}
                                secureTextEntry={hidePassword}
                                value={value}
                                onChangeText={onChange}
                            />
                            <TouchableOpacity onPress={() => setHidePassword(!hidePassword)}>
                                <Icon name={hidePassword ? "eye-off" : "eye"} size={20} color="gray" />
                            </TouchableOpacity>
                        </View>
                    )}
                />
                {validationErrors.password && <Text style={styles.error}>{validationErrors.password}</Text>}

                <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                    <Text style={styles.forgot}>Esqueceu sua senha?</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.button, loading && { opacity: 0.7 }]} onPress={handleSubmit(onSubmit)} disabled={loading}>
                    <Text style={styles.buttonText}>{loading ? "Entrando..." : "Entrar"}</Text>
                </TouchableOpacity>

                <View style={styles.registerContainer}>
                    <Text>Ainda não tem conta? </Text>
                    <TouchableOpacity onPress={() => navigation.navigate("Register")}>
                        <Text style={styles.register}>Cadastre-se</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        padding: 20,
        paddingBottom: 40,
        justifyContent: "center",
        backgroundColor: "#fff",
    },
    logo: {
        fontSize: 32,
        fontWeight: "bold",
        color: "#40C4FF",
        alignSelf: "center",
        marginBottom: 50,
    },
    title: {
        fontWeight: "bold",
        fontSize: 18,
        marginBottom: 20,
        alignSelf: "center",
    },
    input: {
        borderWidth: 1,
        borderColor: "#ddd",
        padding: 14,
        borderRadius: 8,
        marginBottom: 10,
    },
    passwordContainer: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#ddd",
        paddingHorizontal: 12,
        borderRadius: 8,
        marginBottom: 10,
    },
    inputPassword: {
        flex: 1,
        paddingVertical: 12,
    },
    forgot: {
        alignSelf: "flex-end",
        color: "#40C4FF",
        marginBottom: 40,
    },
    button: {
        backgroundColor: "#40C4FF",
        padding: 15,
        borderRadius: 8,
        alignItems: "center",
    },
    buttonText: {
        color: "#fff",
        fontWeight: "bold",
    },
    registerContainer: {
        flexDirection: "row",
        justifyContent: "center",
        marginTop: 20,
    },
    register: {
        color: "#40C4FF",
        fontWeight: "bold",
    },
    error: {
        color: "red",
        marginBottom: 5,
    },
});