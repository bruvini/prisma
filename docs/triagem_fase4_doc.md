# Módulo de Triagem Clínica — Fase 4 (P4 Rastreio de IST)

## Visão Geral Estrutural
O modal de Triagem Clínica evoluiu para abranger o **P4 - Rastreio de Infecções Sexualmente Transmissíveis (Sífilis, HIV, Hepatite B e Hepatite C)**. A abordagem arquitetural focou em uma estrutura limpa e coesa dentro do fluxo de trabalho da enfermagem, sem transformá-la num sistema labiríntico.

## Regras de Negócio Implementadas

### Bloco Único Assistencial (`ModuloRastreioIST`)
- A UI não induz o profissional a responder um exaustivo questionário sobre "ter ou não ter a doença" baseado em sintomas (isso caberá ao monitoramento clínico posterior). 
- A triagem foca **diretamente no status do rastreio nos últimos 12 meses**, com 3 estados fundamentais: 
   1. `REALIZADO`: Exige o preenchimento condicional de Data, Tipo, Origem e o Resultado (`Reagente` / `Não Reagente`).
   2. `NÃO REALIZADO`: Abre condicionalmente o campo `Motivo` (texto aberto) que se torna obrigatório.
   3. `PENDENTE`: Este é o estado Padrão/Vazio do formulário. 

### Validação Rígida no Salvamento (Bloqueio)
Se qualquer uma das 4 ISTs possuir lacunas de regras ou continuar no status `PENDENTE`, um **Hard Block** é injetado:
- O botão `Concluir & Criar Atendimento P1` é bloqueado e uma mensagem de pendência crítica (`.tr-erro-p4`) salta alertando a urgência da coleta.
- Esse hard block existe tanto de modo preditivo no Client Side (`P4PossuiPendencias`) quanto defensivamente no backend (`servicoTriagem.ts -> criarTriagem()`).

### Alavanca para o Motor Clínico Futuro
- Se qualquer IST apresentar o valor **REALIZADO -> REAGENTE**, o método `enriquecerModuloIST` computará automaticamente 2 sinalizadores poderosos no payload do banco de dados: 
   - `possuiResultadoReagenteP4: true`
   - O array `istReagentes: ['hiv', 'sifilis']` listando as matrizes confirmadas.
- O mapeamento em `PendenciasTriagem` criará uma pendência paralela de "monitoramento_ist" que o produto poderá escutar livremente no futuro sem precisar realizar map-reduce nas triagens inteiras.

### Reutilização de Estado em Retorno de Egresso
- O bloco P4 foi acoplado perfeitamente sob o paradigma de `Triagem Anterior`. Quando a rotina detectar que o interno está retornando (Reativado), todo o histórico de testes preenchido será herdado na função de Reaproveitamento Clínico (botão *Pré-preencher formulário base*).

### UI/UX Reforçada
A interface ganhou respiros e o container de IST (`.tr-secao-destaque-p4`) exibe blocos visuais de alerta (bordas em vermelho ameno `.tr-bloco-pendente`) quando não resolvidos ou sem motivos especificados, chamando a atenção do profissional sem agressividade tecnológica excessiva para o zoom 100%.

> Testes de validação de interface via Browser Automation ratificam que a UX comporta cenários extremos com a visualização clara em Zoom 100%.
