import { Router } from 'express';
import WorkoutController from '../controllers/WorkoutController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

const router = Router();

// Todas as rotas precisam de autenticação
router.use(authenticateToken);

// Rotas para treinos
router.post('/', WorkoutController.createWorkout);
router.get('/:id', WorkoutController.getWorkoutById);
router.get('/patient/:patient_id', WorkoutController.getWorkoutsByPatient);
router.get('/educator/:educator_id', WorkoutController.getWorkoutsByEducator);
router.put('/:id', WorkoutController.updateWorkout);
router.delete('/:id', WorkoutController.deleteWorkout);

// Rotas para exercícios
router.post('/:workout_id/exercises', WorkoutController.addExercise);
router.put('/exercises/:exercise_id', WorkoutController.updateExercise);
router.delete('/exercises/:exercise_id', WorkoutController.removeExercise);
router.get('/exercises/:exercise_id', WorkoutController.getExerciseById);

export default router;