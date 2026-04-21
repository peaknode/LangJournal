"use client";

import { Typography } from "@langjournal/ui/components/typography";

export const ChatDetailPanel = () => {
  return (
    <div className="bg-[#F1F1ED] h-full flex-[0.4]">
      {/* context */}
      <div>
        <Typography variant="label-sm">CURRENCT CONTEXT</Typography>
      </div>

      {/* grammar */}
      <div>
        <Typography variant="label-sm">GRAMMAR HEALTH</Typography>
      </div>
    </div>
  );
};
