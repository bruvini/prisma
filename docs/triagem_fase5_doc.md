# Documentação da Triagem Clínica — Fase 5 Refatorada

## Histórico de Atualizações de Regra de Negócio

A versão mais recente da Triagem Clínica foi ajustada para focar na despoluição visual e alinhamento preciso das regras de negócio do produto.

### 1. Refatoração do Bloco "Uso de Substâncias Psicoativas"
- **UX Nova (Layout em Linha)**: O design original de "nuvem de chips lado a lado" foi abandonado. Agora, as substâncias são apresentadas uma por linha em uma lista limpa com toggles/checkboxes interativos.
- **Campos Complementares**: Ao marcar uma substância, os campos descritivos surgem logo abaixo da linha selecionada. O sistema pergunta apenas:
  - Tempo de uso
  - Frequência
  - Data de último uso
- **Remoção**: A classificação por "Via de Administração" foi removida da interface clínica para agilizar a marcação.

### 2. Autoidentificação LGBTQIA+
- A marcação interativa `<button data-lgbtqia="true">` passou a receber um leve detalhe visual de degradê contido no estado `:hover`. Essa modificação foi implementada para oferecer conforto visual de representatividade sem comprometer a sobriedade institucional da interface do PRISMA.

### 3. Modificação da P5 Tuberculose (Hardening do Minimalismo)
- Seguindo a regra de síntese, todos os sete **Sintomas Específicos** (Tosse, Hemoptise, Febre persistente, Sudorese noturna, Perda de peso, Dor no peito, Tratamento interrompido) foram totalmente removidos da interface de usuário da Triagem.
- **Rastreio Mínimo Exigido**: A P5 exige apenas que o profissional assinale `Sim` ou `Não` para duas **perguntas-síntese**:
  1. O paciente apresenta tosse ou algum sintoma chave (sudorese, emagrecimento, etc)?
  2. Há relato de tuberculose confirmada ou tratamento interrompido?
- Os estados assistenciais (`SUSPEITA_CLINICA` ou `RELATO_TB_CONFIRMADA_OU_INDEFINIDA`) continuam sendo derivados perfeitamente do valor preenchido de forma objetiva, mantendo as flags e pendências intactas para consumo em dashboards do pipeline posterior.

### 4. Boas Práticas do Browser Subagent
Para validar telas do Módulo de Triagem no Prisma, a IA (ou Agent) **deve** usar EXATAMENTE:
- Email: `admin@prisma.com`
- Senha: `senha123`

Por regras de persistência estrutural do banco na Cloud e consistência de staging, as validações visuais não devem salvar (concluir submit) do documento do modal, preservando a esteira limpa de prototipação.

Esta documentação serve como single source de estado, e as lógicas de interface do React, bem como os tipos de dados contidos em `tipos.ts`, já foram sincronizadas para coibir a reintegração indesejada das propriedades visuais descartadas pela decisão de produto.
