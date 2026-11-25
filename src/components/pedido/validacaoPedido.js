function hojeISO(hoje) {
  return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`
}

export function errosClienteEntrega({ tipoCliente, dados, novoCliente }, hoje = new Date()) {
  const erros = {}
  if (tipoCliente === 'existente') {
    if (!dados.clienteId) erros.clienteId = 'Escolha um cliente.'
  } else {
    if (!novoCliente.nome.trim()) erros.nome = 'Informe o nome do cliente.'
    if (!novoCliente.telefone.trim()) erros.telefone = 'Informe o telefone do cliente.'
    if (!novoCliente.endereco.trim()) erros.endereco = 'Informe o endereço do cliente.'
  }
  if (!dados.dataEntrega) erros.dataEntrega = 'Escolha a data de entrega.'
  else if (dados.dataEntrega < hojeISO(hoje)) erros.dataEntrega = 'Escolha uma data de hoje em diante.'
  if (dados.formaEntrega === 'ENTREGA' && !dados.enderecoEntrega.trim()) erros.enderecoEntrega = 'Informe o endereço de entrega.'
  return erros
}
