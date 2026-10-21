import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'知序 · 雅思答疑',description:'把每一个问题，变成下一步进步。阅读、听力、口语与写作 AI 学习伙伴。',icons:{icon:'/favicon.svg'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="zh-CN"><body>{children}</body></html>}
