const API_KEY = "your API KEY";  
const API_URL = `your API URL=${API_KEY}`;

const micButton = document.getElementById("mic-button");
let recognition;
let speechSynthesisUtterance;

if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
        micButton.classList.add("listening");
    };

    recognition.onend = () => {
        micButton.classList.remove("listening");
    };

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        document.getElementById("user-input").value = transcript;
        sendMessage();
    };

    micButton.addEventListener("click", () => {
        recognition.start();
    });
} else {
    micButton.disabled = true;
    micButton.title = "Speech Recognition Not Supported";
}

const keywordResponses = {
  "hii": "hii",
  "hello": "Hello",
  "who invented you":"My Developer is Sara Sahithya.",
  "who developed you":"My Developer is Sara Sahithya",
  "how are you": "I'm just a bot, but I'm doing great! Thanks for asking.",
  "who is madhuri mam":"she is a professor at PBR VITS",
  "who is the hod of cse":"Srujan Chandra Reddy sir is the H.O.D of CSE",
  "what is your name": "I'm an AI chatbot powered by Gemini!",
  "bye": "Goodbye! Have a great day!"
};

function isOnlyEmoji(text) {
  const emojiRegex = /^[\p{Emoji}\p{Extended_Pictographic}]+$/u;
  return emojiRegex.test(text);
}

async function translateText(text, targetLang) {
    const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=auto|${targetLang}`);
    const data = await response.json();
    return data.responseData.translatedText;
}

async function sendMessage() {
    let userInput = document.getElementById("user-input").value.trim();
    if (!userInput) return;

    appendMessage("user", userInput);
    document.getElementById("user-input").value = "";

    let translatedInput = await translateText(userInput, "en");

    for (const keyword in keywordResponses) {
        if (translatedInput.toLowerCase().includes(keyword)) {
            let response = keywordResponses[keyword];

            let finalResponse = await translateText(response, "auto");
            appendMessage("bot", finalResponse);
            speak(finalResponse);
            return;
        }
    }

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: translatedInput }] }]
            })
        });

        const data = await response.json();

        if (data && data.candidates && data.candidates.length > 0) {
            let botResponse = data.candidates[0].content.parts[0].text;

            let finalResponse = await translateText(botResponse, "auto");
            appendMessage("bot", finalResponse);
            speak(finalResponse);
        } else {
            appendMessage("bot", "Sorry, I couldn't understand that.");
        }
    } catch (error) {
        appendMessage("bot", "Error fetching response. Please try again.");
    }
}

async function sendImage() {
  const imageInput = document.getElementById("image-input");
  if (!imageInput.files.length) {
      alert("Please select an image first.");
      return;
  }

  const file = imageInput.files[0];
  const reader = new FileReader();

  reader.onloadend = async function () {
      const base64Image = reader.result.split(',')[1];  

      appendMessage("user", "📷 Image Sent");

      try {
          const response = await fetch(API_URL, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                  contents: [{
                      parts: [{ inline_data: { mime_type: file.type, data: base64Image } }]
                  }]
              })
          });

          const data = await response.json();

          if (data && data.candidates && data.candidates.length > 0) {
              const botResponse = data.candidates[0].content.parts[0].text;
              appendMessage("bot", `🖼️ **Image Description:** ${botResponse}`);
              speak(botResponse);
          } else {
              appendMessage("bot", "❌ Sorry, I couldn't analyze the image.");
          }
      } catch (error) {
          appendMessage("bot", "❌ Error processing image. Please try again.");
      }
  };

  reader.readAsDataURL(file);
}

async function sendMessage() {
  const userInput = document.getElementById("user-input").value.toLowerCase();
  if (!userInput) return;

  appendMessage("user", userInput);
  document.getElementById("user-input").value = "";

  let promptText = userInput;

  if (isOnlyEmoji(userInput)) {
    promptText = `Explain the meaning of this emoji: ${userInput}`;
  }

  for (const keyword in keywordResponses) {
      if (userInput.includes(keyword)) {
          const response = keywordResponses[keyword];
          appendMessage("bot", response);
          speak(response);
          return;
      }
  }

  try {
      const response = await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
              contents: [{
                  parts: [{ text: promptText }]
              }]
          })
      });

      const data = await response.json();

      if (data && data.candidates && data.candidates.length > 0) {
          const botResponse = data.candidates[0].content.parts[0].text;
          appendMessage("bot", botResponse);
          speak(botResponse);
      } else {
          appendMessage("bot", "Sorry, I couldn't understand that.");
      }
  } catch (error) {
      appendMessage("bot", "Error fetching response. Please try again.");
  }
}

function appendMessage(sender, message) {
    const chatBox = document.getElementById("chat-box");
    const messageDiv = document.createElement("div");
    
    messageDiv.classList.add(sender);
    
    messageDiv.textContent = message;

    messageDiv.style.marginBottom = "10px";  
    messageDiv.style.padding = "5px";        

    chatBox.appendChild(messageDiv);

    chatBox.scrollTop = chatBox.scrollHeight;
}

function speak(text) {
    stopSpeech(); 

    speechSynthesisUtterance = new SpeechSynthesisUtterance(text);
    speechSynthesisUtterance.lang = "en-US";
    speechSynthesisUtterance.rate = 1;
    speechSynthesisUtterance.pitch = 1;
    window.speechSynthesis.speak(speechSynthesisUtterance);
}

function stopSpeech() {
    if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
    }
}
