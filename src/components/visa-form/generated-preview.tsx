import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ReactNode } from "react";

export type GeneratedPreviewProps = {
  title: string;
  html: string;
  footer?: ReactNode;
};

export function GeneratedPreview({ title, html, footer }: GeneratedPreviewProps) {
  return (
    <Card className="border-border bg-card shadow-none">
      <CardHeader className="border-b border-border pb-3">
        <CardTitle className="text-sm font-semibold text-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <ScrollArea className="min-h-40 rounded-lg border border-border bg-muted/40">
          <div
            className="min-h-40 p-3 text-sm text-foreground"
            contentEditable
            suppressContentEditableWarning
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </ScrollArea>
        {footer ? (
          <div className="mt-3 border-t border-border pt-3">
            {footer}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
