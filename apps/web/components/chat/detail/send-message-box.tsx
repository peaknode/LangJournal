"use client";

import { Button } from "@langjournal/ui/components/button";
import { Icon } from "@langjournal/ui/components/icon";
import { Input } from "@langjournal/ui/components/input";

export const SendMessageBox = () => {
  return (
    <div className="flex items-center bg-white rounded-lg h-23 px-6 gap-2">
      <Input className="flex-11" placeholder="Message Scribe AI..." />
      <Button className="w-14 h-14 rounded-full flex items-center justify-center">
        <Icon name="send" alt="Send Icon" />
      </Button>
    </div>
  );
};
