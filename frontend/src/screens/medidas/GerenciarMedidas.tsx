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
  circunferencia_cintura?: string;
  circunferencia_quadril?: string;
  circunferencia_braco?: string;
  circunferencia_coxa?: string;
  circunferencia_panturrilha?: string;
  percentual_gordura?: string;
  massa_muscular?: string;
  massa_ossea?: string;
};

// Helpers para conversão de datas
function formatBRFromISO(iso?: string) {
  if (!iso) return "";
  // Remover possível horário (T00:00:00.000Z)
  const dateOnly = iso.split('T')[0];
  const [y, m, d] = dateOnly.split("-");
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
    .min(20, "Peso muito baixo (min: 20kg)")
    .max(300, "Peso muito alto (max: 300kg)"),
  altura: yup
    .number()
    .nullable()
    .transform(v => (isNaN(v) ? undefined : v))
    .min(1.0, "Altura muito baixa (min: 1.0m)")
    .max(2.5, "Altura muito alta (max: 2.5m)"),
  circunferencia_cintura: yup
    .number()
    .nullable()
    .transform(v => (isNaN(v) ? undefined : v))
    .min(10, "Muito baixa (min: 10cm)")
    .max(200, "Muito alta (max: 200cm)"),
  circunferencia_quadril: yup
    .number()
    .nullable()
    .transform(v => (isNaN(v) ? undefined : v))
    .min(10, "Muito baixa (min: 10cm)")
    .max(200, "Muito alta (max: 200cm)"),
  circunferencia_braco: yup
    .number()
    .nullable()
    .transform(v => (isNaN(v) ? undefined : v))
    .min(10, "Muito baixa (min: 10cm)")
    .max(100, "Muito alta (max: 100cm)"),
  circunferencia_coxa: yup
    .number()
    .nullable()
    .transform(v => (isNaN(v) ? undefined : v))
    .min(10, "Muito baixa (min: 10cm)")
    .max(150, "Muito alta (max: 150cm)"),
  circunferencia_panturrilha: yup
    .number()
    .nullable()
    .transform(v => (isNaN(v) ? undefined : v))
    .min(10, "Muito baixa (min: 10cm)")
    .max(100, "Muito alta (max: 100cm)"),
  percentual_gordura: yup
    .number()
    .nullable()
    .transform(v => (isNaN(v) ? undefined : v))
    .min(3, "Muito baixo (min: 3%)")
    .max(60, "Muito alto (max: 60%)"),
  massa_muscular: yup
    .number()
    .nullable()
    .transform(v => (isNaN(v) ? undefined : v))
    .min(10, "Muito baixa (min: 10kg)")
    .max(100, "Muito alta (max: 100kg)"),
  massa_ossea: yup
    .number()
    .nullable()
    .transform(v => (isNaN(v) ? undefined : v))
    .min(1, "Muito baixa (min: 1kg)")
    .max(10, "Muito alta (max: 10kg)"),
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
      circunferencia_cintura: undefined,
      circunferencia_quadril: undefined,
      circunferencia_braco: undefined,
      circunferencia_coxa: undefined,
      circunferencia_panturrilha: undefined,
      percentual_gordura: undefined,
      massa_muscular: undefined,
      massa_ossea: undefined,
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
      console.log('[GerenciarMedidas] Dados recebidos:', list);
      console.log('[GerenciarMedidas] Tipo de dados:', typeof list, Array.isArray(list));
      
      // Garantir que list é um array
      let measuresArray: MeasureRecord[] = [];
      
      if (Array.isArray(list)) {
        measuresArray = list;
      } else if (list && typeof list === 'object') {
        // Se vier como objeto, tentar extrair o array de uma propriedade comum
        measuresArray = (list as any).data || (list as any).measures || (list as any).records || [];
        console.log('[GerenciarMedidas] Dados extraídos de objeto:', measuresArray);
      } else {
        console.warn('[GerenciarMedidas] Formato de dados inesperado, usando array vazio');
        measuresArray = [];
      }
      
      // Ordenar por data (mais recente primeiro)
      const sorted = measuresArray.sort((a, b) => {
        const dateA = a.data ? new Date(a.data).getTime() : 0;
        const dateB = b.data ? new Date(b.data).getTime() : 0;
        return dateB - dateA;
      });
      setRecords(sorted);
    } catch (error) {
      console.error('[GerenciarMedidas] Erro ao carregar medidas:', error);
      setRecords([]); // Garantir que records seja sempre um array
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
        data: data.data ? isoFromBR(data.data) : new Date().toISOString().split('T')[0],
        peso: data.peso ? Number(data.peso) : null,
        altura: data.altura ? Number(data.altura) : null,
        waist_circumference: data.circunferencia_cintura ? Number(data.circunferencia_cintura) : null,
        hip_circumference: data.circunferencia_quadril ? Number(data.circunferencia_quadril) : null,
        arm_circumference: data.circunferencia_braco ? Number(data.circunferencia_braco) : null,
        thigh_circumference: data.circunferencia_coxa ? Number(data.circunferencia_coxa) : null,
        calf_circumference: data.circunferencia_panturrilha ? Number(data.circunferencia_panturrilha) : null,
        body_fat_percentage: data.percentual_gordura ? Number(data.percentual_gordura) : null,
        muscle_mass: data.massa_muscular ? Number(data.massa_muscular) : null,
        bone_mass: data.massa_ossea ? Number(data.massa_ossea) : null,
      };

      if (editingId) {
        await MeasurementsService.update(editingId, {
          data: payload.data,
          peso: payload.peso,
          altura: payload.altura,
          waist_circumference: payload.waist_circumference,
          hip_circumference: payload.hip_circumference,
          arm_circumference: payload.arm_circumference,
          thigh_circumference: payload.thigh_circumference,
          calf_circumference: payload.calf_circumference,
          body_fat_percentage: payload.body_fat_percentage,
          muscle_mass: payload.muscle_mass,
          bone_mass: payload.bone_mass,
        });
        Alert.alert("Sucesso", "Medida atualizada com sucesso!");
      } else {
        await MeasurementsService.create(payload);
        Alert.alert("Sucesso", "Medida registrada com sucesso!");
      }

      setEditingId(null);
      reset({ 
        data: brToday(), 
        peso: undefined, 
        altura: undefined, 
        circunferencia_cintura: undefined,
        circunferencia_quadril: undefined,
        circunferencia_braco: undefined,
        circunferencia_coxa: undefined,
        circunferencia_panturrilha: undefined,
        percentual_gordura: undefined,
        massa_muscular: undefined,
        massa_ossea: undefined,
      });
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
      circunferencia_cintura: (rec as any).waist_circumference?.toString(),
      circunferencia_quadril: (rec as any).hip_circumference?.toString(),
      circunferencia_braco: (rec as any).arm_circumference?.toString(),
      circunferencia_coxa: (rec as any).thigh_circumference?.toString(),
      circunferencia_panturrilha: (rec as any).calf_circumference?.toString(),
      percentual_gordura: (rec as any).body_fat_percentage?.toString(),
      massa_muscular: (rec as any).muscle_mass?.toString(),
      massa_ossea: (rec as any).bone_mass?.toString(),
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
    
    const itemData = item as any; // Type assertion para acessar novos campos
    
    return (
      <View style={styles.record}>
        <View style={{ flex: 1 }}>
          <Text style={styles.recordDate}>{item.data ? formatBRFromISO(item.data) : ""}</Text>
          
          {/* Medidas principais */}
          <Text style={styles.recordText}>
            {item.peso ? `Peso: ${item.peso}kg` : ""}
            {item.altura ? ` • Altura: ${item.altura}m` : ""}
            {imc !== '-' ? ` • IMC: ${imc}` : ""}
          </Text>
          
          {/* Circunferências */}
          {(itemData.waist_circumference || itemData.hip_circumference || itemData.arm_circumference || 
            itemData.thigh_circumference || itemData.calf_circumference) && (
            <Text style={styles.recordText}>
              {itemData.waist_circumference ? `Cintura: ${itemData.waist_circumference}cm` : ""}
              {itemData.hip_circumference ? ` • Quadril: ${itemData.hip_circumference}cm` : ""}
              {itemData.arm_circumference ? ` • Braço: ${itemData.arm_circumference}cm` : ""}
            </Text>
          )}
          
          {(itemData.thigh_circumference || itemData.calf_circumference) && (
            <Text style={styles.recordText}>
              {itemData.thigh_circumference ? `Coxa: ${itemData.thigh_circumference}cm` : ""}
              {itemData.calf_circumference ? ` • Panturrilha: ${itemData.calf_circumference}cm` : ""}
            </Text>
          )}
          
          {/* Composição corporal */}
          {(itemData.body_fat_percentage || itemData.muscle_mass || itemData.bone_mass) && (
            <Text style={styles.recordText}>
              {itemData.body_fat_percentage ? `Gordura: ${itemData.body_fat_percentage}%` : ""}
              {itemData.muscle_mass ? ` • M. Muscular: ${itemData.muscle_mass}kg` : ""}
              {itemData.bone_mass ? ` • M. Óssea: ${itemData.bone_mass}kg` : ""}
            </Text>
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
              Insira peso, altura, circunferências (cintura, quadril, braço, coxa, panturrilha) e composição corporal (% gordura, massa muscular e óssea). 
            </Text>
          </View>

          <View style={styles.formCard}>
            {/* Data */}
            <Text style={styles.sectionLabel}>📅 Informações Básicas</Text>
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
            </View>

            {/* Medidas Principais */}
            <Text style={styles.sectionLabel}>⚖️ Medidas Corporais Principais</Text>
            <View style={styles.row}>
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
            </View>

            {/* Circunferências */}
            <Text style={styles.sectionLabel}>📐 Circunferências (cm)</Text>
            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>Cintura</Text>
                <Controller
                  control={control}
                  name="circunferencia_cintura"
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
                {errors.circunferencia_cintura && <Text style={styles.err}>{errors.circunferencia_cintura.message}</Text>}
              </View>
              <View style={styles.col}>
                <Text style={styles.label}>Quadril</Text>
                <Controller
                  control={control}
                  name="circunferencia_quadril"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      style={styles.input}
                      placeholder="Ex: 100"
                      keyboardType="numeric"
                      value={value}
                      onChangeText={onChange}
                    />
                  )}
                />
                {errors.circunferencia_quadril && <Text style={styles.err}>{errors.circunferencia_quadril.message}</Text>}
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>Braço</Text>
                <Controller
                  control={control}
                  name="circunferencia_braco"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      style={styles.input}
                      placeholder="Ex: 30"
                      keyboardType="numeric"
                      value={value}
                      onChangeText={onChange}
                    />
                  )}
                />
                {errors.circunferencia_braco && <Text style={styles.err}>{errors.circunferencia_braco.message}</Text>}
              </View>
              <View style={styles.col}>
                <Text style={styles.label}>Coxa</Text>
                <Controller
                  control={control}
                  name="circunferencia_coxa"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      style={styles.input}
                      placeholder="Ex: 55"
                      keyboardType="numeric"
                      value={value}
                      onChangeText={onChange}
                    />
                  )}
                />
                {errors.circunferencia_coxa && <Text style={styles.err}>{errors.circunferencia_coxa.message}</Text>}
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>Panturrilha</Text>
                <Controller
                  control={control}
                  name="circunferencia_panturrilha"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      style={styles.input}
                      placeholder="Ex: 35"
                      keyboardType="numeric"
                      value={value}
                      onChangeText={onChange}
                    />
                  )}
                />
                {errors.circunferencia_panturrilha && <Text style={styles.err}>{errors.circunferencia_panturrilha.message}</Text>}
              </View>
            </View>

            {/* Composição Corporal */}
            <Text style={styles.sectionLabel}>💪 Composição Corporal</Text>
            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>% Gordura</Text>
                <Controller
                  control={control}
                  name="percentual_gordura"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      style={styles.input}
                      placeholder="Ex: 15"
                      keyboardType="numeric"
                      value={value}
                      onChangeText={onChange}
                    />
                  )}
                />
                {errors.percentual_gordura && <Text style={styles.err}>{errors.percentual_gordura.message}</Text>}
              </View>
              <View style={styles.col}>
                <Text style={styles.label}>Massa Muscular (kg)</Text>
                <Controller
                  control={control}
                  name="massa_muscular"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      style={styles.input}
                      placeholder="Ex: 35"
                      keyboardType="numeric"
                      value={value}
                      onChangeText={onChange}
                    />
                  )}
                />
                {errors.massa_muscular && <Text style={styles.err}>{errors.massa_muscular.message}</Text>}
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>Massa Óssea (kg)</Text>
                <Controller
                  control={control}
                  name="massa_ossea"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      style={styles.input}
                      placeholder="Ex: 3"
                      keyboardType="numeric"
                      value={value}
                      onChangeText={onChange}
                    />
                  )}
                />
                {errors.massa_ossea && <Text style={styles.err}>{errors.massa_ossea.message}</Text>}
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
                  reset({ 
                    data: brToday(), 
                    peso: undefined, 
                    altura: undefined, 
                    circunferencia_cintura: undefined,
                    circunferencia_quadril: undefined,
                    circunferencia_braco: undefined,
                    circunferencia_coxa: undefined,
                    circunferencia_panturrilha: undefined,
                    percentual_gordura: undefined,
                    massa_muscular: undefined,
                    massa_ossea: undefined,
                  });
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
  sectionLabel: {
    fontSize: 15,
    color: "#1976D2",
    fontWeight: "700",
    marginTop: 16,
    marginBottom: 12,
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