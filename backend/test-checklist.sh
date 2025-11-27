#!/bin/bash

echo "=== TESTE DE ATUALIZAÇÃO DE CHECKLIST ==="
echo ""

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

BASE_URL="http://localhost:5001"

# 1. Registrar usuário de teste
echo "1. Criando usuário paciente de teste..."
REGISTER_RESPONSE=$(curl -s -X POST ${BASE_URL}/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teste.checklist@fitlife.com",
    "username": "teste_checklist",
    "password": "senha123",
    "user_type": "Patient",
    "name": "Teste Checklist",
    "birthdate": "1990-01-01",
    "sex": "M",
    "contact": "11999999999"
  }')

PATIENT_ID=$(echo $REGISTER_RESPONSE | jq -r '.id')
echo "Patient ID: $PATIENT_ID"

# 2. Fazer login
echo ""
echo "2. Fazendo login..."
LOGIN_RESPONSE=$(curl -s -X POST ${BASE_URL}/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teste.checklist@fitlife.com",
    "password": "senha123"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.accessToken')
echo "Token obtido: ${TOKEN:0:50}..."

# 3. Criar uma refeição
echo ""
echo "3. Criando refeição de teste..."
CREATE_MEAL=$(curl -s -X POST ${BASE_URL}/meal-record \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"name\": \"Café da Manhã\",
    \"date\": \"2025-11-10\",
    \"patient_id\": \"$PATIENT_ID\",
    \"icon_path\": \"breakfast.png\",
    \"checked\": false
  }")

MEAL_ID=$(echo $CREATE_MEAL | jq -r '.id')
MEAL_CHECKED=$(echo $CREATE_MEAL | jq -r '.checked')
echo "Meal ID: $MEAL_ID"
echo "Status inicial checked: $MEAL_CHECKED"

# 4. Atualizar para checked = true
echo ""
echo "4. Marcando refeição como concluída (checked = true)..."
UPDATE_MEAL=$(curl -s -X PUT ${BASE_URL}/meal-record/${MEAL_ID} \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "checked": true
  }')

UPDATED_CHECKED=$(echo $UPDATE_MEAL | jq -r '.checked')
echo "Status após atualização: $UPDATED_CHECKED"

# 5. Verificar se persistiu no banco
echo ""
echo "5. Verificando persistência no banco de dados..."
sleep 1
DB_CHECK=$(PGPASSWORD=fitlife psql -h localhost -p 5433 -U fitlife -d fitlife -t -c "SELECT checked FROM MealRecord WHERE id = '$MEAL_ID';")
DB_CHECKED=$(echo $DB_CHECK | xargs)
echo "Valor no banco: $DB_CHECKED"

# 6. Buscar refeição via API
echo ""
echo "6. Buscando refeição via API GET..."
GET_MEAL=$(curl -s -X GET ${BASE_URL}/meal-record/${MEAL_ID} \
  -H "Authorization: Bearer $TOKEN")

GET_CHECKED=$(echo $GET_MEAL | jq -r '.checked')
echo "Status via GET: $GET_CHECKED"

# 7. Criar treino para testar WorkoutRecord também
echo ""
echo "7. Criando treino de teste..."
CREATE_WORKOUT=$(curl -s -X POST ${BASE_URL}/workout-record \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"name\": \"Treino A\",
    \"date\": \"2025-11-10\",
    \"patient_id\": \"$PATIENT_ID\",
    \"checked\": false
  }")

WORKOUT_ID=$(echo $CREATE_WORKOUT | jq -r '.id')
WORKOUT_CHECKED=$(echo $CREATE_WORKOUT | jq -r '.checked')
echo "Workout ID: $WORKOUT_ID"
echo "Status inicial: $WORKOUT_CHECKED"

# 8. Atualizar treino para checked = true
echo ""
echo "8. Marcando treino como concluído..."
UPDATE_WORKOUT=$(curl -s -X PUT ${BASE_URL}/workout-record/${WORKOUT_ID} \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "checked": true
  }')

WORKOUT_UPDATED=$(echo $UPDATE_WORKOUT | jq -r '.checked')
echo "Status após atualização: $WORKOUT_UPDATED"

# 9. Verificar treino no banco
echo ""
echo "9. Verificando treino no banco..."
DB_WORKOUT=$(PGPASSWORD=fitlife psql -h localhost -p 5433 -U fitlife -d fitlife -t -c "SELECT checked FROM WorkoutRecord WHERE id = '$WORKOUT_ID';")
DB_WORKOUT_CHECKED=$(echo $DB_WORKOUT | xargs)
echo "Valor no banco: $DB_WORKOUT_CHECKED"

# 10. Verificar logs de auditoria
echo ""
echo "10. Verificando logs de auditoria..."
LOGS=$(PGPASSWORD=fitlife psql -h localhost -p 5433 -U fitlife -d fitlife -c "SELECT action, description, old_value, new_value, created_at FROM logs WHERE user_id = (SELECT auth_id FROM patient WHERE id = '$PATIENT_ID') ORDER BY created_at DESC LIMIT 5;")
echo "$LOGS"

# Resumo dos testes
echo ""
echo "======================================"
echo "RESUMO DOS TESTES"
echo "======================================"

if [ "$UPDATED_CHECKED" = "true" ] && [ "$DB_CHECKED" = "t" ] && [ "$GET_CHECKED" = "true" ]; then
  echo -e "${GREEN}✓ MEAL: Atualização de checklist funcionando corretamente${NC}"
else
  echo -e "${RED}✗ MEAL: Falha na atualização de checklist${NC}"
  echo "  - API UPDATE retornou: $UPDATED_CHECKED"
  echo "  - Banco de dados: $DB_CHECKED"
  echo "  - API GET retornou: $GET_CHECKED"
fi

if [ "$WORKOUT_UPDATED" = "true" ] && [ "$DB_WORKOUT_CHECKED" = "t" ]; then
  echo -e "${GREEN}✓ WORKOUT: Atualização de checklist funcionando corretamente${NC}"
else
  echo -e "${RED}✗ WORKOUT: Falha na atualização de checklist${NC}"
  echo "  - API UPDATE retornou: $WORKOUT_UPDATED"
  echo "  - Banco de dados: $DB_WORKOUT_CHECKED"
fi

# Verificar se há logs de auditoria
LOG_COUNT=$(PGPASSWORD=fitlife psql -h localhost -p 5433 -U fitlife -d fitlife -t -c "SELECT COUNT(*) FROM logs WHERE user_id = (SELECT auth_id FROM patient WHERE id = '$PATIENT_ID');")
LOG_COUNT=$(echo $LOG_COUNT | xargs)

if [ "$LOG_COUNT" -gt "0" ]; then
  echo -e "${GREEN}✓ LOGS: Sistema de auditoria registrando ações ($LOG_COUNT logs)${NC}"
else
  echo -e "${YELLOW}⚠ LOGS: Nenhum log de auditoria encontrado${NC}"
fi

# Cleanup
echo ""
echo "Limpando dados de teste..."
PGPASSWORD=fitlife psql -h localhost -p 5433 -U fitlife -d fitlife -c "DELETE FROM patient WHERE id = '$PATIENT_ID';" > /dev/null 2>&1
PGPASSWORD=fitlife psql -h localhost -p 5433 -U fitlife -d fitlife -c "DELETE FROM auth WHERE email = 'teste.checklist@fitlife.com';" > /dev/null 2>&1

echo "Teste concluído!"
