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
import { authService } from "../../services/authService";
import { patientService } from "../../services/PatientService";
import { nutricionistService } from "../../services/NutricionistService";
import { physicalEducatorService } from "../../services/PhysicalEducatorService";

type RegisterScreenNavigationProp = NativeStackNavigationProp<
    RootStackParamList,
    "Register"
>;

type UserType = "Patient" | "Nutricionist" | "Physical_educator";

type RegisterFormData = {
    name: string;
    email: string;
    password: string;
    confirmPassword?: string;
    birthdate?: string;
    sex?: string;
    contact?: string;
    crn?: string; // Nutricionista
    cref?: string; // Educador Físico
    userType: UserType;
};

const schema = yup.object({
    name: yup.string().required("Nome obrigatório"),
    email: yup.string().email("E-mail inválido").required("E-mail obrigatório"),
    password: yup.string().min(6, "Mínimo 6 caracteres").required("Senha obrigatória"),
    confirmPassword: yup.string().oneOf([yup.ref("password")], "As senhas não coincidem"),
    birthdate: yup.string().when("userType", {
        is: (val: UserType) => val !== "",
        then: (schema) => schema.required("Data de nascimento obrigatória"),
    }),
    sex: yup.string().required("Sexo obrigatório"),
    contact: yup.string().when("userType", {
        is: (val: UserType) => val !== "",
        then: (schema) => schema.required("Contato obrigatório"),
    }),
    crn: yup.string().when("userType", {
        is: (val: UserType) => val === "Nutricionist",
        then: (schema) => schema.required("CRN obrigatório"),
    }),
    cref: yup.string().when("userType", {
        is: (val: UserType) => val === "Physical_educator",
        then: (schema) => schema.required("CREF obrigatório"),
    }),
    userType: yup.string().required("Selecione o tipo de usuário"),
});

