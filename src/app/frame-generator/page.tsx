"use client";

import { SidebarLayout } from "@/components/SidebarLayout";
import { FrameGeneratorTool } from "@/components/FrameGeneratorTool";

export default function FrameGeneratorPage() {
  return (
    <SidebarLayout>
      <div className="max-w-7xl mx-auto">
        <FrameGeneratorTool />
      </div>
    </SidebarLayout>
  );
}
