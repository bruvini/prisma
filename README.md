# PRISMA-SP

**Prontuário de Registro Integrado de Saúde e Monitoramento Assistencial - Saúde Prisional**

Uma plataforma modular unificada operando na Unidade Básica de Saúde da saúde prisional. Mantém foco profundo em humanização e operacionalidade em redes lentas através de arquitetura moderna (React + Vite + Firebase).

## Módulos Principais
1. **Triagem:** Ponto de entrada do sistema.
2. **Farmácia:** Controle de dispensação e estoque clínico.
3. **Psicologia:** Registros longitudinais sigilosos de saúde mental.
4. **Vacinação:** Relatórios e carteiras de vacinação associadas.
5. **Indicadores:** Extração de relatórios SUS.
6. **Mapa de Celas:** Gerência de macro-localização estilo regulação de leitos.
7. **Gestão de Usuários:** Autenticação e RBAC.

## Stack
- React 19 + TypeScript
- Vite + React Router DOM
- CSS Variables Baseado em Design System Neutro/Institucional (DM Sans)
- Firebase Auth & Firestore

## Padrão Visual
- **NUNCA usar Emojis.** 
- **NUNCA usar ícones estigmatizantes** referente a ambiente prisional.
- Toasts neutros e componentes altamente reutilizáveis (`Button`, `Toast`, `Table`, etc).
- Cores de uso: `#BF0413`, `#73020C`, `#B2BF50`, `#A68C5B`, `#F2F2F2`.

## Deploy
O projeto é hospedado no **Firebase Hosting**.
- **Projeto Firebase:** `pmj-sms`
- **Domínio de Hospedagem:** [https://prisma-sp.web.app](https://prisma-sp.web.app)
  - *Nota: O domínio prisma.web.app encontra-se reservado por outro projeto.*

### Comandos de Deploy
```bash
# Gerar build de produção
npm run build

# Realizar deploy para o site prisma-sp
firebase deploy --only hosting
```

## Instalação e Execução Local
```bash
npm install
npm run dev
```

Para detalhes sobre governança institucional e papéis do sistema confira `GOVERNANCE.md` e `SECURITY.md`.
