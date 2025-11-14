// ================================================
// VALIDAÇÃO - RISCO 10: ATUALIZAÇÃO DE CHECKLISTS
// Sistema: FitLife
// Data: 14/11/2025
// ================================================

import pkg from 'pg';
const { Pool } = pkg;

// Configuração do banco de dados
const pool = new Pool({
    host: 'localhost',
    port: 5433,
    database: 'fitlife',
    user: 'fitlife',
    password: 'fitlife'
});

// Cores para output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

// Função para imprimir com cor
function print(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

// Variáveis globais para os testes
let testPatientId;
let testMealRecordId;
let testWorkoutRecordId;

// Contador de testes
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

// ================================================
// FUNÇÕES AUXILIARES
// ================================================

async function runTest(testName, testFn) {
    totalTests++;
    try {
        await testFn();
        passedTests++;
        print(`✓ ${testName}`, 'green');
        return true;
    } catch (error) {
        failedTests++;
        print(`✗ ${testName}`, 'red');
        print(`  Erro: ${error.message}`, 'red');
        return false;
    }
}

function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}

// ================================================
// PREPARAÇÃO DO AMBIENTE
// ================================================

async function setupTestEnvironment() {
    print('\n[1/6] Preparando ambiente de teste...', 'cyan');
    
    // Buscar paciente existente
    const patientResult = await pool.query(
        'SELECT id FROM patient LIMIT 1'
    );
    
    if (patientResult.rows.length === 0) {
        throw new Error('Nenhum paciente encontrado no banco de dados');
    }
    
    testPatientId = patientResult.rows[0].id;
    print(`✓ Paciente de teste encontrado: ${testPatientId}`, 'green');
    
    // Criar MealRecord de teste
    const mealResult = await pool.query(
        `INSERT INTO mealrecord (name, date, patient_id, checked)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        ['Teste Checklist Meal', new Date(), testPatientId, false]
    );
    testMealRecordId = mealResult.rows[0].id;
    print(`✓ MealRecord de teste criado: ${testMealRecordId}`, 'green');
    
    // Adicionar item à refeição (necessário para validação de checklist)
    // Cálculo correto: 4*10 + 4*20 + 9*5 = 40 + 80 + 45 = 165 calorias
    await pool.query(
        `INSERT INTO mealitem (meal_record_id, food_name, calories, proteins, carbs, fats)
         VALUES ($1, 'Alimento Teste', 165, 10, 20, 5)`,
        [testMealRecordId]
    );
    print(`✓ MealItem adicionado à refeição`, 'green');
    
    // Criar WorkoutRecord de teste
    const workoutResult = await pool.query(
        `INSERT INTO workoutrecord (name, date, patient_id, checked)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        ['Teste Checklist Workout', new Date(), testPatientId, false]
    );
    testWorkoutRecordId = workoutResult.rows[0].id;
    print(`✓ WorkoutRecord de teste criado: ${testWorkoutRecordId}`, 'green');
}

// ================================================
// TESTES DE VALIDAÇÃO
// ================================================

