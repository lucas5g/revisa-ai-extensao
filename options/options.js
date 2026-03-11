document.addEventListener('DOMContentLoaded', () => {
    restoreOptions();
    document.getElementById('year').textContent = new Date().getFullYear();

    const handleShortcutDefinition = (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        let keys = [];
        if (e.ctrlKey) keys.push('Ctrl');
        if (e.altKey) keys.push('Alt');
        if (e.shiftKey) keys.push('Shift');
        if (e.metaKey) keys.push('Meta');
        
        if (!['Control', 'Alt', 'Shift', 'Meta'].includes(e.key)) {
            let keyVal = e.key;
            if (keyVal === ' ') keyVal = 'Space';
            keys.push(keyVal.length === 1 ? keyVal.toUpperCase() : keyVal);
        }
        
        if (keys.length === 0) return;
        
        const shortcutString = keys.join('+');
        e.target.value = shortcutString;
        e.target.dataset.key = shortcutString; 
    };

    document.getElementById('shortcutOpen').addEventListener('keydown', handleShortcutDefinition);
    document.getElementById('shortcutApply').addEventListener('keydown', handleShortcutDefinition);
});
document.getElementById('options-form').addEventListener('submit', saveOptions);

function saveOptions(e) {
    e.preventDefault();

    const apiKey = document.getElementById('apiKey').value;
    const model = document.getElementById('model').value;
    const language = document.getElementById('language').value;
    
    const shortcutOpenInput = document.getElementById('shortcutOpen');
    const shortcutApplyInput = document.getElementById('shortcutApply');
    
    const shortcutOpen = shortcutOpenInput.dataset.key || shortcutOpenInput.value;
    const shortcutApply = shortcutApplyInput.dataset.key || shortcutApplyInput.value;

    const statusEl = document.getElementById('status');
    const saveBtn = document.getElementById('saveBtn');

    saveBtn.disabled = true;
    saveBtn.textContent = 'Salvando...';

    chrome.storage.sync.set(
        { apiKey, model, language, shortcutOpen, shortcutApply },
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
            language: 'pt-BR',
            shortcutOpen: 'Tab',
            shortcutApply: 'Enter'
        },
        (items) => {
            document.getElementById('apiKey').value = items.apiKey;
            document.getElementById('model').value = items.model;
            document.getElementById('language').value = items.language;
            
            const soInput = document.getElementById('shortcutOpen');
            soInput.value = items.shortcutOpen;
            soInput.dataset.key = items.shortcutOpen;

            const saInput = document.getElementById('shortcutApply');
            saInput.value = items.shortcutApply;
            saInput.dataset.key = items.shortcutApply;
        }
    );
}
