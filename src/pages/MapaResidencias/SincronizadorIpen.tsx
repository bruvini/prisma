import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { 
  extrairDadosRelatorio, 
  analisarImpactoSincronizacao, 
  executarSincronizacao,
  agruparConflitosResidenciais
} from './servicoSincronizacao';
import { cadastrarResidenciasProvisoriasLote } from './servicoResidencias';
import type { 
  ImpactoSincronizacao, 
  ResumoSincronizacao,
  ConflitoResidencialAgrupado
} from './servicoSincronizacao';
import { TipoResidenciaLabel } from './tipos';

interface Props {
  aberto: boolean;
  aoFechar: () => void;
  aoConcluir: () => void;
}

export const SincronizadorIpen: React.FC<Props> = ({ aberto, aoFechar, aoConcluir }) => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [textoBruto, setTextoBruto] = useState('');
  const [extraidos, setExtraidos] = useState<any[]>([]);
  const [impacto, setImpacto] = useState<ImpactoSincronizacao | null>(null);
  const [conflitosAgrupados, setConflitosAgrupados] = useState<ConflitoResidencialAgrupado[]>([]);
  const [analisando, setAnalisando] = useState(false);
  const [registrandoResidencias, setRegistrandoResidencias] = useState(false);
  const [sincronizando, setSincronizando] = useState(false);

  if (!aberto) return null;

  const manipularAnalise = async () => {
    if (!textoBruto.trim()) {
      addToast('Cole o conteúdo do relatório 1.8 para analisar.', 'info');
      return;
    }

    setAnalisando(true);
    try {
      const regs = extrairDadosRelatorio(textoBruto);
      if (regs.length === 0) {
        throw new Error('Nenhum registro válido identificado no texto colado.');
      }
      setExtraidos(regs);
      const resultado = await analisarImpactoSincronizacao(regs);
      setImpacto(resultado);
      setConflitosAgrupados(agruparConflitosResidenciais(resultado));
    } catch (erro: any) {
      addToast(erro.message || 'Erro ao analisar relatório.', 'error');
    } finally {
      setAnalisando(false);
    }
  };

  const manipularCadastroEmLote = async () => {
    if (conflitosAgrupados.length === 0 || !user) return;

    setRegistrandoResidencias(true);
    try {
      await cadastrarResidenciasProvisoriasLote(conflitosAgrupados, user.uid);
      addToast(`${conflitosAgrupados.length} residências provisórias cadastradas. Reanalisando...`, 'success');
      
      // Re-analisa automaticamente
      const regs = extrairDadosRelatorio(textoBruto);
      const resultado = await analisarImpactoSincronizacao(regs);
      setImpacto(resultado);
      setConflitosAgrupados(agruparConflitosResidenciais(resultado));
      addToast('Relatório reanalisado com sucesso.', 'info');
    } catch (erro: any) {
      addToast(erro.message || 'Erro ao cadastrar residências.', 'error');
    } finally {
      setRegistrandoResidencias(false);
    }
  };

  const manipularSincronizacao = async () => {
    if (!impacto || !user) return;

    setSincronizando(true);
    try {
      await executarSincronizacao(impacto, user.uid);
      addToast('Sincronização concluída com sucesso!', 'success');
      aoConcluir();
      aoFechar();
    } catch (erro: any) {
      addToast(erro.message || 'Erro na sincronização.', 'error');
    } finally {
      setSincronizando(false);
    }
  };

  const calcularResumo = (): ResumoSincronizacao | null => {
    if (!impacto) return null;
    return {
      totalLido: extraidos.length,
      totalValidos: extraidos.length - impacto.conflitos.length,
      totalNovos: impacto.novos.length,
      totalReativados: impacto.reativados.length,
      totalRealocados: impacto.realocados.length,
      totalInativados: impacto.inativados.length,
      totalSemMudanca: impacto.semMudanca.length,
      totalConflitos: impacto.conflitos.length,
      totalResidenciasAusentes: conflitosAgrupados.length,
    };
  };

  const resumo = calcularResumo();

  return (
    <div className="mr-overlay" role="dialog" aria-modal="true">
      <div className="mr-modal mr-modal-lg">
        <div className="mr-modal-header">
          <h2 className="mr-modal-title">Sincronizar Relatório I-PEN (1.8)</h2>
          <button className="mr-modal-close" onClick={aoFechar} disabled={sincronizando}>&times;</button>
        </div>

        <div className="mr-modal-body mr-sync-body">
          {!impacto ? (
            <div className="mr-sync-input-area">
              <p className="mr-sync-help">
                Cole abaixo o texto bruto gerado pelo Relatório 1.8 (Listagem de Internos Alocados) do I-PEN.
                O PRISMA irá reconciliar automaticamente os dados residenciais e históricos.
              </p>
              <textarea
                className="mr-sync-textarea"
                placeholder="Cole o relatório aqui..."
                value={textoBruto}
                onChange={(e) => setTextoBruto(e.target.value)}
                disabled={analisando}
              />
              <div className="mr-sync-actions">
                <button 
                  className="mr-btn mr-btn-primary" 
                  onClick={manipularAnalise}
                  disabled={analisando || !textoBruto.trim()}
                >
                  {analisando ? 'Analisando...' : 'Analisar Impacto'}
                </button>
              </div>
            </div>
          ) : (
            <div className="mr-sync-preview">
              <div className="mr-sync-summary-grid">
                <div className="mr-sync-stat">
                  <span className="mr-sync-stat-value">{resumo?.totalNovos}</span>
                  <span className="mr-sync-stat-label">Novos</span>
                </div>
                <div className="mr-sync-stat">
                  <span className="mr-sync-stat-value">{resumo?.totalRealocados}</span>
                  <span className="mr-sync-stat-label">Movidos</span>
                </div>
                <div className="mr-sync-stat">
                  <span className="mr-sync-stat-value">{resumo?.totalReativados}</span>
                  <span className="mr-sync-stat-label">Reativados</span>
                </div>
                <div className="mr-sync-stat">
                  <span className="mr-sync-stat-value mr-sync-stat-danger">{resumo?.totalInativados}</span>
                  <span className="mr-sync-stat-label">Saídas (Inativar)</span>
                </div>
                <div className="mr-sync-stat">
                  <span className="mr-sync-stat-value">{resumo?.totalSemMudanca}</span>
                  <span className="mr-sync-stat-label">Sem Alteração</span>
                </div>
                <div className="mr-sync-stat">
                  <span className="mr-sync-stat-value mr-sync-stat-warning">{resumo?.totalConflitos}</span>
                  <span className="mr-sync-stat-label">Conflitos</span>
                </div>
                <div className="mr-sync-stat">
                  <span className="mr-sync-stat-value mr-sync-stat-danger">{resumo?.totalResidenciasAusentes}</span>
                  <span className="mr-sync-stat-label">Res. Faltando</span>
                </div>
              </div>

              {conflitosAgrupados.length > 0 && (
                <div className="mr-sync-missing-residencies">
                  <div className="mr-sync-missing-header">
                    <h4>Residências Estruturais Ausentes ({conflitosAgrupados.length})</h4>
                    <button 
                      className="mr-btn mr-btn-sm mr-btn-primary"
                      onClick={manipularCadastroEmLote}
                      disabled={registrandoResidencias || analisando}
                    >
                      {registrandoResidencias ? 'Cadastrando...' : 'Cadastrar Todas as Pendências'}
                    </button>
                  </div>
                  <p className="mr-sync-missing-help">
                    As residências abaixo não existem no PRISMA. Elas serão criadas como <strong>PROVISÓRIAS</strong> (Capacidade 0, Regime Não Informado) para permitir a alocação dos internos.
                  </p>
                  <div className="mr-sync-table-scroll">
                    <table className="mr-sync-validation-table">
                      <thead>
                        <tr>
                          <th>Residência</th>
                          <th>Pav/Gal/Piso</th>
                          <th>Tipo</th>
                          <th>Internos</th>
                          <th>Exemplos Prontuários</th>
                        </tr>
                      </thead>
                      <tbody>
                        {conflitosAgrupados.map(c => (
                          <tr key={c.chaveResidencial}>
                            <td><strong>{c.numeroResidencia}</strong></td>
                            <td>{c.pavilhao}/{c.galeria}/{c.piso}</td>
                            <td>{TipoResidenciaLabel[c.tipoResidencia]}</td>
                            <td>{c.quantidadeInternosDetectados}</td>
                            <td className="mr-sync-td-situ">{c.prontuariosExemplo.join(', ')}...</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="mr-sync-validation">
                <h4>Validação de Amostra (Primeiros 3 registros)</h4>
                <div className="mr-sync-table-scroll">
                  <table className="mr-sync-validation-table">
                    <thead>
                      <tr>
                        <th>Prontuário</th>
                        <th>Nome</th>
                        <th>Situação</th>
                        <th>Ala</th>
                        <th>Loc. (P/G/P)</th>
                        <th>Tipo</th>
                        <th>Res.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {extraidos.slice(0, 3).map(reg => (
                        <tr key={reg.prontuario}>
                          <td>{reg.prontuario}</td>
                          <td className="mr-sync-td-name">{reg.nomeCompleto}</td>
                          <td className="mr-sync-td-situ">{reg.situacaoIpen}</td>
                          <td>{reg.ala === 'MASCULINA' ? 'M' : reg.ala === 'FEMININA' ? 'F' : 'N'}</td>
                          <td>{reg.pavilhao}/{reg.galeria}/{reg.piso}</td>
                          <td><span className="mr-sync-badge-tipo">{reg.tipoResidencia}</span></td>
                          <td><strong>{reg.numeroResidencia}</strong></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mr-sync-details">
                {impacto.novos.length > 0 && (
                  <div className="mr-sync-group">
                    <h4>Inclusões Previstas</h4>
                    <ul>
                      {impacto.novos.slice(0, 5).map(n => (
                        <li key={n.prontuario}>{n.prontuario} - {n.nomeCompleto}</li>
                      ))}
                      {impacto.novos.length > 5 && <li>... e mais {impacto.novos.length - 5} internos</li>}
                    </ul>
                  </div>
                )}

                {impacto.inativados.length > 0 && (
                  <div className="mr-sync-group mr-sync-group-danger">
                    <h4>Saídas (Serão marcados como INATIVOS)</h4>
                    <ul>
                      {impacto.inativados.slice(0, 5).map(i => (
                        <li key={i.prontuario}>{i.prontuario} - {i.nome}</li>
                      ))}
                      {impacto.inativados.length > 5 && <li>... e mais {impacto.inativados.length - 5} internos</li>}
                    </ul>
                  </div>
                )}

                {impacto.conflitos.length > 0 && (
                  <div className="mr-sync-group mr-sync-group-warning">
                    <h4>Conflitos (Não serão processados)</h4>
                    <ul>
                      {impacto.conflitos.slice(0, 5).map((c, idx) => (
                        <li key={idx}><strong>{c.registro.prontuario}:</strong> {c.motivo}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="mr-sync-final-actions">
                <button 
                  className="mr-btn mr-btn-ghost" 
                  onClick={() => setImpacto(null)}
                  disabled={sincronizando}
                >
                  Voltar / Corrigir Texto
                </button>
                <button 
                  className="mr-btn mr-btn-primary" 
                  onClick={manipularSincronizacao}
                  disabled={sincronizando || (resumo?.totalValidos === 0 && resumo?.totalInativados === 0)}
                >
                  {sincronizando ? 'Sincronizando...' : 'Confirmar Sincronização'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
