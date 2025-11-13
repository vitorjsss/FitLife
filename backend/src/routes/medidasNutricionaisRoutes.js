import { Router } from 'express';
import MedidasNutricionaisController from '../controllers/MedidasNutricionaisController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

const router = Router();

// Todas as rotas requerem autenticação
router.use(authenticateToken);

/**
 * @route POST /medidas-nutricionais
 * @desc Criar nova medida nutricional
 * @access Private
 */
router.post('/', MedidasNutricionaisController.create);

/**
 * @route GET /medidas-nutricionais/patient/:patientId
 * @desc Buscar todas as medidas de um paciente
 * @access Private
 */
router.get('/patient/:patientId', MedidasNutricionaisController.getByPatient);

/**
 * @route GET /medidas-nutricionais/patient/:patientId/latest
 * @desc Buscar última medida do paciente
 * @access Private
 */
router.get('/patient/:patientId/latest', MedidasNutricionaisController.getLatest);

/**
 * @route GET /medidas-nutricionais/patient/:patientId/range
 * @desc Buscar medidas por período
 * @query dataInicio, dataFim
 * @access Private
 */
router.get('/patient/:patientId/range', MedidasNutricionaisController.getByDateRange);

/**
 * @route GET /medidas-nutricionais/patient/:patientId/averages
 * @desc Obter média de macros no período
 * @query dataInicio, dataFim
 * @access Private
 */
router.get('/patient/:patientId/averages', MedidasNutricionaisController.getAverages);

/**
 * @route GET /medidas-nutricionais/patient/:patientId/evolution
 * @desc Obter evolução nutricional
 * @query limit (opcional)
 * @access Private
 */
router.get('/patient/:patientId/evolution', MedidasNutricionaisController.getEvolution);

/**
 * @route GET /medidas-nutricionais/:id
 * @desc Buscar medida por ID
 * @access Private
 */
router.get('/:id', MedidasNutricionaisController.getById);

/**
 * @route PUT /medidas-nutricionais/:id
 * @desc Atualizar medida nutricional
 * @access Private
 */
router.put('/:id', MedidasNutricionaisController.update);

/**
 * @route DELETE /medidas-nutricionais/:id
 * @desc Deletar medida nutricional
 * @access Private
 */
router.delete('/:id', MedidasNutricionaisController.delete);

/**
 * @route POST /medidas-nutricionais/calcular-macros
 * @desc Calcular percentual de macronutrientes
 * @access Private
 */
router.post('/calcular-macros', MedidasNutricionaisController.calcularMacros);

export default router;
