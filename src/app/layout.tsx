import type { ReactNode } from "react";
import './globals.css'

export const metadata = {
  title: "意大利申根签证材料AI生成助手",
  description: "签证材料生成平台"
};

export default function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
