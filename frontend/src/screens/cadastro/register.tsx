import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Alert,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import { useForm, Controller, SubmitHandler } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import type { RootStackParamList } from "../../../App";
import { authService } from "../../service/authService";

type RegisterScreenNavigationProp = NativeStackNavigationProp<
    RootStackParamList,
    "Register"
>;

type RegisterFormData = {
    name: string;
    email: string;
    password: string;
    confirmPassword?: string;
};

const schema = yup.object({
    name: yup.string().required("Nome obrigatório"),
    email: yup.string().email("E-mail inválido").required("E-mail obrigatório"),
    password: yup.string().min(6, "Mínimo 6 caracteres").required("Senha obrigatória"),
    confirmPassword: yup
        .string()
        .oneOf([yup.ref("password")], "As senhas não coincidem"),
});

export default function RegisterScreen() {
    const [loading, setLoading] = useState(false);
    const [hidePassword, setHidePassword] = useState(true);
    const [hideConfirmPassword, setHideConfirmPassword] = useState(true);

    const navigation = useNavigation<RegisterScreenNavigationProp>();

    const {
        control,
        handleSubmit,
        formState: { errors },
    } = useForm<RegisterFormData>({
        resolver: yupResolver(schema),
        defaultValues: {
            name: "",
            email: "",
            password: "",
            confirmPassword: "",
        },
    });

    const onSubmit: SubmitHandler<RegisterFormData> = async (data) => {
        setLoading(true);
        try {
            const registerData = {
                username: data.name,
                email: data.email,
                password: data.password,
                user_type: "Patient",
            };
            const token = await authService.register(registerData);
            console.log("Cadastro realizado com sucesso:", token);
            Alert.alert("Sucesso", "Conta criada com sucesso!");
            navigation.navigate("Login");
        } catch (error: any) {
            console.error("Erro ao cadastrar:", error);
            Alert.alert("Erro", "Não foi possível cadastrar. Tente novamente.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.logo}>FitLife</Text>
            <Text style={styles.title}>Crie sua conta</Text>

            {/* Nome */}
            <Controller
                control={control}
                name="name"
                render={({ field: { onChange, value } }) => (
                    <TextInput
                        style={styles.input}
                        placeholder="Nome completo"
                        value={value}
                        onChangeText={onChange}
                    />
                )}
            />
            {errors.name && <Text style={styles.error}>{errors.name.message}</Text>}

            {/* Email */}
            <Controller
                control={control}
                name="email"
                render={({ field: { onChange, value } }) => (
                    <TextInput
                        style={styles.input}
                        placeholder="E-mail"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        value={value}
                        onChangeText={onChange}
                    />
                )}
            />
            {errors.email && <Text style={styles.error}>{errors.email.message}</Text>}

            {/* Senha */}
            <Controller
                control={control}
                name="password"
                render={({ field: { onChange, value } }) => (
                    <View style={styles.passwordContainer}>
                        <TextInput
                            style={styles.inputPassword}
                            placeholder="Crie sua senha"
                            secureTextEntry={hidePassword}
                            value={value}
                            onChangeText={onChange}
                        />
                        <TouchableOpacity onPress={() => setHidePassword(!hidePassword)}>
                            <Icon
                                name={hidePassword ? "eye-off" : "eye"}
                                size={20}
                                color="gray"
                            />
                        </TouchableOpacity>
                    </View>
                )}
            />
            {errors.password && (
                <Text style={styles.error}>{errors.password.message}</Text>
            )}

            {/* Confirmar Senha */}
            <Controller
                control={control}
                name="confirmPassword"
                render={({ field: { onChange, value } }) => (
                    <View style={styles.passwordContainer}>
                        <TextInput
                            style={styles.inputPassword}
                            placeholder="Confirme sua senha"
                            secureTextEntry={hideConfirmPassword}
                            value={value}
                            onChangeText={onChange}
                        />
                        <TouchableOpacity
                            onPress={() => setHideConfirmPassword(!hideConfirmPassword)}
                        >
                            <Icon
                                name={hideConfirmPassword ? "eye-off" : "eye"}
                                size={20}
                                color="gray"
                            />
                        </TouchableOpacity>
                    </View>
                )}
            />
            {errors.confirmPassword && (
                <Text style={styles.error}>{errors.confirmPassword.message}</Text>
            )}

            {/* Botão Cadastrar */}
            <TouchableOpacity
                style={[styles.button, loading && { opacity: 0.7 }]}
                onPress={handleSubmit(onSubmit)}
                disabled={loading}
            >
                <Text style={styles.buttonText}>
                    {loading ? "Cadastrando..." : "Cadastrar"}
                </Text>
            </TouchableOpacity>

            {/* Voltar */}
            <TouchableOpacity onPress={() => navigation.goBack()}>
                <Text style={styles.back}>VOLTAR</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        padding: 20,
        justifyContent: "center",
        backgroundColor: "#fff",
    },
    logo: {
        fontSize: 32,
        fontWeight: "bold",
        color: "#40C4FF",
        alignSelf: "center",
        marginBottom: 20,
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
        backgroundColor: "#fff",
    },
    passwordContainer: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#ddd",
        paddingHorizontal: 12,
        borderRadius: 8,
        marginBottom: 10,
        backgroundColor: "#fff",
    },
    inputPassword: {
        flex: 1,
        paddingVertical: 12,
    },
    button: {
        backgroundColor: "#40C4FF",
        padding: 15,
        borderRadius: 8,
        alignItems: "center",
        marginTop: 20,
    },
    buttonText: {
        color: "#fff",
        fontWeight: "bold",
    },
    back: {
        alignSelf: "center",
        color: "#40C4FF",
        marginTop: 15,
    },
    error: {
        color: "red",
        marginBottom: 5,
        fontSize: 13,
    },
});
