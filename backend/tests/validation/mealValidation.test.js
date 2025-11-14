const MealRecordService = require('../src/services/MealRecordService');
const MealItemService = require('../src/services/MealItemService');
const pool = require('../src/config/db');

describe('[5/6] Validação de Planejamento de Refeições', () => {
  let testPatientId;
  let testMealRecordId;

  beforeAll(async () => {
    // Criar paciente de teste
    const patientResult = await pool.query(
      `INSERT INTO patient (name, birthdate, sex, auth_id) 
       VALUES ('Test Patient', '1990-01-01', 'M', 
       (SELECT id FROM auth WHERE username = 'joao' LIMIT 1))
       RETURNING id`
    );
    testPatientId = patientResult.rows[0].id;
  });

  afterAll(async () => {
    // Limpar dados de teste
    if (testMealRecordId) {
      await pool.query('DELETE FROM MealItem WHERE meal_record_id = $1', [testMealRecordId]);
      await pool.query('DELETE FROM MealRecord WHERE id = $1', [testMealRecordId]);
    }
    if (testPatientId) {
      await pool.query('DELETE FROM patient WHERE id = $1', [testPatientId]);
    }
  });

  describe('1. Validação de Tipos de Dados', () => {
    test('DEFEITO: Deve rejeitar data em formato inválido', async () => {
      await expect(async () => {
        await MealRecordService.create({
          name: 'Café da Manhã',
          date: '13-11-2025', // Formato errado
          patient_id: testPatientId
        });
      }).rejects.toThrow();
    });

    test('SUCESSO: Deve aceitar data em formato ISO correto', async () => {
      const result = await MealRecordService.create({
        name: 'Café da Manhã',
        date: '2025-11-13',
        patient_id: testPatientId
      });
      testMealRecordId = result.id;
      expect(result.id).toBeDefined();
    });

    test('DEFEITO: Deve rejeitar checked como string ao invés de boolean', async () => {
      await expect(async () => {
        await pool.query(
          `INSERT INTO MealRecord (name, date, patient_id, checked)
           VALUES ($1, $2, $3, $4)`,
          ['Almoço', '2025-11-13', testPatientId, 'true']
        );
      }).rejects.toThrow();
    });
  });

  describe('2. Validação de Regras de Negócio', () => {
    test('DEFEITO: Deve rejeitar nome vazio', async () => {
      await expect(async () => {
        await MealRecordService.create({
          name: '   ', // Nome vazio
          date: '2025-11-13',
          patient_id: testPatientId
        });
      }).rejects.toThrow(/check_meal_name_not_empty/);
    });

    test('DEFEITO: Deve rejeitar data muito futura (>1 ano)', async () => {
      await expect(async () => {
        await MealRecordService.create({
          name: 'Jantar',
          date: '2027-11-13', // Mais de 1 ano no futuro
          patient_id: testPatientId
        });
      }).rejects.toThrow(/check_meal_date_not_too_future/);
    });

    test('DEFEITO: Deve rejeitar patient_id inexistente', async () => {
      await expect(async () => {
        await MealRecordService.create({
          name: 'Lanche',
          date: '2025-11-13',
          patient_id: '00000000-0000-0000-0000-000000000000' // UUID inexistente
        });
      }).rejects.toThrow();
    });
  });

  describe('3. Validação de Valores Nutricionais', () => {
    test('DEFEITO: Deve rejeitar calorias negativas', async () => {
      await expect(async () => {
        await MealItemService.create(testMealRecordId, {
          food_name: 'Arroz',
          calories: -100 // Valor negativo
        });
      }).rejects.toThrow(/check_calories_non_negative/);
    });

    test('DEFEITO: Deve rejeitar proteínas negativas', async () => {
      await expect(async () => {
        await MealItemService.create(testMealRecordId, {
          food_name: 'Frango',
          proteins: -10
        });
      }).rejects.toThrow(/check_proteins_non_negative/);
    });

    test('DEFEITO: Deve rejeitar carboidratos > 500g', async () => {
      await expect(async () => {
        await MealItemService.create(testMealRecordId, {
          food_name: 'Macarrão',
          carbs: 600 // Acima do limite
        });
      }).rejects.toThrow(/check_carbs_max_limit/);
    });

    test('DEFEITO: Deve rejeitar calorias > 10000 kcal', async () => {
      await expect(async () => {
        await MealItemService.create(testMealRecordId, {
          food_name: 'Porção Gigante',
          calories: 15000 // Muito alto
        });
      }).rejects.toThrow(/check_calories_max_limit/);
    });

    test('DEFEITO: Deve rejeitar calorias inconsistentes com macros', async () => {
      await expect(async () => {
        await MealItemService.create(testMealRecordId, {
          food_name: 'Teste',
          calories: 100,
          proteins: 50, // 50*4 = 200 kcal
          carbs: 50,    // 50*4 = 200 kcal
          fats: 10      // 10*9 = 90 kcal
          // Total calculado: 490 kcal, mas informado: 100 kcal (diferença > 20%)
        });
      }).rejects.toThrow(/Calorias inconsistentes/);
    });

    test('SUCESSO: Deve aceitar valores nutricionais válidos', async () => {
      const result = await MealItemService.create(testMealRecordId, {
        food_name: 'Peito de Frango',
        calories: 165,
        proteins: 31,  // 31*4 = 124
        carbs: 0,      // 0*4 = 0
        fats: 3.6      // 3.6*9 = 32.4
        // Total: 156.4 kcal (~165 ± 20%)
      });
      expect(result.id).toBeDefined();
    });
  });

  describe('4. Validação de Constraints do Banco', () => {
    test('DEFEITO: Deve impedir delete de MealRecord sem cascade de MealItem', async () => {
      // Este teste verifica se a constraint de foreign key está correta
      const mealWithItems = await MealRecordService.create({
        name: 'Teste Cascade',
        date: '2025-11-13',
        patient_id: testPatientId
      });

      await MealItemService.create(mealWithItems.id, {
        food_name: 'Item Teste'
      });

      // Deve deletar em cascade (não deve dar erro)
      await expect(
        MealRecordService.delete(mealWithItems.id)
      ).resolves.not.toThrow();
    });

    test('SUCESSO: Foreign key constraints estão ativos', async () => {
      await expect(async () => {
        await pool.query(
          `INSERT INTO MealItem (food_name, meal_record_id)
           VALUES ($1, $2)`,
          ['Teste', '00000000-0000-0000-0000-000000000000']
        );
      }).rejects.toThrow();
    });
  });

  describe('5. Testes de Cálculos Nutricionais', () => {
    test('DEFEITO: Soma de calorias incorreta', async () => {
      const meal = await MealRecordService.create({
        name: 'Refeição Teste',
        date: '2025-11-13',
        patient_id: testPatientId
      });

      await MealItemService.create(meal.id, {
        food_name: 'Item 1',
        calories: 200,
        proteins: 20,
        carbs: 20,
        fats: 5
      });

      await MealItemService.create(meal.id, {
        food_name: 'Item 2',
        calories: 150,
        proteins: 15,
        carbs: 15,
        fats: 3
      });

      const totals = await pool.query(
        'SELECT * FROM get_meal_totals($1)',
        [meal.id]
      );

      expect(totals.rows[0].total_calories).toBe(350);
      expect(totals.rows[0].total_proteins).toBe(35);
      expect(totals.rows[0].total_carbs).toBe(35);
      expect(totals.rows[0].total_fats).toBe(8);

      await MealRecordService.delete(meal.id);
    });
  });
});

console.log('\n✅ TESTES DE VALIDAÇÃO CONCLUÍDOS\n');
