# Módulo de Triagem Clínica — Fase 5 (P5 Tuberculose)

## Visão Geral Estrutural
O modal de Triagem Clínica foi otimizado estruturalmente para rastrear ativamente casos de **Tuberculose (P5) na população privada de liberdade**. Buscando evitar ambiguidades operacionais, a experiência clínica foi reestruturada de forma que o *Estado Assistencial de Diagnóstico* seja derivado automática e exclusivamente através de duas Perguntas-Síntese, garantindo documentação inequívoca sem sobrecarregar a etapa de triagem. A documentação retroativa (exames, Raio-X) foi **movida inteiramente para os fluxos assistenciais de longo prazo (prontuário/eAPP)**.

## Regras de Negócio e UX Simplificada

### Perguntas-Síntese Essenciais (Substitutos de Decisão Manual)
O módulo de triagem foi guiado a **duas questões exatas de rastreio em modo Sim/Não**, das quais o sistema deduz a elegibilidade de gatilhos:

1. **Rastreio de Admissão Amplificado (Múltiplos Riscos em Bloco)**: 
   * "O paciente apresenta tosse de qualquer duração ou qualquer um dos seguintes: perda de peso, sudorese noturna, febre ≥ 2 semanas, dor no peito ao respirar, escarro sanguinolento?" (`rastreamentoTbPositivo`)
   * *A Duração Específica da tosse (3 semanas ou etc) foi removida, uma vez que na privação de liberdade qualquer duração respiratória é conduta alerta*.

2. **Detecção de Condição Crônica Prévia**:
   * "Há relato de tuberculose confirmada ou situação indefinida em acompanhamento?" (`relatoTbConfirmadaOuIndefinida`)

### Derivação Automática de Estado Assistencial
Visando limitar interpretações errôneas e sobrecarga sobre a equipe de UBS: o **estado assistencial da TB não é mais um `select` manual operado pelo usuário**. O frontend e o backend interagem utilizando o `estadoAssistencialDerivado`:
- **Regra 1**: Se `relatoTbConfirmadaOuIndefinida = true`, estado = `RELATO_TB_CONFIRMADA_OU_INDEFINIDA`.
- **Regra 2**: Senão, se `rastreamentoTbPositivo = true`, estado = `SUSPEITA_CLINICA`.
- **Regra 3**: Senão, estado = `SEM_SUSPEITA`.
*(Opcionalmente, se os sintomas granulares isolados forem pressionados e a resposta das sínteses estiver preta/sem opção ou invertida, a engine da triagem ajusta a falha e dispara para SUSPEITA).*

### Sintomas Específicos para Auditabilidade
Os "Chips" de marcação de sintomas exatos (Tosse, febre, etc.) foram mantidos na triagem para permitir que registros sigam claros perante auditoria clínica futura, complementando o preenchimento Sim/Não das questões vitais, porém os mesmos atuam puramente a favor da consistência na nota de P1 gerada e apoio ao Rastreio.

### Remoção Completa e Otimizada
Para manter a triagem rápida:
- Removido componente de `ComplementoTB`  -> "Histórico Retroativo P5 (Exames)". 
- Removido `duracaoTosse`.

### Motor de Pendências Atuais 
O serviço de geração de gatilhos acopla-se de forma enxuta ao estado derivado, delegando o cuidado final aos módulos de prontuário:
- Se **`SEM_SUSPEITA`**: Trilha limpa, sem gatilhos para P5.
- Se **`SUSPEITA_CLINICA`**: Gera e envia bandeira sistêmica `investigacao_tb: true`.
- Se **`RELATO_TB_CONFIRMADA_OU_INDEFINIDA`**: Gera alerta crônico passivo `confirmacao_ou_monitoramento_tb: true`, aguardando a equipe designada.
