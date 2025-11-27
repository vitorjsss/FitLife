-- Migration: Add comprehensive body measurement fields
-- Date: 2025-01-27
-- Description: Adds specific circumference measurements and body composition fields

-- Add circumference columns
ALTER TABLE medidas_corporais 
  ADD COLUMN IF NOT EXISTS waist_circumference DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS hip_circumference DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS arm_circumference DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS thigh_circumference DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS calf_circumference DECIMAL(5,2);

-- Add body composition columns
ALTER TABLE medidas_corporais 
  ADD COLUMN IF NOT EXISTS body_fat_percentage DECIMAL(4,2),
  ADD COLUMN IF NOT EXISTS muscle_mass DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS bone_mass DECIMAL(4,2);

-- Add CHECK constraints for data validation (RNF2.0 compliance)
ALTER TABLE medidas_corporais 
  ADD CONSTRAINT check_waist_circumference 
    CHECK (waist_circumference IS NULL OR (waist_circumference >= 10 AND waist_circumference <= 200)),
  ADD CONSTRAINT check_hip_circumference 
    CHECK (hip_circumference IS NULL OR (hip_circumference >= 10 AND hip_circumference <= 200)),
  ADD CONSTRAINT check_arm_circumference 
    CHECK (arm_circumference IS NULL OR (arm_circumference >= 10 AND arm_circumference <= 100)),
  ADD CONSTRAINT check_thigh_circumference 
    CHECK (thigh_circumference IS NULL OR (thigh_circumference >= 10 AND thigh_circumference <= 150)),
  ADD CONSTRAINT check_calf_circumference 
    CHECK (calf_circumference IS NULL OR (calf_circumference >= 10 AND calf_circumference <= 100)),
  ADD CONSTRAINT check_body_fat_percentage 
    CHECK (body_fat_percentage IS NULL OR (body_fat_percentage >= 3 AND body_fat_percentage <= 60)),
  ADD CONSTRAINT check_muscle_mass 
    CHECK (muscle_mass IS NULL OR (muscle_mass >= 10 AND muscle_mass <= 100)),
  ADD CONSTRAINT check_bone_mass 
    CHECK (bone_mass IS NULL OR (bone_mass >= 1 AND bone_mass <= 10));

-- Add comment to document the change
COMMENT ON COLUMN medidas_corporais.waist_circumference IS 'Circunferência da cintura em cm (10-200)';
COMMENT ON COLUMN medidas_corporais.hip_circumference IS 'Circunferência do quadril em cm (10-200)';
COMMENT ON COLUMN medidas_corporais.arm_circumference IS 'Circunferência do braço em cm (10-100)';
COMMENT ON COLUMN medidas_corporais.thigh_circumference IS 'Circunferência da coxa em cm (10-150)';
COMMENT ON COLUMN medidas_corporais.calf_circumference IS 'Circunferência da panturrilha em cm (10-100)';
COMMENT ON COLUMN medidas_corporais.body_fat_percentage IS 'Percentual de gordura corporal (3-60%)';
COMMENT ON COLUMN medidas_corporais.muscle_mass IS 'Massa muscular em kg (10-100)';
COMMENT ON COLUMN medidas_corporais.bone_mass IS 'Massa óssea em kg (1-10)';
