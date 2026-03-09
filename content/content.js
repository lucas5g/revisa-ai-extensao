// Variável para armazenar o elemento ativo atualmente
let currentActiveElement = null;
let containerRoot = null;
let fabElement = null;
let modalElement = null;
let isProcessing = false;

// Inicializa os elementos UI
function initUI() {
    if (document.getElementById('revisa-ai-root')) return;

    // Root container
    containerRoot = document.createElement('div');
    containerRoot.id = 'revisa-ai-root';
    document.body.appendChild(containerRoot);

    // Creates SVG Sparkle Icon
    const sparkleSvg = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/>
        </svg>
    `;

    // Floating Action Button
    fabElement = document.createElement('div');
    fabElement.className = 'revisa-fab';
    fabElement.innerHTML = sparkleSvg;
    fabElement.title = "Melhorar e Corrigir Texto (RevisaAI)";
    containerRoot.appendChild(fabElement);

    // Modal UI
    modalElement = document.createElement('div');
    modalElement.className = 'revisa-modal';
    modalElement.innerHTML = `
        <div class="revisa-modal-header">
            <div class="revisa-brand">
                ${sparkleSvg}
                <span>RevisaAI</span>
            </div>
            <button class="revisa-close" aria-label="Fechar">
                <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
        </div>
        <div class="revisa-content-box" id="revisa-content-area">
            <!-- Dynamic Content goes here -->
        </div>
        <div class="revisa-actions">
            <button class="revisa-btn revisa-btn-secondary" id="revisa-copy">Copiar Resposta</button>
            <button class="revisa-btn revisa-btn-primary" id="revisa-apply">Aplicar e Substituir</button>
        </div>
    `;
    containerRoot.appendChild(modalElement);

    // Listeners Modal
    modalElement.querySelector('.revisa-close').addEventListener('click', closeModal);
    modalElement.querySelector('#revisa-apply').addEventListener('click', applySuggestion);
    modalElement.querySelector('#revisa-copy').addEventListener('click', copySuggestion);
    fabElement.addEventListener('click', triggerRevision);

    // Listen to resizes and scrolls to update FAB position
    window.addEventListener('resize', updateFABPosition);
    document.addEventListener('scroll', updateFABPosition, true);

    // Atalhos de teclado
    document.addEventListener('keydown', handleKeyDown, true);
}

function handleKeyDown(e) {
    if (!modalElement) return;

    const isModalOpen = modalElement.classList.contains('open');

    // Esc => fechar modal
    if (e.key === 'Escape' && isModalOpen) {
        closeModal();
        e.preventDefault();
        e.stopPropagation();
        return;
    }

    // Enter => Aplicar e Substituir (quando modal aberto)
    if (e.key === 'Enter' && isModalOpen) {
        const applyBtn = document.getElementById('revisa-apply');
        // Só aplica se o botão estiver visível (ou seja, se a requisição já terminou)
        if (applyBtn && applyBtn.style.display !== 'none') {
            applySuggestion();
        }
        e.preventDefault();
        e.stopPropagation();
        return;
    }

    // Tab => abrir modal de revisão
    // Dispara se o botão FAB estiver visível e o foco for no elemento atual e o modal não estiver aberto
    if (e.key === 'Tab' &&
        fabElement &&
        fabElement.classList.contains('visible') &&
        currentActiveElement === document.activeElement &&
        !isModalOpen) {

        triggerRevision();
        e.preventDefault();
        e.stopPropagation();
        return;
    }
}

function updateFABPosition() {
    if (!fabElement || !currentActiveElement || !fabElement.classList.contains('visible')) return;

    const rect = currentActiveElement.getBoundingClientRect();
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollLeft = window.scrollX || document.documentElement.scrollLeft;

    // Calculating scrollbar sizes and element borders
    const style = getComputedStyle(currentActiveElement);
    const borderRight = parseFloat(style.borderRightWidth) || 0;
    const borderBottom = parseFloat(style.borderBottomWidth) || 0;

    // Positioning the FAB exactly inside the bottom right corner of the active input
    // Taking padding and scrollbars into account so it doesn't overlap them
    const scrollbarWidth = currentActiveElement.offsetWidth - currentActiveElement.clientWidth - borderRight;
    const scrollbarHeight = currentActiveElement.offsetHeight - currentActiveElement.clientHeight - borderBottom;

    const fabWidth = 28;
    const fabHeight = 28;
    const padding = 8; // internal padding distance

    const fabTop = rect.bottom + scrollTop - fabHeight - padding - borderBottom - Math.max(0, scrollbarHeight);
    const fabLeft = rect.right + scrollLeft - fabWidth - padding - borderRight - Math.max(0, scrollbarWidth);

    fabElement.style.top = `${fabTop}px`;
    fabElement.style.left = `${fabLeft}px`;
}

function isValidElement(element) {
    if (!element) return false;

    // Ignore our own inputs if we had any
    if (element.closest('#revisa-ai-root')) return false;

    // Textarea
    if (element.tagName === 'TEXTAREA') return true;

    // Input text-like fields
    if (element.tagName === 'INPUT') {
        const type = element.type.toLowerCase();
        return ['text', 'search', 'email', 'url', 'tel'].includes(type);
    }

    // ContentEditable elements (e.g. Notion, Gmail Composer, Tweets)
    if (element.isContentEditable) return true;

    return false;
}

function getTextFromElement(element) {
    if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
        return element.value;
    } else if (element.isContentEditable) {
        return element.innerText || element.textContent;
    }
    return "";
}

function setTextToElement(element, text) {
    if (!element) return;

    element.focus();

    if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
        const nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;

        if (element.tagName === 'INPUT' && nativeInputValueSetter) {
            nativeInputValueSetter.call(element, text);
        } else if (element.tagName === 'TEXTAREA' && nativeTextAreaValueSetter) {
            nativeTextAreaValueSetter.call(element, text);
        } else {
            element.value = text;
        }

        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));

    } else if (element.isContentEditable) {
        let rootEditable = element;
        while (rootEditable.parentElement && rootEditable.parentElement.isContentEditable) {
            rootEditable = rootEditable.parentElement;
        }

        rootEditable.focus();

        // 1. Simula o usuário selecionando tudo perfeitamente MAS usando a API nativa de Seleção
        // O execCommand('selectAll') falha no Teams pois o modal rouba o foco sutilmente, e o Teams ignora a seleção "mágica".
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(rootEditable);
        selection.removeAllRanges();
        selection.addRange(range);

        // Dispara o selectionchange pra acordar o listener do editor que diz "o texto todo tá azul!"
        document.dispatchEvent(new Event('selectionchange', { bubbles: true }));

        // 2. Cria o objeto "Clipboard" (área de transferência) falso com o texto da IA
        const dataTransfer = new DataTransfer();
        dataTransfer.setData('text/plain', text);
        // Muitos editores preferem extrair do texto HTML primeiro
        dataTransfer.setData('text/html', text.replace(/\n/g, '<br>'));

        // 3. Monta o evento "Paste" idêntico ao de usar Ctrl+V
        const pasteEvent = new ClipboardEvent('paste', {
            clipboardData: dataTransfer,
            bubbles: true,
            cancelable: true,
            composed: true
        });

        // 4. Dispara o 'Paste' no microtique seguinte para garantir que o Teams processou a seleção "Tudo Azul"
        setTimeout(() => {
            const wasCanceled = !rootEditable.dispatchEvent(pasteEvent);

            // 5. Fallback se não for um editor complexo como o MS Teams:
            if (!wasCanceled) {
                document.execCommand('insertText', false, text);
                rootEditable.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
            }

            // Remove a seleção forçada da tela e foca no final
            setTimeout(() => {
                const finalSel = window.getSelection();
                if (finalSel) finalSel.collapseToEnd();
            }, 10);
        }, 10);
    }
}

// Escuta focus para mostrar o botão
document.addEventListener('focusin', (e) => {
    const target = e.target;
    if (isValidElement(target)) {
        currentActiveElement = target;
        const text = getTextFromElement(currentActiveElement);
        // Só mostra se houver algum texto digitado, ou decide mostrar sempre. Vamos mostrar se focado.
        if (text.trim().length > 0) {
            showFAB();
        } else {
            // we attach input listener to show when typing starts
            target.addEventListener('input', handleTyping, { once: false });
        }
    }
});

function handleTyping(e) {
    if (currentActiveElement === e.target) {
        const text = getTextFromElement(currentActiveElement);
        if (text.trim().length > 0) {
            showFAB();
            // remove listener se já mostrou
            e.target.removeEventListener('input', handleTyping);
        } else {
            hideFAB();
        }
    }
}

document.addEventListener('focusout', (e) => {
    // Atraso sutil para permitir o clique no botão
    setTimeout(() => {
        if (!document.activeElement.closest('#revisa-ai-root') &&
            document.activeElement !== document.body &&
            document.activeElement !== currentActiveElement) {
            hideFAB();
            if (document.activeElement.tagName === 'IFRAME') {
                // Can't access it easily, user lose focus
                currentActiveElement = null;
            }
        }
    }, 200);
});

function showFAB() {
    if (!fabElement) return;
    updateFABPosition();
    fabElement.classList.add('visible');
}

function hideFAB() {
    if (!fabElement) return;
    fabElement.classList.remove('visible');
}

function openModal() {
    modalElement.classList.add('open');
}

function closeModal() {
    modalElement.classList.remove('open');
    if (currentActiveElement) currentActiveElement.focus();
}

let latestSuggestion = "";

async function triggerRevision() {
    if (!currentActiveElement || isProcessing) return;

    const originalText = getTextFromElement(currentActiveElement);
    if (!originalText || originalText.trim() === "") return;

    isProcessing = true;
    hideFAB();

    // Configura o modal para loading
    const contentArea = document.getElementById('revisa-content-area');
    document.getElementById('revisa-apply').style.display = 'none';
    document.getElementById('revisa-copy').style.display = 'none';
    contentArea.innerHTML = `
        <div class="revisa-loading">
            <div class="revisa-loader-circle"></div>
            <span>A Inteligência Artificial está analisando o seu texto...</span>
        </div>
        `;
    openModal();

    try {
        // Envia para o background.js
        chrome.runtime.sendMessage({
            action: "revisar",
            text: originalText
        }, (response) => {
            isProcessing = false;
            if (chrome.runtime.lastError || !response || !response.success) {
                const errorMsg = response?.message || chrome.runtime.lastError?.message || "Erro desconhecido.";
                contentArea.innerHTML = `<div class="revisa-error-msg">Falha ao revisar texto:<br />${errorMsg}<br/><br/>Verifique se você configurou sua API Key nas opções clicando na extensão.</div>`;
                return;
            }

            // Exibe o texto revisado
            latestSuggestion = response.suggestion;
            // Para visualização, vamos trocar as quebras de linha por <br>
            contentArea.innerHTML = latestSuggestion.replace(/\n/g, '<br>');

            document.getElementById('revisa-apply').style.display = 'block';
            document.getElementById('revisa-copy').style.display = 'block';
        });
    } catch (e) {
        isProcessing = false;
        contentArea.innerHTML = `<div class="revisa-error-msg">Erro: ${e.message}</div>`;
    }
}

function applySuggestion() {
    if (currentActiveElement && latestSuggestion) {
        setTextToElement(currentActiveElement, latestSuggestion);
        closeModal();
    }
}

function copySuggestion() {
    if (latestSuggestion) {
        navigator.clipboard.writeText(latestSuggestion).then(() => {
            const copyBtn = document.getElementById('revisa-copy');
            const originalText = copyBtn.innerText;
            copyBtn.innerText = "Copiado!";
            setTimeout(() => { copyBtn.innerText = originalText; }, 2000);
        });
    }
}

// Inicializa quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initUI);
} else {
    initUI();
}
