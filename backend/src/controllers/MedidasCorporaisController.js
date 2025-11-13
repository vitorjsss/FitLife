import MedidasCorporaisService from '../services/MedidasCorporaisService.js';

class MedidasCorporaisController {
    /**
     * Criar nova medida corporal
     * POST /medidas-corporais
     */
    async create(req, res) {
        try {
            const medidasData = {
                patient_id: req.body.patient_id,
                data: req.body.data,
                peso: req.body.peso,
                altura: req.body.altura,
                imc: req.body.imc,
                circunferencia: req.body.circunferencia
            };

            const medida = await MedidasCorporaisService.createMedida(medidasData, req.user.id);

            return res.status(201).json({
                success: true,
                message: 'Medida corporal criada com sucesso',
                data: medida
            });
        } catch (error) {
            console.error('Erro ao criar medida corporal:', error);
            return res.status(500).json({
                success: false,
                message: 'Erro ao criar medida corporal',
                error: error.message
            });
        }
    }

    /**
     * Buscar todas as medidas de um paciente
     * GET /medidas-corporais/patient/:patientId
     */
    async getByPatient(req, res) {
        try {
            const { patientId } = req.params;
            const medidas = await MedidasCorporaisService.getMedidasByPatient(patientId);

            return res.status(200).json({
                success: true,
                data: medidas,
                total: medidas.length
            });
        } catch (error) {
            console.error('Erro ao buscar medidas corporais:', error);
            return res.status(500).json({
                success: false,
                message: 'Erro ao buscar medidas corporais',
                error: error.message
            });
        }
    }

    /**
     * Buscar medida por ID
     * GET /medidas-corporais/:id
     */
    async getById(req, res) {
        try {
            const { id } = req.params;
            const medida = await MedidasCorporaisService.getMedidaById(id);

            return res.status(200).json({
                success: true,
                data: medida
            });
        } catch (error) {
            console.error('Erro ao buscar medida corporal:', error);
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
    }

    /**
     * Buscar medidas por período
     * GET /medidas-corporais/patient/:patientId/range?dataInicio=YYYY-MM-DD&dataFim=YYYY-MM-DD
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

            const medidas = await MedidasCorporaisService.getMedidasByDateRange(
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
     * GET /medidas-corporais/patient/:patientId/latest
     */
    async getLatest(req, res) {
        try {
            const { patientId } = req.params;
            const medida = await MedidasCorporaisService.getLatestMedida(patientId);

            if (!medida) {
                return res.status(404).json({
                    success: false,
                    message: 'Nenhuma medida encontrada para este paciente'
                });
            }

            return res.status(200).json({
                success: true,
                data: medida
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
     * Atualizar medida corporal
     * PUT /medidas-corporais/:id
     */
    async update(req, res) {
        try {
            const { id } = req.params;
            const medidasData = {
                data: req.body.data,
                peso: req.body.peso,
                altura: req.body.altura,
                imc: req.body.imc,
                circunferencia: req.body.circunferencia
            };

            const medidaAtualizada = await MedidasCorporaisService.updateMedida(
                id, 
                medidasData, 
                req.user.id
            );

            return res.status(200).json({
                success: true,
                message: 'Medida corporal atualizada com sucesso',
                data: medidaAtualizada
            });
        } catch (error) {
            console.error('Erro ao atualizar medida corporal:', error);
            return res.status(500).json({
                success: false,
                message: 'Erro ao atualizar medida corporal',
                error: error.message
            });
        }
    }

    /**
     * Deletar medida corporal
     * DELETE /medidas-corporais/:id
     */
    async delete(req, res) {
        try {
            const { id } = req.params;
            await MedidasCorporaisService.deleteMedida(id, req.user.id);

            return res.status(200).json({
                success: true,
                message: 'Medida corporal deletada com sucesso'
            });
        } catch (error) {
            console.error('Erro ao deletar medida corporal:', error);
            return res.status(500).json({
                success: false,
                message: 'Erro ao deletar medida corporal',
                error: error.message
            });
        }
    }

    /**
     * Obter evolução das medidas
     * GET /medidas-corporais/patient/:patientId/evolution?limit=10
     */
    async getEvolution(req, res) {
        try {
            const { patientId } = req.params;
            const limit = parseInt(req.query.limit) || 10;

            const evolution = await MedidasCorporaisService.getEvolution(patientId, limit);

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
     * Calcular IMC
     * POST /medidas-corporais/calcular-imc
     */
    async calcularIMC(req, res) {
        try {
            const { peso, altura } = req.body;

            if (!peso || !altura) {
                return res.status(400).json({
                    success: false,
                    message: 'Peso e altura são obrigatórios'
                });
            }

            const imc = MedidasCorporaisService.calcularIMC(peso, altura);
            const classificacao = MedidasCorporaisService.classificarIMC(imc);

            return res.status(200).json({
                success: true,
                data: {
                    imc,
                    classificacao,
                    peso,
                    altura
                }
            });
        } catch (error) {
            console.error('Erro ao calcular IMC:', error);
            return res.status(500).json({
                success: false,
                message: 'Erro ao calcular IMC',
                error: error.message
            });
        }
    }
}

export default new MedidasCorporaisController();
