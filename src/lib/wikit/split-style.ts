// ftml 把 [[module CSS]] 的 <style> 追加在 body 末尾。留在 body 里会随内容一起
// 注水，首帧样式未生效、要闪一下才套上。把它们抽出来交给 React 提升进 <head>。
const STYLE_RE = /<style\b[^>]*>([\s\S]*?)<\/style>/gi;

export function splitBodyStyles(html: string): { body: string; styles: string[] } {
  const styles: string[] = [];
  const body = html.replace(STYLE_RE, (_m, css: string) => {
    const trimmed = css.trim();
    if (trimmed) styles.push(trimmed);
    return '';
  });
  return { body, styles };
}
