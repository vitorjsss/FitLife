import { apiClient } from './apiClient';

export interface MedidaNutricional {
  id: string;
  patient_id: string;
  data: string;
  calorias: number;
  proteina: number;
  carboidrato: number;
  gordura: number;
  created_at: string;
  updated_at: string;
}

export interface MedidaNutricionalInput {
  patient_id: string;
  data: string;
  calorias: number;
  proteina: number;
  carboidrato: number;
  gordura: number;
}

export interface EvolutionData {
  data: MedidaNutricional[];
  statistics?: {
    calorias_inicial: number;
    calorias_atual: number;
    diferenca_calorias: number;
    proteina_inicial: number;
    proteina_atual: number;
    diferenca_proteina: number;
    total_medicoes: number;
  };
}

export interface AverageData {
  media_calorias: number;
  media_proteina: number;
  media_carboidrato: number;
  media_gordura: number;
  total_registros: number;
}

export interface MacrosResult {
  proteina: number;
  carboidrato: number;
  gordura: number;
  total_calorias: number;
  percentuais: {
    proteina: number;
    carboidrato: number;
    gordura: number;
  };
}

class MedidasNutricionaisService {
  /**
   * Criar nova medida nutricional
   */
  async create(medidaData: MedidaNutricionalInput): Promise<MedidaNutricional> {
    return apiClient.post<MedidaNutricional>('/medidas-nutricionais', medidaData);
  }

  /**
   * Buscar todas as medidas de um paciente
   */
  async getByPatientId(patientId: string): Promise<MedidaNutricional[]> {
    return apiClient.get<MedidaNutricional[]>(`/medidas-nutricionais/patient/${patientId}`);
  }

  /**
   * Buscar medida por ID
   */
  async getById(id: string): Promise<MedidaNutricional> {
    return apiClient.get<MedidaNutricional>(`/medidas-nutricionais/${id}`);
  }

  /**
   * Buscar medidas por período
   */
  async getByDateRange(
    patientId: string,
    dataInicio: string,
    dataFim: string
  ): Promise<MedidaNutricional[]> {
    return apiClient.get<MedidaNutricional[]>(
      `/medidas-nutricionais/patient/${patientId}/range?dataInicio=${dataInicio}&dataFim=${dataFim}`
    );
  }

  /**
   * Buscar última medida do paciente
   */
  async getLatest(patientId: string): Promise<MedidaNutricional | null> {
    try {
      return await apiClient.get<MedidaNutricional>(`/medidas-nutricionais/patient/${patientId}/latest`);
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Atualizar medida nutricional
   */
  async update(id: string, medidaData: Partial<MedidaNutricionalInput>): Promise<MedidaNutricional> {
    return apiClient.put<MedidaNutricional>(`/medidas-nutricionais/${id}`, medidaData);
  }

  /**
   * Deletar medida nutricional
   */
  async delete(id: string): Promise<void> {
    return apiClient.delete<void>(`/medidas-nutricionais/${id}`);
  }

  /**
   * Obter média de macros no período
   */
  async getAverages(
    patientId: string,
    dataInicio: string,
    dataFim: string
  ): Promise<AverageData> {
    return apiClient.get<AverageData>(
      `/medidas-nutricionais/patient/${patientId}/averages?dataInicio=${dataInicio}&dataFim=${dataFim}`
    );
  }

  /**
   * Obter evolução nutricional
   */
  async getEvolution(patientId: string, limit: number = 10): Promise<EvolutionData> {
    return apiClient.get<EvolutionData>(
      `/medidas-nutricionais/patient/${patientId}/evolution?limit=${limit}`
    );
  }

  /**
   * Calcular percentual de macros via API
   */
  async calcularMacros(proteina: number, carboidrato: number, gordura: number): Promise<MacrosResult> {
    return apiClient.post<MacrosResult>('/medidas-nutricionais/calcular-macros', {
      proteina,
      carboidrato,
      gordura
    });
  }

  /**
   * Calcular percentual de macros localmente (helper)
   */
  calcularPercentualMacros(proteina: number, carboidrato: number, gordura: number) {
    const totalCalorias = (proteina * 4) + (carboidrato * 4) + (gordura * 9);
    
    if (totalCalorias === 0) {
      return {
        proteina: 0,
        carboidrato: 0,
        gordura: 0,
        total_calorias: 0
      };
    }

    return {
      proteina: parseFloat(((proteina * 4 / totalCalorias) * 100).toFixed(1)),
      carboidrato: parseFloat(((carboidrato * 4 / totalCalorias) * 100).toFixed(1)),
      gordura: parseFloat(((gordura * 9 / totalCalorias) * 100).toFixed(1)),
      total_calorias: totalCalorias
    };
  }

  /**
   * Validar distribuição de macros localmente (helper)
   */
  validarDistribuicaoMacros(calorias: number, proteina: number, carboidrato: number, gordura: number) {
    if (!calorias || calorias === 0) {
      return { valido: false, mensagem: 'Calorias totais devem ser fornecidas' };
    }

    const caloriasDeMacros = (proteina * 4) + (carboidrato * 4) + (gordura * 9);
    const diferenca = Math.abs(calorias - caloriasDeMacros);
    const margemErro = calorias * 0.1; // 10%

    if (diferenca > margemErro) {
      return {
        valido: false,
        mensagem: `Inconsistência: calorias informadas (${calorias}) diferem dos macros (${caloriasDeMacros.toFixed(0)})`,
        diferenca: diferenca.toFixed(0)
      };
    }

    return { valido: true };
  }

  /**
   * Formatar data para exibição (helper)
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  }

  /**
   * Obter cor para gráfico de macros (helper)
   */
  getColorForMacro(macro: 'proteina' | 'carboidrato' | 'gordura'): string {
    const colors = {
      proteina: '#FF6B6B',    // Vermelho
      carboidrato: '#4ECDC4', // Azul
      gordura: '#FFE66D'      // Amarelo
    };
    return colors[macro];
  }
}

export default new MedidasNutricionaisService();
