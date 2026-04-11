const { Ollama } = require("ollama");

const ollama = new Ollama({ host: "http://127.0.0.1:11434" });

const BotChatAPI = async (req, res) => {
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  try {
    // Sending the request to the Ollama API
    const response = await ollama.chat({
      model: "gemma2:27b",
      messages: [{ role: "user", content: message }],
    });

    res.status(200).json(response);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      error: "Something went wrong with Ollama API",
      details: error.message,
    });
  }
};

module.exports = { BotChatAPI };
