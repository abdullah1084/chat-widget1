// Chat Widget Script
(function() {
    // Check if already initialized
    if (window.N8NChatWidgetInitialized) return;
    window.N8NChatWidgetInitialized = true;

    const widget = document.querySelector('.n8n-chat-widget');
    const chatContainer = widget.querySelector('.chat-container');
    const chatInterface = widget.querySelector('.chat-interface');
    const newConversation = widget.querySelector('.new-conversation');
    const toggleButton = widget.querySelector('.chat-toggle');
    const closeButtons = widget.querySelectorAll('.close-button');
    const newChatBtn = widget.querySelector('.new-chat-btn');
    const textarea = widget.querySelector('textarea');
    const sendButton = widget.querySelector('button[type="submit"]');
    const messagesContainer = widget.querySelector('.chat-messages');

    let currentSessionId = '';

    function generateUUID() {
        return crypto.randomUUID();
    }

    function toggleWidget() {
        chatContainer.classList.toggle('open');
    }

    function resetConversationView() {
        chatInterface.classList.remove('active');
        newConversation.style.display = 'block';
    }

    function openChatInterface() {
        newConversation.style.display = 'none';
        chatInterface.classList.add('active');
        textarea.focus();
    }

    function appendMessage(role, content) {
        const message = document.createElement('div');
        message.className = `chat-message ${role}`;
        message.textContent = content;
        messagesContainer.appendChild(message);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    async function sendMessage(content) {
        if (!content.trim()) return;

        appendMessage('user', content);
        textarea.value = '';

        try {
            const response = await fetch(window.ChatWidgetConfig.webhook.url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'userInput',
                    sessionId: currentSessionId,
                    message: content,
                    route: window.ChatWidgetConfig.webhook.route
                })
            });

            const data = await response.json();
            if (Array.isArray(data)) {
                data.forEach(res => {
                    if (res.message) {
                        appendMessage('bot', res.message);
                    }
                });
            }
        } catch (error) {
            appendMessage('bot', 'Oops! Something went wrong.');
        }
    }

    // Event Listeners
    toggleButton.addEventListener('click', toggleWidget);
    closeButtons.forEach(btn => btn.addEventListener('click', toggleWidget));
    newChatBtn.addEventListener('click', () => {
        openChatInterface();
        currentSessionId = generateUUID();

        // Optionally inform backend of new session
        fetch(window.ChatWidgetConfig.webhook.url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'startSession',
                sessionId: currentSessionId,
                route: window.ChatWidgetConfig.webhook.route,
                metadata: { userId: '' }
            })
        });
    });

    sendButton.addEventListener('click', () => sendMessage(textarea.value));
    textarea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage(textarea.value);
        }
    });
})();
