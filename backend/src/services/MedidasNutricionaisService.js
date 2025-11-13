import MedidasNutricionaisRepository from '../repositories/MedidasNutricionaisRepository.js';
import { LogService } from './LogService.js';

class MedidasNutricionaisService {
    /**
     * Criar nova medida nutricional
     */
    async createMedida(medidasData, userId) {
        try {
            const medida = await MedidasNutricionaisRepository.create(medidasData);

            // Log da ação
            await LogService.log({
                action: 'CREATE_MEDIDA_NUTRICIONAL',
                log_type: 'MEDIDA',
                description: `Medida nutricional criada para paciente ${medidasData.patient_id}`,
                user_id: userId,
                new_value: JSON.stringify(medida)
            });

            return medida;
        } catch (error) {
            await LogService.log({
                action: 'CREATE_MEDIDA_NUTRICIONAL_ERROR',
                log_type: 'ERROR',
                description: `Erro ao criar medida nutricional: ${error.message}`,
                user_id: userId,
                status: 'ERROR'
            });
            throw error;
        }
    }

    /**
     * Buscar medidas de um paciente
     */
    async getMedidasByPatient(patientId) {
        try {
            const medidas = await MedidasNutricionaisRepository.findByPatientId(patientId);
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
            const medida = await MedidasNutricionaisRepository.findById(id);
            if (!medida) {
                throw new Error('Medida nutricional não encontrada');
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
            const medidas = await MedidasNutricionaisRepository.findByDateRange(
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
            const medida = await MedidasNutricionaisRepository.findLatestByPatientId(patientId);
            return medida;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Atualizar medida nutricional
     */
    async updateMedida(id, medidasData, userId) {
        try {
            const medidaAntiga = await MedidasNutricionaisRepository.findById(id);
            
            if (!medidaAntiga) {
                throw new Error('Medida nutricional não encontrada');
            }

            const medidaAtualizada = await MedidasNutricionaisRepository.update(id, medidasData);

            // Log da ação
            await LogService.log({
                action: 'UPDATE_MEDIDA_NUTRICIONAL',
                log_type: 'MEDIDA',
                description: `Medida nutricional ${id} atualizada`,
                user_id: userId,
                old_value: JSON.stringify(medidaAntiga),
                new_value: JSON.stringify(medidaAtualizada)
            });

            return medidaAtualizada;
        } catch (error) {
            await LogService.log({
                action: 'UPDATE_MEDIDA_NUTRICIONAL_ERROR',
                log_type: 'ERROR',
                description: `Erro ao atualizar medida nutricional: ${error.message}`,
                user_id: userId,
                status: 'ERROR'
            });
            throw error;
        }
    }

    /**
     * Deletar medida nutricional
     */
    async deleteMedida(id, userId) {
        try {
            const medida = await MedidasNutricionaisRepository.findById(id);
            
            if (!medida) {
                throw new Error('Medida nutricional não encontrada');
            }

            const medidaDeletada = await MedidasNutricionaisRepository.delete(id);

            // Log da ação
            await LogService.log({
                action: 'DELETE_MEDIDA_NUTRICIONAL',
                log_type: 'MEDIDA',
                description: `Medida nutricional ${id} deletada`,
                user_id: userId,
                old_value: JSON.stringify(medida)
            });

            return medidaDeletada;
        } catch (error) {
            await LogService.log({
                action: 'DELETE_MEDIDA_NUTRICIONAL_ERROR',
                log_type: 'ERROR',
                description: `Erro ao deletar medida nutricional: ${error.message}`,
                user_id: userId,
                status: 'ERROR'
            });
            throw error;
        }
    }

    /**
     * Obter média de macronutrientes no período
     */
    async getAverages(patientId, dataInicio, dataFim) {
        try {
            const averages = await MedidasNutricionaisRepository.getAverageData(
                patientId, 
                dataInicio, 
                dataFim
            );
            
            return {
                media_calorias: parseFloat(averages.media_calorias?.toFixed(2) || 0),
                media_proteina: parseFloat(averages.media_proteina?.toFixed(2) || 0),
                media_carboidrato: parseFloat(averages.media_carboidrato?.toFixed(2) || 0),
                media_gordura: parseFloat(averages.media_gordura?.toFixed(2) || 0),
                total_registros: parseInt(averages.total_registros || 0)
            };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Obter evolução nutricional
     */
    async getEvolution(patientId, limit = 10) {
        try {
            const evolution = await MedidasNutricionaisRepository.getEvolutionData(patientId, limit);
            
            // Calcular estatísticas
            if (evolution.length > 1) {
                const latest = evolution[0];
                const oldest = evolution[evolution.length - 1];
                
                return {
                    data: evolution,
                    statistics: {
                        calorias_inicial: oldest.calorias,
                        calorias_atual: latest.calorias,
                        diferenca_calorias: latest.calorias - oldest.calorias,
                        proteina_inicial: oldest.proteina,
                        proteina_atual: latest.proteina,
                        diferenca_proteina: latest.proteina - oldest.proteina,
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
     * Validar distribuição de macronutrientes
     */
    validarDistribuicaoMacros(calorias, proteina, carboidrato, gordura) {
        if (!calorias || calorias === 0) {
            return { valido: false, mensagem: 'Calorias totais devem ser fornecidas' };
        }

        // Calcular calorias de cada macro (proteína e carbo: 4 kcal/g, gordura: 9 kcal/g)
        const caloriasDeMacros = (proteina * 4) + (carboidrato * 4) + (gordura * 9);
        const diferenca = Math.abs(calorias - caloriasDeMacros);
        
        // Aceitar até 10% de diferença
        const margemErro = calorias * 0.1;
        
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
     * Calcular percentual de macros
     */
    calcularPercentualMacros(proteina, carboidrato, gordura) {
        const totalCalorias = (proteina * 4) + (carboidrato * 4) + (gordura * 9);
        
        if (totalCalorias === 0) {
            return { proteina: 0, carboidrato: 0, gordura: 0 };
        }

        return {
            proteina: parseFloat(((proteina * 4 / totalCalorias) * 100).toFixed(1)),
            carboidrato: parseFloat(((carboidrato * 4 / totalCalorias) * 100).toFixed(1)),
            gordura: parseFloat(((gordura * 9 / totalCalorias) * 100).toFixed(1))
        };
    }
}

export default new MedidasNutricionaisService();
