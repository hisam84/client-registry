"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import JSZip from "jszip";
import { saveAs } from "file-saver";

interface CanvasSpec {
  name: string;
  width: number;
  height: number;
  format: "image/png" | "image/jpeg";
  ext: ".png" | ".jpg";
  description: string;
  isBanner?: boolean;
}

const CANVAS_SPECS: CanvasSpec[] = [
  {
    name: "32",
    width: 32,
    height: 32,
    format: "image/png",
    ext: ".png",
    description: "Favicon / Micro Icon (32×32 PNG)",
  },
  {
    name: "82",
    width: 82,
    height: 72,
    format: "image/png",
    ext: ".png",
    description: "Header / Sidebar Badge (82×72 PNG)",
  },
  {
    name: "150",
    width: 150,
    height: 150,
    format: "image/png",
    ext: ".png",
    description: "Standard Square Logo (150×150 PNG)",
  },
  {
    name: "162",
    width: 162,
    height: 142,
    format: "image/png",
    ext: ".png",
    description: "Portal Brand Card (162×142 PNG)",
  },
  {
    name: "230",
    width: 230,
    height: 50,
    format: "image/jpeg",
    ext: ".jpg",
    description: "Header Banner with Logo + Name & Address (230×50 JPG)",
    isBanner: true,
  },
];

const AVAILABLE_FONTS = [
  { label: "Hind Siliguri (Bangla - Modern)", value: "'Hind Siliguri', sans-serif" },
  { label: "Noto Sans Bengali (Bangla - Clean)", value: "'Noto Sans Bengali', sans-serif" },
  { label: "Tiro Bangla (Bangla - Classic)", value: "'Tiro Bangla', serif" },
  { label: "Anek Bangla (Bangla - Bold)", value: "'Anek Bangla', sans-serif" },
  { label: "Mina (Bangla - Slim)", value: "'Mina', sans-serif" },
  { label: "Galada (Bangla - Cursive)", value: "'Galada', cursive" },
  { label: "Kalpurush (Bangla - Traditional)", value: "'Kalpurush', 'Hind Siliguri', sans-serif" },
  { label: "SolaimanLipi (Bangla - Official)", value: "'SolaimanLipi', 'Hind Siliguri', sans-serif" },
  { label: "Inter (English - Clean)", value: "'Inter', sans-serif" },
  { label: "Poppins (English - Modern)", value: "'Poppins', sans-serif" },
  { label: "Montserrat (English - Elegant)", value: "'Montserrat', sans-serif" },
  { label: "Playfair Display (English - Luxury Serif)", value: "'Playfair Display', serif" },
];

