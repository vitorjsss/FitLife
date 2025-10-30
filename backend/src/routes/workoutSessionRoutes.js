import { Router } from 'express';
import WorkoutSessionController from '../controllers/WorkoutSessionController.js';
import WorkoutExerciseLogController from '../controllers/WorkoutExerciseLogController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

const router = Router();

// Todas as rotas precisam de autenticação
router.use(authenticateToken);

// ===== SESSÕES DE TREINO (Workout Sessions) =====

// Criar nova sessão
router.post('/sessions', WorkoutSessionController.createSession);

// Buscar sessão por ID
router.get('/sessions/:id', WorkoutSessionController.getSessionById);

// Listar sessões do paciente
router.get('/sessions/patient/:patient_id', WorkoutSessionController.getPatientSessions);

// Listar sessões de um treino específico
router.get('/sessions/workout/:workout_id', WorkoutSessionController.getWorkoutSessions);

// Sessões por data
router.get('/sessions/patient/:patient_id/date/:date', WorkoutSessionController.getSessionsByDate);

// Atualizar sessão
router.put('/sessions/:id', WorkoutSessionController.updateSession);

// Completar sessão
router.post('/sessions/:id/complete', WorkoutSessionController.completeSession);

// Deletar sessão
router.delete('/sessions/:id', WorkoutSessionController.deleteSession);

// Estatísticas de treino
router.get('/stats/patient/:patient_id/workout/:workout_id', WorkoutSessionController.getWorkoutStats);

// Progresso da sessão
router.get('/sessions/:id/progress', WorkoutSessionController.getSessionProgress);

// ===== CHECKLIST DE EXERCÍCIOS (Exercise Logs) =====

// Buscar checklist completo de uma sessão
router.get('/sessions/:session_id/logs', WorkoutExerciseLogController.getSessionLogs);

// Buscar log específico de exercício
router.get('/logs/:log_id', WorkoutExerciseLogController.getLogById);

// Atualizar log de exercício (marcar séries/reps completadas)
router.put('/logs/:log_id', WorkoutExerciseLogController.updateExerciseLog);

// Toggle checked do exercício (marcar/desmarcar como feito)
router.patch('/logs/:log_id/checked', WorkoutExerciseLogController.toggleChecked);

// Marcar exercício como completo
router.post('/logs/:log_id/complete', WorkoutExerciseLogController.markExerciseComplete);

export default router;