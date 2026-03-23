import fetch from "node-fetch";
import yts from 'yt-search';

const API_KEY = 'Duarte-zz12'; // deja como está si es tu key

async function getAudioFromApis(url) {
  const apis = [
    { api: 'AlyaBot Play', endpoint: `https://rest.alyabotpe.xyz/dl/youtubeplay?query=${encodeURIComponent(url)}&key=${API_KEY}`, extractor: res => res?.status ? (res.data?.download || res.data?.dl || res.data?.url) : null },
    { api: 'AlyaBot v2', endpoint: `https://rest.alyabotpe.xyz/dl/ytmp3?url=${encodeURIComponent(url)}&key=${API_KEY}`, extractor: res => res?.status ? (res.data?.dl || res.data?.url || res.data?.download) : null }
  ];

  for (const api of apis) {
    try {
      console.log(`🔄 Intentando API: ${api.api}`);
      const response = await fetch(api.endpoint);
      const data = await response.json();
      console.log(`📊 Respuesta de API (${api.api}):`, JSON.stringify(data, null, 2));
      const downloadUrl = api.extractor(data);
      if (downloadUrl && String(downloadUrl).startsWith('http')) {
        console.log(`✅ API exitosa: ${api.api}, URL: ${downloadUrl}`);
        return downloadUrl;
      } else {
        console.log(`❌ No se encontró URL válida en ${api.api}`);
      }
    } catch (error) {
      console.log(`❌ API ${api.api} falló:`, error?.message || error);
    }
  }
  throw new Error('No se pudo obtener el enlace de descarga de ninguna API de audio');
}

async function getVideoFromApis(url) {
  const apis = [
    { api: 'AlyaBot Video', endpoint: `https://rest.alyabotpe.xyz/dl/ytmp4?url=${encodeURIComponent(url)}&key=${API_KEY}`, extractor: res => res?.status ? (res.data?.dl || res.data?.url || res.data?.download) : null },
    { api: 'API Causas', endpoint: `https://api-causas.duckdns.org/api/v1/descargas/youtube?url=${encodeURIComponent(url)}&type=video&apikey=causa-adc2c572476abdd8`, extractor: res => res?.status ? (res.data?.download?.url || res.data?.download) : null }
  ];

  for (const api of apis) {
    try {
      console.log(`🔄 Intentando API: ${api.api}`);
      const response = await fetch(api.endpoint);
      const data = await response.json();
      console.log(`📊 Respuesta de API (${api.api}):`, JSON.stringify(data, null, 2));
      const downloadUrl = api.extractor(data);
      if (downloadUrl && String(downloadUrl).startsWith('http')) {
        console.log(`✅ API exitosa: ${api.api}, URL: ${downloadUrl}`);
        return downloadUrl;
      } else {
        console.log(`❌ No se encontró URL válida en ${api.api}`);
      }
    } catch (error) {
      console.log(`❌ API ${api.api} falló:`, error?.message || error);
    }
  }
  throw new Error('No se pudo obtener el enlace de descarga de ninguna API de video');
}

