import { studySymbol } from '@/components/ui/study-icon';

export const aiIcons = {
  phone: studySymbol('phone.fill', 'call'),
  end: studySymbol('phone.down.fill', 'call_end'),
  translate: studySymbol('character.bubble', 'translate'),
  more: studySymbol('ellipsis', 'more_horiz'),
  chat: studySymbol('bubble.left.and.bubble.right', 'forum'),
  person: studySymbol('person', 'person'),
  shop: studySymbol('storefront', 'storefront'),
  location: studySymbol('location.circle', 'location_on'),
  hobby: studySymbol('heart', 'favorite_border'),
  food: studySymbol('fork.knife', 'restaurant'),
  calendar: studySymbol('calendar', 'calendar_month'),
  history: studySymbol('clock.arrow.circlepath', 'history'),
  settings: studySymbol('slider.horizontal.3', 'tune'),
  add: studySymbol('plus', 'add'),
  send: studySymbol('arrow.up', 'arrow_upward'),
  listen: studySymbol('speaker.wave.2', 'volume_up'),
  edit: studySymbol('text.badge.checkmark', 'spellcheck'),
  play: studySymbol('play.fill', 'play_arrow'),
  mic: studySymbol('mic.fill', 'mic'),
  pause: studySymbol('pause.fill', 'pause'),
  stop: studySymbol('stop.fill', 'stop'),
  check: studySymbol('checkmark.circle.fill', 'check_circle'),
  waveform: studySymbol('waveform', 'graphic_eq'),
};
export const aiLevels = ['N5', 'N4', 'N3', 'N2', 'N1'] as const;
export const scenarioIds = ['intro', 'shop', 'direction', 'restaurant'] as const;
export const favoriteTopics = ['Hội thoại hằng ngày', 'Du lịch', 'Mua sắm', 'Công việc', 'Sở thích', 'Văn hóa'] as const;
export type AiLevel = typeof aiLevels[number];
export type ScenarioId = typeof scenarioIds[number];

export type AiLine = { japanese: string; vietnamese: string };
type Scenario = {
  id: ScenarioId; title: string; description: string; icon: typeof aiIcons.shop; level: AiLevel; duration: string;
  objectives: string[]; role: string; opening: AiLine; rounds: { answer: string; reply: AiLine }[];
};

