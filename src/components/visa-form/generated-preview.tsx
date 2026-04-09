import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

export type GeneratedPreviewProps = {
  title: string;
  html: string;
};

export function GeneratedPreview({ title, html }: GeneratedPreviewProps) {
  return (
    <Card className="border-border bg-card shadow-none">
      <CardHeader className="border-b border-border pb-3">
        <CardTitle className="text-sm font-semibold text-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="min-h-40 rounded-lg border border-border bg-muted/40">
          <div
            className="min-h-40 p-3 text-sm text-foreground"
            contentEditable
            suppressContentEditableWarning
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
