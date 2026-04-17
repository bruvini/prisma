# Módulo de Triagem Clínica — Fase 3 (UX P3 Refinada)

## Visão Geral Estrutural
O módulo evoluiu para garantir usabilidade explícita na coleta da Nota Metodológica P3 operando em 100% de zoom, removendo gargalos visuais (CSS restritivos) e duplicidade cognitiva. Diferente de um prontuário eletrônico exaustivo, a triagem permanece focada em registrar status das linhas de cuidado e pendências metodológicas.

## Modificações UX / UI
*   **Abertura de Margens (Flexibilização do Zoom 100%)**: Remoção da restrição agressiva no `tr-page` e no `ModalTriagem`. O modal agora tem abertura `max-width: 1080px` permitindo dispor os módulos (Hipertensão e Diabetes) ***lado a lado*** no desktop.
*   **Identificação Complementar**: Fica estritamente em uma linha de 4 colunas em telas normais (Data Nasc., Olostech, I-PEN, Perfil de Cuidado).
*   **Perfil de Cuidado (Gênero Assistencial)**: Homem Cis, Homem Trans, Mulher Cis, Mulher Trans.
*   **UX P1 Clara**: Ao final, o botão exibe explicitamente `Concluir & Criar Atendimento P1`.

## Arquitetura de Dados P3 (Desacoplamento e Sincronização)
A exigência clínica demandava Peso, Altura e Pressão Arterial tanto na Hipertensão quanto na Diabetes. Porém, replicá-los na interface gerava confusão (drift) caso a enfermeira preenchesse num lado e esquecesse do outro.

*   **Sinais Vitais e Antropometria (Single Source of Truth Visual)**: Na UI, foi criado um bloco único ("Sinais Vitais e Antropometria — P3") que é injetado dinamicamente sempre que HAS ou DM forem ativadas no formulário (ou ambas).
*   **Módulo HAS Visual**: Contém apenas "Consulta Física Relacionada" e "Anotação".
*   **Módulo DM Visual**: Contém "Consulta Física Relacionada", "Hemoglobina Glicada (HbA1c)" e "Anotação". *A pressão arterial foi totalmente removida do bloco de Diabetes isolado.*
*   **Intermediação no Gravar (State Sync)**: No envio à base de dados Firestore, o `ModalTriagem.handleSalvar` consome o estado visual canônico (da fonte única) e popula a interface de `ModuloHipertensao` e `ModuloDiabetes` preservando as assinaturas dos Domain Types isolados. Assim, a camada de banco de dados e os cálculos do Serviço (Ex. `calcularPendencias()`) não precisaram ser quebrados ou misturados retroativamente.

## Motor de Retroatividade e Pendência
*   Cada informação coletada na P3 (Consulta, PAS/PAD, Peso, Altura, HbA1c) carrega obrigatoriamente um selo de **Origem do Dado**.
*   A triagem não zera as pendências da P3 automaticamente só por ser salva; ela só assinala "Boa Prática OK" (verde) se o campo específico de exame ou consulta receber uma dada retroativa ou atual.
