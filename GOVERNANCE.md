# GOVERNANCE.md - Sistema PRISMA-SP

## Visão do Sistema
O PRISMA-SP (Prontuário de Registro Integrado de Saúde e Monitoramento Assistencial - Saúde Prisional) é uma plataforma clínica e operacional para a Unidade Básica de Saúde - Saúde Prisional do Presídio Regional de Joinville. O objetivo é unificar prontuários, farmácia, psicologia, vacinação, indicadores e estado de celas de forma humanizada, ética e livre de estigmas prisionais.

## Arquitetura de Módulos e Responsabilidades
- **Triagem:** Ponto de entrada. Criação do perfil-base do interno reutilizado por todo o ecossistema.
- **Farmácia:** Gestão de medicamentos, entradas, saídas e dispensação com rastreabilidade.
- **Psicologia:** Registro de acompanhamentos longitudinais por sigilo profissional.
- **Vacinação:** Controle de carteira vacinal com registro de doses, datas e lotes.
- **Indicadores:** Visão analítica para relatórios gerenciais e financiamento do SUS.
- **Mapa de Celas:** Localização física atuando como uma "regulação de leitos" para simplificar logística clínica.
- **Gestão de Usuários:** Criação e revogação de acessos via Firebase Auth associados a perfis RBAC no Firestore.

## Arquitetura de Agentes e Operação
Quaisquer atualizações visuais ou funcionais no frontend devem usar o **Agent Browser** durante a fase de pull request para:
- Validar simulação de fluxos reais.
- Garantir a persistência da paleta de cores institucional.
- Confirmar uso do padrão de font-family (DM Sans).
- Bloquear implementações que fujam aos guias de acessibilidade.

## Critérios de Aprovação e CI/CD
1. **Pipeline Completa:** Lint, Testes Unitários e Integração, Type-Check (Build).
2. Nenhuma alteração pode ser acoplada à `main` sem validação nos padrões estipulados de PR.
3. Deploys são sempre orientados via Firebase Hosting, disparados apenas após a bateria de Build e Tests ter sido bem sucedida.

## Política de Mudanças e Convenção de Branches
- **feature/** para novos módulos ou componentes principais.
- **fix/** para correção de bugs mapeados.
- **chore/** para atualizações estruturais inertes.
- Mudanças destrutivas no banco (Firestore) requerem plano de migração explícito validado em STG.
