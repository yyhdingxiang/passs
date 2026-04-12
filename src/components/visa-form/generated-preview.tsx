import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ReactNode } from "react";

export type GeneratedPreviewProps = {
  title: string;
  html: string;
  footer?: ReactNode;
  onHtmlChange?: (html: string) => void;
};

export function GeneratedPreview({ title, html, footer, onHtmlChange }: GeneratedPreviewProps) {
  return (
    <Card className="border-border bg-card shadow-none">
      <CardHeader className="border-b border-border px-4 pb-3 pt-4 sm:px-6">
        <CardTitle className="text-sm font-semibold text-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-4 sm:px-6 sm:pb-6 sm:pt-5">
        <ScrollArea className="min-h-40 rounded-lg border border-border bg-muted/40">
          <div
            className="min-h-40 p-3 text-sm text-foreground"
            contentEditable
            suppressContentEditableWarning
            dangerouslySetInnerHTML={{ __html: html }}
            onInput={event => onHtmlChange?.(event.currentTarget.innerHTML)}
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