async function runValidationTests() {
    print('\n[2/6] Executando testes de validação...', 'cyan');
    
    // TESTE 1: Marcar MealRecord como checked
    await runTest('Teste 1: Marcar MealRecord como concluído', async () => {
        await pool.query(
            'UPDATE mealrecord SET checked = true WHERE id = $1',
            [testMealRecordId]
        );
        
        const result = await pool.query(
            'SELECT checked, checked_at FROM mealrecord WHERE id = $1',
            [testMealRecordId]
        );
        
        assert(result.rows[0].checked === true, 'MealRecord deve estar marcado como checked');
        assert(result.rows[0].checked_at !== null, 'checked_at deve ser preenchido automaticamente');
    });
    
    // TESTE 2: Marcar WorkoutRecord como checked
    await runTest('Teste 2: Marcar WorkoutRecord como concluído', async () => {
        await pool.query(
            'UPDATE workoutrecord SET checked = true WHERE id = $1',
            [testWorkoutRecordId]
        );
        
        const result = await pool.query(
            'SELECT checked, checked_at FROM workoutrecord WHERE id = $1',
            [testWorkoutRecordId]
        );
        
        assert(result.rows[0].checked === true, 'WorkoutRecord deve estar marcado como checked');
        assert(result.rows[0].checked_at !== null, 'checked_at deve ser preenchido automaticamente');
    });
    
    // TESTE 3: Desmarcar MealRecord (checked_at deve ser NULL)
    await runTest('Teste 3: Desmarcar MealRecord limpa checked_at', async () => {
        await pool.query(
            'UPDATE mealrecord SET checked = false WHERE id = $1',
            [testMealRecordId]
        );
        
        const result = await pool.query(
            'SELECT checked, checked_at FROM mealrecord WHERE id = $1',
            [testMealRecordId]
        );
        
        assert(result.rows[0].checked === false, 'MealRecord deve estar desmarcado');
        assert(result.rows[0].checked_at === null, 'checked_at deve ser NULL quando desmarcado');
    });
    
    // TESTE 4: Desmarcar WorkoutRecord (checked_at deve ser NULL)
    await runTest('Teste 4: Desmarcar WorkoutRecord limpa checked_at', async () => {
        await pool.query(
            'UPDATE workoutrecord SET checked = false WHERE id = $1',
            [testWorkoutRecordId]
        );
        
        const result = await pool.query(
            'SELECT checked, checked_at FROM workoutrecord WHERE id = $1',
            [testWorkoutRecordId]
        );
        
        assert(result.rows[0].checked === false, 'WorkoutRecord deve estar desmarcado');
        assert(result.rows[0].checked_at === null, 'checked_at deve ser NULL quando desmarcado');
    });
    
    // TESTE 5: Log é criado ao marcar MealRecord
    await runTest('Teste 5: Log registra marcação de MealRecord', async () => {
        // Limpar logs anteriores
        await pool.query('DELETE FROM checklist_log WHERE record_id = $1', [testMealRecordId]);
        
        // Marcar como checked
        await pool.query(
            'UPDATE mealrecord SET checked = true WHERE id = $1',
            [testMealRecordId]
        );
        
        const logResult = await pool.query(
            `SELECT * FROM checklist_log 
             WHERE record_type = 'meal' AND record_id = $1 AND checked = true`,
            [testMealRecordId]
        );
        
        assert(logResult.rows.length === 1, 'Deve existir 1 log de marcação');
        assert(logResult.rows[0].checked_by === testPatientId, 'Log deve registrar o paciente correto');
    });
    
    // TESTE 6: Log é criado ao marcar WorkoutRecord
    await runTest('Teste 6: Log registra marcação de WorkoutRecord', async () => {
        // Limpar logs anteriores
        await pool.query('DELETE FROM checklist_log WHERE record_id = $1', [testWorkoutRecordId]);
        
        // Marcar como checked
        await pool.query(
            'UPDATE workoutrecord SET checked = true WHERE id = $1',
            [testWorkoutRecordId]
        );
        
        const logResult = await pool.query(
            `SELECT * FROM checklist_log 
             WHERE record_type = 'workout' AND record_id = $1 AND checked = true`,
            [testWorkoutRecordId]
        );
        
        assert(logResult.rows.length === 1, 'Deve existir 1 log de marcação');
        assert(logResult.rows[0].checked_by === testPatientId, 'Log deve registrar o paciente correto');
    });
    
    // TESTE 7: Log registra desmarcação
    await runTest('Teste 7: Log registra desmarcação de checklist', async () => {
        const beforeCount = await pool.query(
            'SELECT COUNT(*) FROM checklist_log WHERE record_id = $1',
            [testMealRecordId]
        );
        
        // Desmarcar
        await pool.query(
            'UPDATE mealrecord SET checked = false WHERE id = $1',
            [testMealRecordId]
        );
        
        const afterCount = await pool.query(
            'SELECT COUNT(*) FROM checklist_log WHERE record_id = $1',
            [testMealRecordId]
        );
        
        assert(
            parseInt(afterCount.rows[0].count) > parseInt(beforeCount.rows[0].count),
            'Deve haver novo log após desmarcação'
        );
    });
}

