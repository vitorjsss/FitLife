import MedidasNutricionaisService from '../services/MedidasNutricionaisService.js';

class MedidasNutricionaisController {
    /**
     * Criar nova medida nutricional
     * POST /medidas-nutricionais
     */
    async create(req, res) {
        try {
            const medidasData = {
                patient_id: req.body.patient_id,
                data: req.body.data,
                calorias: req.body.calorias,
                proteina: req.body.proteina,
                carboidrato: req.body.carboidrato,
                gordura: req.body.gordura
            };

            // Validar distribuição de macros (opcional)
            if (medidasData.calorias && medidasData.proteina && 
                medidasData.carboidrato && medidasData.gordura) {
                const validacao = MedidasNutricionaisService.validarDistribuicaoMacros(
                    medidasData.calorias,
                    medidasData.proteina,
                    medidasData.carboidrato,
                    medidasData.gordura
                );

                if (!validacao.valido) {
                    return res.status(400).json({
                        success: false,
                        message: validacao.mensagem,
                        diferenca: validacao.diferenca
                    });
                }
            }

            const medida = await MedidasNutricionaisService.createMedida(medidasData, req.user.id);

            // Calcular percentuais
            const percentuais = MedidasNutricionaisService.calcularPercentualMacros(
                medida.proteina,
                medida.carboidrato,
                medida.gordura
            );

            return res.status(201).json({
                success: true,
                message: 'Medida nutricional criada com sucesso',
                data: {
                    ...medida,
                    percentuais
                }
            });
        } catch (error) {
            console.error('Erro ao criar medida nutricional:', error);
            return res.status(500).json({
                success: false,
                message: 'Erro ao criar medida nutricional',
                error: error.message
            });
        }
    }

    /**
     * Buscar todas as medidas de um paciente
     * GET /medidas-nutricionais/patient/:patientId
     */
    async getByPatient(req, res) {
        try {
            const { patientId } = req.params;
            const medidas = await MedidasNutricionaisService.getMedidasByPatient(patientId);

            return res.status(200).json({
                success: true,
                data: medidas,
                total: medidas.length
            });
        } catch (error) {
            console.error('Erro ao buscar medidas nutricionais:', error);
            return res.status(500).json({
                success: false,
                message: 'Erro ao buscar medidas nutricionais',
                error: error.message
            });
        }
    }

