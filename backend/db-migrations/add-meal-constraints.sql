-- ================================================
-- CONSTRAINTS E VALIDAÇÕES - PLANEJAMENTO DE REFEIÇÕES
-- Risco: 9 (Alto) - Campos incorretos causam cálculos errados
-- ================================================

-- 1. CONSTRAINTS DE VALIDAÇÃO PARA MEALRECORD
-- ================================================

-- Garantir que o nome não seja vazio
DO $$ 
BEGIN
    ALTER TABLE MealRecord ADD CONSTRAINT check_meal_name_not_empty CHECK (LENGTH(TRIM(name)) > 0);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Garantir que a data não seja muito antiga (máximo 10 anos no passado)
DO $$ 
BEGIN
    ALTER TABLE MealRecord ADD CONSTRAINT check_meal_date_not_too_old CHECK (date >= CURRENT_DATE - INTERVAL '10 years');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Garantir que a data não seja muito futura (máximo 1 ano no futuro)
DO $$ 
BEGIN
    ALTER TABLE MealRecord ADD CONSTRAINT check_meal_date_not_too_future CHECK (date <= CURRENT_DATE + INTERVAL '1 year');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- 2. CONSTRAINTS DE VALIDAÇÃO PARA MEALITEM
-- ================================================

-- Garantir que o nome do alimento não seja vazio
DO $$ 
BEGIN
    ALTER TABLE MealItem ADD CONSTRAINT check_food_name_not_empty CHECK (LENGTH(TRIM(food_name)) > 0);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Garantir que calorias sejam não-negativas
DO $$ 
BEGIN
    ALTER TABLE MealItem ADD CONSTRAINT check_calories_non_negative CHECK (calories IS NULL OR calories >= 0);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Garantir que proteínas sejam não-negativas
DO $$ 
BEGIN
    ALTER TABLE MealItem ADD CONSTRAINT check_proteins_non_negative CHECK (proteins IS NULL OR proteins >= 0);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Garantir que carboidratos sejam não-negativos
DO $$ 
BEGIN
    ALTER TABLE MealItem ADD CONSTRAINT check_carbs_non_negative CHECK (carbs IS NULL OR carbs >= 0);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Garantir que gorduras sejam não-negativas
DO $$ 
BEGIN
    ALTER TABLE MealItem ADD CONSTRAINT check_fats_non_negative CHECK (fats IS NULL OR fats >= 0);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Garantir que calorias não sejam absurdamente altas (máximo 10000 kcal por item)
DO $$ 
BEGIN
    ALTER TABLE MealItem ADD CONSTRAINT check_calories_max_limit CHECK (calories IS NULL OR calories <= 10000);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Garantir que proteínas não excedam 500g por item (limite realista)
DO $$ 
BEGIN
    ALTER TABLE MealItem ADD CONSTRAINT check_proteins_max_limit CHECK (proteins IS NULL OR proteins <= 500);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Garantir que carboidratos não excedam 500g por item (limite realista)
DO $$ 
BEGIN
    ALTER TABLE MealItem ADD CONSTRAINT check_carbs_max_limit CHECK (carbs IS NULL OR carbs <= 500);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Garantir que gorduras não excedam 500g por item (limite realista)
DO $$ 
BEGIN
    ALTER TABLE MealItem ADD CONSTRAINT check_fats_max_limit CHECK (fats IS NULL OR fats <= 500);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- 3. VALIDAÇÃO DE CONSISTÊNCIA NUTRICIONAL
-- ================================================

-- Criar função para validar consistência de calorias com macros
CREATE OR REPLACE FUNCTION validate_meal_item_calories()
RETURNS TRIGGER AS $$
DECLARE
    calculated_calories NUMERIC;
    difference NUMERIC;
