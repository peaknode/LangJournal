import { Editor } from "../../components";

export default function Diary() {
  return (
    <main className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
      <h1 className="text-4xl font-bold text-white">Diary Page</h1>

      <div className="w-full h-full tiptap">
        <Editor />
      </div>
    </main>
  );
}
