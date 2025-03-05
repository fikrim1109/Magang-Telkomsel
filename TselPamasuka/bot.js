const { Telegraf, Markup } = require('telegraf');
const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2/promise');
require('dotenv').config();

// Inisialisasi Telegraf bot
const bot = new Telegraf(process.env.BOT_TOKEN);

// Inisialisasi Express app untuk endpoint notifikasi
const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Variabel global untuk menyimpan recent messages
const recentMessages = [];
const MAX_RECENT_MESSAGES = 10;

// Endpoint untuk menerima notifikasi dari CodeIgniter (misal: update data pegawai)
app.post('/notify', async (req, res) => {
    const { message } = req.body;
    try {
        await bot.telegram.sendMessage(process.env.TELEGRAM_CHAT_ID, message);
        // Simpan pesan ke recentMessages dengan timestamp
        recentMessages.push({ timestamp: new Date(), message });
        if (recentMessages.length > MAX_RECENT_MESSAGES) {
            recentMessages.shift();
        }
        res.json({ status: 'success' });
    } catch (error) {
        console.error('❌ Error sending message:', error);
        res.status(500).json({ status: 'error', error: error.message });
    }
});

// Jalankan Express server pada port 3000
app.listen(3000, () => console.log('Notification endpoint running on port 3000'));

// Konfigurasi database untuk bot (gunakan database pegawai_db)
let pool;
(async () => {
    try {
        pool = mysql.createPool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: 'pegawai_db', // sesuaikan dengan nama database pegawai Anda
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });
        console.log('✅ Koneksi database berhasil');
    } catch (error) {
        console.error('❌ Koneksi database gagal:', error);
    }
})();

// Session management untuk melacak state user
const userSessions = new Map();

// Constants untuk state user
const STATES = {
    IDLE: 'idle',
    SEARCHING_PEGAWAI: 'searching_pegawai',
    SEARCHING_IMAGE: 'searching_image'
};

// Fungsi query ke database
const dbQueries = {
    async findPegawaiByName(nama) {
        try {
            const [rows] = await pool.query(
                `SELECT p.id, p.nama_pegawai, j.nama_jabatan, p.alamat, p.telepon
                 FROM pegawai p
                 JOIN jabatan j ON p.jabatan_id = j.id
                 WHERE p.nama_pegawai LIKE ?`,
                [`%${nama}%`]
            );
            return rows;
        } catch (error) {
            console.error('❌ Kesalahan saat mengakses database pegawai:', error);
            return [];
        }
    },
    
    async findImageByQuery(query) {
        try {
            const [rows] = await pool.query(
                'SELECT ImageID, ImageURL, ImageKey FROM image WHERE ImageKey LIKE ?',
                [`%${query}%`]
            );
            return rows;
        } catch (error) {
            console.error('❌ Kesalahan saat mengakses database untuk gambar:', error);
            return [];
        }
    }
};

// Komponen UI untuk bot
const ui = {
    mainMenu(message = 'Selamat datang di bot TselPamasuka!') {
        return {
            text: message,
            keyboard: Markup.inlineKeyboard([
                [Markup.button.callback('🔍 Pencarian Pegawai', 'action:pegawai_search')],
                [Markup.button.callback('🖼️ Pencarian Gambar', 'action:image_search')],
                [Markup.button.callback('🕒 Recent Message', 'action:recent_messages')],
                [Markup.button.callback('📌 Menu 3', 'action:menu3')]
            ])
        };
    },
    
    // Tampilkan nama_jabatan, bukan jabatan_id
    pegawaiInfo(pegawai) {
        return `
📋 *Data Pegawai*

🆔 ID: ${pegawai.id}
👤 Nama: ${pegawai.nama_pegawai}
🏢 Jabatan: ${pegawai.nama_jabatan}
🏠 Alamat: ${pegawai.alamat}
📞 Telepon: ${pegawai.telepon}
        `;
    },
    
    imageInfo(image) {
        return `
🖼️ *Informasi Gambar*

🆔 ID: ${image.ImageID}
🔑 Keyword: ${image.ImageKey}
🔗 [Lihat Gambar](${image.ImageURL})
        `;
    },
    
    // Fungsi untuk membuat tombol pagination
    paginationButtons(currentPage, totalPages, actionPrefix) {
        const buttons = [];
        
        if (currentPage > 1) {
            buttons.push(Markup.button.callback('⬅️ Sebelumnya', `${actionPrefix}:${currentPage - 1}`));
        }
        
        if (currentPage < totalPages) {
            buttons.push(Markup.button.callback('➡️ Selanjutnya', `${actionPrefix}:${currentPage + 1}`));
        }
        
        buttons.push(Markup.button.callback('🏠 Menu Utama', 'action:main_menu'));
        
        return Markup.inlineKeyboard([buttons]);
    }
};