function extractYouTubeId(url) {
  if (!url) return null;
  const patterns = [
    /youtu\.be\/([a-zA-Z0-9\-\_]{11})/,
    /youtube\.com\/watch\?v=([a-zA-Z0-9\-\_]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9\-\_]{11})/
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function formatViews(views) {
  if (views === undefined || views === null) return "No disponible";
  try {
    const numViews = parseInt(views) || 0;
    if (numViews >= 1_000_000_000) return `${(numViews / 1_000_000_000).toFixed(1)}B`;
    if (numViews >= 1_000_000) return `${(numViews / 1_000_000).toFixed(1)}M`;
    if (numViews >= 1_000) return `${(numViews / 1_000).toFixed(1)}k`;
    return numViews.toLocaleString();
  } catch {
    return String(views);
  }
}

const handler = async (m, { conn, text = '', usedPrefix = '', command = '' }) => {
  try {
    text = (text || '').trim();
    if (!text) {
      return conn.reply(m.chat, `🍀YOTSUBA NAKANO🍀\n\n🍀 Ingresa el nombre del video o canción de YouTube que deseas descargar.\n\nEjemplo: ${usedPrefix}${command} Let you Down Cyberpunk`, m);
    }

    let videoInfo = null;
    let url = '';

    // Si parece una url de youtube, usa la URL directamente
    const isYouTubeUrl = /youtube\.com|youtu\.be/i.test(text);

    if (isYouTubeUrl) {
      url = text;
      // yts acepta url o texto, intentamos con la url
      const search = await yts(url);
      // Priorizar videos array
      if (search) {
        videoInfo = (search.videos && search.videos.find(v => v.url && v.url.includes(extractYouTubeId(url) || ''))) || (search.all && search.all.find(v => v.videoId && url.includes(v.videoId))) || (search.videos && search.videos[0]) || (search.all && search.all[0]) || null;
      }
      // Si no lo encontró, intentar buscar por id
      if (!videoInfo) {
        const id = extractYouTubeId(url);
        if (id) {
          const search2 = await yts(id);
          videoInfo = (search2.videos && search2.videos[0]) || (search2.all && search2.all.find(v => v.videoId === id)) || null;
        }
      }
    } else {
      // Búsqueda por texto
      const search = await yts(text);
      if (!search || ((!search.videos || search.videos.length === 0) && (!search.all || search.all.length === 0))) {
        return conn.reply(m.chat, 'No se encontraron resultados para tu búsqueda.', m);
      }
      // Prefer videos list
      videoInfo = (search.videos && search.videos[0]) || (search.all && search.all[0]);
      url = videoInfo?.url || url;
    }

    if (!videoInfo) {
      return conn.reply(m.chat, 'No se pudo obtener información del video.', m);
    }

    // Normalizar campos
    const title = videoInfo.title || 'Desconocido';
    const thumbnail = videoInfo.thumbnail || videoInfo.image || '';
    const timestamp = videoInfo.timestamp || videoInfo.duration || 'Desconocido';
    const views = videoInfo.views ?? videoInfo.viewCount ?? 0;
    const ago = videoInfo.ago || videoInfo.uploaded || 'Desconocido';
    const author = (videoInfo.author && videoInfo.author.name) ? videoInfo.author.name : (videoInfo.author || 'Desconocido');

    if (!url) {
      return conn.reply(m.chat, 'No se pudo obtener la URL del video.', m);
    }

    const vistas = formatViews(views);
    const canal = author || 'Desconocido';

    const buttons = [
      ['🎵 Descargar Audio', 'ytdlv2_audio_mp3'],
      ['🎬 Descargar Video', 'ytdlv2_video_mp4'],
      ['📁 Audio como Documento', 'ytdlv2_audio_doc'],
      ['📁 Video como Documento', 'ytdlv2_video_doc']
    ];

    const infoText = `*╭ִ╼࣪━ִ𐚁๋࣭⭑ֶָ֢ ყσƭรµɓα ωα ⚡︎━ִ╾࣪╮*

> 👑 *Título:* ${title}
> 🌟 *Duración:* ${timestamp}
> 👑 *Vistas:* ${vistas}
> 🌟 *Canal:* ${canal}
> 👑 *Publicado:* ${ago}

🌟 *Por favor seleccione el formato para descargar:*`;

    const footer = '👑 Yotsuba Bot - Descargador de YouTube';

    // Enviar carousel (si la función existe en tu conn). Si falla, enviamos texto con botones simples.
    try {
      let thumb = null;
      if (thumbnail) {
        try {
          const file = await conn.getFile(thumbnail).catch(() => null);
          thumb = file?.data || null;
        } catch (e) {
          thumb = null;
        }
      }
      // sendNCarousel puede ser una función personalizada; mantenla si la usas
      if (typeof conn.sendNCarousel === 'function') {
        await conn.sendNCarousel(m.chat, infoText, footer, thumb, buttons, null, null, null, m);
      } else {
        // fallback: enviar texto y botones como reply
        const btnsForReply = buttons.map(b => ({ buttonId: b[1], buttonText: { displayText: b[0] }, type: 1 }));
        await conn.sendMessage(m.chat, { text: infoText + '\n\n' + footer, buttons: btnsForReply, headerType: 1 }, { quoted: m });
      }
    } catch (thumbError) {
      console.error("Error al enviar carousel/miniatura:", thumbError);
      const btnsForReply = buttons.map(b => ({ buttonId: b[1], buttonText: { displayText: b[0] }, type: 1 }));
      await conn.sendMessage(m.chat, { text: infoText + '\n\n' + footer, buttons: btnsForReply, headerType: 1 }, { quoted: m });
    }

    // Guardar búsqueda en la DB del usuario (asegurar estructura)
    if (!global.db) global.db = { data: { users: {} } };
    if (!global.db.data) global.db.data = { users: {} };
    if (!global.db.data.users) global.db.data.users = {};
    if (!global.db.data.users[m.sender]) global.db.data.users[m.sender] = {};
    const usr = global.db.data.users[m.sender];
    usr.lastYTSearch = {
      url,
      title,
      messageId: m.key?.id || null,
      timestamp: Date.now()
    };

    return;
  } catch (error) {
    console.error("Error completo:", error);
    return conn.reply(m.chat, ` Ocurrió un error inesperado: ${error?.message || 'Desconocido'}`, m);
  }
};

async function processDownload(conn, m, url, title, option) {
  const downloadTypes = {
    1: '🎵 audio MP3',
    2: '🎬 video MP4',
    3: '📁 audio MP3 doc',
    4: '📁 video MP4 doc'
  };
  const downloadType = downloadTypes[option] || 'archivo';
  await conn.reply(m.chat, `estoy Preparando ${downloadType}... 🌟`, m);

  try {
    const isVideo = option === 2 || option === 4;
    let downloadUrl;
    if (isVideo) {
      downloadUrl = await getVideoFromApis(url);
    } else {
      downloadUrl = await getAudioFromApis(url);
    }
    if (!downloadUrl) throw new Error('No se obtuvo URL de descarga');

    console.log(`✅ Descarga lista, URL: ${downloadUrl}`);

    // Sanea el nombre
    let safeName = (title || 'yotsuba_file').replace(/[\/\\<>:"|?*\x00-\x1F]/g, '').trim();
    if (!safeName) safeName = 'yotsuba_file';
    safeName = safeName.substring(0, 60);

    if (option === 1 || option === 3) {
      const fileName = `${safeName}.mp3`;
      if (option === 1) {
        await conn.sendMessage(m.chat, {
          audio: { url: downloadUrl },
          mimetype: 'audio/mpeg',
          fileName,
          ptt: false
        }, { quoted: m });
      } else {
        await conn.sendMessage(m.chat, {
          document: { url: downloadUrl },
          mimetype: 'audio/mpeg',
          fileName
        }, { quoted: m });
      }
    } else {
      const fileName = `${safeName}.mp4`;
      if (option === 2) {
        await conn.sendMessage(m.chat, {
          video: { url: downloadUrl },
          mimetype: 'video/mp4',
          fileName,
          caption: `🎬 ${title}`
        }, { quoted: m });
      } else {
        await conn.sendMessage(m.chat, {
          document: { url: downloadUrl },
          mimetype: 'video/mp4',
          fileName,
          caption: `📁 ${title}`
        }, { quoted: m });
      }
    }

    // Aplicar coste si procede
    if (!global.db) global.db = { data: { users: {} } };
    if (!global.db.data.users) global.db.data.users = {};
    const user = global.getUser ? global.getUser(m.sender) : (global.db.data.users[m.sender] || (global.db.data.users[m.sender] = {}));
    if (user && !user.monedaDeducted) {
      user.moneda = (user.moneda || 0) - 2;
      user.monedaDeducted = true;
      conn.reply(m.chat, `⚡ Tú busca se a realizado con exito *Yotsuba Nakano bot🌟*`, m);
    }

    return true;
  } catch (error) {
    console.error("Error al procesar descarga:", error);
    try { await conn.reply(m.chat, `🍀 Error en la descarga: ${error?.message || error}`, m); } catch {}
    return false;
  }
}

/** -------------- FIXED handler.before -------------- **/
handler.before = async (m, { conn }) => {
  try {
    // Diferentes formas en que puede venir la respuesta de un botón/list
    const msg = m.message || {};
    const br = msg.buttonsResponseMessage || msg.listResponseMessage || msg.templateButtonReplyMessage || null;

    let selectedId = null;

    if (br) {
      // buttonsResponseMessage
      selectedId = br?.selectedButtonId || br?.singleSelectReply?.selectedRowId || br?.selectedId || br?.selectedButtonId;
    } else {
      // fallback: a veces el cliente envía texto literal igual al displayText del botón
      const text = (m.text || m.message?.conversation || m.message?.extendedTextMessage?.text || '').toString().trim().toLowerCase();

      if (text) {
        if (text.includes('descargar audio')) selectedId = 'ytdlv2_audio_mp3';
        else if (text.includes('descargar video')) selectedId = 'ytdlv2_video_mp4';
        else if (text.includes('audio como documento')) selectedId = 'ytdlv2_audio_doc';
        else if (text.includes('video como documento')) selectedId = 'ytdlv2_video_doc';
        // también aceptar variantes sin emoji / con y sin mayúsculas
      }
    }

    if (!selectedId) return false;

    const buttonPatterns = {
      'ytdlv2_audio_mp3': 1,
      'ytdlv2_video_mp4': 2,
      'ytdlv2_audio_doc': 3,
      'ytdlv2_video_doc': 4
    };

    const option = buttonPatterns[selectedId];
    if (!option) return false;

    const user = global.db?.data?.users?.[m.sender];
    if (!user || !user.lastYTSearch) {
      await conn.reply(m.chat, '⏰ No hay búsqueda activa. Realiza una nueva búsqueda.', m);
      return false;
    }

    const currentTime = Date.now();
    const searchTime = user.lastYTSearch.timestamp || 0;
    if (currentTime - searchTime > 10 * 60 * 1000) {
      await conn.reply(m.chat, '⏰ La búsqueda ha expirado. Por favor realiza una nueva búsqueda.', m);
      user.lastYTSearch = null;
      return false;
    }

    user.monedaDeducted = false;

    try {
      await processDownload(conn, m, user.lastYTSearch.url, user.lastYTSearch.title, option);
      user.lastYTSearch = null;
    } catch (error) {
      console.error(`❌ Error en descarga (before):`, error?.message || error);
      await conn.reply(m.chat, `🍀 Error al procesar la descarga: ${error?.message || error}`, m);
    }

    return true;
  } catch (e) {
    console.error('Error en handler.before:', e);
    return false;
  }
};
/** -------------------------------------------------- **/

handler.command = handler.help = ['play', 'ytdlv2'];
handler.tags = ['downloader'];
handler.register = true;

export default handler;