export const scenarios = [
  {
    id: 'intro', title: 'Giới thiệu bản thân', description: 'Chào hỏi, nói tên, quê quán và công việc bằng tiếng Nhật.',
    icon: aiIcons.person, level: 'N5', duration: '3–5 phút', role: 'Người bạn mới',
    objectives: ['Chào hỏi khi lần đầu gặp', 'Nói tên và quê quán', 'Hỏi về công việc'],
    opening: { japanese: 'こんにちは！\n初(はじ)めまして。\nまず、自己紹介(じこしょうかい)をしてもらえますか？', vietnamese: 'Xin chào! Rất vui được gặp bạn. Bạn có thể giới thiệu bản thân được không?' },
    rounds: [
      { answer: 'はじめまして。わたしはグエンです。', reply: { japanese: 'グエンさん、よろしくお願(ねが)いします。どこから来(き)ましたか？', vietnamese: 'Rất vui được gặp bạn, Nguyễn. Bạn đến từ đâu?' } },
      { answer: 'ベトナムから来ました。', reply: { japanese: 'そうですか。お仕事(しごと)は何(なん)ですか？', vietnamese: 'Vậy à. Bạn làm công việc gì?' } },
      { answer: '大学生です。', reply: { japanese: 'ありがとうございます。お会(あ)いできてうれしいです。', vietnamese: 'Cảm ơn bạn. Rất vui được gặp bạn.' } },
    ],
  },
  {
    id: 'shop', title: 'Ở cửa hàng tiện lợi', description: 'Luyện mua đồ, hỏi giá và thanh toán tại cửa hàng tiện lợi.',
    icon: aiIcons.shop, level: 'N5', duration: '5 phút', role: 'Nhân viên',
    objectives: ['Hỏi và nói về sản phẩm', 'Hỏi giá', 'Thanh toán'],
    opening: { japanese: 'いらっしゃいませ。\n何(なに)をお探(さが)しですか？', vietnamese: 'Xin chào. Bạn đang tìm gì ạ?' },
    rounds: [
      { answer: 'これはいくらですか？', reply: { japanese: 'こちらは三百円(さんびゃくえん)です。', vietnamese: 'Món này giá 300 yên.' } },
      { answer: 'これを一つください。', reply: { japanese: 'かしこまりました。お支払(しはら)いはどうしますか？', vietnamese: 'Dạ được. Bạn muốn thanh toán thế nào?' } },
      { answer: 'カードでお願いします。', reply: { japanese: 'ありがとうございます。またお越(こ)しください。', vietnamese: 'Cảm ơn bạn. Hẹn gặp lại!' } },
    ],
  },
  {
    id: 'direction', title: 'Hỏi đường', description: 'Hỏi đường tới nhà ga và xác nhận các chỉ dẫn.',
    icon: aiIcons.location, level: 'N4', duration: '5 phút', role: 'Người qua đường',
    objectives: ['Xin chỉ đường', 'Xác nhận hướng đi', 'Cảm ơn'],
    opening: { japanese: 'こんにちは。何(なに)かお困(こま)りですか？', vietnamese: 'Xin chào. Bạn có cần giúp gì không?' },
    rounds: [
      { answer: 'すみません。駅はどこですか？', reply: { japanese: 'まっすぐ行(い)って、二(ふた)つ目(め)の角(かど)を右(みぎ)に曲(ま)がってください。', vietnamese: 'Đi thẳng rồi rẽ phải ở góc thứ hai nhé.' } },
      { answer: '歩いてどのくらいかかりますか？', reply: { japanese: '歩(ある)いて五分(ごふん)ぐらいです。', vietnamese: 'Đi bộ khoảng năm phút.' } },
      { answer: '分かりました。ありがとうございます。', reply: { japanese: 'どういたしまして。お気(き)をつけて。', vietnamese: 'Không có gì. Bạn đi cẩn thận nhé.' } },
    ],
  },
  {
    id: 'restaurant', title: 'Đặt món tại nhà hàng', description: 'Hỏi món được đề xuất, gọi món và xin hóa đơn.',
    icon: aiIcons.food, level: 'N4', duration: '5–7 phút', role: 'Nhân viên phục vụ',
    objectives: ['Hỏi món đề xuất', 'Gọi món', 'Xin hóa đơn'],
    opening: { japanese: 'いらっしゃいませ。ご注文(ちゅうもん)はお決(き)まりですか？', vietnamese: 'Xin chào. Bạn đã chọn món chưa ạ?' },
    rounds: [
      { answer: 'おすすめは何ですか？', reply: { japanese: '今日(きょう)はラーメンがおすすめです。', vietnamese: 'Hôm nay chúng tôi đề xuất món ramen.' } },
      { answer: 'では、ラーメンを一つください。', reply: { japanese: 'かしこまりました。少々(しょうしょう)お待(ま)ちください。', vietnamese: 'Dạ được. Xin bạn chờ một chút.' } },
      { answer: 'お会計をお願いします。', reply: { japanese: 'はい、ありがとうございます。', vietnamese: 'Vâng, xin cảm ơn.' } },
    ],
  },
] satisfies Scenario[];
export type AiScenario = typeof scenarios[number];

export const chatTopics = [
  ...scenarios.slice(0, 3).map(({ id, title, icon, level, opening }) => ({ id, title, icon, level, opening })),
  { id: 'hobby', title: 'Sở thích', icon: aiIcons.hobby, level: 'N5' as const,
    opening: { japanese: '趣味(しゅみ)は何(なん)ですか？', vietnamese: 'Sở thích của bạn là gì?' } },
  { id: 'weekend', title: 'Kế hoạch cuối tuần', icon: aiIcons.calendar, level: 'N4' as const,
    opening: { japanese: '週末(しゅうまつ)は何(なに)をしますか？', vietnamese: 'Cuối tuần bạn định làm gì?' } },
];
export type ChatTopic = typeof chatTopics[number];