    /**
     * Buscar medida por ID
     * GET /medidas-nutricionais/:id
     */
    async getById(req, res) {
        try {
            const { id } = req.params;
            const medida = await MedidasNutricionaisService.getMedidaById(id);

            // Calcular percentuais
            const percentuais = MedidasNutricionaisService.calcularPercentualMacros(
                medida.proteina,
                medida.carboidrato,
                medida.gordura
            );

            return res.status(200).json({
                success: true,
                data: {
                    ...medida,
                    percentuais
                }
            });
        } catch (error) {
            console.error('Erro ao buscar medida nutricional:', error);
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
    }

    /**
     * Buscar medidas por período
     * GET /medidas-nutricionais/patient/:patientId/range?dataInicio=YYYY-MM-DD&dataFim=YYYY-MM-DD
     */
    async getByDateRange(req, res) {
        try {
            const { patientId } = req.params;
            const { dataInicio, dataFim } = req.query;

            if (!dataInicio || !dataFim) {
                return res.status(400).json({
                    success: false,
                    message: 'Parâmetros dataInicio e dataFim são obrigatórios'
                });
            }

            const medidas = await MedidasNutricionaisService.getMedidasByDateRange(
                patientId, 
                dataInicio, 
                dataFim
            );

            return res.status(200).json({
                success: true,
                data: medidas,
                total: medidas.length,
                periodo: { dataInicio, dataFim }
            });
        } catch (error) {
            console.error('Erro ao buscar medidas por período:', error);
            return res.status(500).json({
                success: false,
                message: 'Erro ao buscar medidas por período',
                error: error.message
            });
        }
    }

    /**
     * Buscar última medida do paciente
     * GET /medidas-nutricionais/patient/:patientId/latest
     */
    async getLatest(req, res) {
        try {
            const { patientId } = req.params;
            const medida = await MedidasNutricionaisService.getLatestMedida(patientId);

            if (!medida) {
                return res.status(404).json({
                    success: false,
                    message: 'Nenhuma medida encontrada para este paciente'
                });
            }

            // Calcular percentuais
            const percentuais = MedidasNutricionaisService.calcularPercentualMacros(
                medida.proteina,
                medida.carboidrato,
                medida.gordura
            );

            return res.status(200).json({
                success: true,
                data: {
                    ...medida,
                    percentuais
                }
            });
        } catch (error) {
            console.error('Erro ao buscar última medida:', error);
            return res.status(500).json({
                success: false,
                message: 'Erro ao buscar última medida',
                error: error.message
            });
        }
    }

    /**
     * Atualizar medida nutricional
     * PUT /medidas-nutricionais/:id
     */
    async update(req, res) {
        try {
            const { id } = req.params;
            const medidasData = {
                data: req.body.data,
                calorias: req.body.calorias,
                proteina: req.body.proteina,
                carboidrato: req.body.carboidrato,
                gordura: req.body.gordura
            };

            const medidaAtualizada = await MedidasNutricionaisService.updateMedida(
                id, 
                medidasData, 
                req.user.id
            );

            // Calcular percentuais
            const percentuais = MedidasNutricionaisService.calcularPercentualMacros(
                medidaAtualizada.proteina,
                medidaAtualizada.carboidrato,
                medidaAtualizada.gordura
            );

            return res.status(200).json({
                success: true,
                message: 'Medida nutricional atualizada com sucesso',
                data: {
                    ...medidaAtualizada,
                    percentuais
                }
            });
        } catch (error) {
            console.error('Erro ao atualizar medida nutricional:', error);
            return res.status(500).json({
                success: false,
                message: 'Erro ao atualizar medida nutricional',
                error: error.message
            });
        }
    }

    /**
     * Deletar medida nutricional
     * DELETE /medidas-nutricionais/:id
     */
    async delete(req, res) {
        try {
            const { id } = req.params;
            await MedidasNutricionaisService.deleteMedida(id, req.user.id);

            return res.status(200).json({
                success: true,
                message: 'Medida nutricional deletada com sucesso'
            });
        } catch (error) {
            console.error('Erro ao deletar medida nutricional:', error);
            return res.status(500).json({
                success: false,
                message: 'Erro ao deletar medida nutricional',
                error: error.message
            });
        }
    }

    /**
     * Obter média de macros no período
     * GET /medidas-nutricionais/patient/:patientId/averages?dataInicio=YYYY-MM-DD&dataFim=YYYY-MM-DD
     */
    async getAverages(req, res) {
        try {
            const { patientId } = req.params;
            const { dataInicio, dataFim } = req.query;

            if (!dataInicio || !dataFim) {
                return res.status(400).json({
                    success: false,
                    message: 'Parâmetros dataInicio e dataFim são obrigatórios'
                });
            }

            const averages = await MedidasNutricionaisService.getAverages(
                patientId, 
                dataInicio, 
                dataFim
            );

            return res.status(200).json({
                success: true,
                data: averages,
                periodo: { dataInicio, dataFim }
            });
        } catch (error) {
            console.error('Erro ao calcular médias:', error);
            return res.status(500).json({
                success: false,
                message: 'Erro ao calcular médias',
                error: error.message
            });
        }
    }

    /**
     * Obter evolução nutricional
     * GET /medidas-nutricionais/patient/:patientId/evolution?limit=10
     */
    async getEvolution(req, res) {
        try {
            const { patientId } = req.params;
            const limit = parseInt(req.query.limit) || 10;

            const evolution = await MedidasNutricionaisService.getEvolution(patientId, limit);

            return res.status(200).json({
                success: true,
                data: evolution.data,
                statistics: evolution.statistics
            });
        } catch (error) {
            console.error('Erro ao buscar evolução:', error);
            return res.status(500).json({
                success: false,
                message: 'Erro ao buscar evolução',
                error: error.message
            });
        }
    }

    /**
     * Calcular percentual de macros
     * POST /medidas-nutricionais/calcular-macros
     */
    async calcularMacros(req, res) {
        try {
            const { proteina, carboidrato, gordura } = req.body;

            if (!proteina || !carboidrato || !gordura) {
                return res.status(400).json({
                    success: false,
                    message: 'Proteína, carboidrato e gordura são obrigatórios'
                });
            }

            const percentuais = MedidasNutricionaisService.calcularPercentualMacros(
                proteina,
                carboidrato,
                gordura
            );

            const totalCalorias = (proteina * 4) + (carboidrato * 4) + (gordura * 9);

            return res.status(200).json({
                success: true,
                data: {
                    proteina,
                    carboidrato,
                    gordura,
                    total_calorias: totalCalorias,
                    percentuais
                }
            });
        } catch (error) {
            console.error('Erro ao calcular macros:', error);
            return res.status(500).json({
                success: false,
                message: 'Erro ao calcular macros',
                error: error.message
            });
        }
    }
}

export default new MedidasNutricionaisController();
