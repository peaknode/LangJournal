/**
 * FeedbackHighlight 기본 CSS.
 *
 * apps/web의 글로벌 CSS에 주입하거나 <style> 태그로 삽입하세요.
 *
 * @example
 * // Next.js app/layout.tsx
 * import { feedbackStyles } from '@langjournal/editor';
 *
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <head>
 *         <style dangerouslySetInnerHTML={{ __html: feedbackStyles }} />
 *       </head>
 *       <body>{children}</body>
 *     </html>
 *   );
 * }
 */
export const feedbackStyles = `
  .lj-correction {
    text-decoration: underline wavy #ef4444;
    text-underline-offset: 3px;
    cursor: pointer;
  }
  .lj-suggestion {
    text-decoration: underline wavy #f59e0b;
    text-underline-offset: 3px;
    cursor: pointer;
  }
  .lj-active {
    background-color: rgba(207, 252, 0, 0.2);
    border-radius: 2px;
    transition: background-color 150ms ease;
  }
`;
