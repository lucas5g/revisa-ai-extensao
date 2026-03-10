document.addEventListener('DOMContentLoaded', () => {
    restoreOptions();
    document.getElementById('year').textContent = new Date().getFullYear();
});
document.getElementById('options-form').addEventListener('submit', saveOptions);

function saveOptions(e) {
    e.preventDefault();

    const apiKey = document.getElementById('apiKey').value;
    const model = document.getElementById('model').value;
    const language = document.getElementById('language').value;
    const statusEl = document.getElementById('status');
    const saveBtn = document.getElementById('saveBtn');

    saveBtn.disabled = true;
    saveBtn.textContent = 'Salvando...';

    chrome.storage.sync.set(
        { apiKey, model, language },
        () => {
            saveBtn.disabled = false;
            saveBtn.textContent = 'Salvar Configurações';

            statusEl.textContent = 'Salvo com sucesso!';
            statusEl.className = 'status-message success';
            setTimeout(() => {
                statusEl.className = 'status-message';
            }, 3000);
        }
    );
}

function restoreOptions() {
    chrome.storage.sync.get(
        {
            apiKey: '',
            model: 'llama-3.3-70b-versatile',
            language: 'pt-BR'
        },
        (items) => {
            document.getElementById('apiKey').value = items.apiKey;
            document.getElementById('model').value = items.model;
            document.getElementById('language').value = items.language;
        }
    );
}
