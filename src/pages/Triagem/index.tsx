/* eslint-disable @typescript-eslint/no-explicit-any */
import type React from 'react';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import {
  buscarFilaTriagemPendente,
  criarTriagem,
  buscarDadosTriagemAnterior,
} from './servicoTriagem';
import type { ItemFilaTriagem, Triagem as TipoTriagem, EstadoFormTriagem } from './tipos';
import {
  StatusTriagem,
  OrigemTriagem,
  OrigemAtendimentoP1,
} from './tipos';
import { ModalTriagem } from './ModalTriagem';
import './Triagem.css';

// SVG icons
const IconeBusca = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);
const IconeLocalizacao = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
  </svg>
);

export const Triagem: React.FC = () => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [fila, setFila] = useState<ItemFilaTriagem[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [termoBusca, setTermoBusca] = useState('');

  const [itemSelecionado, setItemSelecionado] = useState<ItemFilaTriagem | null>(null);
  const [triagemAnterior, setTriagemAnterior] = useState<TipoTriagem | null>(null);
  const [carregandoAnterior, setCarregandoAnterior] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const carregarFila = useCallback(async () => {
    setCarregando(true);
    try {
      const dados = await buscarFilaTriagemPendente();
      setFila(dados);
    } catch (erro: any) {
      addToast(erro.message || 'Erro ao carregar a fila de triagem.', 'error');
    } finally {
      setCarregando(false);
    }
  }, [addToast]);

  useEffect(() => { carregarFila(); }, [carregarFila]);

  const abrirTriagem = useCallback(async (item: ItemFilaTriagem) => {
    setItemSelecionado(item);
    setTriagemAnterior(null);
    if (item.reativado) {
      setCarregandoAnterior(true);
      try {
        const anterior = await buscarDadosTriagemAnterior(item.internoId, item.triagem.detencaoId);
        setTriagemAnterior(anterior);
      } catch { /* silencioso */ } finally {
        setCarregandoAnterior(false);
      }
    }
  }, []);

  const fecharModal = useCallback(() => {
    setItemSelecionado(null);
    setTriagemAnterior(null);
    setCarregandoAnterior(false);
  }, []);

  const salvarTriagem = useCallback(async (
    estado: EstadoFormTriagem,
    triagemAnteriorId: string | null,
  ) => {
    if (!itemSelecionado) return;
    setSalvando(true);
    try {
      const agora = new Date().toISOString();
      const origem = itemSelecionado.reativado
        ? (estado.reaproveitouDadosAnteriores ? OrigemTriagem.PREENCHIDA_ANTERIOR : OrigemTriagem.RETORNO_EGRESSO)
        : OrigemTriagem.NOVA;

      await criarTriagem(
        {
          internoId:    itemSelecionado.internoId,
          detencaoId:   itemSelecionado.triagem.detencaoId,
          numeroDetencao: itemSelecionado.triagem.numeroDetencao,
          status:       StatusTriagem.CONCLUIDA,
          origem,
          triagemAnteriorId,
          reaproveitouDadosAnteriores: estado.reaproveitouDadosAnteriores,
          identificacao: estado.identificacao,
          registroP1: {
            atendimentoGerado: true,
            dataAtendimento: agora,
            origemAtendimento: itemSelecionado.reativado
              ? OrigemAtendimentoP1.TRIAGEM_RETORNO
              : OrigemAtendimentoP1.TRIAGEM_INICIAL,
            profissionalId: user?.uid,
          },
          hipertensao: estado.hipertensao,
          diabetes: estado.diabetes,
          substancias: estado.substancias,
          tuberculose: estado.tuberculose,
          rastreioIST: estado.rastreioIST,
          pendencias: {},  // calculado no serviço
        },
        user?.uid || 'dev',
      );

      addToast('Triagem registrada com sucesso.', 'success');
      fecharModal();
      carregarFila();
    } catch (erro: any) {
      addToast(erro.message || 'Erro ao salvar a triagem.', 'error');
    } finally {
      setSalvando(false);
    }
  }, [itemSelecionado, user, addToast, fecharModal, carregarFila]);

  const filaFiltrada = useMemo(() => {
    const termo = termoBusca.trim().toLowerCase();
    if (!termo) return fila;
    return fila.filter(item =>
      item.nomeCompleto.toLowerCase().includes(termo) ||
      item.prontuario.toLowerCase().includes(termo),
    );
  }, [fila, termoBusca]);

  const totalRetornos = useMemo(() => fila.filter(i => i.reativado).length, [fila]);

  return (
    <div className="tr-page">
      <header className="tr-page-header">
        <div>
          <h1 className="tr-page-title">Fila de Triagem Clínica</h1>
          <p className="tr-page-subtitle">
            Internos ativos pendentes de triagem nesta passagem — novos e retornos de egresso.
          </p>
        </div>
      </header>

      {/* Resumo */}
      {!carregando && (
        <div className="tr-summary-bar" role="status">
          <div className="tr-summary-item">
            <span className="tr-summary-value">{fila.length}</span>
            <span className="tr-summary-label">Pendentes</span>
          </div>
          {totalRetornos > 0 && (
            <>
              <div className="tr-summary-divider" aria-hidden="true" />
              <div className="tr-summary-item">
                <span className="tr-summary-value" style={{ color: 'var(--color-warning)' }}>
                  {totalRetornos}
                </span>
                <span className="tr-summary-label">Retornos de Egresso</span>
              </div>
            </>
          )}
        </div>
      )}

      {/* Busca */}
      <div className="tr-search-bar">
        <span className="tr-search-icon"><IconeBusca /></span>
        <input
          id="tr-busca-nome" className="tr-search-input" type="search"
          placeholder="Buscar por nome do interno..."
          value={termoBusca} onChange={e => setTermoBusca(e.target.value)}
          autoComplete="off" aria-label="Buscar interno por nome"
        />
      </div>

      {/* Lista */}
      {carregando ? (
        <div className="tr-loading-state" role="status" aria-live="polite">
          <span className="tr-spinner" aria-hidden="true" />
          <p>Carregando fila de triagem...</p>
        </div>
      ) : fila.length === 0 ? (
        <div className="tr-empty-state">
          <p className="tr-empty-title">Nenhum interno pendente de triagem</p>
          <p className="tr-empty-desc">Todos os internos ativos já possuem triagem registrada para a passagem atual.</p>
        </div>
      ) : filaFiltrada.length === 0 ? (
        <div className="tr-empty-state">
          <p className="tr-empty-title">Nenhum resultado encontrado</p>
          <p className="tr-empty-desc">Nenhum interno corresponde ao termo buscado.</p>
        </div>
      ) : (
        <ul className="tr-list" role="list" aria-label="Lista de internos pendentes de triagem">
          {filaFiltrada.map(item => (
            <li
              key={`${item.internoId}-${item.triagem.detencaoId}`}
              className={`tr-list-item${item.reativado ? ' tr-list-item--reativado' : ''}`}
            >
              <div className="tr-item-info">
                <span className="tr-item-nome">{item.nomeCompleto}</span>
                <div className="tr-item-meta">
                  <span className="tr-item-localizacao">
                    <IconeLocalizacao /> {item.localizacaoAtual}
                  </span>
                  {item.reativado && (
                    <span className="tr-badge-reativado" title="Retornou após passagem anterior">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                      Retorno de Egresso
                    </span>
                  )}
                </div>
              </div>
              <button
                id={`tr-btn-triagem-${item.internoId}`}
                className="tr-btn-triagem"
                onClick={() => abrirTriagem(item)}
                aria-label={`Realizar triagem de ${item.nomeCompleto}`}
              >
                Realizar triagem
              </button>
            </li>
          ))}
        </ul>
      )}

      <ModalTriagem
        item={itemSelecionado}
        triagemAnterior={triagemAnterior}
        carregandoAnterior={carregandoAnterior}
        aoFechar={fecharModal}
        aoSalvar={salvarTriagem}
        salvando={salvando}
      />
    </div>
  );
};
