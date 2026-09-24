const fetch = require('node-fetch');
const fs = require('fs');

// --- 🌐 CONFIGURATION: Kal ko domain change ho toh bas yahan badlo, sab jagh update ho jayega! ---
const MAIN_SITE = "https://prmovies.futbol/";

const USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2.1 Safari/605.1.15",
    "Mozilla/5.0 (X11; Linux x86_64; rv:121.0) Gecko/20100101 Firefox/121.0"
];

function getRandomUserAgent() {
    return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

async function getLiveDomain(testUrls) {
    for (let url of testUrls) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 4000);
            const res = await fetch(url, { 
                method: 'HEAD',
                headers: { "User-Agent": getRandomUserAgent() },
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            if (res.ok) return new URL(res.url).origin + "/";
        } catch (e) {}
    }
    return testUrls[0];
}

const categories = [
    // --- Genres ---
    { path: 'genre/top-rated/', group: '✨ Cinema Movies ✨' },
    { path: 'genre/bollywood/', group: '✨ Bollywood Movies ✨' },
    { path: 'genre/dual-audio/', group: '✨ Dual Audio ✨' },
    { path: 'genre/hollywood/', group: '✨ Hollywood Movies ✨' },
    { path: 'genre/south-special/', group: '✨ South Special ✨' },
    { path: 'genre/animation/', group: '✨ Animation Movies ✨' },
    { path: 'genre/action/', group: '✨ Action Movies ✨' },
    { path: 'genre/adventure/', group: '✨ Adventure Movies ✨' },
    { path: 'genre/biography/', group: '✨ Biography Movies ✨' },
    { path: 'genre/comedy/', group: '✨ Comedy Movies ✨' },
    { path: 'genre/crime/', group: '✨ Crime Movies ✨' },
    { path: 'genre/drama/', group: '✨ Drama Movies ✨' },
    { path: 'genre/mystery/', group: '✨ Mystery Movies ✨' },
    { path: 'genre/family/', group: '✨ Family Movies ✨' },
    { path: 'genre/fantasy/', group: '✨ Fantasy Movies ✨' },
    { path: 'genre/horror/', group: '✨ Horror Movies ✨' },
    { path: 'genre/history/', group: '✨ History Movies ✨' },
    { path: 'genre/romantic/', group: '✨ Romantic Movies ✨' },
    { path: 'genre/science-fiction/', group: '✨ Science Fiction Movies ✨' },
    { path: 'genre/thriller/', group: '✨ Thriller Movies ✨' },
    { path: 'genre/war/', group: '✨ War Movies ✨' },

    // --- Series / OTT Platforms ---
    { path: 'director/netflix/', group: '✨ Netflix Series ✨' },
    { path: 'director/hotstar/', group: '✨ Hotstar Series ✨' },
    { path: 'director/amazon-prime/', group: '✨ Amazon Prime Series ✨' },
    { path: 'director/zee5/', group: '✨ Zee5 Series ✨' },
    { path: 'director/voot-originals/', group: '✨ Voot Originals Series ✨' },
    { path: 'director/sonyliv-original/', group: '✨ SonyLiv Original Series ✨' },
    { path: 'director/viu-originals/', group: '✨ Viu Originals Series ✨' },
    { path: 'director/mx-player/', group: '✨ MX Player Series ✨' }
];


async function generatePlaylist() {
    let playlist = "#EXTM3U\n";
    
    console.log("Fetching live stream base domain...");
    const streamBaseLive = await getLiveDomain(["https://speedostream1.com/", "https://speedostream.com/"]);
    const cleanStreamBase = streamBaseLive.replace(/\/$/, "");

    for (const cat of categories) {
        const catBaseUrl = new URL(cat.path, MAIN_SITE).href;
        console.log(`\n--- Processing Category: ${cat.group} ---`);
        
        for (let p = 1; p <= 5; p++) {
            let targetPageUrl = p === 1 
                ? `https://bold-darkness-d959.poonamchouhan076.workers.dev/?site=${catBaseUrl}`
                : `https://bold-darkness-d959.poonamchouhan076.workers.dev/?site=${catBaseUrl}page/${p}/`;

            console.log(`Fetching Page ${p} for ${cat.group}...`);

            try {
                const htmlRes = await fetch(targetPageUrl, {
                    headers: { "User-Agent": getRandomUserAgent() }
                });

                if (!htmlRes.ok) continue;

                const htmlContent = await htmlRes.text();
                const mlItems = htmlContent.split('class="ml-item"');

                for (let index = 1; index < mlItems.length; index++) {
                    const item = mlItems[index];

                    const hrefMatch = item.match(/<a\s+href="([^"]+)"/);
                    const imgMatch = item.match(/data-original="([^"]+)"/);
                    const titleMatch = item.match(/<h2>([\s\S]*?)<\/h2>/);

                    if (titleMatch && hrefMatch) {
                        const title = titleMatch[1].trim();
                        const movieHref = hrefMatch[1];

                        try {
                            const detailRes = await fetch(movieHref, {
                                headers: { "User-Agent": getRandomUserAgent() }
                            });
                            if (detailRes.ok) {
                                const detailHtml = await detailRes.text();
                                const iframeMatch = detailHtml.match(/<iframe[^>]+src="([^"]+)"/i);
                                if (iframeMatch && iframeMatch[1]) {
                                    const idMatch = iframeMatch[1].match(/embed-([a-zA-Z0-9]+)\.html/i);
                                    if (idMatch && idMatch[1]) {
                                        const embedId = idMatch[1];
                                        const playLink = `${cleanStreamBase}/embed-${embedId}.html`;
                                        const logo = imgMatch ? imgMatch[1] : '';
                                        
                                        playlist += `#EXTINF:-1 tvg-logo="${logo}" group-title="${cat.group}",${title}\n${playLink}\n`;
                                    }
                                }
                            }
                        } catch (err) {}
                    }
                }
            } catch (err) {}
        }
    }

    fs.writeFileSync('playlist.m3u', playlist, 'utf-8');
    console.log("\n Playlist successfully generated and saved as playlist.m3u!");
}

generatePlaylist();
