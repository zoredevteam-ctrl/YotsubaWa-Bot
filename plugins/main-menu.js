/* 
🌛 Code created by Félix ofc 
Please leave credits  👑
🌟 Github -> https://github.com/FELIX-OFC
*/

import fs from 'fs'
import { join } from 'path'
import fetch from 'node-fetch'

const pad = v => String(v).padStart(2, '0')
const formatClock = ms => {
  if (typeof ms !== 'number' || isNaN(ms)) return '00:00:00'
  const total = Math.floor(ms / 1000)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  return `\( {pad(h)}: \){pad(m)}:${pad(s)}`
}
const formatPing = ms => {
  if (typeof ms !== 'number' || isNaN(ms)) return '0ms'
  if (ms < 1000) return `${ms} ms`
  if (ms < 60_000) return `${(ms / 1000).toFixed(2)} s`
  return `${(ms / 60000).toFixed(2)} m`
}

const readSessionConfig = (conn) => {
  try {
    const botId = conn.user?.jid?.split('@')[0]?.replace(/\D/g, '')
    if (!botId) return {}
    const configPath = join('./JadiBots', botId, 'config.json')
    if (!fs.existsSync(configPath)) return {}
    return JSON.parse(fs.readFileSync(configPath))
  } catch (e) {
    return {}
  }
}

const ensureDB = () => {
  if (!global.db) global.db = { data: { users: {} } }
  if (!global.db.data) global.db.data = { users: {} }
  if (!global.db.data.users) global.db.data.users = {}
}

