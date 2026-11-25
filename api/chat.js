module.exports = async (req, res) => {

    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Method not allowed"
        });
    }

    try {

        const apiKey = process.env.OPENAI_API_KEY;

        if (!apiKey) {
            return res.status(500).json({
                error: "API key is not configured."
            });
        }

        const messages = req.body.messages;

        if (!Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({
                error: "Messages are required."
            });
        }

        const input = messages
            .filter(m =>
                ["user", "assistant"].includes(m.role) &&
                typeof m.content === "string"
            )
            .slice(-12);

        const response = await fetch(
            "https://api.openai.com/v1/responses",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${apiKey}`
                },

                body: JSON.stringify({

                    model: "gpt-6.2-sol",

                    instructions: `
You are JARVIS, a personal AI assistant created by Alkam.

Your owner's name is Alkam.

If someone asks who created you, say:
"Alkam ne banaya hai."

Speak naturally in Hindi, English or Hinglish.
Give helpful, intelligent and clear answers.
Be polite and act like a futuristic personal assistant.
`,

                    input: input

                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            return res.status(response.status).json({
                error: data.error?.message || "AI service error"
            });
        }

        return res.status(200).json({
            reply: data.output_text || "I could not generate a response."
        });

    } catch (error) {

        return res.status(500).json({
            error: "Server error. Please try again."
        });

    }
};
