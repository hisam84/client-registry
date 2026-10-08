import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple CSV parser supporting quotes and commas
function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };

  function parseLine(line) {
    const result = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  }

  const headers = parseLine(lines[0]);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i]);
    const obj = {};
    headers.forEach((h, index) => {
      obj[h] = values[index] !== undefined ? values[index] : "";
    });
    rows.push(obj);
  }

  return { headers, rows };
}

function stringifyCsv(headers, rows) {
  function escapeValue(val) {
    if (val === null || val === undefined) return "";
    const str = String(val);
    if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  const headerLine = headers.map(escapeValue).join(",");
  const rowLines = rows.map((row) => headers.map((h) => escapeValue(row[h] || "")).join(","));
  return [headerLine, ...rowLines].join("\n");
}

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
    return await res.text();
  } catch (err) {
    clearTimeout(id);
    return null;
  }
}

async function findMapOnWebsite(domain) {
  if (!domain || typeof domain !== "string" || !domain.trim()) return null;
  let cleanDomain = domain.trim().replace(/^https?:\/\//i, "").replace(/\/+$/, "");
  const protocolList = [`https://${cleanDomain}`, `http://${cleanDomain}`, `https://www.${cleanDomain}`, `http://www.${cleanDomain}`];

  for (const baseUrl of protocolList) {
    try {
      const homeHtml = await fetchWithTimeout(baseUrl);
      if (homeHtml) {
        const mapUrl = extractMapUrl(homeHtml);
        if (mapUrl) {
          return { mapUrl, pageUrl: baseUrl };
        }

        // Check contact links
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
          let fullContactUrl = (subLink.startsWith("http://") || subLink.startsWith("https://"))
            ? subLink
            : `${baseUrl}/${subLink.replace(/^\/+/, "")}`;
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
  const inputFile = process.argv[2] ? path.resolve(process.cwd(), process.argv[2]) : path.resolve(__dirname, "../institutions.csv");
  const outputFile = process.argv[3] ? path.resolve(process.cwd(), process.argv[3]) : path.resolve(__dirname, "../institutions_with_maps.csv");

  if (!fs.existsSync(inputFile)) {
    console.error(`Input file not found at: ${inputFile}`);
    process.exit(1);
  }

  console.log(`Reading CSV from: ${inputFile}`);
  const content = fs.readFileSync(inputFile, "utf-8");
  const { headers, rows } = parseCsv(content);

  if (rows.length === 0) {
    console.log("No rows found in CSV.");
    return;
  }

  // Ensure 'googleMapsUrl' header exists
  if (!headers.includes("googleMapsUrl")) {
    headers.push("googleMapsUrl");
  }

  console.log(`Found ${rows.length} rows to process...`);

  let foundCount = 0;
  let notFoundCount = 0;

  // Process rows in chunks with concurrency
  const CONCURRENCY = 5;
  for (let i = 0; i < rows.length; i += CONCURRENCY) {
    const chunk = rows.slice(i, i + CONCURRENCY);
    await Promise.all(
      chunk.map(async (row, idx) => {
        const rowIndex = i + idx + 1;
        const domain = row.domain || row.website || row.url || row.Website || row.Domain || "";
        const name = row.instituteName || row.name || row.InstituteName || `Row ${rowIndex}`;

        console.log(`[${rowIndex}/${rows.length}] Visiting website for "${name}" -> ${domain || "(No domain)"}`);

        if (domain) {
          const result = await findMapOnWebsite(domain);
          if (result && result.mapUrl) {
            console.log(`  -> [FOUND MAP] on ${result.pageUrl}: ${result.mapUrl.slice(0, 75)}...`);
            row.googleMapsUrl = result.mapUrl;
            foundCount++;
          } else {
            console.log(`  -> (No map embed found on website)`);
            notFoundCount++;
          }
        } else {
          notFoundCount++;
        }
      })
    );
  }

  const outputCsv = stringifyCsv(headers, rows);
  fs.writeFileSync(outputFile, outputCsv, "utf-8");

  console.log("\n==========================================");
  console.log(`Scraping & Embedding Complete!`);
  console.log(`Total Rows Processed: ${rows.length}`);
  console.log(`Google Maps Found: ${foundCount}`);
  console.log(`No Map Found: ${notFoundCount}`);
  console.log(`Saved output to: ${outputFile}`);
  console.log("==========================================");
}

main().catch((err) => {
  console.error("Error running CSV scraper:", err);
  process.exit(1);
});