export function ImageResizerTool() {
  const [logoSrc, setLogoSrc] = useState<string | null>(null);
  const [logoImg, setLogoImg] = useState<HTMLImageElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // DPI Multiplier (1 = Standard, 2 = 2x High-DPI, 3 = 3x Ultra-Crisp)
  const [dpiScale, setDpiScale] = useState<number>(2);

  // 230x50 Banner Settings
  const [orgName, setOrgName] = useState("Imperial IT Solution");
  const [orgAddress, setOrgAddress] = useState("Dhanmondi, Dhaka-1205");
  const [nameFont, setNameFont] = useState("'Hind Siliguri', sans-serif");
  const [addressFont, setAddressFont] = useState("'Hind Siliguri', sans-serif");
  const [nameSize, setNameSize] = useState(13);
  const [addressSize, setAddressSize] = useState(9);
  const [nameColor, setNameColor] = useState("#0f172a");
  const [addressColor, setAddressColor] = useState("#475569");
  const [isNameBold, setIsNameBold] = useState(true);
  const [bannerBgColor, setBannerBgColor] = useState("#ffffff");
  const [logoPadding, setLogoPadding] = useState(4);
  const [textLeftGap, setTextLeftGap] = useState(6);
  const [bannerLogoWidth, setBannerLogoWidth] = useState(42);

  // General Canvas Settings
  const [iconPaddingPercent, setIconPaddingPercent] = useState(0); // 0-20% inner margin
  const [isZipGenerating, setIsZipGenerating] = useState(false);

  const canvasRefs = useRef<{ [key: string]: HTMLCanvasElement | null }>({});
  const bannerZoomCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Load Google Fonts link tag into document head
  useEffect(() => {
    const linkId = "google-fonts-image-tool";
    if (!document.getElementById(linkId)) {
      const link = document.createElement("link");
      link.id = linkId;
      link.rel = "stylesheet";
      link.href =
        "https://fonts.googleapis.com/css2?family=Anek+Bangla:wght@400;600;700&family=Galada&family=Hind+Siliguri:wght@400;500;600;700&family=Inter:wght@400;600;700&family=Mina:wght@400;700&family=Montserrat:wght@400;600;700&family=Noto+Sans+Bengali:wght@400;600;700&family=Playfair+Display:wght@600;700&family=Poppins:wght@400;600;700&family=Tiro+Bangla:ital@0;1&display=swap";
      document.head.appendChild(link);
    }
  }, []);

  // Handle uploaded image file
  const processImageFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file (PNG, JPG, SVG, WebP).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setLogoSrc(result);
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        setLogoImg(img);
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processImageFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processImageFile(e.dataTransfer.files[0]);
    }
  };

  // Re-draw all canvases with high-DPI supersampling & crystal sharpness
  const renderAllCanvases = useCallback(() => {
    if (typeof window === "undefined") return;

    const scaleFactor = Math.max(1, dpiScale);

    CANVAS_SPECS.forEach((spec) => {
      const canvas = canvasRefs.current[spec.name];
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const baseW = spec.width;
      const baseH = spec.height;

      // High DPI internal canvas resolution
      const targetPixelW = Math.round(baseW * scaleFactor);
      const targetPixelH = Math.round(baseH * scaleFactor);

      canvas.width = targetPixelW;
      canvas.height = targetPixelH;

      // Enable maximum quality smoothing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      // Clear canvas
      ctx.clearRect(0, 0, targetPixelW, targetPixelH);

      // Scale context coordinate system to match base dimensions
      ctx.save();
      ctx.scale(scaleFactor, scaleFactor);

      if (spec.isBanner) {
        // --- 230x50 JPG BANNER RENDERING ---
        // 1. Fill solid background (JPG format requires solid background)
        ctx.fillStyle = bannerBgColor || "#ffffff";
        ctx.fillRect(0, 0, baseW, baseH);

        let currentX = logoPadding;
        const bannerH = baseH;

        // 2. Draw Logo if available
        if (logoImg) {
          const maxLogoW = Math.max(10, Math.min(bannerLogoWidth, baseW - 30));
          const maxLogoH = Math.max(10, bannerH - logoPadding * 2);

          // Preserve exact aspect ratio
          const scale = Math.min(maxLogoW / logoImg.naturalWidth, maxLogoH / logoImg.naturalHeight);
          const drawW = logoImg.naturalWidth * scale;
          const drawH = logoImg.naturalHeight * scale;

          const drawX = logoPadding + (maxLogoW - drawW) / 2;
          const drawY = (bannerH - drawH) / 2;

          ctx.drawImage(logoImg, drawX, drawY, drawW, drawH);
          currentX = logoPadding + maxLogoW + textLeftGap;
        } else {
          // Placeholder logo box
          const placeholderW = 36;
          const placeholderH = 36;
          const drawY = (bannerH - placeholderH) / 2;

          ctx.fillStyle = "#f1f5f9";
          ctx.strokeStyle = "#cbd5e1";
          ctx.lineWidth = 1;
          ctx.beginPath();
          if (typeof ctx.roundRect === "function") {
            ctx.roundRect(logoPadding, drawY, placeholderW, placeholderH, 4);
          } else {
            ctx.rect(logoPadding, drawY, placeholderW, placeholderH);
          }
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = "#94a3b8";
          ctx.font = "10px sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("LOGO", logoPadding + placeholderW / 2, drawY + placeholderH / 2);

          currentX = logoPadding + placeholderW + textLeftGap;
        }

        // 3. Draw Text (Name & Address) with Crisp Rendering
        const textMaxW = baseW - currentX - 4;

        // Organization Name
        ctx.textAlign = "left";
        ctx.textBaseline = "alphabetic";
        ctx.fillStyle = nameColor || "#0f172a";
        ctx.font = `${isNameBold ? "bold" : "normal"} ${nameSize}px ${nameFont}`;

        const nameY = 22; // baseline for top line
        ctx.fillText(orgName || "Organization Name", currentX, nameY, textMaxW);

        // Address / Subtitle
        ctx.fillStyle = addressColor || "#475569";
        ctx.font = `normal ${addressSize}px ${addressFont}`;

        const addressY = 39; // baseline for second line
        ctx.fillText(orgAddress || "Address & Details", currentX, addressY, textMaxW);

        ctx.restore();

        // Also update the zoom canvas mirror if present
        if (bannerZoomCanvasRef.current) {
          const zCanvas = bannerZoomCanvasRef.current;
          const zCtx = zCanvas.getContext("2d");
          if (zCtx) {
            zCanvas.width = baseW * 3;
            zCanvas.height = baseH * 3;
            zCtx.imageSmoothingEnabled = true;
            zCtx.imageSmoothingQuality = "high";
            zCtx.drawImage(canvas, 0, 0, zCanvas.width, zCanvas.height);
          }
        }
      } else {
        // --- 32, 82, 150, 162 TRANSPARENT PNG RENDERING ---
        if (logoImg) {
          const padFraction = iconPaddingPercent / 100;
          const availW = baseW * (1 - padFraction * 2);
          const availH = baseH * (1 - padFraction * 2);

          // Fit proportionally (aspect ratio strictly preserved without distortion)
          const scale = Math.min(availW / logoImg.naturalWidth, availH / logoImg.naturalHeight);
          const drawW = logoImg.naturalWidth * scale;
          const drawH = logoImg.naturalHeight * scale;

          // Center precisely in canvas
          const drawX = (baseW - drawW) / 2;
          const drawY = (baseH - drawH) / 2;

          ctx.drawImage(logoImg, drawX, drawY, drawW, drawH);
        } else {
          // Placeholder indicator
          ctx.strokeStyle = "rgba(148, 163, 184, 0.4)";
          ctx.lineWidth = 1;
          ctx.setLineDash([3, 3]);
          ctx.strokeRect(1, 1, baseW - 2, baseH - 2);
          ctx.setLineDash([]);

          ctx.fillStyle = "rgba(148, 163, 184, 0.6)";
          ctx.font = `${Math.max(9, Math.floor(baseW / 7))}px sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(`${baseW}×${baseH}`, baseW / 2, baseH / 2);
        }
        ctx.restore();
      }
    });
  }, [
    logoImg,
    dpiScale,
    orgName,
    orgAddress,
    nameFont,
    addressFont,
    nameSize,
    addressSize,
    nameColor,
    addressColor,
    isNameBold,
    bannerBgColor,
    logoPadding,
    textLeftGap,
    bannerLogoWidth,
    iconPaddingPercent,
  ]);

  // Effect to re-render when fonts or state change
  useEffect(() => {
    if (typeof document !== "undefined" && document.fonts) {
      document.fonts.ready.then(() => {
        renderAllCanvases();
      });
    } else {
      renderAllCanvases();
    }
  }, [renderAllCanvases]);

  // Download single canvas (100% maximum quality)
  const downloadSingle = (spec: CanvasSpec) => {
    const canvas = canvasRefs.current[spec.name];
    if (!canvas) return;

    const quality = spec.format === "image/jpeg" ? 1.0 : undefined;
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        saveAs(blob, `${spec.name}${spec.ext}`);
      },
      spec.format,
      quality
    );
  };

  // Download all as ZIP
  const downloadAllZip = async () => {
    try {
      setIsZipGenerating(true);
      const zip = new JSZip();
      const folder = zip.folder("Images") || zip;

      for (const spec of CANVAS_SPECS) {
        const canvas = canvasRefs.current[spec.name];
        if (!canvas) continue;

        const quality = spec.format === "image/jpeg" ? 1.0 : undefined;
        const blob = await new Promise<Blob | null>((resolve) => {
          canvas.toBlob((b) => resolve(b), spec.format, quality);
        });

        if (blob) {
          folder.file(`${spec.name}${spec.ext}`, blob);
        }
      }

      const zipContent = await zip.generateAsync({ type: "blob" });
      saveAs(zipContent, "Images.zip");
    } catch (err) {
      console.error("Failed to generate ZIP:", err);
      alert("An error occurred while creating ZIP file. Please try again.");
    } finally {
      setIsZipGenerating(false);
    }
  };

  // Quick preset sample logo load
  const loadDefaultPadLogo = () => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      setLogoImg(img);
      setLogoSrc("/Pad.png");
    };
    img.src = "/Pad.png";
  };

  return (
    <div className="w-full space-y-8">
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-brass-600/10 via-amber-500/10 to-brass-600/10 dark:from-brass-900/30 dark:via-slate-900 dark:to-brass-950/40 p-6 border border-brass-500/20 shadow-sm backdrop-blur-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-brass-500/15 text-brass-700 dark:text-brass-300 border border-brass-500/30 mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              High-DPI Super-Sampled Crisp Rendering
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-50 tracking-tight font-display">
              Smart Logo & Asset Resizer
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
              Upload a single logo to instantly render all 5 standard image sizes. The logo aspect ratio is
              strictly preserved without distortion. Customize the 230×50 banner with English or Bangla typography
              and export with ultra-sharp high-DPI quality.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* DPI Scale Selector */}
            <div className="flex items-center gap-1.5 bg-white/80 dark:bg-slate-900/80 p-1.5 rounded-xl border border-slate-300 dark:border-slate-700 shadow-sm">
              <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 px-1.5">DPI:</span>
              {[
                { label: "1x Standard", val: 1 },
                { label: "2x Hi-DPI (Crisp)", val: 2 },
                { label: "3x Ultra HD", val: 3 },
              ].map((item) => (
                <button
                  key={item.val}
                  onClick={() => setDpiScale(item.val)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                    dpiScale === item.val
                      ? "bg-brass-500 text-white shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <button
              onClick={loadDefaultPadLogo}
              className="px-3.5 py-2 text-xs font-medium rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1.5"
              title="Test with the project's default Pad.png logo"
            >
              <svg className="w-4 h-4 text-brass-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Load Demo Logo</span>
            </button>

            <button
              onClick={downloadAllZip}
              disabled={isZipGenerating}
              className="px-5 py-2.5 text-xs sm:text-sm font-semibold rounded-xl bg-gradient-to-r from-brass-600 to-amber-600 hover:from-brass-500 hover:to-amber-500 text-white shadow-lg shadow-brass-600/20 hover:shadow-brass-600/30 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
            >
              {isZipGenerating ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  <span>Generating ZIP...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span>Download All (Images.zip)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Upload & Controls + Live Previews */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Upload & Customization Controls */}
        <div className="lg:col-span-5 space-y-6">
          {/* Upload Card */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-brass-500/15 text-brass-600 dark:text-brass-400 text-xs font-bold">
                1
              </span>
              <span>Upload Master Logo</span>
            </h2>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${
                isDragging
                  ? "border-brass-500 bg-brass-500/10"
                  : "border-slate-300 dark:border-slate-700 hover:border-brass-400 dark:hover:border-brass-600 bg-slate-50/50 dark:bg-slate-950/40"
              }`}
            >
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />

              {logoSrc ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="relative p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
                    {/* Checkerboard preview for transparency */}
                    <div
                      className="w-20 h-20 rounded-lg flex items-center justify-center overflow-hidden"
                      style={{
                        backgroundImage:
                          "linear-gradient(45deg, #cbd5e1 25%, transparent 25%), linear-gradient(-45deg, #cbd5e1 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #cbd5e1 75%), linear-gradient(-45deg, transparent 75%, #cbd5e1 75%)",
                        backgroundSize: "12px 12px",
                        backgroundPosition: "0 0, 0 6px, 6px -6px, -6px 0px",
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={logoSrc} alt="Uploaded logo" className="max-w-full max-h-full object-contain" />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      ✓ Logo loaded successfully
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Click or drag a new file to replace
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="w-12 h-12 mx-auto rounded-full bg-brass-500/10 text-brass-600 dark:text-brass-400 flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                    Drag and drop logo here or <span className="text-brass-600 dark:text-brass-400 underline">Browse</span>
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">
                    PNG (transparent recommended), JPG, SVG, WebP
                  </p>
                </div>
              )}
            </div>

            {/* Optional Logo Padding for Square & Badge Canvases */}
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
              <div className="flex justify-between items-center text-xs mb-1.5">
                <span className="text-slate-600 dark:text-slate-400">Inner Icon Padding / Margin</span>
                <span className="font-semibold text-brass-600 dark:text-brass-400">{iconPaddingPercent}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="25"
                step="1"
                value={iconPaddingPercent}
                onChange={(e) => setIconPaddingPercent(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-brass-600"
              />
            </div>
          </div>

          {/* 230x50 Banner Settings Card */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-brass-500/15 text-brass-600 dark:text-brass-400 text-xs font-bold">
                  2
                </span>
                <span>230×50 Banner Customizer (JPG)</span>
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                230.jpg
              </span>
            </div>

            {/* Organization Name Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Organization / Institution Name
              </label>
              <input
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="e.g. Imperial IT Solution"
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brass-500/40"
              />
            </div>

            {/* Organization Name Font & Size */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] text-slate-500 dark:text-slate-400">Name Font</label>
                <select
                  value={nameFont}
                  onChange={(e) => setNameFont(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                >
                  {AVAILABLE_FONTS.map((f) => (
                    <option key={f.label} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span>Font Size</span>
                  <span className="font-semibold text-brass-600">{nameSize}px</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="20"
                  step="1"
                  value={nameSize}
                  onChange={(e) => setNameSize(Number(e.target.value))}
                  className="w-full h-1.5 mt-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-brass-600"
                />
              </div>
            </div>

            {/* Name Styling (Color & Bold) */}
            <div className="flex items-center gap-4 pt-1">
              <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isNameBold}
                  onChange={(e) => setIsNameBold(e.target.checked)}
                  className="rounded text-brass-600 focus:ring-brass-500 w-4 h-4"
                />
                <span className="font-semibold">Bold Text</span>
              </label>

              <div className="flex items-center gap-2 ml-auto">
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Color:</span>
                <input
                  type="color"
                  value={nameColor}
                  onChange={(e) => setNameColor(e.target.value)}
                  className="w-7 h-7 rounded border border-slate-300 dark:border-slate-700 cursor-pointer bg-transparent p-0"
                />
              </div>
            </div>

            <hr className="border-slate-200 dark:border-slate-800" />

            {/* Address Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Address / Subtitle
              </label>
              <input
                type="text"
                value={orgAddress}
                onChange={(e) => setOrgAddress(e.target.value)}
                placeholder="e.g. Dhanmondi, Dhaka-1205"
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brass-500/40"
              />
            </div>

            {/* Address Font & Size */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] text-slate-500 dark:text-slate-400">Address Font</label>
                <select
                  value={addressFont}
                  onChange={(e) => setAddressFont(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                >
                  {AVAILABLE_FONTS.map((f) => (
                    <option key={f.label} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span>Font Size</span>
                  <span className="font-semibold text-brass-600">{addressSize}px</span>
                </div>
                <input
                  type="range"
                  min="7"
                  max="14"
                  step="1"
                  value={addressSize}
                  onChange={(e) => setAddressSize(Number(e.target.value))}
                  className="w-full h-1.5 mt-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-brass-600"
                />
              </div>
            </div>

            {/* Address Color & Background Color */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-950 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] text-slate-600 dark:text-slate-400">Text Color</span>
                <input
                  type="color"
                  value={addressColor}
                  onChange={(e) => setAddressColor(e.target.value)}
                  className="w-6 h-6 rounded border border-slate-300 dark:border-slate-700 cursor-pointer bg-transparent"
                />
              </div>

              <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-950 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] text-slate-600 dark:text-slate-400">Background</span>
                <input
                  type="color"
                  value={bannerBgColor}
                  onChange={(e) => setBannerBgColor(e.target.value)}
                  className="w-6 h-6 rounded border border-slate-300 dark:border-slate-700 cursor-pointer bg-transparent"
                />
              </div>
            </div>

            {/* Banner Layout Sliders (Logo width & gap) */}
            <div className="grid grid-cols-2 gap-3 pt-2 text-[11px] text-slate-500 dark:text-slate-400">
              <div>
                <div className="flex justify-between mb-1">
                  <span>Logo Max Width</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{bannerLogoWidth}px</span>
                </div>
                <input
                  type="range"
                  min="24"
                  max="60"
                  step="2"
                  value={bannerLogoWidth}
                  onChange={(e) => setBannerLogoWidth(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-brass-600"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span>Logo & Text Spacing</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{textLeftGap}px</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="16"
                  step="1"
                  value={textLeftGap}
                  onChange={(e) => setTextLeftGap(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-brass-600"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: 5 Target Canvas Previews & Single Download Buttons */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-brass-500/15 text-brass-600 dark:text-brass-400 text-xs font-bold">
                    3
                  </span>
                  <span>Live Canvas Previews & Export</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Rendered at high-resolution {dpiScale}x DPI with subpixel text clarity.
                </p>
              </div>

              <span className="text-xs font-semibold text-brass-700 dark:text-brass-300 bg-brass-500/10 border border-brass-500/20 px-2.5 py-1 rounded-lg">
                {dpiScale}x DPI Active ({dpiScale === 1 ? "Standard" : dpiScale === 2 ? "Retina HD" : "Ultra HD"})
              </span>
            </div>

            {/* List of Canvas Cards */}
            <div className="space-y-4">
              {CANVAS_SPECS.map((spec) => (
                <div
                  key={spec.name}
                  className="rounded-xl border border-slate-200 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-950/50 p-4 transition-all hover:border-brass-500/40 hover:shadow-md"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Info */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-slate-900 dark:text-slate-100">
                          {spec.name}
                          {spec.ext}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            spec.ext === ".jpg"
                              ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                              : "bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                          }`}
                        >
                          {spec.width} × {spec.height} {spec.ext.toUpperCase().replace(".", "")}
                        </span>
                        {dpiScale > 1 && (
                          <span className="text-[10px] font-mono text-slate-400">
                            ({spec.width * dpiScale}×{spec.height * dpiScale}px)
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{spec.description}</p>
                    </div>

                    {/* Preview Box & Download Button */}
                    <div className="flex items-center gap-3 self-end sm:self-center">
                      {/* Live Canvas Element (Displayed with CSS size matching base dimension for pixel perfection) */}
                      <div
                        className="p-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center justify-center shadow-inner"
                        style={{
                          backgroundImage:
                            spec.ext === ".png"
                              ? "linear-gradient(45deg, #cbd5e1 25%, transparent 25%), linear-gradient(-45deg, #cbd5e1 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #cbd5e1 75%), linear-gradient(-45deg, transparent 75%, #cbd5e1 75%)"
                              : "none",
                          backgroundSize: "8px 8px",
                          backgroundPosition: "0 0, 0 4px, 4px -4px, -4px 0px",
                        }}
                      >
                        <canvas
                          ref={(el) => {
                            canvasRefs.current[spec.name] = el;
                          }}
                          className="rounded"
                          style={{
                            width: spec.width,
                            height: spec.height,
                            maxWidth: "100%",
                            display: "block",
                          }}
                        />
                      </div>

                      {/* Download Button */}
                      <button
                        onClick={() => downloadSingle(spec)}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-200 hover:bg-brass-500 hover:text-white dark:bg-slate-800 dark:hover:bg-brass-600 text-slate-800 dark:text-slate-200 transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                        title={`Download ${spec.name}${spec.ext}`}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        <span>Download</span>
                      </button>
                    </div>
                  </div>

                  {/* Zoomed banner preview for 230x50 to inspect text quality */}
                  {spec.isBanner && (
                    <div className="mt-3 pt-3 border-t border-slate-200/80 dark:border-slate-800/80">
                      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-1.5">
                        <span>3x Zoomed Live Inspection View:</span>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                          100% Quality JPG • No Blurring
                        </span>
                      </div>
                      <div className="overflow-x-auto p-3 rounded-lg bg-slate-200/60 dark:bg-slate-900/80 flex justify-center">
                        <canvas
                          ref={bannerZoomCanvasRef}
                          className="shadow-md rounded border border-slate-300 dark:border-slate-700 max-w-full"
                          style={{
                            width: 230 * 2.5,
                            height: 50 * 2.5,
                            display: "block",
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
