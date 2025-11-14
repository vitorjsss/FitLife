import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import Icon from "react-native-vector-icons/FontAwesome";
import { Controller, useForm, Resolver } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import MeasurementsService, { MeasureRecord } from "../../services/MeasurementsService";
import Header from "../../components/Header";
import { useUser } from "../../context/UserContext";

type FormData = {
  data: string; // Data em formato DD/MM/YYYY para exibição
  peso?: string;
  altura?: string;
  circunferencia?: string;
};

// Helpers para conversão de datas
function formatBRFromISO(iso?: string) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function isoFromBR(br: string) {
  if (!br) return "";
  const parts = br.split("/");
  if (parts.length !== 3) return "";
  const [d, m, y] = parts;
  return `${y.padStart(4, "0")}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

function brToday() {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = d.getFullYear();
  return `${dd}/${mm}/${yy}`;
}

// Schema de validação
const schema = yup.object().shape({
  data: yup
    .string()
    .required("Data obrigatória")
    .matches(/^\d{2}\/\d{2}\/\d{4}$/, "Formato DD/MM/YYYY"),
  peso: yup
    .number()
    .nullable()
    .transform(v => (isNaN(v) ? undefined : v))
    .min(20, "Peso muito baixo")
    .max(300, "Peso muito alto"),
  altura: yup
    .number()
    .nullable()
    .transform(v => (isNaN(v) ? undefined : v))
    .min(1.0, "Altura muito baixa (em metros)")
    .max(2.5, "Altura muito alta (em metros)"),
  circunferencia: yup
    .number()
    .nullable()
    .transform(v => (isNaN(v) ? undefined : v))
    .min(20, "Circunferência muito baixa")
    .max(200, "Circunferência muito alta"),
});

export default function GerenciarMedidas() {
  const navigation = useNavigation();
  const { user } = useUser();
  const [records, setRecords] = useState<MeasureRecord[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: yupResolver(schema) as unknown as Resolver<FormData, any, FormData>,
    defaultValues: {
      data: brToday(),
      peso: undefined,
      altura: undefined,
      circunferencia: undefined,
    }
  });

  useEffect(() => {
    if (user?.id) {
      refresh();
    }
  }, [user]);

  const refresh = async () => {
    if (!user?.id) return;
    try {
      const list = await MeasurementsService.list(user.id);
      // Ordenar por data (mais recente primeiro)
      const sorted = list.sort((a, b) => {
        const dateA = a.data ? new Date(a.data).getTime() : 0;
        const dateB = b.data ? new Date(b.data).getTime() : 0;
        return dateB - dateA;
      });
      setRecords(sorted);
    } catch (error) {
      console.error('[GerenciarMedidas] Erro ao carregar medidas:', error);
    }
  };

  const onSubmit = async (data: FormData) => {
    if (!user?.id) {
      Alert.alert("Erro", "Usuário não identificado");
      return;
    }

    try {
      const payload = {
        patient_id: user.id,
        data: data.data ? isoFromBR(data.data) : new Date().toISOString().split('T')[0], // Converte para ISO YYYY-MM-DD
        peso: data.peso ? Number(data.peso) : null,
        altura: data.altura ? Number(data.altura) : null,
        circunferencia: data.circunferencia ? Number(data.circunferencia) : null,
      };

      if (editingId) {
        await MeasurementsService.update(editingId, {
          data: payload.data,
          peso: payload.peso,
          altura: payload.altura,
          circunferencia: payload.circunferencia,
        });
        Alert.alert("Sucesso", "Medida atualizada com sucesso!");
      } else {
        await MeasurementsService.create(payload);
        Alert.alert("Sucesso", "Medida registrada com sucesso!");
      }

      setEditingId(null);
      reset({ data: brToday(), peso: undefined, altura: undefined, circunferencia: undefined });
      await refresh();
    } catch (err: any) {
      console.error('[GerenciarMedidas] Erro ao salvar:', err);
      Alert.alert("Erro", err.message || "Falha ao salvar medida.");
    }
  };

  const onEdit = (rec: MeasureRecord) => {
    setEditingId(rec.id);
    reset({
      data: rec.data ? formatBRFromISO(rec.data) : brToday(),
      peso: rec.peso?.toString(),
      altura: rec.altura?.toString(),
      circunferencia: rec.circunferencia?.toString(),
    });
  };

  const onDelete = (id: string) => {
    Alert.alert("Confirmar", "Deseja remover esta medida?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Remover",
        style: "destructive",
        onPress: async () => {
          try {
            await MeasurementsService.remove(id);
            Alert.alert("Sucesso", "Medida removida!");
            await refresh();
          } catch (err: any) {
            console.error('[GerenciarMedidas] Erro ao remover:', err);
            Alert.alert("Erro", "Falha ao remover medida.");
          }
        }
      }
    ]);
  };

  const renderItem = ({ item }: { item: MeasureRecord }) => {
    const imc = item.imc ? item.imc.toFixed(1) : 
                (item.peso && item.altura) ? MeasurementsService.calcularIMC(item.peso, item.altura).toFixed(1) : '-';
    
    return (
      <View style={styles.record}>
        <View style={{ flex: 1 }}>
          <Text style={styles.recordDate}>{item.data ? formatBRFromISO(item.data) : ""}</Text>
          <Text style={styles.recordText}>
            {item.peso ? `Peso: ${item.peso}kg` : ""}
            {item.altura ? ` • Altura: ${item.altura}m` : ""}
            {imc !== '-' ? ` • IMC: ${imc}` : ""}
          </Text>
          {item.circunferencia && (
            <Text style={styles.recordText}>Circunferência: {item.circunferencia}cm</Text>
          )}
        </View>
        <View style={styles.recordActions}>
          <TouchableOpacity onPress={() => onEdit(item)} style={styles.smallBtn}>
            <Icon name="pencil" size={14} color="#1976D2" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onDelete(item.id)} style={[styles.smallBtn, { marginLeft: 8 }]}>
            <Icon name="trash" size={14} color="#D32F2F" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Header title="Gerenciar Medidas" />
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={styles.container}>
          <View style={styles.introCard}>
            <Text style={styles.introTitle}>Registrar suas medidas corporais</Text>
            <Text style={styles.introText}>
              Insira peso, altura e circunferências. O IMC será calculado automaticamente.
            </Text>
          </View>

          <View style={styles.formCard}>
            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>Data *</Text>
                <Controller
                  control={control}
                  name="data"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      style={styles.input}
                      placeholder="DD/MM/YYYY"
                      value={value}
                      onChangeText={onChange}
                    />
                  )}
                />
                {errors.data && <Text style={styles.err}>{errors.data.message}</Text>}
              </View>
              <View style={styles.col}>
                <Text style={styles.label}>Peso (kg)</Text>
                <Controller
                  control={control}
                  name="peso"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      style={styles.input}
                      placeholder="Ex: 70.5"
                      keyboardType="numeric"
                      value={value}
                      onChangeText={onChange}
                    />
                  )}
                />
                {errors.peso && <Text style={styles.err}>{errors.peso.message}</Text>}
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>Altura (m)</Text>
                <Controller
                  control={control}
                  name="altura"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      style={styles.input}
                      placeholder="Ex: 1.75"
                      keyboardType="numeric"
                      value={value}
                      onChangeText={onChange}
                    />
                  )}
                />
                {errors.altura && <Text style={styles.err}>{errors.altura.message}</Text>}
              </View>
              <View style={styles.col}>
                <Text style={styles.label}>Circunferência (cm)</Text>
                <Controller
                  control={control}
                  name="circunferencia"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      style={styles.input}
                      placeholder="Ex: 80"
                      keyboardType="numeric"
                      value={value}
                      onChangeText={onChange}
                    />
                  )}
                />
                {errors.circunferencia && <Text style={styles.err}>{errors.circunferencia.message}</Text>}
              </View>
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSubmit(onSubmit)}>
              <Icon name={editingId ? "check" : "plus"} size={16} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.saveTxt}>{editingId ? "Atualizar Medida" : "Salvar Medida"}</Text>
            </TouchableOpacity>

            {editingId && (
              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: "#757575", marginTop: 8 }]}
                onPress={() => {
                  setEditingId(null);
                  reset({ data: brToday(), peso: undefined, altura: undefined, circunferencia: undefined });
                }}
              >
                <Text style={styles.saveTxt}>Cancelar Edição</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.list}>
            <Text style={styles.sectionTitle}>Histórico de Medidas</Text>
            {records.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Icon name="line-chart" size={48} color="#E0E0E0" />
                <Text style={styles.empty}>Nenhuma medida registrada ainda.</Text>
                <Text style={styles.emptySubtext}>Adicione sua primeira medida acima!</Text>
              </View>
            ) : (
              <>
                {records.map(item => (
                  <View key={item.id}>
                    {renderItem({ item })}
                  </View>
                ))}
              </>
            )}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F6FA",
    paddingBottom: 24
  },
  introCard: {
    backgroundColor: "#fff",
    margin: 12,
    borderRadius: 10,
    padding: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6
  },
  introTitle: {
    fontWeight: "700",
    color: "#1976D2",
    fontSize: 16,
    marginBottom: 6
  },
  introText: {
    color: "#666",
    fontSize: 14
  },
  formCard: {
    backgroundColor: "#fff",
    marginHorizontal: 12,
    borderRadius: 10,
    padding: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    marginBottom: 16
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12
  },
  col: {
    flex: 1,
    marginRight: 8
  },
  label: {
    fontSize: 13,
    color: "#666",
    marginBottom: 6,
    fontWeight: "600"
  },
  input: {
    backgroundColor: "#F8FAFB",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E0E7EE",
    fontSize: 14
  },
  saveBtn: {
    backgroundColor: "#1976D2",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 8
  },
  saveTxt: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15
  },
  list: {
    flex: 1,
    padding: 12
  },
  sectionTitle: {
    fontWeight: "700",
    color: "#1976D2",
    fontSize: 16,
    marginBottom: 12
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 32
  },
  empty: {
    color: "#666",
    marginTop: 12,
    fontSize: 14,
    fontWeight: "600"
  },
  emptySubtext: {
    color: "#999",
    fontSize: 12,
    marginTop: 4,
    fontStyle: "italic"
  },
  record: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4
  },
  recordDate: {
    fontWeight: "700",
    color: "#1976D2",
    fontSize: 14,
    marginBottom: 4
  },
  recordText: {
    color: "#666",
    fontSize: 13
  },
  recordActions: {
    flexDirection: "row"
  },
  smallBtn: {
    padding: 8,
    backgroundColor: "#F5F9FC",
    borderRadius: 6
  },
  err: {
    color: "#D32F2F",
    fontSize: 11,
    marginTop: 4
  }
});