process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '1'

// IMPORTS
import './settings.js'
import './plugins/_allfake.js'
import cfonts from 'cfonts'
import { createRequire } from 'module'
import { fileURLToPath, pathToFileURL } from 'url'
import { platform } from 'process'
import * as ws from 'ws'
import fs, { readdirSync, statSync, unlinkSync, existsSync, mkdirSync, readFileSync, watch } from 'fs'
import yargs from 'yargs'
import { spawn } from 'child_process'
import lodash from 'lodash'
import { yukiJadiBot } from './plugins/sockets-serbot.js'
import chalk from 'chalk'
import syntaxerror from 'syntax-error'
import pino from 'pino'
import path, { join } from 'path'
import { Boom } from '@hapi/boom'
import { makeWASocket, protoType, serialize } from './lib/simple.js'
import { Low, JSONFile } from 'lowdb'
import store from './lib/store.js'
import os from 'os'
import readline from 'readline'
import NodeCache from 'node-cache'

const { proto } = (await import('@whiskeysockets/baileys')).default
import pkg from 'google-libphonenumber'
const { PhoneNumberUtil } = pkg
const phoneUtil = PhoneNumberUtil.getInstance()

const { DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, jidNormalizedUser } = await import('@whiskeysockets/baileys')

// GLOBAL FIXES
global.sessions = 'sessions'
global.jadi = 'jadibot'
global.botname = 'Z0RT'
global.packname = 'Z0RT l Systems'
global.author = 'Z0RT l Systems'

// INIT
const { say } = cfonts
console.log(chalk.magentaBright('\nIniciando proyecto...'))

say('Z0RT SYSTEMS', {
  font: 'block',
  align: 'center',
  gradient: ['cyan', 'magenta']
})

protoType()
serialize()

global.__filename = function (pathURL = import.meta.url, rmPrefix = platform !== 'win32') {
  return rmPrefix ? (/file:\/\/\//.test(pathURL) ? fileURLToPath(pathURL) : pathURL) : pathToFileURL(pathURL).toString()
}
global.__dirname = function (pathURL) {
  return path.dirname(global.__filename(pathURL, true))
}
global.__require = function (dir = import.meta.url) {
  return createRequire(dir)
}

global.timestamp = { start: new Date }
const __dirname = global.__dirname(import.meta.url)

global.opts = yargs(process.argv.slice(2)).exitProcess(false).parse()
global.prefix = /^[#!./-]/

// DATABASE
global.db = new Low(new JSONFile('database.json'))
global.DATABASE = global.db

global.loadDatabase = async function () {
  await global.db.read().catch(console.error)
  global.db.data = {
    users: {},
    chats: {},
    settings: {},
    ...(global.db.data || {}),
  }
}
await loadDatabase()

// BAILEYS
const { state, saveCreds } = await useMultiFileAuthState(global.sessions)
const { version } = await fetchLatestBaileysVersion()

const connectionOptions = {
  logger: pino({ level: 'silent' }),
  printQRInTerminal: true,
  browser: ["Ubuntu", "Chrome", "20.0.04"],
  auth: {
    creds: state.creds,
    keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }))
  }
}

global.conn = makeWASocket(connectionOptions)
conn.ev.on("creds.update", saveCreds)

// CONEXIÓN
conn.ev.on("connection.update", async (update) => {
  const { connection, lastDisconnect } = update

  if (connection === "open") {
    console.log(chalk.green(`✔ Conectado como ${conn.user.id}`))
  }

  if (connection === "close") {
    let reason = new Boom(lastDisconnect?.error)?.output?.statusCode
    console.log(chalk.red(`❌ Desconectado (${reason})`))
  }
})

// TMP CLEANER
setInterval(() => {
  const tmpDir = join(__dirname, 'tmp')
  if (existsSync(tmpDir)) {
    for (const file of readdirSync(tmpDir)) {
      unlinkSync(join(tmpDir, file))
    }
    console.log(chalk.gray("→ TMP limpiado"))
  }
}, 30000)

// VALIDAR NÚMERO
async function isValidPhoneNumber(number) {
  try {
    number = number.replace(/\s+/g, '')
    const parsed = phoneUtil.parseAndKeepRawInput(number)
    return phoneUtil.isValidNumber(parsed)
  } catch {
    return false
  }
}