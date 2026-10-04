"use client";

import React, { useState, useRef, useMemo, useCallback, useEffect } from "react";
import { saveAs } from "file-saver";

// Unit types
type UnitType = "mm" | "in" | "px" | "cm";

interface PresetSize {
  id: string;
  name: string;
  category: "Certificate" | "Marksheet" | "General";
  width: number;
  height: number;
  unit: UnitType;
  description: string;
  orientation: "landscape" | "portrait" | "square";
}

const CANVAS_PRESETS: PresetSize[] = [
  {
    id: "a4-cert",
    name: "A4 Certificate (Landscape)",
    category: "Certificate",
    width: 297,
    height: 210,
    unit: "mm",
    description: "Standard Certificate Paper (297 × 210 mm)",
    orientation: "landscape",
  },
  {
    id: "a4-sheet",
    name: "A4 Marksheet / Transcript (Portrait)",
    category: "Marksheet",
    width: 210,
    height: 297,
    unit: "mm",
    description: "Standard Marksheet / Result Sheet (210 × 297 mm)",
    orientation: "portrait",
  },
  {
    id: "letter-cert",
    name: "US Letter Certificate (Landscape)",
    category: "Certificate",
    width: 11,
    height: 8.5,
    unit: "in",
    description: "US Letter Landscape (11.0 × 8.5 in)",
    orientation: "landscape",
  },
  {
    id: "letter-sheet",
    name: "US Letter Marksheet (Portrait)",
    category: "Marksheet",
    width: 8.5,
    height: 11,
    unit: "in",
    description: "US Letter Portrait (8.5 × 11.0 in)",
    orientation: "portrait",
  },
  {
    id: "legal-cert",
    name: "US Legal Certificate (Landscape)",
    category: "Certificate",
    width: 14,
    height: 8.5,
    unit: "in",
    description: "US Legal Landscape (14.0 × 8.5 in)",
    orientation: "landscape",
  },
  {
    id: "legal-sheet",
    name: "US Legal Marksheet (Portrait)",
    category: "Marksheet",
    width: 8.5,
    height: 14,
    unit: "in",
    description: "US Legal Portrait (8.5 × 14.0 in)",
    orientation: "portrait",
  },
  {
    id: "a3-cert",
    name: "A3 Large Diploma (Landscape)",
    category: "Certificate",
    width: 420,
    height: 297,
    unit: "mm",
    description: "Large Display Diploma (420 × 297 mm)",
    orientation: "landscape",
  },
  {
    id: "a3-sheet",
    name: "A3 Marksheet / Ledger (Portrait)",
    category: "Marksheet",
    width: 297,
    height: 420,
    unit: "mm",
    description: "Comprehensive Ledger / Transcript (297 × 420 mm)",
    orientation: "portrait",
  },
  {
    id: "square-hd",
    name: "HD Square (1080 × 1080 px)",
    category: "General",
    width: 1080,
    height: 1080,
    unit: "px",
    description: "Digital Badge / Square (1080 × 1080 px)",
    orientation: "square",
  },
];

interface ColorTheme {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  accent: string;
}

const COLOR_THEMES: ColorTheme[] = [
  {
    id: "royal-gold",
    name: "Royal Gold & Bronze",
    primary: "#B48222",
    secondary: "#8C5E13",
    accent: "#D4AF37",
  },
  {
    id: "navy-gold",
    name: "Academic Navy & Gold",
    primary: "#0F294A",
    secondary: "#C59B27",
    accent: "#1E3A8A",
  },
  {
    id: "maroon-gold",
    name: "Crimson Maroon & Gold",
    primary: "#6B1D28",
    secondary: "#C59B27",
    accent: "#8B2635",
  },
  {
    id: "emerald-bronze",
    name: "Emerald Green & Bronze",
    primary: "#144A32",
    secondary: "#A67C1E",
    accent: "#1B5E20",
  },
  {
    id: "obsidian-charcoal",
    name: "Classic Monochrome Black",
    primary: "#18181B",
    secondary: "#3F3F46",
    accent: "#71717A",
  },
  {
    id: "sapphire-silver",
    name: "Sapphire Blue & Silver",
    primary: "#1D4ED8",
    secondary: "#64748B",
    accent: "#38BDF8",
  },
];

type BorderStyleType =
  | "royal-guilloche"
  | "vintage-baroque"
  | "modern-geometric"
  | "greek-key"
  | "marksheet-pinstripe"
  | "art-deco"
  | "security-wave"
  | "floral-garland";

interface StyleOption {
  id: BorderStyleType;
  name: string;
  category: "Certificate" | "Marksheet" | "Both";
  description: string;
}

const STYLE_OPTIONS: StyleOption[] = [
  {
    id: "royal-guilloche",
    name: "Royal Guilloche & Rosette",
    category: "Both",
    description: "Classic royal crest with multi-tier intricate guilloche waves & decorative corner rosettes.",
  },
  {
    id: "vintage-baroque",
    name: "Vintage Baroque & Filigree",
    category: "Certificate",
    description: "Victorian ornamental scrolling corner brackets & decorative perimeter ribbon.",
  },
  {
    id: "modern-geometric",
    name: "Modern Geometric Double-Line",
    category: "Both",
    description: "Clean modern dual-band border with faceted 45° corner notches & diamond accents.",
  },
  {
    id: "marksheet-pinstripe",
    name: "Academic Marksheet Pinstripe",
    category: "Marksheet",
    description: "Official transcript border with multi-layer pinstripes, header crest bar & crisp corner ticks.",
  },
  {
    id: "greek-key",
    name: "Greek Key Meander",
    category: "Both",
    description: "Timeless interlocking Hellenic fret pattern along the perimeter with solid corner anchors.",
  },
  {
    id: "art-deco",
    name: "Art Deco Luxury",
    category: "Certificate",
    description: "Stepped geometric 1920s corners with radiating rays and layered chevron framing.",
  },
  {
    id: "security-wave",
    name: "Security Micro-Guilloche",
    category: "Both",
    description: "Fine high-density trigonometric waves ideal for high-security diplomas & transcripts.",
  },
  {
    id: "floral-garland",
    name: "Floral Vine & Botanical",
    category: "Certificate",
    description: "Elegantly curved botanical leaf garlands and floral corner embellishments.",
  },
];

// Helper: convert any unit to millimeters
function toMillimeters(value: number, unit: UnitType, dpi: number = 300): number {
  switch (unit) {
    case "mm":
      return value;
    case "cm":
      return value * 10;
    case "in":
      return value * 25.4;
    case "px":
      return (value / dpi) * 25.4;
  }
}

// Helper: convert millimeters to target unit
function fromMillimeters(mmValue: number, targetUnit: UnitType, dpi: number = 300): number {
  switch (targetUnit) {
    case "mm":
      return parseFloat(mmValue.toFixed(2));
    case "cm":
      return parseFloat((mmValue / 10).toFixed(2));
    case "in":
      return parseFloat((mmValue / 25.4).toFixed(3));
    case "px":
      return Math.round((mmValue / 25.4) * dpi);
  }
}

// Helper: convert unit to pixel at specific DPI
function unitToPixels(value: number, unit: UnitType, dpi: number = 300): number {
  switch (unit) {
    case "in":
      return Math.round(value * dpi);
    case "mm":
      return Math.round((value / 25.4) * dpi);
    case "cm":
      return Math.round((value / 2.54) * dpi);
    case "px":
      return Math.round(value);
  }
}

