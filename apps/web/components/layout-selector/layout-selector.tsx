import { Button } from "@langjournal/ui/components/button"
import { cn } from "@langjournal/ui/lib/utils";
import { LayoutGrid, TextAlignJustify } from "lucide-react"
import { useState } from "react"

interface Props {
    defaultLayout?: 'list' | 'card';
}


export const LayoutSelector = ({
    defaultLayout = 'list'
}: Props) => {
    const [layout, setLayout] = useState<'list' | 'card'>(defaultLayout);

    return (
        <div className="bg-[#E8E8E4] p-0.5 pb-1 rounded-sm flex gap-1">
            {/* 월별 리스트형 */}
            <Button
                variant={layout === 'list' ? 'default' : 'ghost'}
                className={cn(
                    layout === 'list' && 'shadow-[2px_2px_0_black]',
                    'rounded-sm'
                )}
            >
                <TextAlignJustify />
            </Button>

            {/* 카드형 */}
            <Button
                variant={layout === 'card' ? 'default' : 'ghost'}
                className={cn(
                    layout === 'card' && 'shadow-[3px_3px_0_black]',
                    'rounded-sm'
                )}
            >
                <LayoutGrid />
            </Button>
        </div>
    )
}
