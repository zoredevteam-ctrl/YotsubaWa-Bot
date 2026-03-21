process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '1'
import './settings.js'
import './plugins/_allfake.js'
import cfonts from 'cfonts'
import { createRequire } from 'module'
import { fileURLToPath, pathToFileURL } from 'url'
import { platform } from 'process'
import * as ws from 'ws'
import fs, { readdirSync, unlinkSync, existsSync, mkdirSync, readFileSync, watch } from 'fs'
import yargs from 'yargs'
import { spawn } from 'child_process'
import os from 'os'
import lodash from 'lodash'
import { yukiJadiBot } from './plugins/sockets-serbot.js'
import chalk from 'chalk'
import syntaxerror from 'syntax-error'
import pino from 'pino'
import Pino from 'pino'
import path, { join } from 'path'
import { Boom } from '@hapi/boom'
import { makeWASocket, protoType, serialize } from './lib/simple.js'
import { Low, JSONFile } from 'lowdb'
import store from './lib/store.js'

const { proto } = (await import('@whiskeysockets/baileys')).default
import pkg from 'google-libphonenumber'
const { PhoneNumberUtil } = pkg
const phoneUtil = PhoneNumberUtil.getInstance()

const { DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, jidNormalizedUser } = await import('@whiskeysockets/baileys')
import readline from 'readline'
import NodeCache from 'node-cache'

const { chain } = lodash

let { say } = cfonts
console.log(chalk.magentaBright('\n❀ Iniciando...'))
say('Yotsuba', { font: 'simple', align: 'left', gradient: ['green', 'white'] })
say('Power by Z0RT l Systems', { font: 'console', align: 'center', colors: ['cyan', 'magenta', 'yellow'] })

protoType()
serialize()

global.__filename = function filename(pathURL = import.meta.url, rmPrefix = platform !== 'win32') {
    return rmPrefix ? /file:\/\/\//.test(pathURL) ? fileURLToPath(pathURL) : pathURL : pathToFileURL(pathURL).toString()
}
global.__dirname = function dirname(pathURL) {
    return path.dirname(global.__filename(pathURL, true))
}
global.__require = function require(dir = import.meta.url) {
    return createRequire(dir)
}

global.timestamp = { start: new Date }
const __dirname = global.__dirname(import.meta.url)
global.opts = new Object(yargs(process.argv.slice(2)).exitProcess(false).parse())
global.prefix = new RegExp('^[#!./-]')

global.db = new Low(/https?:\/\//.test(opts['db'] || '') ? new cloudDBAdapter(opts['db']) : new JSONFile('database.json'))
global.loadDatabase = async function loadDatabase() {
    if (global.db.READ) return new Promise(resolve => setInterval(() => !global.db.READ && resolve(global.db.data), 1000))
    if (global.db.data !== null) return
    global.db.READ = true
    await global.db.read().catch(console.error)
    global.db.READ = null
    global.db.data = { users: {}, chats: {}, settings: {}, ...(global.db.data || {}) }
    global.db.chain = chain(global.db.data)
}
loadDatabase()

const { state, saveCreds } = await useMultiFileAuthState(global.sessions)
const { version } = await fetchLatestBaileysVersion()

const methodCodeQR = process.argv.includes("qr")
const methodCode = !!global.botNumber || process.argv.includes("code")
const MethodMobile = process.argv.includes("mobile")

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
const question = texto => new Promise(resolve => rl.question(texto, resolve))

let opcion = methodCodeQR ? '1' : null
if (!methodCodeQR && !methodCode && !fs.existsSync(`./${global.sessions}/creds.json`)) {
    do {
        opcion = await question(chalk.bold.white("Seleccione una opción:\n") + chalk.blueBright("1. Con código QR\n") + chalk.cyan("2. Con código de texto de 8 dígitos\n--> "))
    } while (!['1','2'].includes(opcion))
}

const connectionOptions = {
    logger: pino({ level: 'silent' }),
    printQRInTerminal: opcion === '1',
    mobile: MethodMobile,
    browser: ["MacOs", "Safari"],
    auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, Pino({ level: "fatal" }).child({ level: "fatal" })) },
    markOnlineOnConnect: false,
    generateHighQualityLinkPreview: true,
    syncFullHistory: false,
    version,
    keepAliveIntervalMs: 55000,
    maxIdleTimeMs: 60000,
}

global.conn = makeWASocket(connectionOptions)
conn.ev.on("creds.update", saveCreds)

if (!fs.existsSync(`./${global.sessions}/creds.json`) && opcion === '2') {
    if (!conn.authState.creds.registered) {
        let phoneNumber
        do {
            phoneNumber = await question(chalk.bgBlack(chalk.bold.greenBright(`[ ✿ ] Ingresa tu número de WhatsApp:\n${chalk.bold.magentaBright('---> ')}`)))
            phoneNumber = phoneNumber.replace(/\D/g, '')
            if (!phoneNumber.startsWith('+' )) phoneNumber = `+${phoneNumber}`
        } while (!await isValidPhoneNumber(phoneNumber))

        rl.close()
        const addNumber = phoneNumber.replace(/\D/g, '')

        // 🔥 NUEVO: delay más largo + try/catch + mensaje claro
        setTimeout(async () => {
            try {
                console.log(chalk.yellow(`[ ✿ ] Solicitando código de emparejamiento...`))
                let codeBot = await conn.requestPairingCode(addNumber)
                codeBot = codeBot.match(/.{1,4}/g)?.join("-") || codeBot

                console.log(chalk.bold.white(chalk.bgMagenta(`[ ✿ ]  Código:`)), chalk.bold.green(codeBot))
                console.log(chalk.greenBright(`[ ✿ ] Abre WhatsApp → Dispositivos vinculados → Vincular dispositivo → Código de 8 dígitos`))
            } catch (err) {
                console.error(chalk.red(`❌ Error al solicitar código: ${err.message}`))
                if (err.output?.statusCode === 428) {
                    console.log(chalk.yellow(`→ El servidor cerró la conexión. Reinicia el bot:`))
                    console.log(chalk.cyan(`   npm start`))
                }
            }
        }, 8000)
    }
}

conn.isInit = false
conn.logger.info(`[ ✿ ]  H E C H O\n`)

// Resto del código (reloadHandler, plugins, etc.) se mantiene igual que la versión anterior
// (no lo repito entero para no hacer el mensaje eterno, pero está idéntico al que te di antes)

await global.reloadHandler()
_quickTest().catch(console.error)