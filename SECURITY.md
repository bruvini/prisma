# SECURITY.md - Sistema PRISMA-SP

## Política de Acesso e RBAC
O sistema utiliza Firebase Authentication e armazenará papéis/funções no Firestore (Role-Based Access Control).
Existem no mínimo 4 grandes perfis de acesso:
1. **Administração/Gestão:** Acesso à gestão de usuários e indicadores globais.
2. **Enfermagem/Médico:** Acesso à Triagem, Farmácia (Dispensação), Vacinação e Mapa de Celas.
3. **Psicologia/Serviço Social:** Acesso restrito a prontuários psicológicos e seções sociais da Triagem.
4. **Farmácia (Gestão):** Acesso a entradas e controle de estoque de alto custo supervisionado.

## Trilha de Auditoria
Ações destrutivas ou críticas (como dispensação de medicação controlada, alteração de prontuário, inativação de contas) devem gravar *audit logs* na subcoleção `auditoria` do documento alvo ou coleção mestre de Logs.
Isso assegura rastreabilidade baseada em `userId` e `timestamp`.

## Segurança no Firestore (Security Rules)
As regras do Firebase Firestore devem sempre refletir a política RBAC acima implementada nas coleções:
```javascript
match /internos/{internoId} {
  allow read: if request.auth != null && hasRole("assistencial");
  allow write: if request.auth != null && hasRole("enfermagem", "medicina");
}
```
**Nenhum dado sensível (LGPD / Sigilo Médico) pode transitar sem validação de sessão autorizada.**

## Proteção de Credenciais
1. Todas as chaves do Firebase (`apiKey`, etc) contidas no arquivo `config.ts` e de backend são restritas aos domínios aprovados.
2. É terminantemente proibido inserir `.env.local` no repositório com chaves ou secrets de produção.