// Fungsi pembantu untuk state management dan validasi
const helpers = {
    // Validasi input minimal 3 karakter
    validatePegawaiInput(input) {
        return input.length >= 3;
    },
    
    setState(chatId, state, data = {}) {
        if (!userSessions.has(chatId)) {
            userSessions.set(chatId, {});
        }
        const session = userSessions.get(chatId);
        session.state = state;
        Object.keys(data).forEach(key => {
            session[key] = data[key];
        });
    },
    
    getState(chatId) {
        return userSessions.has(chatId) ? userSessions.get(chatId).state : STATES.IDLE;
    },
    
    getSessionData(chatId) {
        return userSessions.get(chatId) || {};
    }
};

// Command handler: /start
bot.start((ctx) => {
    const { text, keyboard } = ui.mainMenu();
    ctx.reply(text, keyboard);
});

// Action handlers
bot.action(/^action:(.+)$/, (ctx) => {
    const action = ctx.match[1];
    const chatId = ctx.chat.id;
    
    switch (action) {
        case 'pegawai_search':
            helpers.setState(chatId, STATES.SEARCHING_PEGAWAI);
            ctx.reply('Masukkan nama pegawai yang ingin dicari:');
            break;
            
        case 'image_search':
            helpers.setState(chatId, STATES.SEARCHING_IMAGE);
            ctx.reply('Masukkan keyword gambar yang ingin dicari:');
            break;
            
        case 'recent_messages':
            // Tampilkan recent messages
            if (recentMessages.length > 0) {
                const messageList = recentMessages
                    .map((msg, idx) => `${idx + 1}. ${msg.timestamp.toLocaleString()} - ${msg.message}`)
                    .join('\n');
                ctx.replyWithMarkdown(`*Recent Messages:*\n${messageList}`);
            } else {
                ctx.reply('Tidak ada pesan terbaru.');
            }
            break;
            
        case 'menu3':
            ctx.reply('🚧 Menu 3 akan segera tersedia.');
            ctx.reply(ui.mainMenu().text, ui.mainMenu().keyboard);
            break;
            
        case 'main_menu':
            ctx.reply(ui.mainMenu().text, ui.mainMenu().keyboard);
            break;
            
        default:
            ctx.reply('❓ Perintah tidak dikenali');
            ctx.reply(ui.mainMenu().text, ui.mainMenu().keyboard);
    }
    
    ctx.answerCbQuery().catch(console.error);
});

// Pagination handler untuk hasil pencarian pegawai
bot.action(/^page:(\d+)$/, async (ctx) => {
    const pageNumber = parseInt(ctx.match[1]);
    const chatId = ctx.chat.id;
    const sessionData = helpers.getSessionData(chatId);
    
    if (sessionData.searchResults && sessionData.searchResults.length > 0) {
        await displayPegawaiSearchResults(ctx, sessionData.searchResults, pageNumber);
    } else {
        ctx.reply('❌ Tidak ada hasil pencarian yang tersedia.');
        ctx.reply(ui.mainMenu().text, ui.mainMenu().keyboard);
    }
    
    ctx.answerCbQuery().catch(console.error);
});

// Pagination handler untuk hasil pencarian gambar
bot.action(/^ipage:(\d+)$/, async (ctx) => {
    const pageNumber = parseInt(ctx.match[1]);
    const chatId = ctx.chat.id;
    const sessionData = helpers.getSessionData(chatId);
    
    if (sessionData.imageResults && sessionData.imageResults.length > 0) {
        await displayImageSearchResults(ctx, sessionData.imageResults, pageNumber);
    } else {
        ctx.reply('❌ Tidak ada hasil pencarian gambar yang tersedia.');
        ctx.reply(ui.mainMenu().text, ui.mainMenu().keyboard);
    }
    
    ctx.answerCbQuery().catch(console.error);
});

