"use client";

import { SidebarLayout } from "@/components/SidebarLayout";
import { ImageResizerTool } from "@/components/ImageResizerTool";

export default function ImageToolsPage() {
  return (
    <SidebarLayout>
      <div className="max-w-7xl mx-auto">
        <ImageResizerTool />
      </div>
    </SidebarLayout>
  );
}
