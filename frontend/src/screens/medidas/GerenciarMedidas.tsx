import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
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
import AsyncStorage from "@react-native-async-storage/async-storage";
import MeasurementsService, { MeasureRecord } from "../../services/MeasurementsService";

type FormData = {
  date: string;
  weight?: string;
  height?: string;
  waist?: string;
  hip?: string;
  arm?: string;
  leg?: string;
  notes?: string;
};

// helpers para conversão de datas
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
  return `${y.padStart(4,"0")}-${m.padStart(2,"0")}-${d.padStart(2,"0")}`;
}
function brToday() {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2,"0");
  const mm = String(d.getMonth()+1).padStart(2,"0");
  const yy = d.getFullYear();
  return `${dd}/${mm}/${yy}`;
}

// alterar schema para aceitar DD/MM/YYYY
const schema = yup.object().shape({
  date: yup
    .string()
    .required("Data obrigatória")
    .matches(/^\d{2}\/\d{2}\/\d{4}$/, "Formato DD/MM/YYYY"),
  weight: yup.number().nullable().transform(v => (isNaN(v) ? undefined : v)).min(20, "Peso muito baixo").max(300, "Peso muito alto"),
  height: yup.number().nullable().transform(v => (isNaN(v) ? undefined : v)).min(100, "Altura muito baixa (cm)").max(250, "Altura muito alta (cm)"),
  waist: yup.number().nullable().transform(v => (isNaN(v) ? undefined : v)).min(20).max(200),
  hip: yup.number().nullable().transform(v => (isNaN(v) ? undefined : v)).min(20).max(200),
  arm: yup.number().nullable().transform(v => (isNaN(v) ? undefined : v)).min(5).max(100),
  leg: yup.number().nullable().transform(v => (isNaN(v) ? undefined : v)).min(20).max(150),
  notes: yup.string().nullable()
});

const USER_KEY = "@fitlife:user_id";