BEGIN
    -- Calcular calorias baseado nos macros (proteína: 4kcal/g, carbo: 4kcal/g, gordura: 9kcal/g)
    IF NEW.proteins IS NOT NULL AND NEW.carbs IS NOT NULL AND NEW.fats IS NOT NULL AND NEW.calories IS NOT NULL THEN
        calculated_calories := (NEW.proteins * 4) + (NEW.carbs * 4) + (NEW.fats * 9);
        difference := ABS(NEW.calories - calculated_calories);
        
        -- Permitir até 20% de diferença (margem de erro)
        IF difference > (NEW.calories * 0.2) THEN
            RAISE EXCEPTION 'Calorias inconsistentes: informado %, calculado % (diferença: %)', 
                NEW.calories, calculated_calories, difference;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger para validação de calorias
DROP TRIGGER IF EXISTS trigger_validate_calories ON MealItem;
CREATE TRIGGER trigger_validate_calories
    BEFORE INSERT OR UPDATE ON MealItem
    FOR EACH ROW
    EXECUTE FUNCTION validate_meal_item_calories();

-- 4. ÍNDICES PARA PERFORMANCE
-- ================================================

-- Índice para busca de refeições por paciente e data
CREATE INDEX IF NOT EXISTS idx_meal_record_patient_date 
ON MealRecord(patient_id, date DESC);

-- Índice para busca de itens por refeição
CREATE INDEX IF NOT EXISTS idx_meal_item_meal_record 
ON MealItem(meal_record_id);

-- Índice para verificação de refeições checadas
CREATE INDEX IF NOT EXISTS idx_meal_record_checked 
ON MealRecord(checked) WHERE checked = true;

-- 5. FUNÇÃO PARA CALCULAR TOTAIS DE UMA REFEIÇÃO
-- ================================================

CREATE OR REPLACE FUNCTION get_meal_totals(meal_id UUID)
RETURNS TABLE (
    total_calories NUMERIC,
    total_proteins NUMERIC,
    total_carbs NUMERIC,
    total_fats NUMERIC,
    item_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(calories), 0) as total_calories,
        COALESCE(SUM(proteins), 0) as total_proteins,
        COALESCE(SUM(carbs), 0) as total_carbs,
        COALESCE(SUM(fats), 0) as total_fats,
        COUNT(*)::INTEGER as item_count
    FROM mealitem
    WHERE meal_record_id = meal_id;
END;
$$ LANGUAGE plpgsql;

-- 6. VIEW PARA FACILITAR CONSULTAS
-- ================================================

CREATE OR REPLACE VIEW meal_summary AS
SELECT 
    mr.id as meal_id,
    mr.name as meal_name,
    mr.date,
    mr.patient_id,
    mr.checked,
    COUNT(mi.id) as item_count,
    COALESCE(SUM(mi.calories), 0) as total_calories,
    COALESCE(SUM(mi.proteins), 0) as total_proteins,
    COALESCE(SUM(mi.carbs), 0) as total_carbs,
    COALESCE(SUM(mi.fats), 0) as total_fats
FROM MealRecord mr
LEFT JOIN MealItem mi ON mr.id = mi.meal_record_id
GROUP BY mr.id, mr.name, mr.date, mr.patient_id, mr.checked;

-- 7. FUNÇÃO PARA VALIDAR REGRAS DE NEGÓCIO
-- ================================================

CREATE OR REPLACE FUNCTION validate_meal_business_rules()
RETURNS TRIGGER AS $$
BEGIN
    -- Validar que não se pode marcar como checked se não houver itens
    IF NEW.checked = true THEN
        IF NOT EXISTS (SELECT 1 FROM mealitem WHERE meal_record_id = NEW.id) THEN
            RAISE EXCEPTION 'Não é possível marcar refeição como consumida sem itens';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger para validação de regras de negócio
DROP TRIGGER IF EXISTS trigger_validate_meal_rules ON MealRecord;
CREATE TRIGGER trigger_validate_meal_rules
    BEFORE UPDATE ON MealRecord
    FOR EACH ROW
    EXECUTE FUNCTION validate_meal_business_rules();

-- ================================================
-- FIM DAS CONSTRAINTS E VALIDAÇÕES
-- ================================================
