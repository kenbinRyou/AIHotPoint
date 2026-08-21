import FeedPage from '../components/FeedPage.jsx';

/** 全部动态页：全量信息流（默认全部时间 + 最新发现排序） */
export default function All() {
  return <FeedPage mode="all" />;
}