export default function GerenciarMedidas() {
  const navigation = useNavigation();
  const [userId, setUserId] = useState<string | null>(null);
  const [records, setRecords] = useState<MeasureRecord[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: yupResolver(schema) as unknown as Resolver<FormData, any, FormData>,
    defaultValues: {
      date: brToday(),
      weight: undefined,
      height: undefined,
      waist: undefined,
      hip: undefined,
      arm: undefined,
      leg: undefined,
      notes: undefined
    }
  });

  useEffect(() => {
    (async () => {
      const uid = await AsyncStorage.getItem(USER_KEY);
      setUserId(uid);
      if (uid) {
        const list = await MeasurementsService.list(uid);
        setRecords(list);
      }
    })();
  }, []);

  const refresh = async () => {
    if (!userId) return;
    const list = await MeasurementsService.list(userId);
    setRecords(list);
  };

  const onSubmit = async (data: any) => {
    if (!userId) { Alert.alert("Erro","Usuário não identificado"); return; }

    try {
      const payload = {
        date: data.date ? isoFromBR(data.date) : undefined, // grava ISO internamente
        weight: data.weight ? Number(data.weight) : undefined,
        height: data.height ? Number(data.height) : undefined,
        waist: data.waist ? Number(data.waist) : undefined,
        hip: data.hip ? Number(data.hip) : undefined,
        arm: data.arm ? Number(data.arm) : undefined,
        leg: data.leg ? Number(data.leg) : undefined,
        notes: data.notes
      };

      if (editingId) {
        await MeasurementsService.update(userId, editingId, payload);
        Alert.alert("Sucesso", "Medida atualizada.");
      } else {
        await MeasurementsService.create(userId, payload);
        Alert.alert("Sucesso", "Medida registrada.");
      }
      setEditingId(null);
      // reset para data no formato BR
      reset({ date: brToday() });
      await refresh();
    } catch (err:any) {
      console.error(err);
      Alert.alert("Erro", err.message || "Falha ao salvar medida.");
    }
  };

  const onEdit = (rec: MeasureRecord) => {
    setEditingId(rec.id);
    reset({
      date: rec.date ? formatBRFromISO(rec.date) : brToday(),
      weight: rec.weight?.toString(),
      height: rec.height?.toString(),
      waist: rec.waist?.toString(),
      hip: rec.hip?.toString(),
      arm: rec.arm?.toString(),
      leg: rec.leg?.toString(),
      notes: rec.notes
    });
    // scroll to form if needed
  };

  const onDelete = (id: string) => {
    Alert.alert("Confirmar", "Remover esta medida?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Remover", style: "destructive", onPress: async () => {
        if (!userId) return;
        await MeasurementsService.remove(userId, id);
        await refresh();
      }}
    ]);
  };

  const renderItem = ({ item }: { item: MeasureRecord }) => (
    <View style={styles.record}>
      <View style={{flex:1}}>
        <Text style={styles.recordDate}>{item.date ? formatBRFromISO(item.date) : ""}</Text>
        <Text style={styles.recordText}>
          {item.weight ? `${item.weight}kg • ` : ""}{item.height ? `${item.height}cm` : ""}
        </Text>
      </View>
      <View style={styles.recordActions}>
        <TouchableOpacity onPress={() => onEdit(item)} style={styles.smallBtn}>
          <Icon name="pencil" size={14} color="#1976D2" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onDelete(item.id)} style={[styles.smallBtn, {marginLeft:8}]}>
          <Icon name="trash" size={14} color="#D32F2F" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={{flexGrow:1}}>
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Icon name="arrow-left" size={20} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.title}>Gerenciar Medidas</Text>
            <View style={{width:24}} />
          </View>

          <View style={styles.introCard}>
            <Text style={styles.introTitle}>Registrar suas medidas</Text>
            <Text style={styles.introText}>
              Insira peso, altura e circunferências. Você pode editar ou remover registros depois.
            </Text>
          </View>

          <View style={styles.formCard}>
            {/* date + basic fields in rows */}
            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>Data</Text>
                <Controller control={control} name="date" render={({ field: { onChange, value } }) => (
                  <TextInput style={styles.input} placeholder="DD/MM/YYYY" value={value} onChangeText={onChange} />
                )} />
                {errors.date && <Text style={styles.err}>{errors.date.message}</Text>}
              </View>
              <View style={styles.col}>
                <Text style={styles.label}>Peso (kg)</Text>
                <Controller control={control} name="weight" render={({ field: { onChange, value } }) => (
                  <TextInput style={styles.input} placeholder="Ex: 70" keyboardType="numeric" value={value} onChangeText={onChange} />
                )} />
                {errors.weight && <Text style={styles.err}>{errors.weight.message}</Text>}
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>Altura (cm)</Text>
                <Controller control={control} name="height" render={({ field: { onChange, value } }) => (
                  <TextInput style={styles.input} placeholder="Ex: 175" keyboardType="numeric" value={value} onChangeText={onChange} />
                )} />
                {errors.height && <Text style={styles.err}>{errors.height.message}</Text>}
              </View>
              <View style={styles.col}>
                <Text style={styles.label}>Cintura (cm)</Text>
                <Controller control={control} name="waist" render={({ field: { onChange, value } }) => (
                  <TextInput style={styles.input} placeholder="Ex: 80" keyboardType="numeric" value={value} onChangeText={onChange} />
                )} />
                {errors.waist && <Text style={styles.err}>{errors.waist.message}</Text>}
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>Quadril (cm)</Text>
                <Controller control={control} name="hip" render={({ field: { onChange, value } }) => (
                  <TextInput style={styles.input} placeholder="Ex: 95" keyboardType="numeric" value={value} onChangeText={onChange} />
                )} />
                {errors.hip && <Text style={styles.err}>{errors.hip.message}</Text>}
              </View>
              <View style={styles.col}>
                <Text style={styles.label}>Braço (cm)</Text>
                <Controller control={control} name="arm" render={({ field: { onChange, value } }) => (
                  <TextInput style={styles.input} placeholder="Ex: 30" keyboardType="numeric" value={value} onChangeText={onChange} />
                )} />
                {errors.arm && <Text style={styles.err}>{errors.arm.message}</Text>}
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>Perna (cm)</Text>
                <Controller control={control} name="leg" render={({ field: { onChange, value } }) => (
                  <TextInput style={styles.input} placeholder="Ex: 55" keyboardType="numeric" value={value} onChangeText={onChange} />
                )} />
                {errors.leg && <Text style={styles.err}>{errors.leg.message}</Text>}
              </View>
            </View>

            <Text style={[styles.label, {marginTop:6}]}>Observações (opcional)</Text>
            <Controller control={control} name="notes" render={({ field: { onChange, value } }) => (
              <TextInput style={[styles.input, {height:80}]} placeholder="Ex: medida após treino" value={value} onChangeText={onChange} multiline />
            )} />
            <View style={[styles.col, {justifyContent:'flex-end'}]}>
                <TouchableOpacity style={styles.saveBtn} onPress={handleSubmit(onSubmit)}>
                  <Text style={styles.saveTxt}>{editingId ? "Atualizar" : "Salvar"}</Text>
                </TouchableOpacity>
              </View>
          </View>

          <View style={styles.list}>
            <Text style={styles.sectionTitle}>Medidas registradas</Text>
            {records.length === 0 ? <Text style={styles.empty}>Nenhuma medida.</Text> :
              <FlatList data={records} keyExtractor={i => i.id} renderItem={renderItem} />
            }
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:{flex:1, backgroundColor:"#F2F6FA", paddingBottom:24},
  header:{backgroundColor:"#1976D2", height:80, paddingHorizontal:16, flexDirection:"row", alignItems:"center", justifyContent:"space-between"},
  title:{color:"#fff", fontWeight:"700", fontSize:18},
  introCard:{backgroundColor:"#fff", margin:12, borderRadius:10, padding:12, elevation:2, shadowColor:"#000", shadowOpacity:0.06, shadowRadius:6},
  introTitle:{fontWeight:"700", color:"#1976D2", marginBottom:6},
  introText:{color:"#444"},
  formCard:{backgroundColor:"#fff", marginHorizontal:12, borderRadius:10, padding:12, elevation:3, shadowColor:"#000", shadowOpacity:0.08, shadowRadius:8},
  row:{flexDirection:"row", justifyContent:"space-between"},
  col:{flex:1, marginRight:8},
  label:{fontSize:12, color:"#666", marginBottom:6, fontWeight:"600"},
  input:{backgroundColor:"#fbfdff", padding:10, borderRadius:8, marginBottom:6, borderWidth:1, borderColor:"#e6eef7"},
  saveBtn:{backgroundColor:"#1976D2", padding:12, borderRadius:8, alignItems:"center"},
  saveTxt:{color:"#fff", fontWeight:"700"},
  list:{flex:1, padding:12},
  sectionTitle:{fontWeight:"700", color:"#1976D2", marginBottom:8},
  empty:{color:"#666"},
  record:{flexDirection:"row", backgroundColor:"#fff", padding:10, borderRadius:8, marginBottom:8, alignItems:"center", elevation:1},
  recordDate:{fontWeight:"700"},
  recordText:{color:"#666"},
  recordActions:{flexDirection:"row"},
  smallBtn:{padding:6},
  err:{color:"red", marginBottom:6}
});