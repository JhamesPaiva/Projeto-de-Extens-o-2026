/**
 * Página de Contato - EventoCom
 * Manipula envio de formulário e feedback ao usuário
 */

import { initializeAuthenticatedNavbar } from '../../core/auth/navbar-auth.js';

document.addEventListener('DOMContentLoaded', () => {
  initializeAuthenticatedNavbar({ logoutButtonId: 'contatoLogoutBtn' });

  const formContato = document.getElementById('formContato');
  const feedbackElement = document.getElementById('feedbackContato');

  if (!formContato) return;

  formContato.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Limpando feedback anterior
    feedbackElement.style.display = 'none';
    feedbackElement.className = 'contact-feedback';
    feedbackElement.textContent = '';

    // Coletando dados
    const formData = new FormData(formContato);
    const dados = {
      nome: formData.get('nome'),
      email: formData.get('email'),
      telefone: formData.get('telefone'),
      tipo: formData.get('tipo'),
      assunto: formData.get('assunto'),
      mensagem: formData.get('mensagem'),
      consentimento: formData.get('consentimento') ? true : false,
      timestamp: new Date().toISOString(),
    };

    // Validações básicas
    if (!dados.nome || !dados.email || !dados.assunto || !dados.mensagem) {
      showFeedback('Por favor, preencha todos os campos obrigatórios.', 'error');
      return;
    }

    if (!dados.consentimento) {
      showFeedback('Você precisa concordar com a Política de Privacidade.', 'error');
      return;
    }

    try {
      // NOTA: Esta é uma implementação de exemplo.
      // Em produção, você enviaria para um backend/serviço de email.
      // Por enquanto, salvamos localmente e simulamos sucesso.

      // Armazenando feedback localmente (para demonstração)
      const contatosSalvos = JSON.parse(localStorage.getItem('contatoEventoCom')) || [];
      contatosSalvos.push(dados);
      localStorage.setItem('contatoEventoCom', JSON.stringify(contatosSalvos));

      // Simulando delay de envio
      await simulateDelay(1000);

      // Limpando formulário
      formContato.reset();

      // Mostrando feedback de sucesso
      showFeedback(
        `Obrigado, ${dados.nome}! Recebemos sua mensagem e retornaremos em breve para ${dados.email}.`,
        'success'
      );

      // Log para fins de debug
      console.log('Contato salvo:', dados);
    } catch (erro) {
      console.error('Erro ao enviar mensagem:', erro);
      showFeedback(
        'Ocorreu um erro ao enviar sua mensagem. Por favor, tente novamente ou entre em contato diretamente.',
        'error'
      );
    }
  });

  function showFeedback(mensagem, tipo) {
    feedbackElement.textContent = mensagem;
    feedbackElement.className = `contact-feedback ${tipo}`;
    feedbackElement.style.display = 'block';

    // Auto-scroll para feedback
    feedbackElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    // Auto-limpar feedback após 6 segundos (apenas success)
    if (tipo === 'success') {
      setTimeout(() => {
        feedbackElement.style.display = 'none';
      }, 6000);
    }
  }

  function simulateDelay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
});
