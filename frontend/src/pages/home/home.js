document.addEventListener("DOMContentLoaded", function() {
    const eventModal = document.getElementById('eventModal');
    
    if (eventModal) {
        eventModal.addEventListener('show.bs.modal', function (event) {
            // Botão que disparou o modal
            const button = event.relatedTarget;
            
            // Captura os dados dos atributos data-*
            const nome = button.getAttribute('data-nome');
            const data = button.getAttribute('data-data');
            const hora = button.getAttribute('data-hora');
            const local = button.getAttribute('data-local');
            const inst = button.getAttribute('data-inst');
            const desc = button.getAttribute('data-desc');
            
            // Captura a imagem do card correspondente
            const cardImg = button.closest('.card').querySelector('.event-card-img').src;

            // Preenche o Modal
            document.getElementById('modalNome').textContent = nome;
            document.getElementById('modalData').textContent = data;
            document.getElementById('modalHora').textContent = hora;
            document.getElementById('modalLocal').textContent = local;
            document.getElementById('modalInst').textContent = inst;
            document.getElementById('modalDesc').textContent = desc;
            document.getElementById('modalImg').src = cardImg;
        });
    }
});