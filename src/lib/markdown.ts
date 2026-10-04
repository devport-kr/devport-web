import type { Options } from 'react-markdown';
import remarkGfm from 'remark-gfm';

// GFM adds tables, task lists and ~~strikethrough~~. Single "~" stays literal:
// Korean text uses it for ranges ("3~5초, 10~20%"), which GFM's default
// single-tilde strikethrough would turn into struck-out text.
export const remarkPlugins: Options['remarkPlugins'] = [[remarkGfm, { singleTilde: false }]];
