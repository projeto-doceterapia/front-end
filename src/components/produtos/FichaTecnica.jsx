import { useEffect, useRef, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { adicionarLinha, atualizarLinha, listarInsumos, removerLinha } from '../../services/produtos'
import ConfirmDialog from '../feedback/ConfirmDialog'
import useToast from '../feedback/useToast'
import LinhaFichaForm from './LinhaFichaForm'
import { formatarQuantidade, mensagemErroProduto } from './precificacaoUtils'
import '../../styles/produtos.css'

const INSUMO_REPETIDO = 'Este insumo já está na ficha técnica.'

function quantidadeParaCampo(valor) {
  return Number(valor).toLocaleString('pt-BR', { maximumFractionDigits: 3, useGrouping: false })
}

export default function FichaTecnica({ produto, ficha, podeEditar, onFichaAlterada }) {
  const toast = useToast()
  const { linhas, carregando, erro, recarregar } = ficha
  const [formulario, setFormulario] = useState(null)
  const [insumos, setInsumos] = useState(null)
  const [salvando, setSalvando] = useState(false)
  const [remocao, setRemocao] = useState(null)
  const [removendo, setRemovendo] = useState(false)
  const secao = useRef(null)
  const origem = useRef(null)
  const enviando = useRef(false)

  useEffect(() => {
    if (formulario !== null || origem.current === null) return
    secao.current?.querySelector(`[data-foco="${origem.current}"]`)?.focus()
    origem.current = null
  }, [formulario])

  async function abrirFormulario(linha, chaveFoco) {
    origem.current = chaveFoco
    setFormulario({ linha })
    setInsumos(null)
    try {
      setInsumos(await listarInsumos())
    } catch (falha) {
      toast.erro(mensagemErroProduto(falha, 'Não foi possível carregar os insumos.'))
      setFormulario(null)
    }
  }

  function insumosDisponiveis() {
    const usados = new Set(
      linhas
        .filter((linha) => linha.idProdutoInsumo !== formulario.linha?.idProdutoInsumo)
        .map((linha) => linha.fkInsumo),
    )
    return insumos.filter(
      (insumo) =>
        insumo.idInsumo === formulario.linha?.fkInsumo ||
        (insumo.status === 'ATIVO' && !usados.has(insumo.idInsumo)),
    )
  }

  async function aposAlterar() {
    await recarregar()
    onFichaAlterada?.()
  }

  async function salvar(dados) {
    if (enviando.current) return {}
    enviando.current = true
    setSalvando(true)
    const linha = formulario.linha
    try {
      if (linha) {
        await atualizarLinha(produto.idProduto, linha.idProdutoInsumo, dados)
        toast.sucesso('Ficha técnica atualizada.')
      } else {
        await adicionarLinha(produto.idProduto, dados)
        toast.sucesso('Insumo adicionado à ficha técnica.')
      }
      setFormulario(null)
      await aposAlterar()
      return {}
    } catch (falha) {
      const duplicado = falha.response?.status === 409
      const mensagem = mensagemErroProduto(falha, duplicado ? INSUMO_REPETIDO : undefined)
      toast.erro(mensagem)
      return falha.response?.status === 422 ? { erroUnidade: mensagem } : {}
    } finally {
      enviando.current = false
      setSalvando(false)
    }
  }

  async function confirmarRemocao() {
    setRemovendo(true)
    try {
      await removerLinha(produto.idProduto, remocao.idProdutoInsumo)
      toast.sucesso('Insumo removido da ficha técnica.')
      setRemocao(null)
      await aposAlterar()
    } catch (falha) {
      toast.erro(mensagemErroProduto(falha, 'Não foi possível remover o insumo.'))
      setRemocao(null)
    } finally {
      setRemovendo(false)
    }
  }

  function inicialDe(linha) {
    return {
      fkInsumo: linha.fkInsumo,
      quantidade: quantidadeParaCampo(linha.quantidadeUtilizada),
      unidade: linha.unidade,
    }
  }

  function renderFormulario(linha) {
    return (
      <LinhaFichaForm
        insumos={insumos === null ? null : insumosDisponiveis()}
        inicial={linha ? inicialDe(linha) : null}
        ocupado={salvando}
        onSalvar={salvar}
        onCancelar={() => setFormulario(null)}
      />
    )
  }

  return (
    <section className="ficha-tecnica" ref={secao} aria-label="Ficha técnica">
      <header>
        <h3>Ficha técnica</h3>
        {podeEditar && (
          <button
            type="button"
            className="outline-button"
            data-foco="adicionar"
            disabled={formulario !== null}
            onClick={() => abrirFormulario(null, 'adicionar')}
          >
            <Plus size={14} /> Adicionar insumo
          </button>
        )}
      </header>
      <p className="ficha-ajuda">Quantidades para 1 unidade vendida.</p>
      {carregando && <p className="ficha-estado" role="status">Carregando insumos...</p>}
      {erro && <p className="ficha-estado erro" role="alert">Não foi possível carregar os insumos.</p>}
      {!carregando && !erro && linhas.length === 0 && (
        <p className="ficha-estado">Nenhum insumo na ficha técnica.</p>
      )}
      <ul className="ficha-linhas">
        {linhas.map((linha) =>
          formulario?.linha?.idProdutoInsumo === linha.idProdutoInsumo ? (
            <li key={linha.idProdutoInsumo}>{renderFormulario(linha)}</li>
          ) : (
            <li key={linha.idProdutoInsumo}>
              <span>
                {linha.nomeInsumo} — {formatarQuantidade(linha)}
              </span>
              {podeEditar && (
                <span className="ficha-acoes">
                  <button
                    type="button"
                    className="icon-action"
                    aria-label={`Editar ${linha.nomeInsumo}`}
                    data-foco={`editar-${linha.idProdutoInsumo}`}
                    disabled={formulario !== null}
                    onClick={() => abrirFormulario(linha, `editar-${linha.idProdutoInsumo}`)}
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    type="button"
                    className="icon-action"
                    aria-label={`Remover ${linha.nomeInsumo}`}
                    onClick={() => setRemocao(linha)}
                  >
                    <Trash2 size={15} />
                  </button>
                </span>
              )}
            </li>
          ),
        )}
      </ul>
      {formulario && !formulario.linha && renderFormulario(null)}
      <ConfirmDialog
        aberto={remocao !== null}
        titulo="Remover insumo"
        mensagem={`Remover ${remocao?.nomeInsumo} da ficha técnica de ${produto.nome}?`}
        textoConfirmar="Remover"
        textoCancelar="Cancelar"
        perigoso
        ocupado={removendo}
        onConfirm={confirmarRemocao}
        onCancel={() => setRemocao(null)}
      />
    </section>
  )
}
