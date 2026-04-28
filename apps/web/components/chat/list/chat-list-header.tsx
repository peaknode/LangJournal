"use client";

import { Button } from "@langjournal/ui/components/button";
import { Input } from "@langjournal/ui/components/input";
import { Typography } from "@langjournal/ui/components/typography";

export const ChatListHeader = () => {
    return (
        <div>
            <div className="flex items-center justify-between w-full">
                <div>
                    <Typography variant="display-md">Chat & Speak</Typography>
                    <Typography variant="label-sm" className="text-zinc-500">
                        Pick a diary entry - then type or talk with your AI coach.
                    </Typography>
                </div>

                <div className="flex gap-1">
                    <Input placeholder="Search archive..." className="bg-[#E8E8E4] w-56" />
                </div>
            </div>

            <div className="bg-white p-4 rounded-md">
                <div>
                    <Button>
                        <Typography variant="body-sm">
                            ⌨️ TYPE
                        </Typography>
                    </Button>

                    <Button>
                        <Typography variant="body-sm">
                            🎤 SPEAK
                        </Typography>
                    </Button>

                </div>

                <Typography>
                    Inside each conversation you can <b>freely switch</b> between typing and speaking - all messages are saved in the same thread.
                </Typography>
            </div>
        </div>
    );
};
