import { useEffect, useId, useState } from 'react'
import useToast from '../feedback/useToast'
import { numeroDecimal } from '../estoque/estoqueUtils'
import {
  buscarConfiguracaoPrecificacao,
  salvarConfiguracaoPrecificacao,
} from '../../services/produtos'
import DialogoCatalogo from './DialogoCatalogo'
import { mensagemErroProduto } from './precificacaoUtils'
import '../../styles/produtos.css'

const MARGEM_MAXIMA = 999.99
const INDIRETOS_MAXIMO = 100

function paraCampo(valor) {
  return String(valor).replace('.', ',')
}

function validar(margemPadrao, percentualIndiretos) {
  const erros = {}
  if (!Number.isFinite(margemPadrao) || margemPadrao < 0 || margemPadrao > MARGEM_MAXIMA) {
    erros.margemPadrao = 'Margem padrão deve estar entre 0 e 999,99%'
  }
  if (!Number.isFinite(percentualIndiretos) || percentualIndiretos < 0 || percentualIndiretos > INDIRETOS_MAXIMO) {
    erros.percentualIndiretos = 'Percentual de custos indiretos deve estar entre 0 e 100%'
  }
  return erros
}

export default function ConfiguracaoPrecificacao({ aoFechar, aoSalvar }) {
  const toast = useToast()
  const idBase = useId()
  const [carregando, setCarregando] = useState(true)
  const [erroCarga, setErroCarga] = useState('')
  const [margemPadrao, setMargemPadrao] = useState('')
  const [percentualIndiretos, setPercentualIndiretos] = useState('')
  const [erros, setErros] = useState({})
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    let ativo = true
    buscarConfiguracaoPrecificacao()
      .then((dados) => {
        if (!ativo) return
        setMargemPadrao(paraCampo(dados.margemPadrao))
        setPercentualIndiretos(paraCampo(dados.percentualIndiretos))
      })
      .catch((falha) => {
        if (ativo) setErroCarga(mensagemErroProduto(falha, 'Não foi possível carregar a configuração.'))
      })
      .finally(() => {
        if (ativo) setCarregando(false)
      })
    return () => {
      ativo = false
    }
  }, [])

  async function enviar(event) {
    event.preventDefault()
    if (salvando) return

    const margem = numeroDecimal(margemPadrao)
    const indiretos = numeroDecimal(percentualIndiretos)
    const invalidos = validar(margem, indiretos)
    setErros(invalidos)
    if (Object.keys(invalidos).length > 0) return

    setSalvando(true)
    try {
      await salvarConfiguracaoPrecificacao({ margemPadrao: margem, percentualIndiretos: indiretos })
      toast.sucesso('Configuração de precificação salva.')
      aoSalvar()
    } catch (falha) {
      toast.erro(mensagemErroProduto(falha, 'Não foi possível salvar a configuração.'))
    } finally {
      setSalvando(false)
    }
  }

  return (
    <DialogoCatalogo
      titulo="Precificação"
      subtitulo="Valores usados para calcular o preço sugerido de todos os produtos."
      aoFechar={aoFechar}
      ocupado={salvando}
    >
      {carregando && <p className="ficha-estado dialogo-estado" role="status">Carregando configuração...</p>}
      {erroCarga && <p className="catalog-error" role="alert">{erroCarga}</p>}
      {!carregando && !erroCarga && (
        <form onSubmit={enviar}>
          <div className="dialogo-campos">
            <div className="campo">
              <label htmlFor={`${idBase}-margem`}>Margem padrão (%)</label>
              <input
                id={`${idBase}-margem`}
                inputMode="decimal"
                required
                autoFocus
                value={margemPadrao}
                aria-invalid={erros.margemPadrao ? 'true' : undefined}
                aria-describedby={`${idBase}-ajuda-margem${erros.margemPadrao ? ` ${idBase}-erro-margem` : ''}`}
                onChange={(e) => setMargemPadrao(e.target.value)}
              />
              <small id={`${idBase}-ajuda-margem`} className="campo-ajuda">
                Percentual somado ao custo. Ex.: custo R$ 10,00 com 40% → sugerido R$ 14,00.
              </small>
              {erros.margemPadrao && (
                <small id={`${idBase}-erro-margem`} className="campo-erro">{erros.margemPadrao}</small>
              )}
            </div>
            <div className="campo">
              <label htmlFor={`${idBase}-indiretos`}>Custos indiretos (%)</label>
              <input
                id={`${idBase}-indiretos`}
                inputMode="decimal"
                required
                value={percentualIndiretos}
                aria-invalid={erros.percentualIndiretos ? 'true' : undefined}
                aria-describedby={`${idBase}-ajuda-indiretos${erros.percentualIndiretos ? ` ${idBase}-erro-indiretos` : ''}`}
                onChange={(e) => setPercentualIndiretos(e.target.value)}
              />
              <small id={`${idBase}-ajuda-indiretos`} className="campo-ajuda">
                Gás, energia e desgaste, somados ao custo dos insumos.
              </small>
              {erros.percentualIndiretos && (
                <small id={`${idBase}-erro-indiretos`} className="campo-erro">{erros.percentualIndiretos}</small>
              )}
            </div>
          </div>
          <footer>
            <button type="button" className="outline-button" onClick={aoFechar} disabled={salvando}>
              Cancelar
            </button>
            <button className="primary-button" disabled={salvando}>
              {salvando ? 'Salvando...' : 'Salvar configuração'}
            </button>
          </footer>
        </form>
      )}
    </DialogoCatalogo>
  )
}
