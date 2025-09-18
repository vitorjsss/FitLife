import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import { useForm, Controller } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { useNavigation } from "@react-navigation/native";
import type { SubmitHandler } from "react-hook-form";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import type { RootStackParamList } from "../../../App";

type RegisterScreenNavigationProp = NativeStackNavigationProp<
    RootStackParamList,
    "Register"
>;

type RegisterFormData = {
    name: string;
    email: string;
    phone: string;
    birthdate: string;
    password: string;
    confirmPassword?: string;
    cref?: string;
};

const schema = yup.object({
    name: yup.string().required("Nome obrigatório"),
    email: yup.string().email("E-mail inválido").required("E-mail obrigatório"),
    phone: yup.string().required("Telefone obrigatório"),
    birthdate: yup.string().required("Data de nascimento obrigatória"),
    password: yup.string().required("Senha obrigatória"),
    confirmPassword: yup
        .string()
        .oneOf([yup.ref("password")], "As senhas não coincidem"),
    cref: yup.string().notRequired(),
});

export default function RegisterScreen() {
    const [hidePassword, setHidePassword] = useState(true);
    const [hideConfirmPassword, setHideConfirmPassword] = useState(true);

    const navigation = useNavigation<RegisterScreenNavigationProp>();

    const {
        control,
        handleSubmit,
        formState: { errors },
    } = useForm<RegisterFormData>({
        resolver: yupResolver(schema) as any,
    });



    const onSubmit: SubmitHandler<RegisterFormData> = (data) => {
        console.log(data);
        // Aqui você faria a chamada da API para cadastrar
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
                        placeholder="Nome completo"
                        style={styles.input}
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
                        placeholder="E-mail"
                        style={styles.input}
                        keyboardType="email-address"
                        value={value}
                        onChangeText={onChange}
                    />
                )}
            />
            {errors.email && <Text style={styles.error}>{errors.email.message}</Text>}

            {/* Telefone */}
            <Controller
                control={control}
                name="phone"
                render={({ field: { onChange, value } }) => (
                    <TextInput
                        placeholder="Número de telefone"
                        style={styles.input}
                        keyboardType="phone-pad"
                        value={value}
                        onChangeText={onChange}
                    />
                )}
            />
            {errors.phone && <Text style={styles.error}>{errors.phone.message}</Text>}

            {/* Data de Nascimento */}
            <Controller
                control={control}
                name="birthdate"
                render={({ field: { onChange, value } }) => (
                    <TextInput
                        placeholder="Data de Nascimento"
                        style={styles.input}
                        value={value}
                        onChangeText={onChange}
                    />
                )}
            />
            {errors.birthdate && (
                <Text style={styles.error}>{errors.birthdate.message}</Text>
            )}

            {/* Senha */}
            <Controller
                control={control}
                name="password"
                render={({ field: { onChange, value } }) => (
                    <View style={styles.passwordContainer}>
                        <TextInput
                            placeholder="Crie sua senha"
                            style={styles.inputPassword}
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
                            placeholder="Confirme sua senha"
                            style={styles.inputPassword}
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

            {/* CRN/CREF */}
            <Controller
                control={control}
                name="cref"
                render={({ field: { onChange, value } }) => (
                    <TextInput
                        placeholder="CRN / CREF (opcional)"
                        style={styles.input}
                        value={value}
                        onChangeText={onChange}
                    />
                )}
            />

            {/* Botão Cadastrar */}
            <TouchableOpacity style={styles.button} onPress={handleSubmit(onSubmit)}>
                <Text style={styles.buttonText}>Cadastrar</Text>
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
        backgroundColor: "#ffffffff",
    },
    passwordContainer: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#ddd",
        paddingHorizontal: 12,
        borderRadius: 8,
        marginBottom: 10,
        backgroundColor: "#ffffffff",
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
    },
});
