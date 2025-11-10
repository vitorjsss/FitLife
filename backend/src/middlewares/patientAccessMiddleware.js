import PatientProfessionalAssociationRepository from '../repositories/PatientProfessionalAssociationRepository.js';
import { PatientService } from '../services/PatientService.js';
import { LogService } from '../services/LogService.js';

/**
 * Middleware para verificar se o profissional tem acesso ao paciente
 * E se o tipo de dado solicitado é compatível com o tipo de profissional
 * 
 * @param {string} dataType - Tipo de dado: 'meal', 'workout', ou null para qualquer
 */
export const checkPatientAccess = (dataType = null) => {
    return async (req, res, next) => {
        const ip = req.ip;
        const userType = req.user?.user_type;
        const patientId = req.params.patientId;
        const userId = req.user?.id;

        try {
            // Verifica se é paciente acessando seus próprios dados
            if (userType === 'Patient') {
                const patient = await PatientService.getByAuthId(req.user.id);

                // Debug: log dos IDs para verificar comparação
                console.log('🔍 [DEBUG] Verificação de acesso do paciente:');
                console.log('   - Auth ID (req.user.id):', req.user.id);
                console.log('   - Patient ID do banco (patient.id):', patient?.id);
                console.log('   - Patient ID da rota (patientId):', patientId);
                console.log('   - São iguais?', patient?.id === patientId);

                if (patient && patient.id === patientId) {
                    return next();
                }

                await LogService.createLog({
                    action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
                    logType: 'SECURITY',
                    description: `Paciente ${userId} tentou acessar dados de outro paciente ${patientId}`,
                    ip,
                    oldValue: null,
                    newValue: { attemptedPatientId: patientId, actualPatientId: patient?.id },
                    status: 'FAILURE',
                    userId: userId
                });

                return res.status(403).json({
                    message: 'Você só pode acessar seus próprios dados'
                });
            }

            // Verifica se é profissional autorizado
            if (userType !== 'Nutricionist' && userType !== 'Physical_educator') {
                await LogService.createLog({
                    action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
                    logType: 'SECURITY',
                    description: `Usuário tipo ${userType} tentou acessar dados de paciente`,
                    ip,
                    oldValue: null,
                    newValue: { userType, patientId },
                    status: 'FAILURE',
                    userId: userId
                });

                return res.status(403).json({
                    message: 'Acesso não autorizado'
                });
            }

            // Obtém o professionalId do token (ou busca no banco)
            const professionalId = req.user?.professionalId;

            if (!professionalId) {
                await LogService.createLog({
                    action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
                    logType: 'SECURITY',
                    description: `Profissional sem professionalId no token tentou acessar dados`,
                    ip,
                    oldValue: null,
                    newValue: { userId, patientId },
                    status: 'FAILURE',
                    userId: userId
                });

                return res.status(403).json({
                    message: 'Dados do profissional incompletos'
                });
            }

            // Busca associação entre profissional e paciente
            const association = await PatientProfessionalAssociationRepository.findByPatientId(patientId);

            if (!association || !association.is_active) {
                await LogService.createLog({
                    action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
                    logType: 'SECURITY',
                    description: `${userType} ${professionalId} tentou acessar paciente ${patientId} sem associação`,
                    ip,
                    oldValue: null,
                    newValue: { professionalId, patientId, userType },
                    status: 'FAILURE',
                    userId: userId
                });

                return res.status(403).json({
                    message: 'Você não possui acesso a este paciente'
                });
            }

            // Verifica se o profissional está associado ao paciente
            const isAssociated =
                (userType === 'Nutricionist' && association.nutricionist_id === professionalId) ||
                (userType === 'Physical_educator' && association.physical_educator_id === professionalId);

            if (!isAssociated) {
                await LogService.createLog({
                    action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
                    logType: 'SECURITY',
                    description: `${userType} ${professionalId} não está associado ao paciente ${patientId}`,
                    ip,
                    oldValue: null,
                    newValue: {
                        professionalId,
                        patientId,
                        userType,
                        associationNutricionist: association.nutricionist_id,
                        associationEducator: association.physical_educator_id
                    },
                    status: 'FAILURE',
                    userId: userId
                });

                return res.status(403).json({
                    message: 'Você não está associado a este paciente'
                });
            }

            // Se especificou tipo de dado, verifica compatibilidade
            if (dataType) {
                if (dataType === 'meal' && userType !== 'Nutricionist') {
                    await LogService.createLog({
                        action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
                        logType: 'SECURITY',
                        description: `${userType} ${professionalId} tentou acessar dados de alimentação do paciente ${patientId}`,
                        ip,
                        oldValue: null,
                        newValue: { professionalId, patientId, userType, dataType },
                        status: 'FAILURE',
                        userId: userId
                    });

                    return res.status(403).json({
                        message: 'Apenas nutricionistas podem acessar dados de alimentação'
                    });
                }

                if (dataType === 'workout' && userType !== 'Physical_educator') {
                    await LogService.createLog({
                        action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
                        logType: 'SECURITY',
                        description: `${userType} ${professionalId} tentou acessar dados de treino do paciente ${patientId}`,
                        ip,
                        oldValue: null,
                        newValue: { professionalId, patientId, userType, dataType },
                        status: 'FAILURE',
                        userId: userId
                    });

                    return res.status(403).json({
                        message: 'Apenas educadores físicos podem acessar dados de treino'
                    });
                }
            }

            // Log de acesso autorizado
            await LogService.createLog({
                action: 'AUTHORIZED_DATA_ACCESS',
                logType: 'ACCESS',
                description: `${userType} ${professionalId} acessou dados ${dataType || 'gerais'} do paciente ${patientId}`,
                ip,
                oldValue: null,
                newValue: { professionalId, patientId, userType, dataType },
                status: 'SUCCESS',
                userId: userId
            });

            next();
        } catch (error) {
            console.error('[checkPatientAccess] Erro:', error);

            await LogService.createLog({
                action: 'ACCESS_CHECK_ERROR',
                logType: 'ERROR',
                description: `Erro ao verificar permissões: ${error.message}`,
                ip,
                oldValue: null,
                newValue: { error: error.message, patientId, userId },
                status: 'FAILURE',
                userId: userId
            }).catch(err => console.error('Erro ao criar log:', err));

            res.status(500).json({ message: 'Erro ao verificar permissões' });
        }
    };
};
