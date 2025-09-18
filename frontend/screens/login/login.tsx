import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import { useForm, Controller } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { RootStackParamList } from "../../App";

type LoginFormData = {
    email: string;
    password: string;
};

type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "Login">;

const schema = yup.object({
    email: yup.string().email("E-mail inválido").required("E-mail obrigatório"),
    password: yup.string().required("Senha obrigatória"),
});

export default function LoginScreen() {
    const [hidePassword, setHidePassword] = useState(true);
    const navigation = useNavigation<LoginScreenNavigationProp>();

    const { control, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
        resolver: yupResolver(schema),
    });

    const onSubmit = (data: LoginFormData) => {
        console.log(data);
        // Aqui você chamaria a API de login
    };

    return (
        <View style={styles.container}>
            <Text style={styles.logo}>FitLife</Text>
            <Text style={styles.title}>ENTRAR</Text>

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
                    />
                )}
            />
            {errors.email && <Text style={styles.error}>{errors.email.message}</Text>}

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
            {errors.password && <Text style={styles.error}>{errors.password.message}</Text>}

            <TouchableOpacity>
                <Text style={styles.forgot}>Esqueceu sua senha?</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.button} onPress={handleSubmit(onSubmit)}>
                <Text style={styles.buttonText}>Entrar</Text>
            </TouchableOpacity>

            <View style={styles.registerContainer}>
                <Text>Ainda não tem conta? </Text>
                <TouchableOpacity onPress={() => navigation.navigate("Register")}>
                    <Text style={styles.register}>Cadastre-se</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
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
