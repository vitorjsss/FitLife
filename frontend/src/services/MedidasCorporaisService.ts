import { apiClient } from './apiClient';

export interface MedidaCorporal {
  id: string;
  patient_id: string;
  data: string;
  peso: number;
  altura: number;
  imc: number;
  circunferencia?: number;
  created_at: string;
  updated_at: string;
}

export interface MedidaCorporalInput {
  patient_id: string;
  data: string;
  peso: number;
  altura: number;
  imc?: number;
  circunferencia?: number;
}

export interface EvolutionData {
  data: MedidaCorporal[];
  statistics?: {
    peso_inicial: number;
    peso_atual: number;
    diferenca_peso: number;
    imc_inicial: number;
    imc_atual: number;
    diferenca_imc: number;
    total_medicoes: number;
  };
}

export interface IMCResult {
  imc: number;
  classificacao: string;
  peso: number;
  altura: number;
}

class MedidasCorporaisService {
  /**
   * Criar nova medida corporal
   */
  async create(medidaData: MedidaCorporalInput): Promise<MedidaCorporal> {
    return apiClient.post<MedidaCorporal>('/medidas-corporais', medidaData);
  }

  /**
   * Buscar todas as medidas de um paciente
   */
  async getByPatientId(patientId: string): Promise<MedidaCorporal[]> {
    return apiClient.get<MedidaCorporal[]>(`/medidas-corporais/patient/${patientId}`);
  }

  /**
   * Buscar medida por ID
   */
  async getById(id: string): Promise<MedidaCorporal> {
    return apiClient.get<MedidaCorporal>(`/medidas-corporais/${id}`);
  }

  /**
   * Buscar medidas por período
   */
  async getByDateRange(
    patientId: string,
    dataInicio: string,
    dataFim: string
  ): Promise<MedidaCorporal[]> {
    return apiClient.get<MedidaCorporal[]>(
      `/medidas-corporais/patient/${patientId}/range?dataInicio=${dataInicio}&dataFim=${dataFim}`
    );
  }

  /**
   * Buscar última medida do paciente
   */
  async getLatest(patientId: string): Promise<MedidaCorporal | null> {
    try {
      return await apiClient.get<MedidaCorporal>(`/medidas-corporais/patient/${patientId}/latest`);
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Atualizar medida corporal
   */
  async update(id: string, medidaData: Partial<MedidaCorporalInput>): Promise<MedidaCorporal> {
    return apiClient.put<MedidaCorporal>(`/medidas-corporais/${id}`, medidaData);
  }

  /**
   * Deletar medida corporal
   */
  async delete(id: string): Promise<void> {
    return apiClient.delete<void>(`/medidas-corporais/${id}`);
  }

  /**
   * Obter evolução das medidas
   */
  async getEvolution(patientId: string, limit: number = 10): Promise<EvolutionData> {
    return apiClient.get<EvolutionData>(
      `/medidas-corporais/patient/${patientId}/evolution?limit=${limit}`
    );
  }

  /**
   * Calcular IMC via API
   */
  async calcularIMC(peso: number, altura: number): Promise<IMCResult> {
    return apiClient.post<IMCResult>('/medidas-corporais/calcular-imc', {
      peso,
      altura
    });
  }

  /**
   * Calcular IMC localmente (helper)
   */
  calcularIMCLocal(peso: number, altura: number): number {
    if (!peso || !altura || altura === 0) {
      return 0;
    }
    return parseFloat((peso / (altura * altura)).toFixed(2));
  }

  /**
   * Classificar IMC localmente (helper)
   */
  classificarIMC(imc: number): string {
    if (!imc) return 'Não calculado';
    if (imc < 18.5) return 'Abaixo do peso';
    if (imc < 25) return 'Peso normal';
    if (imc < 30) return 'Sobrepeso';
    if (imc < 35) return 'Obesidade grau I';
    if (imc < 40) return 'Obesidade grau II';
    return 'Obesidade grau III';
  }

  /**
   * Formatar data para exibição (helper)
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  }
}

export default new MedidasCorporaisService();
