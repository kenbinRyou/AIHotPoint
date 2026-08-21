import { useState } from 'react';
import { Send, CheckCircle2 } from 'lucide-react';
import { api } from '../api.js';

export default function Feedback() {
  const [text, setText] = useState('');
  const [contact, setContact] = useState('');
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setLoading(true);
    setErr('');
    try {
      await api.submitFeedback({ text: text.trim(), contact: contact.trim() });
      setSent(true);
      setText('');
      setContact('');
    } catch {
      setErr('提交失败，请稍后重试，或直接发邮件到 feedback@aihotpoint.dev');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[720px] mx-auto px-4 sm:px-6 pt-6 pb-10">
      <h1 className="text-[26px] font-bold tracking-tight">反馈 / 想法</h1>
      <div className="mt-1.5 text-[13px] text-ink-500">
        你的建议会直接帮助我们把产品做得更好
      </div>

      {sent ? (
        <div className="mt-6 card p-6 flex items-center gap-3 text-ink-900">
          <CheckCircle2 className="w-6 h-6 text-teal-600 shrink-0" />
          <div>
            <div className="font-semibold">已收到，谢谢你！</div>
            <div className="text-[13px] text-ink-500">我们会认真阅读每一条反馈。</div>
          </div>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-6 card p-5 space-y-4">
          <div>
            <label className="block text-[13px] font-medium text-ink-900 mb-1.5">
              想说点什么 <span className="text-[#d86a52]">*</span>
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={5}
              required
              placeholder="报告问题、提个功能点子，或随便聊聊…"
              className="input w-full resize-none"
            />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-ink-900 mb-1.5">
              联系方式（选填）
            </label>
            <input
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="邮箱 / 微信，方便我们回访"
              className="input w-full"
            />
          </div>
          {err && <div className="text-[12.5px] text-[#d86a52]">{err}</div>}
          <button type="submit" className="btn-primary" disabled={loading || !text.trim()}>
            {loading ? <Send className="w-4 h-4 animate-pulse" /> : <Send className="w-4 h-4" />}
            提交反馈
          </button>
        </form>
      )}
    </div>
  );
}
