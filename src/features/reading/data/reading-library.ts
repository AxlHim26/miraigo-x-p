import type { ReadingArticle, ReadingOption, ReadingWord, StudyLevel } from '@/features/reading/data/reading-schema';

const options = ['A', 'B', 'C', 'D'] as const;

type Question = {
  prompt: string;
  answers: [string, string, string, string];
  correct: ReadingOption;
  vi: string;
  ja: string;
};

const word = (term: string, reading: string, meaningVi: string): ReadingWord => ({ term, reading, meaningVi });

function article(id: string, level: StudyLevel, title: string, topic: string, minutes: number, passageLines: string[],
  vocabulary: ReadingWord[], questions: Question[]): ReadingArticle {
  return {
    id, title, level, topic, minutes, passageLines, vocabulary, source: 'library',
    questions: questions.map(({ prompt, answers, correct, vi, ja }, index) => ({
      id: `q-${index + 1}`, question: prompt,
      options: answers.map((text, option) => ({ id: options[option], text })),
      correctOptionId: correct, explanationVi: vi, explanationJa: ja,
    })),
  };
}

export const readingLibrary = [
  article('n5-hajimemashite', 'N5', '01. はじめまして', 'Giới thiệu bản thân', 3, [
    'はじめまして。わたしはリンです。ベトナムのハノイから来ました。',
    '今は大阪に住んでいます。日本語の学校で毎日勉強しています。',
    '趣味は写真を撮ることです。日曜日は友だちと町へ写真を撮りに行きます。',
  ], [
    word('大阪', 'おおさか', 'Osaka'), word('日本語', 'にほんご', 'Tiếng Nhật'), word('毎日', 'まいにち', 'Mỗi ngày'),
    word('趣味', 'しゅみ', 'Sở thích'), word('写真', 'しゃしん', 'Ảnh'), word('日曜日', 'にちようび', 'Chủ nhật'),
  ], [
    { prompt: 'リンさんはどこから来ましたか。', answers: ['大阪', 'ハノイ', '東京', '京都'], correct: 'B', vi: 'Lin đến từ Hà Nội, Việt Nam. Osaka là nơi Lin đang sống.', ja: 'リンさんはベトナムのハノイから来ました。' },
    { prompt: 'リンさんは今どこに住んでいますか。', answers: ['ハノイ', '京都', '大阪', '東京'], correct: 'C', vi: 'Câu 「今は大阪に住んでいます」 cho biết Lin hiện sống ở Osaka.', ja: '本文に「今は大阪に住んでいます」とあります。' },
    { prompt: 'リンさんの趣味は何ですか。', answers: ['写真を撮ること', '本を読むこと', '映画を見ること', '料理をすること'], correct: 'A', vi: 'Lin nói sở thích của mình là chụp ảnh.', ja: '趣味は写真を撮ることです。' },
    { prompt: '日曜日はだれと町へ行きますか。', answers: ['先生', '家族', '一人で', '友だち'], correct: 'D', vi: 'Chủ nhật Lin đi vào phố cùng bạn để chụp ảnh.', ja: '日曜日は友だちと町へ行きます。' },
  ]),
  article('n5-kyujitsu', 'N5', '02. 休日の過ごし方', 'Cuộc sống hằng ngày', 4, [
    'わたしは休日に家でゆっくり過ごすことが好きです。',
    '朝はよく本を読みます。ときどき、近くの公園を散歩します。',
    '天気がいい日は、友だちとカフェでコーヒーを飲みます。',
    '雨の日は出かけません。家で晩ご飯を作ります。',
  ], [
    word('休日', 'きゅうじつ', 'Ngày nghỉ'), word('過ごす', 'すごす', 'Dành thời gian, trải qua'),
    word('本', 'ほん', 'Sách'), word('公園', 'こうえん', 'Công viên'),
    word('散歩', 'さんぽ', 'Đi dạo'), word('晩ご飯', 'ばんごはん', 'Bữa tối'),
  ], [
    { prompt: '「わたし」は休日に何をすることが好きですか。', answers: ['家でゆっくり過ごす', '遠くへ旅行する', '朝早く仕事へ行く', '学校で勉強する'], correct: 'A', vi: 'Câu đầu nói người kể thích thong thả ở nhà vào ngày nghỉ.', ja: '最初の文に「家でゆっくり過ごすことが好き」とあります。' },
    { prompt: '朝はよく何をしますか。', answers: ['テレビを見る', '本を読む', '友だちに会う', 'コーヒーを買う'], correct: 'B', vi: '「朝はよく本を読みます」 nghĩa là buổi sáng thường đọc sách.', ja: '朝は「よく本を読みます」と書いてあります。' },
    { prompt: '天気がいい日は、どこでコーヒーを飲みますか。', answers: ['家', '学校', '公園', 'カフェ'], correct: 'D', vi: 'Khi trời đẹp, người kể uống cà phê cùng bạn ở quán cà phê.', ja: '友だちとカフェでコーヒーを飲みます。' },
    { prompt: '雨の日はどうしますか。', answers: ['公園を散歩する', 'カフェへ行く', '家で晩ご飯を作る', '町で本を買う'], correct: 'C', vi: 'Ngày mưa người kể không ra ngoài, ở nhà nấu bữa tối.', ja: '雨の日は出かけません。家で晩ご飯を作ります。' },
  ]),
  article('n5-kazoku', 'N5', '03. 私の家族', 'Gia đình', 4, [
    'わたしの家族は四人です。父と母と妹とわたしです。',
    '父は病院で働いています。母は家の近くの店で働いています。',
    '妹は高校の生徒です。妹は音楽が好きで、毎晩ピアノを弾きます。',
    '土曜日の夜は、みんなで晩ご飯を作って食べます。',
  ], [
    word('家族', 'かぞく', 'Gia đình'), word('妹', 'いもうと', 'Em gái'), word('病院', 'びょういん', 'Bệnh viện'),
    word('高校', 'こうこう', 'Trường cấp ba'), word('毎晩', 'まいばん', 'Mỗi tối'), word('土曜日', 'どようび', 'Thứ Bảy'),
  ], [
    { prompt: '家族は何人ですか。', answers: ['二人', '三人', '四人', '五人'], correct: 'C', vi: 'Gia đình gồm bố, mẹ, em gái và người kể, tổng cộng bốn người.', ja: '父と母と妹と「わたし」の四人です。' },
    { prompt: '父はどこで働いていますか。', answers: ['病院', '店', '学校', '駅'], correct: 'A', vi: 'Bố làm việc ở bệnh viện. Mẹ làm ở cửa hàng.', ja: '父は病院で働いています。' },
    { prompt: '妹は毎晩何をしますか。', answers: ['料理をする', '本を読む', '走る', 'ピアノを弾く'], correct: 'D', vi: 'Em gái chơi piano mỗi tối.', ja: '妹は毎晩ピアノを弾きます。' },
    { prompt: '土曜日の夜はみんなで何をしますか。', answers: ['買い物をする', '晩ご飯を作って食べる', '学校へ行く', '映画を見る'], correct: 'B', vi: 'Tối thứ Bảy cả nhà cùng nấu và ăn tối.', ja: '土曜日の夜はみんなで晩ご飯を作って食べます。' },
  ]),
  article('n5-gakko', 'N5', '04. 学校の生活', 'Trường học', 5, [
    'わたしは毎朝七時に起きます。八時にバスで学校へ行きます。',
    '授業は九時からです。午前は日本語を勉強します。',
    '昼は友だちと食堂でご飯を食べます。午後は図書館で本を読みます。',
    '金曜日は授業のあと、友だちとサッカーをします。',
  ], [
    word('毎朝', 'まいあさ', 'Mỗi sáng'), word('授業', 'じゅぎょう', 'Tiết học'), word('午前', 'ごぜん', 'Buổi sáng'),
    word('食堂', 'しょくどう', 'Nhà ăn'), word('図書館', 'としょかん', 'Thư viện'), word('金曜日', 'きんようび', 'Thứ Sáu'),
  ], [
    { prompt: 'どうやって学校へ行きますか。', answers: ['電車で', 'バスで', '自転車で', '歩いて'], correct: 'B', vi: 'Người kể đi học bằng xe buýt lúc tám giờ.', ja: '八時にバスで学校へ行きます。' },
    { prompt: '授業は何時からですか。', answers: ['七時', '八時', '九時', '十時'], correct: 'C', vi: 'Giờ học bắt đầu lúc chín giờ.', ja: '授業は九時からです。' },
    { prompt: '昼はどこでご飯を食べますか。', answers: ['教室', '家', '公園', '食堂'], correct: 'D', vi: 'Buổi trưa người kể ăn cùng bạn ở nhà ăn.', ja: '昼は友だちと食堂でご飯を食べます。' },
    { prompt: '金曜日の授業のあと、何をしますか。', answers: ['サッカーをする', '本を買う', 'バスに乗る', '昼ご飯を作る'], correct: 'A', vi: 'Sau giờ học thứ Sáu, người kể đá bóng cùng bạn.', ja: '金曜日は授業のあと、友だちとサッカーをします。' },
  ]),
  article('n5-tabemono', 'N5', '05. 好きな食べ物', 'Cuộc sống hằng ngày', 3, [
    'わたしはカレーが好きです。日曜日によく家で作ります。',
    '材料はじゃがいもとにんじんと肉です。母は肉を食べません。',
    '母のカレーには肉を入れません。野菜をたくさん入れます。',
    'できたカレーを家族といっしょに食べます。',
  ], [
    word('材料', 'ざいりょう', 'Nguyên liệu'), word('肉', 'にく', 'Thịt'), word('野菜', 'やさい', 'Rau củ'),
    word('日曜日', 'にちようび', 'Chủ nhật'), word('家族', 'かぞく', 'Gia đình'),
  ], [
    { prompt: '「わたし」は何の食べ物が好きですか。', answers: ['カレー', 'すし', 'ラーメン', 'うどん'], correct: 'A', vi: 'Người kể nói ngay đầu bài rằng mình thích cà ri.', ja: '最初の文に「カレーが好きです」とあります。' },
    { prompt: 'いつよくカレーを作りますか。', answers: ['月曜日', '金曜日', '土曜日', '日曜日'], correct: 'D', vi: 'Người kể thường nấu cà ri vào Chủ nhật.', ja: '日曜日によく家で作ります。' },
    { prompt: '母のカレーに入れないものは何ですか。', answers: ['にんじん', '肉', '野菜', 'じゃがいも'], correct: 'B', vi: 'Mẹ không ăn thịt, nên phần cà ri của mẹ không có thịt.', ja: '母は肉を食べないので、母のカレーに肉を入れません。' },
    { prompt: 'カレーはだれと食べますか。', answers: ['先生', '友だち', '家族', '一人で'], correct: 'C', vi: 'Người kể ăn cà ri đã nấu cùng gia đình.', ja: '家族といっしょに食べます。' },
  ]),
  article('n4-ryoko', 'N4', '01. 雨の日の旅行', 'Du lịch', 5, [
    '先週の土曜日、友人と奈良へ行く予定でした。公園で写真を撮るつもりでしたが、朝から雨が降っていました。',
    '友人が「駅の近くに博物館があるよ」と教えてくれました。予定を変えて、バスで博物館へ行くことにしました。',
    '博物館では昔の道具を見たり、説明を聞いたりしました。昼ごろ雨が止んだので、帰る前に公園にも寄りました。',
    '最初の予定とは違いましたが、一日を楽しく過ごせました。',
  ], [
    word('予定', 'よてい', 'Kế hoạch'), word('博物館', 'はくぶつかん', 'Bảo tàng'),
    word('道具', 'どうぐ', 'Dụng cụ'), word('説明', 'せつめい', 'Giải thích'), word('昼ごろ', 'ひるごろ', 'Khoảng giữa trưa'),
  ], [
    { prompt: '最初は公園で何をする予定でしたか。', answers: ['お弁当を食べる', '写真を撮る', '走る', '友人を待つ'], correct: 'B', vi: 'Kế hoạch ban đầu là chụp ảnh ở công viên.', ja: '公園で写真を撮るつもりでした。' },
    { prompt: 'なぜ最初の予定を変えましたか。', answers: ['友人が来なかったから', '電車が遅れたから', '公園が休みだったから', '朝から雨が降っていたから'], correct: 'D', vi: 'Họ thay đổi lịch trình vì trời mưa từ sáng.', ja: '朝から雨が降っていたため、予定を変えました。' },
    { prompt: '博物館へどうやって行きましたか。', answers: ['バスで', '電車で', '自転車で', '歩いて'], correct: 'A', vi: 'Sau khi đổi kế hoạch, họ đi bảo tàng bằng xe buýt.', ja: 'バスで博物館へ行きました。' },
    { prompt: '雨が止んだあと、何をしましたか。', answers: ['駅へ直接行った', 'すぐ家へ帰った', '帰る前に公園へ寄った', '博物館の説明を聞いた'], correct: 'C', vi: 'Trưa tạnh mưa, họ ghé công viên trước khi về.', ja: '雨が止んだので、帰る前に公園にも寄りました。' },
  ]),
  article('n3-toshokan', 'N3', '01. 図書館の新しい取り組み', 'Cuộc sống hằng ngày', 6, [
    '町の図書館では、利用者が減っていたため、先月から閉館時間を週に二日だけ遅くすることにした。',
    'これまでは仕事や学校が終わってから立ち寄りにくいという声が多かった。しかし、毎日開館時間を延ばすには人手が足りない。',
    'そこで、水曜日と金曜日だけ夜八時まで開け、まず三か月間試すことになった。',
    '初月は夕方以降の利用者が増えた一方で、昼間の利用者数には大きな変化がなかった。',
    '図書館は今後、利用者の意見も調べたうえで、この取り組みを続けるかどうか決めるという。',
  ], [
    word('利用者', 'りようしゃ', 'Người sử dụng'), word('閉館', 'へいかん', 'Đóng cửa'),
    word('人手', 'ひとで', 'Nhân lực'), word('意見', 'いけん', 'Ý kiến'), word('取り組み', 'とりくみ', 'Biện pháp, sáng kiến'),
  ], [
    { prompt: '図書館が閉館時間を見直した主な理由は何ですか。', answers: ['本の数が減ったから', '図書館が移転するから', '利用者が減っていたから', '昼の利用者が増えすぎたから'], correct: 'C', vi: 'Đầu bài nêu lý do chính là số người sử dụng thư viện giảm.', ja: '本文の冒頭に「利用者が減っていたため」とあります。' },
    { prompt: 'なぜ毎日夜八時まで開けないのですか。', answers: ['人手が足りないから', '建物が古いから', '本が足りないから', '夜は誰も来ないから'], correct: 'A', vi: 'Thư viện thiếu nhân lực để kéo dài giờ mở cửa mỗi ngày.', ja: '毎日開館時間を延ばすには人手が足りないからです。' },
    { prompt: '初月にどのような変化がありましたか。', answers: ['昼の利用者だけ増えた', '夕方の利用者が減った', '時間帯による変化はなかった', '夕方以降の利用者が増えた'], correct: 'D', vi: 'Trong tháng đầu, số người đến sau chiều tăng. Buổi trưa không có thay đổi lớn.', ja: '夕方以降の利用者が増え、昼間は大きく変わりませんでした。' },
    { prompt: '今後、図書館は何をしてから続けるか決めますか。', answers: ['新しい建物を建てる', '利用者の意見を調べる', '仕事の時間を減らす', '昼間の開館をやめる'], correct: 'B', vi: 'Thư viện sẽ khảo sát ý kiến người sử dụng trước khi quyết định tiếp tục.', ja: '利用者の意見も調べたうえで決めます。' },
  ]),
] as const;
