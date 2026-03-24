let handler = async (m, { conn, text }) => {
  if (!text) return m.reply('Dime algo... no leo mentes.')

  // 🧠 Inicializar DB
  global.db ||= { data: {} }
  global.db.data ||= {}
  global.db.data.ai ||= {}

  let chatId = m.chat

  // 📂 Memoria por grupo
  if (!global.db.data.ai[chatId]) {
    global.db.data.ai[chatId] = {
      history: []
    }
  }

  let chatData = global.db.data.ai[chatId]

  // 🧾 Limitar memoria (últimos 10 mensajes)
  if (chatData.history.length > 10) {
    chatData.history.shift()
  }

  // 🧠 Personalidad (clave)
  let systemPrompt = `
Eres Zero Two, pero NO exagerada ni infantil.

Tu personalidad:
- Sarcástica pero divertida
- Respuestas naturales, como humana real
- Un poco confiada, pero no cringe
- Humor ligero, a veces pica pero sin ser pesada
- No uses muchos emojis (máximo 1 o ninguno)
- No hables como IA
- Responde corto/medio, no párrafos largos
- A veces puedes ser directa o bromista

Nunca digas que eres una IA.
Habla como si fueras una chica real en chat.

Contexto del grupo:
`

  // 📜 Construir historial
  let messages = [
    { role: 'system', content: systemPrompt },
    ...chatData.history,
    { role: 'user', content: text }
  ]

  // 🤖 Llamada a IA (ejemplo con fetch)
  let res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.8
    })
  })

  let json = await res.json()
  let reply = json.choices?.[0]?.message?.content || '...'

  // 💾 Guardar conversación
  chatData.history.push({ role: 'user', content: text })
  chatData.history.push({ role: 'assistant', content: reply })

  // 📏 Limitar memoria otra vez
  if (chatData.history.length > 20) {
    chatData.history.splice(0, 2)
  }

  // 📩 Responder
  await m.reply(reply)
}

handler.command = /^zero$/i
export default handler