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

  // Google Drive Integration States
  const [isUploadingDrive, setIsUploadingDrive] = useState(false);
  const [driveConfigStatus, setDriveConfigStatus] = useState<{
    isConfigured: boolean;
    message: string;
    folderId?: string;
    clientEmail?: string;
  } | null>(null);
  const [showDriveSetupModal, setShowDriveSetupModal] = useState(false);
  const [driveUploadResult, setDriveUploadResult] = useState<{
    folderLink: string;
    folderName: string;
    uploadedFiles: { id: string; name: string; webViewLink?: string }[];
  } | null>(null);
  const [driveError, setDriveError] = useState<string | null>(null);

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

  // Fetch Google Drive status on mount
  useEffect(() => {
    fetch("/api/drive/status")
      .then((res) => res.json())
      .then((data) => setDriveConfigStatus(data))
      .catch(() =>
        setDriveConfigStatus({
          isConfigured: false,
          message: "Google Drive স্ট্যাটাস লোড করা সম্ভব হয়নি।",
        })
      );
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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processImageFile(e.dataTransfer.files[0]);
    }
  };

  // Re-render all canvas targets with ultra-crisp high-DPI
  const renderAllCanvases = useCallback(() => {
    CANVAS_SPECS.forEach((spec) => {
      const canvas = canvasRefs.current[spec.name];
      if (!canvas) return;

      const baseW = spec.width;
      const baseH = spec.height;
      const scaleFactor = dpiScale;

      // Internal resolution = base * dpiScale
      canvas.width = baseW * scaleFactor;
      canvas.height = baseH * scaleFactor;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // High-quality downsampling & upsampling filtering
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      // Scale coordinates so math uses standard base dimensions
      ctx.save();
      ctx.scale(scaleFactor, scaleFactor);

      // Clear previous canvas
      ctx.clearRect(0, 0, baseW, baseH);

      if (spec.isBanner) {
        // --- 230x50 BANNER RENDERING (Logo + Org Name + Address) ---
        // 1. Draw crisp solid background
        ctx.fillStyle = bannerBgColor || "#ffffff";
        ctx.fillRect(0, 0, baseW, baseH);

        // 2. Draw Logo in Banner
        let currentX = logoPadding;
        if (logoImg) {
          const availH = baseH - logoPadding * 2;
          const maxW = bannerLogoWidth;

          // Proportional fit
          const scale = Math.min(maxW / logoImg.naturalWidth, availH / logoImg.naturalHeight);
          const drawW = logoImg.naturalWidth * scale;
          const drawH = logoImg.naturalHeight * scale;

          const drawY = (baseH - drawH) / 2;

          ctx.drawImage(logoImg, logoPadding, drawY, drawW, drawH);
          currentX = logoPadding + drawW + textLeftGap;
        } else {
          // Placeholder box for logo
          const placeholderW = 28;
          const placeholderH = 28;
          const drawY = (baseH - placeholderH) / 2;

          ctx.strokeStyle = "#cbd5e1";
          ctx.lineWidth = 1;
          ctx.strokeRect(logoPadding, drawY, placeholderW, placeholderH);

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

  // 1-Click Upload all to Google Drive
  const uploadAllToGoogleDrive = async () => {
    setDriveError(null);
    setIsUploadingDrive(true);

    try {
      const filesPayload: { name: string; mimeType: string; base64Data: string }[] = [];

      for (const spec of CANVAS_SPECS) {
        const canvas = canvasRefs.current[spec.name];
        if (!canvas) continue;

        const quality = spec.format === "image/jpeg" ? 1.0 : undefined;
        const dataUrl = canvas.toDataURL(spec.format, quality);

        filesPayload.push({
          name: `${spec.name}${spec.ext}`,
          mimeType: spec.format,
          base64Data: dataUrl,
        });
      }

      const folderName = `${orgName.trim() || "Images"} - Logos (${new Date().toLocaleDateString("en-CA")})`;

      const res = await fetch("/api/drive/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          folderName,
          files: filesPayload,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        if (data.needConfig) {
          setShowDriveSetupModal(true);
        }
        throw new Error(data.error || "Google Drive এ আপলোড সম্পন্ন করা যায়নি।");
      }

      setDriveUploadResult({
        folderLink: data.folderLink,
        folderName: data.folderName,
        uploadedFiles: data.uploadedFiles || [],
      });
    } catch (err: any) {
      console.error("Google Drive Upload Error:", err);
      setDriveError(err?.message || "Google Drive এ আপলোড করতে সমস্যা হয়েছে।");
    } finally {
      setIsUploadingDrive(false);
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
      <div className="rounded-2xl bg-gradient-to-r from-blue-600/10 via-indigo-500/10 to-blue-600/10 dark:from-blue-900/30 dark:via-slate-900 dark:to-indigo-950/40 p-6 border border-blue-500/20 shadow-sm backdrop-blur-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                High-DPI Super-Sampled Crisp Rendering
              </span>

              {driveConfigStatus?.isConfigured ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                  <svg className="w-3 h-3 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Google Drive Connected
                </span>
              ) : (
                <button
                  onClick={() => setShowDriveSetupModal(true)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 transition-colors"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  Google Drive সেটআপ প্রয়োজন
                </button>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-50 tracking-tight font-display">
              Smart Logo & Asset Resizer
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
              Upload a single logo to instantly render all 5 standard image sizes. The logo aspect ratio is
              strictly preserved without distortion. Customize the 230×50 banner with English or Bangla typography
              and export or upload directly to Google Drive.
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
                      ? "bg-blue-600 text-white shadow-sm"
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
              <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Load Demo</span>
            </button>

            {/* Google Drive Upload Button */}
            <button
              onClick={uploadAllToGoogleDrive}
              disabled={isUploadingDrive}
              className="px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/30 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
              title="১ ক্লিকে সব ছবি গুগল ড্রাইভে ফোল্ডার তৈরি করে আপলোড করুন"
            >
              {isUploadingDrive ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  <span>ড্রাইভে আপলোড হচ্ছে...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 87.3 78 77" fill="currentColor">
                    <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8H0c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
                    <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44c-.8 1.4-1.2 2.95-1.2 4.5h27.5z" fill="#00ac47"/>
                    <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
                    <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
                    <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
                    <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
                  </svg>
                  <span>Google Drive এ আপলোড</span>
                </>
              )}
            </button>

            {/* ZIP Download Button */}
            <button
              onClick={downloadAllZip}
              disabled={isZipGenerating}
              className="px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
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
                  <span>ZIP ডাউনলোড</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Drive Error Banner */}
      {driveError && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 flex items-center justify-between gap-4 text-sm">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 flex-shrink-0 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{driveError}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDriveSetupModal(true)}
              className="px-3 py-1 text-xs font-semibold rounded-lg bg-red-600 text-white hover:bg-red-500"
            >
              সেটআপ গাইড দেখুন
            </button>
            <button onClick={() => setDriveError(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Grid: Upload & Controls + Live Previews */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Upload & Customization Controls */}
        <div className="lg:col-span-5 space-y-6">
          {/* Upload Card */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-500/15 text-blue-600 dark:text-blue-400 text-xs font-bold">
                1
              </span>
              <span>Upload Source Logo</span>
            </h2>

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${
                isDragging
                  ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/30"
                  : "border-slate-300 dark:border-slate-700 hover:border-blue-400 bg-slate-50/50 dark:bg-slate-950/50"
              }`}
            >
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />

              {logoSrc ? (
                <div className="space-y-3">
                  <div className="w-20 h-20 mx-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-1 flex items-center justify-center overflow-hidden shadow-inner">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={logoSrc} alt="Uploaded logo preview" className="max-w-full max-h-full object-contain" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      {logoImg ? `${logoImg.naturalWidth} × ${logoImg.naturalHeight} px loaded` : "Image Loaded"}
                    </p>
                    <p className="text-[11px] text-blue-600 dark:text-blue-400 mt-0.5">
                      Click or drop a different file to replace
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="w-12 h-12 mx-auto rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    Click to upload or drag & drop logo
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    PNG, JPG, SVG, WebP (Transparent PNG recommended)
                  </p>
                </div>
              )}
            </div>

            {/* Inner Padding Slider */}
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 mb-1">
                <span>Icon Inner Margin / Padding:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{iconPaddingPercent}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="25"
                step="1"
                value={iconPaddingPercent}
                onChange={(e) => setIconPaddingPercent(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 block">
                Controls internal whitespace inside 32, 82, 150, 162 canvases.
              </span>
            </div>
          </div>

          {/* Banner 230x50 Typography & Text Customizer */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 text-xs font-bold">
                  2
                </span>
                <span>230×50 Banner Header Settings</span>
              </h2>
              <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 border border-indigo-200/50">
                230×50 JPG
              </span>
            </div>

            {/* Name Input & Font */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Organization / Institute Name (English or Bangla)
                </label>
                <input
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="e.g. Imperial IT Solution"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Name Font Family
                  </label>
                  <select
                    value={nameFont}
                    onChange={(e) => setNameFont(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {AVAILABLE_FONTS.map((f) => (
                      <option key={f.label} value={f.value}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Font Size ({nameSize}px)
                    </label>
                    <input
                      type="range"
                      min="10"
                      max="18"
                      step="1"
                      value={nameSize}
                      onChange={(e) => setNameSize(Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsNameBold(!isNameBold)}
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-all ${
                        isNameBold
                          ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                          : "border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                      title="Toggle Bold"
                    >
                      B
                    </button>
                    <input
                      type="color"
                      value={nameColor}
                      onChange={(e) => setNameColor(e.target.value)}
                      className="w-7 h-7 rounded border border-slate-300 dark:border-slate-700 cursor-pointer bg-transparent"
                      title="Name Color"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Address Input & Font */}
            <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Address / Subtitle (English or Bangla)
                </label>
                <input
                  type="text"
                  value={orgAddress}
                  onChange={(e) => setOrgAddress(e.target.value)}
                  placeholder="e.g. Dhanmondi, Dhaka-1205"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Address Font Family
                  </label>
                  <select
                    value={addressFont}
                    onChange={(e) => setAddressFont(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {AVAILABLE_FONTS.map((f) => (
                      <option key={f.label} value={f.value}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Font Size ({addressSize}px)
                  </label>
                  <input
                    type="range"
                    min="7"
                    max="14"
                    step="1"
                    value={addressSize}
                    onChange={(e) => setAddressSize(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                </div>
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
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
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
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
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
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-500/15 text-blue-600 dark:text-blue-400 text-xs font-bold">
                    3
                  </span>
                  <span>Live Canvas Previews & Export</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Rendered at high-resolution {dpiScale}x DPI with subpixel text clarity.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowDriveSetupModal(true)}
                  className="text-xs text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 underline decoration-dotted"
                >
                  গুগল ড্রাইভ সেটআপ গাইড
                </button>
                <span className="text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-lg">
                  {dpiScale}x DPI Active ({dpiScale === 1 ? "Standard" : dpiScale === 2 ? "Retina HD" : "Ultra HD"})
                </span>
              </div>
            </div>

            {/* List of Canvas Cards */}
            <div className="space-y-4">
              {CANVAS_SPECS.map((spec) => (
                <div
                  key={spec.name}
                  className="rounded-xl border border-slate-200 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-950/50 p-4 transition-all hover:border-blue-500/40 hover:shadow-md"
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
                              ? "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20"
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
                      {/* Live Canvas Element */}
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
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-200 hover:bg-blue-600 hover:text-white dark:bg-slate-800 dark:hover:bg-blue-600 text-slate-800 dark:text-slate-200 transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
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

      {/* Google Drive Upload Success Modal */}
      {driveUploadResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 animate-scale-up">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    গুগল ড্রাইভে আপলোড সফল হয়েছে!
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    সবগুলো সাইজের ইমেজ ড্রাইভে নতুন ফোল্ডারে সেভ করা হয়েছে।
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDriveUploadResult(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="text-xs font-semibold text-slate-600 dark:text-slate-400">ফোল্ডার নাম:</div>
              <div className="text-sm font-medium text-slate-900 dark:text-slate-100 flex items-center gap-2">
                📁 {driveUploadResult.folderName}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 pt-1">
                আপলোডকৃত ফাইল: {driveUploadResult.uploadedFiles.length} টি (32.png, 82.png, 150.png, 162.png, 230.jpg)
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <a
                href={driveUploadResult.folderLink}
                target="_blank"
                rel="noreferrer"
                className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-semibold text-center flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
              >
                <span>গুগল ড্রাইভে ফোল্ডারটি খুলুন</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>

              <button
                onClick={() => setDriveUploadResult(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Google Drive Setup Guide Modal (Bangla Step-by-Step) */}
      {showDriveSetupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                  <svg className="w-6 h-6" viewBox="0 0 87.3 78 77" fill="currentColor">
                    <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8H0c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
                    <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44c-.8 1.4-1.2 2.95-1.2 4.5h27.5z" fill="#00ac47"/>
                    <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
                    <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
                    <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
                    <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    Google Drive কানেক্ট করার স্টেপ-বাই-স্টেপ গাইড
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    মাত্র ৪টি সহজ ধাপে Google Drive Service Account যুক্ত করে ১-ক্লিকে আপলোড চালু করুন।
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDriveSetupModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                ✕
              </button>
            </div>

            {/* Current Status */}
            <div className={`p-4 rounded-xl border text-xs ${
              driveConfigStatus?.isConfigured
                ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 text-emerald-800 dark:text-emerald-200"
                : "bg-amber-50 dark:bg-amber-950/30 border-amber-300 text-amber-800 dark:text-amber-200"
            }`}>
              <div className="font-bold mb-1 flex items-center gap-1.5">
                <span>{driveConfigStatus?.isConfigured ? "✓ বর্তমানে সক্রিয়" : "⚠ কনফিগারেশন অসম্পূর্ণ"}</span>
              </div>
              <p>{driveConfigStatus?.message}</p>
              {driveConfigStatus?.clientEmail && (
                <p className="mt-1 font-mono text-[11px]">ইমেইল: {driveConfigStatus.clientEmail}</p>
              )}
            </div>

            {/* Steps */}
            <div className="space-y-4 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5">
                <div className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">1</span>
                  Google Cloud Console এ Google Drive API Enable করুন
                </div>
                <p>
                  ১. <a href="https://console.cloud.google.com/" target="_blank" rel="noreferrer" className="text-blue-600 underline">Google Cloud Console</a> এ যান এবং একটি Project সিলেক্ট/তৈরি করুন।
                  <br />
                  ২. <b>APIs & Services</b> &gt; <b>Library</b> তে গিয়ে <b>&quot;Google Drive API&quot;</b> লিখে সার্চ করে <b>Enable</b> বাটনে ক্লিক করুন।
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5">
                <div className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">2</span>
                  Service Account তৈরি করুন এবং JSON Key ডাউনলোড করুন
                </div>
                <p>
                  ১. <b>APIs & Services</b> &gt; <b>Credentials</b> &gt; <b>Create Credentials</b> &gt; <b>Service Account</b> এ ক্লিক করুন।
                  <br />
                  ২. নাম দিন (যেমন: <code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded">client-registry-drive</code>) এবং <b>Done</b> করুন।
                  <br />
                  ৩. তৈরিকৃত Service Account এ ক্লিক করে <b>Keys</b> ট্যাবে যান &gt; <b>Add Key</b> &gt; <b>Create new key</b> &gt; <b>JSON</b> সিলেক্ট করে ডাউনলোড করুন।
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5">
                <div className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">3</span>
                  Google Drive এ ফোল্ডার তৈরি করে Service Account কে এক্সেস দিন
                </div>
                <p>
                  ১. আপনার ব্যক্তিগত বা প্রাতিষ্ঠানিক <a href="https://drive.google.com/" target="_blank" rel="noreferrer" className="text-blue-600 underline">Google Drive</a> এ একটি ফোল্ডার তৈরি করুন (যেমন: <b>Client Assets</b>)।
                  <br />
                  ২. ফোল্ডারের <b>Share</b> অপশনে গিয়ে ডাউনলোড করা JSON ফাইলের <b>client_email</b> টি দিয়ে <b>Editor</b> হিসেবে পারমিশন দিন।
                  <br />
                  ৩. ফোল্ডারের URL থেকে Folder ID টি কপি করুন (URL এর <code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded">folders/XXXXX</code> অংশটি)।
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">4</span>
                  প্রজেক্টের <code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded">.env</code> ফাইলে ভ্যালুগুলো যোগ করুন
                </div>
                <div className="p-3 bg-slate-900 text-slate-100 rounded-lg font-mono text-[11px] overflow-x-auto space-y-1">
                  <p className="text-emerald-400"># Google Drive Integration</p>
                  <p>GOOGLE_SERVICE_ACCOUNT_EMAIL=&quot;your-service-account@xxx.iam.gserviceaccount.com&quot;</p>
                  <p>GOOGLE_PRIVATE_KEY=&quot;-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n&quot;</p>
                  <p>GOOGLE_DRIVE_FOLDER_ID=&quot;your_folder_id_here&quot;</p>
                </div>
                <p className="text-[11px] text-slate-500">
                  নোট: JSON ফাইলের পুরো টেক্সট সরাসরি <code className="font-mono">GOOGLE_SERVICE_ACCOUNT_KEY</code> হিসেবেও দেওয়া যাবে।
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => {
                  setShowDriveSetupModal(false);
                  fetch("/api/drive/status")
                    .then((res) => res.json())
                    .then((data) => setDriveConfigStatus(data));
                }}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
              >
                ঠিক আছে / রিফ্রেশ স্ট্যাটাস
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
