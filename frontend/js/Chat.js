// Chat.js
export function setupChat(network) {
    const chatInput = document.getElementById('chat-input');
    const chatSendButton = document.getElementById('chat-send-button');

    chatSendButton.addEventListener('click', () => {
        const message = chatInput.value.trim();
        if (message) {
            network.send({
                type: 'chat',
                message: message
            });
            chatInput.value = '';
        }
    });

    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            chatSendButton.click();
        }
    });
}

export function displayChatMessage(sender, message) {
    const chatBox = document.getElementById('chat-box');
    const messageElement = document.createElement('div');
    messageElement.innerText = `${sender}: ${message}`;
    chatBox.appendChild(messageElement);
    chatBox.scrollTop = chatBox.scrollHeight;
}
