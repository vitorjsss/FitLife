import { Router } from 'express';
import MedidasCorporaisController from '../controllers/MedidasCorporaisController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

const router = Router();

// Todas as rotas requerem autenticação
router.use(authenticateToken);

/**
 * @route POST /medidas-corporais
 * @desc Criar nova medida corporal
 * @access Private
 */
router.post('/', MedidasCorporaisController.create);

/**
 * @route GET /medidas-corporais/patient/:patientId
 * @desc Buscar todas as medidas de um paciente
 * @access Private
 */
router.get('/patient/:patientId', MedidasCorporaisController.getByPatient);

/**
 * @route GET /medidas-corporais/patient/:patientId/latest
 * @desc Buscar última medida do paciente
 * @access Private
 */
router.get('/patient/:patientId/latest', MedidasCorporaisController.getLatest);

/**
 * @route GET /medidas-corporais/patient/:patientId/range
 * @desc Buscar medidas por período
 * @query dataInicio, dataFim
 * @access Private
 */
router.get('/patient/:patientId/range', MedidasCorporaisController.getByDateRange);

/**
 * @route GET /medidas-corporais/patient/:patientId/evolution
 * @desc Obter evolução das medidas
 * @query limit (opcional)
 * @access Private
 */
router.get('/patient/:patientId/evolution', MedidasCorporaisController.getEvolution);

/**
 * @route GET /medidas-corporais/:id
 * @desc Buscar medida por ID
 * @access Private
 */
router.get('/:id', MedidasCorporaisController.getById);

/**
 * @route PUT /medidas-corporais/:id
 * @desc Atualizar medida corporal
 * @access Private
 */
router.put('/:id', MedidasCorporaisController.update);

/**
 * @route DELETE /medidas-corporais/:id
 * @desc Deletar medida corporal
 * @access Private
 */
router.delete('/:id', MedidasCorporaisController.delete);

/**
 * @route POST /medidas-corporais/calcular-imc
 * @desc Calcular IMC
 * @access Private
 */
router.post('/calcular-imc', MedidasCorporaisController.calcularIMC);

export default router;
