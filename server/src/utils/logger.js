// utils/logger.js
// 极简日志
const ts = () => new Date().toISOString().replace('T', ' ').slice(0, 19);

function fmt(level, tag, msg, extra) {
  const tagStr = tag ? `[${tag}]` : '';
  const extraStr = extra ? ` ${JSON.stringify(extra)}` : '';
  return `${ts()} ${level.toUpperCase()} ${tagStr} ${msg}${extraStr}`;
}

export const logger = {
  info: (msg, tag, extra) => console.log(fmt('info', tag, msg, extra)),
  warn: (msg, tag, extra) => console.warn(fmt('warn', tag, msg, extra)),
  error: (msg, tag, extra) => console.error(fmt('error', tag, msg, extra)),
  debug: (msg, tag, extra) => {
    if (process.env.DEBUG) console.log(fmt('debug', tag, msg, extra));
  },
};