export function FrameGeneratorTool() {
  // DPI Selection
  const [targetDpi, setTargetDpi] = useState<number>(300);

  // 1. CANVAS / PAGE SIZE STATE
  const [selectedCanvasPreset, setSelectedCanvasPreset] = useState<string>("a4-cert");
  const [canvasWidth, setCanvasWidth] = useState<number>(297);
  const [canvasHeight, setCanvasHeight] = useState<number>(210);
  const [canvasUnit, setCanvasUnit] = useState<UnitType>("mm");
  const [canvasRatioLocked, setCanvasRatioLocked] = useState<boolean>(false);

  // 2. FRAME / BORDER SIZE STATE
  const [frameSizingMode, setFrameSizingMode] = useState<"exact" | "margin">("exact");
  const [frameWidth, setFrameWidth] = useState<number>(275);
  const [frameHeight, setFrameHeight] = useState<number>(190);
  const [frameUnit, setFrameUnit] = useState<UnitType>("mm");
  const [frameRatioLocked, setFrameRatioLocked] = useState<boolean>(false);

  // Frame Alignment & Positioning
  const [isCentered, setIsCentered] = useState<boolean>(true);
  const [frameMarginLeft, setFrameMarginLeft] = useState<number>(11);
  const [frameMarginTop, setFrameMarginTop] = useState<number>(10);

  // Margin Mode State
  const [uniformMargin, setUniformMargin] = useState<number>(12);

  // 3. WATERMARK ENGINE STATE
  const [showWatermark, setShowWatermark] = useState<boolean>(true);
  const [watermarkType, setWatermarkType] = useState<"crest" | "seal" | "star" | "text" | "custom_logo">("crest");
  const [watermarkText, setWatermarkText] = useState<string>("OFFICIAL");
  const [watermarkImage, setWatermarkImage] = useState<string | null>(null);
  const [watermarkSizeMm, setWatermarkSizeMm] = useState<number>(75);
  const [watermarkOpacityPct, setWatermarkOpacityPct] = useState<number>(8);
  const [watermarkOffsetYMm, setWatermarkOffsetYMm] = useState<number>(0);
  const [watermarkOffsetXMm, setWatermarkOffsetXMm] = useState<number>(0);
  const [watermarkRotationDeg, setWatermarkRotationDeg] = useState<number>(0);

  // 4. STYLING & COLORS
  const [styleType, setStyleType] = useState<BorderStyleType>("royal-guilloche");
  const [selectedTheme, setSelectedTheme] = useState<string>("royal-gold");
  const [primaryColor, setPrimaryColor] = useState<string>("#B48222");
  const [secondaryColor, setSecondaryColor] = useState<string>("#8C5E13");
  const [accentColor, setAccentColor] = useState<string>("#D4AF37");
  const [backgroundType, setBackgroundType] = useState<"transparent" | "white" | "parchment">("white");

  // 5. INNER ACCENTS & SLIDERS
  const [strokeThickness, setStrokeThickness] = useState<number>(3);
  const [innerOffsetMm, setInnerOffsetMm] = useState<number>(3);
  const [cornerScale, setCornerScale] = useState<number>(1.0);
  const [showInnerBorder, setShowInnerBorder] = useState<boolean>(true);
  const [showCornerAccents, setShowCornerAccents] = useState<boolean>(true);
  const [showTopCrest, setShowTopCrest] = useState<boolean>(true);
  const [showBottomSeal, setShowBottomSeal] = useState<boolean>(false);

  // 6. SAMPLE MOCK OVERLAY
  const [sampleMockType, setSampleMockType] = useState<"none" | "certificate" | "marksheet">("certificate");

  // 7. FIGMA-STYLE ARTBOARD VIEWPORT CONTROLS
  const [zoomLevel, setZoomLevel] = useState<number>(1.0); // 0.2 to 4.0
  const [panPosition, setPanPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanMode, setIsPanMode] = useState<boolean>(false);

  // Export State
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);

  // Auto-center handler
  const autoCenter = useCallback(() => {
    const cW_mm = toMillimeters(canvasWidth, canvasUnit, targetDpi);
    const cH_mm = toMillimeters(canvasHeight, canvasUnit, targetDpi);
    const fW_mm = toMillimeters(frameWidth, frameUnit, targetDpi);
    const fH_mm = toMillimeters(frameHeight, frameUnit, targetDpi);

    const diffX = Math.max(0, (cW_mm - fW_mm) / 2);
    const diffY = Math.max(0, (cH_mm - fH_mm) / 2);

    const leftInUnit = fromMillimeters(diffX, frameUnit, targetDpi);
    const topInUnit = fromMillimeters(diffY, frameUnit, targetDpi);

    setFrameMarginLeft(leftInUnit);
    setFrameMarginTop(topInUnit);
    setIsCentered(true);
  }, [canvasWidth, canvasHeight, canvasUnit, frameWidth, frameHeight, frameUnit, targetDpi]);

  // Handle Preset selection
  const handlePresetSelect = (presetId: string) => {
    setSelectedCanvasPreset(presetId);
    if (presetId === "custom") return;

    const p = CANVAS_PRESETS.find((item) => item.id === presetId);
    if (p) {
      setCanvasWidth(p.width);
      setCanvasHeight(p.height);
      setCanvasUnit(p.unit);
      
      const pW_mm = toMillimeters(p.width, p.unit, targetDpi);
      const pH_mm = toMillimeters(p.height, p.unit, targetDpi);
      const marginEachSide = p.category === "Marksheet" ? 8 : 12;
      
      const newFw_mm = Math.max(20, pW_mm - marginEachSide * 2);
      const newFh_mm = Math.max(20, pH_mm - marginEachSide * 2);

      setFrameWidth(fromMillimeters(newFw_mm, p.unit, targetDpi));
      setFrameHeight(fromMillimeters(newFh_mm, p.unit, targetDpi));
      setFrameUnit(p.unit);
      setFrameMarginLeft(fromMillimeters(marginEachSide, p.unit, targetDpi));
      setFrameMarginTop(fromMillimeters(marginEachSide, p.unit, targetDpi));
      setIsCentered(true);

      setWatermarkSizeMm(Math.min(newFw_mm, newFh_mm) * 0.45);

      if (p.category === "Marksheet") {
        setStyleType("marksheet-pinstripe");
        setSampleMockType("marksheet");
        setWatermarkType("seal");
      } else if (p.category === "Certificate") {
        setStyleType("royal-guilloche");
        setSampleMockType("certificate");
        setWatermarkType("crest");
      }
    }
  };

  // Convert layout to canonical SVG coordinates (in Millimeters)
  const layout = useMemo(() => {
    const cW_mm = toMillimeters(canvasWidth, canvasUnit, targetDpi);
    const cH_mm = toMillimeters(canvasHeight, canvasUnit, targetDpi);
    const cW_px = unitToPixels(canvasWidth, canvasUnit, targetDpi);
    const cH_px = unitToPixels(canvasHeight, canvasUnit, targetDpi);

    let fW_mm = 0;
    let fH_mm = 0;
    let fX_mm = 0;
    let fY_mm = 0;

    if (frameSizingMode === "margin") {
      fX_mm = uniformMargin;
      fY_mm = uniformMargin;
      fW_mm = Math.max(10, cW_mm - uniformMargin * 2);
      fH_mm = Math.max(10, cH_mm - uniformMargin * 2);
    } else {
      fW_mm = toMillimeters(frameWidth, frameUnit, targetDpi);
      fH_mm = toMillimeters(frameHeight, frameUnit, targetDpi);

      if (isCentered) {
        fX_mm = Math.max(0, (cW_mm - fW_mm) / 2);
        fY_mm = Math.max(0, (cH_mm - fH_mm) / 2);
      } else {
        fX_mm = toMillimeters(frameMarginLeft, frameUnit, targetDpi);
        fY_mm = toMillimeters(frameMarginTop, frameUnit, targetDpi);
      }
    }

    fW_mm = Math.min(fW_mm, cW_mm);
    fH_mm = Math.min(fH_mm, cH_mm);

    const innerOff_mm = innerOffsetMm;
    const innerX_mm = fX_mm + innerOff_mm;
    const innerY_mm = fY_mm + innerOff_mm;
    const innerW_mm = Math.max(fW_mm - innerOff_mm * 2, 2);
    const innerH_mm = Math.max(fH_mm - innerOff_mm * 2, 2);

    const cornerSize_mm = Math.min(fW_mm, fH_mm) * 0.12 * cornerScale;

    const wmCenterX_mm = fX_mm + fW_mm / 2 + watermarkOffsetXMm;
    const wmCenterY_mm = fY_mm + fH_mm / 2 + watermarkOffsetYMm;

    return {
      cW_mm: parseFloat(cW_mm.toFixed(2)),
      cH_mm: parseFloat(cH_mm.toFixed(2)),
      cW_px,
      cH_px,
      fW_mm: parseFloat(fW_mm.toFixed(2)),
      fH_mm: parseFloat(fH_mm.toFixed(2)),
      fX_mm: parseFloat(fX_mm.toFixed(2)),
      fY_mm: parseFloat(fY_mm.toFixed(2)),
      innerX_mm,
      innerY_mm,
      innerW_mm,
      innerH_mm,
      cornerSize_mm,
      strokeMm: strokeThickness * 0.35,
      wmCenterX_mm,
      wmCenterY_mm,
    };
  }, [
    canvasWidth,
    canvasHeight,
    canvasUnit,
    targetDpi,
    frameSizingMode,
    uniformMargin,
    frameWidth,
    frameHeight,
    frameUnit,
    isCentered,
    frameMarginLeft,
    frameMarginTop,
    innerOffsetMm,
    cornerScale,
    strokeThickness,
    watermarkOffsetXMm,
    watermarkOffsetYMm,
  ]);

  // Keep centered coordinates updated
  useEffect(() => {
    if (isCentered && frameSizingMode === "exact") {
      const cW_mm = toMillimeters(canvasWidth, canvasUnit, targetDpi);
      const cH_mm = toMillimeters(canvasHeight, canvasUnit, targetDpi);
      const fW_mm = toMillimeters(frameWidth, frameUnit, targetDpi);
      const fH_mm = toMillimeters(frameHeight, frameUnit, targetDpi);
      const diffX = Math.max(0, (cW_mm - fW_mm) / 2);
      const diffY = Math.max(0, (cH_mm - fH_mm) / 2);
      setFrameMarginLeft(fromMillimeters(diffX, frameUnit, targetDpi));
      setFrameMarginTop(fromMillimeters(diffY, frameUnit, targetDpi));
    }
  }, [canvasWidth, canvasHeight, canvasUnit, frameWidth, frameHeight, frameUnit, isCentered, frameSizingMode, targetDpi]);

  // Handle Logo Upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setWatermarkImage(event.target?.result as string);
      setWatermarkType("custom_logo");
      setShowWatermark(true);
    };
    reader.readAsDataURL(file);
  };

  // Color Theme selector
  const handleThemeSelect = (themeId: string) => {
    setSelectedTheme(themeId);
    const t = COLOR_THEMES.find((item) => item.id === themeId);
    if (t) {
      setPrimaryColor(t.primary);
      setSecondaryColor(t.secondary);
      setAccentColor(t.accent);
    }
  };

  // Canvas swap orientation
  const toggleCanvasOrientation = () => {
    const tempW = canvasWidth;
    setCanvasWidth(canvasHeight);
    setCanvasHeight(tempW);

    const tempFw = frameWidth;
    setFrameWidth(frameHeight);
    setFrameHeight(tempFw);

    setSelectedCanvasPreset("custom");
  };

  // ===================== FIGMA-STYLE ARTBOARD VIEWPORT HANDLERS =====================
  
  // Zoom In
  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(parseFloat((prev + 0.15).toFixed(2)), 3.5));
  };

  // Zoom Out
  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(parseFloat((prev - 0.15).toFixed(2)), 0.3));
  };

  // Reset View (100% and centered)
  const handleResetView = () => {
    setZoomLevel(1.0);
    setPanPosition({ x: 0, y: 0 });
  };

  // Fit to Viewport
  const handleFitToView = () => {
    setZoomLevel(1.0);
    setPanPosition({ x: 0, y: 0 });
  };

  // Native Non-Passive Wheel Listener to prevent page scrolling/zooming while over the artboard
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    const onNativeWheel = (e: WheelEvent) => {
      // Completely prevent outer browser page from scrolling or zooming
      e.preventDefault();
      e.stopPropagation();

      if (e.ctrlKey || e.metaKey) {
        // Zoom with Ctrl + Scroll
        const zoomFactor = e.deltaY < 0 ? 1.12 : 0.88;
        setZoomLevel((prev) => {
          const next = prev * zoomFactor;
          return Math.min(Math.max(parseFloat(next.toFixed(2)), 0.25), 3.5);
        });
      } else {
        // Natural Pan inside artboard workspace
        setPanPosition((prev) => ({
          x: prev.x - (e.shiftKey ? e.deltaY : e.deltaX),
          y: prev.y - (e.shiftKey ? 0 : e.deltaY),
        }));
      }
    };

    el.addEventListener("wheel", onNativeWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", onNativeWheel);
    };
  }, []);

  // Mouse Down to start Pan / Move Artboard
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only drag on left click or middle click
    if (e.button === 0 || e.button === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - panPosition.x,
        y: e.clientY - panPosition.y,
      });
    }
  };

  // Mouse Move
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setPanPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  // Mouse Up / Leave
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Generate SVG Code
  const getSvgMarkup = useCallback(() => {
    if (!svgRef.current) return "";
    const serializer = new XMLSerializer();
    let source = serializer.serializeToString(svgRef.current);
    if (!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
      source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
    }
    return `<?xml version="1.0" standalone="no"?>\r\n` + source;
  }, []);

  // Download SVG
  const handleDownloadSvg = () => {
    const svgData = getSvgMarkup();
    if (!svgData) return;
    const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const fileName = `certificate-frame-${canvasWidth}x${canvasHeight}${canvasUnit}.svg`;
    saveAs(blob, fileName);
  };

  // Copy SVG Code
  const handleCopySvg = () => {
    const svgData = getSvgMarkup();
    if (!svgData) return;
    navigator.clipboard.writeText(svgData).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2500);
    });
  };

  // Download High-Res PNG / JPG
  const handleDownloadRaster = async (format: "image/png" | "image/jpeg", ext: ".png" | ".jpg") => {
    setIsExporting(true);
    try {
      const svgData = getSvgMarkup();
      const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
      const URL = window.URL || window.webkitURL || window;
      const blobURL = URL.createObjectURL(svgBlob);

      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = layout.cW_px;
        canvas.height = layout.cH_px;
        const ctx = canvas.getContext("2d");

        if (ctx) {
          if (format === "image/jpeg" || backgroundType === "white") {
            ctx.fillStyle = backgroundType === "parchment" ? "#FAF7EE" : "#FFFFFF";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          }
          ctx.drawImage(image, 0, 0, layout.cW_px, layout.cH_px);
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const fileName = `certificate-frame-${layout.cW_px}x${layout.cH_px}px${ext}`;
                saveAs(blob, fileName);
              }
              URL.revokeObjectURL(blobURL);
              setIsExporting(false);
            },
            format,
            0.98
          );
        }
      };
      image.src = blobURL;
    } catch (err) {
      console.error("Export error:", err);
      setIsExporting(false);
    }
  };

  // Quick Print
  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    const svgData = getSvgMarkup();
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Certificate/Marksheet Frame</title>
          <style>
            @page { size: ${layout.cW_mm}mm ${layout.cH_mm}mm; margin: 0; }
            body { margin: 0; padding: 0; display: flex; align-items: center; justify-content: center; width: 100vw; height: 100vh; background: white; }
            svg { width: 100%; height: 100%; object-fit: contain; }
          </style>
        </head>
        <body>
          ${svgData}
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 border border-slate-800 p-6 md:p-8 text-white shadow-xl">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-brass-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-32 -bottom-20 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brass-500/15 border border-brass-500/30 text-brass-400 text-xs font-semibold uppercase tracking-wider mb-3">
              <svg className="w-3.5 h-3.5 text-brass-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
              </svg>
              <span>Figma-Style Artboard Studio</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              <span>Frame & Watermark Designer</span>
              <span className="text-xs font-medium px-2.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Interactive Artboard
              </span>
            </h1>
            <p className="mt-2 text-sm text-slate-300 max-w-2xl leading-relaxed">
              Generate customizable vector border frames with background watermark engine for certificates, diplomas, and transcripts. Pan, drag, and zoom the interactive artboard just like Figma.
            </p>
          </div>

          {/* Quick Action Export Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleDownloadSvg}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-brass-500 to-brass-600 hover:from-brass-600 hover:to-brass-700 text-white font-medium text-xs shadow-lg shadow-brass-500/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>Download SVG</span>
            </button>

            <button
              onClick={() => handleDownloadRaster("image/png", ".png")}
              disabled={isExporting}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-medium text-xs transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{isExporting ? "Rendering..." : "PNG (300 DPI)"}</span>
            </button>

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white font-medium text-xs transition-all"
              title="Direct Print Preview"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              <span>Print</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ===================== LEFT CONTROLS (5 Cols) ===================== */}
        <div className="lg:col-span-5 space-y-5">

          {/* 1. CANVAS / PAGE DIMENSIONS */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="w-5 h-5 rounded-lg bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs">
                  1
                </span>
                <span>Canvas & Page Size</span>
              </h2>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {layout.cW_mm} × {layout.cH_mm} mm
              </span>
            </div>

            {/* Canvas Preset Selector */}
            <div>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
                Paper Preset:
              </label>
              <select
                value={selectedCanvasPreset}
                onChange={(e) => handlePresetSelect(e.target.value)}
                className="w-full text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-brass-500"
              >
                <optgroup label="📜 Certificates (Landscape)">
                  {CANVAS_PRESETS.filter((p) => p.category === "Certificate").map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.width} × {p.height} {p.unit})
                    </option>
                  ))}
                </optgroup>
                <optgroup label="📑 Marksheets & Transcripts (Portrait)">
                  {CANVAS_PRESETS.filter((p) => p.category === "Marksheet").map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.width} × {p.height} {p.unit})
                    </option>
                  ))}
                </optgroup>
                <optgroup label="📐 Other Presets">
                  {CANVAS_PRESETS.filter((p) => p.category === "General").map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.width} × {p.height} {p.unit})
                    </option>
                  ))}
                </optgroup>
                <option value="custom">⚙️ Custom Paper Dimension</option>
              </select>
            </div>

            {/* Custom Canvas Width, Height, Unit, DPI */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div>
                <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">
                  Canvas Width:
                </label>
                <input
                  type="number"
                  step="any"
                  min="1"
                  value={canvasWidth}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    if (canvasRatioLocked && canvasWidth > 0) {
                      setCanvasHeight(parseFloat(((val * canvasHeight) / canvasWidth).toFixed(2)));
                    }
                    setCanvasWidth(val);
                    setSelectedCanvasPreset("custom");
                  }}
                  className="w-full text-xs font-mono font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-2.5 py-2 focus:ring-2 focus:ring-brass-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">
                  Canvas Height:
                </label>
                <input
                  type="number"
                  step="any"
                  min="1"
                  value={canvasHeight}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    if (canvasRatioLocked && canvasHeight > 0) {
                      setCanvasWidth(parseFloat(((val * canvasWidth) / canvasHeight).toFixed(2)));
                    }
                    setCanvasHeight(val);
                    setSelectedCanvasPreset("custom");
                  }}
                  className="w-full text-xs font-mono font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-2.5 py-2 focus:ring-2 focus:ring-brass-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">
                  Unit:
                </label>
                <select
                  value={canvasUnit}
                  onChange={(e) => {
                    setCanvasUnit(e.target.value as UnitType);
                    setSelectedCanvasPreset("custom");
                  }}
                  className="w-full text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-2 py-2 focus:ring-2 focus:ring-brass-500 focus:outline-none"
                >
                  <option value="mm">mm</option>
                  <option value="in">in</option>
                  <option value="cm">cm</option>
                  <option value="px">px</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">
                  DPI:
                </label>
                <select
                  value={targetDpi}
                  onChange={(e) => setTargetDpi(parseInt(e.target.value))}
                  className="w-full text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-2 py-2 focus:ring-2 focus:ring-brass-500 focus:outline-none"
                >
                  <option value={300}>300 DPI</option>
                  <option value={600}>600 DPI</option>
                  <option value={150}>150 DPI</option>
                  <option value={72}>72 DPI</option>
                </select>
              </div>
            </div>

            {/* Helper buttons */}
            <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setCanvasRatioLocked(!canvasRatioLocked)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-all ${
                  canvasRatioLocked
                    ? "bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400 font-semibold"
                    : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>{canvasRatioLocked ? "Locked" : "Lock Ratio"}</span>
              </button>

              <button
                type="button"
                onClick={toggleCanvasOrientation}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                <span>Rotate Canvas</span>
              </button>
            </div>
          </div>

          {/* 2. FRAME / BORDER DIMENSIONS */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="w-5 h-5 rounded-lg bg-brass-500/20 text-brass-600 dark:text-brass-400 flex items-center justify-center font-bold text-xs">
                  2
                </span>
                <span>Frame & Border Size</span>
              </h2>
              <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-brass-500/15 text-brass-700 dark:text-brass-300">
                {layout.fW_mm} × {layout.fH_mm} mm
              </span>
            </div>

            {/* Sizing Mode Switcher */}
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl gap-1">
              <button
                type="button"
                onClick={() => setFrameSizingMode("exact")}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  frameSizingMode === "exact"
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold"
                    : "text-slate-600 dark:text-slate-400"
                }`}
              >
                Exact Frame Size
              </button>
              <button
                type="button"
                onClick={() => setFrameSizingMode("margin")}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  frameSizingMode === "margin"
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold"
                    : "text-slate-600 dark:text-slate-400"
                }`}
              >
                Margin Offset
              </button>
            </div>

            {frameSizingMode === "exact" ? (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">
                      Frame Width:
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="1"
                      value={frameWidth}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        if (frameRatioLocked && frameWidth > 0) {
                          setFrameHeight(parseFloat(((val * frameHeight) / frameWidth).toFixed(2)));
                        }
                        setFrameWidth(val);
                      }}
                      className="w-full text-xs font-mono font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-2.5 py-2 focus:ring-2 focus:ring-brass-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">
                      Frame Height:
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="1"
                      value={frameHeight}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        if (frameRatioLocked && frameHeight > 0) {
                          setFrameWidth(parseFloat(((val * frameWidth) / frameHeight).toFixed(2)));
                        }
                        setFrameHeight(val);
                      }}
                      className="w-full text-xs font-mono font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-2.5 py-2 focus:ring-2 focus:ring-brass-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">
                      Unit:
                    </label>
                    <select
                      value={frameUnit}
                      onChange={(e) => setFrameUnit(e.target.value as UnitType)}
                      className="w-full text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-2 py-2 focus:ring-2 focus:ring-brass-500 focus:outline-none"
                    >
                      <option value="mm">mm</option>
                      <option value="in">in</option>
                      <option value="cm">cm</option>
                      <option value="px">px</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={autoCenter}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all text-xs font-semibold ${
                      isCentered
                        ? "bg-brass-500/15 border-brass-500/40 text-brass-700 dark:text-brass-300"
                        : "border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    <span>{isCentered ? "✓ Auto-Centered in Canvas" : "Center in Canvas"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFrameRatioLocked(!frameRatioLocked)}
                    className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  >
                    {frameRatioLocked ? "🔒 Locked" : "🔓 Unlock"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Margin Offset:</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200 font-semibold">{uniformMargin} mm</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="40"
                  step="1"
                  value={uniformMargin}
                  onChange={(e) => setUniformMargin(parseFloat(e.target.value))}
                  className="w-full accent-brass-500"
                />
              </div>
            )}
          </div>

          {/* 3. WATERMARK ENGINE */}
          <div className="bg-white dark:bg-slate-900 border-2 border-amber-500/30 dark:border-amber-500/30 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="w-5 h-5 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-xs">
                  3
                </span>
                <span>Background Watermark</span>
              </h2>
              
              {/* Enable / Disable Watermark Toggle */}
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={showWatermark}
                  onChange={(e) => setShowWatermark(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                <span className="ml-2 text-xs font-medium text-slate-700 dark:text-slate-300">
                  {showWatermark ? "ON" : "OFF"}
                </span>
              </label>
            </div>

            {showWatermark && (
              <div className="space-y-4 pt-1">
                {/* Watermark Type Selector */}
                <div>
                  <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1.5">
                    Watermark Type:
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                    {[
                      { id: "crest", label: "👑 Crest" },
                      { id: "seal", label: "📜 Seal" },
                      { id: "star", label: "⭐ Star" },
                      { id: "text", label: "🔤 Text" },
                      { id: "custom_logo", label: "📁 Upload" },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setWatermarkType(item.id as any);
                          if (item.id === "custom_logo" && !watermarkImage) {
                            fileInputRef.current?.click();
                          }
                        }}
                        className={`py-1.5 px-2 rounded-lg text-[11px] font-medium border text-center transition-all ${
                          watermarkType === item.id
                            ? "bg-amber-500/15 border-amber-500/50 text-amber-900 dark:text-amber-300 font-semibold"
                            : "border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Text Input if Text selected */}
                {watermarkType === "text" && (
                  <div>
                    <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">
                      Watermark Text:
                    </label>
                    <input
                      type="text"
                      value={watermarkText}
                      onChange={(e) => setWatermarkText(e.target.value)}
                      placeholder="e.g. OFFICIAL / SPECIMEN"
                      className="w-full text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-3 py-2 uppercase tracking-wider"
                    />
                  </div>
                )}

                {/* Custom Logo Upload if Upload selected */}
                {watermarkType === "custom_logo" && (
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-xs font-semibold"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>{watermarkImage ? "Change Logo" : "Upload Logo Image"}</span>
                    </button>
                    {watermarkImage && (
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                        ✓ Logo Loaded
                      </span>
                    )}
                  </div>
                )}

                {/* SLIDERS: Size, Opacity, Vertical Position, Rotation */}
                <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                  
                  {/* 1. Watermark Size */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-600 dark:text-slate-400 font-medium">Watermark Size:</span>
                      <span className="font-mono text-slate-800 dark:text-slate-200 font-semibold">{watermarkSizeMm} mm</span>
                    </div>
                    <input
                      type="range"
                      min="20"
                      max="180"
                      step="2"
                      value={watermarkSizeMm}
                      onChange={(e) => setWatermarkSizeMm(parseFloat(e.target.value))}
                      className="w-full accent-amber-500"
                    />
                  </div>

                  {/* 2. Watermark Opacity */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-600 dark:text-slate-400 font-medium">Opacity:</span>
                      <span className="font-mono text-slate-800 dark:text-slate-200 font-semibold">{watermarkOpacityPct}%</span>
                    </div>
                    <input
                      type="range"
                      min="2"
                      max="40"
                      step="1"
                      value={watermarkOpacityPct}
                      onChange={(e) => setWatermarkOpacityPct(parseInt(e.target.value))}
                      className="w-full accent-amber-500"
                    />
                  </div>

                  {/* 3. Vertical Position (Y-Offset) */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-600 dark:text-slate-400 font-medium">Vertical Position:</span>
                      <span className="font-mono text-slate-800 dark:text-slate-200 font-semibold">
                        {watermarkOffsetYMm === 0 ? "Center" : `${watermarkOffsetYMm > 0 ? "+" : ""}${watermarkOffsetYMm} mm`}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="-60"
                      max="60"
                      step="2"
                      value={watermarkOffsetYMm}
                      onChange={(e) => setWatermarkOffsetYMm(parseFloat(e.target.value))}
                      className="w-full accent-amber-500"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                      <span>Top</span>
                      <button
                        type="button"
                        onClick={() => setWatermarkOffsetYMm(0)}
                        className="text-amber-600 dark:text-amber-400 font-medium hover:underline"
                      >
                        Reset Center
                      </button>
                      <span>Bottom</span>
                    </div>
                  </div>

                  {/* 4. Rotation Angle */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-600 dark:text-slate-400 font-medium">Rotation Angle:</span>
                      <span className="font-mono text-slate-800 dark:text-slate-200 font-semibold">{watermarkRotationDeg}°</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="-90"
                        max="90"
                        step="5"
                        value={watermarkRotationDeg}
                        onChange={(e) => setWatermarkRotationDeg(parseInt(e.target.value))}
                        className="w-full accent-amber-500"
                      />
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => setWatermarkRotationDeg(0)}
                          className="px-2 py-0.5 text-[10px] rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                        >
                          0°
                        </button>
                        <button
                          type="button"
                          onClick={() => setWatermarkRotationDeg(-45)}
                          className="px-2 py-0.5 text-[10px] rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                        >
                          -45°
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 4. BORDER STYLE & COLORS */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-5 h-5 rounded-lg bg-brass-500/15 text-brass-600 dark:text-brass-400 flex items-center justify-center font-bold text-xs">
                4
              </span>
              <span>Border Style & Colors</span>
            </h2>

            {/* Border Style Buttons */}
            <div className="grid grid-cols-2 gap-2">
              {STYLE_OPTIONS.map((style) => (
                <button
                  key={style.id}
                  onClick={() => setStyleType(style.id)}
                  className={`text-left p-2.5 rounded-xl border transition-all ${
                    styleType === style.id
                      ? "border-brass-500 bg-brass-500/10 text-brass-900 dark:text-brass-300 font-semibold ring-1 ring-brass-500"
                      : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  <div className="text-xs font-semibold">{style.name.split(" ")[0]} {style.name.split(" ")[1]}</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{style.description}</div>
                </button>
              ))}
            </div>

            {/* Colors */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div>
                <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">
                  Primary:
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => {
                      setPrimaryColor(e.target.value);
                      setSelectedTheme("custom");
                    }}
                    className="w-6 h-6 rounded cursor-pointer border border-slate-300 dark:border-slate-700 p-0.5 bg-transparent"
                  />
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => {
                      setPrimaryColor(e.target.value);
                      setSelectedTheme("custom");
                    }}
                    className="w-full text-[10px] font-mono rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-1 py-1"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">
                  Accent:
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => {
                      setSecondaryColor(e.target.value);
                      setSelectedTheme("custom");
                    }}
                    className="w-6 h-6 rounded cursor-pointer border border-slate-300 dark:border-slate-700 p-0.5 bg-transparent"
                  />
                  <input
                    type="text"
                    value={secondaryColor}
                    onChange={(e) => {
                      setSecondaryColor(e.target.value);
                      setSelectedTheme("custom");
                    }}
                    className="w-full text-[10px] font-mono rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-1 py-1"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">
                  Paper Fill:
                </label>
                <select
                  value={backgroundType}
                  onChange={(e) => setBackgroundType(e.target.value as any)}
                  className="w-full text-[11px] font-medium rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-1 py-1.5"
                >
                  <option value="transparent">Transparent</option>
                  <option value="white">White</option>
                  <option value="parchment">Parchment</option>
                </select>
              </div>
            </div>

            {/* Stroke Thickness Slider */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-600 dark:text-slate-400 font-medium">Stroke Thickness:</span>
                <span className="font-mono text-slate-700 dark:text-slate-300 font-semibold">{strokeThickness}x</span>
              </div>
              <input
                type="range"
                min="1"
                max="6"
                step="0.5"
                value={strokeThickness}
                onChange={(e) => setStrokeThickness(parseFloat(e.target.value))}
                className="w-full accent-brass-500"
              />
            </div>
          </div>
        </div>

        {/* ===================== RIGHT FIGMA-STYLE ARTBOARD VIEWPORT (7 Cols) ===================== */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Figma Workspace Container */}
          <div className="bg-slate-950 rounded-2xl border border-slate-800 shadow-2xl relative flex flex-col overflow-hidden">
            
            {/* Top Toolbar Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 text-xs text-slate-300 select-none z-20">
              
              {/* Artboard Meta Information */}
              <div className="flex items-center gap-2">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700/60 font-mono text-[11px] text-slate-300">
                  <span className="w-2 h-2 rounded-full bg-blue-400" />
                  <span className="font-semibold">Canvas:</span> {canvasWidth}×{canvasHeight} {canvasUnit}
                </div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700/60 font-mono text-[11px] text-amber-300">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span className="font-semibold">Frame:</span> {frameWidth}×{frameHeight} {frameUnit}
                </div>
              </div>

              {/* Figma Navigation & Zoom Control Toolbar */}
              <div className="flex items-center gap-1 bg-slate-800/90 p-1 rounded-xl border border-slate-700/80">
                {/* Hand / Pan Tool Toggle */}
                <button
                  type="button"
                  onClick={() => setIsPanMode(!isPanMode)}
                  title="Hand Tool (Click & Drag canvas)"
                  className={`p-1.5 rounded-lg transition-all ${
                    isPanMode
                      ? "bg-brass-500 text-white shadow-sm"
                      : "text-slate-400 hover:text-white hover:bg-slate-700"
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
                  </svg>
                </button>

                <div className="w-[1px] h-4 bg-slate-700 mx-0.5" />

                {/* Zoom Out (-) */}
                <button
                  type="button"
                  onClick={handleZoomOut}
                  title="Zoom Out"
                  className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 transition-all"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />
                  </svg>
                </button>

                {/* Zoom Percentage Badge */}
                <button
                  type="button"
                  onClick={handleResetView}
                  title="Click to reset zoom to 100%"
                  className="px-2 py-1 rounded text-[11px] font-mono font-semibold text-slate-200 hover:bg-slate-700 transition-all min-w-[50px] text-center"
                >
                  {Math.round(zoomLevel * 100)}%
                </button>

                {/* Zoom In (+) */}
                <button
                  type="button"
                  onClick={handleZoomIn}
                  title="Zoom In"
                  className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 transition-all"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                </button>

                <div className="w-[1px] h-4 bg-slate-700 mx-0.5" />

                {/* Fit to View */}
                <button
                  type="button"
                  onClick={handleFitToView}
                  title="Fit Artboard to Center"
                  className="px-2 py-1 rounded text-[11px] font-medium text-slate-300 hover:text-white hover:bg-slate-700 transition-all flex items-center gap-1"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                  <span>Fit</span>
                </button>
              </div>

              {/* Sample Mock Switcher */}
              <div className="flex gap-1 bg-slate-800 p-0.5 rounded-lg border border-slate-700">
                <button
                  onClick={() => setSampleMockType("none")}
                  className={`px-2 py-1 rounded text-[10px] font-medium transition-all ${
                    sampleMockType === "none" ? "bg-slate-700 text-white font-semibold" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Only Frame
                </button>
                <button
                  onClick={() => setSampleMockType("certificate")}
                  className={`px-2 py-1 rounded text-[10px] font-medium transition-all ${
                    sampleMockType === "certificate" ? "bg-slate-700 text-white font-semibold" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Certificate Text
                </button>
                <button
                  onClick={() => setSampleMockType("marksheet")}
                  className={`px-2 py-1 rounded text-[10px] font-medium transition-all ${
                    sampleMockType === "marksheet" ? "bg-slate-700 text-white font-semibold" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Marksheet Text
                </button>
              </div>
            </div>

            {/* Interactive Infinite Viewport Area */}
            <div
              ref={viewportRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              className={`w-full h-[580px] md:h-[680px] relative overflow-hidden flex items-center justify-center select-none ${
                isDragging ? "cursor-grabbing" : isPanMode ? "cursor-grab" : "cursor-default"
              }`}
              style={{
                backgroundColor: "#070E1A",
                backgroundImage: "radial-gradient(#334155 1.5px, transparent 1.5px)",
                backgroundSize: "24px 24px",
                overscrollBehavior: "contain",
                touchAction: "none",
              }}
            >
              {/* Pan Hint Overlay */}
              <div className="absolute bottom-3 left-3 z-10 pointer-events-none text-[10px] text-slate-400 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 flex items-center gap-2 shadow-lg">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>💡 Hold <kbd className="px-1 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[9px] text-slate-200">Ctrl</kbd> + Scroll to Zoom • Drag or Scroll to Pan</span>
              </div>

              {/* Transform Container (Handles Zoom & Pan Translation) */}
              <div
                style={{
                  transform: `translate(${panPosition.x}px, ${panPosition.y}px) scale(${zoomLevel})`,
                  transformOrigin: "center center",
                  transition: isDragging ? "none" : "transform 0.12s ease-out",
                }}
                className="relative flex flex-col items-center"
              >
                {/* Figma Artboard Header Tag */}
                <div className="mb-2 flex items-center gap-2 px-3 py-1 rounded-md bg-slate-800/90 text-slate-300 text-[11px] font-mono border border-slate-700 shadow-md">
                  <span className="w-2 h-2 rounded-full bg-brass-400" />
                  <span className="font-semibold text-white">Artboard:</span> {canvasWidth} × {canvasHeight} {canvasUnit}
                  <span className="text-slate-500">({targetDpi} DPI)</span>
                </div>

                {/* The Paper Sheet / Artboard */}
                <div
                  className={`relative rounded-sm shadow-2xl transition-all ${
                    backgroundType === "white"
                      ? "bg-white text-slate-900"
                      : backgroundType === "parchment"
                      ? "bg-[#FAF7EE] text-slate-900"
                      : "bg-slate-900/95 text-white"
                  }`}
                  style={{
                    width: `${layout.cW_mm * 2.2}px`,
                    height: `${layout.cH_mm * 2.2}px`,
                    boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.1)",
                    backgroundImage:
                      backgroundType === "transparent"
                        ? "radial-gradient(#475569 1px, transparent 1px)"
                        : "none",
                    backgroundSize: "16px 16px",
                  }}
                >
                  <svg
                    ref={svgRef}
                    viewBox={`0 0 ${layout.cW_mm} ${layout.cH_mm}`}
                    className="w-full h-full"
                    style={{ shapeRendering: "geometricPrecision" }}
                  >
                    <defs>
                      {/* Primary Linear Gradient */}
                      <linearGradient id="primaryGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={primaryColor} />
                        <stop offset="50%" stopColor={accentColor} />
                        <stop offset="100%" stopColor={secondaryColor} />
                      </linearGradient>

                      {/* Corner Ornaments Pattern Defs */}
                      <g id="rosetteCorner">
                        <path
                          d={`M 0,0 L ${layout.cornerSize_mm},0 C ${layout.cornerSize_mm * 0.7},0 ${layout.cornerSize_mm * 0.4},${layout.cornerSize_mm * 0.15} ${layout.cornerSize_mm * 0.3},${layout.cornerSize_mm * 0.3} C ${layout.cornerSize_mm * 0.15},${layout.cornerSize_mm * 0.4} 0,${layout.cornerSize_mm * 0.7} 0,${layout.cornerSize_mm} Z`}
                          fill="url(#primaryGrad)"
                          opacity="0.22"
                        />
                        <path
                          d={`M ${layout.cornerSize_mm * 0.8},0 A ${layout.cornerSize_mm * 0.8} ${layout.cornerSize_mm * 0.8} 0 0,1 0,${layout.cornerSize_mm * 0.8}`}
                          fill="none"
                          stroke={secondaryColor}
                          strokeWidth={layout.strokeMm * 0.6}
                        />
                        <path
                          d={`M ${layout.cornerSize_mm * 0.5},0 A ${layout.cornerSize_mm * 0.5} ${layout.cornerSize_mm * 0.5} 0 0,1 0,${layout.cornerSize_mm * 0.5}`}
                          fill="none"
                          stroke={accentColor}
                          strokeWidth={layout.strokeMm * 0.4}
                          strokeDasharray="1 0.5"
                        />
                        <polygon
                          points={`0,0 ${layout.cornerSize_mm * 0.25},0 ${layout.cornerSize_mm * 0.12},${layout.cornerSize_mm * 0.12} 0,${layout.cornerSize_mm * 0.25}`}
                          fill={secondaryColor}
                        />
                      </g>

                      {/* Filigree Corner */}
                      <g id="filigreeCorner">
                        <path
                          d={`M 0,0 L ${layout.cornerSize_mm * 0.9},0 Q ${layout.cornerSize_mm * 0.5},${layout.cornerSize_mm * 0.2} ${layout.cornerSize_mm * 0.45},${layout.cornerSize_mm * 0.45} Q ${layout.cornerSize_mm * 0.2},${layout.cornerSize_mm * 0.5} 0,${layout.cornerSize_mm * 0.9} Z`}
                          fill={primaryColor}
                          opacity="0.18"
                        />
                        <path
                          d={`M 0,${layout.cornerSize_mm * 0.8} C ${layout.cornerSize_mm * 0.3},${layout.cornerSize_mm * 0.8} ${layout.cornerSize_mm * 0.8},${layout.cornerSize_mm * 0.3} ${layout.cornerSize_mm * 0.8},0`}
                          fill="none"
                          stroke={secondaryColor}
                          strokeWidth={layout.strokeMm * 0.8}
                        />
                        <circle cx={layout.cornerSize_mm * 0.35} cy={layout.cornerSize_mm * 0.35} r={layout.strokeMm * 1.5} fill={accentColor} />
                      </g>
                    </defs>

                    {/* Background Paper Fill */}
                    {backgroundType === "white" && (
                      <rect x="0" y="0" width={layout.cW_mm} height={layout.cH_mm} fill="#FFFFFF" />
                    )}
                    {backgroundType === "parchment" && (
                      <rect x="0" y="0" width={layout.cW_mm} height={layout.cH_mm} fill="#FAF7EE" />
                    )}

                    {/* ==================== WATERMARK LAYER (Underneath Text) ==================== */}
                    {showWatermark && (
                      <g
                        id="watermark-layer"
                        transform={`translate(${layout.wmCenterX_mm}, ${layout.wmCenterY_mm}) rotate(${watermarkRotationDeg})`}
                        opacity={watermarkOpacityPct / 100}
                        style={{ pointerEvents: "none" }}
                      >
                        {watermarkType === "crest" && (
                          <g transform={`scale(${watermarkSizeMm / 100})`}>
                            <circle cx="0" cy="0" r="48" fill="none" stroke={primaryColor} strokeWidth="1.5" />
                            <circle cx="0" cy="0" r="44" fill="none" stroke={secondaryColor} strokeWidth="1" strokeDasharray="3 1.5" />
                            <circle cx="0" cy="0" r="38" fill="none" stroke={primaryColor} strokeWidth="0.8" />
                            
                            {Array.from({ length: 16 }).map((_, i) => (
                              <line
                                key={i}
                                x1="0"
                                y1="38"
                                x2="0"
                                y2="44"
                                stroke={primaryColor}
                                strokeWidth="1.2"
                                transform={`rotate(${i * 22.5})`}
                              />
                            ))}

                            <polygon
                              points="-22,-20 0,-32 22,-20 18,18 0,30 -18,18"
                              fill="none"
                              stroke={primaryColor}
                              strokeWidth="2"
                            />
                            <polygon
                              points="-16,-14 0,-24 16,-14 13,13 0,22 -13,13"
                              fill={primaryColor}
                              opacity="0.3"
                            />
                            <polygon
                              points="0,-12 3.5,-3.5 12,0 3.5,3.5 0,12 -3.5,3.5 -12,0 -3.5,-3.5"
                              fill={primaryColor}
                            />
                            <circle cx="0" cy="0" r="28" fill="none" stroke={secondaryColor} strokeWidth="0.6" strokeDasharray="2 1" />
                          </g>
                        )}

                        {watermarkType === "seal" && (
                          <g transform={`scale(${watermarkSizeMm / 100})`}>
                            <circle cx="0" cy="0" r="46" fill="none" stroke={primaryColor} strokeWidth="2.5" />
                            <circle cx="0" cy="0" r="42" fill="none" stroke={secondaryColor} strokeWidth="1" strokeDasharray="2 1" />
                            <circle cx="0" cy="0" r="30" fill="none" stroke={primaryColor} strokeWidth="1.5" />
                            <polygon
                              points="0,-20 5.8,-5.8 20,0 5.8,5.8 0,20 -5.8,5.8 -20,0 -5.8,-5.8"
                              fill={primaryColor}
                              opacity="0.4"
                            />
                            <text
                              x="0"
                              y="3"
                              textAnchor="middle"
                              fill={primaryColor}
                              fontFamily="Georgia, serif"
                              fontSize="7"
                              fontWeight="bold"
                              letterSpacing="1"
                            >
                              OFFICIAL
                            </text>
                            <text
                              x="0"
                              y="10"
                              textAnchor="middle"
                              fill={secondaryColor}
                              fontFamily="sans-serif"
                              fontSize="4"
                              letterSpacing="1"
                            >
                              ★ SEAL ★
                            </text>
                          </g>
                        )}

                        {watermarkType === "star" && (
                          <g transform={`scale(${watermarkSizeMm / 100})`}>
                            <polygon
                              points="0,-45 13,-13 45,0 13,13 0,45 -13,13 -45,0 -13,-13"
                              fill={primaryColor}
                              opacity="0.3"
                              stroke={primaryColor}
                              strokeWidth="2"
                            />
                            <polygon
                              points="0,-30 9,-9 30,0 9,9 0,30 -9,9 -30,0 -9,-9"
                              fill="none"
                              stroke={secondaryColor}
                              strokeWidth="1.5"
                              transform="rotate(45)"
                            />
                            <circle cx="0" cy="0" r="14" fill={primaryColor} opacity="0.4" />
                            <circle cx="0" cy="0" r="8" fill="#FFFFFF" opacity="0.6" />
                          </g>
                        )}

                        {watermarkType === "text" && (
                          <g>
                            <text
                              x="0"
                              y="0"
                              textAnchor="middle"
                              dominantBaseline="central"
                              fill={primaryColor}
                              fontFamily="Arial Black, Impact, sans-serif"
                              fontSize={watermarkSizeMm * 0.35}
                              fontWeight="bold"
                              letterSpacing="4"
                            >
                              {watermarkText || "OFFICIAL"}
                            </text>
                          </g>
                        )}

                        {watermarkType === "custom_logo" && watermarkImage && (
                          <image
                            href={watermarkImage}
                            x={-watermarkSizeMm / 2}
                            y={-watermarkSizeMm / 2}
                            width={watermarkSizeMm}
                            height={watermarkSizeMm}
                            preserveAspectRatio="xMidYMid meet"
                          />
                        )}
                      </g>
                    )}

                    {/* ==================== FRAME STYLES LAYER ==================== */}

                    {styleType === "royal-guilloche" && (
                      <g id="royal-guilloche-border">
                        <rect
                          x={layout.fX_mm}
                          y={layout.fY_mm}
                          width={layout.fW_mm}
                          height={layout.fH_mm}
                          fill="none"
                          stroke={primaryColor}
                          strokeWidth={layout.strokeMm * 1.2}
                          rx={0.5}
                        />
                        <rect
                          x={layout.fX_mm - 0.8}
                          y={layout.fY_mm - 0.8}
                          width={layout.fW_mm + 1.6}
                          height={layout.fH_mm + 1.6}
                          fill="none"
                          stroke={secondaryColor}
                          strokeWidth={layout.strokeMm * 0.4}
                          opacity="0.75"
                        />

                        {showInnerBorder && (
                          <>
                            <rect
                              x={layout.innerX_mm}
                              y={layout.innerY_mm}
                              width={layout.innerW_mm}
                              height={layout.innerH_mm}
                              fill="none"
                              stroke={secondaryColor}
                              strokeWidth={layout.strokeMm * 0.6}
                            />
                            <rect
                              x={layout.innerX_mm + 1}
                              y={layout.innerY_mm + 1}
                              width={layout.innerW_mm - 2}
                              height={layout.innerH_mm - 2}
                              fill="none"
                              stroke={primaryColor}
                              strokeWidth={layout.strokeMm * 0.3}
                              opacity="0.6"
                            />
                          </>
                        )}

                        {showCornerAccents && (
                          <>
                            <g transform={`translate(${layout.fX_mm}, ${layout.fY_mm})`}>
                              <use href="#rosetteCorner" />
                            </g>
                            <g transform={`translate(${layout.fX_mm + layout.fW_mm}, ${layout.fY_mm}) scale(-1, 1)`}>
                              <use href="#rosetteCorner" />
                            </g>
                            <g transform={`translate(${layout.fX_mm}, ${layout.fY_mm + layout.fH_mm}) scale(1, -1)`}>
                              <use href="#rosetteCorner" />
                            </g>
                            <g transform={`translate(${layout.fX_mm + layout.fW_mm}, ${layout.fY_mm + layout.fH_mm}) scale(-1, -1)`}>
                              <use href="#rosetteCorner" />
                            </g>
                          </>
                        )}
                      </g>
                    )}

                    {styleType === "vintage-baroque" && (
                      <g id="vintage-baroque-border">
                        <rect
                          x={layout.fX_mm}
                          y={layout.fY_mm}
                          width={layout.fW_mm}
                          height={layout.fH_mm}
                          fill="none"
                          stroke={primaryColor}
                          strokeWidth={layout.strokeMm * 0.9}
                        />
                        {showInnerBorder && (
                          <rect
                            x={layout.innerX_mm}
                            y={layout.innerY_mm}
                            width={layout.innerW_mm}
                            height={layout.innerH_mm}
                            fill="none"
                            stroke={secondaryColor}
                            strokeWidth={layout.strokeMm * 0.5}
                          />
                        )}
                        {showCornerAccents && (
                          <>
                            <g transform={`translate(${layout.fX_mm}, ${layout.fY_mm})`}>
                              <use href="#filigreeCorner" />
                            </g>
                            <g transform={`translate(${layout.fX_mm + layout.fW_mm}, ${layout.fY_mm}) scale(-1, 1)`}>
                              <use href="#filigreeCorner" />
                            </g>
                            <g transform={`translate(${layout.fX_mm}, ${layout.fY_mm + layout.fH_mm}) scale(1, -1)`}>
                              <use href="#filigreeCorner" />
                            </g>
                            <g transform={`translate(${layout.fX_mm + layout.fW_mm}, ${layout.fY_mm + layout.fH_mm}) scale(-1, -1)`}>
                              <use href="#filigreeCorner" />
                            </g>
                          </>
                        )}
                      </g>
                    )}

                    {styleType === "modern-geometric" && (
                      <g id="modern-geometric-border">
                        <path
                          d={`
                            M ${layout.fX_mm + 6},${layout.fY_mm} 
                            L ${layout.fX_mm + layout.fW_mm - 6},${layout.fY_mm} 
                            L ${layout.fX_mm + layout.fW_mm},${layout.fY_mm + 6} 
                            L ${layout.fX_mm + layout.fW_mm},${layout.fY_mm + layout.fH_mm - 6} 
                            L ${layout.fX_mm + layout.fW_mm - 6},${layout.fY_mm + layout.fH_mm} 
                            L ${layout.fX_mm + 6},${layout.fY_mm + layout.fH_mm} 
                            L ${layout.fX_mm},${layout.fY_mm + layout.fH_mm - 6} 
                            L ${layout.fX_mm},${layout.fY_mm + 6} Z
                          `}
                          fill="none"
                          stroke={primaryColor}
                          strokeWidth={layout.strokeMm * 1.0}
                        />
                        {showInnerBorder && (
                          <path
                            d={`
                              M ${layout.innerX_mm + 4},${layout.innerY_mm} 
                              L ${layout.innerX_mm + layout.innerW_mm - 4},${layout.innerY_mm} 
                              L ${layout.innerX_mm + layout.innerW_mm},${layout.innerY_mm + 4} 
                              L ${layout.innerX_mm + layout.innerW_mm},${layout.innerY_mm + layout.innerH_mm - 4} 
                              L ${layout.innerX_mm + layout.innerW_mm - 4},${layout.innerY_mm + layout.innerH_mm} 
                              L ${layout.innerX_mm + 4},${layout.innerY_mm + layout.innerH_mm} 
                              L ${layout.innerX_mm},${layout.innerY_mm + layout.innerH_mm - 4} 
                              L ${layout.innerX_mm},${layout.innerY_mm + 4} Z
                            `}
                            fill="none"
                            stroke={secondaryColor}
                            strokeWidth={layout.strokeMm * 0.4}
                          />
                        )}
                      </g>
                    )}

                    {styleType === "marksheet-pinstripe" && (
                      <g id="marksheet-pinstripe-border">
                        <rect
                          x={layout.fX_mm}
                          y={layout.fY_mm}
                          width={layout.fW_mm}
                          height={layout.fH_mm}
                          fill="none"
                          stroke={primaryColor}
                          strokeWidth={layout.strokeMm * 1.2}
                        />
                        <rect
                          x={layout.fX_mm + 1}
                          y={layout.fY_mm + 1}
                          width={layout.fW_mm - 2}
                          height={layout.fH_mm - 2}
                          fill="none"
                          stroke={primaryColor}
                          strokeWidth={layout.strokeMm * 0.3}
                        />
                        {showInnerBorder && (
                          <rect
                            x={layout.innerX_mm}
                            y={layout.innerY_mm}
                            width={layout.innerW_mm}
                            height={layout.innerH_mm}
                            fill="none"
                            stroke={secondaryColor}
                            strokeWidth={layout.strokeMm * 0.5}
                          />
                        )}
                        {showCornerAccents && (
                          <>
                            <line x1={layout.fX_mm} y1={layout.fY_mm + 5} x2={layout.fX_mm + 5} y2={layout.fY_mm} stroke={primaryColor} strokeWidth={layout.strokeMm * 0.8} />
                            <line x1={layout.fX_mm + layout.fW_mm} y1={layout.fY_mm + 5} x2={layout.fX_mm + layout.fW_mm - 5} y2={layout.fY_mm} stroke={primaryColor} strokeWidth={layout.strokeMm * 0.8} />
                            <line x1={layout.fX_mm} y1={layout.fY_mm + layout.fH_mm - 5} x2={layout.fX_mm + 5} y2={layout.fY_mm + layout.fH_mm} stroke={primaryColor} strokeWidth={layout.strokeMm * 0.8} />
                            <line x1={layout.fX_mm + layout.fW_mm} y1={layout.fY_mm + layout.fH_mm - 5} x2={layout.fX_mm + layout.fW_mm - 5} y2={layout.fY_mm + layout.fH_mm} stroke={primaryColor} strokeWidth={layout.strokeMm * 0.8} />
                          </>
                        )}
                      </g>
                    )}

                    {styleType === "greek-key" && (
                      <g id="greek-key-border">
                        <rect
                          x={layout.fX_mm}
                          y={layout.fY_mm}
                          width={layout.fW_mm}
                          height={layout.fH_mm}
                          fill="none"
                          stroke={primaryColor}
                          strokeWidth={layout.strokeMm * 1.3}
                        />
                        <rect
                          x={layout.innerX_mm}
                          y={layout.innerY_mm}
                          width={layout.innerW_mm}
                          height={layout.innerH_mm}
                          fill="none"
                          stroke={secondaryColor}
                          strokeWidth={layout.strokeMm * 0.6}
                          strokeDasharray="3 1 1 1"
                        />
                        {showCornerAccents && (
                          <>
                            <rect x={layout.fX_mm + 1} y={layout.fY_mm + 1} width={4} height={4} fill={primaryColor} />
                            <rect x={layout.fX_mm + layout.fW_mm - 5} y={layout.fY_mm + 1} width={4} height={4} fill={primaryColor} />
                            <rect x={layout.fX_mm + 1} y={layout.fY_mm + layout.fH_mm - 5} width={4} height={4} fill={primaryColor} />
                            <rect x={layout.fX_mm + layout.fW_mm - 5} y={layout.fY_mm + layout.fH_mm - 5} width={4} height={4} fill={primaryColor} />
                          </>
                        )}
                      </g>
                    )}

                    {styleType === "art-deco" && (
                      <g id="art-deco-border">
                        <rect
                          x={layout.fX_mm}
                          y={layout.fY_mm}
                          width={layout.fW_mm}
                          height={layout.fH_mm}
                          fill="none"
                          stroke={primaryColor}
                          strokeWidth={layout.strokeMm * 1.0}
                        />
                        {showCornerAccents && (
                          <>
                            <path
                              d={`M ${layout.fX_mm},${layout.fY_mm + 8} L ${layout.fX_mm + 3.5},${layout.fY_mm + 8} L ${layout.fX_mm + 3.5},${layout.fY_mm + 3.5} L ${layout.fX_mm + 8},${layout.fY_mm + 3.5} L ${layout.fX_mm + 8},${layout.fY_mm}`}
                              fill="none"
                              stroke={secondaryColor}
                              strokeWidth={layout.strokeMm * 0.7}
                            />
                            <path
                              d={`M ${layout.fX_mm + layout.fW_mm},${layout.fY_mm + 8} L ${layout.fX_mm + layout.fW_mm - 3.5},${layout.fY_mm + 8} L ${layout.fX_mm + layout.fW_mm - 3.5},${layout.fY_mm + 3.5} L ${layout.fX_mm + layout.fW_mm - 8},${layout.fY_mm + 3.5} L ${layout.fX_mm + layout.fW_mm - 8},${layout.fY_mm}`}
                              fill="none"
                              stroke={secondaryColor}
                              strokeWidth={layout.strokeMm * 0.7}
                            />
                          </>
                        )}
                        {showInnerBorder && (
                          <rect
                            x={layout.innerX_mm + 2}
                            y={layout.innerY_mm + 2}
                            width={layout.innerW_mm - 4}
                            height={layout.innerH_mm - 4}
                            fill="none"
                            stroke={accentColor}
                            strokeWidth={layout.strokeMm * 0.4}
                          />
                        )}
                      </g>
                    )}

                    {styleType === "security-wave" && (
                      <g id="security-wave-border">
                        <rect
                          x={layout.fX_mm}
                          y={layout.fY_mm}
                          width={layout.fW_mm}
                          height={layout.fH_mm}
                          fill="none"
                          stroke={primaryColor}
                          strokeWidth={layout.strokeMm * 1.4}
                          strokeDasharray="2 0.8 0.8 0.8"
                        />
                        <rect
                          x={layout.innerX_mm}
                          y={layout.innerY_mm}
                          width={layout.innerW_mm}
                          height={layout.innerH_mm}
                          fill="none"
                          stroke={secondaryColor}
                          strokeWidth={layout.strokeMm * 0.4}
                          strokeDasharray="0.8 0.8"
                        />
                      </g>
                    )}

                    {styleType === "floral-garland" && (
                      <g id="floral-garland-border">
                        <rect
                          x={layout.fX_mm}
                          y={layout.fY_mm}
                          width={layout.fW_mm}
                          height={layout.fH_mm}
                          fill="none"
                          stroke={primaryColor}
                          strokeWidth={layout.strokeMm * 0.8}
                          rx={2}
                        />
                        {showInnerBorder && (
                          <rect
                            x={layout.innerX_mm}
                            y={layout.innerY_mm}
                            width={layout.innerW_mm}
                            height={layout.innerH_mm}
                            fill="none"
                            stroke={secondaryColor}
                            strokeWidth={layout.strokeMm * 0.4}
                            rx={1}
                          />
                        )}
                      </g>
                    )}

                    {/* Top Emblem Crest */}
                    {showTopCrest && (
                      <g transform={`translate(${layout.fX_mm + layout.fW_mm / 2}, ${layout.fY_mm})`}>
                        <polygon
                          points="-6,-1 0,-4 6,-1 4,3 -4,3"
                          fill={primaryColor}
                          stroke={secondaryColor}
                          strokeWidth={layout.strokeMm * 0.3}
                        />
                        <circle cx="0" cy="0" r={1.2} fill={accentColor} />
                      </g>
                    )}

                    {/* Bottom Signature Seal */}
                    {showBottomSeal && (
                      <g transform={`translate(${layout.fX_mm + layout.fW_mm / 2}, ${layout.fY_mm + layout.fH_mm})`}>
                        <circle cx="0" cy="0" r={4.5} fill={primaryColor} stroke={secondaryColor} strokeWidth={layout.strokeMm * 0.4} />
                        <circle cx="0" cy="0" r={3.5} fill="none" stroke={accentColor} strokeWidth={layout.strokeMm * 0.2} strokeDasharray="0.8 0.4" />
                      </g>
                    )}

                    {/* ==================== SAMPLE MOCK TEXT ==================== */}
                    {sampleMockType === "certificate" && (
                      <g id="mock-cert-text" style={{ pointerEvents: "none", userSelect: "none" }}>
                        <text
                          x={layout.fX_mm + layout.fW_mm / 2}
                          y={layout.fY_mm + 15}
                          textAnchor="middle"
                          fill={primaryColor}
                          fontFamily="Georgia, serif"
                          fontSize="3.2"
                          letterSpacing="1"
                          fontWeight="bold"
                        >
                          INSTITUTION OF EXCELLENCE
                        </text>
                        <text
                          x={layout.fX_mm + layout.fW_mm / 2}
                          y={layout.fY_mm + 27}
                          textAnchor="middle"
                          fill={primaryColor}
                          fontFamily="Georgia, serif"
                          fontSize="8"
                          fontStyle="italic"
                          fontWeight="bold"
                        >
                          Certificate of Achievement
                        </text>
                        <text
                          x={layout.fX_mm + layout.fW_mm / 2}
                          y={layout.fY_mm + 37}
                          textAnchor="middle"
                          fill="#64748B"
                          fontFamily="sans-serif"
                          fontSize="2.5"
                          letterSpacing="0.5"
                        >
                          THIS IS PROUDLY PRESENTED TO
                        </text>
                        <text
                          x={layout.fX_mm + layout.fW_mm / 2}
                          y={layout.fY_mm + 50}
                          textAnchor="middle"
                          fill="#0F172A"
                          fontFamily="Georgia, serif"
                          fontSize="6"
                          fontWeight="bold"
                        >
                          HISAM UDDIN
                        </text>
                      </g>
                    )}

                    {sampleMockType === "marksheet" && (
                      <g id="mock-sheet-text" style={{ pointerEvents: "none", userSelect: "none" }}>
                        <text
                          x={layout.fX_mm + layout.fW_mm / 2}
                          y={layout.fY_mm + 12}
                          textAnchor="middle"
                          fill={primaryColor}
                          fontFamily="sans-serif"
                          fontSize="3.8"
                          fontWeight="bold"
                          letterSpacing="0.5"
                        >
                          BOARD OF INTERMEDIATE & SECONDARY EDUCATION
                        </text>
                        <text
                          x={layout.fX_mm + layout.fW_mm / 2}
                          y={layout.fY_mm + 18}
                          textAnchor="middle"
                          fill={secondaryColor}
                          fontFamily="Georgia, serif"
                          fontSize="4.2"
                          fontWeight="bold"
                        >
                          ACADEMIC TRANSCRIPT / MARKSHEET
                        </text>
                      </g>
                    )}
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Export Action Buttons */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <svg className="w-4 h-4 text-brass-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Export Options</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={handleDownloadSvg}
                className="flex flex-col items-start p-3.5 rounded-xl border border-brass-500/40 bg-gradient-to-br from-brass-500/10 to-brass-500/5 hover:from-brass-500/20 hover:to-brass-500/10 text-slate-900 dark:text-white transition-all group"
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="text-xs font-bold text-brass-600 dark:text-brass-400">Vector SVG</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-brass-500/20 text-brass-600 dark:text-brass-300 font-semibold">
                    Vector
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 text-left">
                  Scalable vector graphics with frame and watermark for print & design software.
                </span>
              </button>

              <button
                onClick={() => handleDownloadRaster("image/png", ".png")}
                disabled={isExporting}
                className="flex flex-col items-start p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50 dark:bg-slate-850 text-slate-900 dark:text-white transition-all"
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">PNG (300 DPI)</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold">
                    {layout.cW_px}×{layout.cH_px}px
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 text-left">
                  Crisp 300 DPI high-definition image with transparent background.
                </span>
              </button>

              <button
                onClick={handleCopySvg}
                className="flex flex-col items-start p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50 dark:bg-slate-850 text-slate-900 dark:text-white transition-all"
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="text-xs font-bold text-sky-600 dark:text-sky-400">
                    {copySuccess ? "✓ Copied!" : "Copy SVG Code"}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-600 dark:text-sky-400 font-semibold">
                    Markup
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 text-left">
                  Copy raw SVG vector markup directly to clipboard.
                </span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
