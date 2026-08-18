//ftml 输出的东西真不是给人看的

const INLINE = new Set([
  'a', 'abbr', 'b', 'bdi', 'bdo', 'br', 'cite', 'code', 'data', 'dfn', 'em',
  'i', 'kbd', 'mark', 'q', 'rp', 'rt', 'ruby', 's', 'samp', 'small', 'span',
  'strong', 'sub', 'sup', 'time', 'u', 'var', 'wbr', 'img', 'font', 'tt',
  'big', 'label', 'ins', 'del',
]);
const RAW = new Set(['pre', 'textarea', 'script', 'style']);
const VOID = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta',
  'param', 'source', 'track', 'wbr',
]);

interface ElNode {
  type: 'el';
  name: string;
  open: string;
  children: Node[];
}
interface RawNode {
  type: 'raw';
  open: string;
  inner: string;
  close: string;
}
interface TextNode {
  type: 'text';
  text: string;
}
interface VoidNode {
  type: 'void';
  text: string;
}
interface CommentNode {
  type: 'comment';
  text: string;
}
type Node = ElNode | RawNode | TextNode | VoidNode | CommentNode;

const TAG = /<!--[\s\S]*?-->|<[^>]+>|[^<]+/g;

function tagName(tag: string): string {
  const m = /^<\/?\s*([a-zA-Z0-9:-]+)/.exec(tag);
  return m ? m[1].toLowerCase() : '';
}

function parse(html: string): Node[] {
  const tokens = html.match(TAG) ?? [];
  const root: Node[] = [];
  const stack: ElNode[] = [];
  const top = () => (stack.length ? stack[stack.length - 1].children : root);

  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];
    if (tok.startsWith('<!--')) {
      top().push({ type: 'comment', text: tok });
      continue;
    }
    if (!tok.startsWith('<')) {
      top().push({ type: 'text', text: tok });
      continue;
    }
    if (tok.startsWith('</')) {
      const name = tagName(tok);
      for (let s = stack.length - 1; s >= 0; s--) {
        if (stack[s].name === name) {
          stack.length = s;
          break;
        }
      }
      continue;
    }

    const name = tagName(tok);
    const selfClosing = tok.endsWith('/>') || VOID.has(name);
    if (selfClosing) {
      top().push({ type: 'void', text: tok });
      continue;
    }
    if (RAW.has(name)) {
      let inner = '';
      let close = `</${name}>`;
      let j = i + 1;
      for (; j < tokens.length; j++) {
        if (tokens[j].startsWith('</') && tagName(tokens[j]) === name) {
          close = tokens[j];
          break;
        }
        inner += tokens[j];
      }
      top().push({ type: 'raw', open: tok, inner, close });
      i = j;
      continue;
    }

    const node: ElNode = { type: 'el', name, open: tok, children: [] };
    top().push(node);
    stack.push(node);
  }
  return root;
}

function isInlineNode(n: Node): boolean {
  if (n.type === 'text') return true;
  if (n.type === 'void') return INLINE.has(tagName(n.text));
  if (n.type === 'raw') return false;
  if (n.type === 'comment') return true;
  return INLINE.has(n.name);
}

function serializeInline(nodes: Node[]): string {
  let out = '';
  for (const n of nodes) {
    if (n.type === 'text' || n.type === 'void' || n.type === 'comment') out += n.text;
    else if (n.type === 'raw') out += n.open + n.inner + n.close;
    else out += n.open + serializeInline(n.children) + `</${n.name}>`;
  }
  return out;
}

function serialize(nodes: Node[], depth: number, out: string[]): void {
  const pad = '  '.repeat(depth);
  for (const n of nodes) {
    if (n.type === 'text') {
      const t = n.text.trim();
      if (t) out.push(pad + t);
    } else if (n.type === 'comment' || n.type === 'void') {
      out.push(pad + n.text);
    } else if (n.type === 'raw') {
      out.push(pad + n.open + n.inner + n.close);
    } else {
      const allInline = n.children.every(isInlineNode);
      if (n.children.length === 0) {
        out.push(pad + n.open + `</${n.name}>`);
      } else if (allInline) {
        out.push(pad + n.open + serializeInline(n.children) + `</${n.name}>`);
      } else {
        out.push(pad + n.open);
        serialize(n.children, depth + 1, out);
        out.push(pad + `</${n.name}>`);
      }
    }
  }
}

export function formatHtml(html: string): string {
  const lines: string[] = [];
  serialize(parse(html), 0, lines);
  return lines.join('\n');
}