let handler = async (m, { conn }) => {
  ensureDB()

  // Lectura de config de sesión (JadiBots/<botId>/config.json)
  const cfg = readSessionConfig(conn)
  const nombreBot = 'Yotsuba Nakano' // Nombre fijo como solicitaste
  const currency = cfg.currency || 'Coins'
  const bannerUrl = cfg.banner || 'https://causas-files.vercel.app/fl/w3bo.jpg' // Imagen bonita de Yotsuba Nakano

  // Descargar la imagen para enviarla
  let imageBuffer = null
  try {
    const res = await fetch(bannerUrl)
    if (res.ok) {
      imageBuffer = await res.buffer()
    }
  } catch (e) {
    console.error('Error al descargar la imagen:', e)
  }

  // Uptime
  let uptimeMs = 0
  try {
    if (conn?.uptime) uptimeMs = conn.uptime
    else if (typeof process !== 'undefined' && process.uptime) uptimeMs = Math.floor(process.uptime() * 1000)
    else uptimeMs = 0
  } catch (e) { uptimeMs = 0 }
  const uptime = formatClock(uptimeMs)

  // Ping aproximado (desde timestamp del mensaje)
  let msgTimestamp = 0
  if (m?.messageTimestamp) msgTimestamp = m.messageTimestamp * 1000
  else if (m?.message?.timestamp) msgTimestamp = m.message.timestamp * 1000
  else if (m?.key?.t) msgTimestamp = m.key.t * 1000
  else msgTimestamp = Date.now()
  const p = formatPing(Date.now() - msgTimestamp)

  // Total de usuarios en db
  const totalreg = Object.keys(global.db.data.users).length

  // Username del que invoca
  let username = m.pushName || m.name || m.sender.split('@')[0]
  try { username = await conn.getName(m.sender) || username } catch (e) {}

  // Obtener stats del usuario desde la DB
  const user = global.db.data.users[m.sender] || { money: 0, exp: 0, level: 1 }
  const userMoney = user.money || 0
  const userExp = user.exp || 0
  const userLevel = user.level || 1

  // Rango según si es admin en el grupo (si aplica)
  let rango = 'Súbdito'
  try {
    if (m.isGroup) {
      const meta = await conn.groupMetadata(m.chat)
      const participant = meta.participants.find(p => p.id === m.sender)
      if (participant && (participant.admin || participant.isAdmin)) rango = 'Aprendiz'
    }
  } catch (e) {}

  // Calcular posicion en el top (global o grupo)
  let rankText = 'N/A'
  try {
    let arr = Object.keys(global.db.data.users)
      .map(jid => {
        const u = global.db.data.users[jid] || {}
        return { jid, total: (u.money || 0) + (u.bank || 0) }
      })
      .sort((a, b) => b.total - a.total)
    if (m.isGroup) {
      const meta = await conn.groupMetadata(m.chat)
      const groupJids = meta.participants.map(p => p.id)
      arr = arr.filter(x => groupJids.includes(x.jid))
    }
    const idx = arr.findIndex(x => x.jid === m.sender)
    rankText = idx >= 0 ? String(idx + 1) : 'N/A'
  } catch (e) { rankText = 'N/A' }

  // Construir texto del menú (corregido sin duplicados ni errores de sintaxis)
  let txt = `¡𝐇𝐨𝐥𝐚! Soy *${nombreBot}* ${conn.user.jid == global.conn.user.jid ? '(OficialBot)' : '(Sub-Bot)'}

> ꒰⌢ ʚ˚₊‧ ✎ ꒱ INFO:
- ${nombreBot} es un bot privado, el cual el bot principal no se unirá a tus grupos. Si quieres tener el bot en tu grupo tienes que ser Sub-Bot con *(#code)*
> ꒰⌢ ʚ˚₊‧ ✎ ꒱ ❐ ʚ˚₊‧ʚ˚₊‧ʚ˚

*╭╼𝅄꒰𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ꒱ 𐔌 BOT - INFO 𐦯*
*|✎ Creador:* 𓆩‌۫᷼ ִֶָღܾ݉͢ғ꯭ᴇ꯭፝ℓɪ꯭ͨא𓆪
*|✎ Users:* ${totalreg.toLocaleString()}
*|✎ Uptime:* ${uptime}
*|✎ Ping:* ${p}
*|✎ Baileys:* PixelCrew-Bails
*|✎ Comandos:* https://yotsuba.giize.com/commands
*╰─ׅ─ׅ┈ ─๋︩︪─☪︎︎︎̸⃘̸࣭ٜ࣪࣪࣪۬◌⃘۪֟፝֯۫۫︎⃪𐇽۫۬👑⃘۪֟፝֯۫۫۫۬◌⃘࣭ٜ࣪࣪࣪۬☪︎︎︎︎̸─ׅ─ׅ┈ ─๋︩︪─╯*

*╭╼𝅄꒰𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ꒱ 𐔌 INFO - USER 𐦯*
*|✎ Nombre:* ${username}
*|✎ ${currency}:* ${userMoney}
*|✎ Exp:* ${userExp}
*|✎ Rango:* ${rango}
*|✎ Nivel:* ${userLevel}
*|✎ Top:* ${rankText}
*╰─ׅ─ׅ┈ ─๋︩︪─☪︎︎︎̸⃘̸࣭ٜ࣪࣪࣪۬◌⃘۪֟፝֯۫۫︎⃪𐇽۫۬👑⃘۪֟፝֯۫۫۫۬◌⃘࣭ٜ࣪࣪࣪۬☪︎︎︎︎̸─ׅ─ׅ┈ ─๋︩︪─╯*

*➪ 𝗟𝗜𝗦𝗧𝗔*
       *➪  𝗗𝗘*
           *➪ 𝗖𝗢𝗠𝗔𝗡𝗗𝗢𝗦*

*꒰⌢◌⃘࣭ٜ࣪࣪࣪۬☪︎︎︎︎̸ ✎ ꒱ 𐔌 SISTEMA 𐦯*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #p*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #ping*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #menu*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #help*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #owner*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #menuowner*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #menusockets*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #menugestion*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #menugrupos*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #menurpg*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #menujuegos*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #menunsfw*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #menuemox*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #menudescargas*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #menuherramientas*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #menufreefire*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #menuasistant*
*╰─ׅ─ׅ┈ ─๋︩︪─☪︎︎︎̸⃘̸࣭ٜ࣪࣪࣪۬◌⃘۪֟፝֯۫۫︎⃪𐇽۫۬👑⃘۪֟፝֯۫۫۫۬◌⃘࣭ٜ࣪࣪࣪۬☪︎︎︎︎̸─ׅ─ׅ┈ ─๋︩︪─╯*

*꒰⌢◌⃘࣭ٜ࣪࣪࣪۬☪︎︎︎︎̸ ✎ ꒱ 𐔌 FREE-FIRE 𐦯*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #purgatorio*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #kalafari*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #alpes*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #bermuda*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #formarsala*
*╰─ׅ─ׅ┈ ─๋︩︪─☪︎︎︎̸⃘̸࣭ٜ࣪࣪࣪۬◌⃘۪֟፝֯۫۫︎⃪𐇽۫۬👑⃘۪֟፝֯۫۫۫۬◌⃘࣭ٜ࣪࣪࣪۬☪︎︎︎︎̸─ׅ─ׅ┈ ─๋︩︪─╯*

*꒰⌢◌⃘࣭ٜ࣪࣪࣪۬☪︎︎︎︎̸ ✎ ꒱ 𐔌 HERRAMIENTAS 𐦯*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #pinterest <texto>*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #catbox <imagen>*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #toimg <sticker>*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #pin <texto>*
*╰─ׅ─ׅ┈ ─๋︩︪─☪︎︎︎̸⃘̸࣭ٜ࣪࣪࣪۬◌⃘۪֟፝֯۫۫︎⃪𐇽۫۬👑⃘۪֟፝֯۫۫۫۬◌⃘࣭ٜ࣪࣪࣪۬☪︎︎︎︎̸─ׅ─ׅ┈ ─๋︩︪─╯*

*꒰⌢◌⃘࣭ٜ࣪࣪࣪۬☪︎︎︎︎̸ ✎ ꒱ 𐔌 ASISTANT 𐦯*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #ai*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #bard*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #chatgpt*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #dalle*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #flux*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #gemini*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #ia*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #iavoz*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #luminai*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #openai*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #yotsuba*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #yotsuba-nakano-ia*
*╰─ׅ─ׅ┈ ─๋︩︪─☪︎︎︎̸⃘̸࣭ٜ࣪࣪࣪۬◌⃘۪֟፝֯۫۫︎⃪𐇽۫۬👑⃘۪֟፝֯۫۫۫۬◌⃘࣭ٜ࣪࣪࣪۬☪︎︎︎︎̸─ׅ─ׅ┈ ─๋︩︪─╯*

*꒰⌢◌⃘࣭ٜ࣪࣪࣪۬☪︎︎︎︎̸ ✎ ꒱ 𐔌 DESCARGAS 𐦯*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #apkmod <texto>*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #apk*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #ig <enlace>*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #instagram*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #fb <enlace>*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #facebook*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #tt <enlace>*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #tiktok*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #mf <enlace>*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #mediafire*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #play <musica>*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #yts*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #ytv*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #play2*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #ytm3*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #ytmp4*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #yta*
*╰─ׅ─ׅ┈ ─๋︩︪─☪︎︎︎̸⃘̸࣭ٜ࣪࣪࣪۬◌⃘۪֟፝֯۫۫︎⃪𐇽۫۬👑⃘۪֟፝֯۫۫۫۬◌⃘࣭ٜ࣪࣪࣪۬☪︎︎︎︎̸─ׅ─ׅ┈ ─๋︩︪─╯*

*꒰⌢◌⃘࣭ٜ࣪࣪࣪۬☪︎︎︎︎̸ ✎ ꒱ 𐔌 SOCKETS  𐦯*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #qr*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #code*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #self <on/off>*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #sologp <on/off>*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #logout*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #leave*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #setname <nombre>*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #setbanner <foto>*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #setcurrency <moneda>*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #setmoneda <moneda>*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #set*
*╰─ׅ─ׅ┈ ─๋︩︪─☪︎︎︎̸⃘̸࣭ٜ࣪࣪࣪۬◌⃘۪֟፝֯۫۫︎⃪𐇽۫۬👑⃘۪֟፝֯۫۫۫۬◌⃘࣭ٜ࣪࣪࣪۬☪︎︎︎︎̸─ׅ─ׅ┈ ─๋︩︪─╯*

*꒰⌢◌⃘࣭ٜ࣪࣪࣪۬☪︎︎︎︎̸ ✎ ꒱ 𐔌 NSFW  𐦯*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #sexo*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #69*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #violar*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #r34*
*╰─ׅ─ׅ┈ ─๋︩︪─☪︎︎︎̸⃘̸࣭ٜ࣪࣪࣪۬◌⃘۪֟፝֯۫۫︎⃪𐇽۫۬👑⃘۪֟፝֯۫۫۫۬◌⃘࣭ٜ࣪࣪࣪۬☪︎︎︎︎̸─ׅ─ׅ┈ ─๋︩︪─╯*

*꒰⌢◌⃘࣭ٜ࣪࣪࣪۬☪︎︎︎︎̸ ✎ ꒱ 𐔌 JUEGOS  𐦯*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #formarpareja5*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #formarpareja*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #top*
*╰─ׅ─ׅ┈ ─๋︩︪─☪︎︎︎̸⃘̸࣭ٜ࣪࣪࣪۬◌⃘۪֟፝֯۫۫︎⃪𐇽۫۬👑⃘۪֟፝֯۫۫۫۬◌⃘࣭ٜ࣪࣪࣪۬☪︎︎︎︎̸─ׅ─ׅ┈ ─๋︩︪─╯*

*꒰⌢◌⃘࣭ٜ࣪࣪࣪۬☪︎︎︎︎̸ ✎ ꒱ 𐔌 EMOX  𐦯*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #bailar*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #dance*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #lamer*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #lamber*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #feliz*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #happy*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #triste*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #borracho*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #drunk*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #kill*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #matar*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #kiss*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #besar*
*╰─ׅ─ׅ┈ ─๋︩︪─☪︎︎︎̸⃘̸࣭ٜ࣪࣪࣪۬◌⃘۪֟፝֯۫۫︎⃪𐇽۫۬👑⃘۪֟፝֯۫۫۫۬◌⃘࣭ٜ࣪࣪࣪۬☪︎︎︎︎̸─ׅ─ׅ┈ ─๋︩︪─╯*

*꒰⌢◌⃘࣭ٜ࣪࣪࣪۬☪︎︎︎︎̸ ✎ ꒱ 𐔌 STICKERS  𐦯*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #s*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #sticker*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #brat*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #qc*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #emojimix*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #take*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #wm*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #bratv*
*╰─ׅ─ׅ┈ ─๋︩︪─☪︎︎︎̸⃘̸࣭ٜ࣪࣪࣪۬◌⃘۪֟፝֯۫۫︎⃪𐇽۫۬👑⃘۪֟፝֯۫۫۫۬◌⃘࣭ٜ࣪࣪࣪۬☪︎︎︎︎̸─ׅ─ׅ┈ ─๋︩︪─╯*

*꒰⌢◌⃘࣭ٜ࣪࣪࣪۬☪︎︎︎︎̸ ✎ ꒱ 𐔌 RPG  𐦯*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #daily*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #cofre*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #minar*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #rob*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #rob2*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #depositar <all>*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #d <all>*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #lvl*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #bal*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #baltop*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #w*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #trabajar*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #work*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #chambear*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #chamba*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #slut*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #prostituirse*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #perfil*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #profile*
*╰─ׅ─ׅ┈ ─๋︩︪─☪︎︎︎̸⃘̸࣭ٜ࣪࣪࣪۬◌⃘۪֟፝֯۫۫︎⃪𐇽۫۬👑⃘۪֟፝֯۫۫۫۬◌⃘࣭ٜ࣪࣪࣪۬☪︎︎︎︎̸─ׅ─ׅ┈ ─๋︩︪─╯*

*꒰⌢◌⃘࣭ٜ࣪࣪࣪۬☪︎︎︎︎̸ ✎ ꒱ 𐔌 GESTIÓN 𐦯*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #testwelcome*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #testbye*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #bye <on/off>*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #welcome <on/off>*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #antienlace <on/off>*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #antilink <on/off>*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #modoadmin <on/off>* 
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #detect <on/off>* 
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #open*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #close*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #abrir*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #cerrar*
*╰─ׅ─ׅ┈ ─๋︩︪─☪︎︎︎̸⃘̸࣭ٜ࣪࣪࣪۬◌⃘۪֟፝֯۫۫︎⃪𐇽۫۬👑⃘۪֟፝֯۫۫۫۬◌⃘࣭ٜ࣪࣪࣪۬☪︎︎︎︎̸─ׅ─ׅ┈ ─๋︩︪─╯*

*꒰⌢◌⃘࣭ٜ࣪࣪࣪۬☪︎︎︎︎̸ ✎ ꒱ 𐔌 GRUPOS 𐦯*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #demote*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #promote*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #delete*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #kick*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #del*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #promover*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #degradar*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #delprimary*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #setprimary*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #tagall*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #invocar*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #todos*
*╰─ׅ─ׅ┈ ─๋︩︪─☪︎︎︎̸⃘̸࣭ٜ࣪࣪࣪۬◌⃘۪֟፝֯۫۫︎⃪𐇽۫۬👑⃘۪֟፝֯۫۫۫۬◌⃘࣭ٜ࣪࣪࣪۬☪︎︎︎︎̸─ׅ─ׅ┈ ─๋︩︪─╯*

*꒰⌢◌⃘࣭ٜ࣪࣪࣪۬☪︎︎︎︎̸ ✎ ꒱ 𐔌 OWNER  𐦯*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #autoadmin*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #join*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #update*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #spamwa*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #prefix*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #rprefix*
*╰─ׅ─ׅ┈ ─๋︩︪─☪︎︎︎̸⃘̸࣭ٜ࣪࣪࣪۬◌⃘۪֟፝֯۫۫︎⃪𐇽۫۬👑⃘۪֟፝֯۫۫۫۬◌⃘࣭ٜ࣪࣪࣪۬☪︎︎︎︎̸─ׅ─ׅ┈ ─๋︩︪─╯*

> ${global.textbot || ''}
`.trim()

  // Menciones: mencionar al usuario que abrió el menú
  const mentions = [m.sender]

  // Enviar el menú como imagen con caption (si la imagen se descargó)
  if (imageBuffer) {
    await conn.sendMessage(m.chat, {
      image: imageBuffer,
      caption: txt,
      mentions: mentions,
      contextInfo: {
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: global.ch?.ch1 || '',
          serverMessageId: '',
          newsletterName: nombreBot
        },
        externalAdReply: {
          title: nombreBot,
          body: global.textbot || '',
          mediaType: 1,
          mediaUrl: global.channel || '',
          sourceUrl: global.channel || '',
          showAdAttribution: false,
          containsAutoReply: true,
          renderLargerThumbnail: false // Desactivamos thumbnail grande para evitar cualquier duplicado
        }
      }
    }, { quoted: m })
  } else {
    // Fallback si no se pudo descargar la imagen: enviar solo texto
    await conn.sendMessage(m.chat, {
      text: txt,
      mentions: mentions,
      contextInfo: {
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: global.ch?.ch1 || '',
          serverMessageId: '',
          newsletterName: nombreBot
        },
        externalAdReply: {
          title: nombreBot,
          body: global.textbot || '',
          mediaType: 1,
          mediaUrl: global.channel || '',
          sourceUrl: global.channel || '',
          showAdAttribution: false,
          containsAutoReply: true,
          renderLargerThumbnail: false // Desactivamos thumbnail grande para evitar cualquier duplicado
        }
      }
    }, { quoted: m })
  }
}

handler.help = ['menu']
handler.tags = ['main']
handler.command = ['menu', 'menú', 'help']

export default handler