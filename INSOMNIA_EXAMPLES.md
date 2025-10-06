# Exemplos de Body para Testes no Insomnia - FitLife API

## Autenticação

### 1. POST /auth/register
```json
{
  "username": "testuser",
  "email": "test@example.com",
  "password": "123456",
  "user_type": "Patient"
}
```

### 2. POST /auth/login
```json
{
  "username": "testuser",
  "password": "123456"
}
```

---

## Pacientes

### 3. POST /patient
```json
{
  "name": "João da Silva",
  "birthdate": "1990-05-15",
  "sex": "M",
  "contact": "11999999999",
  "auth_id": 1
}
```

### 4. PUT /patient/:id
```json
{
  "name": "João Silva Santos",
  "birthdate": "1990-05-15",
  "sex": "M",
  "contact": "11888888888"
}
```

---

## Nutricionistas

### 5. POST /nutricionist
```json
{
  "name": "Maria Fernanda",
  "birthdate": "1985-03-20",
  "sex": "F",
  "contact": "11777777777",
  "crn": "CRN123456",
  "auth_id": 2
}
```

### 6. PUT /nutricionist/:id
```json
{
  "name": "Maria Fernanda Santos",
  "birthdate": "1985-03-20",
  "sex": "F",
  "contact": "11666666666",
  "crn": "CRN123456"
}
```

---

## Educadores Físicos

### 7. POST /physical-educator
```json
{
  "name": "Carlos Eduardo",
  "birthdate": "1980-07-10",
  "sex": "M",
  "contact": "11555555555",
  "cref": "CREF987654",
  "auth_id": 3
}
```

### 8. PUT /physical-educator/:id
```json
{
  "name": "Carlos Eduardo Silva",
  "birthdate": "1980-07-10",
  "sex": "M",
  "contact": "11444444444",
  "cref": "CREF987654"
}
```

---

## Sistema de Refeições

### 9. POST /daily-meal-registry
```json
{
  "date": "2025-10-02",
  "patient_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

### 10. PUT /daily-meal-registry/:id
```json
{
  "date": "2025-10-03"
}
```

### 13. POST /meal-record
```json
{
  "name": "Café da manhã",
  "icon_path": "/icons/breakfast.png",
  "daily_meal_registry_id": "550e8400-e29b-41d4-a716-446655440001"
}
```

### 14. PUT /meal-record/:id
```json
{
  "name": "Café da manhã reforçado",
  "icon_path": "/icons/breakfast-strong.png"
}
```

### 15. POST /meal-item
```json
{
  "food_name": "Aveia",
  "quantity": "50g",
  "calories": 190.5,
  "proteins": 6.8,
  "carbs": 32.2,
  "fats": 3.4,
  "food_id": "550e8400-e29b-41d4-a716-446655440002",
  "meal_id": "550e8400-e29b-41d4-a716-446655440003"
}
```

### 16. PUT /meal-item/:id
```json
{
  "food_name": "Aveia integral",
  "quantity": "60g",
  "calories": 228.6,
  "proteins": 8.16,
  "carbs": 38.64,
  "fats": 4.08
}
```

---

## Exemplos de UUIDs para Testes

Para facilitar os testes, você pode usar estes UUIDs fictícios:

```
patient_id: 550e8400-e29b-41d4-a716-446655440000
daily_meal_registry_id: 550e8400-e29b-41d4-a716-446655440001
food_id: 550e8400-e29b-41d4-a716-446655440002
meal_id: 550e8400-e29b-41d4-a716-446655440003
meal_item_id: 550e8400-e29b-41d4-a716-446655440004
```

---

## Rotas GET (sem body)

### Rotas que não precisam de body:
- GET /patient
- GET /patient/:id
- GET /nutricionist
- GET /nutricionist/:id
- GET /physical-educator
- GET /physical-educator/:id
- GET /daily-meal-registry
- GET /daily-meal-registry/:id
- GET /daily-meal-registry/patient/:patientId
- GET /daily-meal-registry/date/:date
- GET /food
- GET /food/:id
- GET /food/search/:name
- GET /meal-record
- GET /meal-record/:id
- GET /meal-record/registry/:registryId
- GET /meal-record/with-items/:id
- GET /meal-item
- GET /meal-item/:id
- GET /meal-item/meal/:mealId
- GET /logs

### Rotas DELETE (sem body):
- DELETE /patient/:id
- DELETE /nutricionist/:id
- DELETE /physical-educator/:id
- DELETE /daily-meal-registry/:id
- DELETE /food/:id
- DELETE /meal-record/:id
- DELETE /meal-item/:id

---

## Headers Necessários

Para todas as rotas protegidas (exceto /auth/register e /auth/login), você precisa incluir:

```
Authorization: Bearer <seu_token_jwt>
Content-Type: application/json
```

---

## Notas Importantes

1. **Autenticação**: Primeiro faça login para obter o token JWT
2. **UUIDs**: As tabelas de refeições usam UUID como chave primária
3. **Relacionamentos**: Certifique-se de que os IDs de referência existam
4. **Validações**: Alguns campos são obrigatórios (verifique as mensagens de erro)
5. **Logs**: Todas as operações são logadas automaticamente