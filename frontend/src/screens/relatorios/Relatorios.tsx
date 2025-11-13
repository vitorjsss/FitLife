import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import MeasurementsService, { MeasureRecord } from '../../services/MeasurementsService';
import Header from '../../components/Header';
import { useUser } from '../../context/UserContext';

const USER_KEY = '@fitlife:user_id';

type PeriodType = '7days' | '30days' | '90days' | 'all';

export default function Relatorios() {
  const navigation = useNavigation();
  const { user } = useUser();
  const [userId, setUserId] = useState<string | null>(null);
  const [records, setRecords] = useState<MeasureRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<MeasureRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('30days');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterRecordsByPeriod();
  }, [selectedPeriod, records]);

  const loadData = async () => {
    try {
      const uid = await AsyncStorage.getItem(USER_KEY);
      setUserId(uid);
      if (uid) {
        const list = await MeasurementsService.list(uid);
        const sorted = list.sort((a, b) => {
          const dateA = a.date ? new Date(a.date).getTime() : 0;
          const dateB = b.date ? new Date(b.date).getTime() : 0;
          return dateB - dateA; // Mais recente primeiro
        });
        setRecords(sorted);
      }
    } catch (err) {
      console.error('Erro ao carregar medidas:', err);
      Alert.alert('Erro', 'Não foi possível carregar as medidas.');
    } finally {
      setLoading(false);
    }
  };

  const filterRecordsByPeriod = () => {
    if (selectedPeriod === 'all') {
      setFilteredRecords(records);
      return;
    }

    const now = new Date();
    const days = selectedPeriod === '7days' ? 7 : selectedPeriod === '30days' ? 30 : 90;
    const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    const filtered = records.filter((record) => {
      if (!record.date) return false;
      const recordDate = new Date(record.date);
      return recordDate >= cutoffDate;
    });

    setFilteredRecords(filtered);
  };

  const formatDateBR = (isoDate?: string) => {
    if (!isoDate) return '';
    const [y, m, d] = isoDate.split('-');
    return `${d}/${m}/${y}`;
  };

  const calculateStats = (field: keyof MeasureRecord) => {
    const values = filteredRecords
      .map((r) => Number(r[field]))
      .filter((v) => !isNaN(v) && v > 0);

    if (values.length === 0) return null;

    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const first = values[values.length - 1];
    const last = values[0];
    const diff = last - first;

    return { min, max, avg, first, last, diff };
  };

  const generatePDFHTML = () => {
    const userName = user?.name || 'Usuário';
    const today = formatDateBR(new Date().toISOString().split('T')[0]);
    
    const periodLabels = {
      '7days': 'Últimos 7 dias',
      '30days': 'Últimos 30 dias',
      '90days': 'Últimos 90 dias',
      'all': 'Todos os registros',
    };

    const measureLabels: Record<string, string> = {
      weight: 'Peso (kg)',
      height: 'Altura (cm)',
      waist: 'Cintura (cm)',
      hip: 'Quadril (cm)',
      arm: 'Braço (cm)',
      leg: 'Perna (cm)',
    };

    let statsHTML = '';
    (['weight', 'height', 'waist', 'hip', 'arm', 'leg'] as Array<keyof MeasureRecord>).forEach((field) => {
      const stats = calculateStats(field);
      if (stats) {
        const label = measureLabels[field as string] || field;
        statsHTML += `
          <tr>
            <td>${label}</td>
            <td>${stats.first.toFixed(1)}</td>
            <td>${stats.last.toFixed(1)}</td>
            <td style="color: ${stats.diff > 0 ? '#f44336' : stats.diff < 0 ? '#4caf50' : '#666'}">
              ${stats.diff > 0 ? '+' : ''}${stats.diff.toFixed(1)}
            </td>
            <td>${stats.min.toFixed(1)}</td>
            <td>${stats.max.toFixed(1)}</td>
            <td>${stats.avg.toFixed(1)}</td>
          </tr>
        `;
      }
    });

    let recordsHTML = '';
    filteredRecords.forEach((record) => {
      recordsHTML += `
        <tr>
          <td>${formatDateBR(record.date)}</td>
          <td>${record.weight || '-'}</td>
          <td>${record.height || '-'}</td>
          <td>${record.waist || '-'}</td>
          <td>${record.hip || '-'}</td>
          <td>${record.arm || '-'}</td>
          <td>${record.leg || '-'}</td>
        </tr>
      `;
    });

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              color: #333;
            }
            h1 {
              color: #1976D2;
              text-align: center;
              margin-bottom: 10px;
            }
            .subtitle {
              text-align: center;
              color: #666;
              margin-bottom: 30px;
            }
            .info {
              background-color: #E3F2FD;
              padding: 15px;
              border-radius: 8px;
              margin-bottom: 20px;
            }
            .info p {
              margin: 5px 0;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 30px;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 12px;
              text-align: center;
            }
            th {
              background-color: #1976D2;
              color: white;
              font-weight: bold;
            }
            tr:nth-child(even) {
              background-color: #f9f9f9;
            }
            .section-title {
              color: #1976D2;
              margin-top: 30px;
              margin-bottom: 15px;
              font-size: 18px;
              font-weight: bold;
            }
            .footer {
              text-align: center;
              color: #999;
              margin-top: 40px;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <h1>📊 Relatório de Evolução de Medidas Corporais</h1>
          <div class="subtitle">FitLife - Seu Companheiro de Saúde</div>
          
          <div class="info">
            <p><strong>Paciente:</strong> ${userName}</p>
            <p><strong>Data de Geração:</strong> ${today}</p>
            <p><strong>Período:</strong> ${periodLabels[selectedPeriod]}</p>
            <p><strong>Total de Registros:</strong> ${filteredRecords.length}</p>
          </div>

          <div class="section-title">📈 Resumo Estatístico</div>
          <table>
            <thead>
              <tr>
                <th>Medida</th>
                <th>Primeira</th>
                <th>Última</th>
                <th>Variação</th>
                <th>Mínima</th>
                <th>Máxima</th>
                <th>Média</th>
              </tr>
            </thead>
            <tbody>
              ${statsHTML}
            </tbody>
          </table>

          <div class="section-title">📋 Histórico Completo de Medidas</div>
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Peso (kg)</th>
                <th>Altura (cm)</th>
                <th>Cintura (cm)</th>
                <th>Quadril (cm)</th>
                <th>Braço (cm)</th>
                <th>Perna (cm)</th>
              </tr>
            </thead>
            <tbody>
              ${recordsHTML}
            </tbody>
          </table>

          <div class="footer">
            <p>Relatório gerado automaticamente pelo FitLife</p>
            <p>Para mais informações, consulte seu profissional de saúde</p>
          </div>
        </body>
      </html>
    `;
  };

  const handleGeneratePDF = async () => {
    if (filteredRecords.length === 0) {
      Alert.alert('Aviso', 'Não há medidas registradas no período selecionado.');
      return;
    }

    setGenerating(true);

    try {
      const html = generatePDFHTML();
      const { uri } = await Print.printToFileAsync({ html });

      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          await Sharing.shareAsync(uri, {
            mimeType: 'application/pdf',
            dialogTitle: 'Compartilhar Relatório de Medidas',
            UTI: 'com.adobe.pdf',
          });
          
          Alert.alert(
            'Sucesso! ✅',
            'Relatório gerado com sucesso! Você pode compartilhá-lo ou salvá-lo.',
            [{ text: 'OK' }]
          );
        } else {
          Alert.alert('Aviso', 'O compartilhamento não está disponível neste dispositivo.');
        }
      }
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      Alert.alert('Erro', 'Não foi possível gerar o relatório PDF.');
    } finally {
      setGenerating(false);
    }
  };

  const periodOptions: { key: PeriodType; label: string; icon: string }[] = [
    { key: '7days', label: '7 dias', icon: 'calendar' },
    { key: '30days', label: '30 dias', icon: 'calendar-check-o' },
    { key: '90days', label: '90 dias', icon: 'calendar-plus-o' },
    { key: 'all', label: 'Tudo', icon: 'list' },
  ];

  if (loading) {
    return (
      <View style={styles.container}>
        <Header title="Relatórios" showBackArrow={true} showUserIcon={false} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1976D2" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Relatórios" showBackArrow={true} showUserIcon={false} />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Seletor de Período */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Selecione o Período:</Text>
          <View style={styles.periodContainer}>
            {periodOptions.map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.periodButton,
                  selectedPeriod === option.key && styles.periodButtonActive,
                ]}
                onPress={() => setSelectedPeriod(option.key)}
              >
                <Icon
                  name={option.icon}
                  size={20}
                  color={selectedPeriod === option.key ? '#fff' : '#1976D2'}
                />
                <Text
                  style={[
                    styles.periodButtonText,
                    selectedPeriod === option.key && styles.periodButtonTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Resumo */}
        <View style={styles.summaryCard}>
          <Icon name="bar-chart" size={24} color="#1976D2" />
          <View style={styles.summaryInfo}>
            <Text style={styles.summaryTitle}>Registros Encontrados</Text>
            <Text style={styles.summaryValue}>{filteredRecords.length}</Text>
          </View>
        </View>

        {/* Estatísticas Rápidas */}
        {filteredRecords.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Estatísticas do Período</Text>
            {(['weight', 'waist', 'hip'] as const).map((field) => {
              const stats = calculateStats(field);
              if (!stats) return null;

              const labels: Record<'weight' | 'waist' | 'hip', { title: string; unit: string; icon: string }> = {
                weight: { title: 'Peso', unit: 'kg', icon: 'balance-scale' },
                waist: { title: 'Cintura', unit: 'cm', icon: 'circle-o' },
                hip: { title: 'Quadril', unit: 'cm', icon: 'circle' },
              };

              const label = labels[field];

              return (
                <View key={field} style={styles.statCard}>
                  <View style={styles.statHeader}>
                    <Icon name={label.icon} size={20} color="#1976D2" />
                    <Text style={styles.statTitle}>{label.title}</Text>
                  </View>
                  <View style={styles.statRow}>
                    <View style={styles.statItem}>
                      <Text style={styles.statLabel}>Atual</Text>
                      <Text style={styles.statValue}>
                        {stats.last.toFixed(1)} {label.unit}
                      </Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statLabel}>Variação</Text>
                      <Text
                        style={[
                          styles.statValue,
                          {
                            color:
                              stats.diff > 0
                                ? '#f44336'
                                : stats.diff < 0
                                ? '#4caf50'
                                : '#666',
                          },
                        ]}
                      >
                        {stats.diff > 0 ? '+' : ''}
                        {stats.diff.toFixed(1)} {label.unit}
                      </Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statLabel}>Média</Text>
                      <Text style={styles.statValue}>
                        {stats.avg.toFixed(1)} {label.unit}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </>
        )}

        {/* Botão para Gerar PDF */}
        <TouchableOpacity
          style={[styles.generateButton, generating && styles.generateButtonDisabled]}
          onPress={handleGeneratePDF}
          disabled={generating || filteredRecords.length === 0}
        >
          {generating ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Icon name="file-pdf-o" size={24} color="#fff" />
              <Text style={styles.generateButtonText}>Gerar Relatório em PDF</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Botão para Ver Gráficos */}
        <TouchableOpacity
          style={styles.graphButton}
          onPress={() => navigation.navigate('GraficosProgresso')}
        >
          <Icon name="line-chart" size={20} color="#1976D2" />
          <Text style={styles.graphButtonText}>Ver Gráficos Detalhados</Text>
        </TouchableOpacity>

        {/* Info */}
        <View style={styles.infoBox}>
          <Icon name="info-circle" size={18} color="#1976D2" />
          <Text style={styles.infoText}>
            O relatório em PDF pode ser compartilhado com profissionais de saúde e contém
            todas as suas medidas do período selecionado.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7FB' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { flex: 1, padding: 16 },

  section: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1976D2',
    marginBottom: 12,
  },

  periodContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  periodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#1976D2',
    minWidth: '45%',
  },
  periodButtonActive: {
    backgroundColor: '#1976D2',
    borderColor: '#1976D2',
  },
  periodButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#1976D2',
  },
  periodButtonTextActive: {
    color: '#fff',
  },

  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  summaryInfo: {
    marginLeft: 16,
  },
  summaryTitle: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1976D2',
  },

  statCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1976D2',
    marginLeft: 8,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1976D2',
  },

  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f44336',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 20,
    elevation: 3,
  },
  generateButtonDisabled: {
    backgroundColor: '#ccc',
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 12,
  },

  graphButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 12,
    borderWidth: 2,
    borderColor: '#1976D2',
  },
  graphButtonText: {
    color: '#1976D2',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },

  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    padding: 12,
    marginTop: 20,
    marginBottom: 30,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#666',
    marginLeft: 12,
    lineHeight: 18,
  },
});