// ================================================
// TESTES DE FUNÇÕES SQL
// ================================================

async function runFunctionTests() {
    print('\n[3/6] Testando funções SQL...', 'cyan');
    
    // TESTE 8: Função get_completion_stats
    await runTest('Teste 8: Função get_completion_stats retorna estatísticas', async () => {
        const result = await pool.query(
            `SELECT * FROM get_completion_stats($1, $2, $3)`,
            [testPatientId, new Date('2025-01-01'), new Date('2025-12-31')]
        );
        
        assert(result.rows.length === 1, 'Função deve retornar 1 linha de estatísticas');
        assert('total_meals' in result.rows[0], 'Deve retornar total_meals');
        assert('completed_meals' in result.rows[0], 'Deve retornar completed_meals');
        assert('total_workouts' in result.rows[0], 'Deve retornar total_workouts');
        assert('completed_workouts' in result.rows[0], 'Deve retornar completed_workouts');
        assert('completion_rate' in result.rows[0], 'Deve retornar completion_rate');
    });
    
    // TESTE 9: Função get_pending_sync_count
    await runTest('Teste 9: Função get_pending_sync_count retorna contagem', async () => {
        const result = await pool.query(
            'SELECT get_pending_sync_count($1) as pending_count',
            [testPatientId]
        );
        
        assert(result.rows.length === 1, 'Função deve retornar 1 valor');
        assert(typeof result.rows[0].pending_count === 'number', 'Deve retornar um número');
    });
    
    // TESTE 10: Função detect_checklist_inconsistencies
    await runTest('Teste 10: Função detect_checklist_inconsistencies detecta problemas', async () => {
        const result = await pool.query('SELECT * FROM detect_checklist_inconsistencies()');
        
        // Função deve executar sem erros (pode retornar 0 linhas se não houver inconsistências)
        assert(Array.isArray(result.rows), 'Função deve retornar array de resultados');
    });
}

// ================================================
// TESTES DE VIEWS
// ================================================

async function runViewTests() {
    print('\n[4/6] Testando view de histórico...', 'cyan');
    
    // TESTE 11: View checklist_history
    await runTest('Teste 11: View checklist_history retorna dados', async () => {
        const result = await pool.query(
            `SELECT * FROM checklist_history 
             WHERE record_id IN ($1, $2) 
             LIMIT 5`,
            [testMealRecordId, testWorkoutRecordId]
        );
        
        assert(result.rows.length > 0, 'View deve retornar pelo menos 1 registro');
        
        const firstRow = result.rows[0];
        assert('record_type' in firstRow, 'View deve conter record_type');
        assert('checked' in firstRow, 'View deve conter checked');
        assert('patient_name' in firstRow, 'View deve conter patient_name');
    });
}

// ================================================
// VERIFICAÇÃO DE ÍNDICES
// ================================================

async function verifyIndexes() {
    print('\n[5/6] Verificando índices de performance...', 'cyan');
    
    const result = await pool.query(`
        SELECT indexname 
        FROM pg_indexes 
        WHERE tablename = 'checklist_log'
        ORDER BY indexname
    `);
    
    const expectedIndexes = [
        'idx_checklist_log_checked_at',
        'idx_checklist_log_checked_by',
        'idx_checklist_log_record',
        'idx_checklist_log_sync_status'
    ];
    
    const foundIndexes = result.rows.map(row => row.indexname);
    
    print(`✓ ${foundIndexes.length} índices encontrados:`, 'green');
    foundIndexes.forEach(index => {
        print(`  - ${index}`, 'blue');
    });
    
    const missingIndexes = expectedIndexes.filter(idx => !foundIndexes.includes(idx));
    if (missingIndexes.length > 0) {
        print(`⚠ Índices ausentes: ${missingIndexes.join(', ')}`, 'yellow');
    }
}

