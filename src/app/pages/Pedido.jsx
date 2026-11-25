import { useEffect, useState } from 'react'
import AcoesPedido from '../../components/pedido/AcoesPedido'
import CabecalhoPedido from '../../components/pedido/CabecalhoPedido'
import Carrinho from '../../components/pedido/Carrinho'
import CatalogoProdutos from '../../components/pedido/CatalogoProdutos'
import EtapasPedido from '../../components/pedido/EtapasPedido'
import Pagamento from '../../components/pedido/Pagamento'
import ResumoPedido from '../../components/pedido/ResumoPedido'
import api from '../../services/api'
import CampoPedido from '../../components/pedido/CampoPedido'
import { errosClienteEntrega } from '../../components/pedido/validacaoPedido'
import { dataPorExtenso, dinheiro } from '../../components/formatos'

export default function Pedido({ onBack }) {
  const [etapa, setEtapa] = useState(1)
  const [produtos, setProdutos] = useState([])
  const [clientes, setClientes] = useState([])
  const [tipoCliente, setTipoCliente] = useState('existente')
  const [novoCliente, setNovoCliente] = useState({ nome: '', telefone: '', endereco: '', tipoPessoa: 'FISICA' })
  const [itens, setItens] = useState([])
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [errosCampos, setErrosCampos] = useState({})
  const [dados, setDados] = useState({
    clienteId: '',
    formaEntrega: 'RETIRADA',
    enderecoEntrega: '',
    dataEntrega: '',
    anotacao: '',
    formaPagamento: 'PIX',
  })

  useEffect(() => {
    async function buscarDados() {
      try {
        const respostas = await Promise.all([api.get('/produtos'), api.get('/clientes')])
        setProdutos(respostas[0].data || [])
        setClientes((respostas[1].data || []).filter((item) => item.status === 'ATIVO'))
      } catch (erro) {
        setErro('Não foi possível carregar clientes e produtos.')
        console.error(erro)
      }
    }

    buscarDados()
  }, [])

  const total = itens.reduce((soma, item) => soma + Number(item.produto.precoAtual) * item.quantidade, 0)
  const cliente = tipoCliente === 'novo'
    ? novoCliente
    : clientes.find((item) => item.idCliente === Number(dados.clienteId))

  function alterarDados(evento) {
    setDados({ ...dados, [evento.target.name]: evento.target.value })
  }

  function alterarNovoCliente(evento) {
    setNovoCliente({ ...novoCliente, [evento.target.name]: evento.target.value })
  }

  function adicionar(produto) {
    const itemExistente = itens.find((item) => item.produto.idProduto === produto.idProduto)

    if (itemExistente) {
      alterarQuantidade(produto.idProduto, 1)
      return
    }

    setItens([...itens, { produto, quantidade: 1 }])
  }

  function alterarQuantidade(idProduto, variacao) {
    setItens(itens.map((item) => {
      if (item.produto.idProduto !== idProduto) return item
      return { ...item, quantidade: Math.max(1, item.quantidade + variacao) }
    }))
  }

  function remover(idProduto) {
    setItens(itens.filter((item) => item.produto.idProduto !== idProduto))
  }

  function avancar() {
    setErro('')

    if (etapa === 1) {
      const erros = errosClienteEntrega({ tipoCliente, dados, novoCliente })
      setErrosCampos(erros)
      if (Object.keys(erros).length) {
        setErro('Revise os campos destacados para continuar.')
        return
      }
    }

    if (etapa === 2 && !itens.length) {
      setErro('Adicione pelo menos um produto ao pedido.')
      return
    }

    setEtapa(etapa + 1)
  }

  function voltar() {
    setErro('')
    if (etapa === 1) {
      onBack()
      return
    }
    setEtapa(etapa - 1)
  }

  async function salvarOrcamento() {
    setSalvando(true)
    setErro('')

    try {
      let clienteId = Number(dados.clienteId)

      if (tipoCliente === 'novo') {
        const respostaCliente = await api.post('/clientes', {
          ...novoCliente,
          classificacaoCliente: 'PADRAO',
          status: 'ATIVO',
          observacao: '',
        })
        clienteId = respostaCliente.data.idCliente
      }

      const pedido = {
        clienteId,
        tipoPedido: 'ORCAMENTO',
        statusPedido: 'ORCAMENTO',
        formaEntrega: dados.formaEntrega,
        enderecoEntrega: dados.formaEntrega === 'ENTREGA' ? dados.enderecoEntrega : null,
        dataEntrega: dados.dataEntrega,
        anotacao: dados.anotacao,
      }

      const resposta = await api.post('/pedidos', pedido)

      await Promise.all(itens.map((item) => api.post('/itens-pedido', {
        fkProduto: item.produto.idProduto,
        fkPedido: resposta.data.idPedido,
        quantidade: item.quantidade,
        valorUnitario: item.produto.precoAtual,
        observacao: null,
      })))

      onBack()
    } catch (erro) {
      setErro('Não foi possível salvar o orçamento. Confira os dados e tente novamente.')
      console.error(erro)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <main className="order-page">
      <CabecalhoPedido etapa={etapa} />
      <EtapasPedido etapa={etapa} />
      {erro && <p className="form-error order-error" role="alert">{erro}</p>}

      {etapa === 1 && (
        <section className="order-data order-panel">
          <header><h2>Cliente e entrega</h2></header>
          <div className="order-data-body">
            <div className="client-type-toggle full-width">
              <button type="button" className={tipoCliente === 'existente' ? 'active' : ''} onClick={() => setTipoCliente('existente')}>Cliente cadastrado</button>
              <button type="button" className={tipoCliente === 'novo' ? 'active' : ''} onClick={() => setTipoCliente('novo')}>Novo cliente</button>
            </div>
            {tipoCliente === 'existente' ? (
              <CampoPedido rotulo="Cliente" obrigatorio erro={errosCampos.clienteId} larguraTotal>
                {(campo) => (
                  <select {...campo} name="clienteId" value={dados.clienteId} onChange={alterarDados}>
                    <option value="">Selecione um cliente</option>
                    {clientes.map((item) => <option value={item.idCliente} key={item.idCliente}>{item.nome}</option>)}
                  </select>
                )}
              </CampoPedido>
            ) : <>
              <CampoPedido rotulo="Nome completo" obrigatorio erro={errosCampos.nome}>
                {(campo) => <input {...campo} name="nome" value={novoCliente.nome} onChange={alterarNovoCliente} placeholder="Nome do cliente" />}
              </CampoPedido>
              <CampoPedido rotulo="Telefone" obrigatorio erro={errosCampos.telefone}>
                {(campo) => <input {...campo} name="telefone" type="tel" value={novoCliente.telefone} onChange={alterarNovoCliente} placeholder="(11) 90000-0000" />}
              </CampoPedido>
              <CampoPedido rotulo="Tipo de pessoa">
                {(campo) => (
                  <select {...campo} name="tipoPessoa" value={novoCliente.tipoPessoa} onChange={alterarNovoCliente}>
                    <option value="FISICA">Pessoa física</option>
                    <option value="JURIDICA">Pessoa jurídica</option>
                  </select>
                )}
              </CampoPedido>
              <CampoPedido rotulo="Endereço" obrigatorio erro={errosCampos.endereco} larguraTotal>
                {(campo) => <input {...campo} name="endereco" value={novoCliente.endereco} onChange={alterarNovoCliente} placeholder="Rua, número, bairro e cidade" />}
              </CampoPedido>
            </>}
            <CampoPedido rotulo="Data de entrega" obrigatorio erro={errosCampos.dataEntrega} ajuda={dataPorExtenso(dados.dataEntrega)}>
              {(campo) => <input {...campo} name="dataEntrega" type="date" value={dados.dataEntrega} onChange={alterarDados} />}
            </CampoPedido>
            <CampoPedido rotulo="Forma de entrega">
              {(campo) => (
                <select {...campo} name="formaEntrega" value={dados.formaEntrega} onChange={alterarDados}>
                  <option value="RETIRADA">Retirada</option>
                  <option value="ENTREGA">Entrega</option>
                </select>
              )}
            </CampoPedido>
            {dados.formaEntrega === 'ENTREGA' && (
              <CampoPedido rotulo="Endereço de entrega" obrigatorio erro={errosCampos.enderecoEntrega} larguraTotal>
                {(campo) => <input {...campo} name="enderecoEntrega" value={dados.enderecoEntrega} onChange={alterarDados} />}
              </CampoPedido>
            )}
          </div>
        </section>
      )}

      {etapa === 2 && (
        <div className="order-content items-content">
          <CatalogoProdutos produtos={produtos} aoAdicionar={adicionar} dinheiro={dinheiro} />
          <Carrinho itens={itens} total={total} dinheiro={dinheiro} aoRemover={remover} aoAlterarQuantidade={alterarQuantidade} />
        </div>
      )}

      {etapa === 3 && (
        <div className="order-content payment-content">
          <Pagamento total={total} dinheiro={dinheiro} dados={dados} aoAlterar={alterarDados} />
          <ResumoPedido itens={itens} total={total} dinheiro={dinheiro} cliente={cliente} dados={dados} aoConfirmar={salvarOrcamento} salvando={salvando} />
        </div>
      )}

      <AcoesPedido etapa={etapa} aoVoltar={voltar} aoAvancar={avancar} />
    </main>
  )
}
