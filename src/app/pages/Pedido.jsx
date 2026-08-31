import { useState } from 'react'
import AcoesPedido from '../../components/pedido/AcoesPedido'
import CabecalhoPedido from '../../components/pedido/CabecalhoPedido'
import Carrinho from '../../components/pedido/Carrinho'
import CatalogoProdutos from '../../components/pedido/CatalogoProdutos'
import EtapasPedido from '../../components/pedido/EtapasPedido'
import Pagamento from '../../components/pedido/Pagamento'
import ResumoPedido from '../../components/pedido/ResumoPedido'
import { produtos } from '../../components/pedido/dadosPedido.jsx'

export default function Pedido({ onBack }) {
  const [etapa, setEtapa] = useState(2)
  const [itens, setItens] = useState([produtos[1], produtos[3], produtos[2]])

  const total = itens.reduce((soma, item) => soma + item[2], 0)
  const dinheiro = (valor) => `R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`

  function adicionar(produto) {
    setItens([...itens, produto])
  }

  function remover(indice) {
    setItens(itens.filter((_, posicao) => posicao !== indice))
  }

  function voltar() {
    if (etapa === 2) {
      onBack()
    } else {
      setEtapa(2)
    }
  }

  return (
    <main className="order-page">
      <CabecalhoPedido />
      <EtapasPedido etapa={etapa} />

      {etapa === 2 ? (
        <div className="order-content items-content">
          <CatalogoProdutos aoAdicionar={adicionar} dinheiro={dinheiro} />
          <Carrinho itens={itens} total={total} dinheiro={dinheiro} aoRemover={remover} />
        </div>
      ) : (
        <div className="order-content payment-content">
          <Pagamento total={total} dinheiro={dinheiro} />
          <ResumoPedido itens={itens} total={total} dinheiro={dinheiro} />
        </div>
      )}

      <AcoesPedido etapa={etapa} aoVoltar={voltar} aoAvancar={() => setEtapa(3)} />
    </main>
  )
}
