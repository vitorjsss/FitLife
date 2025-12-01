# FitLife - Troubleshooting Expo no Windows

## Problema: Tela em branco ao escanear QR Code do Expo

### Passos de Diagnóstico:

1. **Executar o script de diagnóstico:**
   ```bash
   .\diagnose.bat
   ```

2. **Verificar se o IP está correto:**
   - Abra `frontend/src/config/api.ts`
   - Confirme que `BASE_URL` tem o IP correto da sua rede
   - Exemplo: `BASE_URL: "http://192.168.1.100:5001",`

3. **Verificar conectividade entre dispositivo e PC:**
   - Dispositivo móvel e PC DEVEM estar na **MESMA rede WiFi**
   - Verifique na configuração do WiFi do seu dispositivo

### Soluções Comuns:

#### Solução 1: Limpar e Reconstruir Tudo
```bash
# Parar todos os serviços
docker-compose down -v

# Remover volumes e imagens (CUIDADO - vai deletar dados)
docker system prune -a --volumes

# Reiniciar com o script
.\start.bat
```

#### Solução 2: Aumentar Timeout do Expo
Se o Expo está carregando muito lentamente:
```bash
# Ver logs detalhados do frontend
docker-compose logs -f frontend

# Pode levar alguns minutos na primeira execução
# Aguarde pelo menos 2-3 minutos antes de desistir
```

#### Solução 3: Forçar Recarregamento do App
No dispositivo Android/iOS:
- **Android (Expo Go):** Aperte 2 vezes rapidamente para abrir o menu
- **iOS (Expo Go):** Aperte Ctrl+M (ou shake o dispositivo)
- Selecione "Reload" ou "Refresh"

#### Solução 4: Verificar Se Backend Está Respondendo
```bash
# No terminal, execute:
curl http://localhost:5001/health/ping

# Se receber uma resposta, o backend está ok
# Se não receber resposta, o backend não inicializou
```

#### Solução 5: Resetar a Configuração do Expo
```bash
# Parar o frontend
docker-compose stop frontend

# Remover node_modules do frontend
docker volume rm fitlife_frontend-node-modules

# Reiniciar
docker-compose restart frontend

# Ver logs para acompanhar
docker-compose logs -f frontend
```

### Logs Importantes para Diagnóstico:

```bash
# Ver todos os logs
docker-compose logs -f

# Ver apenas o frontend (mostra o QR Code e erros)
docker-compose logs -f frontend

# Ver apenas o backend
docker-compose logs -f backend

# Ver apenas o banco
docker-compose logs -f db
```

### Checklist Pré-Conexão:

- [ ] Docker e Docker Compose instalados?
- [ ] Todos os containers rodando? `docker-compose ps`
- [ ] Dispositivo e PC na mesma rede WiFi?
- [ ] IP correto configurado em `frontend/src/config/api.ts`?
- [ ] Backend respondendo? `curl http://localhost:5001/health/ping`
- [ ] Porta 19000 aberta? `netstat -ano | findstr :19000`

### Se Nada Funcionar:

Execute o diagnóstico e cole a saída:
```bash
.\diagnose.bat
```

Compartilhe:
1. Saída completa do diagnóstico
2. Logs do frontend: `docker-compose logs frontend`
3. Qual mensagem de erro aparece no Expo Go
