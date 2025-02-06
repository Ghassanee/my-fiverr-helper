document.getElementById('generateResponse').addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { action: 'getLastMessage' }, (response) => {
      console.log('Received response:', response);
      if (response && response.lastMessage) {
        chrome.runtime.sendMessage(
          { action: 'generateResponse', message: response.lastMessage },
          (aiResponse) => {
            if (aiResponse && aiResponse.responseText) {
              chrome.tabs.sendMessage(tabs[0].id, {
                action: 'populateResponse',
                responseText: aiResponse.responseText,
              });
            }
          }
        );
      }
    });
  });
});
