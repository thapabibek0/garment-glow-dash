import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";

export function ExportButtons({ onCSV, onPDF }: { onCSV: () => void; onPDF: () => void }) {
  return (
    <div className="flex justify-end gap-2">
      <Button variant="outline" size="sm" className="gap-2" onClick={onCSV}>
        <Download className="h-4 w-4" /> CSV
      </Button>
      <Button variant="outline" size="sm" className="gap-2" onClick={onPDF}>
        <FileText className="h-4 w-4" /> PDF
      </Button>
    </div>
  );
}
