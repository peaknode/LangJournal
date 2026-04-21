import { entryRepository } from "@/lib/repositories";
import { DiaryEntry } from "@langjournal/core";
import { useEffect, useState } from "react";

export const useEntry = (id: string) => {
  const [entry, setEntry] = useState<DiaryEntry | null>(null);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    entryRepository.findById(id)
      .then((result) => {
        if (result) {
          setEntry(result);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.debug("Error loading entry:", err);
        setLoading(false);
      });
  }, [])

  return { entry, loading };
}
