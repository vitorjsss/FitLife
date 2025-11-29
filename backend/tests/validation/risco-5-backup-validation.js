// ================================================
// VALIDAÇÃO - RISCO: BACKUP DE DADOS CRÍTICOS
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
let testBackupId;

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
    print('\n[1/7] Preparando ambiente de teste...', 'cyan');

    // Limpar registros de teste anteriores
    await pool.query(`
        DELETE FROM backup_log 
        WHERE file_path LIKE '%teste%' OR file_path LIKE '%test%'
    `);

    print('✓ Ambiente preparado', 'green');
}

// ================================================
// TESTES DE VALIDAÇÃO
// ================================================

async function runValidationTests() {
    print('\n[2/7] Executando testes de validação...', 'cyan');

    // TESTE 1: Criar registro de backup
    await runTest('Teste 1: Iniciar novo backup', async () => {
        const result = await pool.query(
            `SELECT start_backup_log($1, $2, $3) as backup_id`,
            ['full', 'manual', '/backups/test_backup_' + Date.now() + '.sql']
        );

        testBackupId = result.rows[0].backup_id;
        assert(testBackupId !== null, 'ID de backup deve ser retornado');

        // Verificar se foi criado com status correto
        const checkResult = await pool.query(
            'SELECT backup_status FROM backup_log WHERE id = $1',
            [testBackupId]
        );

        assert(checkResult.rows[0].backup_status === 'in_progress', 'Status inicial deve ser in_progress');
    });

    // TESTE 2: Completar backup com sucesso
    await runTest('Teste 2: Completar backup com sucesso', async () => {
        await pool.query(
            `SELECT complete_backup_log($1, $2, $3, $4, $5, $6)`,
            [
                testBackupId,
                'completed',
                1048576 * 50, // 50 MB
                ['patient', 'mealrecord', 'workoutrecord'],
                null,
                'a'.repeat(64) // Checksum simulado
            ]
        );

        const result = await pool.query(
            `SELECT backup_status, file_size, duration_seconds, checksum 
             FROM backup_log WHERE id = $1`,
            [testBackupId]
        );

        const backup = result.rows[0];
        assert(backup.backup_status === 'completed', 'Status deve ser completed');
        assert(backup.file_size > 0, 'File size deve ser maior que 0');
        assert(backup.duration_seconds >= 0, 'Duration deve ser calculada');
        assert(backup.checksum !== null, 'Checksum deve ser armazenado');
    });

    // TESTE 3: Criar backup que falha
    await runTest('Teste 3: Registrar backup com falha', async () => {
        const failedBackupResult = await pool.query(
            `SELECT start_backup_log($1, $2, $3) as backup_id`,
            ['full', 'scheduled', '/backups/test_failed_backup.sql']
        );

        const failedBackupId = failedBackupResult.rows[0].backup_id;

        await pool.query(
            `SELECT complete_backup_log($1, $2, $3, $4, $5, $6)`,
            [
                failedBackupId,
                'failed',
                null,
                null,
                'Erro simulado: disco cheio',
                null
            ]
        );

        const result = await pool.query(
            `SELECT backup_status, error_message FROM backup_log WHERE id = $1`,
            [failedBackupId]
        );

        assert(result.rows[0].backup_status === 'failed', 'Status deve ser failed');
        assert(result.rows[0].error_message !== null, 'Mensagem de erro deve estar presente');
    });

    // TESTE 4: Verificar retenção de backups
    await runTest('Teste 4: Validar política de retenção', async () => {
        const result = await pool.query(
            `SELECT retention_until FROM backup_log WHERE id = $1`,
            [testBackupId]
        );

        const retentionDate = new Date(result.rows[0].retention_until);
        const today = new Date();
        const diffDays = Math.ceil((retentionDate - today) / (1000 * 60 * 60 * 24));

        assert(diffDays >= 25 && diffDays <= 35, 'Retenção deve ser aproximadamente 30 dias');
    });
}

// ================================================
// TESTES DE FUNÇÕES SQL
// ================================================

async function runFunctionTests() {
    print('\n[3/7] Testando funções SQL...', 'cyan');

    // TESTE 5: Função check_recent_backups
    await runTest('Teste 5: Verificar backups recentes', async () => {
        const result = await pool.query(
            'SELECT * FROM check_recent_backups(24)'
        );

        assert(result.rows.length === 1, 'Deve retornar 1 linha de resultado');
        assert('backup_count' in result.rows[0], 'Deve retornar backup_count');
        assert('last_backup_at' in result.rows[0], 'Deve retornar last_backup_at');
        assert('hours_since_last_backup' in result.rows[0], 'Deve retornar hours_since_last_backup');
    });

    // TESTE 6: Função validate_backup_integrity
    await runTest('Teste 6: Validar integridade de backup', async () => {
        const result = await pool.query(
            'SELECT * FROM validate_backup_integrity($1)',
            [testBackupId]
        );

        assert(result.rows.length === 1, 'Deve retornar 1 linha de resultado');
        assert('is_valid' in result.rows[0], 'Deve retornar is_valid');
        assert('checksum_match' in result.rows[0], 'Deve retornar checksum_match');
        assert(result.rows[0].is_valid === true, 'Backup de teste deve ser válido');
    });

    // TESTE 7: Função get_backup_statistics
    await runTest('Teste 7: Obter estatísticas de backup', async () => {
        const result = await pool.query(
            'SELECT * FROM get_backup_statistics(30)'
        );

        assert(result.rows.length === 1, 'Deve retornar 1 linha de estatísticas');
        assert('total_backups' in result.rows[0], 'Deve retornar total_backups');
        assert('successful_backups' in result.rows[0], 'Deve retornar successful_backups');
        assert('success_rate' in result.rows[0], 'Deve retornar success_rate');
        assert(result.rows[0].total_backups > 0, 'Deve haver pelo menos 1 backup');
    });

    // TESTE 8: Função cleanup_expired_backups
    await runTest('Teste 8: Limpar backups expirados', async () => {
        // Criar backup expirado para teste
        const expiredResult = await pool.query(
            `INSERT INTO backup_log (
                backup_type, backup_status, file_path, 
                started_at, completed_at, retention_until
            )
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id`,
            [
                'full',
                'completed',
                '/backups/expired_test.sql',
                new Date(Date.now() - 40 * 24 * 60 * 60 * 1000), // 40 dias atrás
                new Date(Date.now() - 40 * 24 * 60 * 60 * 1000),
                new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)  // Expirou há 10 dias
            ]
        );

        const result = await pool.query('SELECT * FROM cleanup_expired_backups()');

        assert(result.rows.length === 1, 'Deve retornar resultado da limpeza');
        assert('deleted_count' in result.rows[0], 'Deve retornar deleted_count');

        // Verificar se o backup foi marcado como expirado
        const checkExpired = await pool.query(
            'SELECT backup_status FROM backup_log WHERE id = $1',
            [expiredResult.rows[0].id]
        );

        assert(checkExpired.rows[0].backup_status === 'expired', 'Backup deve estar marcado como expired');
    });
}