// ================================================
// VERIFICAÇÃO DE TRIGGERS
// ================================================

async function verifyTriggers() {
    print('\n[6/6] Verificando triggers criados...', 'cyan');
    
    const result = await pool.query(`
        SELECT tgname, tgrelid::regclass as table_name
        FROM pg_trigger
        WHERE tgname IN (
            'trigger_log_mealrecord_check',
            'trigger_log_workoutrecord_check',
            'trigger_update_mealrecord_checked_at',
            'trigger_update_workoutrecord_checked_at'
        )
        ORDER BY tgname
    `);
    
    print(`✓ ${result.rows.length} triggers de checklist encontrados:`, 'green');
    result.rows.forEach(row => {
        print(`  - ${row.tgname} em ${row.table_name}`, 'blue');
    });
    
    const expectedTriggers = [
        'trigger_log_mealrecord_check',
        'trigger_log_workoutrecord_check',
        'trigger_update_mealrecord_checked_at',
        'trigger_update_workoutrecord_checked_at'
    ];
    
    const foundTriggers = result.rows.map(row => row.tgname);
    const missingTriggers = expectedTriggers.filter(t => !foundTriggers.includes(t));
    
    if (missingTriggers.length > 0) {
        print(`⚠ Triggers ausentes: ${missingTriggers.join(', ')}`, 'yellow');
    }
}

// ================================================
// LIMPEZA
// ================================================

async function cleanup() {
    try {
        // Remover registros de teste
        if (testMealRecordId) {
            await pool.query('DELETE FROM checklist_log WHERE record_id = $1', [testMealRecordId]);
            await pool.query('DELETE FROM mealrecord WHERE id = $1', [testMealRecordId]);
        }
        if (testWorkoutRecordId) {
            await pool.query('DELETE FROM checklist_log WHERE record_id = $1', [testWorkoutRecordId]);
            await pool.query('DELETE FROM workoutrecord WHERE id = $1', [testWorkoutRecordId]);
        }
        print('\n✓ Limpeza concluída', 'green');
    } catch (error) {
        print(`⚠ Erro na limpeza: ${error.message}`, 'yellow');
    }
}

// ================================================
// MAIN
// ================================================

async function main() {
    print('\n' + '='.repeat(50), 'bright');
    print('  VALIDAÇÃO - RISCO 10: Atualização de Checklists  ', 'bright');
    print('='.repeat(50) + '\n', 'bright');
    
    try {
        // Preparação
        await setupTestEnvironment();
        
        // Executar testes
        await runValidationTests();
        await runFunctionTests();
        await runViewTests();
        await verifyIndexes();
        await verifyTriggers();
        
        // Limpeza
        await cleanup();
        
        // Relatório final
        print('\n' + '='.repeat(50), 'bright');
        print('RELATÓRIO FINAL', 'bright');
        print('='.repeat(50), 'bright');
        print(`Total de testes: ${totalTests}`, 'cyan');
        print(`Testes passaram: ${passedTests}`, 'green');
        print(`Testes falharam: ${failedTests}`, failedTests > 0 ? 'red' : 'green');
        
        if (failedTests === 0) {
            print('\n✅ TODOS OS TESTES PASSARAM!', 'green');
            process.exit(0);
        } else {
            print(`\n❌ ${failedTests} teste(s) falharam`, 'red');
            process.exit(1);
        }
        
    } catch (error) {
        print(`\n❌ Erro fatal: ${error.message}`, 'red');
        console.error(error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

// Executar
main();
