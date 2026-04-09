import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

export type GeneratedPreviewProps = {
  title: string;
  html: string;
};

export function GeneratedPreview({ title, html }: GeneratedPreviewProps) {
  return (
    <Card className="border-slate-200 bg-white">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="min-h-40 rounded-lg border border-slate-100 bg-slate-50">
          <div
            className="min-h-40 p-3"
            contentEditable
            suppressContentEditableWarning
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
