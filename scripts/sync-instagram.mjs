import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import https from "https";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const USERNAME = "giselemaiolooficial";
const OUT_DIR = path.join(ROOT, "assets", "instagram");
const DATA_FILE = path.join(ROOT, "data", "instagram-posts.json");
const LIMIT = 6;

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https
      .get(url, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          file.close();
          fs.unlinkSync(dest);
          return download(res.headers.location, dest).then(resolve).catch(reject);
        }
        res.pipe(file);
        file.on("finish", () => file.close(() => resolve(dest)));
      })
      .on("error", reject);
  });
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  userAgent:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
});

await page.goto(`https://www.instagram.com/${USERNAME}/`, {
  waitUntil: "networkidle",
  timeout: 60000,
});
await page.waitForTimeout(2500);

const scraped = await page.evaluate((limit) => {
  const text = document.body.innerText;
  const followersMatch = text.match(/([\d.,]+)\s+followers/i);
  const followingMatch = text.match(/([\d.,]+)\s+following/i);

  const postLinks = [...document.querySelectorAll('a[href*="/p/"], a[href*="/reel/"]')]
    .map((a) => ({ href: a.href, img: a.querySelector("img") }))
    .filter((x) => x.img)
    .slice(0, limit)
    .map(({ href, img }) => ({
      url: href.split("?")[0],
      thumbnail: img.src,
      alt: img.alt || "",
      isVideo: /reel\//.test(href) || /Video by/.test(img.alt || ""),
      isCarousel: /Carousel/.test(img.alt || ""),
    }));

  return {
    followers: followersMatch?.[1] || "",
    following: followingMatch?.[1] || "",
    postLinks,
  };
}, LIMIT);

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });

const posts = [];
for (let i = 0; i < scraped.postLinks.length; i++) {
  const p = scraped.postLinks[i];
  const id = p.url.split("/").filter(Boolean).pop();
  const ext = p.thumbnail.includes(".webp") ? "webp" : "jpg";
  const local = `assets/instagram/post-${i + 1}.${ext}`;

  try {
    await download(p.thumbnail, path.join(ROOT, local));
  } catch (error) {
    console.warn(`Falha ao baixar ${id}:`, error.message);
  }

  posts.push({
    id,
    url: p.url.endsWith("/") ? p.url : `${p.url}/`,
    thumbnail: local,
    remoteThumbnail: p.thumbnail,
    alt: p.alt,
    isVideo: p.isVideo,
    isCarousel: p.isCarousel,
  });
}

const payload = {
  username: USERNAME,
  profileUrl: `https://www.instagram.com/${USERNAME}/`,
  followers: scraped.followers,
  following: scraped.following,
  bio: "Desperte o poder da autoestima e transforme as suas relações.",
  fetchedAt: new Date().toISOString(),
  posts,
};

fs.writeFileSync(DATA_FILE, JSON.stringify(payload, null, 2));
console.log(`✓ ${posts.length} posts sincronizados → ${DATA_FILE}`);
await browser.close();
