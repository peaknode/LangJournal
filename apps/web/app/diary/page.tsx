import { DiaryList } from "@/components/diary/diary-list";
import { Typography } from "@langjournal/ui/components/typography";

export default function Diary() {
    return (
        // <main className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
        <>
            {/* <h1 className="text-4xl font-bold">Diary Page</h1> */}
            <Typography variant="display-lg" className="mb-4">
                Diary Page
            </Typography>

            <DiaryList entries={[
                {
                    id: '1',
                    title: 'My First Diary Entry',
                    targetText: 'Today I started my language learning journey!',
                    date: '2026-04-19',
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                },
            ]} />

        </>
        // </main>
    );
}