// ================================================
// TESTES DE CONFIGURAÇÃO
// ================================================

async function runConfigTests() {
    print('\n[4/7] Testando configurações de backup...', 'cyan');

    // TESTE 9: Verificar configuração padrão
    await runTest('Teste 9: Configuração padrão existe', async () => {
        const result = await pool.query(
            `SELECT * FROM backup_config WHERE config_name = 'daily_full_backup'`
        );

        assert(result.rows.length === 1, 'Configuração padrão deve existir');
        assert(result.rows[0].enabled === true, 'Configuração deve estar habilitada');
        assert(result.rows[0].retention_days === 30, 'Retenção deve ser 30 dias');
    });

    // TESTE 10: Criar nova configuração
    await runTest('Teste 10: Criar configuração personalizada', async () => {
        await pool.query(
            `INSERT INTO backup_config (
                config_name, backup_type, retention_days, tables_to_backup
            )
            VALUES ($1, $2, $3, $4)`,
            ['test_config', 'incremental', 7, ['patient', 'mealrecord']]
        );

        const result = await pool.query(
            `SELECT * FROM backup_config WHERE config_name = 'test_config'`
        );

        assert(result.rows.length === 1, 'Nova configuração deve ser criada');
        assert(result.rows[0].backup_type === 'incremental', 'Tipo de backup deve estar correto');
    });
}

// ================================================
// TESTES DE VIEW
// ================================================

async function runViewTests() {
    print('\n[5/7] Testando view de relatório...', 'cyan');

    // TESTE 11: View backup_report
    await runTest('Teste 11: View backup_report retorna dados', async () => {
        const result = await pool.query(
            'SELECT * FROM backup_report LIMIT 5'
        );

        assert(result.rows.length > 0, 'View deve retornar pelo menos 1 registro');

        const firstRow = result.rows[0];
        assert('status_display' in firstRow, 'View deve conter status_display');
        assert('file_size_mb' in firstRow, 'View deve conter file_size_mb');
        assert('duration_display' in firstRow, 'View deve conter duration_display');
        assert('days_until_expiry' in firstRow, 'View deve conter days_until_expiry');
    });
}

// ================================================
// VERIFICAÇÃO DE ÍNDICES
// ================================================

async function verifyIndexes() {
    print('\n[6/7] Verificando índices de performance...', 'cyan');

    const result = await pool.query(`
        SELECT indexname 
        FROM pg_indexes 
        WHERE tablename IN ('backup_log', 'backup_config')
        ORDER BY indexname
    `);

    const expectedIndexes = [
        'idx_backup_log_retention',
        'idx_backup_log_started_at',
        'idx_backup_log_status',
        'idx_backup_log_type'
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
// VERIFICAÇÃO DE TABELAS
// ================================================

async function verifyTables() {
    print('\n[7/7] Verificando tabelas criadas...', 'cyan');

    const result = await pool.query(`
        SELECT tablename 
        FROM pg_tables 
        WHERE tablename IN ('backup_log', 'backup_config')
        ORDER BY tablename
    `);

    print(`✓ ${result.rows.length} tabelas de backup encontradas:`, 'green');
    result.rows.forEach(row => {
        print(`  - ${row.tablename}`, 'blue');
    });

    assert(result.rows.length === 2, 'Devem existir 2 tabelas de backup');
}

// ================================================
// LIMPEZA
// ================================================

async function cleanup() {
    try {
        // Remover registros de teste
        await pool.query(`
            DELETE FROM backup_config WHERE config_name = 'test_config'
        `);

        await pool.query(`
            DELETE FROM backup_log 
            WHERE file_path LIKE '%test%' 
               OR file_path LIKE '%expired%'
        `);

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
    print('  VALIDAÇÃO - RISCO: Backup de Dados Críticos  ', 'bright');
    print('='.repeat(50) + '\n', 'bright');

    try {
        // Preparação
        await setupTestEnvironment();

        // Executar testes
        await runValidationTests();
        await runFunctionTests();
        await runConfigTests();
        await runViewTests();
        await verifyIndexes();
        await verifyTables();

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
