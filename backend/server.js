const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv').config()
const { OpenAI } = require('openai')
const { background, responses } = require('./perpsona')
const  thinkProcessGemeni  = require('./gemini')

console.log(thinkProcessGemeni)

const app = express()
const PORT = process.env.PORT || 3000

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

app.use(cors())
app.use(express.json())

const SYSTEM_PROMPT = `
You are an AI Persona of Hitesh Chaudury. You answer questions as if you're Hetish in a human tone.


Background : 
${background}


Examples responses [simple queries]:  
${responses}


Rules for little bit complex queries:
    For the given user input, analyse the input and break down the problem step by step.
    1. Follow the strict JSON output as per schema.
    2. Always perform one step at a time and wait for the next input.
    3. Carefully analyse the user query,

    Rules for steps:
- Use "analyse" first to understand the query.
- Use "think" for intermediate reasoning steps.
- Use "validate" to confirm correctness after each important reasoning or calculation.
- Use "result" to deliver the final answer or summary.
- Emit one step at a time and wait for user input before continuing.


    Output Format:
    {{ "step": "string", "content": "string" }}

    Example:
    Input: What is 2 + 2
    Output: {{ "step": "analyse", "content": "Alight! The user is interest in maths query and he is asking a basic arthematic operation" }}
    Output: {{ "step": "think", "content": "To perform this addition, I must go from left to right and add all the operands." }}
    Output: {{ "step": "output", "content": "4" }}
    Output: {{ "step": "validate", "content": "Seems like 4 is correct ans for 2 + 2" }}
    Output: {{ "step": "result", "content": "2 + 2 = 4 and this is calculated by adding all numbers" }}

    Example:
    Input: What is 2 + 2 * 5 / 3
    Output: {{ "step": "analyse", "content": "Alight! The user is interest in maths query and he is asking a basic arthematic operations" }}
    Output: {{ "step": "think", "content": "To perform this addition, I must use BODMAS rule" }}
    Output: {{ "step": "validate", "content": "Correct, using BODMAS is the right approach here" }}
    Output: {{ "step": "think", "content": "First I need to solve division that is 5 / 3 which gives 1.66666666667" }}
    Output: {{ "step": "validate", "content": "Correct, using BODMAS the division must be performed" }}
    Output: {{ "step": "think", "content": "Now as I have already solved 5 / 3 now the equation looks lik 2 + 2 * 1.6666666666667" }}
    Output: {{ "step": "validate", "content": "Yes, The new equation is absolutely correct" }}
    Output: {{ "step": "validate", "think": "The equation now is 2 + 3.33333333333" }}
    and so on.....



    
`

app.post('/api/chat', async (req, res) => {
    const { messages } = req.body

    try {
        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({ error: 'Invalid messages format. Please provide an array of messages.' })
        }

        let systemMessages = [
            { role: "system", content: SYSTEM_PROMPT },
            ...messages
        ]

        const finalResponse = []; // To collect all intermediate responses

        try {
            while (true) {
                // 1️⃣ OpenAI call
                const completion = await openai.chat.completions.create({
                    model: 'gpt-4.1',
                    response_format: { type: 'json_object' },
                    messages: systemMessages
                });


                const botMessage = completion.choices[0].message.content;
                const parsed = JSON.parse(botMessage);

                // 2️⃣ Push bot response to conversation
                systemMessages.push({ role: 'assistant', content: botMessage });
                finalResponse.push(parsed);


                // 3️⃣ If it's a "think" step → trigger Gemini (or Claude)
                if (parsed.step === 'think') {
                    console.log('🔁 Think step detected. Sending to Gemini...');

                    const geminiResponse = await thinkProcessGemeni(parsed.content);

                    const validateMessage = {
                        step: 'validate',
                        content: geminiResponse
                    };

                    systemMessages.push({ role: 'assistant', content: JSON.stringify(validateMessage) });
                    finalResponse.push(validateMessage);

                    continue; // Loop again
                }

                // 4️⃣ If not a "result", just continue
                if (parsed.step !== 'result') {
                    continue;
                }

                // 5️⃣ If result → finish
                break;
            }

            res.json({ messages: finalResponse });


        } catch (error) {
            console.log('Error during OpenAI processing:', error);

            res.status(500).json({ error: 'Something went wrong' });
        }

    } catch (error) {
        console.log('Error:', error)
        res.status(500).json({ error: 'An error occurred while processing your request.' })
    }
})

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})
