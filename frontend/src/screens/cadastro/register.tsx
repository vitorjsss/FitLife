import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import { useForm, Controller, SubmitHandler } from "react-hook-form";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import type { RootStackParamList } from "../../../App";
import { authService } from "../../services/authService";
import { patientService } from "../../services/PatientService";
import { nutricionistService } from "../../services/NutricionistService";
import { physicalEducatorService } from "../../services/PhysicalEducatorService";
import { validateRegisterCredentials, validateEmail, validatePassword, validateUsername, normalizeEmail, normalizeUsername } from '../../utils/validationRules';

type RegisterScreenNavigationProp = NativeStackNavigationProp<
    RootStackParamList,
    "Register"
>;

type UserType = "Patient" | "Nutricionist" | "Physical_educator";

type RegisterFormData = {
    name: string;
    email: string;
    password: string;
    confirmPassword: string | undefined;
    birthdate: string | undefined;
    sex: string;
    contact: string | undefined;
    crn: string | undefined; // Nutricionista
    cref: string | undefined; // Educador Físico
    userType: UserType;
};

const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;

export default function RegisterScreen() {
    const [loading, setLoading] = useState(false);
    const [hidePassword, setHidePassword] = useState(true);
    const [hideConfirmPassword, setHideConfirmPassword] = useState(true);
    const [selectedType, setSelectedType] = useState<UserType | null>(null);
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

    const navigation = useNavigation<RegisterScreenNavigationProp>();

    const {
        control,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<RegisterFormData>({
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

    // Função para converter data brasileira (DD/MM/AAAA) para ISO (AAAA-MM-DD)
    const convertBRDateToISO = (brDate: string): string => {
        const match = brDate.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
        if (!match) return brDate;
        const [, day, month, year] = match;
        return `${year}-${month}-${day}`;
    };

    const onSubmit: SubmitHandler<RegisterFormData> = async (data) => {
        // Validações customizadas
        const errors: Record<string, string> = {};

        // Validar nome
        if (!data.name || data.name.trim().length < 3) {
            errors.name = 'Nome deve ter no mínimo 3 caracteres';
        }

        // Validar credenciais com validationRules
        const credValidation = validateRegisterCredentials({
            username: data.name,
            email: data.email,
            password: data.password
        });

        if (!credValidation.valid) {
            Object.assign(errors, credValidation.errors);
        }

        // Validar confirmação de senha
        if (data.password !== data.confirmPassword) {
            errors.confirmPassword = 'As senhas não coincidem';
        }

        // Validar data de nascimento
        if (data.birthdate) {
            const match = data.birthdate.match(dateRegex);
            if (!match) {
                errors.birthdate = 'Formato inválido. Use DD/MM/AAAA';
            } else {
                const day = parseInt(match[1], 10);
                const month = parseInt(match[2], 10);
                const year = parseInt(match[3], 10);
                if (month < 1 || month > 12 || day < 1 || day > 31 || year < 1900 || year > new Date().getFullYear()) {
                    errors.birthdate = 'Data inválida';
                }
            }
        } else {
            errors.birthdate = 'Data de nascimento obrigatória';
        }

        // Validar campos obrigatórios
        if (!data.sex) errors.sex = 'Sexo obrigatório';
        if (!data.contact) errors.contact = 'Contato obrigatório';
        if (data.userType === 'Nutricionist' && !data.crn) errors.crn = 'CRN obrigatório';
        if (data.userType === 'Physical_educator' && !data.cref) errors.cref = 'CREF obrigatório';

        if (Object.keys(errors).length > 0) {
            setValidationErrors(errors);
            return;
        }

        setValidationErrors({});
        setLoading(true);
        try {
            // 1️⃣ Registrar usuário
            const registerData = {
                username: data.name,
                email: normalizeEmail(data.email),
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

            // Converter data de nascimento para ISO antes de enviar
            const birthdateISO = data.birthdate ? convertBRDateToISO(data.birthdate) : undefined;

            // 3️⃣ Criar registro específico no backend
            if (data.userType === "Patient") {
                await patientService.create(
                    {
                        name: data.name,
                        birthdate: birthdateISO!,
                        sex: data.sex!,
                        contact: data.contact!,
                        auth_id,
                    } as any,
                    config
                );
            } else if (data.userType === "Nutricionist") {
                await nutricionistService.create(
                    {
                        name: data.name,
                        birthdate: birthdateISO!,
                        sex: data.sex!,
                        contact: data.contact!,
                        crn: data.crn!,
                        auth_id,
                    } as any,
                    config
                );
            } else if (data.userType === "Physical_educator") {
                await physicalEducatorService.create(
                    {
                        name: data.name,
                        birthdate: birthdateISO!,
                        sex: data.sex!,
                        contact: data.contact!,
                        cref: data.cref!,
                        auth_id,
                    } as any,
                    config
                );
            }

            Alert.alert("Sucesso", "Conta criada com sucesso!");
            navigation.navigate("Login");
        } catch (error: any) {
            if (error?.response?.status === 400 && error?.response?.data?.message === "Email já existe") {
                Alert.alert("Erro", "Este e-mail já está em uso.");
            } else {
                // Log detalhado para depuração
                console.error("Erro ao cadastrar:", {
                    status: error?.response?.status,
                    data: error?.response?.data,
                    message: error?.message,
                    error
                });
                Alert.alert("Erro", "Não foi possível cadastrar. Tente novamente.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
            <ScrollView
                contentContainerStyle={styles.container}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
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
                {validationErrors.name && <Text style={styles.error}>{validationErrors.name}</Text>}

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
                {validationErrors.email && <Text style={styles.error}>{validationErrors.email}</Text>}

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
                {validationErrors.password && (
                    <Text style={styles.error}>{validationErrors.password}</Text>
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
                {validationErrors.confirmPassword && (
                    <Text style={styles.error}>{validationErrors.confirmPassword}</Text>
                )}

                {/* Campos dinâmicos */}
                {/* Data de nascimento */}
                <Controller
                    control={control}
                    name="birthdate"
                    render={({ field: { onChange, value } }) => (
                        <TextInput
                            style={styles.input}
                            placeholder="Data de nascimento (DD/MM/AAAA)"
                            value={value}
                            onChangeText={(text) => {
                                // Máscara de data DD/MM/AAAA
                                let formatted = text.replace(/\D/g, '');
                                if (formatted.length >= 3) {
                                    formatted = formatted.slice(0, 2) + '/' + formatted.slice(2);
                                }
                                if (formatted.length >= 6) {
                                    formatted = formatted.slice(0, 5) + '/' + formatted.slice(5, 9);
                                }
                                onChange(formatted);
                            }}
                            keyboardType="numeric"
                            maxLength={10}
                        />
                    )}
                />
                {validationErrors.birthdate && <Text style={styles.error}>{validationErrors.birthdate}</Text>}

                {/* Contato */}
                <Controller
                    control={control}
                    name="contact"
                    render={({ field: { onChange, value } }) => (
                        <TextInput
                            style={styles.input}
                            placeholder="Telefone +55 (XX) XXXXX-XXXX"
                            value={value}
                            onChangeText={onChange}
                        />
                    )}
                />
                {validationErrors.contact && <Text style={styles.error}>{validationErrors.contact}</Text>}

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
                {validationErrors.sex && <Text style={styles.error}>{validationErrors.sex}</Text>}

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
