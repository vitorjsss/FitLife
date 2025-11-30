import { pool } from '../../src/config/db.js';

/**
 * ========================================================================
 * TESTES DE QUALIDADE - VALIDAÇÃO DE DADOS PLAUSÍVEIS (RNF2.0)
 * ========================================================================
 * 
 * Métrica: Validação de Dados Plausíveis
 * Fórmula: x = Nvalores_inválidos_detectados / Nvalores_inválidos_inseridos
 * onde:
 *   Nvalores_inválidos_detectados = entradas inválidas corretamente rejeitadas
 *   Nvalores_inválidos_inseridos = total de entradas inválidas fornecidas
 * 
 * Requisito: x ≥ 0.98 (98% de detecção)
 * 
 * Este teste valida:
 * 1. Rejeição de peso negativo ou fora da faixa
 * 2. Rejeição de altura fora da faixa aceitável
 * 3. Rejeição de valores nutricionais inválidos
 * 4. Rejeição de IMC inconsistente
 * 5. Rejeição de circunferência inválida
 * 6. Validação de consistência de calorias vs macros
 * ========================================================================
 */

describe('[RNF 2.0] Confiabilidade - Validação de Dados Plausíveis', () => {
    let testPatientId;
    let testAuthId;

    const stats = {
        totalInvalidInputs: 0,
        detectedInvalid: 0,
        missedInvalid: 0,
        categories: {
            medidasCorporais: { total: 0, detected: 0 },
            medidasNutricionais: { total: 0, detected: 0 },
            dadosPerfil: { total: 0, detected: 0 }
        }
    };

    // Função auxiliar para testar validação
    async function testValidation(testFn, category) {
        stats.totalInvalidInputs++;
        stats.categories[category].total++;

        try {
            await testFn();
            // Se não lançou erro, a validação falhou
            stats.missedInvalid++;
            return false;
        } catch (error) {
            // Se lançou erro, a validação funcionou
            stats.detectedInvalid++;
            stats.categories[category].detected++;
            return true;
        }
    }

    beforeAll(async () => {
        console.log('\n════════════════════════════════════════════════════════════════');
        console.log('  TESTES DE VALIDAÇÃO DE DADOS PLAUSÍVEIS (RNF 2.0)');
        console.log('════════════════════════════════════════════════════════════════\n');

        // Criar paciente de teste
        const authResult = await pool.query(
            `INSERT INTO auth (username, email, password, user_type)
       VALUES ('data_validation_test', 'dataval@test.com', 'hashed', 'Patient')
       RETURNING id`
        );
        testAuthId = authResult.rows[0].id;

        const patientResult = await pool.query(
            `INSERT INTO patient (name, birthdate, sex, contact, auth_id)
       VALUES ('Data Validation Test', '1990-01-01', 'M', '11999999999', $1)
       RETURNING id`,
            [testAuthId]
        );
        testPatientId = patientResult.rows[0].id;
    });

    afterAll(async () => {
        // Limpar dados de teste
        if (testPatientId) {
            await pool.query('DELETE FROM medidas_corporais WHERE patient_id = $1', [testPatientId]);
            await pool.query('DELETE FROM medidas_nutricionais WHERE patient_id = $1', [testPatientId]);
            await pool.query('DELETE FROM patient WHERE id = $1', [testPatientId]);
        }
        if (testAuthId) {
            await pool.query('DELETE FROM auth WHERE id = $1', [testAuthId]);
        }

        // Relatório final
        const taxaDeteccao = (stats.detectedInvalid / stats.totalInvalidInputs * 100).toFixed(2);

        console.log('\n════════════════════════════════════════════════════════════════');
        console.log('  RELATÓRIO FINAL - VALIDAÇÃO DE DADOS');
        console.log('════════════════════════════════════════════════════════════════\n');
        console.log('📊 Estatísticas Gerais:');
        console.log(`  • Total de entradas inválidas testadas: ${stats.totalInvalidInputs}`);
        console.log(`  • Entradas inválidas detectadas: ${stats.detectedInvalid}`);
        console.log(`  • Entradas inválidas não detectadas: ${stats.missedInvalid}`);

        console.log('\n📊 Por Categoria:');
        Object.entries(stats.categories).forEach(([category, data]) => {
            const rate = data.total > 0 ? (data.detected / data.total * 100).toFixed(2) : 0;
            console.log(`\n  ${category}:`);
            console.log(`    Testadas: ${data.total}`);
            console.log(`    Detectadas: ${data.detected}`);
            console.log(`    Taxa: ${rate}%`);
        });

        console.log('\n📐 Cálculo da Métrica:');
        console.log(`  x = Nvalores_inválidos_detectados / Nvalores_inválidos_inseridos`);
        console.log(`  x = ${stats.detectedInvalid} / ${stats.totalInvalidInputs}`);
        console.log(`  x = ${(stats.detectedInvalid / stats.totalInvalidInputs).toFixed(4)}`);
        console.log(`  x = ${taxaDeteccao}%`);

        console.log('\n🎯 Requisito: x ≥ 98%');
        console.log(`✅ Resultado: ${taxaDeteccao}% ${taxaDeteccao >= 98 ? '≥' : '<'} 98%`);

        if (taxaDeteccao >= 98) {
            console.log('\n✓ APROVADO - Sistema ATENDE ao requisito de confiabilidade');
        } else {
            console.log('\n✗ REPROVADO - Sistema NÃO ATENDE ao requisito');
        }

        console.log('\n════════════════════════════════════════════════════════════════\n');
    });

    describe('1. Validação de Medidas Corporais', () => {
        test('1.1 - Deve rejeitar peso negativo', async () => {
            const wasDetected = await testValidation(async () => {
                await pool.query(
                    `INSERT INTO medidas_corporais (patient_id, data, peso, altura)
           VALUES ($1, CURRENT_DATE, $2, 1.75)`,
                    [testPatientId, -50]
                );
            }, 'medidasCorporais');

            expect(wasDetected).toBe(true);
        });

        test('1.2 - Deve rejeitar peso acima de 500kg', async () => {
            const wasDetected = await testValidation(async () => {
                await pool.query(
                    `INSERT INTO medidas_corporais (patient_id, data, peso, altura)
           VALUES ($1, CURRENT_DATE, $2, 1.75)`,
                    [testPatientId, 600]
                );
            }, 'medidasCorporais');

            expect(wasDetected).toBe(true);
        });

        test('1.3 - Deve rejeitar altura abaixo de 0.5m', async () => {
            const wasDetected = await testValidation(async () => {
                await pool.query(
                    `INSERT INTO medidas_corporais (patient_id, data, peso, altura)
           VALUES ($1, CURRENT_DATE, 70, $2)`,
                    [testPatientId, 0.3]
                );
            }, 'medidasCorporais');

            expect(wasDetected).toBe(true);
        });

        test('1.4 - Deve rejeitar altura acima de 2.5m', async () => {
            const wasDetected = await testValidation(async () => {
                await pool.query(
                    `INSERT INTO medidas_corporais (patient_id, data, peso, altura)
           VALUES ($1, CURRENT_DATE, 70, $2)`,
                    [testPatientId, 3.0]
                );
            }, 'medidasCorporais');

            expect(wasDetected).toBe(true);
        });

        test('1.5 - Deve rejeitar circunferência de cintura negativa', async () => {
            const wasDetected = await testValidation(async () => {
                await pool.query(
                    `INSERT INTO medidas_corporais (patient_id, data, peso, altura, waist_circumference)
           VALUES ($1, CURRENT_DATE, 70, 1.75, $2)`,
                    [testPatientId, -10]
                );
            }, 'medidasCorporais');

            expect(wasDetected).toBe(true);
        });

        test('1.6 - Deve rejeitar circunferência de cintura acima de 500cm', async () => {
            const wasDetected = await testValidation(async () => {
                await pool.query(
                    `INSERT INTO medidas_corporais (patient_id, data, peso, altura, waist_circumference)
           VALUES ($1, CURRENT_DATE, 70, 1.75, $2)`,
                    [testPatientId, 600]
                );
            }, 'medidasCorporais');

            expect(wasDetected).toBe(true);
        });

        test('1.7 - Deve aceitar valores válidos de medidas corporais', async () => {
            const result = await pool.query(
                `INSERT INTO medidas_corporais (patient_id, data, peso, altura, waist_circumference)
         VALUES ($1, CURRENT_DATE, 70, 1.75, 80)
         RETURNING *`,
                [testPatientId]
            );

            expect(result.rows[0].peso).toBe(70);
            expect(result.rows[0].altura).toBe(1.75);
            expect(result.rows[0].waist_circumference).toBe(80);

            // Limpar após o teste
            await pool.query('DELETE FROM medidas_corporais WHERE id = $1', [result.rows[0].id]);
        });
    });

    describe('2. Validação de Medidas Nutricionais', () => {
        let mealRecordId;

        beforeAll(async () => {
            const result = await pool.query(
                `INSERT INTO MealRecord (name, date, patient_id)
         VALUES ('Teste Validação', CURRENT_DATE, $1)
         RETURNING id`,
                [testPatientId]
            );
            mealRecordId = result.rows[0].id;
        });

        afterAll(async () => {
            if (mealRecordId) {
                await pool.query('DELETE FROM MealItem WHERE meal_record_id = $1', [mealRecordId]);
                await pool.query('DELETE FROM MealRecord WHERE id = $1', [mealRecordId]);
            }
        });

        test('2.1 - Deve rejeitar calorias negativas', async () => {
            const wasDetected = await testValidation(async () => {
                await pool.query(
                    `INSERT INTO MealItem (food_name, meal_record_id, calories, proteins, carbs, fats)
           VALUES ('Teste', $1, -100, NULL, NULL, NULL)`,
                    [mealRecordId]
                );
            }, 'medidasNutricionais');

            expect(wasDetected).toBe(true);
        });

        test('2.2 - Deve rejeitar calorias acima de 10000', async () => {
            const wasDetected = await testValidation(async () => {
                await pool.query(
                    `INSERT INTO MealItem (food_name, meal_record_id, calories, proteins, carbs, fats)
           VALUES ('Teste', $1, 15000, NULL, NULL, NULL)`,
                    [mealRecordId]
                );
            }, 'medidasNutricionais');

            expect(wasDetected).toBe(true);
        });

        test('2.3 - Deve rejeitar proteínas negativas', async () => {
            const wasDetected = await testValidation(async () => {
                await pool.query(
                    `INSERT INTO MealItem (food_name, meal_record_id, calories, proteins, carbs, fats)
           VALUES ('Teste', $1, NULL, -10, NULL, NULL)`,
                    [mealRecordId]
                );
            }, 'medidasNutricionais');

            expect(wasDetected).toBe(true);
        });

        test('2.4 - Deve rejeitar carboidratos acima de 500g', async () => {
            const wasDetected = await testValidation(async () => {
                await pool.query(
                    `INSERT INTO MealItem (food_name, meal_record_id, calories, proteins, carbs, fats)
           VALUES ('Teste', $1, NULL, NULL, 600, NULL)`,
                    [mealRecordId]
                );
            }, 'medidasNutricionais');

            expect(wasDetected).toBe(true);
        });

        test('2.5 - Deve rejeitar gorduras negativas', async () => {
            const wasDetected = await testValidation(async () => {
                await pool.query(
                    `INSERT INTO MealItem (food_name, meal_record_id, calories, proteins, carbs, fats)
           VALUES ('Teste', $1, NULL, NULL, NULL, -5)`,
                    [mealRecordId]
                );
            }, 'medidasNutricionais');

            expect(wasDetected).toBe(true);
        });

        test('2.6 - Deve rejeitar calorias inconsistentes com macros (diferença > 20%)', async () => {
            const wasDetected = await testValidation(async () => {
                // Calorias informadas: 100
                // Calorias calculadas: (50*4) + (50*4) + (10*9) = 490
                // Diferença: 390 (390%)
                await pool.query(
                    `INSERT INTO MealItem (food_name, meal_record_id, calories, proteins, carbs, fats)
           VALUES ('Teste', $1, 100, 50, 50, 10)`,
                    [mealRecordId]
                );
            }, 'medidasNutricionais');

            expect(wasDetected).toBe(true);
        });

        test('2.7 - Deve aceitar valores nutricionais válidos', async () => {
            const result = await pool.query(
                `INSERT INTO MealItem (food_name, meal_record_id, calories, proteins, carbs, fats)
         VALUES ('Peito de Frango', $1, 165, 31, 0, 3.6)
         RETURNING *`,
                [mealRecordId]
            );

            expect(result.rows[0].calories).toBe(165);

            // Limpar
            await pool.query('DELETE FROM MealItem WHERE id = $1', [result.rows[0].id]);
        });
    });

    describe('3. Validação de Datas e Regras de Negócio', () => {
        test('3.1 - Deve rejeitar data muito futura em MealRecord (>1 ano)', async () => {
            const wasDetected = await testValidation(async () => {
                await pool.query(
                    `INSERT INTO MealRecord (name, date, patient_id)
           VALUES ('Teste', '2027-12-31', $1)`,
                    [testPatientId]
                );
            }, 'dadosPerfil');

            expect(wasDetected).toBe(true);
        });

        test('3.2 - Deve rejeitar nome vazio em MealRecord', async () => {
            const wasDetected = await testValidation(async () => {
                await pool.query(
                    `INSERT INTO MealRecord (name, date, patient_id)
           VALUES ('   ', CURRENT_DATE, $1)`,
                    [testPatientId]
                );
            }, 'dadosPerfil');

            expect(wasDetected).toBe(true);
        });

        test('3.3 - Deve rejeitar data muito futura em WorkoutRecord (>1 ano)', async () => {
            const wasDetected = await testValidation(async () => {
                await pool.query(
                    `INSERT INTO WorkoutRecord (name, date, patient_id)
           VALUES ('Teste', '2027-12-31', $1)`,
                    [testPatientId]
                );
            }, 'dadosPerfil');

            expect(wasDetected).toBe(true);
        });
    });

    describe('4. Validação de Integridade Referencial', () => {
        test('4.1 - Deve rejeitar patient_id inexistente', async () => {
            const wasDetected = await testValidation(async () => {
                await pool.query(
                    `INSERT INTO medidas_corporais (patient_id, data, peso, altura)
           VALUES ('00000000-0000-0000-0000-000000000000', CURRENT_DATE, 70, 1.75)`
                );
            }, 'dadosPerfil');

            expect(wasDetected).toBe(true);
        });

        test('4.2 - Deve rejeitar meal_record_id inexistente', async () => {
            const wasDetected = await testValidation(async () => {
                await pool.query(
                    `INSERT INTO MealItem (food_name, meal_record_id)
           VALUES ('Teste', '00000000-0000-0000-0000-000000000000')`
                );
            }, 'dadosPerfil');

            expect(wasDetected).toBe(true);
        });
    });
});

console.log('\n✅ TESTES DE VALIDAÇÃO DE DADOS CONCLUÍDOS\n');
