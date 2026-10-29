const fetch = require('node-fetch');
const fs = require('fs');

// --- 🌐 CONFIGURATION ---
const MAIN_SITE = "https://prmovies.ventures/";

const USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Safari/605.1.15",
    "Mozilla/5.0 (X11; Linux x86_64; rv:123.0) Gecko/20100101 Firefox/123.0"
];

function getRandomUserAgent() {
    return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

async function fetchWithRetry(url, options = {}, retries = 2) {
    for (let i = 0; i < retries; i++) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 7000);
            
            const res = await fetch(url, {
                ...options,
                headers: { "User-Agent": getRandomUserAgent(), ...(options.headers || {}) },
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            if (res.ok) return res;
        } catch (e) {
            if (i === retries - 1) return null; // Error aane par null return karega taaki code crash na ho
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
    return null;
}

async function getLiveDomain(testUrls) {
    for (let url of testUrls) {
        try {
            const res = await fetchWithRetry(url, { method: 'HEAD' }, 1);
            if (res && res.ok) return new URL(res.url).origin + "/";
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
    { path: 'genre/marathi/', group: '✨ Marathi Movies ✨' },
    
    // --- Series / OTT Platforms ---
    { path: 'director/netflix/', group: '💥 Netflix Series 💥' },
    { path: 'director/hotstar/', group: '💥 Hotstar Series 💥' },
    { path: 'director/amazon-prime/', group: '💥 Prime Series 💥' },
    { path: 'director/zee5/', group: '💥 Zee5 Series 💥' },
    { path: 'director/voot-originals/', group: '💥 Voot Series 💥' },
    { path: 'director/sonyliv-original/', group: '💥 SonyLiv Series 💥' },
    { path: 'director/viu-originals/', group: '💥 Viu Series 💥' },
    { path: 'director/mx-player/', group: '💥 MX Player Series 💥' }
];

async function generatePlaylist() {
    let playlist = "#EXTM3U\n";
    let totalMoviesAdded = 0;
    
    console.log("Fetching live stream base domain...");
    const streamBaseLive = await getLiveDomain(["https://speedostream1.com/", "https://speedostream.com/"]);
    const cleanStreamBase = streamBaseLive.replace(/\/$/, "");

    for (const cat of categories) {
        const catBaseUrl = new URL(cat.path, MAIN_SITE).href;
        console.log(`\n--- Processing Category: ${cat.group} ---`);
        
        let emptyPageStreak = 0;

        for (let p = 1; p <= 20; p++) { // Limit 20 pages tak kar di hai taaki koi page chute na
            let targetPageUrl = p === 1 
                ? `https://bold-darkness-d959.poonamchouhan076.workers.dev/?site=${catBaseUrl}`
                : `https://bold-darkness-d959.poonamchouhan076.workers.dev/?site=${catBaseUrl}page/${p}/`;

            const htmlRes = await fetchWithRetry(targetPageUrl);
            if (!htmlRes) {
                console.log(`  -> Page ${p}: Failed to load, trying next page...`);
                continue; // Page fail hua toh crash nahi karna, agle page par jana hai
            }

            const htmlContent = await htmlRes.text();
            const mlItems = htmlContent.split('class="ml-item"');

            if (mlItems.length <= 1) {
                emptyPageStreak++;
                if (emptyPageStreak >= 2) break; // Agar lagataar 2 pages empty milen tabhi category band karo
                continue;
            }

            emptyPageStreak = 0; // Reset streak if movies found
            let pageMovieCount = 0;

            for (let index = 1; index < mlItems.length; index++) {
                const item = mlItems[index];

                const hrefMatch = item.match(/<a\s+href="([^"]+)"/) || item.match(/href="([^"]+\/(?:movie|series|item)\/[^"]+)"/);
                const imgMatch = item.match(/data-original="([^"]+)"/) || item.match(/src="([^"]+)"/);
                const titleMatch = item.match(/<h2>([\s\S]*?)<\/h2>/) || item.match(/title="([^"]+)"/);

                if (!hrefMatch) continue;

                const movieHref = hrefMatch[1];
                let title = titleMatch ? titleMatch[1].replace(/<[^>]*>?/gm, '').trim() : "Unknown Title";
                let logo = imgMatch ? imgMatch[1] : '';

                try {
                    const detailRes = await fetchWithRetry(movieHref, {}, 1);
                    if (!detailRes) continue; // Agar detail page na khule toh is movie ko chhod kar agli par jao

                    const detailHtml = await detailRes.text();
                    const iframeMatch = detailHtml.match(/<iframe[^>]+src="([^"]+)"/i);
                    
                    if (iframeMatch && iframeMatch[1]) {
                        const idMatch = iframeMatch[1].match(/embed-([a-zA-Z0-9]+)\.html/i);
                        if (idMatch && idMatch[1]) {
                            const embedId = idMatch[1];
                            const playLink = `${cleanStreamBase}/embed-${embedId}.html`;
                            
                            playlist += `#EXTINF:-1 tvg-logo="${logo}" group-title="${cat.group}",${title}\n${playLink}\n`;
                            totalMoviesAdded++;
                            pageMovieCount++;
                        }
                    }
                } catch (err) {
                    // Kisi ek movie ki error ki wajah se baaki process nahi rukegi
                }
            }
            console.log(`  -> Page ${p}: Added ${pageMovieCount} movies.`);
        }
    }

    fs.writeFileSync('playlist.m3u', playlist, 'utf-8');
    console.log(`\n✅ Playlist successfully generated! Total items added: ${totalMoviesAdded}. Saved as playlist.m3u`);
}

generatePlaylist();
