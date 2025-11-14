-- Fix get_meal_totals function to return proper numeric types
-- This resolves the "structure of query does not match function result type" error

DROP FUNCTION IF EXISTS get_meal_totals(uuid);

CREATE OR REPLACE FUNCTION get_meal_totals(p_meal_id uuid)
RETURNS TABLE(
    total_calories NUMERIC,
    total_proteins NUMERIC,
    total_carbs NUMERIC,
    total_fats NUMERIC,
    item_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(mi.calories), 0)::NUMERIC as total_calories,
        COALESCE(SUM(mi.proteins), 0)::NUMERIC as total_proteins,
        COALESCE(SUM(mi.carbs), 0)::NUMERIC as total_carbs,
        COALESCE(SUM(mi.fats), 0)::NUMERIC as total_fats,
        COUNT(*)::INTEGER as item_count
    FROM mealitem mi
    WHERE mi.meal_record_id = p_meal_id;
END;
$$ LANGUAGE plpgsql;

-- Test the function
SELECT * FROM get_meal_totals('00000000-0000-0000-0000-000000000000');
