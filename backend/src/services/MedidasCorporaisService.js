import MedidasCorporaisRepository from '../repositories/MedidasCorporaisRepository.js';
import { LogService } from './LogService.js';

class MedidasCorporaisService {
    /**
     * Criar nova medida corporal
     */
    async createMedida(medidasData, userId) {
        try {
            // Calcular IMC se não fornecido
            if (medidasData.peso && medidasData.altura && !medidasData.imc) {
                medidasData.imc = this.calcularIMC(medidasData.peso, medidasData.altura);
            }

            const medida = await MedidasCorporaisRepository.create(medidasData);

            // Log da ação
            try {
                await LogService.createLog({
                    action: 'CREATE_MEDIDA_CORPORAL',
                    log_type: 'MEDIDA',
                    description: `Medida corporal criada para paciente ${medidasData.patient_id}`,
                    user_id: userId,
                    newValue: JSON.stringify(medida)
                });
            } catch (logError) {
                console.error('Erro ao criar log:', logError);
                // Não propagar o erro de log
            }

            return medida;
        } catch (error) {
            try {
                await LogService.createLog({
                    action: 'CREATE_MEDIDA_CORPORAL_ERROR',
                    log_type: 'ERROR',
                    description: `Erro ao criar medida corporal: ${error.message}`,
                    user_id: userId,
                    status: 'ERROR'
                });
            } catch (logError) {
                console.error('Erro ao criar log de erro:', logError);
            }
            throw error;
        }
    }

    /**
     * Buscar medidas de um paciente
     */
    async getMedidasByPatient(patientId) {
        try {
            const medidas = await MedidasCorporaisRepository.findByPatientId(patientId);
            return medidas;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Buscar medida por ID
     */
    async getMedidaById(id) {
        try {
            const medida = await MedidasCorporaisRepository.findById(id);
            if (!medida) {
                throw new Error('Medida corporal não encontrada');
            }
            return medida;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Buscar medidas por período
     */
    async getMedidasByDateRange(patientId, dataInicio, dataFim) {
        try {
            const medidas = await MedidasCorporaisRepository.findByDateRange(
                patientId, 
                dataInicio, 
                dataFim
            );
            return medidas;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Buscar última medida
     */
    async getLatestMedida(patientId) {
        try {
            const medida = await MedidasCorporaisRepository.findLatestByPatientId(patientId);
            return medida;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Atualizar medida corporal
     */
    async updateMedida(id, medidasData, userId) {
        try {
            const medidaAntiga = await MedidasCorporaisRepository.findById(id);
            
            if (!medidaAntiga) {
                throw new Error('Medida corporal não encontrada');
            }

            // Recalcular IMC se peso ou altura mudaram
            if (medidasData.peso && medidasData.altura) {
                medidasData.imc = this.calcularIMC(medidasData.peso, medidasData.altura);
            }

            const medidaAtualizada = await MedidasCorporaisRepository.update(id, medidasData);

            // Log da ação
            try {
                await LogService.createLog({
                    action: 'UPDATE_MEDIDA_CORPORAL',
                    log_type: 'MEDIDA',
                    description: `Medida corporal ${id} atualizada`,
                    user_id: userId,
                    oldValue: JSON.stringify(medidaAntiga),
                    newValue: JSON.stringify(medidaAtualizada)
                });
            } catch (logError) {
                console.error('Erro ao criar log:', logError);
            }

            return medidaAtualizada;
        } catch (error) {
            try {
                await LogService.createLog({
                    action: 'UPDATE_MEDIDA_CORPORAL_ERROR',
                    log_type: 'ERROR',
                    description: `Erro ao atualizar medida corporal: ${error.message}`,
                    user_id: userId,
                    status: 'ERROR'
                });
            } catch (logError) {
                console.error('Erro ao criar log de erro:', logError);
            }
            throw error;
        }
    }

    /**
     * Deletar medida corporal
     */
    async deleteMedida(id, userId) {
        try {
            const medida = await MedidasCorporaisRepository.findById(id);
            
            if (!medida) {
                throw new Error('Medida corporal não encontrada');
            }

            const medidaDeletada = await MedidasCorporaisRepository.delete(id);

            // Log da ação
            try {
                await LogService.createLog({
                    action: 'DELETE_MEDIDA_CORPORAL',
                    log_type: 'MEDIDA',
                    description: `Medida corporal ${id} deletada`,
                    user_id: userId,
                    oldValue: JSON.stringify(medida)
                });
            } catch (logError) {
                console.error('Erro ao criar log:', logError);
            }

            return medidaDeletada;
        } catch (error) {
            try {
                await LogService.createLog({
                    action: 'DELETE_MEDIDA_CORPORAL_ERROR',
                    log_type: 'ERROR',
                    description: `Erro ao deletar medida corporal: ${error.message}`,
                    user_id: userId,
                    status: 'ERROR'
                });
            } catch (logError) {
                console.error('Erro ao criar log de erro:', logError);
            }
            throw error;
        }
    }

    /**
     * Obter evolução das medidas
     */
    async getEvolution(patientId, limit = 10) {
        try {
            const evolution = await MedidasCorporaisRepository.getEvolutionData(patientId, limit);
            
            // Calcular estatísticas
            if (evolution.length > 1) {
                const latest = evolution[0];
                const oldest = evolution[evolution.length - 1];
                
                return {
                    data: evolution,
                    statistics: {
                        peso_inicial: oldest.peso,
                        peso_atual: latest.peso,
                        diferenca_peso: latest.peso - oldest.peso,
                        imc_inicial: oldest.imc,
                        imc_atual: latest.imc,
                        diferenca_imc: latest.imc - oldest.imc,
                        total_medicoes: evolution.length
                    }
                };
            }
            
            return { data: evolution, statistics: null };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Calcular IMC
     */
    calcularIMC(peso, altura) {
        if (!peso || !altura || altura === 0) {
            return null;
        }
        return parseFloat((peso / (altura * altura)).toFixed(2));
    }

    /**
     * Classificar IMC
     */
    classificarIMC(imc) {
        if (!imc) return 'Não calculado';
        if (imc < 18.5) return 'Abaixo do peso';
        if (imc < 25) return 'Peso normal';
        if (imc < 30) return 'Sobrepeso';
        if (imc < 35) return 'Obesidade grau I';
        if (imc < 40) return 'Obesidade grau II';
        return 'Obesidade grau III';
    }
}

export default new MedidasCorporaisService();
