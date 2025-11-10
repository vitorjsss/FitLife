import { pool } from '../config/db.js';
import { LogService } from '../services/LogService.js';

/**
 * Serviço de Testes de Persistência de Dados
 * Risco 2: Atualização das refeições - validação de commit e logs
 */
class PersistenceTestService {
    /**
     * Testa se uma atualização de meal_record foi persistida corretamente
     */
    async testMealRecordPersistence(mealRecordId) {
        const client = await pool.connect();
        
        try {
            // 1. Buscar registro atual
            const beforeResult = await client.query(
                'SELECT * FROM meal_record WHERE id = $1',
                [mealRecordId]
            );

            if (beforeResult.rows.length === 0) {
                return {
                    success: false,
                    error: 'Registro não encontrado',
                    mealRecordId
                };
            }

            const beforeData = beforeResult.rows[0];

            // 2. Fazer uma atualização de teste (marca como checked)
            const testUpdate = await client.query(
                `UPDATE meal_record 
                 SET checked = NOT checked, updated_at = NOW() 
                 WHERE id = $1 
                 RETURNING *`,
                [mealRecordId]
            );

            // 3. Verificar se o commit foi realizado
            await client.query('COMMIT');

            // 4. Buscar novamente para confirmar persistência
            const afterResult = await client.query(
                'SELECT * FROM meal_record WHERE id = $1',
                [mealRecordId]
            );

            const afterData = afterResult.rows[0];

            // 5. Validar que a mudança foi persistida
            const wasPersisted = beforeData.checked !== afterData.checked;

            // 6. Reverter a mudança de teste
            await client.query(
                `UPDATE meal_record 
                 SET checked = $1, updated_at = $2 
                 WHERE id = $3`,
                [beforeData.checked, beforeData.updated_at, mealRecordId]
            );

            await client.query('COMMIT');

            // 7. Registrar resultado do teste
            await LogService.createLog({
                action: 'PERSISTENCE_TEST_MEAL_RECORD',
                log_type: 'SYSTEM',
                description: wasPersisted 
                    ? `Teste de persistência APROVADO para meal_record ${mealRecordId}`
                    : `Teste de persistência FALHOU para meal_record ${mealRecordId}`,
                user_id: null,
                old_value: JSON.stringify(beforeData),
                new_value: JSON.stringify({
                    testPassed: wasPersisted,
                    beforeChecked: beforeData.checked,
                    afterChecked: afterData.checked
                })
            });

            return {
                success: wasPersisted,
                testPassed: wasPersisted,
                mealRecordId,
                before: beforeData,
                after: afterData,
                message: wasPersisted 
                    ? 'Persistência validada com sucesso'
                    : 'Falha na persistência - dados não foram salvos'
            };

        } catch (error) {
            await client.query('ROLLBACK');
            
            await LogService.createLog({
                action: 'PERSISTENCE_TEST_FAILED',
                log_type: 'SYSTEM',
                description: `Erro no teste de persistência: ${error.message}`,
                user_id: null,
                old_value: null,
                new_value: JSON.stringify({
                    error: error.message,
                    mealRecordId
                })
            });

            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Testa se uma atualização de daily_meal_registry foi persistida
     */
    async testDailyMealPersistence(registryId) {
        const client = await pool.connect();
        
        try {
            // 1. Buscar registro atual
            const beforeResult = await client.query(
                'SELECT * FROM daily_meal_registry WHERE id = $1',
                [registryId]
            );

            if (beforeResult.rows.length === 0) {
                return {
                    success: false,
                    error: 'Registro não encontrado',
                    registryId
                };
            }

            const beforeData = beforeResult.rows[0];

            // 2. Fazer atualização de teste
            const testValue = beforeData.observacoes 
                ? beforeData.observacoes + ' [TESTE]'
                : 'TESTE DE PERSISTÊNCIA';

            const testUpdate = await client.query(
                `UPDATE daily_meal_registry 
                 SET observacoes = $1, updated_at = NOW() 
                 WHERE id = $2 
                 RETURNING *`,
                [testValue, registryId]
            );

            await client.query('COMMIT');

            // 3. Verificar persistência
            const afterResult = await client.query(
                'SELECT * FROM daily_meal_registry WHERE id = $1',
                [registryId]
            );

            const afterData = afterResult.rows[0];
            const wasPersisted = afterData.observacoes === testValue;

            // 4. Reverter mudança
            await client.query(
                `UPDATE daily_meal_registry 
                 SET observacoes = $1, updated_at = $2 
                 WHERE id = $3`,
                [beforeData.observacoes, beforeData.updated_at, registryId]
            );

            await client.query('COMMIT');

            // 5. Registrar resultado
            await LogService.createLog({
                action: 'PERSISTENCE_TEST_DAILY_MEAL',
                log_type: 'SYSTEM',
                description: wasPersisted 
                    ? `Teste de persistência APROVADO para daily_meal_registry ${registryId}`
                    : `Teste de persistência FALHOU para daily_meal_registry ${registryId}`,
                user_id: null,
                old_value: JSON.stringify(beforeData),
                new_value: JSON.stringify({
                    testPassed: wasPersisted,
                    wasUpdated: afterData.observacoes === testValue
                })
            });

            return {
                success: wasPersisted,
                testPassed: wasPersisted,
                registryId,
                message: wasPersisted 
                    ? 'Persistência validada com sucesso'
                    : 'Falha na persistência - dados não foram salvos'
            };

        } catch (error) {
            await client.query('ROLLBACK');
            
            await LogService.createLog({
                action: 'PERSISTENCE_TEST_FAILED',
                log_type: 'SYSTEM',
                description: `Erro no teste de persistência: ${error.message}`,
                user_id: null,
                old_value: null,
                new_value: JSON.stringify({
                    error: error.message,
                    registryId
                })
            });

            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Teste completo de transação (ACID)
     * Valida que commits e rollbacks funcionam corretamente
     */
    async testTransactionIntegrity() {
        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');

            // 1. Criar registro temporário de teste
            const insertResult = await client.query(
                `INSERT INTO log (action, log_type, description, user_id, created_at) 
                 VALUES ($1, $2, $3, $4, NOW()) 
                 RETURNING *`,
                ['TEST_TRANSACTION', 'SYSTEM', 'Teste de integridade transacional', null]
            );

            const testLogId = insertResult.rows[0].id;

            // 2. Verificar se está visível dentro da transação
            const insideTransaction = await client.query(
                'SELECT * FROM log WHERE id = $1',
                [testLogId]
            );

            const visibleInTransaction = insideTransaction.rows.length > 0;

            // 3. Fazer ROLLBACK
            await client.query('ROLLBACK');

            // 4. Verificar se foi revertido
            const afterRollback = await client.query(
                'SELECT * FROM log WHERE id = $1',
                [testLogId]
            );

            const notVisibleAfterRollback = afterRollback.rows.length === 0;

            // 5. Teste de COMMIT bem-sucedido
            await client.query('BEGIN');

            const insertResult2 = await client.query(
                `INSERT INTO log (action, log_type, description, user_id, created_at) 
                 VALUES ($1, $2, $3, $4, NOW()) 
                 RETURNING *`,
                ['TEST_COMMIT', 'SYSTEM', 'Teste de commit bem-sucedido', null]
            );

            const testLogId2 = insertResult2.rows[0].id;

            await client.query('COMMIT');

            // 6. Verificar se persiste após commit
            const afterCommit = await client.query(
                'SELECT * FROM log WHERE id = $1',
                [testLogId2]
            );

            const persistedAfterCommit = afterCommit.rows.length > 0;

            // 7. Limpar teste
            await client.query('DELETE FROM log WHERE id = $1', [testLogId2]);

            // 8. Resultado final
            const allTestsPassed = visibleInTransaction && notVisibleAfterRollback && persistedAfterCommit;

            await LogService.createLog({
                action: 'TRANSACTION_INTEGRITY_TEST',
                log_type: 'SYSTEM',
                description: allTestsPassed 
                    ? 'Teste de integridade transacional APROVADO'
                    : 'Teste de integridade transacional FALHOU',
                user_id: null,
                old_value: null,
                new_value: JSON.stringify({
                    visibleInTransaction,
                    notVisibleAfterRollback,
                    persistedAfterCommit,
                    allTestsPassed
                })
            });

            return {
                success: allTestsPassed,
                tests: {
                    visibleInTransaction,
                    rollbackWorking: notVisibleAfterRollback,
                    commitWorking: persistedAfterCommit
                },
                message: allTestsPassed 
                    ? 'Integridade transacional validada (ACID compliant)'
                    : 'Falha na integridade transacional'
            };

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Validar logs de auditoria
     * Verifica se todas as atualizações geram logs
     */
    async validateAuditLogs(tableName, recordId, expectedAction) {
        try {
            // Buscar logs relacionados ao registro
            const logsResult = await pool.query(
                `SELECT * FROM log 
                 WHERE action LIKE $1 
                 AND (old_value LIKE $2 OR new_value LIKE $2)
                 ORDER BY created_at DESC 
                 LIMIT 10`,
                [`%${expectedAction}%`, `%${recordId}%`]
            );

            const hasLogs = logsResult.rows.length > 0;

            return {
                success: hasLogs,
                logsFound: logsResult.rows.length,
                logs: logsResult.rows,
                message: hasLogs 
                    ? `${logsResult.rows.length} log(s) de auditoria encontrado(s)`
                    : 'Nenhum log de auditoria encontrado - possível falha no sistema'
            };

        } catch (error) {
            console.error('Erro ao validar logs:', error);
            throw error;
        }
    }

    /**
     * Teste automático completo de persistência
     * Roda todos os testes e retorna relatório
     */
    async runFullPersistenceTest() {
        console.log('🧪 Iniciando bateria completa de testes de persistência...');

        const results = {
            timestamp: new Date().toISOString(),
            tests: {},
            overallSuccess: true
        };

        try {
            // Teste 1: Integridade transacional
            console.log('📝 Teste 1: Integridade Transacional (ACID)');
            results.tests.transactionIntegrity = await this.testTransactionIntegrity();
            if (!results.tests.transactionIntegrity.success) results.overallSuccess = false;

            // Teste 2: Buscar um meal_record existente para testar
            const mealRecordResult = await pool.query('SELECT id FROM meal_record LIMIT 1');
            
            if (mealRecordResult.rows.length > 0) {
                const mealRecordId = mealRecordResult.rows[0].id;
                console.log('📝 Teste 2: Persistência de Meal Record');
                results.tests.mealRecordPersistence = await this.testMealRecordPersistence(mealRecordId);
                if (!results.tests.mealRecordPersistence.success) results.overallSuccess = false;
            } else {
                results.tests.mealRecordPersistence = { 
                    skipped: true, 
                    message: 'Nenhum meal_record disponível para teste' 
                };
            }

            // Teste 3: Buscar um daily_meal_registry existente
            const dailyMealResult = await pool.query('SELECT id FROM daily_meal_registry LIMIT 1');
            
            if (dailyMealResult.rows.length > 0) {
                const registryId = dailyMealResult.rows[0].id;
                console.log('📝 Teste 3: Persistência de Daily Meal Registry');
                results.tests.dailyMealPersistence = await this.testDailyMealPersistence(registryId);
                if (!results.tests.dailyMealPersistence.success) results.overallSuccess = false;
            } else {
                results.tests.dailyMealPersistence = { 
                    skipped: true, 
                    message: 'Nenhum daily_meal_registry disponível para teste' 
                };
            }

            // Registrar resultado final
            await LogService.createLog({
                action: 'FULL_PERSISTENCE_TEST',
                log_type: 'SYSTEM',
                description: results.overallSuccess 
                    ? 'Bateria completa de testes de persistência APROVADA'
                    : 'Bateria de testes de persistência FALHOU em alguns casos',
                user_id: null,
                old_value: null,
                new_value: JSON.stringify(results)
            });

            console.log(results.overallSuccess 
                ? '✅ Todos os testes de persistência APROVADOS'
                : '❌ Alguns testes de persistência FALHARAM');

            return results;

        } catch (error) {
            console.error('❌ Erro na bateria de testes:', error);
            
            results.overallSuccess = false;
            results.error = error.message;

            await LogService.createLog({
                action: 'PERSISTENCE_TEST_ERROR',
                log_type: 'SYSTEM',
                description: `Erro na bateria de testes: ${error.message}`,
                user_id: null,
                old_value: null,
                new_value: JSON.stringify({ error: error.message })
            });

            throw error;
        }
    }
}

export default new PersistenceTestService();
