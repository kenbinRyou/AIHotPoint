import { useEffect, useState } from 'react';

// 本机收藏：localStorage 快照存储（对齐目标站 /starred，仅保存在当前浏览器）
const KEY = 'aihot-stars';
const EVT = 'aihot-stars-change';

export function listStars() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || [];
  } catch {
    return [];
  }
}

function saveStars(list) {
  localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new CustomEvent(EVT));
}

export function isStarred(id) {
  return listStars().some((s) => s.id === id);
}

export function toggleStar(item) {
  if (!item?.id) return;
  const list = listStars();
  const idx = list.findIndex((s) => s.id === item.id);
  if (idx >= 0) {
    list.splice(idx, 1);
  } else {
    list.unshift({
      id: item.id,
      title: item.title,
      source: item.source,
      url: item.url,
      author: item.author || null,
      fetched_at: item.fetched_at,
      ai_score: item.ai_score ?? null,
      ai_importance: item.ai_importance || null,
      ai_category: item.ai_category || null,
      ai_summary: item.ai_summary || null,
      starredAt: Date.now(),
    });
  }
  saveStars(list);
}

/** 订阅收藏列表变化 */
export function useStars() {
  const [list, setList] = useState(listStars);
  useEffect(() => {
    const h = () => setList(listStars());
    window.addEventListener(EVT, h);
    return () => window.removeEventListener(EVT, h);
  }, []);
  return list;
}
