#!/usr/bin/env node

/**
 * ========================================
 * TESTES DE VALIDAÇÃO - RISCO 3
 * Sistema: FitLife
 * Parâmetro: Planejamento de Refeições
 * Risco Original: 9 (Alto)
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

// Cores para o console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

// Variáveis para armazenar IDs de teste
let testPatientId;
let testMealRecordId;

/**
 * Função auxiliar para executar teste
 */
async function runTest(testNumber, description, testFunction) {
  totalTests++;
  process.stdout.write(`\nTeste ${testNumber}: ${description}\n`);

  try {
    await testFunction();
    passedTests++;
    console.log(`${colors.green}✓ Passou (validação funcionando corretamente)${colors.reset}`);
    return true;
  } catch (error) {
    console.log(`${colors.red}✗ Falhou: ${error.message}${colors.reset}`);
    failedTests++;
    return false;
  }
}

/**
 * Setup: Criar dados de teste
 */
async function setup() {
  console.log(`${colors.cyan}\n[1/6] Preparando ambiente de teste...${colors.reset}`);

  try {
    // Tentar buscar um paciente existente
    let patientResult = await pool.query(
      `SELECT id FROM patient LIMIT 1`
    );

    if (patientResult.rows.length === 0) {
      console.log(`${colors.yellow}  Nenhum paciente encontrado, criando paciente de teste...${colors.reset}`);

      // Criar auth para o paciente de teste
      const authResult = await pool.query(
        `INSERT INTO auth (username, email, user_type, password) 
         VALUES ($1, $2, $3, $4) 
         ON CONFLICT (username) DO UPDATE SET username = EXCLUDED.username
         RETURNING id`,
        ['paciente_teste_risco9', 'teste_risco9@fitlife.com', 'Patient', 'hash123']
      );

      const authId = authResult.rows[0].id;

      // Criar paciente de teste
      const newPatientResult = await pool.query(
        `INSERT INTO patient (name, birthdate, sex, auth_id) 
         VALUES ($1, $2, $3, $4) RETURNING id`,
        ['Paciente Teste Risco 9', '1990-01-01', 'M', authId]
      );

      testPatientId = newPatientResult.rows[0].id;
      console.log(`${colors.green}✓ Paciente de teste criado: ${testPatientId}${colors.reset}`);
    } else {
      testPatientId = patientResult.rows[0].id;
      console.log(`${colors.green}✓ Paciente de teste encontrado: ${testPatientId}${colors.reset}`);
    }
  } catch (error) {
    console.error(`${colors.red}✗ Erro no setup: ${error.message}${colors.reset}`);
    throw error;
  }
}

/**
 * Testes de Validação de Constraints
 */
