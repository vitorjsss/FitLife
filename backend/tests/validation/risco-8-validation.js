#!/usr/bin/env node

/**
 * ========================================
 * TESTES DE VALIDAÇÃO - RISCO 8
 * Sistema: FitLife
 * Parâmetro: Atualização das Refeições
 * Risco Original: 8 (Alto)
 * ========================================
 */

import pkg from 'pg';
const { Pool } = pkg;

// Configuração do banco
const pool = new Pool({
  host: 'localhost',
  port: 5433,
  user: 'fitlife',
  password: 'fitlife',
  database: 'fitlife'
});

// Cores ANSI para output
const colors = {
  reset: '\x1b[0m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

let testPatientId;
let testResults = {
  total: 0,
  passed: 0,
  failed: 0
};

async function runTest(testName, testFn) {
  testResults.total++;
  console.log(`\nTeste ${testResults.total}: ${testName}`);
  try {
    await testFn();
    testResults.passed++;
    console.log(`${colors.green}✓ Passou (validação funcionando corretamente)${colors.reset}`);
  } catch (error) {
    testResults.failed++;
    console.log(`${colors.red}✗ Falhou: ${error.message}${colors.reset}`);
  }
}

async function setup() {
  console.log(`${colors.cyan}`);
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║  VALIDAÇÃO - RISCO 8: Atualização Refeições   ║');
  console.log('║  Sistema: FitLife                              ║');
  console.log('║  Data: 14/11/2025                             ║');
  console.log('╚══════════════════════════════════════════════════╝');
  console.log(`${colors.reset}`);

  console.log(`${colors.cyan}\n[1/7] Preparando ambiente de teste...${colors.reset}`);
  
  // Buscar paciente de teste
  const patients = await pool.query('SELECT id FROM patient LIMIT 1');
  if (patients.rows.length > 0) {
    testPatientId = patients.rows[0].id;
    console.log(`${colors.green}✓ Paciente de teste encontrado: ${testPatientId}${colors.reset}`);
  } else {
    throw new Error('Nenhum paciente encontrado no banco de dados');
  }
}

async function testUpdatePersistence() {
  console.log(`${colors.cyan}\n[2/7] Testando persistência de atualizações...${colors.reset}`);

  await runTest('Deve persistir atualização de nome da refeição', async () => {
    const meal = await pool.query(
      'INSERT INTO mealrecord (patient_id, name, date, checked) VALUES ($1, $2, $3, $4) RETURNING *',
      [testPatientId, 'Café Original', '2025-11-14', false]
    );
    const mealId = meal.rows[0].id;

    await pool.query(
      'UPDATE mealrecord SET name = $1 WHERE id = $2',
      ['Café Atualizado', mealId]
    );

    const updated = await pool.query('SELECT * FROM mealrecord WHERE id = $1', [mealId]);
    if (updated.rows[0].name !== 'Café Atualizado') {
      throw new Error('Atualização do nome não foi persistida');
    }

    await pool.query('DELETE FROM mealrecord WHERE id = $1', [mealId]);
  });

  await runTest('Deve persistir atualização de data da refeição', async () => {
    const meal = await pool.query(
      'INSERT INTO mealrecord (patient_id, name, date, checked) VALUES ($1, $2, $3, $4) RETURNING *',
      [testPatientId, 'Almoço', '2025-11-14', false]
    );
    const mealId = meal.rows[0].id;

    await pool.query(
      'UPDATE mealrecord SET date = $1 WHERE id = $2',
      ['2025-11-15', mealId]
    );

    const updated = await pool.query('SELECT * FROM mealrecord WHERE id = $1', [mealId]);
    const updatedDate = new Date(updated.rows[0].date).toISOString().split('T')[0];
    if (updatedDate !== '2025-11-15') {
      throw new Error('Atualização da data não foi persistida');
    }

    await pool.query('DELETE FROM mealrecord WHERE id = $1', [mealId]);
  });

  await runTest('Deve persistir atualização de status checked', async () => {
    const meal = await pool.query(
      'INSERT INTO mealrecord (patient_id, name, date, checked) VALUES ($1, $2, $3, $4) RETURNING *',
      [testPatientId, 'Jantar', '2025-11-14', false]
    );
    const mealId = meal.rows[0].id;

    // Adicionar um item primeiro (necessário pelo trigger)
    await pool.query(
      'INSERT INTO mealitem (meal_record_id, food_name, calories, proteins, carbs, fats) VALUES ($1, $2, $3, $4, $5, $6)',
      [mealId, 'Arroz', 100, 2, 22, 0]
    );

    await pool.query(
      'UPDATE mealrecord SET checked = $1 WHERE id = $2',
      [true, mealId]
    );

    const updated = await pool.query('SELECT * FROM mealrecord WHERE id = $1', [mealId]);
    if (updated.rows[0].checked !== true) {
      throw new Error('Atualização do status checked não foi persistida');
    }

    await pool.query('DELETE FROM mealrecord WHERE id = $1', [mealId]);
  });

  await runTest('Deve persistir atualização de item de refeição', async () => {
    const meal = await pool.query(
      'INSERT INTO mealrecord (patient_id, name, date, checked) VALUES ($1, $2, $3, $4) RETURNING *',
      [testPatientId, 'Lanche', '2025-11-14', false]
    );
    const mealId = meal.rows[0].id;

    const item = await pool.query(
      'INSERT INTO mealitem (meal_record_id, food_name, calories, proteins, carbs, fats) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [mealId, 'Banana Original', 100, 1, 25, 0]
    );
    const itemId = item.rows[0].id;

    await pool.query(
      'UPDATE mealitem SET food_name = $1, calories = $2 WHERE id = $3',
      ['Banana Atualizada', 120, itemId]
    );

    const updated = await pool.query('SELECT * FROM mealitem WHERE id = $1', [itemId]);
    if (updated.rows[0].food_name !== 'Banana Atualizada' || Number(updated.rows[0].calories) !== 120) {
      throw new Error('Atualização do item não foi persistida');
    }

    await pool.query('DELETE FROM mealrecord WHERE id = $1', [mealId]);
  });
}

async function testAuditLog() {
  console.log(`${colors.cyan}\n[3/7] Testando log de auditoria...${colors.reset}`);

  await runTest('Deve registrar INSERT em meal_audit_log', async () => {
    const meal = await pool.query(
      'INSERT INTO mealrecord (patient_id, name, date, checked) VALUES ($1, $2, $3, $4) RETURNING *',
      [testPatientId, 'Teste Auditoria', '2025-11-14', false]
    );
    const mealId = meal.rows[0].id;

    const auditLog = await pool.query(
      'SELECT * FROM meal_audit_log WHERE record_id = $1 AND operation = $2 ORDER BY changed_at DESC LIMIT 1',
      [mealId, 'INSERT']
    );

    if (auditLog.rows.length === 0) {
      throw new Error('Log de auditoria não registrou INSERT');
    }

    await pool.query('DELETE FROM mealrecord WHERE id = $1', [mealId]);
  });

  await runTest('Deve registrar UPDATE em meal_audit_log', async () => {
    const meal = await pool.query(
      'INSERT INTO mealrecord (patient_id, name, date, checked) VALUES ($1, $2, $3, $4) RETURNING *',
      [testPatientId, 'Original', '2025-11-14', false]
    );
    const mealId = meal.rows[0].id;

    await pool.query(
      'UPDATE mealrecord SET name = $1 WHERE id = $2',
      ['Atualizado', mealId]
    );

    const auditLog = await pool.query(
      'SELECT * FROM meal_audit_log WHERE record_id = $1 AND operation = $2 ORDER BY changed_at DESC LIMIT 1',
      [mealId, 'UPDATE']
    );

    if (auditLog.rows.length === 0) {
      throw new Error('Log de auditoria não registrou UPDATE');
    }

    if (auditLog.rows[0].old_data.name !== 'Original') {
      throw new Error('Log não contém dados antigos corretos');
    }

    if (auditLog.rows[0].new_data.name !== 'Atualizado') {
      throw new Error('Log não contém dados novos corretos');
    }

    await pool.query('DELETE FROM mealrecord WHERE id = $1', [mealId]);
  });

  await runTest('Deve registrar DELETE em meal_audit_log', async () => {
    const meal = await pool.query(
      'INSERT INTO mealrecord (patient_id, name, date, checked) VALUES ($1, $2, $3, $4) RETURNING *',
      [testPatientId, 'Para Deletar', '2025-11-14', false]
    );
    const mealId = meal.rows[0].id;

    await pool.query('DELETE FROM mealrecord WHERE id = $1', [mealId]);

    const auditLog = await pool.query(
      'SELECT * FROM meal_audit_log WHERE record_id = $1 AND operation = $2 ORDER BY changed_at DESC LIMIT 1',
      [mealId, 'DELETE']
    );

    if (auditLog.rows.length === 0) {
      throw new Error('Log de auditoria não registrou DELETE');
    }
  });
}

async function testTimestamps() {
  console.log(`${colors.cyan}\n[4/7] Testando timestamps automáticos...${colors.reset}`);

  await runTest('Deve atualizar updated_at automaticamente', async () => {
    const meal = await pool.query(
      'INSERT INTO mealrecord (patient_id, name, date, checked) VALUES ($1, $2, $3, $4) RETURNING *',
      [testPatientId, 'Teste Timestamp', '2025-11-14', false]
    );
    const mealId = meal.rows[0].id;

    const originalUpdatedAt = (await pool.query(
      'SELECT updated_at FROM mealrecord WHERE id = $1',
      [mealId]
    )).rows[0].updated_at;

    // Esperar 1 segundo
    await new Promise(resolve => setTimeout(resolve, 1000));

    await pool.query(
      'UPDATE mealrecord SET name = $1 WHERE id = $2',
      ['Nome Modificado', mealId]
    );

    const newUpdatedAt = (await pool.query(
      'SELECT updated_at FROM mealrecord WHERE id = $1',
      [mealId]
    )).rows[0].updated_at;

    if (originalUpdatedAt >= newUpdatedAt) {
      throw new Error('updated_at não foi atualizado automaticamente');
    }

    await pool.query('DELETE FROM mealrecord WHERE id = $1', [mealId]);
  });

  await runTest('Deve incrementar version automaticamente', async () => {
    const meal = await pool.query(
      'INSERT INTO mealrecord (patient_id, name, date, checked) VALUES ($1, $2, $3, $4) RETURNING *',
      [testPatientId, 'Teste Version', '2025-11-14', false]
    );
    const mealId = meal.rows[0].id;

    const originalVersion = (await pool.query(
      'SELECT version FROM mealrecord WHERE id = $1',
      [mealId]
    )).rows[0].version;

    await pool.query(
      'UPDATE mealrecord SET name = $1 WHERE id = $2',
      ['Versão 2', mealId]
    );

    const newVersion = (await pool.query(
      'SELECT version FROM mealrecord WHERE id = $1',
      [mealId]
    )).rows[0].version;

    if (newVersion !== originalVersion + 1) {
      throw new Error(`Version não foi incrementada corretamente (esperado: ${originalVersion + 1}, recebido: ${newVersion})`);
    }

    await pool.query('DELETE FROM mealrecord WHERE id = $1', [mealId]);
  });
}

async function testTransactionIntegrity() {
  console.log(`${colors.cyan}\n[5/7] Testando integridade de transações...${colors.reset}`);

  await runTest('Deve validar integridade de transação com verify_transaction_integrity', async () => {
    const meal = await pool.query(
      'INSERT INTO mealrecord (patient_id, name, date, checked) VALUES ($1, $2, $3, $4) RETURNING *',
      [testPatientId, 'Teste Transação', '2025-11-14', false]
    );
    const mealId = meal.rows[0].id;

    await pool.query(
      'UPDATE mealrecord SET name = $1 WHERE id = $2',
      ['Atualizado', mealId]
    );

    const txId = (await pool.query(
      'SELECT transaction_id FROM meal_audit_log WHERE record_id = $1 ORDER BY changed_at DESC LIMIT 1',
      [mealId]
    )).rows[0].transaction_id;

    const integrity = await pool.query(
      'SELECT is_complete, operations_count FROM verify_transaction_integrity($1)',
      [txId]
    );

    if (!integrity.rows[0].is_complete) {
      throw new Error('Transação não foi registrada como completa');
    }

    if (integrity.rows[0].operations_count < 1) {
      throw new Error('Nenhuma operação registrada na transação');
    }

    await pool.query('DELETE FROM mealrecord WHERE id = $1', [mealId]);
  });
}

async function testViews() {
  console.log(`${colors.cyan}\n[6/7] Testando views de auditoria...${colors.reset}`);

  await runTest('Deve consultar meal_change_history corretamente', async () => {
    const meal = await pool.query(
      'INSERT INTO mealrecord (patient_id, name, date, checked) VALUES ($1, $2, $3, $4) RETURNING *',
      [testPatientId, 'Teste História', '2025-11-14', false]
    );
    const mealId = meal.rows[0].id;

    await pool.query(
      'UPDATE mealrecord SET name = $1 WHERE id = $2',
      ['História Atualizada', mealId]
    );

    const history = await pool.query(
      'SELECT * FROM meal_change_history WHERE record_id = $1 ORDER BY changed_at DESC',
      [mealId]
    );

    if (history.rows.length < 2) {
      throw new Error('View meal_change_history não retornou histórico completo');
    }

    await pool.query('DELETE FROM mealrecord WHERE id = $1', [mealId]);
  });
}

async function cleanup() {
  console.log(`${colors.cyan}\n[7/7] Limpando dados de teste...${colors.reset}`);
  
  // Limpar refeições de teste
  await pool.query(
    'DELETE FROM mealrecord WHERE patient_id = $1',
    [testPatientId]
  );
  
  console.log(`${colors.green}✓ Dados de teste removidos${colors.reset}`);
}

async function showSummary() {
  console.log('\n==================================================');
  console.log(`${colors.blue}RELATÓRIO FINAL${colors.reset}`);
  console.log('==================================================\n');
  console.log(`Total de testes: ${testResults.total}`);
  console.log(`${colors.green}Testes passaram: ${testResults.passed}${colors.reset}`);
  console.log(`${colors.red}Testes falharam: ${testResults.failed}${colors.reset}`);
  console.log('\n==================================================');
  
  if (testResults.failed === 0) {
    console.log(`${colors.green}✅ TODOS OS TESTES PASSARAM!${colors.reset}`);
    console.log(`${colors.green}Sistema de auditoria funcionando corretamente${colors.reset}`);
  } else {
    console.log(`${colors.red}⚠️ ALGUNS TESTES FALHARAM${colors.reset}`);
    console.log(`${colors.red}Verifique as implementações acima${colors.reset}`);
  }
  
  console.log('==================================================\n');
}

async function main() {
  try {
    await setup();
    await testUpdatePersistence();
    await testAuditLog();
    await testTimestamps();
    await testTransactionIntegrity();
    await testViews();
    await cleanup();
    await showSummary();
    process.exit(testResults.failed === 0 ? 0 : 1);
  } catch (error) {
    console.error(`${colors.red}Erro fatal: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

main();


