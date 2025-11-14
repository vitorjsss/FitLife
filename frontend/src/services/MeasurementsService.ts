import { apiClient } from './apiClient';

/**
 * Tipos de dados para Medidas Corporais
 */
export type MeasureRecord = {
  id: string;
  patient_id: string;
  data: string; // ISO (YYYY-MM-DD)
  peso?: number | null;
  altura?: number | null;
  imc?: number | null;
  circunferencia?: number | null;
  created_at?: string;
  updated_at?: string;
};

/**
 * Interface para criação de medida (sem id, created_at, updated_at)
 */
export type CreateMeasureDTO = {
  patient_id: string;
  data: string; // ISO (YYYY-MM-DD)
  peso?: number | null;
  altura?: number | null;
  circunferencia?: number | null;
};

/**
 * Interface para atualização de medida
 */
export type UpdateMeasureDTO = {
  data?: string;
  peso?: number | null;
  altura?: number | null;
  circunferencia?: number | null;
};

/**
 * Interface para dados de evolução
 */
export type EvolutionData = {
  peso_inicial?: number;
  peso_atual?: number;
  diferenca_peso?: number;
  imc_inicial?: number;
  imc_atual?: number;
  diferenca_imc?: number;
  total_registros: number;
};

/**
 * Serviço para gerenciar medidas corporais via API
 */
const MeasurementsService = {
  /**
   * Lista medidas de um paciente
   */
  async list(patientId: string): Promise<MeasureRecord[]> {
    try {
      const data = await apiClient.get<MeasureRecord[]>(`/medidas-corporais/patient/${patientId}`);
      return data || [];
    } catch (error: any) {
      console.error('[MeasurementsService] Erro ao listar medidas:', error);
      return [];
    }
  },

  /**
   * Busca uma medida por ID
   */
  async getById(id: string): Promise<MeasureRecord> {
    try {
      const data = await apiClient.get<MeasureRecord>(`/medidas-corporais/${id}`);
      return data;
    } catch (error: any) {
      console.error('[MeasurementsService] Erro ao buscar medida:', error);
      throw error;
    }
  },

  /**
   * Busca medidas por intervalo de datas
   */
  async getByDateRange(patientId: string, startDate: string, endDate: string): Promise<MeasureRecord[]> {
    try {
      const data = await apiClient.get<MeasureRecord[]>(`/medidas-corporais/patient/${patientId}/date-range?startDate=${startDate}&endDate=${endDate}`);
      return data || [];
    } catch (error: any) {
      console.error('[MeasurementsService] Erro ao buscar medidas por data:', error);
      return [];
    }
  },

  /**
   * Busca a última medida de um paciente
   */
  async getLatest(patientId: string): Promise<MeasureRecord | null> {
    try {
      const data = await apiClient.get<MeasureRecord>(`/medidas-corporais/patient/${patientId}/latest`);
      return data;
    } catch (error: any) {
      console.error('[MeasurementsService] Erro ao buscar última medida:', error);
      return null;
    }
  },

  /**
   * Cria nova medida
   */
  async create(data: CreateMeasureDTO): Promise<MeasureRecord> {
    try {
      const result = await apiClient.post<MeasureRecord>('/medidas-corporais', data);
      return result;
    } catch (error: any) {
      console.error('[MeasurementsService] Erro ao criar medida:', error);
      throw error;
    }
  },

  /**
   * Atualiza medida existente
   */
  async update(id: string, data: UpdateMeasureDTO): Promise<MeasureRecord> {
    try {
      const result = await apiClient.put<MeasureRecord>(`/medidas-corporais/${id}`, data);
      return result;
    } catch (error: any) {
      console.error('[MeasurementsService] Erro ao atualizar medida:', error);
      throw error;
    }
  },

  /**
   * Remove medida
   */
  async remove(id: string): Promise<void> {
    try {
      await apiClient.delete(`/medidas-corporais/${id}`);
    } catch (error: any) {
      console.error('[MeasurementsService] Erro ao remover medida:', error);
      throw error;
    }
  },

  /**
   * Busca dados de evolução
   */
  async getEvolution(patientId: string, startDate?: string, endDate?: string): Promise<EvolutionData> {
    try {
      let url = `/medidas-corporais/patient/${patientId}/evolution`;
      const queryParams: string[] = [];
      
      if (startDate) queryParams.push(`startDate=${startDate}`);
      if (endDate) queryParams.push(`endDate=${endDate}`);
      
      if (queryParams.length > 0) {
        url += `?${queryParams.join('&')}`;
      }
      
      const data = await apiClient.get<EvolutionData>(url);
      return data;
    } catch (error: any) {
      console.error('[MeasurementsService] Erro ao buscar evolução:', error);
      throw error;
    }
  },

  /**
   * Calcula IMC a partir de peso e altura
   */
  calcularIMC(peso: number, altura: number): number {
    if (!peso || !altura || altura <= 0) return 0;
    return peso / (altura * altura);
  },

  /**
   * Classifica IMC
   */
  classificarIMC(imc: number): string {
    if (imc < 18.5) return 'Abaixo do peso';
    if (imc < 25) return 'Peso normal';
    if (imc < 30) return 'Sobrepeso';
    if (imc < 35) return 'Obesidade Grau I';
    if (imc < 40) return 'Obesidade Grau II';
    return 'Obesidade Grau III';
  },

  /**
   * Formata data para exibição (DD/MM/YYYY)
   */
  formatDate(isoDate: string): string {
    const date = new Date(isoDate);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }
};

export default MeasurementsService;