import { watchFile, unwatchFile } from 'fs';
import chalk from 'chalk';
import { fileURLToPath } from 'url';
import fs from 'fs';

const file = fileURLToPath(import.meta.url);
watchFile(file, () => {
  unwatchFile(file);
  console.log(chalk.greenBright("✅ Archivo 'settings.js' actualizado y recargado automáticamente."));
  import(`\( {file}?update= \){Date.now()}`);
});

// Enlaces y canales
global.group = 'https://chat.whatsapp.com/Ht5ck9c1Eji2TRBXSkTHjY';
global.community = 'https://whatsapp.com/channel/0029VbBkjlfLSmbWl3SH6737';
global.channel = 'https://whatsapp.com/channel/0029VbBkjlfLSmbWl3SH6737';
global.github = 'https://github.com/tu-usuario/tu-repositorio'; // Actualiza con tu GitHub real
global.gmail = 'tu-email@gmail.com'; // Actualiza con tu email real

// Canales de newsletter
global.ch = {
  ch1: '120363404822730259@newsletter',
};

// APIs disponibles (con URLs y keys si es necesario)
global.APIs = {
  xyro: { url: 'https://xyro.site', key: null },
  yupra: { url: 'https://api.yupra.my.id', key: null },
  vreden: { url: 'https://api.vreden.web.id', key: null },
  delirius: { url: 'https://api.delirius.store', key: null },
  zenzxz: { url: 'https://api.zenzxz.my.id', key: null },
  siputzx: { url: 'https://api.siputzx.my.id', key: null },
};

// Dueños del bot (números de teléfono como strings en array)
global.owner = [
  '573107400303',
  '18094374392',
  '18293527611',
  '5355699866'
];

// Nombres y textos personalizados
global.botname = 'Yotsuba Nakano';
global.textbot = '𝓓𝓮𝓿𝓮𝓵𝓸𝓹𝓮𝓭 𝓫𝔂 𝗗𝙚𝙮𝙢𝙤𝙤𝙣𝗢𝙛𝙘 ❤️';
global.dev = 'Made With ❤️ by 𝗗𝙚𝙮𝙢𝙤𝙤𝙣 𝗢𝙛𝙘';
global.author = 'Made With ❤️ by 𝗗𝙚𝙮𝙢𝙤𝙤𝙣 𝗢𝙛𝙘';
global.etiqueta = '✰ 𝐃𝐞𝐬𝐜𝐨𝐧𝐨𝐬𝐢𝐝𝐨 𝐗𝐳𝐬𝐲 (•̀ᴗ•́)و';
global.currency = 'Estrellas';
global.emoji = '👑';

// Etiquetas y usuarios premium
global.suittag = ['18293527611']; // Reemplaza el placeholder con números reales
global.prems = []; // Array vacío para usuarios premium (agrega según necesites)

// Assets y configuraciones visuales
global.banner = 'https://causas-files.vercel.app/fl/wjir.jpg';
global.icono = 'https://causas-files.vercel.app/fl/wjir.jpg';
global.catalogo = null;

// Otras configuraciones
global.libreria = 'Baileys Multi Device';
global.vs = '^1.8.2|Latest';
global.nameqr = '✯ Yotsuba Nakano ✰';
global.sessions = 'Session';
global.jadi = 'JadiBots';
global.yukiJadibts = true; // Asumiendo que es 'yukiJadibots', corrígelo si es un typo