// Fungsi untuk menampilkan hasil pencarian pegawai dengan pagination
async function displayPegawaiSearchResults(ctx, results, page = 1) {
    const pageSize = 1;
    const totalPages = Math.ceil(results.length / pageSize);
    const startIndex = (page - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, results.length);
    
    if (results.length === 0) {
        await ctx.reply('❌ Tidak ada hasil yang ditemukan');
        return;
    }
    
    await ctx.reply(`Menampilkan hasil ${startIndex + 1}-${endIndex} dari ${results.length}`);
    
    for (let i = startIndex; i < endIndex; i++) {
        await ctx.replyWithMarkdown(
            ui.pegawaiInfo(results[i]), 
            ui.paginationButtons(page, totalPages, 'page')
        );
    }
    
    helpers.setState(ctx.chat.id, STATES.IDLE, { searchResults: results });
}

// Fungsi untuk menampilkan hasil pencarian gambar dengan pagination
async function displayImageSearchResults(ctx, results, page = 1) {
    const pageSize = 1;
    const totalPages = Math.ceil(results.length / pageSize);
    const startIndex = (page - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, results.length);
    
    if (results.length === 0) {
        await ctx.reply('❌ Tidak ada hasil gambar yang ditemukan');
        return;
    }
    
    await ctx.reply(`Menampilkan hasil ${startIndex + 1}-${endIndex} dari ${results.length}`);
    
    for (let i = startIndex; i < endIndex; i++) {
        await ctx.replyWithMarkdown(
            ui.imageInfo(results[i]), 
            ui.paginationButtons(page, totalPages, 'ipage')
        );
    }
    
    helpers.setState(ctx.chat.id, STATES.IDLE, { imageResults: results });
}

// Message handler untuk menerima input teks
bot.on('text', async (ctx) => {
    const chatId = ctx.chat.id;
    const currentState = helpers.getState(chatId);
    const messageText = ctx.message.text;
    
    if (currentState === STATES.SEARCHING_PEGAWAI) {
        helpers.setState(chatId, STATES.IDLE);
        const pegawaiQuery = messageText.trim();
        
        if (helpers.validatePegawaiInput(pegawaiQuery)) {
            try {
                const pegawai = await dbQueries.findPegawaiByName(pegawaiQuery);
                if (pegawai && pegawai.length > 0) {
                    await displayPegawaiSearchResults(ctx, pegawai);
                } else {
                    await ctx.reply('❌ Data pegawai tidak ditemukan');
                    const { text, keyboard } = ui.mainMenu('Kembali ke menu utama:');
                    await ctx.reply(text, keyboard);
                }
            } catch (error) {
                console.error('Error searching pegawai:', error);
                await ctx.reply('⚠️ Terjadi kesalahan saat mencari data pegawai');
                const { text, keyboard } = ui.mainMenu('Kembali ke menu utama:');
                await ctx.reply(text, keyboard);
            }
        } else {
            await ctx.reply('❌ Format input tidak valid. Masukkan minimal 3 karakter.');
            const { text, keyboard } = ui.mainMenu('Kembali ke menu utama:');
            await ctx.reply(text, keyboard);
        }
    } else if (currentState === STATES.SEARCHING_IMAGE) {
        helpers.setState(chatId, STATES.IDLE);
        const imageQuery = messageText.trim().toLowerCase();
        
        if (imageQuery.length >= 3) {
            try {
                const images = await dbQueries.findImageByQuery(imageQuery);
                if (images && images.length > 0) {
                    await displayImageSearchResults(ctx, images);
                } else {
                    await ctx.reply('❌ Data gambar tidak ditemukan');
                    const { text, keyboard } = ui.mainMenu('Kembali ke menu utama:');
                    await ctx.reply(text, keyboard);
                }
            } catch (error) {
                console.error('Error searching image:', error);
                await ctx.reply('⚠️ Terjadi kesalahan saat mencari data gambar');
                const { text, keyboard } = ui.mainMenu('Kembali ke menu utama:');
                await ctx.reply(text, keyboard);
            }
        } else {
            await ctx.reply('❌ Format input tidak valid. Masukkan minimal 3 karakter.');
            const { text, keyboard } = ui.mainMenu('Kembali ke menu utama:');
            await ctx.reply(text, keyboard);
        }
    } else {
        const { text, keyboard } = ui.mainMenu();
        await ctx.reply(text, keyboard);
    }
});

// Error handler
bot.catch((err, ctx) => {
    console.error('Bot error:', err);
    ctx.reply('⚠️ Terjadi kesalahan pada bot. Silakan coba lagi nanti.');
});

// Start bot
bot.launch()
    .then(() => {
        console.log('🚀 Bot TselPamasuka is running!');
    })
    .catch((err) => {
        console.error('❌ Gagal menjalankan bot:', err);
    });

// Graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
