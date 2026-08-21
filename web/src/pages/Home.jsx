import FeedPage from '../components/FeedPage.jsx';

/** 精选页：AI 筛选的今日重点（默认 24h + AI 评分排序） */
export default function Home() {
  return <FeedPage mode="featured" />;
}
