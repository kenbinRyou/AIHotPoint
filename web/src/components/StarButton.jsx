import { useState } from 'react';
import { Star } from 'lucide-react';
import { isStarred, toggleStar } from '../store.js';

/** 收藏星标按钮：本机 localStorage 存储 */
export default function StarButton({ item, size = 15, className = '', title }) {
  const [on, setOn] = useState(() => item?.id && isStarred(item.id));

  if (!item?.id) return null;

  const click = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleStar(item);
    setOn((v) => !v);
  };

  return (
    <button
      onClick={click}
      title={title || (on ? '取消收藏' : '收藏')}
      aria-label={on ? '取消收藏' : '收藏'}
      aria-pressed={!!on}
      className={`star-btn ${on ? 'star-btn-on' : ''} ${className}`}
    >
      <Star size={size} fill={on ? 'currentColor' : 'none'} strokeWidth={2} />
    </button>
  );
}
