import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { PrismaClient } from "@prisma/client";

// Ensure .env is loaded
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, "../.env");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const idx = trimmed.indexOf("=");
      const key = trimmed.substring(0, idx).trim();
      let val = trimmed.substring(idx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

const prisma = new PrismaClient();

function extractMapUrl(html) {
  if (!html || typeof html !== "string") return null;

  function cleanUrl(url) {
    if (!url) return null;
    let cleaned = url.trim();
    cleaned = cleaned.replace(/(?:%20|\s+)(?:width|height|style|allowfullscreen|loading|referrerpolicy|frameborder).*/i, "");
    cleaned = cleaned.split(/["'>\s]/)[0];
    cleaned = cleaned.replace(/&amp;/g, "&");
    return cleaned;
  }

  // 1. Check for iframe with google.com/maps/embed
  const iframeEmbedMatch = html.match(/<iframe[^>]+src=["'](https?:\/\/[^"']*google\.com\/maps\/embed[^"']*)["']/i);
  if (iframeEmbedMatch && iframeEmbedMatch[1]) {
    return cleanUrl(iframeEmbedMatch[1]);
  }

  // 2. Check for any iframe with maps.google.com
  const iframeMapsMatch = html.match(/<iframe[^>]+src=["'](https?:\/\/[^"']*maps\.google\.com[^"']*)["']/i);
  if (iframeMapsMatch && iframeMapsMatch[1]) {
    return cleanUrl(iframeMapsMatch[1]);
  }

  // 3. Check for any iframe containing google map embed query
  const genericIframeMatch = html.match(/src=["'](https?:\/\/(?:www\.)?google\.com\/maps\/[^"']+)["']/i);
  if (genericIframeMatch && genericIframeMatch[1]) {
    return cleanUrl(genericIframeMatch[1]);
  }

  // 4. Check for Google Maps link in <a> tags
  const aLinkMatch = html.match(/href=["'](https?:\/\/(?:www\.)?(?:google\.com\/maps|maps\.google\.com|goo\.gl\/maps|maps\.app\.goo\.gl)\/[^"']+)["']/i);
  if (aLinkMatch && aLinkMatch[1]) {
    return cleanUrl(aLinkMatch[1]);
  }

  return null;
}

async function fetchWithTimeout(url, timeoutMs = 8000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });
    clearTimeout(id);
    if (!res.ok) return null;
    const text = await res.text();
    return text;
  } catch (err) {
    clearTimeout(id);
    return null;
  }
}

async function findMapOnWebsite(domain) {
  let cleanDomain = domain.trim().replace(/^https?:\/\//i, "").replace(/\/+$/, "");
  const protocolList = [`https://${cleanDomain}`, `http://${cleanDomain}`, `https://www.${cleanDomain}`, `http://www.${cleanDomain}`];

  for (const baseUrl of protocolList) {
    try {
      // 1. Check Homepage
      const homeHtml = await fetchWithTimeout(baseUrl);
      if (homeHtml) {
        const mapUrl = extractMapUrl(homeHtml);
        if (mapUrl) {
          return { mapUrl, pageUrl: baseUrl };
        }

        // Search for contact page links in the home html
        const contactLinks = [
          ...new Set(
            (homeHtml.match(/href=["']([^"']*(?:contact|location|about|যোগাযোগ)[^"']*)["']/gi) || []).map((m) => {
              const match = m.match(/href=["']([^"']+)["']/i);
              return match ? match[1] : null;
            }).filter(Boolean)
          ),
        ];

        for (const subLink of contactLinks) {
          if (subLink.startsWith("#") || subLink.startsWith("javascript:") || subLink.startsWith("mailto:") || subLink.startsWith("tel:")) continue;
          let fullContactUrl;
          if (subLink.startsWith("http://") || subLink.startsWith("https://")) {
            fullContactUrl = subLink;
          } else {
            fullContactUrl = `${baseUrl}/${subLink.replace(/^\/+/, "")}`;
          }
          const contactHtml = await fetchWithTimeout(fullContactUrl, 6000);
          if (contactHtml) {
            const contactMap = extractMapUrl(contactHtml);
            if (contactMap) {
              return { mapUrl: contactMap, pageUrl: fullContactUrl };
            }
          }
        }

        // Try standard contact sub-paths
        const commonPaths = ["/contact", "/contact-us", "/contact.php", "/contact-us.php", "/location", "/contactus"];
        for (const path of commonPaths) {
          const pageHtml = await fetchWithTimeout(`${baseUrl}${path}`, 5000);
          if (pageHtml) {
            const pageMap = extractMapUrl(pageHtml);
            if (pageMap) {
              return { mapUrl: pageMap, pageUrl: `${baseUrl}${path}` };
            }
          }
        }
      }
    } catch {
      // Try next protocol
    }
  }

  return null;
}

async function main() {
  console.log("Fetching institutions from database...");
  const institutions = await prisma.institution.findMany({
    where: {
      deletedAt: null,
      domain: { not: null },
    },
    select: {
      id: true,
      instituteName: true,
      domain: true,
      customFields: true,
    },
  });

  const validInsts = institutions.filter((i) => i.domain && i.domain.trim().length > 0);
  console.log(`Found ${validInsts.length} institutions with a website domain.`);

  let foundCount = 0;
  let alreadyHadCount = 0;
  let notFoundCount = 0;

  // Process with concurrency limit (e.g. 5 concurrent requests)
  const CONCURRENCY = 5;
  for (let i = 0; i < validInsts.length; i += CONCURRENCY) {
    const chunk = validInsts.slice(i, i + CONCURRENCY);
    await Promise.all(
      chunk.map(async (inst) => {
        const cf = (inst.customFields && typeof inst.customFields === "object") ? inst.customFields : {};
        const existingMap = cf.googleMapsUrl;

        console.log(`[${inst.id}] Checking: "${inst.instituteName}" -> ${inst.domain}`);
        const result = await findMapOnWebsite(inst.domain);

        if (result && result.mapUrl) {
          console.log(`  -> FOUND MAP for "${inst.instituteName}" on ${result.pageUrl}: ${result.mapUrl.slice(0, 70)}...`);
          await prisma.institution.update({
            where: { id: inst.id },
            data: {
              customFields: {
                ...cf,
                googleMapsUrl: result.mapUrl,
              },
            },
          });
          foundCount++;
        } else {
          if (existingMap) {
            console.log(`  -> No new map found on site, kept existing: ${existingMap.slice(0, 50)}...`);
            alreadyHadCount++;
          } else {
            console.log(`  -> No map found on website.`);
            notFoundCount++;
          }
        }
      })
    );
  }

  console.log("\n==========================================");
  console.log(`Scraping Finished!`);
  console.log(`Total Institutions Checked: ${validInsts.length}`);
  console.log(`Maps Found & Updated: ${foundCount}`);
  console.log(`Already Had Map: ${alreadyHadCount}`);
  console.log(`No Map on Website: ${notFoundCount}`);
  console.log("==========================================");
}

main()
  .catch((e) => {
    console.error("Error running map scraper:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