export default function RegisterScreen() {
    const [loading, setLoading] = useState(false);
    const [hidePassword, setHidePassword] = useState(true);
    const [hideConfirmPassword, setHideConfirmPassword] = useState(true);
    const [selectedType, setSelectedType] = useState<UserType | null>(null);

    const navigation = useNavigation<RegisterScreenNavigationProp>();

    const {
        control,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<RegisterFormData>({
        resolver: yupResolver(schema),
        defaultValues: {
            name: "",
            email: "",
            password: "",
            confirmPassword: "",
            userType: "Patient",
        },
    });

    const userType = watch("userType");

    // Atualiza selectedType ao mudar userType
    React.useEffect(() => {
        setSelectedType(userType as UserType);
    }, [userType]);

    const onSubmit: SubmitHandler<RegisterFormData> = async (data) => {
        setLoading(true);
        try {
            // 1️⃣ Registrar usuário
            const registerData = {
                username: data.name,
                email: data.email,
                password: data.password,
                user_type: data.userType,
            };
            const authRes = await authService.register(registerData);
            const auth_id = authRes?.id || authRes?.userId;

            if (!auth_id) throw new Error("Erro ao obter ID do usuário cadastrado");
            console.log("Usuário Auth criado com ID:", auth_id);

            // 2️⃣ Logar para obter token
            const loginRes = await authService.login({
                email: data.email,
                password: data.password,
            });
            const token = loginRes.accessToken;
            console.log("Token recebido:", token);

            if (!token) throw new Error("Erro ao obter token após login");

            const config = { headers: { Authorization: `Bearer ${token}` } };

            // 3️⃣ Criar registro específico no backend
            if (data.userType === "Patient") {
                await patientService.create(
                    {
                        name: data.name,
                        birthdate: data.birthdate!,
                        sex: data.sex!,
                        contact: data.contact!,
                        auth_id,
                    },
                    config
                );
            } else if (data.userType === "Nutricionist") {
                await nutricionistService.create(
                    {
                        name: data.name,
                        birthdate: data.birthdate!,
                        sex: data.sex!,
                        contact: data.contact!,
                        crn: data.crn!,
                        auth_id,
                    },
                    config
                );
            } else if (data.userType === "Physical_educator") {
                await physicalEducatorService.create(
                    {
                        name: data.name,
                        birthdate: data.birthdate!,
                        sex: data.sex!,
                        contact: data.contact!,
                        cref: data.cref!,
                        auth_id,
                    },
                    config
                );
            }

            Alert.alert("Sucesso", "Conta criada com sucesso!");
            navigation.navigate("Login");
        } catch (error: any) {
            console.error("Erro ao cadastrar:", error.response?.data || error);
            Alert.alert("Erro", "Não foi possível cadastrar. Tente novamente.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.logo}>FitLife</Text>
            <Text style={styles.title}>Crie sua conta</Text>

            {/* Seleção do tipo de usuário */}
            <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 16 }}>
                {["Patient", "Nutricionist", "Physical_educator"].map((type) => (
                    <TouchableOpacity
                        key={type}
                        style={[
                            styles.typeButton,
                            userType === type && styles.typeButtonSelected,
                        ]}
                        onPress={() => setValue("userType", type as UserType)}
                    >
                        <Text style={[
                            styles.typeButtonText,
                            userType === type && styles.typeButtonTextSelected,
                        ]}>
                            {type === "Patient" ? "Paciente" : type === "Nutricionist" ? "Nutricionista" : "Educador Físico"}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
            {errors.userType && <Text style={styles.error}>{errors.userType.message}</Text>}

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

            {/* Campos dinâmicos */}
            {/* Data de nascimento */}
            <Controller
                control={control}
                name="birthdate"
                render={({ field: { onChange, value } }) => (
                    <TextInput
                        style={styles.input}
                        placeholder="Data de nascimento (YYYY-MM-DD)"
                        value={value}
                        onChangeText={onChange}
                    />
                )}
            />
            {errors.birthdate && <Text style={styles.error}>{errors.birthdate.message}</Text>}

            {/* Contato */}
            <Controller
                control={control}
                name="contact"
                render={({ field: { onChange, value } }) => (
                    <TextInput
                        style={styles.input}
                        placeholder="Contato (telefone, email, etc)"
                        value={value}
                        onChangeText={onChange}
                    />
                )}
            />
            {errors.contact && <Text style={styles.error}>{errors.contact.message}</Text>}

            {/* CRN (Nutricionista) */}
            {userType === "Nutricionist" && (
                <Controller
                    control={control}
                    name="crn"
                    render={({ field: { onChange, value } }) => (
                        <TextInput
                            style={styles.input}
                            placeholder="CRN"
                            value={value}
                            onChangeText={onChange}
                        />
                    )}
                />
            )}
            {errors.crn && <Text style={styles.error}>{errors.crn.message}</Text>}

            {/* CREF (Educador Físico) */}
            {userType === "Physical_educator" && (
                <Controller
                    control={control}
                    name="cref"
                    render={({ field: { onChange, value } }) => (
                        <TextInput
                            style={styles.input}
                            placeholder="CREF"
                            value={value}
                            onChangeText={onChange}
                        />
                    )}
                />
            )}
            {errors.cref && <Text style={styles.error}>{errors.cref.message}</Text>}

            {/* Sexo (todos os tipos) - botões M/F */}
            <Controller
                control={control}
                name="sex"
                render={({ field: { onChange, value } }) => (
                    <View style={styles.sexContainer}>
                        <Text style={{ marginBottom: 8 }}>Sexo</Text>
                        <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
                            {['M', 'F'].map((option) => (
                                <TouchableOpacity
                                    key={option}
                                    style={[styles.sexButton, value === option && styles.sexButtonSelected]}
                                    onPress={() => onChange(option)}
                                >
                                    <Text style={[styles.sexButtonText, value === option && styles.sexButtonTextSelected]}>{option === 'M' ? 'Masculino' : 'Feminino'}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                )}
            />
            {errors.sex && <Text style={styles.error}>{errors.sex.message}</Text>}

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
    typeButton: {
        borderWidth: 1,
        borderColor: '#40C4FF',
        borderRadius: 8,
        paddingVertical: 8,
        paddingHorizontal: 16,
        marginHorizontal: 4,
        backgroundColor: '#fff',
    },
    typeButtonSelected: {
        backgroundColor: '#40C4FF',
    },
    typeButtonText: {
        color: '#40C4FF',
        fontWeight: 'bold',
    },
    typeButtonTextSelected: {
        color: '#fff',
    },
    sexContainer: {
        marginBottom: 10,
    },
    sexButton: {
        borderWidth: 1,
        borderColor: '#40C4FF',
        borderRadius: 8,
        paddingVertical: 8,
        paddingHorizontal: 16,
        marginHorizontal: 4,
        backgroundColor: '#fff',
    },
    sexButtonSelected: {
        backgroundColor: '#40C4FF',
    },
    sexButtonText: {
        color: '#40C4FF',
        fontWeight: 'bold',
    },
    sexButtonTextSelected: {
        color: '#fff',
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