async function runValidationTests() {
  console.log(`${colors.cyan}\n[2/6] Executando testes de validação...${colors.reset}`);

  // Teste 1: Nome vazio deve ser rejeitado
  await runTest(
    1,
    'Deve rejeitar refeição com nome vazio (constraint check_meal_name_not_empty)',
    async () => {
      try {
        await pool.query(
          `INSERT INTO MealRecord (name, date, patient_id) 
           VALUES ($1, $2, $3)`,
          ['', '2025-11-14', testPatientId]
        );
        throw new Error('Deveria ter falhado mas passou');
      } catch (error) {
        if (error.message.includes('check_meal_name_not_empty')) {
          return; // Esperado
        }
        throw error;
      }
    }
  );

  // Teste 2: Data muito futura deve ser rejeitada
  await runTest(
    2,
    'Deve rejeitar data muito futura (constraint check_meal_date_not_too_future)',
    async () => {
      try {
        await pool.query(
          `INSERT INTO MealRecord (name, date, patient_id) 
           VALUES ($1, $2, $3)`,
          ['Jantar', '2027-11-14', testPatientId]
        );
        throw new Error('Deveria ter falhado mas passou');
      } catch (error) {
        if (error.message.includes('check_meal_date_not_too_future')) {
          return; // Esperado
        }
        throw error;
      }
    }
  );

  // Teste 3: Data muito antiga deve ser rejeitada
  await runTest(
    3,
    'Deve rejeitar data muito antiga (constraint check_meal_date_not_too_old)',
    async () => {
      try {
        await pool.query(
          `INSERT INTO MealRecord (name, date, patient_id) 
           VALUES ($1, $2, $3)`,
          ['Café', '2010-01-01', testPatientId]
        );
        throw new Error('Deveria ter falhado mas passou');
      } catch (error) {
        if (error.message.includes('check_meal_date_not_too_old')) {
          return; // Esperado
        }
        throw error;
      }
    }
  );

  // Teste 4: Criar refeição válida para testes de MealItem
  await runTest(
    4,
    'Deve criar refeição válida para testes',
    async () => {
      const result = await pool.query(
        `INSERT INTO MealRecord (name, date, patient_id) 
         VALUES ($1, $2, $3) RETURNING id`,
        ['Almoço Teste', '2025-11-14', testPatientId]
      );
      testMealRecordId = result.rows[0].id;
      if (!testMealRecordId) throw new Error('ID não retornado');
    }
  );

  // Teste 5: Calorias negativas devem ser rejeitadas
  await runTest(
    5,
    'Deve rejeitar calorias negativas (constraint check_calories_non_negative)',
    async () => {
      try {
        await pool.query(
          `INSERT INTO MealItem (food_name, calories, meal_record_id) 
           VALUES ($1, $2, $3)`,
          ['Arroz', -100, testMealRecordId]
        );
        throw new Error('Deveria ter falhado mas passou');
      } catch (error) {
        if (error.message.includes('check_calories_non_negative')) {
          return; // Esperado
        }
        throw error;
      }
    }
  );

  // Teste 6: Proteínas negativas devem ser rejeitadas
  await runTest(
    6,
    'Deve rejeitar proteínas negativas (constraint check_proteins_non_negative)',
    async () => {
      try {
        await pool.query(
          `INSERT INTO MealItem (food_name, proteins, meal_record_id) 
           VALUES ($1, $2, $3)`,
          ['Frango', -50, testMealRecordId]
        );
        throw new Error('Deveria ter falhado mas passou');
      } catch (error) {
        if (error.message.includes('check_proteins_non_negative')) {
          return; // Esperado
        }
        throw error;
      }
    }
  );

  // Teste 7: Carboidratos > 500g devem ser rejeitados
  await runTest(
    7,
    'Deve rejeitar carboidratos > 500g (constraint check_carbs_max_limit)',
    async () => {
      try {
        await pool.query(
          `INSERT INTO MealItem (food_name, carbs, meal_record_id) 
           VALUES ($1, $2, $3)`,
          ['Macarrão', 600, testMealRecordId]
        );
        throw new Error('Deveria ter falhado mas passou');
      } catch (error) {
        if (error.message.includes('check_carbs_max_limit')) {
          return; // Esperado
        }
        throw error;
      }
    }
  );

  // Teste 8: Calorias > 10000 devem ser rejeitadas
  await runTest(
    8,
    'Deve rejeitar calorias > 10000 kcal (constraint check_calories_max_limit)',
    async () => {
      try {
        await pool.query(
          `INSERT INTO MealItem (food_name, calories, meal_record_id) 
           VALUES ($1, $2, $3)`,
          ['Porção Gigante', 15000, testMealRecordId]
        );
        throw new Error('Deveria ter falhado mas passou');
      } catch (error) {
        if (error.message.includes('check_calories_max_limit')) {
          return; // Esperado
        }
        throw error;
      }
    }
  );

  // Teste 9: Calorias inconsistentes devem ser rejeitadas (TRIGGER)
  await runTest(
    9,
    'Deve rejeitar calorias inconsistentes com macros (trigger validate_meal_item_calories)',
    async () => {
      try {
        await pool.query(
          `INSERT INTO MealItem (food_name, calories, proteins, carbs, fats, meal_record_id) 
           VALUES ($1, $2, $3, $4, $5, $6)`,
          ['Teste Inconsistente', 100, 50, 50, 10, testMealRecordId]
          // Calculado: (50*4) + (50*4) + (10*9) = 200+200+90 = 490 kcal
          // Informado: 100 kcal (diferença > 20%)
        );
        throw new Error('Deveria ter falhado mas passou');
      } catch (error) {
        if (error.message.includes('Calorias inconsistentes')) {
          return; // Esperado
        }
        throw error;
      }
    }
  );

  // Teste 10: Valores válidos devem ser aceitos
  await runTest(
    10,
    'Deve aceitar valores nutricionais válidos',
    async () => {
      const result = await pool.query(
        `INSERT INTO MealItem (food_name, calories, proteins, carbs, fats, meal_record_id) 
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        ['Peito de Frango', 165, 31, 0, 3.6, testMealRecordId]
        // Calculado: (31*4) + (0*4) + (3.6*9) = 124+0+32.4 = 156.4 kcal (~165 ± 20%)
      );
      if (!result.rows[0].id) throw new Error('Item não foi criado');
    }
  );
}

/**
 * Testes de Funções e Views
 */
async function runFunctionTests() {
  console.log(`${colors.cyan}\n[3/6] Testando funções SQL e views...${colors.reset}`);

  // Teste 11: Função get_meal_totals
  await runTest(
    11,
    'Deve calcular totais corretamente (função get_meal_totals)',
    async () => {
      const result = await pool.query(
        `SELECT * FROM get_meal_totals($1)`,
        [testMealRecordId]
      );

      const totals = result.rows[0];
      if (totals.total_calories != 165) {
        throw new Error(`Calorias incorretas: ${totals.total_calories}`);
      }
      if (totals.item_count != 1) {
        throw new Error(`Contagem incorreta: ${totals.item_count}`);
      }
    }
  );

  // Teste 12: View meal_summary
  await runTest(
    12,
    'Deve consultar view meal_summary corretamente',
    async () => {
      const result = await pool.query(
        `SELECT * FROM meal_summary WHERE meal_id = $1`,
        [testMealRecordId]
      );

      if (result.rows.length === 0) {
        throw new Error('Refeição não encontrada na view');
      }

      const summary = result.rows[0];
      if (summary.total_calories != 165) {
        throw new Error(`View retornou calorias incorretas: ${summary.total_calories}`);
      }
    }
  );
}

/**
 * Verificar índices criados
 */
async function verifyIndexes() {
  console.log(`${colors.cyan}\n[4/6] Verificando índices de performance...${colors.reset}`);

  const indexes = await pool.query(`
    SELECT indexname 
    FROM pg_indexes 
    WHERE tablename IN ('mealrecord', 'mealitem')
    AND indexname LIKE 'idx_%'
  `);

  console.log(`${colors.green}✓ ${indexes.rows.length} índices encontrados:${colors.reset}`);
  indexes.rows.forEach(idx => {
    console.log(`  - ${idx.indexname}`);
  });
}

/**
 * Verificar constraints criadas
 */
async function verifyConstraints() {
  console.log(`${colors.cyan}\n[5/6] Verificando constraints criadas...${colors.reset}`);

  const constraints = await pool.query(`
    SELECT conname, contype 
    FROM pg_constraint 
    WHERE conrelid IN ('MealRecord'::regclass, 'MealItem'::regclass)
    AND contype = 'c'
    ORDER BY conname
  `);

  console.log(`${colors.green}✓ ${constraints.rows.length} constraints CHECK encontradas:${colors.reset}`);
  constraints.rows.forEach(con => {
    console.log(`  - ${con.conname}`);
  });
}

/**
 * Cleanup: Remover dados de teste
 */
async function cleanup() {
  console.log(`${colors.cyan}\n[6/6] Limpando dados de teste...${colors.reset}`);

  try {
    if (testMealRecordId) {
      await pool.query('DELETE FROM MealItem WHERE meal_record_id = $1', [testMealRecordId]);
      await pool.query('DELETE FROM MealRecord WHERE id = $1', [testMealRecordId]);
      console.log(`${colors.green}✓ Dados de teste removidos${colors.reset}`);
    }
  } catch (error) {
    console.error(`${colors.yellow}⚠ Aviso: ${error.message}${colors.reset}`);
  }
}

/**
 * Relatório Final
 */
function printReport() {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`${colors.blue}RELATÓRIO FINAL${colors.reset}`);
  console.log(`${'='.repeat(50)}\n`);

  console.log(`Total de testes: ${totalTests}`);
  console.log(`${colors.green}Testes passaram: ${passedTests}${colors.reset}`);
  console.log(`${colors.red}Testes falharam: ${failedTests}${colors.reset}`);

  console.log(`\n${'='.repeat(50)}`);

  if (failedTests === 0) {
    console.log(`${colors.green}✅ TODOS OS TESTES PASSARAM!${colors.reset}`);
    console.log(`${colors.green}Sistema de validação funcionando corretamente${colors.reset}`);
  } else {
    console.log(`${colors.red}❌ ALGUNS TESTES FALHARAM${colors.reset}`);
    console.log(`${colors.red}Verifique as implementações acima${colors.reset}`);
  }

  console.log(`${'='.repeat(50)}\n`);
}

/**
 * Executar todos os testes
 */
async function main() {
  console.log(`${colors.cyan}
╔════════════════════════════════════════════════╗
║  VALIDAÇÃO - RISCO 9: Planejamento Refeições  ║
║  Sistema: FitLife                              ║
║  Data: ${new Date().toLocaleDateString('pt-BR')}                             ║
╚════════════════════════════════════════════════╝
${colors.reset}`);

  try {
    await setup();
    await runValidationTests();
    await runFunctionTests();
    await verifyIndexes();
    await verifyConstraints();
    await cleanup();
    printReport();

    process.exit(failedTests > 0 ? 1 : 0);
  } catch (error) {
    console.error(`\n${colors.red}ERRO FATAL: ${error.message}${colors.reset}`);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Executar
main();
